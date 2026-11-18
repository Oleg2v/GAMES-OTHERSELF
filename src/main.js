import './style.css';
import './controls.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/cyrillic-600.css';
import '@fontsource/unbounded/latin-500.css';
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-600.css';
import { createGame, step, action, possess, jump, toggleCrouch, useThrowable, getThrowableInfo, getHeight, getTraversal, getTarget, getTargetInfo, getInteraction, serialize, restore, retry, ROOMS, isHidden } from './engine.js';
import { t, languages } from './i18n.js';
import { createAudio } from './audio.js';
import { createJoystick } from './joystick.js';
import { controlIcon } from './control-icons.js';

const SAVE='otherself.save.v1', PREFS='otherself.preferences.v1';
let mountCount=0;
const read = key => {try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={play:'↗',pause:controlIcon('pause'),sound:'◖))',mute:'◖×',settings:'☷',close:'×',action:'✧',possess:'◎'};

export async function mount(container) {
  const abort=new AbortController(), signal=abort.signal;
  const preferences={lang:'ru',music:.35,effects:.65,muted:false,quality:'high',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,...read(PREFS)};
  const urlLang=new URLSearchParams(location.search).get('lang');
  if(['ru','en','he'].includes(urlLang)) preferences.lang=urlLang;
  if(!['ru','en','he'].includes(preferences.lang))preferences.lang='ru';
  let game=createGame(), scene, audio=createAudio(), mode='loading', modal=null, lastFocus=null, frame=0, previous=0, accumulator=0, saveClock=0, toastClock=0, toastKey='', destroyed=false;
  let endingTime=null, pausedFrom='game';
  let saved=read(SAVE), loadError=false, lastRoom=0, lastPhase='playing', hudFingerprint='', input={left:false,right:false,up:false,down:false};
  const heldKeys=new Set(),touchCommands=new WeakMap(),pressedActions=new Map(),feedbackUntil=new Map();
  const stickHintId=`otherself-stick-help-${++mountCount}`;
  let joystick=null,stickAxes={move:0,climb:0};
  const directionByCode={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down'};
  function syncInput(){for(const direction of Object.keys(input))input[direction]=[...heldKeys].some(code=>directionByCode[code]===direction);}
  function resetInput(){joystick?.reset();heldKeys.clear();syncInput();for(const button of pressedActions.values())delete button.dataset.pressed;pressedActions.clear();for(const button of feedbackUntil.keys())delete button.dataset.feedback;feedbackUntil.clear();}
  const tr=(key,params)=>t(preferences.lang,key,params);
  container.classList.add('otherself');
  container.dataset.input=matchMedia('(pointer: coarse)').matches?'touch':'keyboard';
  container.innerHTML='<div class="world" aria-hidden="true"></div><div class="vignette"></div><div class="interface"></div><div class="dialog-layer"></div><div class="toast" role="status" aria-live="polite"></div>';
  const world=container.querySelector('.world'),ui=container.querySelector('.interface'),dialogs=container.querySelector('.dialog-layer'),toast=container.querySelector('.toast');
  const viewportObserver=new ResizeObserver(()=>{joystick?.reset();scene?.resize();});viewportObserver.observe(world);
  const button=(key,command,cls='',icon='')=>`<button type="button" class="${cls}" data-command="${command}">${icon?`<span aria-hidden="true">${icon}</span>`:''}<span>${esc(tr(key))}</span></button>`;
  const padButton=(label,fullLabel,command,cls,icon)=>`<button type="button" class="action-button ${cls}" data-command="${command}" aria-label="${esc(tr(fullLabel))}"><span aria-hidden="true">${controlIcon(icon)}</span><span>${esc(tr(label))}</span></button>`;
  const languageSelect=()=>`<label class="language"><span class="sr-only">${esc(tr('language'))}</span><select data-pref="lang" aria-label="${esc(tr('language'))}">${languages.map(l=>`<option value="${l.code}" ${l.code===preferences.lang?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label>`;
  const logo=()=>'<a class="wordmark" href="#" data-command="home" aria-label="Kikkey Games">kikkey<span class="brand-square">↗</span><small>GAMES</small></a>';
  function savePrefs(){try{localStorage.setItem(PREFS,JSON.stringify(preferences));}catch{notify('saveError');}}
  function save(){if(!['game','paused'].includes(mode)||game.phase!=='playing')return;try{const value=serialize(game);localStorage.setItem(SAVE,typeof value==='string'?value:JSON.stringify(value));saved=read(SAVE);}catch{notify('saveError');}}
  function notify(key){toastKey=key;toast.textContent=tr(key);toast.classList.add('visible');toastClock=4;}
  function render(){
    // The joystick captures on the persistent host, so both thumbs and physical
    // keys remain usable through a room render until their release or a pause.
    container.lang=preferences.lang;container.dir=preferences.lang==='he'?'rtl':'ltr';
    container.dataset.mode=mode;scene?.setMenuMode?.(mode==='menu'||mode==='loading');
    if(mode==='loading'||mode==='error'){
      ui.innerHTML=`<header>${logo()}${languageSelect()}</header><section class="load-card"><div class="orbit-mark">◎</div><p class="eyebrow">OTHERSELF</p><h1>${esc(tr(mode==='error'?'error':'loading'))}</h1>${mode==='error'?`<p>${esc(tr(loadError?'error':'contextLost'))}</p>${button('retryLoading','reload','primary','↻')}${button('exit','home','quiet')}`:'<div class="load-line"><span></span></div>'}</section>`;
    }else if(mode==='menu'){
      ui.innerHTML=`<header>${logo()}<div class="header-right"><span class="edition">${esc(tr('episode'))}</span>${languageSelect()}${button(preferences.muted?'mute':'sound','mute','icon-button',preferences.muted?icons.mute:icons.sound)}</div></header>
      <main class="landing"><div class="landing-copy"><div class="eyebrow"><i></i>${esc(tr('tagline'))}</div><h1 dir="ltr">OTHER<span>SELF</span><sup>01</sup></h1><p class="local-title">${esc(tr('title'))}</p><p class="intro">${esc(tr('intro'))}</p><div class="start-row">${button(saved?'continue':'begin',saved?'continue':'start','primary',icons.play)}<span class="start-note">${esc(tr('v2Badge'))}<bdi class="release-version">v2.2</bdi></span></div><div class="menu-secondary">${saved?button('newGame','new','text-button'):''}${button('help','help','text-button')}${button('settings','settings','text-button')}</div></div>
      <div class="scene-caption"><span class="caption-line"></span><span><b>01 / 04</b>${esc(tr('room0'))}</span><span class="coordinates" dir="ltr">N 32° 04′<br>E 34° 46′</span></div></main>
      <footer><span class="footer-label">${esc(tr('demo'))}</span><span class="footer-center"><i></i>${esc(tr('privacy'))}</span>${button('credits','credits','text-button')}</footer>`;
    }else if(mode==='ending'){
      ui.innerHTML=`<header>${logo()}<div class="header-right">${languageSelect()}${button('pause','pause','icon-button',icons.pause)}</div></header><section class="ending-caption" aria-live="polite"><p class="eyebrow">${esc(tr('endingWait'))}</p><p data-hud="ending-line">${esc(tr('endingBell'))}</p>${button('skipEnding','finishEnding','quiet','↗')}</section>`;
    }else{
      ui.innerHTML=`<header class="game-header"><div class="room-label"><span class="room-index" dir="ltr">0${game.room+1}<small> / 04</small></span><div><span class="eyebrow">OTHERSELF</span><h2 data-hud="room"></h2></div></div><div class="header-right">${languageSelect()}${button('help','help','icon-button',controlIcon('help'))}${button('pause','pause','icon-button',icons.pause)}</div></header>
      <div class="game-objective"><span class="small-label">${esc(tr('objective'))}</span><p data-hud="objective"></p></div>
      <div class="body-status"><span class="status-light"></span><span data-hud="body"></span><small data-hud="safe"></small></div>
      <div class="body-indicator" hidden role="img"><svg viewBox="0 0 40 64" aria-hidden="true"><path class="body-silhouette" d="M20 3c-10 0-13 17-5 21l-2 5-10 15 4 3 9-12-2 16-4 11h6l5-12 3 12h6l-5-17 1-12 8 11 4-4-12-16c8-5 7-21-6-21Z"/><path class="shutter shutter-left" d="M3 3v24h9"/><path class="shutter shutter-right" d="M37 3v24h-9"/></svg><div><span data-hud="body-distance"></span><progress max="2" value="0"></progress></div></div><div class="tutorial-card" data-hud="tutorial"></div><div class="rescue-status"><span aria-hidden="true">⋈</span><span data-hud="rescues"></span></div>
      <div class="equipment-status"><span class="equipment-icon" aria-hidden="true">◇</span><span data-hud="inventory"></span><span class="elevation" data-hud="elevation"></span></div>
      <div class="context-label" data-hud="context"></div><div class="danger-banner" role="status" data-hud="danger"></div>
      <div class="game-bottom controls-v2 gamepad-controls"><div class="movement joystick-wrap" dir="ltr"><button type="button" class="joystick-base" data-joystick data-active="false" tabindex="-1" aria-label="${esc(tr('joystick'))}" aria-describedby="${stickHintId}" aria-keyshortcuts="A D W S ArrowLeft ArrowRight ArrowUp ArrowDown"><span class="joystick-ring" aria-hidden="true"></span><span class="joystick-directions" aria-hidden="true"><span class="north">↑</span><span class="east">→</span><span class="south">↓</span><span class="west">←</span></span><span class="joystick-stick" aria-hidden="true"></span></button><span class="joystick-caption">${esc(tr('joystickShort'))}</span><span class="sr-only" id="${stickHintId}">${esc(tr('joystickHint'))}</span></div><div class="hint"><span class="small-label">${esc(tr('tip'))}</span><p data-hud="tip"></p></div><div class="actions">${padButton('gamepadJump','jump','jump','traversal-button jump-button','jump')}${padButton('gamepadCrouch','crouch','crouch','traversal-button crouch-button','crawl')}${padButton('gamepadPickup','pickupItem','throw','traversal-button throw-button','pickup')}${padButton('gamepadAction','action','action','interact-button','action')}${padButton('gamepadPossess','possess','possess','possession','possess')}</div></div>`;
      hudFingerprint='';updateHUD();
    }
    renderModal();
    joystick?.rebind();
  }
  function updateBodyIndicator(){
    const el=ui.querySelector('.body-indicator');if(!el)return;
    const room=game.rooms[game.room],host=room.guards.find(g=>g.id===game.controlled);
    const point=scene?.project(game.nim.x,getHeight(game,game.nim)+1);
    const danger=Math.max(0,...room.guards.filter(g=>g.id!==game.controlled).map(g=>g.alert||0));
    el.hidden=!host||(!danger&&point?.visible);if(el.hidden)return;
    const distance=Math.round(Math.abs(host.x-game.nim.x));
    const label=tr('bodyLocation',{distance});
    el.setAttribute('aria-label',danger>0?`${tr('bodyDanger')}. ${label}`:label);
    el.querySelector('[data-hud=body-distance]').textContent=`${game.nim.x<host.x?'←':'→'} ${label}`;
    el.querySelector('progress').value=danger;el.style.setProperty('--danger',String(Math.min(1,danger/2)));
    el.style.left=game.nim.x<host.x?'14px':'auto';el.style.right=game.nim.x<host.x?'auto':'14px';el.classList.toggle('threatened',danger>0);
  }
  function updateHUD(){
    if(mode!=='game'&&mode!=='paused')return;
    const room=game.rooms[game.room],controlled=room.guards.find(g=>g.id===game.controlled),interaction=getInteraction(game),target=getTarget(game),targetInfo=getTargetInfo(game),throwable=getThrowableInfo(game),traversal=getTraversal(game);
    const rescueCount=game.rooms.filter(r=>r.rescued).length;
    const danger=Math.max(0,...room.guards.filter(g=>g.id!==game.controlled).map(g=>Number(g.alert)||0));
    container.dataset.alert=danger>.05?'true':'false';
    const fingerprint=JSON.stringify([game.room,game.controlled,interaction?.key,target?.id,targetInfo?.reason,rescueCount,Math.round(danger*10),preferences.lang,room.gateOpen,room.bridgeOpen,isHidden(game),game.nim.crouching,game.nim.heldItem,game.nim.ladderId,throwable?.key,throwable?.enabled,traversal.kind,Math.floor((controlled||game.nim).x*2),Math.round(traversal.height*10),game.milestones,game.nim.grounded,game.nim.coyote>0,game.transition?.target,Math.round((game.transition?.progress||0)*10)]);
    if(fingerprint===hudFingerprint)return;hudFingerprint=fingerprint;
    const set=(key,text)=>{const el=ui.querySelector(`[data-hud="${key}"]`);if(el){el.textContent=text;if(key==='room')el.title=text;}};
    set('room',tr(`room${game.room}`));set('objective',tr(`room${game.room}desc`));set('body',tr(controlled?.role||'nim'));set('safe',tr(isHidden(game)?(controlled?'bodyResting':'safe'):(controlled?'bodyDanger':'exposed')));set('rescues',tr('rescueCount',{count:rescueCount}));set('tip',tr(`tip${game.room}`));
    const learned=game.milestones||{},n=game.nim;
    const tutorial=game.room!==0?null:controlled?(room.gateOpen?'tutorialReturn':'tutorialOperate'):!learned.moved?'tutorialMove':n.x<2.8&&!n.heldItem&&!learned.thrown?'tutorialThrow':n.x<5.7&&n.y<.3?'tutorialCrawl':n.x>5.7&&n.x<8.3&&n.y<2.2?'tutorialLadder':!room.gateOpen?(n.heldItem&&!learned.thrown?'tutorialThrow':'tutorialObserve'):n.x>=27&&n.x<30&&n.y<2.2?'tutorialLadder':n.x>=29&&n.y>=2.2?'tutorialJump':'tutorialLeave';
    set('tutorial',tutorial?tr(tutorial):'');
    container.dataset.stage=tutorial&&!room.gateOpen?'tutorial':'playing';
    const ladder=(ROOMS[game.room].ladders||[]).some(l=>Math.abs(l.x-(controlled||game.nim).x)<.8&&traversal.height>=(l.bottom??l.fromY??0)-.3&&traversal.height<=(l.top??l.toY??6)+.3);
    const context=ui.querySelector('[data-hud=context]');
    let contextText='',contextKey='';
    if(interaction?.enabled){contextText=tr(interaction.key);contextKey='E';}
    else if(ladder){contextText=tr('joystickClimbHint');contextKey='W / S';}
    else if(throwable?.enabled&&!game.nim.heldItem){contextText=tr('pickupItem');contextKey='F';}
    else if(target){contextText=tr('possess');contextKey='Q';}
    else if(interaction)contextText=tr(interaction.key);
    else if(targetInfo?.reason==='glass'||targetInfo?.reason==='machine')contextText=tr(targetInfo.reason==='glass'?'targetBlockedGlass':'targetBlockedMachine');
    context.innerHTML=contextText?`<span class="context-text">${esc(contextText)}</span>${contextKey?`<kbd class="context-key">${contextKey}</kbd>`:''}`:'';
    set('inventory',tr(game.nim.heldItem?'heldItem':'emptyHands'));set('elevation',tr('elevation',{height:Math.round(Math.max(0,traversal.height)*10)/10}));
    function pad(cmd,label,full,icon,state,shortcut,reason=''){
      const el=ui.querySelector(`[data-command="${cmd}"]`);if(!el)return;
      el.querySelector('span:last-child').textContent=tr(label);
      if(el.dataset.icon!==icon){el.querySelector('span:first-child').innerHTML=controlIcon(icon);el.dataset.icon=icon;}
      el.setAttribute('aria-label',tr(full));el.setAttribute('aria-keyshortcuts',shortcut);
      // Unavailable buttons stay discoverable: activating one explains why.
      el.setAttribute('aria-disabled',String(state==='locked'));
      el.title=tr(reason||full);el.dataset.state=state;
      el.classList.toggle('available',state==='ready'||state==='active');
    }
    pad('jump','gamepadJump','jump','jump',controlled?'locked':game.nim.grounded||game.nim.coyote>0||game.nim.ladderId?'ready':'idle','Space',controlled?'padHostOnly':'');
    pad('crouch',n.crouching?'gamepadStand':'gamepadCrouch',n.crouching?'standUp':'crouch',n.crouching?'stand':'crawl',controlled?'locked':n.crouching?'active':'ready','C',controlled?'padHostOnly':'');
    ui.querySelector('[data-command=crouch]').setAttribute('aria-pressed',String(!!n.crouching));
    pad('throw',n.heldItem?'gamepadThrow':'gamepadPickup',n.heldItem?'throwItem':'pickupItem',n.heldItem?'throw':'pickup',controlled?'locked':throwable?.enabled?'ready':'idle','F',controlled?'padHostOnly':!throwable?.enabled?'noItemNearby':'');
    set('danger',danger>.05?tr(controlled?'bodyDanger':'detected'):'');
    pad('possess',game.transition?'cancel':controlled?'gamepadReturn':'gamepadPossess',game.transition?'cancel':controlled?'return':'possess',game.transition?'cancel':controlled?'return':'possess',controlled||game.transition?'active':target?'ready':'idle','Q',!controlled&&!target?(targetInfo?.reason==='glass'?'targetBlockedGlass':targetInfo?.reason==='machine'?'targetBlockedMachine':'noTarget'):'');
    ui.querySelector('[data-command=possess]').style.setProperty('--link-progress',`${controlled?100:Math.min(100,(game.transition?.progress||0)/.6*100)}%`);
    const actionLabels={openGate:['padOpen','open'],deployBridge:['padOperate','operate'],moveCart:['padOperate','operate'],rescue:['padRescue','rescue'],nextRoom:['padExit','exit'],previousRoom:['back','back'],depart:['padBoard','board']};
    const [actionLabel,actionIcon]=actionLabels[interaction?.key]||['gamepadAction','action'];
    pad('action',actionLabel,interaction?.key||'action',actionIcon,interaction?.enabled?'ready':interaction?'locked':'idle','E',interaction?.key||'padNoAction');
  }
  function activateControl(cmd){
    if(mode!=='game'||modal)return;
    const el=ui.querySelector(`.gamepad-controls [data-command="${cmd}"]`);
    if(el){el.dataset.feedback='true';feedbackUntil.set(el,performance.now()+180);}
    if(game.controlled&&['jump','crouch','throw'].includes(cmd)){notify('padHostOnly');return;}
    if(cmd==='action'){
      const interaction=getInteraction(game);
      if(!interaction)notify('padNoAction');
      else if(!interaction.enabled)notify(interaction.key);
      else action(game);
    }else if(cmd==='throw'){
      if(!getThrowableInfo(game).enabled)notify('noItemNearby');else useThrowable(game);
    }else if(cmd==='possess')possess(game);
    else if(cmd==='jump'){const grounded=game.nim.grounded;if(!jump(game)&&grounded)notify('cannotJump');}
    else if(cmd==='crouch')toggleCrouch(game);
    updateHUD();
  }

  function settingsHTML(){return `<div class="settings-grid"><label>${esc(tr('music'))}<input type="range" min="0" max="1" step="0.05" value="${preferences.music}" data-pref="music"></label><label>${esc(tr('effects'))}<input type="range" min="0" max="1" step="0.05" value="${preferences.effects}" data-pref="effects"></label><label>${esc(tr('quality'))}<select data-pref="quality"><option value="high" ${preferences.quality==='high'?'selected':''}>${esc(tr('high'))}</option><option value="low" ${preferences.quality==='low'?'selected':''}>${esc(tr('low'))}</option></select></label><label>${esc(tr('reducedMotion'))}<input type="checkbox" data-pref="reducedMotion" ${preferences.reducedMotion?'checked':''}></label><label>${esc(tr('mute'))}<input type="checkbox" data-pref="muted" ${preferences.muted?'checked':''}></label></div>`;}
  function renderModal(){
    if(!modal){dialogs.innerHTML='';ui.inert=false;return;}
    ui.inert=true;
    let title=tr(modal),body='',buttons='';
    if(modal==='paused'){body=`<p>${esc(tr(`room${game.room}desc`))}</p>`;buttons=button('resume','resume','primary','↗')+button('settings','settings','quiet')+button('help','help','quiet')+button('journal','journal','quiet')+button('exit','exit','text-button');}
    if(modal==='settings'){body=settingsHTML();buttons=button('back','close','primary');}
    if(modal==='help'){body=`<p class="touch-help">${esc(tr('touchHelp'))}</p><div class="help-keys"><div><kbd>A D</kbd><kbd>← →</kbd><p>${esc(tr('instructionMove'))}</p></div><div><kbd>Space</kbd><p>${esc(tr('instructionJump'))}</p></div><div><kbd>C</kbd><p>${esc(tr('instructionCrouch'))}</p></div><div><kbd>W S</kbd><kbd>↑ ↓</kbd><p>${esc(tr('instructionClimb'))}</p></div><div><kbd>F</kbd><p>${esc(tr('instructionThrow'))}</p></div><div><kbd>E</kbd><p>${esc(tr('instructionAction'))}</p></div><div><kbd>Q</kbd><p>${esc(tr('instructionPossess'))}</p></div></div><p>${esc(tr('instructionReturn'))}</p><p>${esc(tr('helpBody'))}</p>`;buttons=button('back','close','primary');}
    if(modal==='journal'){body=game.visits.map((v,i)=>v?`<h3>${esc(tr('room'+i))}</h3><p>${esc(tr('journal'+i))}</p>`:'').join('');buttons=button('back','close','primary');}
    if(modal==='credits'){body=`<p>${esc(tr('creditsBody'))}</p><p class="small-label">Three.js · Vite · Blender · Web Audio</p>`;buttons=button('back','close','primary');}
    if(modal==='new'){title=tr('newGame');body=`<p>${esc(tr('resetConfirm'))}</p>`;buttons=button('newGame','start','primary')+button('cancel','close','quiet');}
    if(modal==='lost'){title=tr(game.loss?.key==='fell'?'fell':'lost');body=`<div class="ending-symbol">◎</div><p>${esc(tr(game.loss?.key==='fell'?'lostFall':game.loss?.key==='bodyFound'?'lostBody':'lostNim'))}</p>${game.loss?.key==='fell'?'':`<p class="small-label">${esc(tr('deathDetail',{role:tr(game.rooms[game.room].guards.find(g=>g.id===game.loss?.guardId)?.role||'keeper'),room:tr(`room${game.room}`)}))}</p>`}`;buttons=button('retry','retry','primary','↻')+button('exit','exit','quiet');}
    if(modal==='won'){
      const count=game.rooms.filter(r=>r.rescued).length;title=tr(`ending${count}title`);body=`<div class="ending-symbol">${['○','◒','●'][count]}</div><p>${esc(tr(`ending${count}body`))}</p><p class="small-label">${esc(tr('rescueCount',{count}))}</p><div class="commission"><p>${esc(tr('demo'))}</p><a href="mailto:support@kikkey.com?subject=OTHERSELF%20%E2%80%94%20Kikkey%20Games">${esc(tr('brandGame'))} ↗</a><a href="https://wa.me/972538259813?text=${encodeURIComponent(`OTHERSELF — ${tr('gameProject')}`)}" target="_blank" rel="noopener noreferrer">${esc(tr('gameProject'))} ↗</a></div>`;buttons=button('playAgain','start','primary','↻')+button('exit','exit','quiet');
    }
    dialogs.innerHTML=`<section class="dialog" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="eyebrow">OTHERSELF / ${esc(tr('episode'))}</div><h2 id="dialog-title">${esc(title)}</h2><div class="dialog-body">${body}</div><div class="dialog-actions">${buttons}</div></section>`;
    queueMicrotask(()=>{const dialog=dialogs.querySelector('.dialog');if(dialog){dialog.scrollTop=0;dialog.focus({preventScroll:true});}});
  }
  function openModal(name){lastFocus=document.activeElement;if(['game','ending'].includes(mode))pause();modal=name;renderModal();}
  function closeModal(){modal=null;if(mode==='paused'){modal='paused';renderModal();}else renderModal();lastFocus?.focus();}
  function applyPrefs(){audio.setVolumes(Number(preferences.music),Number(preferences.effects));audio.setMuted(preferences.muted);scene?.setQuality(preferences.quality);scene?.setReducedMotion(preferences.reducedMotion);savePrefs();}
  function start(useSaved=false){
    if(!scene){location.reload();return;}
    game=useSaved&&saved?restore(typeof saved==='string'?saved:JSON.stringify(saved)):createGame();
    if(!game||game.phase!=='playing')game=createGame();
    endingTime=null;scene?.setEndingMode?.(null);pausedFrom='game';mode='game';modal=null;lastPhase=game.phase;lastRoom=game.room;accumulator=0;resetInput();
    audio.unlock().then(()=>{applyPrefs();audio.resume();});render();save();container.focus();
  }
  function pause(){if(!['game','ending'].includes(mode))return;pausedFrom=mode;mode='paused';resetInput();audio.pause();save();modal='paused';render();}
  function resume(){if(mode!=='paused')return;mode=pausedFrom;modal=null;previous=performance.now();accumulator=0;audio.resume();render();container.focus();}
  function finishEnding(){endingTime=8;scene?.setEndingMode?.(8,game.rooms.filter(r=>r.rescued).length);mode='paused';modal='won';render();}
  function exit(){save();endingTime=null;scene?.setEndingMode?.(null);mode='menu';modal=null;audio.pause();resetInput();game=createGame();render();}
  function command(cmd){
    if(cmd==='finishEnding')finishEnding();else if(cmd==='start')start();else if(cmd==='continue')start(true);else if(cmd==='new')openModal('new');else if(cmd==='pause')pause();else if(cmd==='resume')resume();else if(cmd==='close')closeModal();else if(['settings','help','credits','journal'].includes(cmd))openModal(cmd);else if(cmd==='home'){if(mode!=='menu')exit();}else if(cmd==='exit')exit();else if(cmd==='reload')location.reload();else if(cmd==='mute'){preferences.muted=!preferences.muted;audio.unlock();applyPrefs();render();}else if(cmd==='retry'){game=retry(game)||game;mode='game';modal=null;lastPhase='playing';resetInput();audio.resume();render();save();container.focus({preventScroll:true});}else if(['action','possess','jump','crouch','throw'].includes(cmd))activateControl(cmd);
  }
  container.tabIndex=0;
  joystick=createJoystick(container,{enabled:()=>mode==='game'&&!modal,onChange:axes=>{stickAxes=axes;}});
  container.addEventListener('click',e=>{const el=e.target.closest('[data-command]');if(el){e.preventDefault();if(e.detail>0&&performance.now()-(touchCommands.get(el)??-Infinity)<900)return;command(el.dataset.command);if(e.detail>0&&mode==='game'&&el.closest('.gamepad-controls'))container.focus({preventScroll:true});}},{signal});
  container.addEventListener('change',e=>{const key=e.target.dataset.pref;if(!key)return;preferences[key]=e.target.type==='checkbox'?e.target.checked:e.target.type==='range'?Number(e.target.value):e.target.value;applyPrefs();if(key==='lang'){render();if(mode==='game')container.focus();if(toastKey)toast.textContent=tr(toastKey);}},{signal});
  container.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')container.dataset.input='touch';if(mode!=='game')return;const actionButton=e.target.closest('.gamepad-controls [data-command]');if(!actionButton||actionButton.disabled||e.button!==0)return;actionButton.dataset.pressed='true';pressedActions.set(e.pointerId,actionButton);if(e.pointerType==='touch'){e.preventDefault();container.focus({preventScroll:true});container.setPointerCapture(e.pointerId);touchCommands.set(actionButton,performance.now());command(actionButton.dataset.command);}},{signal});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{const button=pressedActions.get(e.pointerId);if(button){delete button.dataset.pressed;pressedActions.delete(e.pointerId);}},{signal});
  container.addEventListener('keydown',e=>{
    container.dataset.input='keyboard';
    if(e.code==='Escape'){e.preventDefault();if(modal==='won'||modal==='lost')return;if(modal&&modal!=='paused'&&modal!=='won'&&modal!=='lost')closeModal();else if(['game','ending'].includes(mode))pause();else if(mode==='paused')resume();return;}
    if(mode!=='game'||modal||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
    // Space/Enter on a focused button belong to its native activation.
    if(['Space','Enter'].includes(e.code)&&e.target.closest('button,a'))return;
    const direction=directionByCode[e.code];
    if(direction){heldKeys.add(e.code);syncInput();e.preventDefault();}
    if(!e.repeat&&e.code==='KeyE'){activateControl('action');e.preventDefault();}
    if(!e.repeat&&e.code==='KeyQ'){activateControl('possess');e.preventDefault();}
    if(!e.repeat&&e.code==='Space'){activateControl('jump');e.preventDefault();}
    if(!e.repeat&&['KeyC','ControlLeft','ControlRight'].includes(e.code)){activateControl('crouch');e.preventDefault();}
    if(!e.repeat&&e.code==='KeyF'){activateControl('throw');e.preventDefault();}
  },{signal});
  window.addEventListener('keyup',e=>{if(directionByCode[e.code]){heldKeys.delete(e.code);syncInput();}},{signal});
  window.addEventListener('blur',()=>{resetInput();if(['game','ending'].includes(mode))pause();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['game','ending'].includes(mode))pause();},{signal});
  window.addEventListener('pagehide',save,{signal});
  world.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();mode='error';modal=null;loadError=false;render();},{signal,capture:true});
  render();
  try{const {createScene}=await import('./scene.js');scene=await createScene(world,{quality:preferences.quality,reducedMotion:preferences.reducedMotion});if(destroyed){scene.destroy();return;}mode='menu';render();}catch(error){console.error(error);mode='error';loadError=true;render();}
  function tick(now){
    if(destroyed)return;for(const [button,until] of feedbackUntil)if(now>=until){delete button.dataset.feedback;feedbackUntil.delete(button);}
    const dt=Math.min(.05,(now-(previous||now))/1000);previous=now;
    if(mode==='game'){
      accumulator+=dt;while(accumulator>=1/60){step(game,1/60,{move:(input.left||input.right)?Number(input.right)-Number(input.left):stickAxes.move,climb:(input.up||input.down)?Number(input.up)-Number(input.down):stickAxes.climb});accumulator-=1/60;}
      for(const event of game.events.splice(0)){if(event.room!==undefined&&event.room!==game.room)continue;audio.event(event.type,event);if(event.key)notify(event.key);}
      if(game.room!==lastRoom){lastRoom=game.room;save();render();container.focus({preventScroll:true});}
      if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='won'){endingTime=0;mode='ending';modal=null;resetInput();scene?.setEndingMode?.(0,game.rooms.filter(r=>r.rescued).length);try{localStorage.removeItem(SAVE);saved=null;}catch{}render();}else if(game.phase==='lost'){resetInput();modal='lost';mode='paused';render();}}
      saveClock+=dt;if(saveClock>2){save();saveClock=0;}updateHUD();audio.update(game,dt);
    }
    if(toastClock>0){toastClock-=dt;if(toastClock<=0)toast.classList.remove('visible');}
    if(mode==='ending'){endingTime+=dt;const count=game.rooms.filter(r=>r.rescued).length;scene?.setEndingMode?.(endingTime,count);const line=ui.querySelector('[data-hud=ending-line]');if(line){const text=tr(endingTime<2?'endingBell':endingTime<3?'endingQuiet':count===0?'endingQuiet':count===1?'endingOneVoice':'endingTwoVoices');if(line.textContent!==text)line.textContent=text;}audio.update(game,dt);if(endingTime>=8)finishEnding();}
    scene?.update(game,(mode==='paused'||mode==='error')?0:dt);
    if(mode==='game')updateBodyIndicator();
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  const api={start,pause,resume,destroy(){destroyed=true;save();resetInput();cancelAnimationFrame(frame);viewportObserver.disconnect();joystick?.destroy();abort.abort();scene?.destroy();audio.destroy();container.innerHTML='';container.classList.remove('otherself');},getState:()=>game,getMode:()=>mode};
  // Explicit development-only hook for deterministic browser acceptance tests.
  if(import.meta.env.DEV)window.__OTHERSELF__=api;
  return api;
}

