import {test,expect} from '@playwright/test';
test('required art failure shows recoverable error, not an endless loader',async({page})=>{
 await page.route('**/assets/nim.glb',r=>r.abort());
 await page.goto('/?lang=en');
 await expect(page.locator('#app')).toHaveAttribute('data-mode','error');
 await expect(page.locator('[data-command=reload]')).toBeVisible();
 await page.unroute('**/assets/nim.glb');
 await page.locator('[data-command=reload]').click();
 await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
});
test('storage denial and audio denial still allow a playable game',async({page})=>{
 await page.addInitScript(()=>{
  Storage.prototype.getItem=()=>{throw new DOMException('Unavailable','SecurityError')};
  Storage.prototype.setItem=()=>{throw new DOMException('Unavailable','SecurityError')};
  window.AudioContext=class{constructor(){throw new Error('Unavailable')}};
 });
 await page.goto('/?lang=en');await page.locator('[data-command=start]').click();
 await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
 await expect(page.locator('.world canvas')).toBeVisible();
});
test('resize retains game and context loss offers retry',async({page})=>{
 await page.goto('/?lang=en');await page.locator('[data-command=start]').click();
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.locator('canvas').evaluate(el=>el.width/el.height)).toBeCloseTo(390/844,2);
 await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
 await page.locator('canvas').evaluate(el=>el.dispatchEvent(new Event('webglcontextlost',{cancelable:true,bubbles:false})));
 await expect(page.locator('#app')).toHaveAttribute('data-mode','error');
 await expect(page.locator('[data-command=reload]')).toBeVisible();
});
test('unavailable WebGL reaches an error screen with a retry control',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){return String(kind).startsWith('webgl')?null:original.call(this,kind,...args)};
 });
 await page.goto('/?lang=en');
 await expect(page.locator('#app')).toHaveAttribute('data-mode','error');
 await expect(page.locator('[data-command=reload]')).toBeVisible();
});
