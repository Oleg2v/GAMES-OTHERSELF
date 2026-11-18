import './style.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/cyrillic-600.css';
import '@fontsource/unbounded/latin-500.css';
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-600.css';
import { createGame, step, action, possess, getTarget, getTargetInfo, getInteraction, serialize, restore, retry, ROOMS, isHidden } from './engine.js';
import { t, languages } from './i18n.js';
import { createAudio } from './audio.js';

const SAVE='otherself.save.v1', PREFS='otherself.preferences.v1';
const read = key => {try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={play:'↗',pause:'Ⅱ',sound:'◖))',mute:'◖×',settings:'☷',close:'×',action:'✧',possess:'◎'};

export async function mount(container) {
  const abort=new AbortController(), signal=abort.signal;
  const preferences={lang:'ru',music:.35,effects:.65,muted:false,quality:'high',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,...read(PREFS)};
  const urlLang=new URLSearchParams(location.search).get('lang');
  if(['ru','en','he'].includes(urlLang)) preferences.lang=urlLang;
  if(!['ru','en','he'].includes(preferences.lang))preferences.lang='ru';
  let game=createGame(), scene, audio=createAudio(), mode='loading', modal=null, lastFocus=null, frame=0, previous=0, accumulator=0, saveClock=0, toastClock=0, toastKey='', destroyed=false;
  let endingTime=null, pausedFrom='game';
  let saved=read(SAVE), loadError=false, lastRoom=0, lastPhase='playing', hudFingerprint='', input={left:false,right:false};
  const tr=(key,params)=>t(preferences.lang,key,params);
  container.classList.add('otherself');
  container.innerHTML='<div class="world" aria-hidden="true"></div><div class="vignette"></div><div class="interface"></div><div class="dialog-layer"></div><div class="toast" role="status" aria-live="polite"></div>';
  const world=container.querySelector('.world'),ui=container.querySelector('.interface'),dialogs=container.querySelector('.dialog-layer'),toast=container.querySelector('.toast');
  const viewportObserver=new ResizeObserver(()=>scene?.resize());viewportObserver.observe(world);
  const button=(key,command,cls='',icon='')=>`<button type="button" class="${cls}" data-command="${command}">${icon?`<span aria-hidden="true">${icon}</span>`:''}<span>${esc(tr(key))}</span></button>`;
  const languageSelect=()=>`<label class="language"><span class="sr-only">${esc(tr('language'))}</span><select data-pref="lang" aria-label="${esc(tr('language'))}">${languages.map(l=>`<option value="${l.code}" ${l.code===preferences.lang?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label>`;
  const logo=()=>'<a class="wordmark" href="#" data-command="home" aria-label="Kikkey Games">kikkey<span class="brand-square">↗</span><small>GAMES</small></a>';
  function savePrefs(){try{localStorage.setItem(PREFS,JSON.stringify(preferences));}catch{notify('saveError');}}
  function save(){if(!['game','paused'].includes(mode)||game.phase!=='playing')return;try{const value=serialize(game);localStorage.setItem(SAVE,typeof value==='string'?value:JSON.stringify(value));saved=read(SAVE);}catch{notify('saveError');}}
  function notify(key){toastKey=key;toast.textContent=tr(key);toast.classList.add('visible');toastClock=4;}
  function render(){
    container.lang=preferences.lang;container.dir=preferences.lang==='he'?'rtl':'ltr';
    container.dataset.mode=mode;scene?.setMenuMode?.(mode==='menu'||mode==='loading');
    if(mode==='loading'||mode==='error'){
      ui.innerHTML=`<header>${logo()}${languageSelect()}</header><section class="load-card"><div class="orbit-mark">◎</div><p class="eyebrow">OTHERSELF</p><h1>${esc(tr(mode==='error'?'error':'loading'))}</h1>${mode==='error'?`<p>${esc(tr(loadError?'error':'contextLost'))}</p>${button('retryLoading','reload','primary','↻')}${button('exit','home','quiet')}`:'<div class="load-line"><span></span></div>'}</section>`;
    }else if(mode==='menu'){
      ui.innerHTML=`<header>${logo()}<div class="header-right"><span class="edition">${esc(tr('episode'))}</span>${languageSelect()}${button(preferences.muted?'mute':'sound','mute','icon-button',preferences.muted?icons.mute:icons.sound)}</div></header>
      <main class="landing"><div class="landing-copy"><div class="eyebrow"><i></i>${esc(tr('tagline'))}</div><h1 dir="ltr">OTHER<span>SELF</span><sup>01</sup></h1><p class="local-title">${esc(tr('title'))}</p><p class="intro">${esc(tr('intro'))}</p><div class="start-row">${button(saved?'continue':'begin',saved?'continue':'start','primary',icons.play)}<span class="start-note">${esc(tr('subtitle'))}</span></div><div class="menu-secondary">${saved?button('newGame','new','text-button'):''}${button('help','help','text-button')}${button('settings','settings','text-button')}</div></div>
      <div class="scene-caption"><span class="caption-line"></span><span><b>01 / 04</b>${esc(tr('room0'))}</span><span class="coordinates" dir="ltr">N 32° 04′<br>E 34° 46′</span></div></main>
      <footer><span class="footer-label">${esc(tr('demo'))}</span><span class="footer-center"><i></i>${esc(tr('privacy'))}</span>${button('credits','credits','text-button')}</footer>`;
    }else if(mode==='ending'){
      ui.innerHTML=`<header>${logo()}<div class="header-right">${languageSelect()}${button('pause','pause','icon-button',icons.pause)}</div></header><section class="ending-caption" aria-live="polite"><p class="eyebrow">${esc(tr('endingWait'))}</p><p data-hud="ending-line">${esc(tr('endingBell'))}</p>${button('skipEnding','finishEnding','quiet','↗')}</section>`;
    }else{
      ui.innerHTML=`<header class="game-header"><div class="room-label"><span class="room-index" dir="ltr">0${game.room+1}<small> / 04</small></span><div><span class="eyebrow">OTHERSELF</span><h2 data-hud="room"></h2></div></div><div class="header-right">${languageSelect()}${button('help','help','icon-button','?')}${button('pause','pause','icon-button',icons.pause)}</div></header>
      <div class="game-objective"><span class="small-label">${esc(tr('objective'))}</span><p data-hud="objective"></p></div>
      <div class="body-status"><span class="status-light"></span><span data-hud="body"></span><small data-hud="safe"></small></div>
      <div class="body-indicator" hidden role="img"><svg viewBox="0 0 40 64" aria-hidden="true"><path class="body-silhouette" d="M20 3c-10 0-13 17-5 21l-2 5-10 15 4 3 9-12-2 16-4 11h6l5-12 3 12h6l-5-17 1-12 8 11 4-4-12-16c8-5 7-21-6-21Z"/><path class="shutter shutter-left" d="M3 3v24h9"/><path class="shutter shutter-right" d="M37 3v24h-9"/></svg><div><span data-hud="body-distance"></span><progress max="2" value="0"></progress></div></div><div class="tutorial-card" data-hud="tutorial"></div><div class="rescue-status"><span aria-hidden="true">⋈</span><span data-hud="rescues"></span></div>
      <div class="context-label" data-hud="context"></div><div class="danger-banner" role="status" data-hud="danger"></div>
      <div class="game-bottom"><div class="movement" dir="ltr"><button data-move="left" aria-label="${esc(tr('move'))} ←">←</button><button data-move="right" aria-label="${esc(tr('move'))} →">→</button><span><bdi>A / D</bdi></span></div><div class="hint"><span class="small-label">${esc(tr('tip'))}</span><p data-hud="tip"></p></div><div class="actions">${button('action','action','action-button',icons.action)}${button('possess','possess','action-button possession',icons.possess)}</div></div>`;
      hudFingerprint='';updateHUD();
    }
    renderModal();
  }
  function updateBodyIndicator(){
    const el=ui.querySelector('.body-indicator');if(!el)return;
    const room=game.rooms[game.room],host=room.guards.find(g=>g.id===game.controlled);
    const point=scene?.project(game.nim.x,1);
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
    const room=game.rooms[game.room],controlled=room.guards.find(g=>g.id===game.controlled),interaction=getInteraction(game),target=getTarget(game),targetInfo=getTargetInfo(game);
    const rescueCount=game.rooms.filter(r=>r.rescued).length;
    const danger=Math.max(0,...room.guards.filter(g=>g.id!==game.controlled).map(g=>Number(g.alert)||0));
    const fingerprint=JSON.stringify([game.room,game.controlled,interaction?.key,target?.id,targetInfo?.reason,rescueCount,Math.round(danger*10),preferences.lang,room.gateOpen,room.bridgeOpen,isHidden(game)]);
    if(fingerprint===hudFingerprint)return;hudFingerprint=fingerprint;
    const set=(key,text)=>{const el=ui.querySelector(`[data-hud="${key}"]`);if(el){el.textContent=text;if(key==='room')el.title=text;}};
    set('room',tr(`room${game.room}`));set('objective',tr(`room${game.room}desc`));set('body',tr(controlled?.role||'nim'));set('safe',tr(isHidden(game)?(controlled?'bodyResting':'safe'):(controlled?'bodyDanger':'exposed')));set('rescues',tr('rescueCount',{count:rescueCount}));set('tip',tr(`tip${game.room}`));
    const tutorial=game.room===0?(room.gateOpen?(controlled?'tutorialReturn':'tutorialLeave'):controlled?'tutorialOperate':'tutorialObserve'):null;
    set('tutorial',tutorial?tr(tutorial):'');
    container.dataset.stage=tutorial&&!room.gateOpen?'tutorial':'playing';
    set('context',interaction?`${tr(interaction.key)} · E`:target?`${tr('possess')} · Q`:targetInfo?.reason==='glass'?tr('targetBlockedGlass'):targetInfo?.reason==='machine'?tr('targetBlockedMachine'):'');
    set('danger',danger>.05?tr(controlled?'bodyDanger':'detected'):'');
    const possessBtn=ui.querySelector('[data-command="possess"]');if(possessBtn){possessBtn.querySelector('span:last-child').textContent=tr(controlled?'return':'possess');possessBtn.classList.toggle('available',!!controlled||!!target);possessBtn.setAttribute('aria-keyshortcuts','Q');}
    const actionBtn=ui.querySelector('[data-command="action"]');if(actionBtn){actionBtn.classList.toggle('available',!!interaction?.enabled);actionBtn.setAttribute('aria-keyshortcuts','E');}
  }
  function settingsHTML(){return `<div class="settings-grid"><label>${esc(tr('music'))}<input type="range" min="0" max="1" step="0.05" value="${preferences.music}" data-pref="music"></label><label>${esc(tr('effects'))}<input type="range" min="0" max="1" step="0.05" value="${preferences.effects}" data-pref="effects"></label><label>${esc(tr('quality'))}<select data-pref="quality"><option value="high" ${preferences.quality==='high'?'selected':''}>${esc(tr('high'))}</option><option value="low" ${preferences.quality==='low'?'selected':''}>${esc(tr('low'))}</option></select></label><label>${esc(tr('reducedMotion'))}<input type="checkbox" data-pref="reducedMotion" ${preferences.reducedMotion?'checked':''}></label><label>${esc(tr('mute'))}<input type="checkbox" data-pref="muted" ${preferences.muted?'checked':''}></label></div>`;}
  function renderModal(){
    if(!modal){dialogs.innerHTML='';ui.inert=false;return;}
    ui.inert=true;
    let title=tr(modal),body='',buttons='';
    if(modal==='paused'){body=`<p>${esc(tr(`room${game.room}desc`))}</p>`;buttons=button('resume','resume','primary','↗')+button('settings','settings','quiet')+button('help','help','quiet')+button('journal','journal','quiet')+button('exit','exit','text-button');}
    if(modal==='settings'){body=settingsHTML();buttons=button('back','close','primary');}
    if(modal==='help'){body=`<div class="help-keys"><div><kbd>A D</kbd><kbd>← →</kbd><p>${esc(tr('instructionMove'))}</p></div><div><kbd>E</kbd><p>${esc(tr('instructionAction'))}</p></div><div><kbd>Q</kbd><p>${esc(tr('instructionPossess'))}</p></div></div><p>${esc(tr('instructionReturn'))}</p><p>${esc(tr('helpBody'))}</p>`;buttons=button('back','close','primary');}
    if(modal==='journal'){body=game.visits.map((v,i)=>v?`<h3>${esc(tr('room'+i))}</h3><p>${esc(tr('journal'+i))}</p>`:'').join('');buttons=button('back','close','primary');}
    if(modal==='credits'){body=`<p>${esc(tr('creditsBody'))}</p><p class="small-label">Three.js · Vite · Blender · Web Audio</p>`;buttons=button('back','close','primary');}
    if(modal==='new'){title=tr('newGame');body=`<p>${esc(tr('resetConfirm'))}</p>`;buttons=button('newGame','start','primary')+button('cancel','close','quiet');}
    if(modal==='lost'){title=tr('lost');body=`<div class="ending-symbol">◎</div><p>${esc(tr(game.loss?.key==='bodyFound'?'lostBody':'lostNim'))}</p><p class="small-label">${esc(tr('deathDetail',{role:tr(game.rooms[game.room].guards.find(g=>g.id===game.loss?.guardId)?.role||'keeper'),room:tr(`room${game.room}`)}))}</p>`;buttons=button('retry','retry','primary','↻')+button('exit','exit','quiet');}
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
    endingTime=null;scene?.setEndingMode?.(null);pausedFrom='game';mode='game';modal=null;lastPhase=game.phase;lastRoom=game.room;accumulator=0;input.left=input.right=false;
    audio.unlock().then(()=>{applyPrefs();audio.resume();});render();save();container.focus();
  }
  function pause(){if(!['game','ending'].includes(mode))return;pausedFrom=mode;mode='paused';input.left=input.right=false;audio.pause();save();modal='paused';render();}
  function resume(){if(mode!=='paused')return;mode=pausedFrom;modal=null;previous=performance.now();accumulator=0;audio.resume();render();container.focus();}
  function finishEnding(){endingTime=8;scene?.setEndingMode?.(8,game.rooms.filter(r=>r.rescued).length);mode='paused';modal='won';render();}
  function exit(){save();endingTime=null;scene?.setEndingMode?.(null);mode='menu';modal=null;audio.pause();input.left=input.right=false;game=createGame();render();}
  function command(cmd){
    if(cmd==='finishEnding')finishEnding();else if(cmd==='start')start();else if(cmd==='continue')start(true);else if(cmd==='new')openModal('new');else if(cmd==='pause')pause();else if(cmd==='resume')resume();else if(cmd==='close')closeModal();else if(['settings','help','credits','journal'].includes(cmd))openModal(cmd);else if(cmd==='home'){if(mode!=='menu')exit();}else if(cmd==='exit')exit();else if(cmd==='reload')location.reload();else if(cmd==='mute'){preferences.muted=!preferences.muted;audio.unlock();applyPrefs();render();}else if(cmd==='retry'){game=retry(game)||game;mode='game';modal=null;lastPhase='playing';audio.resume();render();save();}else if(mode==='game'&&cmd==='action')action(game);else if(mode==='game'&&cmd==='possess')possess(game);
  }
  container.tabIndex=0;
  container.addEventListener('click',e=>{const el=e.target.closest('[data-command]');if(el){e.preventDefault();command(el.dataset.command);}},{signal});
  container.addEventListener('change',e=>{const key=e.target.dataset.pref;if(!key)return;preferences[key]=e.target.type==='checkbox'?e.target.checked:e.target.type==='range'?Number(e.target.value):e.target.value;applyPrefs();if(key==='lang'){render();if(mode==='game')container.focus();if(toastKey)toast.textContent=tr(toastKey);}},{signal});
  container.addEventListener('pointerdown',e=>{const btn=e.target.closest('[data-move]');if(btn&&mode==='game'){e.preventDefault();input[btn.dataset.move]=true;btn.setPointerCapture(e.pointerId);}},{signal});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])container.addEventListener(event,e=>{const btn=e.target.closest('[data-move]');if(btn)input[btn.dataset.move]=false;},{signal});
  container.addEventListener('keydown',e=>{
    if(e.code==='Escape'){e.preventDefault();if(modal==='won'||modal==='lost')return;if(modal&&modal!=='paused'&&modal!=='won'&&modal!=='lost')closeModal();else if(['game','ending'].includes(mode))pause();else if(mode==='paused')resume();return;}
    if(mode!=='game'||modal||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
    if(['KeyA','ArrowLeft'].includes(e.code)){input.left=true;e.preventDefault();}
    if(['KeyD','ArrowRight'].includes(e.code)){input.right=true;e.preventDefault();}
    if(!e.repeat&&e.code==='KeyE'){action(game);e.preventDefault();}
    if(!e.repeat&&['KeyQ','Space'].includes(e.code)){possess(game);e.preventDefault();}
  },{signal});
  container.addEventListener('keyup',e=>{if(['KeyA','ArrowLeft'].includes(e.code))input.left=false;if(['KeyD','ArrowRight'].includes(e.code))input.right=false;},{signal});
  window.addEventListener('blur',()=>{input.left=input.right=false;if(['game','ending'].includes(mode))pause();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['game','ending'].includes(mode))pause();},{signal});
  window.addEventListener('pagehide',save,{signal});
  world.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();mode='error';modal=null;loadError=false;render();},{signal,capture:true});
  render();
  try{const {createScene}=await import('./scene.js');scene=await createScene(world,{quality:preferences.quality,reducedMotion:preferences.reducedMotion});if(destroyed){scene.destroy();return;}mode='menu';render();}catch(error){console.error(error);mode='error';loadError=true;render();}
  function tick(now){
    if(destroyed)return;const dt=Math.min(.05,(now-(previous||now))/1000);previous=now;
    if(mode==='game'){
      accumulator+=dt;while(accumulator>=1/60){step(game,1/60,{move:Number(input.right)-Number(input.left)});accumulator-=1/60;}
      for(const event of game.events.splice(0)){audio.event(event.type,event);if(event.key)notify(event.key);}
      if(game.room!==lastRoom){lastRoom=game.room;save();render();}
      if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='won'){endingTime=0;mode='ending';modal=null;input.left=input.right=false;scene?.setEndingMode?.(0,game.rooms.filter(r=>r.rescued).length);try{localStorage.removeItem(SAVE);saved=null;}catch{}render();}else if(game.phase==='lost'){modal='lost';mode='paused';render();}}
      saveClock+=dt;if(saveClock>2){save();saveClock=0;}updateHUD();audio.update(game,dt);
    }
    if(toastClock>0){toastClock-=dt;if(toastClock<=0)toast.classList.remove('visible');}
    if(mode==='ending'){endingTime+=dt;const count=game.rooms.filter(r=>r.rescued).length;scene?.setEndingMode?.(endingTime,count);const line=ui.querySelector('[data-hud=ending-line]');if(line){const text=tr(endingTime<2?'endingBell':endingTime<3?'endingQuiet':count===0?'endingQuiet':count===1?'endingOneVoice':'endingTwoVoices');if(line.textContent!==text)line.textContent=text;}audio.update(game,dt);if(endingTime>=8)finishEnding();}
    scene?.update(game,(mode==='paused'||mode==='error')?0:dt);
    if(mode==='game')updateBodyIndicator();
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  const api={start,pause,resume,destroy(){destroyed=true;save();cancelAnimationFrame(frame);viewportObserver.disconnect();abort.abort();scene?.destroy();audio.destroy();container.innerHTML='';container.classList.remove('otherself');},getState:()=>game,getMode:()=>mode};
  // Explicit development-only hook for deterministic browser acceptance tests.
  if(import.meta.env.DEV)window.__OTHERSELF__=api;
  return api;
}

