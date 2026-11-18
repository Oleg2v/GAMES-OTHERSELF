import {test,expect} from '@playwright/test';
import {createGame,checkpoint,serialize} from '../src/engine.js';
import {load,start,lowQuality,state,capturePage} from './support/browser-game.js';
import {held,walk,climbTo,setCrouch} from './support/v2-route.js';

const browserErrors=new WeakMap();
test.beforeEach(async({page})=>{
  const errors=[];browserErrors.set(page,errors);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
});
test.afterEach(async({page})=>{expect(browserErrors.get(page)).toEqual([]);});

// Isolated saves below test input/persistence. The complete route starts a new game.
async function fixture(page,game,lang='en'){
  checkpoint(game);
  await page.addInitScript(({saved,lang})=>{
    if(sessionStorage.getItem('otherself.v2fixture'))return;
    localStorage.setItem('otherself.save.v1',saved);
    localStorage.setItem('otherself.preferences.v1',JSON.stringify({lang,quality:'low',music:0,effects:0,muted:true,reducedMotion:true}));
    sessionStorage.setItem('otherself.v2fixture','1');
  },{saved:serialize(game),lang});
  await page.goto('./');await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.locator('[data-command=continue]').click();await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
}
async function pauseAndReload(page){
  await page.locator('[data-command=pause]').click();
  const before=await state(page),saved=await page.evaluate(()=>localStorage.getItem('otherself.save.v1'));
  await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  expect(await page.evaluate(()=>localStorage.getItem('otherself.save.v1'))).toBe(saved);
  await page.locator('[data-command=continue]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-mode','game');return before;
}

