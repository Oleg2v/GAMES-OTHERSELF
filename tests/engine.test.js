import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.js';
const dt=1/60;
function driver(s){
 const actor=()=>E.actor(s),describe=()=>`${s.room}:${actor().role||'nim'}@${actor().x.toFixed(2)},${actor().y.toFixed(2)} ${JSON.stringify(s.loss)}`;
 function tick(input={}){E.step(s,dt,input);assert.equal(s.phase,'playing',describe());}
 function wait(seconds){for(let t=0;t<seconds-1e-8;t+=dt)tick();}
 function walk(x){let count=0;while(Math.abs(actor().x-x)>.055&&count++<1800)tick({move:Math.sign(x-actor().x)});assert.ok(count<1800,`walk ${x} stuck ${describe()}`);}
 function climb(x,y){walk(x);let count=0;while(Math.abs(actor().y-y)>.025&&count++<600)tick({climb:Math.sign(y-actor().y)});assert.ok(count<600,`ladder stuck ${describe()}`);wait(.1);assert.ok(Math.abs(actor().y-y)<.06);}
 function gap(from,to){walk(from);assert.ok(E.jump(s),`jump failed ${describe()}`);let count=0,d=Math.sign(to-from);while(d*(actor().x-to)<0&&count++<600)tick({move:d});while(!actor().grounded&&count++<900)tick();assert.ok(count<900&&actor().grounded,`landing failed ${describe()}`);}
 function take(role){let count=0;while(E.getTarget(s)?.role!==role&&count++<1800)tick();assert.equal(E.getTarget(s)?.role,role,`no ${role} ${describe()}`);E.possess(s);wait(.65);assert.equal(actor().role,role,`cast failed ${describe()}`);}
 function release(){E.possess(s);assert.equal(s.controlled,null);}
 function act(key){assert.equal(E.getInteraction(s)?.key,key,describe());assert.equal(E.action(s),true);}
 function entry(){E.toggleCrouch(s);walk(5.8);E.toggleCrouch(s);}
 return{tick,wait,walk,climb,gap,take,release,act,entry,actor};
}
function complete({technical=false,rescues=[false,false],throwFirst=false,carryItem=false,stopAfterRoom=null,openBoth=false,gardenTech=technical,finish=true}={}){
 const s=E.createGame(),d=driver(s);
 if(throwFirst||carryItem)assert.ok(E.useThrowable(s));
 for(let room=0;room<4;room++){
  assert.equal(s.room,room);d.entry();
  if(room===2){E.toggleCrouch(s);d.walk(8.65);E.toggleCrouch(s);d.gap(8.65,11.3);d.walk(11.7);d.take('keeper');if(!technical||!gardenTech||openBoth){d.walk(17);d.act('openGate');}d.walk(11.3);d.release();d.climb(12,2.3);}
  else{
   d.climb([7,8,0,7][room],2.3);
   if(room===0&&throwFirst){assert.ok(E.useThrowable(s));d.wait(.9);assert.ok(E.currentRoom(s).guards[0].investigate,'impact did not distract guard');}
   d.take('keeper');if(room===0||!technical||openBoth){d.walk(E.ROOMS[room].readerX);d.act('openGate');}d.walk([6.5,7.3,0,6.4][room]);d.release();
  }
  if(room===0){d.climb(16,4.8);d.climb(16,2.3);d.walk(21.7);d.wait(.8);d.walk(29);d.climb(29,2.3);d.gap(30.7,33);d.walk(34.5);}
  if(room===1){
   if(technical){d.climb(14,4.8);d.take('tech');d.walk(18);d.act('deployBridge');d.walk(13.3);d.release();d.walk(25);d.climb(25,2.3);}
   else d.gap(15.7,18);
   d.climb(28,0);if(rescues[0]){d.walk(29.5);d.act('rescue');}d.climb(28,2.3);d.gap(30.5,32.9);d.walk(34.5);
  }
  if(room===2){
   if(technical&&gardenTech){d.climb(17,4.8);d.walk(16.3);d.tick({move:1});d.take('tech');d.walk(18);d.act('moveCart');d.walk(14.3);d.release();d.climb(17,2.3);d.walk(19.7);d.wait(.65);E.toggleCrouch(s);d.walk(26);E.toggleCrouch(s);}
   else{d.walk(19.7);d.wait(.8);}
   d.walk(29);d.climb(29,2.3);if(rescues[1]){d.walk(28);d.act('rescue');}d.gap(30.2,32.4);d.walk(34.5);
  }
  if(room===3){
   if(technical){d.climb(13,4.8);d.take('tech');d.walk(18);d.act('deployBridge');d.walk(12.4);d.release();d.walk(29.7);}
   else{d.gap(13.7,16.4);d.climb(26,4.8);d.walk(29.7);}
   d.gap(29.7,31.9);d.walk(34);
  }
  if(room<3){d.act('nextRoom');if(stopAfterRoom===room)return s;}else{assert.equal(E.getInteraction(s)?.key,'depart');if(finish)E.action(s);}
 }
 return s;
}
test('actual-input keeper route traverses all four multilevel rooms and ends with no rescues',()=>{
 const s=complete();assert.equal(s.phase,'won');assert.equal(s.ending,0);assert.equal(s.rooms.every(r=>r.gateOpen),true);
 for(const key of ['crouched','jumped','climbedLadder','borrowedKeeper'])assert.equal(s.milestones[key],true);
});
test('actual-input technical route opens the upper bridges, moves the cart and rescues both creatures',()=>{
 const s=complete({technical:true,rescues:[true,true]});assert.equal(s.phase,'won');assert.equal(s.ending,2);assert.equal(s.rooms[1].gateOpen,false);assert.equal(s.rooms[3].gateOpen,false);assert.equal(s.rooms[2].cartX,24);
});
test('a reusable thrown object draws a real witness to its impact during a complete one-rescue run',()=>{
 const s=complete({throwFirst:true,rescues:[true,false]});assert.equal(s.ending,1);assert.equal(s.milestones.thrown,true);assert.ok(s.rooms[0].items.find(i=>i.id==='r0-bolt').available);
});
test('standing movement is physically blocked by a low duct; manual crawl passes and cannot stand inside',()=>{
 const s=E.createGame(),d=driver(s);for(let i=0;i<90;i++)d.tick({move:1});assert.ok(s.nim.x<3);assert.equal(s.nim.crouching,false);
 assert.ok(E.toggleCrouch(s));d.walk(4);assert.equal(E.toggleCrouch(s),false);assert.equal(s.nim.crouching,true);d.walk(5.8);assert.ok(E.toggleCrouch(s));
});
test('an actual floor pit has no implicit floor and falling retries the full safe checkpoint',()=>{
 const s=E.createGame();s.nim.x=12.7;s.nim.y=0;for(let i=0;i<120&&s.phase==='playing';i++)E.step(s,dt,{});
 assert.equal(s.phase,'lost');assert.equal(s.loss.key,'fell');E.retry(s);assert.equal(s.nim.x,1.8);assert.equal(s.nim.y,0);assert.equal(s.phase,'playing');
});
test('jump has an airborne parabola, lands across a real gap, and supports a brief coyote window',()=>{
 const s=E.createGame(),d=driver(s);d.entry();d.gap(11.7,14.3);assert.equal(s.nim.y,0);assert.equal(s.nim.grounded,true);
 s.nim.x=11.99;d.tick({move:1});assert.equal(s.nim.grounded,false);assert.ok(s.nim.coyote>0);assert.ok(E.jump(s));assert.ok(s.nim.vy>0);
});
test('solid roofs support descending bodies instead of swallowing them',()=>{
 const s=E.createGame();s.nim.x=4;s.nim.y=2.4;s.nim.grounded=false;for(let i=0;i<60;i++)E.step(s,dt,{});assert.equal(s.nim.y,1.8);assert.equal(s.nim.grounded,true);
});
test('ladders stop at both decks and an in-progress climb restores without a teleport',()=>{
 const s=E.createGame(),d=driver(s);d.entry();d.walk(7);for(let i=0;i<30;i++)d.tick({climb:1});assert.ok(s.nim.y>.9&&s.nim.y<1.2);assert.equal(s.nim.ladderId,'r0-l1');
 const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.nim.y,s.nim.y);assert.equal(restored.nim.ladderId,s.nim.ladderId);driver(restored).climb(7,2.3);driver(restored).climb(7,0);assert.equal(restored.nim.y,0);
});
test('airborne velocity and held items survive saves; corrupt vectors and unknown versions fail safely',()=>{
 const s=E.createGame();E.useThrowable(s);E.jump(s);for(let i=0;i<8;i++)E.step(s,dt,{});const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.nim.vy,s.nim.vy);assert.deepEqual(restored.nim.heldItem,s.nim.heldItem);
 const bad=JSON.parse(E.serialize(s));bad.state.nim.vy='fast';assert.equal(E.restore(bad),null);assert.equal(E.restore('{bad'),null);assert.equal(E.restore('{"version":99}'),null);const badGoal=JSON.parse(E.serialize(s));badGoal.state.rooms[0].guards[0].patrolGoal=99;assert.equal(E.restore(badGoal),null);const badPose=JSON.parse(E.serialize(s));badPose.state.nim.throwTime='bad';assert.equal(E.restore(badPose),null);
});
test('v1 saves retain durable progress but move obsolete geometry to the safe entrance',()=>{
 const old={version:1,state:{version:1,room:2,phase:'playing',time:123,visits:[true,true,true,false],nim:{x:25},controlled:'r2-tech',rooms:Array.from({length:4},(_,i)=>({gateOpen:i<2,bridgeOpen:i===1,rescued:i===1}))}};
 const s=E.restore(old);assert.ok(s);assert.equal(s.version,2);assert.equal(s.room,2);assert.equal(s.time,123);assert.equal(s.rooms[1].rescued,true);assert.equal(s.nim.x,1.8);assert.equal(s.nim.y,0);assert.equal(s.controlled,null);assert.equal(s.events[0].key,'saveMigrated');assert.ok(E.restore(E.serialize(s)));
});
test('reader, rescue, hiding and room transitions respect height',()=>{
 const s=E.createGame();s.nim.x=19;s.nim.y=0;assert.notEqual(E.getInteraction(s)?.key,'needKeeper');s.nim.x=7;s.nim.y=0;assert.equal(E.isHidden(s),false);s.nim.y=2.3;assert.equal(E.isHidden(s),true);
 s.nim.x=35.75;s.nim.y=0;E.step(s,dt,{});assert.equal(s.room,0);assert.equal(E.getInteraction(s).key,'exitAbove');
});
test('precise target rays report the glass hit and reject walls instead of selecting a collar',()=>{
 const s=E.createGame();s.room=2;s.nim.x=6.7;s.nim.y=2.3;s.nim.facing=1;const g=E.currentRoom(s).guards[0];g.x=10;g.y=2.3;
 const info=E.getTargetInfo(s);assert.equal(info.reason,'glass');assert.equal(info.eligible,false);assert.ok(Math.abs(info.obstruction.x-7.95)<.001);assert.equal(E.possess(s),false);
});
test('impact is delayed until collision, originates at the landing point, and the object is recoverable',()=>{
 const s=E.createGame(),d=driver(s);E.useThrowable(s);d.entry();d.climb(7,2.3);const predicted=E.predictThrow(s);assert.ok(predicted.points.length>3);assert.ok(predicted.impact);E.useThrowable(s);
 assert.equal(E.currentRoom(s).noises.length,0);assert.equal(E.currentRoom(s).projectiles.length,1);d.wait(1);const r=E.currentRoom(s);assert.equal(r.projectiles.length,0);assert.ok(r.noises.some(n=>n.kind==='impact'&&n.x>10));assert.ok(r.guards[0].investigate?.x>10);assert.ok(r.items.find(i=>i.id==='r0-bolt').available);
});
test('possession body continues gravity when a cast completes on a ladder, and returning keeps position',()=>{
 const s=E.createGame(),d=driver(s);d.entry();d.walk(7);for(let i=0;i<40;i++)d.tick({climb:1});assert.ok(s.nim.ladderId);E.currentRoom(s).guards[0].x=10;d.take('keeper');const oldY=s.nim.y;d.wait(.4);assert.ok(s.nim.y<oldY);const y=s.nim.y;E.possess(s);assert.equal(s.nim.y,y);assert.equal(s.controlled,null);
});
test('staff cannot chain possession and active-host/guard investigation state round-trips',()=>{
 const s=E.createGame(),d=driver(s);d.entry();d.climb(7,2.3);d.take('keeper');const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.controlled,s.controlled);const location={x:s.nim.x,y:s.nim.y};E.possess(s);assert.equal(s.controlled,null);assert.deepEqual({x:s.nim.x,y:s.nim.y},location);assert.equal(E.currentRoom(s).guards[0].recovery,2);
});
test('inactive game phases and large deltas cannot fast-forward a hidden party',()=>{
 const s=E.createGame();E.step(s,10,{move:1});assert.ok(s.time<.101);s.phase='won';s.ending=0;const before=E.serialize(s);E.step(s,1,{move:1,climb:1});assert.equal(E.serialize(s),before);
});

