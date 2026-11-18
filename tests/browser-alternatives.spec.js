import {test,expect} from '@playwright/test';
import {load,start,lowQuality,state,moveTo,possessRole,release,capturePage} from './support/browser-game.js';

test.describe('genuine technician route',()=>{
  test.use({viewport:{width:640,height:360},deviceScaleFactor:.5});
  test('all alternative mechanisms complete after return; covered paths and backtracking remain usable',async({page})=>{
    test.setTimeout(900000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await load(page,'en');await lowQuality(page);await start(page);
    for(let room=0;room<4;room++){
      expect((await state(page)).room).toBe(room);
      await moveTo(page,room===2?6.4:3.3);await possessRole(page,'keeper');
      if(room===0){await moveTo(page,20);await page.keyboard.press('KeyE');}
      await moveTo(page,room===2?6.4:2);await release(page);
      if(room>0){
        await moveTo(page,10.6);await possessRole(page,'tech');await moveTo(page,17);await page.keyboard.press('KeyE');
        await expect.poll(async()=>(await state(page)).rooms[room].mechanism.active).toBe(true);
        await release(page);await expect.poll(async()=>(await state(page)).rooms[room].bridgeOpen,{timeout:30000}).toBe(true);
        if(room!==2){await moveTo(page,19.4);await page.keyboard.press('KeyE');await expect.poll(async()=>(await state(page)).nim.route).toBe('bridge');}
      }
      await moveTo(page,29.5);
      if(room===1){
        expect((await state(page)).rooms[room].gateOpen).toBe(false);
        await moveTo(page,26.5);await page.keyboard.press('KeyE');await expect.poll(async()=>(await state(page)).nim.route).toBe('bridge');
        await moveTo(page,19.1);expect((await state(page)).nim.route).toBe('bridge');
        await moveTo(page,29.5);expect((await state(page)).rooms[room].gateOpen).toBe(false);
      }
      if(room===2){await page.keyboard.press('KeyE');await expect.poll(async()=>(await state(page)).rooms[room].rescued).toBe(true);}
      if(room===2){expect((await state(page)).rooms[room].cartX).toBe(24);}
      if(room===3){expect((await state(page)).rooms[room].gateOpen).toBe(false);}
      await moveTo(page,34.5);await capturePage(page,`alternative-room${room}`);
      if(room<3){await page.keyboard.press('KeyE');await expect.poll(async()=>(await state(page)).room).toBe(room+1);}
    }
    // The bell stays untouched: return for the creature deliberately left in sorting.
    expect((await state(page)).rooms[1].rescued).toBe(false);
    await moveTo(page,26.5);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).nim.route).toBe('bridge');
    await moveTo(page,17.5);await moveTo(page,1);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).room).toBe(2);
    await moveTo(page,1);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).room).toBe(1);
    await moveTo(page,29.5);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).rooms[1].rescued).toBe(true);
    expect((await state(page)).rooms[1].gateOpen).toBe(false);
    await moveTo(page,34.5);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).room).toBe(2);
    await moveTo(page,34.5);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).room).toBe(3);
    await moveTo(page,19.4);await page.keyboard.press('KeyE');
    await expect.poll(async()=>(await state(page)).nim.route).toBe('bridge');
    await moveTo(page,34.5);await page.keyboard.press('KeyE');
    await expect(page.locator('#app')).toHaveAttribute('data-mode','ending');
    await page.locator('[data-command=finishEnding]').click();await expect(page.getByRole('dialog')).toBeVisible();
    expect((await state(page)).rooms.filter(room=>room.rescued).length).toBe(2);expect(errors).toEqual([]);
  });
});
