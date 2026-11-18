import {test,expect} from '@playwright/test';
import {createGame,checkpoint,serialize,restore} from '../src/engine.js';
import {t} from '../src/i18n.js';
import {state,capturePage} from './support/browser-game.js';

// These are valid saved-position UI fixtures, not additional full playthroughs.
// Every action after loading uses a real keyboard, mouse or touchscreen event.
function position(room,x,y){
  const game=createGame();game.room=room;game.visits[room]=true;
  Object.assign(game.nim,{x,y,vy:0,grounded:true});return game;
}
function keeperAtReader(){
  const game=position(0,7,2.3),keeper=game.rooms[0].guards[0];
  Object.assign(keeper,{x:19,y:2.3,vy:0,grounded:true});
  game.controlled=keeper.id;game.nim.collapsed=true;return game;
}
async function withFixture(context,game,run,lang='en'){
  checkpoint(game);const saved=serialize(game);
  expect(restore(saved),'the UI fixture must pass the real save validator').not.toBeNull();
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.addInitScript(({saved,lang})=>{
    localStorage.setItem('otherself.save.v1',saved);
    localStorage.setItem('otherself.preferences.v1',JSON.stringify({lang,quality:'low',muted:true,music:0,effects:0,reducedMotion:true}));
  },{saved,lang});
  try{
    await page.goto('./');await expect(page.locator('#app')).toHaveAttribute('data-mode','menu');
    await page.locator('[data-command=continue]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-mode','game');
    await page.evaluate(()=>document.fonts.ready);
    await run(page);
  }finally{await page.close();expect(errors).toEqual([]);}
}
const control=(page,command)=>page.locator(`.gamepad-controls [data-command=${command}]`);
async function touchControl(page,command){
  const box=await control(page,command).boundingBox();expect(box).not.toBeNull();
  // Intentionally use actual coordinates: aria-disabled controls remain
  // focusable/tappable so that their unavailable reason can be explained.
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
}
function durableActions(game){
  const a=game.rooms[game.room].guards.find(g=>g.id===game.controlled)||game.nim;
  return {room:game.room,phase:game.phase,controlled:game.controlled,transition:game.transition,
    actor:{x:a.x,y:a.y,vy:a.vy,grounded:a.grounded},
    nim:{x:game.nim.x,y:game.nim.y,crouching:game.nim.crouching,heldItem:game.nim.heldItem},
    rooms:game.rooms.map(r=>({gateOpen:r.gateOpen,bridgeOpen:r.bridgeOpen,rescued:r.rescued,
      mechanism:r.mechanism,projectiles:r.projectiles,items:r.items})),milestones:game.milestones};
}
async function observeFeedback(page){
  await page.evaluate(()=>{
    window.__observedControlFeedback=[];
    new MutationObserver(records=>{
      for(const {target} of records)if(target.dataset.feedback==='true')window.__observedControlFeedback.push(target.dataset.command);
    }).observe(document.querySelector('.gamepad-controls'),{subtree:true,attributes:true,attributeFilter:['data-feedback']});
  });
}
const feedbackCount=(page,command)=>page.evaluate(command=>window.__observedControlFeedback.filter(x=>x===command).length,command);
async function reason(page,key){await expect(page.locator('.toast.visible')).toHaveText(t('en',key));}