test('two seconds of continuous sight detain Nim; entering a deep niche resets the shutters',()=>{
 const s=E.createGame(),g=E.currentRoom(s).guards[0];s.nim.x=13;s.nim.y=2.3;g.x=11;g.y=2.3;g.facing=1;
 for(let i=0;i<114;i++)E.step(s,dt,{});assert.equal(s.phase,'playing');assert.ok(g.alert>1.85);
 s.nim.x=7;E.step(s,dt,{});assert.equal(g.alert,0);s.nim.x=13;g.facing=1;
 for(let i=0;i<121;i++)E.step(s,dt,{});assert.equal(s.phase,'lost');assert.equal(s.loss.key,'nimFound');
});
test('a free colleague can detain an abandoned body while its carrier is elsewhere',()=>{
 const s=E.createGame();s.room=1;s.visits[1]=true;s.nim.x=12;s.nim.y=2.3;const [keeper,tech]=E.currentRoom(s).guards;keeper.x=10;keeper.facing=1;tech.x=14;tech.y=4.8;
 assert.equal(E.getTarget(s)?.role,'tech');E.possess(s);for(let i=0;i<37;i++)E.step(s,dt,{});assert.equal(s.controlled,tech.id);
 for(let i=0;i<125&&s.phase==='playing';i++)E.step(s,dt,{});assert.equal(s.phase,'lost');assert.equal(s.loss.key,'bodyFound');
});
test('a worker follows a reachable sound down a real ladder, searches, and resumes their upper patrol',()=>{
 const s=E.createGame(),g=E.currentRoom(s).guards[0];g.investigate={x:17,y:0,platformId:'r0-ground-b'};g.listen=.42;
 let usedLadder=false,reachedFloor=false;
 for(let i=0;i<2100;i++){E.step(s,dt,{});usedLadder||=g.ladderId==='r0-l4';reachedFloor||=g.grounded&&Math.abs(g.y)<.01&&g.x>15;if(g.investigate===null&&g.y===2.3&&g.x<=15)break;}
 assert.equal(s.phase,'playing');assert.ok(usedLadder);assert.ok(reachedFloor);assert.equal(g.investigate,null);assert.equal(g.y,2.3);assert.ok(g.x>=9&&g.x<=15.1);
});
test('unreachable distraction locations time out at a reachable viewpoint instead of trapping the patrol',()=>{
 const s=E.createGame(),g=E.currentRoom(s).guards[0];g.investigate={x:34,y:2.3,platformId:'r0-exit-b'};
 for(let i=0;i<1800&&g.investigate;i++)E.step(s,dt,{});assert.equal(g.investigate,null);assert.ok(g.searchTurns>0);
});
test('an item carried into another room lands there and remains recoverable after reloading',()=>{
 const s=complete({carryItem:true,stopAfterRoom:0});assert.equal(s.room,1);assert.equal(s.nim.heldItem.id,'r0-bolt');assert.ok(E.restore(E.serialize(s)));
 E.useThrowable(s);for(let i=0;i<120;i++)E.step(s,dt,{});
 const item=E.currentRoom(s).items.find(i=>i.id==='r0-bolt');assert.ok(item?.available);assert.equal(item.homeRoom,0);assert.equal(s.rooms[0].items.some(i=>i.id==='r0-bolt'),false);
 assert.ok(E.restore(E.serialize(s)));
});
test('pickup cannot pass through a closed gate or a solid machine',()=>{
 const s=E.createGame(),item=E.currentRoom(s).items[0];s.nim.x=21.6;item.x=22.5;item.y=0;
 assert.equal(E.getThrowableInfo(s).enabled,false);assert.equal(E.useThrowable(s),false);assert.equal(item.available,true);
});
test('visited workers and an operating mechanism continue after Nim leaves the room',()=>{
 const s=E.createGame(),r=s.rooms[1];s.visits[1]=true;r.mechanism={kind:'bridge',active:true,progress:0};const before=r.guards[0].x;
 for(let i=0;i<200;i++)E.step(s,dt,{});assert.equal(r.bridgeOpen,true);assert.equal(r.mechanism.progress,1);assert.notEqual(r.guards[0].x,before);
});

