import {test,expect} from '@playwright/test';
import {t} from '../src/i18n.js';

const deployment=process.env.DEPLOY_URL;
test.describe('production subpath deployment',()=>{
  test.skip(!deployment,'Set DEPLOY_URL to the built or published application URL, including its subpath.');
  test.use({viewport:{width:960,height:640},deviceScaleFactor:.5});
  test('bundled assets, possession and saved continuation work without development hooks',async({page})=>{
    test.setTimeout(120000);
    const url=new URL(deployment),prefix=url.pathname.endsWith('/')?url.pathname:`${url.pathname}/`;
    const errors=[],failed=[],assets=[],badResponses=[],external=[];
    page.on('request',request=>{const u=new URL(request.url());if(/^https?:$/.test(u.protocol)&&u.origin!==url.origin)external.push(u.href);});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('requestfailed',request=>failed.push(request.url()));
    page.on('response',response=>{
      const u=new URL(response.url());if(u.origin!==url.origin)return;
      if(/\.(?:m?js|css|woff2?|glb|gltf|png|webp)$/.test(u.pathname)){assets.push(u.pathname);if(response.status()>=400)badResponses.push([response.status(),u.pathname]);}
    });
    url.searchParams.set('lang','en');
    const response=await page.goto(url.href);expect(response?.status()).toBe(200);
    await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>typeof window.__OTHERSELF__)).toBe('undefined');
    expect(assets.some(p=>p.endsWith('/nim.glb'))).toBe(true);
    expect(assets.some(p=>p.endsWith('/sail.glb'))).toBe(true);
    expect(assets.some(p=>p.endsWith('.woff2'))).toBe(true);
    expect(assets.filter(p=>!p.startsWith(prefix))).toEqual([]);
    await page.locator('[data-command=settings]').click();await page.locator('[data-pref=quality]').selectOption('low');await page.locator('[data-command=close]').click();
    await page.locator('[data-command=start]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
    await page.keyboard.down('KeyD');await page.waitForTimeout(300);await page.keyboard.up('KeyD');
    await page.locator('[data-command=possess]').click();
    await expect(page.locator('[data-hud=body]')).toHaveText(t('en','keeper'),{timeout:30000});
    await page.locator('[data-command=pause]').click();
    const saved=await page.evaluate(()=>localStorage.getItem('otherself.save.v1'));expect(saved).toBeTruthy();
    await page.locator('[data-command=exit]').click();await page.reload();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
    await page.locator('[data-command=continue]').click();
    await expect(page.locator('[data-hud=body]')).toHaveText(t('en','keeper'));
    await page.locator('[data-command=pause]').click();
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('otherself.save.v1')));
    expect(restored.state.controlled).toBe(JSON.parse(saved).state.controlled);
    expect(restored.state.nim).toEqual(JSON.parse(saved).state.nim);
    await page.locator('[data-command=resume]').click();
    await page.locator('[data-pref=lang]').selectOption('he');
    await expect(page.locator('#app')).toHaveAttribute('dir','rtl');
    expect(new URL(page.url()).searchParams.get('lang')).toBe('he');
    await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
    await expect(page.locator('[data-pref=lang]')).toHaveValue('he');
    expect(await page.evaluate(()=>document.documentElement.lang)).toBe('he');
    expect(errors).toEqual([]);expect(failed).toEqual([]);expect(badResponses).toEqual([]);expect(external).toEqual([]);
  });
});
