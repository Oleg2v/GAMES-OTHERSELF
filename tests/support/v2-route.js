import {expect} from '@playwright/test';
import {state,possessRole,release} from './browser-game.js';

export async function held(page,key,condition,arg,timeout=45000){
  await page.locator('#app').focus();await page.keyboard.down(key);
  try{await page.waitForFunction(condition,arg,{timeout,polling:30});}
  finally{if(!page.isClosed())await page.keyboard.up(key);}
}
export async function walk(page,x,timeout=45000){
  const s=await state(page),a=s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled):s.nim;
  if(Math.abs(a.x-x)<.08)return;
  const direction=x>a.x?1:-1;
  await held(page,direction>0?'KeyD':'KeyA',({x,direction})=>{
    const s=window.__OTHERSELF__.getState(),a=s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled):s.nim;
    if(s.phase!=='playing')throw new Error(`Traversal interrupted: ${JSON.stringify(s.loss)}`);
    return direction>0?a.x>=x:a.x<=x;
  },{x,direction},timeout);
}
export async function setCrouch(page,crouching){
  if((await state(page)).nim.crouching!==crouching)await page.keyboard.press('KeyC');
  await expect.poll(async()=>(await state(page)).nim.crouching).toBe(crouching);
}
export async function climbTo(page,y){
  const before=await state(page),entity=before.controlled?before.rooms[before.room].guards.find(g=>g.id===before.controlled):before.nim;
  const up=y>entity.y;
  await held(page,up?'KeyW':'KeyS',({y,up})=>{
    const s=window.__OTHERSELF__.getState(),e=s.controlled?s.rooms[s.room].guards.find(g=>g.id===s.controlled):s.nim;
    if(s.phase!=='playing')throw new Error(`Climb interrupted: ${JSON.stringify(s.loss)}`);
    return (up?e.y>=y-.015:e.y<=y+.015)&&e.grounded&&!e.ladderId;
  },{y,up});
}
export async function jumpAcross(page,x){
  const before=await state(page),direction=x>before.nim.x?1:-1,key=direction>0?'KeyD':'KeyA';
  await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
  await page.locator('#app').focus();await page.keyboard.down(key);
  try{
    await page.keyboard.press('Space');
    await page.waitForFunction(({x,direction})=>{
      const s=window.__OTHERSELF__.getState();if(s.phase!=='playing')throw new Error(`Jump interrupted: ${JSON.stringify(s.loss)}`);
      return direction>0?s.nim.x>=x:s.nim.x<=x;
    },{x,direction},{timeout:15000,polling:20});
  }finally{if(!page.isClosed())await page.keyboard.up(key);}
  await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
  expect((await state(page)).nim.y).toBeCloseTo(before.nim.y,2);
}
export async function firstPossession(page){
  await setCrouch(page,true);await walk(page,5.8);await setCrouch(page,false);
  await walk(page,7);await climbTo(page,2.3);await possessRole(page,'keeper');
}

async function interaction(page,key){
  const actual=await page.evaluate(async()=>{
    const {getInteraction}=await import(new URL('src/engine.js',document.baseURI).href);
    return getInteraction(window.__OTHERSELF__.getState())?.key;
  });
  expect(actual).toBe(key);await page.keyboard.press('KeyE');
}
async function ladderAt(page,x,y){await walk(page,x);await climbTo(page,y);}
async function gap(page,from,to){await walk(page,from);await jumpAcross(page,to);}
async function dropToFloor(page,x){await walk(page,x);await expect.poll(async()=>{const n=(await state(page)).nim;return n.grounded&&Math.abs(n.y)<.02;}).toBe(true);}

/** Fresh-start route: actual inputs only, following the independently verified v2 topology. */
export async function playEpisode(page,{onRoom=async()=>{}}={}){
  for(let room=0;room<4;room++){
    expect((await state(page)).room).toBe(room);
    await setCrouch(page,true);await walk(page,5.8);await setCrouch(page,false);
    if(room===2){
      await setCrouch(page,true);await walk(page,8.65);await setCrouch(page,false);
      await gap(page,8.65,11.3);await walk(page,11.7);await possessRole(page,'keeper');
      await walk(page,17);await interaction(page,'openGate');await walk(page,11.3);await release(page);
      await ladderAt(page,12,2.3);
    }else{
      await ladderAt(page,[7,8,0,7][room],2.3);await possessRole(page,'keeper');
      await walk(page,[19,12,17,12.5][room]);await interaction(page,'openGate');
      await walk(page,[6.5,7.3,0,6.4][room]);await release(page);
    }
    expect((await state(page)).rooms[room].gateOpen).toBe(true);
    if(room===0){
      await ladderAt(page,16,4.8);expect((await state(page)).nim.y).toBeCloseTo(4.8,2);
      await ladderAt(page,16,2.3);await dropToFloor(page,21.7);
      await ladderAt(page,29,2.3);await gap(page,30.7,33);await walk(page,34.5);
    }else if(room===1){
      await ladderAt(page,14,4.8);await possessRole(page,'tech');await walk(page,18);await interaction(page,'deployBridge');
      await walk(page,13.3);await release(page);
      await walk(page,25);expect((await state(page)).rooms[room].bridgeOpen).toBe(true);
      await ladderAt(page,25,2.3);await ladderAt(page,28,0);await walk(page,29.5);await interaction(page,'rescue');
      await ladderAt(page,28,2.3);await gap(page,30.5,32.9);await walk(page,34.5);
    }else if(room===2){
      await dropToFloor(page,19.7);await ladderAt(page,29,2.3);await walk(page,28);await interaction(page,'rescue');
      await gap(page,30.2,32.4);await walk(page,34.5);
    }else{
      await ladderAt(page,13,4.8);await possessRole(page,'tech');await walk(page,18);await interaction(page,'deployBridge');
      await walk(page,12.4);await release(page);await walk(page,29.7);
      expect((await state(page)).rooms[room].bridgeOpen).toBe(true);
      await gap(page,29.7,31.9);await walk(page,34);
    }
    expect((await state(page)).nim.y).toBeCloseTo(room===3?4.8:2.3,2);
    await onRoom(room,await state(page));await interaction(page,room===3?'depart':'nextRoom');
    if(room<3){
      await expect.poll(async()=>(await state(page)).room).toBe(room+1);
      // The engine changes rooms synchronously; its new controls render on the next frame.
      // Begin the next traversal only after that room is visibly ready.
      await expect(page.locator('.room-index')).toContainText(`0${room+2}`);
    }
  }
  const final=await state(page);expect(final.phase).toBe('won');
  for(const key of ['jumped','crouched','climbedLadder','borrowedKeeper','borrowedTech','usedMechanism'])expect(final.milestones[key]).toBe(true);
  expect(final.rooms.filter(room=>room.rescued)).toHaveLength(2);return final;
}