test.describe('v2 manual traversal and distraction',()=>{
  test.use({viewport:{width:640,height:360},deviceScaleFactor:.5});

  test('Space jumps without possession; a low passage requires an explicit crawl toggle',async({page})=>{
    await load(page);await lowQuality(page);await start(page);
    await page.keyboard.press('Space');
    await expect.poll(async()=>(await state(page)).nim.y).toBeGreaterThan(.3);
    expect((await state(page)).nim.grounded).toBe(false);expect((await state(page)).controlled).toBeNull();
    await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    const time=(await state(page)).time;
    await held(page,'KeyD',time=>window.__OTHERSELF__.getState().time>=time+.8,time);
    expect((await state(page)).nim.x).toBeLessThan(3);expect((await state(page)).nim.crouching).toBe(false);
    await page.keyboard.press('KeyC');await expect(page.locator('[data-command=crouch]')).toHaveAttribute('aria-pressed','true');
    await walk(page,5.8);expect((await state(page)).nim.crouching).toBe(true);
    await page.keyboard.press('KeyC');await expect(page.locator('[data-command=crouch]')).toHaveAttribute('aria-pressed','false');
    expect((await state(page)).nim.grounded).toBe(true);await capturePage(page,'v2-keyboard-crawl-passage');
  });

  test('W/S climb a real ladder, preserve a mid-ladder save and dismount at both ends',async({page})=>{
    const game=createGame();Object.assign(game.nim,{x:7,y:0,vy:0,grounded:true});
    await fixture(page,game);
    await held(page,'KeyW',()=>window.__OTHERSELF__.getState().nim.y>1);
    expect((await state(page)).nim.ladderId).toBe('r0-l1');
    const saved=await pauseAndReload(page),resumed=await state(page);
    expect(resumed.nim.ladderId).toBe(saved.nim.ladderId);expect(resumed.nim.y).toBeCloseTo(saved.nim.y,2);
    await held(page,'KeyW',()=>{const n=window.__OTHERSELF__.getState().nim;return n.y>=2.29&&n.grounded&&!n.ladderId;});
    expect((await state(page)).nim.y).toBeCloseTo(2.3,2);await capturePage(page,'v2-first-raised-deck');
    await held(page,'KeyS',()=>{const n=window.__OTHERSELF__.getState().nim;return n.y<=.01&&n.grounded&&!n.ladderId;});
    expect((await state(page)).nim.x).toBeCloseTo(7,1);
  });

  test('an airborne save preserves vertical motion and the picked-up object',async({page})=>{
    await load(page);await lowQuality(page);await start(page);
    await page.keyboard.press('KeyF');await expect.poll(async()=>(await state(page)).nim.heldItem?.id).toBeTruthy();
    const item=(await state(page)).nim.heldItem;
    await page.keyboard.press('Space');await expect.poll(async()=>(await state(page)).nim.y).toBeGreaterThan(.25);
    const saved=await pauseAndReload(page),resumed=await state(page);
    expect(saved.nim.grounded).toBe(false);expect(saved.nim.y).toBeGreaterThan(0);expect(Number.isFinite(saved.nim.vy)).toBe(true);
    expect(resumed.nim.heldItem).toEqual(item);expect(resumed.nim.y).toBeGreaterThan(0);
    await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    expect((await state(page)).nim.y).toBeCloseTo(0,2);expect((await state(page)).nim.heldItem).toEqual(item);
  });

  test('F throws a persistent object; the guard investigates its actual landing point',async({page})=>{
    const game=createGame();Object.assign(game.nim,{x:9,y:2.3,vy:0,grounded:true,facing:1});
    const item=game.rooms[0].items[0];item.available=false;game.nim.heldItem={id:item.id,kind:item.kind};
    Object.assign(game.rooms[0].guards[0],{x:13,y:2.3,facing:1});
    await fixture(page,game);await page.keyboard.press('KeyF');
    await expect.poll(async()=>(await state(page)).rooms[0].projectiles.length).toBe(1);
    expect((await state(page)).nim.heldItem).toBeNull();
    const saved=await pauseAndReload(page);
    expect(saved.rooms[0].projectiles).toHaveLength(1);
    await expect.poll(async()=>{const r=(await state(page)).rooms[0];return r.noises.length>0&&r.guards[0].investigate!==null;}).toBe(true);
    await page.locator('[data-command=pause]').click();
    const impact=(await state(page)).rooms[0],noise=impact.noises.at(-1),target=impact.guards[0].investigate;
    expect(target.x).toBeCloseTo(noise.x,2);expect(target.y).toBeCloseTo(noise.y,2);
    expect(Math.abs(target.x-9)).toBeGreaterThan(2);expect(target.y).toBeGreaterThan(2);
    expect(impact.items.find(i=>i.id===item.id).available).toBe(true);
    expect(impact.projectiles).toHaveLength(0);
    await page.locator('[data-command=resume]').click();
    await expect.poll(async()=>(await state(page)).rooms[0].guards[0].inspect).toBeGreaterThan(0);
    const investigating=(await state(page)).rooms[0].guards[0];
    expect(Math.abs(investigating.x-target.x)).toBeLessThan(.25);
    expect(Math.abs(investigating.y-target.y)).toBeLessThan(.1);
    await capturePage(page,'v2-object-impact-investigation');
  });

  test('held movement survives a room render, pause clears it, and mouse retry restores keyboard focus',async({page})=>{
    test.setTimeout(180000);
    const game=createGame();Object.assign(game.nim,{x:33.9,y:2.3,vy:0,grounded:true});game.rooms[0].gateOpen=true;
    await fixture(page,game);
    const action=await page.locator('[data-command=action]').boundingBox();
    await page.mouse.move(action.x+action.width/2,action.y+action.height/2);
    await page.keyboard.down('KeyD');
    try{
      await page.mouse.click(action.x+action.width/2,action.y+action.height/2);
      await expect(page.locator('.room-index')).toContainText('02');
      expect((await state(page)).room).toBe(1);
      expect(await page.evaluate(()=>document.activeElement===document.querySelector('#app'))).toBe(true);
      await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(2.1);
      await page.keyboard.press('KeyC');await page.locator('[data-command=pause]').click();
      const paused=await state(page);await page.locator('[data-command=resume]').click();
      await page.waitForFunction(time=>window.__OTHERSELF__.getState().time>time+.3,paused.time);
      expect((await state(page)).nim.x).toBeCloseTo(paused.nim.x,4);
    }finally{await page.keyboard.up('KeyD');}
    await setCrouch(page,true);await walk(page,5.8);await setCrouch(page,false);
    await walk(page,8);await climbTo(page,2.3);await walk(page,10.5);
    await expect(page.getByRole('dialog')).toBeVisible({timeout:60000});
    expect((await state(page)).phase).toBe('lost');
    await page.locator('[data-command=retry]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
    expect(await page.evaluate(()=>document.activeElement===document.querySelector('#app'))).toBe(true);
    const retryX=(await state(page)).nim.x;
    await page.keyboard.down('KeyD');
    try{await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(retryX+.15);}
    finally{await page.keyboard.up('KeyD');}
  });
});

test('an active detection warning remains readable when a throw emits a transient toast',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const game=createGame();Object.assign(game.nim,{x:9,y:2.3,vy:0,grounded:true,facing:1});
  Object.assign(game.rooms[0].guards[0],{x:11.5,y:2.3,facing:-1});
  const item=game.rooms[0].items[0];item.available=false;game.nim.heldItem={id:item.id,kind:item.kind};
  await fixture(page,game,'he');
  await expect(page.locator('.danger-banner')).toBeVisible();await page.keyboard.press('KeyF');
  await expect(page.locator('.danger-banner')).toBeVisible();await expect(page.locator('.toast')).not.toBeVisible();
  expect((await state(page)).phase).toBe('playing');await capturePage(page,'v2-he-danger-warning-clear');
});

