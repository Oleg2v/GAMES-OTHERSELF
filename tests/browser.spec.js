import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {capture,state,load,start,capturePage,lowQuality} from './support/browser-game.js';
import {firstPossession,playEpisode} from './support/v2-route.js';
import {touchController} from './support/joystick.js';
async function controlsInViewport(page,selector){
  const outside=await page.locator(selector).evaluateAll(els=>els.filter(el=>{
    const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left < -1 || r.right > innerWidth+1 || r.top < -1 || r.bottom > innerHeight+1);
  }).map(el=>({text:el.textContent.trim(),rect:el.getBoundingClientRect().toJSON()})));
  expect(outside).toEqual([]);
}

test('desktop: movement, possession, language, pause and saved continuation',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await load(page);await capturePage(page,'desktop-menu');await lowQuality(page);await start(page);
  const initial=await state(page);
  await page.keyboard.down('KeyD');
  await expect.poll(async()=>(await state(page)).nim.x,{message:'Nim must advance while KeyD is held'}).toBeGreaterThan(initial.nim.x+.2);
  await page.keyboard.up('KeyD');
  await firstPossession(page);
  await expect.poll(async()=>(await state(page)).controlled).toBe('r0-keeper');
  const controlled=await state(page);
  await page.locator('[data-pref="lang"]').selectOption('he');
  await expect(page.locator('#app')).toHaveAttribute('dir','rtl');
  expect((await state(page)).controlled).toBe(controlled.controlled);
  expect((await state(page)).nim.x).toBeCloseTo(controlled.nim.x,5);
  const beforeMove=(await state(page)).rooms[0].guards[0].x;
  await page.keyboard.down('KeyD');
  await expect.poll(async()=>(await state(page)).rooms[0].guards[0].x).toBeGreaterThan(beforeMove+.1);
  await page.keyboard.up('KeyD');
  await page.locator('[data-command="pause"]').click();
  const paused=await state(page);await page.waitForTimeout(350);
  expect((await state(page)).time).toBe(paused.time);
  await page.locator('[data-command="settings"]').click();
  await page.locator('[data-pref="music"]').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  await page.locator('[data-command="close"]').click();
  await page.locator('[data-command="resume"]').click();
  await page.keyboard.press('KeyQ');
  await expect.poll(async()=>(await state(page)).controlled).toBeNull();
  await capturePage(page,'desktop-game-he');
  await page.keyboard.press('Escape');
  const beforeExit=await state(page);
  await page.locator('[data-command="exit"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.locator('[data-command="continue"]').click();
  expect((await state(page)).nim.x).toBeCloseTo(beforeExit.nim.x,5);
  expect((await state(page)).rooms[0].guards[0].x).toBeCloseTo(beforeExit.rooms[0].guards[0].x,0);
  expect(errors).toEqual([]);
});

for(const [width,height] of [[360,640],[390,844],[844,390],[768,1024],[1440,900]]){
  for(const lang of ['ru','en','he']){
    test(`${lang} ${width}×${height}: menu, help, controls and RTL layout`,async({page})=>{
      await page.setViewportSize({width,height});await load(page,lang);
      await controlsInViewport(page,'header button,header select,.start-row button,.menu-secondary button,footer button');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.locator('[data-command="help"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('[data-command="close"]').scrollIntoViewIfNeeded();
      await page.locator('[data-command="close"]').click();
      await start(page);
      await controlsInViewport(page,'.game-header button,.game-header select,.game-bottom button');
      await capturePage(page,`${lang}-${width}x${height}-game`);
      await page.locator('[data-command="pause"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('[data-command="resume"]').click();
      expect(await page.evaluate(()=>document.documentElement.dir)).toBe(lang==='he'?'rtl':'ltr');
    });
  }
}

test('emulated touch joystick works independently of RTL',async({page})=>{
  await page.setViewportSize({width:390,height:844});await load(page,'he');await start(page);
  const before=(await state(page)).nim.x;
  const touch=await touchController(page);
  try{
    await touch.stick(1,0);await expect.poll(async()=>(await state(page)).nim.x).toBeGreaterThan(before+.1);await touch.end(1);
    expect((await page.locator('[data-joystick]').boundingBox()).x).toBeLessThan((await page.locator('[data-command=jump]').boundingBox()).x);
    await capturePage(page,'he-390x844-joystick-final');
  }finally{await touch.detach();}
});

test.describe('reduced-raster software WebGL routes',()=>{
  test.use({deviceScaleFactor:0.5});
for(const lang of ['ru','en','he']){
  test(`full episode ${lang}: four vertical halls, two rescues, final bell via real input`,async({page})=>{
    test.setTimeout(600000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width:640,height:360});await load(page,lang);
    await page.locator('[data-command="settings"]').click();
    await page.locator('[data-pref="quality"]').selectOption('low');
    await page.locator('[data-command="close"]').click();await start(page);
    if(lang==='en'&&process.env.OTHERSELF_BENCHMARK==='1'){
      const performanceResult=await page.evaluate(()=>new Promise(resolve=>{
        const intervals=[];let previous=performance.now(),count=0;
        function sample(now){if(count++>30)intervals.push(now-previous);previous=now;if(count<151){requestAnimationFrame(sample);return;}intervals.sort((a,b)=>a-b);resolve({samples:intervals.length,meanMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,p95Ms:intervals[Math.floor(intervals.length*.95)],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,renderer:document.querySelector('canvas').getContext('webgl2').getParameter(7937)});}
        requestAnimationFrame(sample);
      }));
      await mkdir(capture,{recursive:true});await writeFile(`${capture}/performance.json`,JSON.stringify(performanceResult,null,2));console.log('Software WebGL frame timings:',JSON.stringify(performanceResult));
    }
    await playEpisode(page,{onRoom:async(room,game)=>{
      await capturePage(page,`${lang}-v2-room${room}-complete`);
      console.log(`${lang}: v2 hall ${room+1} complete at ${game.time.toFixed(1)} simulation seconds`);
    }});
    await expect.poll(async()=>(await state(page)).phase).toBe('won');
    expect((await state(page)).rooms.filter(r=>r.rescued).length).toBe(2);
    await expect(page.locator('#app')).toHaveAttribute('data-mode','ending');
    await page.locator('[data-command=finishEnding]').click();
    await expect(page.getByRole('dialog')).toBeVisible();await capturePage(page,`${lang}-ending-two`);
    expect(errors).toEqual([]);
    // Escape must not turn a terminal game into a frozen playing screen.
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeVisible();
  });
}

});
