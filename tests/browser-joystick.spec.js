import {test,expect} from '@playwright/test';
import {createGame,checkpoint,serialize,PHYSICS} from '../src/engine.js';
import {state,capturePage} from './support/browser-game.js';
import {joystickGeometry,touchController} from './support/joystick.js';

const errors=new WeakMap();
test.beforeEach(async({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));page.on('console',m=>{if(m.type()==='error')list.push(m.text());});});
test.afterEach(async({page})=>{expect(errors.get(page)).toEqual([]);});

async function savedStart(page,{x=27.2,y=0,lang='en'}={}){
  const game=createGame();Object.assign(game.nim,{x,y,vy:0,grounded:true});game.rooms[0].gateOpen=true;checkpoint(game);
  await page.addInitScript(({saved,lang})=>{
    localStorage.setItem('otherself.save.v1',saved);
    localStorage.setItem('otherself.preferences.v1',JSON.stringify({lang,quality:'low',muted:true,music:0,effects:0,reducedMotion:true}));
  },{saved:serialize(game),lang});
  await page.goto('./');await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.locator('[data-command=continue]').click();await expect(page.locator('[data-joystick]')).toBeVisible();
}
async function elapsed(page,seconds){const before=await state(page);await page.waitForFunction(({time,seconds})=>window.__OTHERSELF__.getState().time>=time+seconds,{time:before.time,seconds});return {before,after:await state(page)};}
async function horizontalSpeed(page){const {before,after}=await elapsed(page,.35);return (after.nim.x-before.nim.x)/(after.time-before.time);}
async function stationary(page,axis='x'){const {before,after}=await elapsed(page,.3);expect(after.nim[axis]).toBeCloseTo(before.nim[axis],4);}
async function knobDistance(page){return page.locator('[data-joystick]').evaluate(base=>{const b=base.getBoundingClientRect(),k=base.querySelector('.joystick-stick').getBoundingClientRect();return Math.hypot(k.x+k.width/2-b.x-b.width/2,k.y+k.height/2-b.y-b.height/2);});}
async function mouseStick(page,x,y){const g=await joystickGeometry(page);await page.mouse.move(g.x,g.y);await page.mouse.down();await page.mouse.move(g.x+x*g.radius,g.y+y*g.radius,{steps:3});return g;}

test.describe('virtual joystick input',()=>{
  test.use({viewport:{width:390,height:844},deviceScaleFactor:.5});

  test('radial deadzone has no drift; horizontal speed is proportional and clamps outside the base',async({page})=>{
    await savedStart(page);
    const g=await mouseStick(page,.1,0);await stationary(page);
    await page.mouse.move(g.x+g.radius*.5,g.y,{steps:3});const partial=await horizontalSpeed(page);
    expect(partial).toBeCloseTo(PHYSICS.walkSpeed*(.5-.18)/.82,1);
    await page.mouse.move(g.x+g.radius,g.y,{steps:3});const full=await horizontalSpeed(page);
    expect(full).toBeCloseTo(PHYSICS.walkSpeed,1);expect(full).toBeGreaterThan(partial*2);
    await page.mouse.move(g.x+g.radius*3,g.y,{steps:3});
    expect(await horizontalSpeed(page)).toBeCloseTo(PHYSICS.walkSpeed,1);
    expect(await knobDistance(page)).toBeLessThanOrEqual(g.radius+1);
    await page.keyboard.down('KeyA');expect(await horizontalSpeed(page)).toBeCloseTo(-PHYSICS.walkSpeed,1);
    await page.keyboard.up('KeyA');expect(await horizontalSpeed(page)).toBeCloseTo(PHYSICS.walkSpeed,1);
    await page.mouse.up();await stationary(page);await expect.poll(()=>knobDistance(page)).toBeLessThan(1);
  });

  test('one touch owns the stick; another contact and cancellation cannot leave movement stuck',async({page})=>{
    await savedStart(page);const touch=await touchController(page);
    try{
      const g=await touch.stick(1,0);await expect.poll(()=>horizontalSpeed(page)).toBeGreaterThan(3);
      await touch.begin({id:2,x:g.x-g.radius,y:g.y});
      expect(await horizontalSpeed(page)).toBeGreaterThan(3);
      await touch.end(2);expect(await horizontalSpeed(page)).toBeGreaterThan(3);
      await touch.cancel();await stationary(page);await expect.poll(()=>knobDistance(page)).toBeLessThan(1);
      await touch.stick(-1,0);expect(await horizontalSpeed(page)).toBeLessThan(-3);await touch.end(1);await stationary(page);
    }finally{await touch.detach();}
  });

  test('vertical deflection climbs both ways; dominant-axis hysteresis prevents small diagonal jitter',async({page})=>{
    await savedStart(page,{x:7});const g=await mouseStick(page,0,-1);
    await expect.poll(async()=>(await state(page)).nim.y).toBeGreaterThan(.7);
    expect((await state(page)).nim.ladderId).toBe('r0-l1');
    await page.mouse.move(g.x+g.radius*.75,g.y-g.radius*.7,{steps:3});
    const {before,after}=await elapsed(page,.25);
    expect(after.nim.y).toBeGreaterThan(before.nim.y);expect(after.nim.x).toBeCloseTo(7,3);
    await page.mouse.move(g.x,g.y,{steps:3});await stationary(page,'y');
    await page.mouse.move(g.x,g.y+g.radius,{steps:3});
    await expect.poll(async()=>(await state(page)).nim.y).toBeLessThan(.1);
    await page.mouse.up();await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    await capturePage(page,'joystick-ladder-portrait');
  });

  test('pause and resize cancel a held stick and stale pointer movement cannot restart it',async({page})=>{
    await savedStart(page);let g=await mouseStick(page,1,0);
    expect(await horizontalSpeed(page)).toBeGreaterThan(3);
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
    await stationary(page);await page.mouse.move(g.x+g.radius*.8,g.y,{steps:3});await stationary(page);await page.mouse.up();
    g=await mouseStick(page,1,0);expect(await horizontalSpeed(page)).toBeGreaterThan(3);
    await page.setViewportSize({width:844,height:390});await stationary(page);
    const resized=await joystickGeometry(page);await page.mouse.move(resized.x+resized.radius,resized.y,{steps:3});await stationary(page);await page.mouse.up();
    await mouseStick(page,-1,0);expect(await horizontalSpeed(page)).toBeLessThan(-3);await page.mouse.up();
    await expect.poll(()=>knobDistance(page)).toBeLessThan(1);await capturePage(page,'joystick-landscape-reset');
  });

  test('captured stick movement survives room and language renders and remains physically left in RTL',async({page})=>{
    await savedStart(page,{x:33.9,y:2.3});const touch=await touchController(page);
    try{
      await touch.stick(1,0);await page.keyboard.press('KeyE');
      await expect(page.locator('.room-index')).toContainText('02');
      await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(2.1);
      await page.keyboard.press('KeyC');await page.locator('[data-pref=lang]').selectOption('he');
      await expect(page.locator('#app')).toHaveAttribute('dir','rtl');
      const x=(await state(page)).nim.x;await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(x+.1);
      const joystick=await page.locator('[data-joystick]').boundingBox(),jump=await page.locator('[data-command=jump]').boundingBox();
      expect(joystick.x+joystick.width/2).toBeLessThan(jump.x+jump.width/2);
      expect(await knobDistance(page)).toBeGreaterThan(5);
      await touch.end(1);await stationary(page);await expect.poll(()=>knobDistance(page)).toBeLessThan(1);
      await capturePage(page,'joystick-rtl-room-continuity');
    }finally{await touch.detach();}
  });
});
