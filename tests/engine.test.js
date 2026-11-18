import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,action,possess,getTarget,getInteraction,actor,currentRoom,ROOMS,serialize,restore,retry,isHidden,clearRay,rescuedCount,getTraversal,getHeight,getTargetInfo,getOccluders,traceRay,getGuardState} from '../src/engine.js';
const tick=(s,seconds,move=0)=>{for(let t=0;t<seconds-1e-8;t+=1/60)step(s,1/60,{move});};
function walk(s,x) {
  let count=0;
  while(Math.abs(actor(s).x-x)>.045&&count++<2000) {
    step(s,1/60,{move:Math.sign(x-actor(s).x)});
    assert.equal(s.phase,'playing',`Lost in room ${s.room} at ${s.nim.x}, carrier ${s.controlled}`);
  }
  assert.ok(count<2000,`Could not reach ${x} from ${actor(s).x}`);
}
function take(s) {assert.ok(getTarget(s),`No target at ${s.nim.x}, facing ${s.nim.facing}`);possess(s);tick(s,.6);assert.ok(s.controlled,'Transition did not finish');}
function release(s) {assert.ok(s.controlled);possess(s);assert.equal(s.controlled,null);}
function face(s,direction) {step(s,1/60,{move:direction});}
function playRoom(s,{tech=false,rescue=false}={}) {
  if(s.room===2) walk(s,6.4);
  take(s);
  walk(s,20);
  if(!tech||s.room===0) {
    assert.equal(getInteraction(s).key,'openGate'); action(s);
  }
  walk(s,s.room===2?6.4:2);
  release(s);
  if(s.room>0) {
    walk(s,11.3);
    face(s,1);
    for(let tries=0;tries<1200&&getTarget(s)?.role!=='tech';tries++) step(s,1/60,{});
    assert.equal(getTarget(s)?.role,'tech');take(s);
    if(tech) {walk(s,17);assert.match(getInteraction(s).key,/deployBridge|moveCart/);action(s);release(s);tick(s,3.1);}
    else {walk(s,34);release(s);}
  }
  if(tech&&s.room!==0&&s.room!==2) {walk(s,19.4);assert.equal(getInteraction(s).key,'climb');action(s);}
  walk(s,29.5);
  if(rescue&&[1,2].includes(s.room)) {assert.equal(getInteraction(s).key,'rescue');action(s);}
  walk(s,34.5); action(s);
}

