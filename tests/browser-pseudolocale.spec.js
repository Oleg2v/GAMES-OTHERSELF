import {test,expect} from '@playwright/test';
import {load,start,capturePage} from './support/browser-game.js';

async function visibleAndUnclipped(page,selector,{touch=false}={}){
  const defects=await page.locator(selector).evaluateAll((elements,touch)=>elements.flatMap(el=>{
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return [];
    const outside=r.left < -1||r.top < -1||r.right>innerWidth+1||r.bottom>innerHeight+1;
    const small=touch&&(r.width<43.9||r.height<43.9);
    const clipped=el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1;
    return outside||small||clipped?[{text:el.textContent.trim(),outside,small,clipped,rect:r.toJSON()}]:[];
  }),touch);
  expect(defects).toEqual([]);
}

for(const [width,height] of [[360,640],[844,390]])for(const lang of ['ru','he']){
  test(`pseudolocalization ${lang} ${width}×${height}: expanded objective, controls and help stay usable`,async({page})=>{
    await page.setViewportSize({width,height});await load(page,lang);
    await visibleAndUnclipped(page,'.start-row button,header button,header select',{touch:true});
    // Change only the test page's dictionary, preserving all live engine behavior.
    // This exercises the authored QA expansion helper through normal UI rendering.
    await page.evaluate(async lang=>{
      const moduleURL=performance.getEntriesByType('resource').find(entry=>new URL(entry.name).pathname.endsWith('/src/i18n.js'))?.name;
      const {translations,pseudo}=await import(moduleURL||new URL('src/i18n.js',document.baseURI));
      for(const key of Object.keys(translations[lang]))translations[lang][key]=pseudo(translations[lang][key]);
    },lang);
    await page.locator('[data-pref=lang]').selectOption('en');
    await page.locator('[data-pref=lang]').selectOption(lang);
    await expect(page.locator('[data-command=start]')).toContainText('［');
    await visibleAndUnclipped(page,'.start-row button,header button,header select',{touch:true});
    await page.locator('[data-command=help]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('h2')).toContainText('［');
    const dialogWidth=await page.getByRole('dialog').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
    expect(dialogWidth.scroll).toBeLessThanOrEqual(dialogWidth.client+1);
    await capturePage(page,`pseudo-${lang}-${width}x${height}-help`);
    const close=page.locator('[data-command=close]');await close.scrollIntoViewIfNeeded();
    await visibleAndUnclipped(page,'[data-command=close]',{touch:true});await close.click();
    await start(page);
    await visibleAndUnclipped(page,'.game-header button,.game-header select,.game-bottom button',{touch:true});
    await visibleAndUnclipped(page,'.game-objective,.tutorial-card,.hint');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await capturePage(page,`pseudo-${lang}-${width}x${height}`);
    await page.locator('[data-command=pause]').click();
    await visibleAndUnclipped(page,'[data-command=resume]',{touch:true});
    await page.locator('[data-command=resume]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
  });
}