test.describe('2.2 contextual controls and keyboard semantics',()=>{
  test.use({viewport:{width:390,height:844},deviceScaleFactor:.5,hasTouch:true});

  test('ladder guidance and the primary action match the actual door, rescue and room-exit interaction',async({context})=>{
    test.setTimeout(180000);
    await test.step('a ladder uses the stick, while E remains unavailable',async()=>{
      await withFixture(context,position(0,7,0),async page=>{
        await expect(page.locator('.context-text')).toHaveText(t('en','joystickClimbHint'));
        await expect(control(page,'action')).toHaveAttribute('data-state','idle');
        const before=durableActions(await state(page));await page.keyboard.press('KeyE');
        await reason(page,'padNoAction');expect(durableActions(await state(page))).toEqual(before);
      });
    });
    await test.step('a borrowed keeper is explicitly offered the door action',async()=>{
      await withFixture(context,keeperAtReader(),async page=>{
        await expect(control(page,'action')).toHaveAccessibleName(t('en','openGate'));
        await expect(control(page,'action').locator('span:last-child')).toHaveText(t('en','padOpen'));
        await expect(control(page,'action')).toHaveAttribute('data-state','ready');
        await expect(control(page,'possess')).toHaveAttribute('data-state','active');
        await page.keyboard.press('KeyE');await expect.poll(async()=>(await state(page)).rooms[0].gateOpen).toBe(true);
        await expect(control(page,'action')).toHaveAttribute('data-state','idle');
      });
    });
    await test.step('a grounded rescue action changes to idle once the cage is opened',async()=>{
      const game=position(1,29.5,0);game.rooms[1].gateOpen=true;
      await withFixture(context,game,async page=>{
        await expect(control(page,'action')).toHaveAccessibleName(t('en','rescue'));
        await expect(control(page,'action').locator('span:last-child')).toHaveText(t('en','padRescue'));
        await expect(control(page,'action')).toHaveAttribute('data-state','ready');
        await touchControl(page,'action');await expect.poll(async()=>(await state(page)).rooms[1].rescued).toBe(true);
        await expect(control(page,'action')).toHaveAttribute('data-state','idle');
      });
    });
    await test.step('the raised exit advertises and performs the next-room action',async()=>{
      const game=position(0,34.6,2.3);game.rooms[0].gateOpen=true;
      await withFixture(context,game,async page=>{
        await expect(control(page,'action')).toHaveAccessibleName(t('en','nextRoom'));
        await expect(control(page,'action').locator('span:last-child')).toHaveText(t('en','padExit'));
        await expect(control(page,'action')).toHaveAttribute('data-state','ready');
        await touchControl(page,'action');await expect(page.locator('.room-index')).toContainText('02');
        expect((await state(page)).room).toBe(1);
      });
    });
  });

  test('locked and idle controls explain the same refusal from keyboard and touch without changing the world',async({context})=>{
    test.setTimeout(180000);
    await withFixture(context,keeperAtReader(),async page=>{
      await observeFeedback(page);const before=durableActions(await state(page));
      for(const [command,key] of [['jump','Space'],['crouch','KeyC'],['throw','KeyF']]){
        const button=control(page,command);
        await expect(button).toHaveAttribute('data-state','locked');
        await expect(button).toHaveAttribute('aria-disabled','true');
        expect(await button.evaluate(el=>el.disabled)).toBe(false);
        let count=await feedbackCount(page,command);
        await page.locator('#app').focus();await page.keyboard.press(key);await reason(page,'padHostOnly');
        await expect.poll(()=>feedbackCount(page,command)).toBeGreaterThan(count);
        expect(durableActions(await state(page))).toEqual(before);
        count=await feedbackCount(page,command);await touchControl(page,command);await reason(page,'padHostOnly');
        await expect.poll(()=>feedbackCount(page,command)).toBeGreaterThan(count);
        expect(durableActions(await state(page))).toEqual(before);
      }
    });
    const wrongRole=position(0,19,2.3);
    Object.assign(wrongRole.rooms[0].guards[0],{x:7,facing:-1,recovery:2});
    await withFixture(context,wrongRole,async page=>{
      const before=durableActions(await state(page));
      await expect(control(page,'action')).toHaveAttribute('data-state','locked');
      await page.keyboard.press('KeyE');await reason(page,'needKeeper');
      await touchControl(page,'action');await reason(page,'needKeeper');
      expect(durableActions(await state(page))).toEqual(before);
    });
    await withFixture(context,position(0,27.2,0),async page=>{
      const before=durableActions(await state(page));
      for(const [command,key,message] of [['action','KeyE','padNoAction'],['throw','KeyF','noItemNearby']]){
        await expect(control(page,command)).toHaveAttribute('data-state','idle');
        await page.locator('#app').focus();await page.keyboard.press(key);await reason(page,message);
        await touchControl(page,command);await reason(page,message);
        expect(durableActions(await state(page))).toEqual(before);
      }
    });
  });

  test('Space and Enter activate the focused button, and a mouse action restores normal Space-to-jump control',async({context})=>{
    await withFixture(context,position(0,27.2,0),async page=>{
      await observeFeedback(page);const crouch=control(page,'crouch');
      await crouch.focus();await page.keyboard.press('Space');
      await expect(crouch).toHaveAttribute('aria-pressed','true');
      await expect(crouch).toHaveAttribute('data-state','active');
      expect((await state(page)).nim.y).toBe(0);expect((await state(page)).milestones.jumped).not.toBe(true);
      expect(await feedbackCount(page,'crouch')).toBeGreaterThan(0);
      await expect(crouch).toBeFocused();await page.keyboard.press('Enter');
      await expect(crouch).toHaveAttribute('aria-pressed','false');
      expect((await state(page)).nim.y).toBe(0);
      const before=await feedbackCount(page,'crouch');
      await control(page,'action').click();await expect(page.locator('#app')).toBeFocused();
      await page.keyboard.press('KeyC');await expect(crouch).toHaveAttribute('aria-pressed','true');
      await expect.poll(()=>feedbackCount(page,'crouch')).toBeGreaterThan(before);
      await page.keyboard.press('KeyC');await page.keyboard.press('Space');
      await expect.poll(async()=>(await state(page)).nim.y).toBeGreaterThan(.2);
      expect((await state(page)).controlled).toBeNull();
      await expect.poll(async()=>(await state(page)).nim.grounded).toBe(true);
    });
  });
});