test('four rooms have a complete zero-rescue keeper route ending',()=>{
  const s=createGame();for(let i=0;i<4;i++)playRoom(s);
  assert.equal(s.phase,'won');assert.equal(s.ending,0);assert.equal(s.rooms.every(r=>r.gateOpen),true);
});
test('covered technician route completes episode, saving both creatures',()=>{
  const s=createGame();for(let i=0;i<4;i++)playRoom(s,{tech:i>0,rescue:true});
  assert.equal(s.phase,'won');assert.equal(s.ending,2);assert.equal(rescuedCount(s),2);
  assert.equal(s.rooms[1].gateOpen,false);assert.equal(s.rooms[1].bridgeOpen,true);
  assert.equal(s.rooms[2].cartX,24);assert.equal(s.rooms[3].bridgeOpen,true);
});
test('one rescue produces the distinct one-voice ending',()=>{
  const s=createGame();for(let i=0;i<4;i++)playRoom(s,{rescue:i===1});
  assert.equal(s.phase,'won');assert.equal(s.ending,1);
});
test('possession is nearest in facing direction and needs the entire 0.6 second ray',()=>{
  const s=createGame();assert.equal(getTarget(s).role,'keeper');possess(s);tick(s,.5);assert.equal(s.controlled,null);
  face(s,-1);assert.equal(s.transition,null);assert.equal(s.controlled,null);
  face(s,1);walk(s,2.4);possess(s);tick(s,.6);assert.equal(actor(s).role,'keeper');
});
test('glass blocks a visible target until Nim reaches the actual opening',()=>{
  const s=createGame();s.room=2;s.nim.x=4.5;s.nim.facing=1;
  assert.equal(clearRay(s,4.5,9),false);assert.equal(getTarget(s),null);
  walk(s,6.3);assert.equal(getTarget(s).role,'keeper');take(s);
});
test('return works behind a closed gate and carrier cannot chain possession',()=>{
  const s=createGame();take(s);const id=s.controlled;walk(s,20);action(s);walk(s,30);
  currentRoom(s).gateOpen=false;possess(s);
  assert.equal(s.controlled,null);assert.equal(s.nim.x,1.8);
  const released=currentRoom(s).guards.find(g=>g.id===id);assert.equal(released.x>29.9,true);assert.equal(released.recovery,2);
});
test('role permissions and gate collision remain enforced',()=>{
  const s=createGame();s.nim.x=20;assert.equal(getInteraction(s).key,'needKeeper');assert.equal(action(s),false);
  tick(s,.5,1);assert.ok(s.nim.x<22);assert.equal(currentRoom(s).gateOpen,false);
});
test('Nim is detained only after two continuous seconds, cover resets suspicion',()=>{
  const s=createGame();s.nim.x=6;const g=currentRoom(s).guards[0];g.x=4.8;g.facing=1;
  tick(s,1.9);assert.equal(s.phase,'playing');assert.ok(g.alert>1.8);
  s.nim.x=3;tick(s,.1);assert.equal(g.alert,0);s.nim.x=6;g.facing=1;
  tick(s,2);assert.equal(s.phase,'lost');assert.equal(s.loss.key,'nimFound');retry(s);assert.equal(s.phase,'playing');assert.equal(s.nim.x,1.8);
});
test('a witness can discover the abandoned body, independent of the controlled body',()=>{
  const s=createGame();s.room=1;s.nim.x=12.5;s.nim.facing=1;const [keeper,tech]=currentRoom(s).guards;
  tech.x=15;keeper.x=11.8;keeper.facing=1;take(s);assert.equal(actor(s).role,'tech');
  tick(s,2);assert.equal(s.phase,'lost');assert.equal(s.loss.key,'bodyFound');
});
test('transition sound attracts a nearby colleague, with no suspicion from a normal pass',()=>{
  const s=createGame();s.room=1;s.nim.x=10;const [keeper,tech]=currentRoom(s).guards;
  keeper.x=13;tech.x=15;tech.facing=-1;possess(s);assert.equal(tech.investigate,13);
  tick(s,.6);walk(s,20);tech.investigate=null;action(s);assert.equal(tech.investigate,null);
});
test('mechanism completes after immediate return and safe save restores every active position',()=>{
  const s=createGame();s.room=1;s.nim.x=15.2;s.nim.facing=1;const room=currentRoom(s);room.guards[1].x=17;
  take(s);assert.equal(actor(s).role,'tech');action(s);release(s);tick(s,1);
  const restored=restore(serialize(s));assert.ok(restored);assert.deepEqual(restored.rooms,s.rooms);assert.deepEqual(restored.nim,s.nim);
  tick(restored,2.1);assert.equal(currentRoom(restored).bridgeOpen,true);
});
test('save restores active carrier and transition; corrupt/version-mismatched saves fail safely',()=>{
  const s=createGame();possess(s);tick(s,.2);const a=restore(serialize(s));assert.deepEqual(a.transition,s.transition);
  tick(a,.4);assert.ok(a.controlled);const b=restore(serialize(a));assert.equal(b.controlled,a.controlled);
  assert.equal(restore('{broken'),null);assert.equal(restore('{"version":999}'),null);
  const bad=JSON.parse(serialize(a));bad.state.rooms[0].guards[0].x='oops';assert.equal(restore(bad),null);
  bad.state.rooms[0].guards[0].x=2;bad.state.checkpoint.nim.x=Infinity;assert.equal(restore(bad),null);
});
test('a carrier cannot cross room boundaries; Nim can return for missed rescues before bell',()=>{
  const s=createGame();take(s);walk(s,20);action(s);walk(s,35.2);tick(s,1,1);assert.equal(s.room,0);
  release(s);walk(s,34.5);action(s);assert.equal(s.room,1);assert.equal(getInteraction(s).key,'previousRoom');action(s);assert.equal(s.room,0);
});
test('inactive phases and huge frame deltas cannot advance time dangerously',()=>{
  const s=createGame();step(s,10,{move:1});assert.ok(s.time<=.1);assert.ok(s.nim.x<2.2);
  s.phase='won';const before=serialize(s);step(s,1,{move:1});assert.equal(serialize(s),before);
});

test('the covered alternative remains traversable backwards with its passenger gate closed',()=>{
  const s=createGame();s.room=1;s.nim.x=29.5;s.nim.facing=-1;currentRoom(s).bridgeOpen=true;
  walk(s,26.5);assert.equal(getInteraction(s).key,'climb');action(s);
  walk(s,19.3);assert.equal(s.nim.route,'bridge');assert.equal(currentRoom(s).gateOpen,false);
  walk(s,17.5);assert.equal(s.nim.route,'floor');assert.equal(isHidden(s),true);
});

