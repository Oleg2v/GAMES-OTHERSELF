/** OTHERSELF deterministic 2D physics / 3D presentation contract. No browser globals. */
export const VERSION = 2;
export const PHYSICS = Object.freeze({ gravity:18, jumpSpeed:7.4, walkSpeed:3.6, crawlSpeed:1.65, staffSpeed:2.65, climbSpeed:2.1, nimHeight:1.18, crouchHeight:.62, staffHeight:2, coyoteTime:.12, jumpBuffer:.14 });
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=v=>JSON.parse(JSON.stringify(v));
const platform=(id,from,to,y,extra={})=>({id,from,to,y,thickness:.22,oneWay:true,grate:true,...extra});
const ladder=(id,x,bottom,top)=>({id,x,bottom,top,staff:true});
const cover=(from,to,y=0,maxHeight=1.3)=>({from,to,y,maxHeight});
const worker=(r,role,x,y,min,max)=>({id:`r${r}-${role}`,role,x,y,patrol:[min,max],patrolY:y,facing:1});
export const ROOMS=[
 {key:'vestibule',length:36,gateX:22,gateHeight:7,readerX:19,readerY:2.3,consoleX:null,consoleY:0,crateX:null,crateY:0,exitY:2.3,bellY:0,
  platforms:[platform('r0-ground-a',0,12,0),platform('r0-ground-b',14,36,0),platform('r0-mid-a',6,21,2.3),platform('r0-observatory',15,20,4.8),platform('r0-exit-a',27,31,2.3),platform('r0-exit-b',32.7,36,2.3)],
  ladders:[ladder('r0-l1',7,0,2.3),ladder('r0-l2',16,2.3,4.8),ladder('r0-l3',29,0,2.3),ladder('r0-l4',18.5,0,2.3)],
  pits:[{from:12,to:14,bottom:-4.5}],crawl:[{from:3,to:5.4,y:0,clearance:.82,maxY:1.8}],
  covers:[cover(0,2.7),cover(6.3,8.1,2.3),cover(15.5,17.8,2.3),cover(15.2,17.7,4.8),cover(26.5,29.5),cover(27.3,29.8,2.3),cover(33,36,2.3)],
  glass:[],machines:[],walls:[],guards:[worker(0,'keeper',10,2.3,9,15)],
  items:[{id:'r0-bolt',kind:'bolt',x:2.2,y:0},{id:'r0-can',kind:'can',x:18.5,y:4.8}]},
 {key:'sorting',length:36,gateX:22,gateHeight:4.25,readerX:12,readerY:2.3,consoleX:18,consoleY:4.8,crateX:29.5,crateY:0,exitY:2.3,bellY:0,
  platforms:[platform('r1-ground-a',0,11,0),platform('r1-ground-b',13,36,0),platform('r1-mid-a',7,16,2.3),platform('r1-mid-b',17.6,30.8,2.3),platform('r1-exit',32.5,36,2.3),platform('r1-top-a',13,20,4.8),platform('r1-bridge',20,24,4.8,{activeWhen:'bridgeOpen'}),platform('r1-top-b',24,29,4.8)],
  ladders:[ladder('r1-l1',8,0,2.3),ladder('r1-l2',14,2.3,4.8),ladder('r1-l3',25,2.3,4.8),ladder('r1-l4',28,0,2.3)],
  pits:[{from:11,to:13,bottom:-4.5}],crawl:[{from:3.1,to:5.5,y:0,clearance:.82,maxY:1.8}],
  covers:[cover(0,2.8),cover(7.2,9.3,2.3),cover(13.2,15.5,4.8),cover(18.3,20.7,2.3),cover(24,26,4.8),cover(27,30.7),cover(27,29.9,2.3),cover(32.8,36,2.3)],
  glass:[],machines:[{from:16.2,to:17.4,minY:0,maxY:1.8}],walls:[],guards:[worker(1,'keeper',10,2.3,9,14),worker(1,'tech',17,4.8,15,19)],
  items:[{id:'r1-bolt',kind:'bolt',x:2.2,y:0},{id:'r1-can',kind:'can',x:14.8,y:4.8},{id:'r1-bolt2',kind:'bolt',x:28.8,y:0}]},
 {key:'garden',length:36,gateX:22,gateHeight:6.8,readerX:17,readerY:2.3,consoleX:18,consoleY:4.8,crateX:28,crateY:2.3,exitY:2.3,bellY:0,
  platforms:[platform('r2-ground-a',0,9,0),platform('r2-ground-b',11,36,0),platform('r2-mid-a',6,19,2.3),platform('r2-canopy',14,20,4.8),platform('r2-exit-a',24,30.5,2.3),platform('r2-exit-b',32,36,2.3)],
  ladders:[ladder('r2-l1',6.7,0,2.3),ladder('r2-l2',12,0,2.3),ladder('r2-l3',17,2.3,4.8),ladder('r2-l4',29,0,2.3)],
  pits:[{from:9,to:11,bottom:-4.5}],crawl:[{from:3,to:5.3,y:0,clearance:.82,maxY:1.8},{from:7.2,to:8.35,y:0,clearance:.75,maxY:1.65}],
  covers:[cover(0,2.8),cover(6.1,7.6,2.3),cover(11.1,13.7),cover(11.3,13.5,2.3),cover(14.2,16.8,4.8),cover(16.2,18.8,2.3),cover(19.2,21.5),cover(26.1,29.9),cover(26.2,29.8,2.3),cover(32.3,36,2.3)],
  glass:[{x:8,minY:.75,maxY:4.6}],machines:[],walls:[],guards:[worker(2,'keeper',12.8,2.3,10,16),worker(2,'tech',17.3,4.8,15,19)],
  items:[{id:'r2-bolt',kind:'bolt',x:2.2,y:0},{id:'r2-can',kind:'can',x:12,y:0}]},
 {key:'dock',length:36,gateX:22,gateHeight:4.25,readerX:12.5,readerY:2.3,consoleX:18,consoleY:4.8,crateX:null,crateY:0,exitY:4.8,bellY:4.8,
  platforms:[platform('r3-ground-a',0,14,0),platform('r3-ground-b',16,36,0),platform('r3-mid-a',5.8,14,2.3),platform('r3-mid-b',16,30,2.3),platform('r3-top-a',12,20,4.8),platform('r3-bridge',20,24,4.8,{activeWhen:'bridgeOpen'}),platform('r3-top-b',24,30,4.8),platform('r3-shuttle',31.5,36,4.8)],
  ladders:[ladder('r3-l1',7,0,2.3),ladder('r3-l2',13,2.3,4.8),ladder('r3-l3',26,2.3,4.8),ladder('r3-l4',29,0,2.3)],
  pits:[{from:14,to:16,bottom:-4.5}],crawl:[{from:3,to:5.3,y:0,clearance:.82,maxY:1.8}],
  covers:[cover(0,2.8),cover(6.1,8.4,2.3),cover(12.3,14.8,4.8),cover(16.2,18.6,2.3),cover(24.3,27.2,4.8),cover(27.3,30.4),cover(27.5,29.8,2.3),cover(32,36,4.8)],
  glass:[],machines:[],walls:[],guards:[worker(3,'keeper',10,2.3,8,12),worker(3,'tech',17,4.8,15,19)],
  items:[{id:'r3-bolt',kind:'bolt',x:2.2,y:0},{id:'r3-can',kind:'can',x:13.2,y:4.8}]}
];
ROOMS.forEach(r=>{r.gaps=r.pits;r.ledges=[];});
export function currentRoom(state){return state.rooms[state.room];}
export function actor(state){return state.controlled?currentRoom(state).guards.find(g=>g.id===state.controlled):state.nim;}
const emit=(s,type,key,details={})=>{s.events.push({type,key,room:s.room,...details});if(s.events.length>100)s.events.shift();};
const milestone=(s,key)=>{s.milestones[key]=true;};
const entity=(x,y,extra={})=>({x,y,vy:0,grounded:true,crouching:false,ladderId:null,facing:1,plane:0,route:'floor',surfaceId:null,coyote:0,jumpBuffer:0,...extra});
function snapshot(s){const {checkpoint,events,...data}=s;return copy(data);}
export function checkpoint(s){s.checkpoint=snapshot(s);emit(s,'checkpoint','checkpoint');}
export function createGame(){
 const s={version:VERSION,phase:'playing',room:0,nim:entity(1.8,0,{heldItem:null,throwTime:0}),controlled:null,transition:null,milestones:{},time:0,roomTime:0,visits:[true,false,false,false],loss:null,events:[],checkpoint:null,
 rooms:ROOMS.map((r,index)=>({guards:r.guards.map(g=>entity(g.x,g.y,{...copy(g),alert:0,recovery:0,investigate:null,inspect:0,listen:0,searchTurns:0})),gateOpen:false,bridgeOpen:false,rescued:false,cartX:null,mechanism:{active:false,progress:0,kind:null},items:r.items.map(i=>({...copy(i),homeX:i.x,homeY:i.y,homeRoom:index,available:true})),projectiles:[],noises:[],nextProjectile:0}))};
 checkpoint(s);return s;
}
export function getPlatforms(s,index=s.room){return ROOMS[index].platforms.filter(p=>!p.activeWhen||s.rooms[index][p.activeWhen]);}
export function getHeight(s,e=actor(s)){return e?.y??0;}
export function getTraversal(s,e=actor(s)){
 const l=ROOMS[s.room].ladders.find(l=>l.id===e.ladderId);
 return {kind:e.ladderId?'ladder':!e.grounded?(e.vy>0?'jump':'fall'):e.crouching?'crouch':'walk',height:e.y,progress:l?clamp((e.y-l.bottom)/(l.top-l.bottom),0,1):0};
}
function bodyHeight(e){return e.role ? PHYSICS.staffHeight : e.collapsed ? .46 : e.crouching ? PHYSICS.crouchHeight : PHYSICS.nimHeight;}
function radius(e){return e.role ? .35 : .21;}
function eyePoint(s,e){return {x:e.x,y:e.y+(e.role ? 1.72 : e.collapsed ? .3 : e.crouching ? .48 : 1),plane:e.plane??0};}
export function getOccluders(s,index=s.room){
 const spec=ROOMS[index],r=s.rooms[index];
 const out=spec.glass.map(g=>({kind:'glass',from:g.x-.05,to:g.x+.05,minY:g.minY,maxY:g.maxY,plane:0}));
 if(!r.gateOpen)out.push({kind:'gate',from:spec.gateX-.13,to:spec.gateX+.13,minY:0,maxY:spec.gateHeight,plane:0});
 for(const b of [...spec.machines,...spec.walls])out.push({...b,kind:b.kind??'machine',plane:0});
 for(const c of spec.crawl)out.push({kind:'duct',from:c.from,to:c.to,minY:c.y+c.clearance,maxY:c.y+c.maxY,plane:0});
 for(const p of getPlatforms(s,index))if(!p.grate)out.push({kind:'platform',from:p.from,to:p.to,minY:p.y-p.thickness,maxY:p.y,plane:0});
 if(r.cartX!==null)out.push({kind:'machine',from:r.cartX-1.4,to:r.cartX+1.4,minY:.8,maxY:1.8,plane:0});
 return out;
}
function intersectBox(a,b,box){
 let lo=0,hi=1;
 for(const [start,d,min,max]of[[a.x,b.x-a.x,box.from,box.to],[a.y,b.y-a.y,box.minY,box.maxY]]){
  if(Math.abs(d)<1e-9){if(start<min||start>max)return null;continue;}
  const t1=(min-start)/d,t2=(max-start)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return null;
 }
 return{t:lo,x:a.x+(b.x-a.x)*lo,y:a.y+(b.y-a.y)*lo,kind:box.kind};
}
export function traceRay(s,a,b){
 if((a.plane??0)!==(b.plane??0))return{clear:false,reason:'plane',obstruction:null};
 const hits=getOccluders(s).filter(v=>(v.plane??0)===(a.plane??0)).map(v=>intersectBox(a,b,v)).filter(Boolean).sort((a,b)=>a.t-b.t);
 return{clear:!hits.length,reason:hits[0]?.kind??null,obstruction:hits[0]??null};
}
export function clearRay(s,a,b){return traceRay(s,typeof a==='number'?{x:a,y:1}:a,typeof b==='number'?{x:b,y:1.72}:b).clear;}
export function isHidden(s,x=s.nim.x,y=s.nim.y){
 const spec=ROOMS[s.room],r=currentRoom(s),n=s.nim;
 if(spec.covers.some(c=>x>=c.from+(c.from>0?.15:0)&&x<=c.to-(c.to<36?.15:0)&&Math.abs(y-c.y)<.16&&bodyHeight(n)<=c.maxHeight))return true;
 if(n.crouching&&spec.crawl.some(c=>x>c.from+.2&&x<c.to-.2&&Math.abs(y-c.y)<.1))return true;
 return r.cartX!==null&&Math.abs(r.cartX-x)<2.2&&y<.2&&n.crouching;
}
function targetInfo(s,g){
 const from=eyePoint(s,s.nim),to=eyePoint(s,g),dx=to.x-from.x,distance=Math.hypot(dx,to.y-from.y),ray=traceRay(s,from,to);
 const reason=dx*s.nim.facing<=.04?'facing':distance>6?'range':!ray.clear?ray.reason:null;
 return{target:g,eligible:reason===null,reason,obstruction:ray.obstruction,distance,from,to};
}
export function getTargetInfo(s){if(s.phase!=='playing'||s.controlled)return null;const a=currentRoom(s).guards.map(g=>targetInfo(s,g)).sort((a,b)=>a.distance-b.distance);return a.find(i=>i.eligible)||a.find(i=>i.reason!=='facing'&&i.distance<=6)||null;}
export function getTarget(s){const i=getTargetInfo(s);return i?.eligible?i.target:null;}
export function getGuardState(s,g){return g.id===s.controlled?'controlled':g.recovery>0?'recover':g.alert>0?'detect':g.listen>0?'listen':g.investigate?(g.inspect>0?'inspect':'investigate'):'patrol';}
function guardSees(s,g,point){const a=eyePoint(s,g),b=point.role!==undefined||point.grounded!==undefined?eyePoint(s,point):point,dx=b.x-a.x,dy=b.y-a.y;return dx*g.facing>=0&&Math.hypot(dx,dy)<=8&&Math.abs(dy)<=Math.abs(dx)*1.75+.6&&traceRay(s,a,b).clear;}
function getSurfaces(s,index=s.room){return [...getPlatforms(s,index),...getOccluders(s,index).map((b,i)=>({id:`solid-${index}-${i}`,from:b.from,to:b.to,y:b.maxY,thickness:0,oneWay:false,grate:false}))];}
function supportAt(s,x,y,index=s.room){return getSurfaces(s,index).filter(p=>x>=p.from-.02&&x<=p.to+.02&&Math.abs(p.y-y)<.16).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y))[0]??null;}
function availableLadder(s,e,dir){return ROOMS[s.room].ladders.find(l=>(!e.role||l.staff)&&Math.abs(e.x-l.x)<=.55&&e.y>=l.bottom-.12&&e.y<=l.top+.12&&(dir>0?e.y<l.top-.02:e.y>l.bottom+.02));}
function canStand(s,e){return !getOccluders(s).some(b=>e.x+radius(e)>b.from&&e.x-radius(e)<b.to&&e.y+PHYSICS.nimHeight>b.minY+.01&&e.y<b.maxY-.01);}
export function toggleCrouch(s){if(s.phase!=='playing'||s.controlled)return false;const n=s.nim;if(n.crouching&&!canStand(s,n)){emit(s,'blocked','cannotStand');return false;}n.crouching=!n.crouching;if(n.crouching)milestone(s,'crouched');emit(s,'crouch',n.crouching?'crouchEnabled':'crouchDisabled');return true;}
function performJump(s,n){
 if(n.crouching&&!canStand(s,n))return false;
 if(!n.grounded&&n.coyote<=0&&!n.ladderId)return false;
 n.crouching=false;n.vy=PHYSICS.jumpSpeed;n.grounded=false;n.ladderId=null;n.coyote=0;n.jumpBuffer=0;
 milestone(s,'jumped');emit(s,'jump',null);return true;
}
export function jump(s){if(s.phase!=='playing'||s.controlled)return false;s.nim.jumpBuffer=PHYSICS.jumpBuffer;return performJump(s,s.nim);}
function collides(s,e,x,y,height=bodyHeight(e)){
 const r=radius(e);return getOccluders(s).some(b=>x+r>b.from+.001&&x-r<b.to-.001&&y+height>b.minY+.001&&y<b.maxY-.001);
}
function physics(s,e,dt,input={},speed=null){
 let move=clamp(Number(input.move)||0,-1,1),climb=clamp(Number(input.climb)||0,-1,1);
 const wasGrounded=e.grounded,oldY=e.y;
 e.jumpBuffer=Math.max(0,(e.jumpBuffer||0)-dt);e.coyote=Math.max(0,(e.coyote||0)-dt);
 if(move)e.facing=Math.sign(move);
 if(e.ladderId&&Math.abs(move)>.6){e.ladderId=null;e.grounded=false;}
 if(!e.ladderId&&climb){const l=availableLadder(s,e,climb);if(l){e.ladderId=l.id;e.x=l.x;e.vy=0;e.grounded=false;if(!e.role){milestone(s,'climbedLadder');emit(s,'ladder','climbLadder');}}}
 if(e.ladderId){
  const l=ROOMS[s.room].ladders.find(l=>l.id===e.ladderId);
  if(!l){e.ladderId=null;}else{
   e.x=l.x;e.vy=0;e.y=clamp(e.y+climb*dt*(e.role?1.65:PHYSICS.climbSpeed),l.bottom,l.top);
   if((climb>0&&e.y>=l.top-.001)||(climb<0&&e.y<=l.bottom+.001)){e.ladderId=null;e.grounded=Boolean(supportAt(s,e.x,e.y));e.surfaceId=supportAt(s,e.x,e.y)?.id??null;}
   return;
  }
 }
 if(!e.role&&e.jumpBuffer>0&&!e.collapsed)performJump(s,e);
 const velocity=speed??(e.role?PHYSICS.staffSpeed:e.crouching?PHYSICS.crawlSpeed:PHYSICS.walkSpeed);
 let nextX=clamp(e.x+move*velocity*dt,.24,35.76),r=radius(e),h=bodyHeight(e);
 for(const b of getOccluders(s))if(e.y+h>b.minY+.001&&e.y<b.maxY-.001){
  if(move>0&&e.x+r<=b.from+.02&&nextX+r>b.from)nextX=Math.min(nextX,b.from-r);
  else if(move<0&&e.x-r>=b.to-.02&&nextX-r<b.to)nextX=Math.max(nextX,b.to+r);
 }
 e.x=nextX;
 const ground=supportAt(s,e.x,e.y);
 if(e.grounded&&!ground){e.grounded=false;e.coyote=PHYSICS.coyoteTime;}
 if(e.grounded&&e.vy<=0){e.vy=0;e.surfaceId=ground?.id??null;return;}
 e.vy-=PHYSICS.gravity*dt;let nextY=e.y+e.vy*dt;
 if(e.vy>0){for(const b of getOccluders(s))if(e.x+r>b.from&&e.x-r<b.to&&e.y+h<=b.minY+.01&&nextY+h>b.minY){nextY=Math.min(nextY,b.minY-h);e.vy=0;}}
 let landing=null;
 if(e.vy<=0)for(const p of getSurfaces(s))if(e.x>=p.from-.015&&e.x<=p.to+.015&&e.y>=p.y-.015&&nextY<=p.y&&(!landing||p.y>landing.y))landing=p;
 if(landing){
  const strength=clamp(-e.vy/12,0,1);e.y=landing.y;e.vy=0;e.grounded=true;e.surfaceId=landing.id;e.coyote=PHYSICS.coyoteTime;
  if(!wasGrounded&&!e.role&&oldY-e.y>.005)emit(s,'land',null,{strength});
  if(!e.role&&e.jumpBuffer>0&&!e.collapsed)performJump(s,e);
 }else{e.y=nextY;e.grounded=false;e.surfaceId=null;}
}
function navGraph(s){
 const nodes=[];
 for(const p of getPlatforms(s)){
  let pieces=[[p.from,p.to]];
  for(const b of getOccluders(s))if(p.y+PHYSICS.staffHeight>b.minY+.01&&p.y<b.maxY-.01){
   const lo=b.from-.36,hi=b.to+.36,next=[];
   for(const[a,z]of pieces){if(hi<=a||lo>=z)next.push([a,z]);else{if(lo>a+.1)next.push([a,Math.min(lo,z)]);if(hi<z-.1)next.push([Math.max(hi,a),z]);}}
   pieces=next;
  }
  pieces.forEach(([from,to],i)=>{if(to-from>.1)nodes.push({id:`${p.id}:${i}`,platformId:p.id,from,to,y:p.y,edges:[]});});
 }
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i],b=nodes[j];
  if(Math.abs(a.y-b.y)<.05&&a.from<=b.to+.02&&b.from<=a.to+.02){a.edges.push({to:j,type:'walk'});b.edges.push({to:i,type:'walk'});}
 }
 for(const l of ROOMS[s.room].ladders.filter(l=>l.staff)){
  const lows=nodes.map((n,i)=>({n,i})).filter(({n})=>Math.abs(n.y-l.bottom)<.05&&l.x>=n.from&&l.x<=n.to);
  const highs=nodes.map((n,i)=>({n,i})).filter(({n})=>Math.abs(n.y-l.top)<.05&&l.x>=n.from&&l.x<=n.to);
  for(const a of lows)for(const b of highs){nodes[a.i].edges.push({to:b.i,type:'ladder',x:l.x,direction:1});nodes[b.i].edges.push({to:a.i,type:'ladder',x:l.x,direction:-1});}
 }
 return nodes;
}
function distanceToNode(n,p){return Math.abs(p.x-clamp(p.x,n.from,n.to))+Math.abs(p.y-n.y)*2;}
function navigate(s,g,target,dt,speed){
 if(g.ladderId){physics(s,g,dt,{climb:g.navClimb||1},speed);return false;}
 if(!g.grounded){physics(s,g,dt,{},speed);return false;}
 const nodes=navGraph(s);if(!nodes.length)return true;
 let start=0;for(let i=1;i<nodes.length;i++)if(distanceToNode(nodes[i],g)<distanceToNode(nodes[start],g))start=i;
 const parents=new Map([[start,null]]),queue=[start];
 for(let q=0;q<queue.length;q++)for(const edge of nodes[queue[q]].edges)if(!parents.has(edge.to)){parents.set(edge.to,{from:queue[q],edge});queue.push(edge.to);}
 let goal=start;for(const i of queue)if(distanceToNode(nodes[i],target)<distanceToNode(nodes[goal],target))goal=i;
 if(start===goal){
  const x=clamp(target.x,nodes[start].from+.04,nodes[start].to-.04),dx=x-g.x;
  if(Math.abs(dx)<.08){physics(s,g,dt,{});return true;}
  physics(s,g,dt,{move:Math.sign(dx)},Math.min(speed,Math.abs(dx)/dt));return false;
 }
 let next=goal;while(parents.get(next)?.from!==start)next=parents.get(next).from;
 const edge=parents.get(next).edge;
 if(edge.type==='ladder'){
  const dx=edge.x-g.x;if(Math.abs(dx)>.06)physics(s,g,dt,{move:Math.sign(dx)},Math.min(speed,Math.abs(dx)/dt));
  else{g.navClimb=edge.direction;physics(s,g,dt,{climb:edge.direction},speed);}
 }else{
  const n=nodes[next],dest=clamp((n.from+n.to)/2,n.from+.08,n.to-.08);physics(s,g,dt,{move:Math.sign(dest-g.x)},speed);
 }
 return false;
}
function noise(s,point,{radius=8,kind='impact',except=null,strength=.7}={}){
 const r=currentRoom(s);r.noises.push({x:point.x,y:point.y,radius,age:0,duration:1.6,kind,strength});
 for(const g of r.guards){
  if(g.id===except||g.id===s.controlled||g.recovery>0)continue;
  const ear=eyePoint(s,g),source={x:point.x,y:point.y+.12,plane:0};
  const audible=Math.hypot(g.x-point.x,g.y-point.y)<=radius&&traceRay(s,ear,source).clear;
  const visible=guardSees(s,g,source);
  if(audible||visible){g.investigate={x:point.x,y:point.y,platformId:supportAt(s,point.x,point.y)?.id??null};g.inspect=0;g.listen=.42;g.facing=point.x>=g.x?1:-1;emit(s,'investigate',kind==='impact'?'heardImpact':'heardTransition',{guardId:g.id,x:point.x,y:point.y});}
 }
}
export function possess(s){
 if(s.phase!=='playing')return false;
 if(s.controlled){const g=actor(s);g.recovery=2;g.alert=0;s.controlled=null;s.transition=null;s.nim.collapsed=false;if(!canStand(s,s.nim))s.nim.crouching=true;milestone(s,'returned');emit(s,'return','returned',{guardId:g.id});return true;}
 if(s.transition){s.transition=null;emit(s,'possessionCancel','noTarget');return false;}
 const g=getTarget(s);if(!g){const reason=getTargetInfo(s)?.reason;emit(s,'blocked',reason==='glass'?'targetBlockedGlass':reason==='machine'?'targetBlockedMachine':'noTarget');return false;}
 s.transition={target:g.id,progress:0};noise(s,{x:g.x,y:g.y+1.7},{radius:3,kind:'collar',except:g.id});emit(s,'possessionStart','possessionStart',{guardId:g.id});return true;
}
export function getInteraction(s){
 if(s.phase!=='playing')return null;const a=actor(s),r=currentRoom(s),spec=ROOMS[s.room];
 const near=(x,y)=>x!==null&&Math.abs(a.x-x)<=1.15&&Math.abs(a.y-y)<.42&&a.grounded;
 if(!s.controlled){
  if(spec.crateX!==null&&!r.rescued&&near(spec.crateX,spec.crateY))return{key:'rescue',x:spec.crateX,y:spec.crateY,enabled:true};
  if(s.room===3&&near(34,spec.bellY))return{key:'depart',x:34,y:spec.bellY,enabled:true};
  if(s.room<3&&near(35,spec.exitY))return{key:'nextRoom',x:35,y:spec.exitY,enabled:true};
  if(s.room>0&&near(1,0))return{key:'previousRoom',x:1,y:0,enabled:true};
  if(near(spec.readerX,spec.readerY)&&!r.gateOpen)return{key:'needKeeper',x:spec.readerX,y:spec.readerY,enabled:false};
  if(near(spec.consoleX,spec.consoleY)&&!r.bridgeOpen&&!r.mechanism.active)return{key:'needTech',x:spec.consoleX,y:spec.consoleY,enabled:false};
  if(a.x>34&&Math.abs(a.y-spec.exitY)>.5)return{key:'exitAbove',x:35,y:spec.exitY,enabled:false};
 }else{
  if(near(spec.readerX,spec.readerY)&&!r.gateOpen)return{key:a.role==='keeper'?'openGate':'needKeeper',x:spec.readerX,y:spec.readerY,enabled:a.role==='keeper'};
  if(near(spec.consoleX,spec.consoleY)&&!r.bridgeOpen&&!r.mechanism.active)return{key:a.role==='tech'?(s.room===2?'moveCart':'deployBridge'):'needTech',x:spec.consoleX,y:spec.consoleY,enabled:a.role==='tech'};
 }
 return null;
}
function enterRoom(s,index,fromRight=false){
 if(index<0||index>3)return;
 const held=s.nim.heldItem;s.room=index;s.nim=entity(fromRight?34.2:1.8,fromRight?ROOMS[index].exitY:0,{facing:fromRight?-1:1,heldItem:held,throwTime:0});
 s.controlled=null;s.transition=null;s.roomTime=0;s.visits[index]=true;if(index===3)milestone(s,'reachedDock');checkpoint(s);emit(s,'room',ROOMS[index].key,{room:index});
}
export function rescuedCount(s){return s.rooms.filter(r=>r.rescued).length;}
export function action(s){
 if(s.phase!=='playing'||s.transition)return false;const i=getInteraction(s);if(!i)return false;if(!i.enabled){emit(s,'blocked',i.key==='exitAbove'?'exitAbove':'wrongRole');return false;}
 const r=currentRoom(s);
 if(i.key==='openGate'){r.gateOpen=true;milestone(s,'openedGate');emit(s,'gate','gateOpened');}
 else if(i.key==='deployBridge'||i.key==='moveCart'){r.mechanism={active:true,progress:0,kind:i.key==='moveCart'?'cart':'bridge'};if(i.key==='moveCart')r.cartX=17;milestone(s,'usedMechanism');noise(s,{x:actor(s).x,y:actor(s).y},{radius:5,kind:'seal',except:s.controlled});emit(s,'mechanism',i.key==='moveCart'?'cartMoving':'bridgeMoving');}
 else if(i.key==='rescue'){r.rescued=true;milestone(s,'rescued'+rescuedCount(s));checkpoint(s);emit(s,'rescue','creatureRescued',{count:rescuedCount(s)});}
 else if(i.key==='depart'){s.phase='won';s.ending=rescuedCount(s);milestone(s,'departed');emit(s,'won','ending'+s.ending,{count:s.ending});}
 else if(i.key==='nextRoom')enterRoom(s,s.room+1);
 else if(i.key==='previousRoom')enterRoom(s,s.room-1,true);
 return true;
}
export function getThrowableInfo(s){
 if(s.phase!=='playing'||s.controlled)return{key:'emptyHands',enabled:false,item:null};
 if(s.nim.heldItem)return{key:'throwItem',enabled:true,item:s.nim.heldItem};
 const near=currentRoom(s).items.filter(i=>i.available&&Math.hypot(i.x-s.nim.x,i.y-s.nim.y)<1.2&&traceRay(s,eyePoint(s,s.nim),{x:i.x,y:i.y+.1,plane:0}).clear).sort((a,b)=>Math.abs(a.x-s.nim.x)-Math.abs(b.x-s.nim.x))[0];
 return{key:near?'pickupItem':'emptyHands',enabled:Boolean(near),item:near??null};
}
function makeProjectile(s){const n=s.nim;return{x:n.x+n.facing*.28,y:n.y+(n.crouching?.38:.78),vx:n.facing*6.5,vy:4.5,age:0,bounces:0};}
export function useThrowable(s){
 if(s.phase!=='playing'||s.controlled){if(s.controlled)emit(s,'blocked','staffCannotThrow');return false;}
 const info=getThrowableInfo(s);if(!info.enabled){emit(s,'blocked','emptyHands');return false;}
 if(s.nim.heldItem){const held=s.nim.heldItem,r=currentRoom(s);r.projectiles.push({...makeProjectile(s),id:`p${s.room}-${r.nextProjectile++}`,itemId:held.id,kind:held.kind});s.nim.heldItem=null;s.nim.throwTime=.45;milestone(s,'thrown');emit(s,'throw','throwItem');}
 else{info.item.available=false;s.nim.heldItem={id:info.item.id,kind:info.item.kind};milestone(s,'pickedUp');emit(s,'pickup','pickupItem');}
 return true;
}
function projectileHit(s,p,next){
 let hits=getOccluders(s).map(b=>{const hit=intersectBox(p,next,b);if(!hit)return null;if(p.vy<0&&p.y>=b.maxY&&Math.abs(hit.y-b.maxY)<.04){hit.kind='floor';hit.y=b.maxY+.03;}else if(p.y<=b.minY+.001&&Math.abs(hit.y-b.minY)<.04){hit.normalX=0;hit.normalY=-1;}else{hit.normalX=p.x<b.from?-1:1;hit.normalY=0;}return hit;}).filter(Boolean);
 if(next.y<p.y)for(const platform of getPlatforms(s))if(p.y>=platform.y+.03&&next.y<=platform.y+.03){const t=(p.y-platform.y-.03)/(p.y-next.y),x=p.x+(next.x-p.x)*t;if(x>=platform.from&&x<=platform.to)hits.push({t,x,y:platform.y+.03,kind:'floor'});}
 return hits.sort((a,b)=>a.t-b.t)[0]??null;
}
export function predictThrow(s){
 if(!s.nim.heldItem||s.controlled)return{points:[],impact:null};
 const p=makeProjectile(s),points=[{x:p.x,y:p.y}];
 for(let i=0;i<180;i++){const dt=1/60,next={x:p.x+p.vx*dt,y:p.y+(p.vy-16*dt)*dt};const hit=projectileHit(s,p,next);if(hit){points.push({x:hit.x,y:hit.y});return{points,impact:hit};}p.x=next.x;p.y=next.y;p.vy-=16*dt;if(i%3===0)points.push({x:p.x,y:p.y});if(p.y<-4.5||p.x<0||p.x>36)break;}
 return{points,impact:null};
}
function findItem(s,id){for(const r of s.rooms){const item=r.items.find(i=>i.id===id);if(item)return item;}return null;}
function settleProjectile(s,p,x,y,home=false){const item=findItem(s,p.itemId);if(!item)return;item.available=true;item.x=home?item.homeX:x;item.y=home?item.homeY:y;
 // A carried object can cross rooms. Its recoverable instance belongs to its landing room.
 const origin=s.rooms.find(r=>r.items.includes(item)),destination=home?s.rooms[item.homeRoom]:currentRoom(s);if(origin!==destination){origin.items.splice(origin.items.indexOf(item),1);destination.items.push(item);}
}
function updateProjectiles(s,dt){
 const r=currentRoom(s);
 for(let i=r.projectiles.length-1;i>=0;i--){const p=r.projectiles[i];p.age+=dt;const next={x:p.x+p.vx*dt,y:p.y+(p.vy-16*dt)*dt},hit=projectileHit(s,p,next);
  if(hit){const strength=clamp(Math.abs(p.vy)/9,.35,1);noise(s,{x:hit.x,y:hit.y},{radius:5+4*strength,kind:'impact',strength});emit(s,'impact','itemImpact',{x:hit.x,y:hit.y,strength});
   if(hit.kind==='floor'){settleProjectile(s,p,hit.x,hit.y-.03);r.projectiles.splice(i,1);}
   else if(p.bounces>=4){settleProjectile(s,p,0,0,true);r.projectiles.splice(i,1);}
   else{p.x=hit.x+(hit.normalX||0)*.09;p.y=hit.y+(hit.normalY||0)*.07;if(hit.normalY===-1){p.vy=-Math.abs(p.vy)*.25;p.vx*=.65;}else{p.vx*=-.25;p.vy=1.8;}p.bounces++;}
  }else{p.x=next.x;p.y=next.y;p.vy-=16*dt;}
  if(r.projectiles.includes(p)&&(p.y<-4.5||p.x<.1||p.x>35.9||p.age>5)){settleProjectile(s,p,0,0,true);r.projectiles.splice(r.projectiles.indexOf(p),1);}
 }
 for(const n of r.noises)n.age+=dt;r.noises=r.noises.filter(n=>n.age<n.duration);
}
function updateGuard(s,g,dt,active){
 if(active&&g.id===s.controlled)return;
 if(g.recovery>0){g.recovery=Math.max(0,g.recovery-dt);physics(s,g,dt,{});return;}
 if(active&&!isHidden(s)&&guardSees(s,g,s.nim)){
  g.alert=Math.min(2,g.alert+dt);physics(s,g,dt,{});
  if(g.alert>=2-1e-8){s.phase='lost';s.loss={key:s.controlled?'bodyFound':'nimFound',guardId:g.id,room:s.room,x:s.nim.x,y:s.nim.y};emit(s,'lost',s.loss.key,{guardId:g.id});}
  return;
 }
 g.alert=0;
 if(g.listen>0){g.listen=Math.max(0,g.listen-dt);physics(s,g,dt,{});return;}
 if(g.investigate){
  if(navigate(s,g,g.investigate,dt,1.55)){
   if(g.inspect===0)emit(s,'search','searching',{guardId:g.id});
   g.inspect+=dt;g.facing=Math.sin(g.inspect*3)>0?1:-1;
   if(g.inspect>=2.8){g.investigate=null;g.inspect=0;g.searchTurns++;if(active)emit(s,'investigate','investigationFinished',{guardId:g.id});}
  }
 }else{
  if(g.patrolGoal===undefined)g.patrolGoal=g.facing>0?1:0;
  if(navigate(s,g,{x:g.patrol[g.patrolGoal],y:g.patrolY},dt,.8)){g.patrolGoal=1-g.patrolGoal;g.facing=g.patrolGoal?1:-1;}
 }
 if(g.y<-4.5){g.x=(g.patrol[0]+g.patrol[1])/2;g.y=g.patrolY;g.vy=0;g.grounded=true;g.ladderId=null;g.recovery=2;}
}
function tick(s,dt,input){
 s.time+=dt;s.roomTime+=dt;s.nim.throwTime=Math.max(0,(s.nim.throwTime||0)-dt);
 const moving=Number(input.move)||0,climbing=Number(input.climb)||0;
 if(moving||climbing)milestone(s,'moved');
 if(s.controlled){physics(s,actor(s),dt,{move:moving,climb:climbing});physics(s,s.nim,dt,{});}
 else physics(s,s.nim,dt,{move:moving,climb:climbing});
 if(s.nim.y<-4.5){s.phase='lost';s.loss={key:'fell',guardId:null,room:s.room,x:s.nim.x,y:s.nim.y};emit(s,'lost','fell');return;}
 if(s.controlled&&actor(s).y<-4.5){const g=actor(s);g.x=(g.patrol[0]+g.patrol[1])/2;g.y=g.patrolY;g.vy=0;g.grounded=true;g.ladderId=null;g.recovery=2;s.controlled=null;s.nim.collapsed=false;emit(s,'return','carrierFell');}
 const info=getTargetInfo(s);if(info?.eligible)milestone(s,'sawTarget');if(info?.reason==='glass')milestone(s,'blockedGlass');
 if(s.transition){
  const g=currentRoom(s).guards.find(g=>g.id===s.transition.target);
  if(!g||!targetInfo(s,g).eligible){s.transition=null;emit(s,'possessionCancel','noTarget');}
  else if((s.transition.progress+=dt)>=.6-1e-8){s.controlled=g.id;s.transition=null;g.alert=0;g.recovery=0;s.nim.collapsed=true;s.nim.ladderId=null;s.nim.jumpBuffer=0;if(!supportAt(s,s.nim.x,s.nim.y))s.nim.grounded=false;milestone(s,g.role==='keeper'?'borrowedKeeper':'borrowedTech');emit(s,'possession',g.role==='keeper'?'possessedKeeper':'possessedTech',{guardId:g.id});}
 }
 for(let index=0;index<4;index++){
  const r=s.rooms[index],active=index===s.room,context=active?s:{...s,room:index};
  if(r.mechanism.active){r.mechanism.progress=Math.min(1,r.mechanism.progress+dt/3);if(r.mechanism.kind==='cart')r.cartX=17+7*r.mechanism.progress;
   if(r.mechanism.progress>=1-1e-8){r.mechanism.active=false;r.mechanism.progress=1;r.bridgeOpen=true;if(r.mechanism.kind==='cart'){r.cartX=24;r.gateOpen=true;}if(active)emit(s,'mechanism','routeReady');}}
  updateProjectiles(context,dt);
  if(active||s.visits[index])for(const g of r.guards)updateGuard(context,g,dt,active);
 }
 if(s.phase!=='playing')return;
 if(!s.controlled&&s.nim.grounded){
  if(s.nim.x>=35.7&&s.room<3&&Math.abs(s.nim.y-ROOMS[s.room].exitY)<.1)enterRoom(s,s.room+1);
  else if(s.nim.x<=.3&&s.room>0&&Math.abs(s.nim.y)<.1)enterRoom(s,s.room-1,true);
 }
}
export function step(s,dt,input={}){
 if(s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return s;
 let remaining=Math.min(dt,.1);while(remaining>1e-9&&s.phase==='playing'){const delta=Math.min(remaining,1/60);tick(s,delta,input);remaining-=delta;}return s;
}
export function retry(s){if(!s.checkpoint)return createGame();const saved=copy(s.checkpoint),cp=copy(s.checkpoint);for(const k of Object.keys(s))delete s[k];Object.assign(s,saved,{phase:'playing',loss:null,events:[],checkpoint:cp});emit(s,'checkpoint','checkpoint');return s;}
export function serialize(s){return JSON.stringify({version:VERSION,state:{...s,events:[]}});}
const finite=(v,min=-Infinity,max=Infinity)=>Number.isFinite(v)&&v>=min&&v<=max;
function validEntity(e,index,staff=false){
 if(!e||!finite(e.x,0,36)||!finite(e.y,-6,12)||!finite(e.vy,-30,20)||![-1,1].includes(e.facing)||e.plane!==0||typeof e.grounded!=='boolean'||typeof e.crouching!=='boolean')return false;
 if(e.ladderId!==null&&!ROOMS[index].ladders.some(l=>l.id===e.ladderId&&Math.abs(e.x-l.x)<.6&&e.y>=l.bottom-.15&&e.y<=l.top+.15))return false;
 if(!finite(e.coyote,0,.2)||!finite(e.jumpBuffer,0,.2))return false;
 if(e.collapsed!==undefined&&typeof e.collapsed!=='boolean')return false;
 if(!staff&&(e.role!==undefined||!finite(e.throwTime,0,.5)))return false;
 if(staff&&(e.patrolGoal!==undefined&&![0,1].includes(e.patrolGoal)||e.navClimb!==undefined&&![-1,1].includes(e.navClimb)||!Number.isInteger(e.searchTurns)||e.searchTurns<0))return false;
 if(staff&&(!['keeper','tech'].includes(e.role)||!finite(e.alert,0,2.001)||!finite(e.recovery,0,2.001)||!finite(e.listen,0,.5)||!finite(e.inspect,0,3)))return false;
 return true;
}
function validState(s,checkpointOnly=false){
 if(!s||s.version!==VERSION||!['playing','won','lost'].includes(s.phase)||!Number.isInteger(s.room)||s.room<0||s.room>3||!validEntity(s.nim,s.room))return false;
 if(!finite(s.time,0)||!finite(s.roomTime,0)||!Array.isArray(s.visits)||s.visits.length!==4||s.visits.some(v=>typeof v!=='boolean')||!s.milestones||typeof s.milestones!=='object'||Array.isArray(s.milestones)||Object.values(s.milestones).some(v=>typeof v!=='boolean'))return false;
 if(!Array.isArray(s.rooms)||s.rooms.length!==4)return false;
 const allItems=new Map();const expectedItems=new Map(ROOMS.flatMap(r=>r.items).map(i=>[i.id,i]));
 for(let index=0;index<4;index++){
  const r=s.rooms[index];if(!r||!Array.isArray(r.guards)||r.guards.length!==ROOMS[index].guards.length||['gateOpen','bridgeOpen','rescued'].some(k=>typeof r[k]!=='boolean'))return false;
  if(!r.mechanism||typeof r.mechanism.active!=='boolean'||!finite(r.mechanism.progress,0,1)||![null,'bridge','cart'].includes(r.mechanism.kind)||!(r.cartX===null||finite(r.cartX,0,36)))return false;
  if(!Array.isArray(r.items)||!Array.isArray(r.projectiles)||!Array.isArray(r.noises)||!Number.isInteger(r.nextProjectile)||r.nextProjectile<0)return false;
  for(let n=0;n<r.guards.length;n++){
   const g=r.guards[n],base=ROOMS[index].guards[n];if(!validEntity(g,index,true)||g.id!==base.id||g.role!==base.role||g.patrolY!==base.patrolY||!Array.isArray(g.patrol)||g.patrol.length!==2||g.patrol.some((x,j)=>x!==base.patrol[j]))return false;
   if(g.investigate!==null&&(!g.investigate||!finite(g.investigate.x,0,36)||!finite(g.investigate.y,-6,12)))return false;
  }
  for(const i of r.items){const original=expectedItems.get(i.id);if(!original||allItems.has(i.id)||i.kind!==original.kind||typeof i.available!=='boolean'||!finite(i.x,0,36)||!finite(i.y,-6,12)||i.homeX!==original.x||i.homeY!==original.y||!Number.isInteger(i.homeRoom)||i.homeRoom<0||i.homeRoom>3)return false;allItems.set(i.id,i);}
  for(const p of r.projectiles)if(!p||typeof p.id!=='string'||!expectedItems.has(p.itemId)||!['bolt','can'].includes(p.kind)||!finite(p.x,0,36)||!finite(p.y,-6,12)||!finite(p.vx,-15,15)||!finite(p.vy,-30,15)||!finite(p.age,0,5.2)||!Number.isInteger(p.bounces)||p.bounces<0||p.bounces>4)return false;
  for(const n of r.noises)if(!n||!finite(n.x,0,36)||!finite(n.y,-6,12)||!finite(n.radius,0,12)||!finite(n.age,0,2)||!finite(n.duration,0,2)||!finite(n.strength,0,1))return false;
 }
 if(allItems.size!==expectedItems.size)return false;
 if(s.nim.heldItem!==null&&(!expectedItems.has(s.nim.heldItem?.id)||s.nim.heldItem.kind!==expectedItems.get(s.nim.heldItem.id).kind||allItems.get(s.nim.heldItem.id).available))return false;
 if(s.controlled!==null&&!s.rooms[s.room].guards.some(g=>g.id===s.controlled))return false;
 if(s.transition!==null&&(!s.transition||s.controlled!==null||!finite(s.transition.progress,0,.6)||!s.rooms[s.room].guards.some(g=>g.id===s.transition.target)))return false;
 if(s.phase==='won'&&![0,1,2].includes(s.ending))return false;
 if(s.loss!==null&&(!s.loss||!['fell','nimFound','bodyFound'].includes(s.loss.key)))return false;
 if(!checkpointOnly&&(!s.checkpoint||!validState(s.checkpoint,true)))return false;
 return true;
}
function migrateV1(old){
 if(!old||old.version!==1||!Number.isInteger(old.room)||old.room<0||old.room>3||!Array.isArray(old.rooms)||old.rooms.length!==4)return null;
 const s=createGame();s.room=old.room;s.time=finite(old.time,0)?old.time:0;s.visits=Array.isArray(old.visits)&&old.visits.length===4?old.visits.map(Boolean):[true,false,false,false];s.visits[s.room]=true;
 for(let i=0;i<4;i++){const r=old.rooms[i];if(!r||['gateOpen','bridgeOpen','rescued'].some(k=>typeof r[k]!=='boolean'))return null;Object.assign(s.rooms[i],{gateOpen:r.gateOpen,bridgeOpen:r.bridgeOpen,rescued:r.rescued});}
 if(old.milestones&&typeof old.milestones==='object')for(const[k,v]of Object.entries(old.milestones))if(typeof v==='boolean')s.milestones[k]=v;
 s.nim=entity(1.8,0,{heldItem:null,throwTime:0});
 if(old.phase==='won'){s.phase='won';s.room=3;s.nim=entity(34,ROOMS[3].bellY,{heldItem:null,throwTime:0});s.ending=rescuedCount(s);}
 checkpoint(s);s.events=[];emit(s,'migrate','saveMigrated');return s;
}
export function restore(json){
 try{const data=typeof json==='string'?JSON.parse(json):copy(json);if(data?.version===1)return migrateV1(data.state);if(data?.version!==VERSION||!validState(data.state))return null;data.state.events=[];return data.state;}catch{return null;}
}