test.describe('2.2 touch target layout',()=>{
  test.use({viewport:{width:320,height:640},deviceScaleFactor:1,hasTouch:true});
  test('320px portrait and phone landscape keep stable, separated touch targets in RU, EN and HE',async({context})=>{
    test.setTimeout(180000);
    await withFixture(context,position(0,7,0),async page=>{
      for(const viewport of [{width:320,height:640},{width:844,height:390}]){
        await page.setViewportSize(viewport);let reference;
        for(const lang of ['ru','en','he']){
          await page.locator('[data-pref=lang]').selectOption(lang);
          await expect(page.locator('#app')).toHaveAttribute('lang',lang);
          await expect(page.locator('#app')).toHaveAttribute('dir',lang==='he'?'rtl':'ltr');
          await page.evaluate(()=>document.fonts.ready);
          const boxes=await page.locator('.gamepad-controls button').evaluateAll(buttons=>buttons.map(button=>{
            const box=button.getBoundingClientRect(),style=getComputedStyle(button),hint=getComputedStyle(button,'::after');
            const x=box.x+box.width/2,y=box.y+box.height/2;
            return {id:button.dataset.command||'joystick',x:box.x,y:box.y,width:box.width,height:box.height,
              centerHit:button.contains(document.elementFromPoint(x,y)),radius:parseFloat(style.borderTopLeftRadius),
              keyHintHidden:hint.display==='none'||hint.visibility==='hidden'||hint.content==='none'||hint.content==='""',
              label:button.getAttribute('aria-label'),svg:button.querySelectorAll('svg').length};
          }));
          expect(boxes).toHaveLength(6);
          for(const box of boxes){
            expect(box.label,`${lang}: ${box.id} needs an accessible label`).toBeTruthy();
            expect(box.centerHit,`${lang}: ${box.id} is covered by another element`).toBe(true);
            expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
            expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+.5);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+.5);
            const minimum=box.id==='jump'?76:box.id==='action'?64:56;
            expect(box.width,`${lang}: ${box.id} width`).toBeGreaterThanOrEqual(minimum-.5);
            expect(box.height,`${lang}: ${box.id} height`).toBeGreaterThanOrEqual(minimum-.5);
            if(box.id!=='joystick'){expect(box.svg).toBe(1);expect(box.keyHintHidden,`${lang}: hide keyboard hints on touch`).toBe(true);}
          }
          // The controls are circular. Check actual circle clearance instead
          // of rejecting harmless overlap between transparent bounding corners.
          for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
            const a=boxes[i],b=boxes[j],distance=Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2);
            expect(distance-(a.width+b.width)/2,`${lang}: ${a.id}/${b.id} touch areas overlap`).toBeGreaterThanOrEqual(0);
          }
          expect(boxes.find(b=>b.id==='joystick').x).toBeLessThan(boxes.find(b=>b.id==='jump').x);
          const geometry=boxes.map(({id,x,y,width,height})=>({id,x,y,width,height}));
          if(reference)expect(geometry,`${lang}: changing language must not move the controls`).toEqual(reference);else reference=geometry;
          await expect(page.locator('.context-key')).toBeHidden();
          await capturePage(page,`controls-ux-${lang}-${viewport.width}x${viewport.height}`);
        }
      }
    });
  });
});