test('blocked targeting returns the exact glass hit, not a selectable collar',()=>{
  const s=createGame();s.room=2;s.nim.x=4.5;
  const info=getTargetInfo(s);assert.equal(info.reason,'glass');assert.equal(info.eligible,false);
  assert.equal(info.target.role,'keeper');assert.ok(Math.abs(info.obstruction.x-5.76)<.001);assert.ok(info.obstruction.y>.75);
  possess(s);assert.equal(s.events.at(-1).key,'targetBlockedGlass');assert.equal(s.transition,null);
});
test('machine bounds block a face-to-collar ray while rays above its roof remain clear',()=>{
  const s=createGame();s.room=1;currentRoom(s).gateOpen=true;
  assert.ok(getOccluders(s).some(b=>b.kind==='machine'&&b.from===23.8));
  const blocked=traceRay(s,{x:23.7,y:.57},{x:25,y:1.92});assert.equal(blocked.reason,'machine');
  assert.equal(traceRay(s,{x:23,y:2.2},{x:26,y:2.2}).clear,true);
});
test('staff above a crawl grating and Nim beneath it have different physical heights',()=>{
  const s=createGame();s.nim.x=3.5;const g=currentRoom(s).guards[0];g.x=3.5;
  assert.equal(getTraversal(s,s.nim).kind,'crouch');assert.equal(getHeight(s,s.nim),0);
  assert.equal(getTraversal(s,g).kind,'service');assert.ok(getHeight(s,g)>1);
  tick(s,1/60);assert.equal(s.milestones.crouched,true);
});
test('low ledges and narrow gaps are crossed automatically, with reversible deterministic height',()=>{
  const s=createGame();walk(s,9);assert.ok(getHeight(s,s.nim)>.3);
  walk(s,11.87);const airborne=getTraversal(s,s.nim);assert.equal(airborne.kind,'step');assert.ok(airborne.height>.15);
  const saved=restore(serialize(s));assert.equal(getHeight(saved,saved.nim),getHeight(s,s.nim));
  walk(s,12.3);assert.equal(getHeight(s,s.nim),0);assert.equal(s.milestones.crossedGap,true);assert.equal(s.milestones.climbedLedge,true);
});
test('targets on a different gameplay plane cannot be borrowed from the covered bridge',()=>{
  const s=createGame();s.room=1;s.nim.x=19.4;s.nim.facing=-1;s.nim.route='bridge';currentRoom(s).bridgeOpen=true;
  const info=getTargetInfo(s);assert.equal(info.reason,'plane');assert.equal(getTarget(s),null);
});
test('the open lip of a niche is exposed but the deep recess is safe',()=>{
  const s=createGame();assert.equal(isHidden(s,8.04),false);assert.equal(isHidden(s,8.3),true);assert.equal(isHidden(s,10.96),false);
});
test('a released host resumes the existing inspection after exactly the recovery period',()=>{
  const s=createGame();walk(s,2.4);const g=currentRoom(s).guards[0];g.investigate=10;
  take(s);walk(s,20);release(s);const position=g.x;tick(s,1.9);assert.equal(g.x,position);assert.equal(getGuardState(s,g),'recover');
  tick(s,.3);assert.ok(g.x<position);assert.equal(g.investigate,10);assert.equal(getGuardState(s,g),'investigate');
  tick(s,16);assert.equal(g.investigate,null);assert.equal(getGuardState(s,g),'patrol');assert.ok(g.x>=6&&g.x<=12);
});
test('visited-room workers and started mechanisms continue when Nim leaves that room',()=>{
  const s=createGame();s.visits[1]=true;const r=s.rooms[1],g=r.guards[0];
  r.mechanism={active:true,progress:0,kind:'bridge'};g.x=20;g.recovery=2;
  tick(s,3.2);assert.equal(r.bridgeOpen,true);assert.equal(r.mechanism.progress,1);assert.equal(g.recovery,0);assert.ok(g.x<20);
});
test('listening is observable before investigation, and survives a full-state save',()=>{
  const s=createGame();s.room=1;s.nim.x=10;const [keeper,tech]=currentRoom(s).guards;
  keeper.x=13;tech.x=15;tech.facing=-1;possess(s);
  assert.equal(getGuardState(s,tech),'listen');const restored=restore(serialize(s));assert.equal(getGuardState(restored,currentRoom(restored).guards[1]),'listen');
  tick(s,.5);assert.equal(getGuardState(s,tech),'investigate');
});
test('closed collision barriers cannot be crossed by landing exactly on their coordinate',()=>{
  const s=createGame();take(s);const g=actor(s);g.x=21.9;step(s,.1,{move:1});assert.ok(g.x<22);
  g.x=21.95583333333333;step(s,1/60,{move:1});assert.ok(g.x<22);assert.equal(currentRoom(s).gateOpen,false);
});
