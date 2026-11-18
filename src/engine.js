/** Deterministic OTHERSELF world. No DOM, clock, randomness or renderer dependencies. */
export const VERSION = 1;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const copy = value => JSON.parse(JSON.stringify(value));
const guard = (room, role, x, min, max) => ({ id: `r${room}-${role}`, role, x, facing: 1, patrol: [min, max] });
export const ROOMS = [
  { key: 'vestibule', length: 36, gateX: 22, readerX: 20, consoleX: null, crateX: null,
    covers: [{from:0,to:4.5},{from:8,to:11},{from:13,to:16},{from:26,to:30},{from:32,to:36}], glass: [],
    guards: [guard(0,'keeper',7,6,12)] },
  { key: 'sorting', length: 36, gateX: 22, readerX: 20, consoleX: 17, crateX: 29.5,
    covers: [{from:0,to:4},{from:8.5,to:11.5},{from:15,to:18},{from:27,to:30.8},{from:32,to:36}], glass: [],
    guards: [guard(1,'keeper',7,6,12),guard(1,'tech',16,14,19)] },
  { key: 'garden', length: 36, gateX: 22, readerX: 20, consoleX: 17, crateX: 29.5,
    covers: [{from:0,to:5.2},{from:8.5,to:11.5},{from:17,to:20},{from:27,to:30.8},{from:32,to:36}], glass: [{x:5.8}],
    guards: [guard(2,'keeper',9,8,14),guard(2,'tech',16,14,19)] },
  { key: 'dock', length: 36, gateX: 22, readerX: 20, consoleX: 17, crateX: null,
    covers: [{from:0,to:4},{from:8,to:11.5},{from:15,to:18},{from:27,to:30.8},{from:32,to:36}], glass: [],
    guards: [guard(3,'keeper',7,6,12),guard(3,'tech',16,14,19)] }
 ];
