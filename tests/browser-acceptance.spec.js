import {test,expect} from '@playwright/test';
import {createGame,checkpoint,serialize} from '../src/engine.js';
import {t} from '../src/i18n.js';
import {state,capturePage,moveTo,possessRole} from './support/browser-game.js';

// These fixtures isolate presentation/persistence. Complete routes are tested separately with real input.
async function restoreFixture(page,game,lang='en'){
  const saved=serialize(game);
  await page.addInitScript(({saved,lang})=>{
    if(sessionStorage.getItem('otherself.qaSeed'))return;
    localStorage.setItem('otherself.save.v1',saved);
    localStorage.setItem('otherself.preferences.v1',JSON.stringify({lang,quality:'low',music:0,effects:0,muted:true,reducedMotion:true}));
    sessionStorage.setItem('otherself.qaSeed','1');
  },{saved,lang});
  await page.goto('./');await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await page.evaluate(()=>document.fonts.ready);await page.locator('[data-command=continue]').click();await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
}
function endingFixture(count){
  const s=createGame();s.room=3;s.nim.x=34;s.nim.facing=1;s.visits=[true,true,true,true];
  s.rooms.forEach(r=>{r.gateOpen=true;});s.rooms[1].rescued=count>=1;s.rooms[2].rescued=count===2;checkpoint(s);return s;
}