test('before the bell Nim can backtrack for both missed creatures and return through all four rooms',()=>{
 const s=complete({technical:true,openBoth:true,gardenTech:false,finish:false}),d=driver(s);
 assert.equal(E.rescuedCount(s),0);
 d.gap(31.8,29.6);d.climb(26,2.3);d.walk(16.5);d.gap(16.3,13.7);d.climb(7,0);E.toggleCrouch(s);d.walk(1);E.toggleCrouch(s);d.act('previousRoom');
 d.gap(32.3,30.05);d.walk(28);d.act('rescue');d.climb(29,0);d.walk(11.35);d.gap(11.35,8.65);E.toggleCrouch(s);d.walk(1);E.toggleCrouch(s);d.act('previousRoom');
 d.gap(32.8,30.2);d.climb(28,0);d.walk(29.5);d.act('rescue');d.climb(28,2.3);d.climb(25,4.8);d.walk(24.3);d.take('tech');d.walk(13.3);d.release();d.climb(14,2.3);d.climb(8,0);E.toggleCrouch(s);d.walk(1);E.toggleCrouch(s);d.act('previousRoom');
 d.gap(33,30.7);d.climb(29,0);d.walk(14.3);d.gap(14.3,11.65);d.walk(5.8);E.toggleCrouch(s);d.walk(1.8);E.toggleCrouch(s);
 assert.equal(s.room,0);assert.equal(s.phase,'playing');assert.equal(E.rescuedCount(s),2);assert.ok(E.restore(E.serialize(s)));
});