// Walkable height and collision metadata is shared with the renderer. Grating
// roofs carry staff on the service deck while Nim uses the low space below.
const terrain = [
  {crawl:[{from:2.8,to:4.5,clearance:.95}],ledges:[{from:8.5,to:11,height:.32,ramp:.5}],gaps:[{from:11.6,to:12.15}],machines:[]},
  {crawl:[{from:9,to:11.5,clearance:.95}],ledges:[{from:27.2,to:30.5,height:.3,ramp:.5}],gaps:[{from:12.2,to:12.85}],machines:[{from:23.8,to:24.7,minY:.9,maxY:1.25}]},
  {crawl:[{from:5.1,to:6.4,clearance:.8}],ledges:[{from:9.2,to:11.4,height:.28,ramp:.45}],gaps:[{from:25.8,to:26.45}],machines:[]},
  {crawl:[{from:8.8,to:11.5,clearance:.95}],ledges:[{from:31.8,to:34.8,height:.4,ramp:.6}],gaps:[{from:12.3,to:12.95}],machines:[]}
];
ROOMS.forEach((room,i)=>Object.assign(room,terrain[i],{walls:[]}));
ROOMS[2].glass[0]={x:5.8,minY:.75,maxY:6};
export function currentRoom(state) { return state.rooms[state.room]; }
export function actor(state) { return state.controlled ? currentRoom(state).guards.find(g=>g.id===state.controlled) : state.nim; }
function emit(state,type,key,details={}) { state.events.push({type,key,...details}); if(state.events.length>80) state.events.shift(); }
function snapshot(state) { const {checkpoint,events,...data}=state; return copy(data); }
export function checkpoint(state) { state.checkpoint=snapshot(state); emit(state,'checkpoint','checkpoint'); }
export function createGame() {
  const state = {version:VERSION, phase:'playing', room:0, nim:{x:1.8,facing:1,route:'floor'}, controlled:null,
    transition:null, milestones:{}, time:0, roomTime:0, visits:[true,false,false,false], loss:null,
    rooms:ROOMS.map(r=>({guards:r.guards.map(g=>({...copy(g),alert:0,recovery:0,investigate:null,inspect:0,listen:0,route:'floor'})),
      gateOpen:false,bridgeOpen:false,rescued:false,cartX:null,mechanism:{active:false,progress:0,kind:null}})), events:[], checkpoint:null};
  checkpoint(state); return state;
}
function crosses(a,b,x) { return a!==b&&Math.min(a,b)<=x&&Math.max(a,b)>=x; }
function milestone(state,key) { (state.milestones??={})[key]=true; }
function plane(entity) { return entity?.plane ?? (entity?.route==='bridge'?1:0); }
function rampHeight(x,from,to,height,ramp=.5) {
  return Math.max(0,Math.min(1,(x-from)/ramp,(to-x)/ramp))*height;
}
export function getTraversal(state,entity=actor(state)) {
  const spec=ROOMS[state.room],x=entity.x,staff=Boolean(entity.role);
  if(entity.route==='bridge') return {kind:'bridge',height:Math.min(clamp((x-19)/3,0,1),clamp((28-x)/3,0,1))*1.8,progress:clamp((x-19)/9,0,1)};
  let height=0,kind='walk',progress=0;
  for(const ledge of spec.ledges) {
    const h=rampHeight(x,ledge.from,ledge.to,ledge.height,ledge.ramp);
    if(h>height) {height=h;kind=(x<ledge.from+ledge.ramp||x>ledge.to-ledge.ramp)?'climb':'walk';progress=clamp((x-ledge.from)/(ledge.to-ledge.from),0,1);}
  }
  for(const gap of spec.gaps) if(x>=gap.from&&x<=gap.to) {progress=(x-gap.from)/(gap.to-gap.from);height+=Math.sin(progress*Math.PI)*.17;kind='step';}
  for(const crawl of spec.crawl) {
    if(staff) {const h=rampHeight(x,crawl.from-.8,crawl.to+.8,crawl.clearance+.15,.8);if(h>height){height=h;kind='service';}}
    else if(x>=crawl.from&&x<=crawl.to) kind='crouch';
  }
  for(const machine of spec.machines) {
    if(staff) height=Math.max(height,rampHeight(x,machine.from-.8,machine.to+.8,machine.maxY,.8));
    else if(x>=machine.from-.15&&x<=machine.to+.15) kind='crouch';
  }
  const cart=currentRoom(state).cartX;
  if(!staff&&cart!==null&&Math.abs(cart-x)<1.8) kind='crouch';
  return {kind,height,progress};
}
export function getHeight(state,entity=actor(state)) {return getTraversal(state,entity).height;}
function eyePoint(state,entity) {
  const traversal=getTraversal(state,entity);
  return {x:entity.x,y:traversal.height+(entity.role?1.92:traversal.kind==='crouch'?.57:.97),plane:plane(entity)};
}
/** Only geometry on the gameplay plane occludes. Architecture behind it is decorative. */
export function getOccluders(state,roomIndex=state.room) {
  const spec=ROOMS[roomIndex],room=state.rooms[roomIndex];
  const blockers=spec.glass.map(g=>({kind:'glass',from:g.x-.04,to:g.x+.04,minY:g.minY??.75,maxY:g.maxY??6,plane:0}));
  if(!room.gateOpen) blockers.push({kind:'gate',from:spec.gateX-.1,to:spec.gateX+.1,minY:0,maxY:4.4,plane:0});
  for(const box of [...spec.machines,...spec.walls]) blockers.push({...box,kind:box.kind??'machine',plane:box.plane??0});
  if(room.cartX!==null) blockers.push({kind:'machine',from:room.cartX-1.5,to:room.cartX+1.5,minY:.85,maxY:1.65,plane:0});
  return blockers;
}
function intersectBox(from,to,box) {
  let lo=0,hi=1;
  for(const [start,delta,min,max] of [[from.x,to.x-from.x,box.from,box.to],[from.y,to.y-from.y,box.minY,box.maxY]]) {
    if(Math.abs(delta)<1e-9) {if(start<min||start>max)return null;continue;}
    const t1=(min-start)/delta,t2=(max-start)/delta;
    lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return null;
  }
  return {t:lo,x:from.x+(to.x-from.x)*lo,y:from.y+(to.y-from.y)*lo,kind:box.kind};
}
export function traceRay(state,from,to) {
  if((from.plane??0)!==(to.plane??0))return {clear:false,obstruction:null,reason:'plane'};
  const hits=getOccluders(state).filter(b=>b.plane===(from.plane??0)).map(b=>intersectBox(from,to,b)).filter(Boolean).sort((a,b)=>a.t-b.t);
  return {clear:!hits.length,obstruction:hits[0]??null,reason:hits[0]?.kind??null};
}
/** Number arguments are convenient ground sight points; precise callers supply {x,y,plane}. */
export function clearRay(state,a,b) {
  const from=typeof a==='number'?{x:a,y:.97,plane:0}:a;
  const to=typeof b==='number'?{x:b,y:1.92,plane:0}:b;
  return traceRay(state,from,to).clear;
}
export function isHidden(state,x=state.nim.x) {
  const spec=ROOMS[state.room],room=currentRoom(state);
  // Open niche lips are deliberately unsafe; the deep recess starts 15cm in.
  if(spec.covers.some(c=>x>=c.from+(c.from>0?.15:0)&&x<=c.to-(c.to<spec.length?.15:0)))return true;
  if(state.nim.route==='bridge'&&room.bridgeOpen&&x>=18.5&&x<=28)return true;
  if(room.cartX!==null&&Math.abs(room.cartX-x)<2.5)return true;
  return false;
}
function targetInfo(state,g) {
  const from=eyePoint(state,state.nim),to=eyePoint(state,g),dx=to.x-from.x,distance=Math.hypot(dx,to.y-from.y);
  const ray=traceRay(state,from,to);
  const reason=dx*state.nim.facing<=.05?'facing':distance>6?'range':!ray.clear?ray.reason:null;
  return {target:g,eligible:reason===null,reason,obstruction:ray.obstruction,distance,from,to};
}
function eligibleTarget(state,g) {return targetInfo(state,g).eligible;}
export function getTargetInfo(state) {
  if(state.phase!=='playing'||state.controlled)return null;
  const candidates=currentRoom(state).guards.map(g=>targetInfo(state,g)).sort((a,b)=>a.distance-b.distance);
  return candidates.find(c=>c.eligible)||candidates.find(c=>c.reason!=='facing'&&c.distance<=6)||null;
}
export function getTarget(state) {const info=getTargetInfo(state);return info?.eligible?info.target:null;}
function guardSees(state,g,target,range=7.5) {
  const from=eyePoint(state,g),to=typeof target==='number'?{x:target,y:1.92,plane:plane(g)}:eyePoint(state,target);
  const dx=to.x-from.x,dy=to.y-from.y;
  return dx*g.facing>=0&&Math.hypot(dx,dy)<=range&&Math.abs(dy)<=Math.abs(dx)*1.74+.6&&traceRay(state,from,to).clear;
}
export function getGuardState(state,g) {
  if(g.id===state.controlled)return 'controlled';if(g.recovery>0)return 'recover';if(g.alert>0)return 'detect';
  if(g.listen>0)return 'listen';if(g.investigate!==null)return g.inspect>0?'inspect':'investigate';return 'patrol';
}
function sound(state,x,exceptId) {
  for(const g of currentRoom(state).guards) {
    if(g.id===exceptId||g.id===state.controlled||g.recovery>0)continue;
    const source={x,y:1.92,plane:0};
    if((Math.abs(g.x-x)<=3&&traceRay(state,eyePoint(state,g),source).clear)||guardSees(state,g,x)) {
      g.investigate=x;g.inspect=0;g.listen=.45;g.facing=x>=g.x?1:-1;
      emit(state,'investigate','heardTransition',{guardId:g.id,x});
    }
  }
}
export function possess(state) {
  if(state.phase!=='playing') return false;
  if(state.controlled) {
    const g=actor(state); g.recovery=2;g.alert=0;
    state.controlled=null;state.transition=null;
    milestone(state,'returned');emit(state,'return','returned',{guardId:g.id}); return true;
  }
  if(state.transition) { state.transition=null;emit(state,'possessionCancel','noTarget');return false; }
  const g=getTarget(state);
  if(!g) {const info=getTargetInfo(state);emit(state,'blocked',info?.reason==='glass'?'targetBlockedGlass':info?.reason==='machine'?'targetBlockedMachine':'noTarget');return false;}
  state.transition={target:g.id,progress:0};sound(state,g.x,g.id);
  emit(state,'possessionStart','possessionStart',{guardId:g.id});return true;
}
export function getInteraction(state) {
  if(state.phase!=='playing') return null;
  const a=actor(state), r=currentRoom(state), spec=ROOMS[state.room], near=x=>x!==null&&Math.abs(a.x-x)<=1.65;
  if(!state.controlled) {
    if(spec.crateX!==null&&!r.rescued&&near(spec.crateX)) return {key:'rescue',x:spec.crateX,enabled:true};
    if(state.room===3&&near(34)) return {key:'depart',x:34,enabled:true};
    if(r.bridgeOpen&&state.room!==2&&state.nim.route==='floor') {
      if(a.x>=18.65&&near(19.4)) return {key:'climb',x:19.4,enabled:true};
      if(a.x<=27.95&&near(26.5)) return {key:'climb',x:26.5,enabled:true};
    }
    if(near(spec.readerX)&&!r.gateOpen) return {key:'needKeeper',x:spec.readerX,enabled:false};
    if(near(spec.consoleX)&&!r.bridgeOpen&&!r.mechanism.active) return {key:'needTech',x:spec.consoleX,enabled:false};
    if(state.room<3&&near(35)) return {key:'nextRoom',x:35,enabled:true};
    if(state.room>0&&near(1)) return {key:'previousRoom',x:1,enabled:true};
    if(!r.gateOpen&&!r.bridgeOpen&&near(spec.gateX-0.5)) return {key:'blockedGate',x:spec.gateX,enabled:false};
    return null;
  }
  if(near(spec.readerX)&&!r.gateOpen) return {key:a.role==='keeper'?'openGate':'needKeeper',x:spec.readerX,enabled:a.role==='keeper'};
  if(near(spec.consoleX)&&!r.bridgeOpen&&!r.mechanism.active) return {key:a.role==='tech'?(state.room===2?'moveCart':'deployBridge'):'needTech',x:spec.consoleX,enabled:a.role==='tech'};
  return null;
}
function enterRoom(state,index,fromRight=false) {
  if(index<0||index>=ROOMS.length) return;
  state.room=index;state.nim.x=fromRight?34.2:1.8;state.nim.facing=fromRight?-1:1;state.nim.route='floor';
  state.roomTime=0;state.transition=null;state.visits[index]=true;if(index===3)milestone(state,'reachedDock');
  checkpoint(state);emit(state,'room',ROOMS[index].key,{room:index});
}
export function action(state) {
  if(state.transition||state.phase!=='playing') return false;
  const interaction=getInteraction(state);
  if(!interaction) return false;
  if(!interaction.enabled) {emit(state,'blocked','wrongRole');return false;}
  const room=currentRoom(state);
  switch(interaction.key) {
    case 'openGate': room.gateOpen=true;milestone(state,'openedGate');emit(state,'gate','gateOpened');break;
    case 'deployBridge': case 'moveCart':
      milestone(state,'usedMechanism');room.mechanism={active:true,progress:0,kind:interaction.key==='moveCart'?'cart':'bridge'};
      if(state.room===2) room.cartX=17;
      sound(state,actor(state).x,state.controlled);
      emit(state,'mechanism',interaction.key==='moveCart'?'cartMoving':'bridgeMoving');break;
    case 'climb': state.nim.route='bridge';milestone(state,'bridge');emit(state,'climb','climb');break;
    case 'rescue': room.rescued=true;milestone(state,'rescued'+rescuedCount(state));checkpoint(state);emit(state,'rescue','creatureRescued',{count:rescuedCount(state)});break;
    case 'depart': milestone(state,'departed');state.phase='won';state.ending=rescuedCount(state);emit(state,'won','ending'+state.ending,{count:state.ending});break;
    case 'nextRoom': enterRoom(state,state.room+1);break;
    case 'previousRoom': enterRoom(state,state.room-1,true);break;
    default:return false;
  }
  return true;
}
export function rescuedCount(state) {return state.rooms.filter(r=>r.rescued).length;}
function moveActor(state,a,move,dt) {
  if(!move) return;
  const spec=ROOMS[state.room],room=currentRoom(state), before=a.x;
  a.facing=move>0?1:-1;milestone(state,'moved');
  let next=a.x+move*dt*(state.controlled?2.65:3.35);
  // A low crawl beneath the garden glazing is available only to Nim.
  if(state.controlled) {
    next=clamp(next,.8,35.2);
    for(const glass of spec.glass) if(crosses(a.x,next,glass.x)) next=a.x<glass.x?glass.x-.15:glass.x+.15;
  } else next=clamp(next,.35,35.65);
  if(!room.gateOpen&&a.route!=='bridge'&&crosses(a.x,next,spec.gateX)) next=a.x<spec.gateX?spec.gateX-.2:spec.gateX+.2;
  a.x=next;
  if(a.route==='bridge'&&(a.x<18.6||a.x>28)) a.route='floor';
  if(!state.controlled) {
    if(a.x>=35.6&&state.room<3) enterRoom(state,state.room+1);
    else if(a.x<=.4&&state.room>0) enterRoom(state,state.room-1,true);
  } else if(before!==next&&(next===.8||next===35.2)) emit(state,'blocked','carrierBoundary');
}
function patrolMove(state,g,target,speed,dt) {
  const d=target-g.x;
  if(Math.abs(d)<.06) return true;
  g.facing=Math.sign(d);
  let next=g.x+Math.sign(d)*Math.min(Math.abs(d),speed*dt);
  const room=currentRoom(state),spec=ROOMS[state.room];
  if(!room.gateOpen&&crosses(g.x,next,spec.gateX)) next=g.x<spec.gateX?spec.gateX-.2:spec.gateX+.2;
  for(const glass of spec.glass) if(crosses(g.x,next,glass.x)) next=g.x<glass.x?glass.x-.15:glass.x+.15;
  g.x=clamp(next,.8,35.2);return Math.abs(target-g.x)<.06;
}
export function step(state,dt,input={}) {
  if(state.phase!=='playing'||!Number.isFinite(dt)||dt<=0) return state;
  dt=Math.min(dt,.1);state.time+=dt;state.roomTime+=dt;
  moveActor(state,actor(state),clamp(Number(input.move)||0,-1,1),dt);
  const room=currentRoom(state);
  const traversal=getTraversal(state,state.nim);
  if(traversal.kind==='crouch')milestone(state,'crouched');
  if(traversal.kind==='climb')milestone(state,'climbedLedge');
  if(traversal.kind==='step')milestone(state,'crossedGap');
  const target=getTargetInfo(state);if(target?.eligible)milestone(state,'sawTarget');if(target?.reason==='glass')milestone(state,'blockedGlass');
  if(state.transition) {
    const g=room.guards.find(g=>g.id===state.transition.target);
    if(!g||!eligibleTarget(state,g)) {state.transition=null;emit(state,'possessionCancel','noTarget');}
    else {
      state.transition.progress+=dt;
      if(state.transition.progress>=.6-1e-9) {
        state.controlled=g.id;state.transition=null;g.alert=0;g.recovery=0;milestone(state,g.role==='keeper'?'borrowedKeeper':'borrowedTech');
        emit(state,'possession',g.role==='keeper'?'possessedKeeper':'possessedTech',{guardId:g.id});
      }
    }
  }
  // Mechanisms and previously visited rooms continue while Nim is elsewhere.
  // Unvisited rooms start their authored patrol when the player first arrives.
  for(let index=0;index<state.rooms.length;index++) {
    const liveRoom=state.rooms[index],active=index===state.room;
    if(liveRoom.mechanism.active) {
      liveRoom.mechanism.progress=Math.min(1,liveRoom.mechanism.progress+dt/3);
      if(liveRoom.mechanism.kind==='cart')liveRoom.cartX=17+7*liveRoom.mechanism.progress;
      if(liveRoom.mechanism.progress>=1-1e-9) {
        liveRoom.mechanism.active=false;liveRoom.mechanism.progress=1;liveRoom.bridgeOpen=true;
        if(liveRoom.mechanism.kind==='cart'){liveRoom.cartX=24;liveRoom.gateOpen=true;}
        if(active)emit(state,'mechanism','routeReady');
      }
    }
    if(!active&&!state.visits[index])continue;
    const context=active?state:{...state,room:index};
    for(const g of liveRoom.guards) {
      if(active&&g.id===state.controlled)continue;
      if(g.recovery>0){g.recovery=Math.max(0,g.recovery-dt);continue;}
      const sees=active&&!isHidden(state)&&guardSees(state,g,state.nim);
      if(sees) {
        g.alert=Math.min(2,g.alert+dt);
        if(g.alert>=2-1e-9) {
          state.phase='lost';state.loss={key:state.controlled?'bodyFound':'nimFound',guardId:g.id,room:state.room,x:state.nim.x};
          emit(state,'lost',state.loss.key,{guardId:g.id});break;
        }
        continue;
      }
      g.alert=0;
      if(g.listen>0){g.listen=Math.max(0,g.listen-dt);continue;}
      if(g.investigate!==null) {
        if(patrolMove(context,g,g.investigate,1.35,dt)) {
          g.inspect+=dt;
          if(g.inspect>=2.5){g.investigate=null;g.inspect=0;if(active)emit(state,'investigate','investigationFinished',{guardId:g.id});}
        }
      } else {
        let target;
        if(g.x<g.patrol[0])target=g.patrol[0];
        else if(g.x>g.patrol[1])target=g.patrol[1];
        else target=g.facing>0?g.patrol[1]:g.patrol[0];
        if(patrolMove(context,g,target,.68,dt))g.facing*=-1;
      }
    }
  }
  return state;
}
export function retry(state) {
  if(!state.checkpoint) return createGame();
  const saved=copy(state.checkpoint),cp=copy(state.checkpoint);
  for(const key of Object.keys(state)) delete state[key];
  Object.assign(state,saved,{phase:'playing',loss:null,events:[],checkpoint:cp});
  emit(state,'checkpoint','checkpoint');return state;
}
export function serialize(state) {return JSON.stringify({version:VERSION,state:{...state,events:[]}});}
function validState(s,checkpointOnly=false) {
  if(!s||s.version!==VERSION||!['playing','won','lost'].includes(s.phase)||!Number.isInteger(s.room)||s.room<0||s.room>3) return false;
  if(!s.nim||!Number.isFinite(s.nim.x)||s.nim.x<0||s.nim.x>36||![-1,1].includes(s.nim.facing)||!['floor','bridge'].includes(s.nim.route)) return false;
  if(!Number.isFinite(s.time)||s.time<0||!Number.isFinite(s.roomTime)||!Array.isArray(s.visits)||s.visits.length!==4) return false;
  if(!Array.isArray(s.rooms)||s.rooms.length!==4) return false;
  if(s.milestones!==undefined&&(!s.milestones||typeof s.milestones!=='object'||Array.isArray(s.milestones)||Object.values(s.milestones).some(v=>typeof v!=='boolean')))return false;
  for(let i=0;i<4;i++) {
    const r=s.rooms[i];
    if(!r||!Array.isArray(r.guards)||r.guards.length!==ROOMS[i].guards.length||['gateOpen','bridgeOpen','rescued'].some(k=>typeof r[k]!=='boolean')) return false;
    if(!r.mechanism||typeof r.mechanism.active!=='boolean'||!Number.isFinite(r.mechanism.progress)||r.mechanism.progress<0||r.mechanism.progress>1||![null,'cart','bridge'].includes(r.mechanism.kind)) return false;
    if(r.cartX!==null&&(!Number.isFinite(r.cartX)||r.cartX<0||r.cartX>36)) return false;
    for(let n=0;n<r.guards.length;n++) {
      const g=r.guards[n],base=ROOMS[i].guards[n];
      if(g.id!==base.id||g.role!==base.role||!Number.isFinite(g.x)||g.x<0||g.x>36||![-1,1].includes(g.facing)||!['floor','bridge'].includes(g.route)) return false;
      if(!['alert','recovery','inspect'].every(k=>Number.isFinite(g[k])&&g[k]>=0)) return false;
      if(g.listen!==undefined&&(!Number.isFinite(g.listen)||g.listen<0||g.listen>.45))return false;
      if(g.investigate!==null&&(!Number.isFinite(g.investigate)||g.investigate<0||g.investigate>36)) return false;
      if(!Array.isArray(g.patrol)||g.patrol.length!==2||g.patrol.some((x,j)=>x!==base.patrol[j])) return false;
    }
  }
  if(s.controlled!==null&&!s.rooms[s.room].guards.some(g=>g.id===s.controlled)) return false;
  if(s.transition!==null&&(!s.transition||s.controlled!==null||!Number.isFinite(s.transition.progress)||s.transition.progress<0||s.transition.progress>.6||!s.rooms[s.room].guards.some(g=>g.id===s.transition.target))) return false;
  if(!checkpointOnly&&(!s.checkpoint||!validState(s.checkpoint,true))) return false;
  return true;
}
export function restore(json) {
  try {
    const data=typeof json==='string'?JSON.parse(json):copy(json);
    if(data?.version!==VERSION||!validState(data.state)) return null;
    const s=data.state;s.events=[];s.milestones??={};for(const r of s.rooms)for(const g of r.guards)g.listen??=0;return s;
  } catch {return null;}
}