test.describe('presentation and saved-state acceptance',()=>{
  test.use({viewport:{width:640,height:360},deviceScaleFactor:.5});
  for(const lang of ['ru','en','he'])for(const count of [0,1,2]){
    test(`${lang} ending ${count}: distinct localized result, skippable cinematic and readable modal`,async({page})=>{
      await restoreFixture(page,endingFixture(count),lang);
      await page.keyboard.press('KeyE');
      await expect(page.locator('#app')).toHaveAttribute('data-mode','ending');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('[data-command=finishEnding]')).toContainText(t(lang,'skipEnding'));
      await page.locator('[data-command=finishEnding]').click();
      const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
      await expect(dialog.locator('h2')).toHaveText(t(lang,`ending${count}title`));
      await expect(dialog.locator('.dialog-body')).toContainText(t(lang,`ending${count}body`));
      expect(await dialog.evaluate(el=>el.scrollTop)).toBe(0);
      const heading=await dialog.locator('h2').boundingBox();const panel=await dialog.boundingBox();
      expect(heading.y).toBeGreaterThanOrEqual(panel.y);expect(heading.y+heading.height).toBeLessThanOrEqual(panel.y+panel.height);
      await expect(page.locator('.toast')).not.toBeVisible();
      await expect(dialog.locator('a[href^="mailto:support@kikkey.com"]')).toHaveCount(1);
      await expect(dialog.locator('a[href^="https://wa.me/972538259813"]')).toHaveCount(1);
      await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
      await capturePage(page,`acceptance-${lang}-ending${count}`);
    });
  }
  test('ending waits for its scene, pauses, switches language, then completes naturally',async({page})=>{
    test.setTimeout(120000);
    await restoreFixture(page,endingFixture(1),'en');await page.keyboard.press('KeyE');
    await expect(page.locator('#app')).toHaveAttribute('data-mode','ending');
    await page.locator('[data-command=pause]').click();
    const paused=await state(page);await page.waitForTimeout(500);expect((await state(page)).time).toBe(paused.time);
    await page.locator('[data-command=resume]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','ending');
    await page.locator('[data-pref=lang]').selectOption('he');
    await expect(page.locator('#app')).toHaveAttribute('dir','rtl');
    await expect(page.locator('[data-command=finishEnding]')).toBeVisible();
    await expect(page.locator('.ending-caption')).toContainText(t('he','endingOneVoice'),{timeout:30000});
    await expect(page.getByRole('dialog')).toBeVisible({timeout:60000});
    await expect(page.getByRole('dialog').locator('h2')).toHaveText(t('he','ending1title'));
  });
  test('language switching and reload preserve the carrier, body, guards and running mechanism',async({page})=>{
    const game=createGame();game.room=1;game.visits[1]=true;game.nim.x=10.6;game.nim.facing=1;
    game.rooms[1].guards[0].x=15.5;game.rooms[1].guards[0].facing=1;
    game.rooms[1].guards[1].x=17;checkpoint(game);game.controlled=game.rooms[1].guards[1].id;
    await restoreFixture(page,game,'en');await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).rooms[1].mechanism.active).toBe(true);
    const before=await state(page);await page.locator('[data-pref=lang]').selectOption('he');
    const after=await state(page);expect(after.controlled).toBe(before.controlled);expect(after.nim).toEqual(before.nim);
    expect(after.rooms[1].guards[1].x).toBe(before.rooms[1].guards[1].x);
    await page.locator('[data-command=pause]').click();const saved=await state(page);
    expect(saved.rooms[1].mechanism.progress).toBeGreaterThan(0);expect(saved.rooms[1].mechanism.active).toBe(true);
    const savedJSON=await page.evaluate(()=>localStorage.getItem('otherself.save.v1'));
    await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
    await expect(page.locator('[data-pref=lang]')).toHaveValue('he');
    expect(await page.evaluate(()=>localStorage.getItem('otherself.save.v1'))).toBe(savedJSON);
    await page.locator('[data-command=continue]').click();await page.locator('[data-command=pause]').click();
    const restored=await state(page);expect(restored.controlled).toBe(saved.controlled);expect(restored.nim).toEqual(saved.nim);
    expect(restored.rooms[1].guards[1].x).toBe(saved.rooms[1].guards[1].x);
    expect(restored.rooms[1].mechanism.progress).toBeGreaterThanOrEqual(saved.rooms[1].mechanism.progress);
    expect(restored.rooms[1].guards[0].investigate).toBe(saved.rooms[1].guards[0].investigate);
    await page.locator('[data-command=resume]').click();await page.keyboard.press('KeyQ');
    await expect.poll(async()=>(await state(page)).controlled).toBeNull();
    await expect.poll(async()=>(await state(page)).rooms[1].bridgeOpen,{timeout:30000}).toBe(true);
  });
  test('glass blocks the visible employee until Nim crawls to the real opening',async({page})=>{
    const game=createGame();game.room=2;game.visits[2]=true;game.nim.x=4.5;game.nim.facing=1;checkpoint(game);
    await restoreFixture(page,game,'en');await page.keyboard.press('KeyQ');
    await expect(page.locator('.toast')).toHaveText(t('en','targetBlockedGlass'));
    expect((await state(page)).controlled).toBeNull();
    await capturePage(page,'acceptance-blocked-glass');
    await moveTo(page,6.6);await possessRole(page,'keeper');
    expect((await state(page)).controlled).toBe('r2-keeper');
  });
  function threatenedBody(){
    const game=createGame();game.room=1;game.visits[1]=true;game.nim.x=10.6;game.rooms[1].gateOpen=true;
    game.rooms[1].guards[0].x=11.8;game.rooms[1].guards[0].facing=1;
    game.rooms[1].guards[1].x=30;checkpoint(game);game.nim.x=12.5;game.controlled='r1-tech';return game;
  }
  test('offscreen body warning allows an immediate return and escape before detention',async({page})=>{
    await restoreFixture(page,threatenedBody(),'en');
    await expect(page.locator('.body-indicator')).toBeVisible();
    await expect.poll(()=>page.locator('.body-indicator progress').evaluate(el=>el.value)).toBeGreaterThan(.1);
    await page.keyboard.press('KeyQ');await moveTo(page,10.6);
    await expect.poll(async()=>(await state(page)).rooms[1].guards[0].alert).toBe(0);
    expect((await state(page)).phase).toBe('playing');expect((await state(page)).controlled).toBeNull();
  });
  test('discovered abandoned body gives the specific cause and restores the safe checkpoint',async({page})=>{
    await restoreFixture(page,threatenedBody(),'he');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(t('he','lostBody'));
    expect((await state(page)).loss.key).toBe('bodyFound');await capturePage(page,'acceptance-body-found-final');
    await page.locator('[data-command=retry]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
    expect((await state(page)).nim.x).toBe(10.6);expect((await state(page)).controlled).toBeNull();
  });

});
