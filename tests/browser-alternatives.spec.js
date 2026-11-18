import {test,expect} from '@playwright/test';
import {createGame,checkpoint,serialize,ROOMS} from '../src/engine.js';
import {state,moveTo,capturePage} from './support/browser-game.js';

// Isolated role/mechanism fixtures. Fresh-start, input-driven episode routes live
// in browser.spec.js; these cases do not claim an additional full playthrough.
async function technicianFixture(page,roomIndex){
  const game=createGame(),spec=ROOMS[roomIndex];
  game.room=roomIndex;game.visits[roomIndex]=true;
  game.nim.x=roomIndex===2?15:14;game.nim.y=4.8;
  // This reachable setup follows the earlier keeper possession: leave that
  // worker beside the entry ladder, facing away, before borrowing the tech.
  // His normal recovery, patrol, sight and hearing remain active throughout.
  if(roomIndex===3){
    const keeper=game.rooms[roomIndex].guards.find(g=>g.role==='keeper');
    keeper.x=6.4;keeper.facing=-1;keeper.recovery=2;
  }
  const tech=game.rooms[roomIndex].guards.find(g=>g.role==='tech');
  tech.x=spec.consoleX;tech.y=spec.consoleY;
  checkpoint(game);game.controlled=tech.id;
  await page.addInitScript(saved=>{
    localStorage.setItem('otherself.save.v1',saved);
    localStorage.setItem('otherself.preferences.v1',JSON.stringify({lang:'en',quality:'low',muted:true,reducedMotion:true}));
  },serialize(game));
  await page.goto('./');await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.locator('[data-command=continue]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
}

test.describe('isolated vertical technician alternatives',()=>{
  test.use({viewport:{width:640,height:360},deviceScaleFactor:.5});
  for(const roomIndex of [1,3]){
    test(`${ROOMS[roomIndex].key}: released mechanism opens a real upper span, crossed both ways above the closed door`,async({page})=>{
      test.setTimeout(180000);
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await technicianFixture(page,roomIndex);
      await page.keyboard.press('KeyE');
      await expect.poll(async()=>(await state(page)).rooms[roomIndex].mechanism.active).toBe(true);
      await moveTo(page,roomIndex===1?13.3:12.4);
      await page.keyboard.press('KeyQ');
      await expect.poll(async()=>(await state(page)).controlled).toBeNull();
      await moveTo(page,25.5);
      let current=await state(page);
      expect(current.rooms[roomIndex].bridgeOpen).toBe(true);
      expect(current.nim.y).toBeCloseTo(4.8,2);expect(current.nim.grounded).toBe(true);
      expect(current.rooms[roomIndex].gateOpen).toBe(false);
      await capturePage(page,`v2-alternative-${roomIndex}-far-side`);
      // Secure the return path through possession instead of walking into the
      // recovered technician's sight for longer than the detection interval.
      await moveTo(page,24.6);
      await expect.poll(()=>page.evaluate(async()=>{
        const {getTarget}=await import(new URL('src/engine.js',document.baseURI).href);
        return getTarget(window.__OTHERSELF__.getState())?.role;
      }),{timeout:90000,intervals:[100]}).toBe('tech');
      await page.keyboard.press('KeyQ');
      await expect.poll(async()=>(await state(page)).controlled).toBe(`r${roomIndex}-tech`);
      await moveTo(page,roomIndex===1?13.3:12.4);await page.keyboard.press('KeyQ');
      await expect.poll(async()=>(await state(page)).controlled).toBeNull();
      await moveTo(page,14);
      current=await state(page);
      expect(current.nim.y).toBeCloseTo(4.8,2);expect(current.nim.grounded).toBe(true);
      expect(current.rooms[roomIndex].gateOpen).toBe(false);expect(current.phase).toBe('playing');
      expect(errors).toEqual([]);
    });
  }
  test('garden: cart finishes after release and its opened lower door can be crossed both ways',async({page})=>{
    test.setTimeout(180000);
    await technicianFixture(page,2);
    await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).rooms[2].mechanism.active).toBe(true);
    await page.keyboard.press('KeyQ');
    await expect.poll(async()=>(await state(page)).rooms[2].gateOpen,{timeout:30000}).toBe(true);
    expect((await state(page)).rooms[2].cartX).toBe(24);
    await moveTo(page,20.8);
    await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    expect((await state(page)).nim.y).toBeCloseTo(0,2);
    await page.keyboard.press('KeyC');await moveTo(page,26.3);
    expect((await state(page)).nim.x).toBeGreaterThan(ROOMS[2].gateX);
    await moveTo(page,20.8);await page.keyboard.press('KeyC');
    expect((await state(page)).nim.x).toBeLessThan(ROOMS[2].gateX);
    expect((await state(page)).phase).toBe('playing');
    await capturePage(page,'v2-alternative-garden-return');
  });
});