test('a throw against a low ceiling bounces below it and stays recoverable instead of embedding in the roof',()=>{
 const s=E.createGame();s.nim.x=2.79;assert.ok(E.useThrowable(s));assert.ok(E.useThrowable(s));const d=driver(s);d.wait(1.5);
 assert.equal(E.currentRoom(s).projectiles.length,0);const item=E.currentRoom(s).items.find(i=>i.id==='r0-bolt');assert.equal(item.available,true);assert.equal(item.y,0);
 E.toggleCrouch(s);d.walk(item.x);assert.equal(E.getThrowableInfo(s).key,'pickupItem');assert.ok(E.useThrowable(s));assert.equal(s.nim.heldItem.id,item.id);
});

test('offscreen projectile events retain their source room while current-room entry events stay local',()=>{
 const s=E.createGame();s.room=1;s.visits[1]=true;assert.ok(E.useThrowable(s));assert.ok(E.useThrowable(s));assert.equal(E.getInteraction(s).key,'previousRoom');assert.ok(E.action(s));
 assert.equal(s.room,0);const entry=s.events.findLast(e=>e.type==='room'),saved=s.events.findLast(e=>e.type==='checkpoint');assert.equal(entry.room,0);assert.equal(saved.room,0);s.events=[];
 for(let i=0;i<120;i++)E.step(s,dt,{});
 const impacts=s.events.filter(e=>e.type==='impact');assert.ok(impacts.length>0);assert.ok(impacts.every(e=>e.room===1));assert.equal(s.events.filter(e=>e.room===s.room&&e.type==='impact').length,0);assert.equal(s.rooms[1].projectiles.length,0);
});
