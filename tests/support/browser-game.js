import {expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
export const capture='/tmp/otherself-qa';
export const state=page=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__OTHERSELF__.getState())));
export async function load(page,lang='en'){
  await page.goto(`./?lang=${lang}`);
  await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
  await expect(page.locator('.world canvas')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
}
export async function start(page){await page.locator('[data-command="start"]').click();await expect(page.locator('#app')).toHaveAttribute('data-mode','game');}
export async function capturePage(page,name){await mkdir(capture,{recursive:true});await page.screenshot({path:`${capture}/${name}.png`});}
export async function moveTo(page,x){
  const s=await state(page),a=s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled):s.nim;
  if(Math.abs(a.x-x)<.12)return;
  const direction=x>a.x?1:-1,key=direction>0?'KeyD':'KeyA';
  await page.locator('#app').focus();await page.keyboard.down(key);
  try{await page.waitForFunction(({x,direction})=>{
    const s=window.__OTHERSELF__.getState(),a=s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled):s.nim;
    if(s.phase!=='playing')throw new Error(`Unexpected ${s.phase}: ${JSON.stringify(s.loss)}`);
    return direction>0?a.x>=x:a.x<=x;
  },{x,direction},{timeout:90000,polling:50});}finally{if(!page.isClosed())await page.keyboard.up(key);}
}
export async function possessRole(page,role){
  await page.locator('#app').focus();
  if((await state(page)).nim.facing!==1){await page.keyboard.down('KeyD');await page.waitForFunction(()=>window.__OTHERSELF__.getState().nim.facing===1);await page.keyboard.up('KeyD');}
  await expect.poll(async()=>page.evaluate(async()=>{
    const {getTargetInfo}=await import(new URL('src/engine.js',document.baseURI).href);
    const s=window.__OTHERSELF__.getState();if(s.phase!=='playing')throw new Error(JSON.stringify(s.loss));
    const info=getTargetInfo(s);return info?.eligible&&info.distance<=5.2?info.target.role:null;
  }),{timeout:90000}).toBe(role);
  await page.keyboard.press('KeyQ');
  await expect.poll(async()=>{const s=await state(page);return s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled)?.role:null;},{timeout:30000}).toBe(role);
}
export async function release(page){await page.keyboard.press('KeyQ');await expect.poll(async()=>(await state(page)).controlled).toBeNull();}
export async function lowQuality(page){await page.locator('[data-command="settings"]').click();await page.locator('[data-pref="quality"]').selectOption('low');await page.locator('[data-command="close"]').click();}