test('Hebrew touch controls support two-finger running/jumping, crawl, items and ladder directions',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:390,height:844});await load(page,'he');await lowQuality(page);
  await page.locator('[data-command=help]').click();
  for(const key of ['Space','C','W S','F','Q'])await expect(page.getByRole('dialog').locator('kbd').filter({hasText:new RegExp(`^${key}$`)})).toBeVisible();
  await page.locator('[data-command=close]').click();await start(page);
  const badTargets=await page.locator('.controls-v2 button').evaluateAll(elements=>elements.flatMap(el=>{
    const r=el.getBoundingClientRect();return r.width<43.9||r.height<43.9||r.left<0||r.right>innerWidth||r.bottom>innerHeight?[{control:el.dataset.command||el.dataset.move,rect:r.toJSON()}]:[];
  }));expect(badTargets).toEqual([]);
  expect((await page.locator('.movement').boundingBox()).x).toBeLessThan((await page.locator('.actions').boundingBox()).x);
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await page.evaluate(()=>{window.__qaPointerEvents=[];for(const kind of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(kind,e=>window.__qaPointerEvents.push({kind,id:e.pointerId,control:e.target.closest('button')?.dataset.move||e.target.closest('button')?.dataset.command}),true);});
  async function point(selector,id){const box=await page.locator(selector).boundingBox();return {id,x:box.x+box.width/2,y:box.y+box.height/2};}
  async function tap(selector){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point(selector,1)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  async function touchUntil(selector,condition){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point(selector,1)]});
    try{await page.waitForFunction(condition,null,{timeout:45000,polling:30});}
    finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  }
  try{
    // Leave enough clear runway for a simultaneous-input assertion before the duct wall.
    await touchUntil('[data-move=left]',()=>window.__OTHERSELF__.getState().nim.x<=.7);
    const initial=(await state(page)).nim.x,right=await point('[data-move=right]',1);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});
    await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(initial+.1);
    const jumpContact=await point('[data-command=jump]',2);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,jumpContact]});
    await expect.poll(async()=>(await state(page)).nim.y).toBeGreaterThan(.25);
    // Chromium ends the listed contact IDs; keep the first finger on right.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[jumpContact]});
    expect(await page.evaluate(()=>window.__qaPointerEvents.filter(e=>e.kind==='pointerup').at(-1)?.control)).toBe('jump');
    const afterJumpFinger=(await state(page)).nim.x;
    await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(afterJumpFinger+.05);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    await tap('[data-command=crouch]');await expect(page.locator('[data-command=crouch]')).toHaveAttribute('aria-pressed','true');
    await tap('[data-command=crouch]');await expect(page.locator('[data-command=crouch]')).toHaveAttribute('aria-pressed','false');
    await tap('[data-command=throw]');await expect.poll(async()=>(await state(page)).nim.heldItem).not.toBeNull();
    await tap('[data-command=crouch]');
    await touchUntil('[data-move=right]',()=>window.__OTHERSELF__.getState().nim.x>=5.8);
    await tap('[data-command=crouch]');
    await touchUntil('[data-move=right]',()=>window.__OTHERSELF__.getState().nim.x>=7);
    await touchUntil('[data-move=up]',()=>window.__OTHERSELF__.getState().nim.y>=1.1);
    expect((await state(page)).nim.ladderId).toBe('r0-l1');
    await touchUntil('[data-move=down]',()=>window.__OTHERSELF__.getState().nim.y<=.35);
    await tap('[data-command=throw]');await expect.poll(async()=>(await state(page)).nim.heldItem).toBeNull();
    await capturePage(page,'v2-he-mobile-touch-ladder');
  }finally{await cdp.detach();}
});
