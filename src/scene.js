import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as World from './engine.js';
const { ROOMS, getTarget, getInteraction, getHeight } = World;

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const PALETTE = { night: 0x0c1e23, teal: 0x1a555b, steel: 0x34585b, rust: 0x936248, amber: 0xffba65, ivory: 0xd9d6ba, dark: 0x17292e };

export async function createScene(container, options = {}) {
  let quality = options.quality || 'high';
  let reduced = !!options.reducedMotion;
  let disposed = false;
  let menuMode = false;
  let ending = null, bodyIndicator = null;
  let width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.night);
  scene.fog = new THREE.FogExp2(0x183e43, .018);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(quality === 'low' ? Math.min(devicePixelRatio || 1, 1, Math.sqrt(500000 / (width * height))) : Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(36, width / height, .1, 180);
  camera.position.set(9, 6.9, 22);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const ownGeo = g => (geometries.add(g), g);
  const geo = {
    box: ownGeo(new THREE.BoxGeometry(1, 1, 1)),
    sphere: ownGeo(new THREE.SphereGeometry(1, 16, 12)),
    cylinder: ownGeo(new THREE.CylinderGeometry(1, 1, 1, 14)),
    cone: ownGeo(new THREE.ConeGeometry(1, 1, 20)),
    torus: ownGeo(new THREE.TorusGeometry(1, .07, 7, 40)),
    plane: ownGeo(new THREE.PlaneGeometry(1, 1)),
  };
  const lowGeometry = new Map([
    [geo.sphere,ownGeo(new THREE.SphereGeometry(1,8,6))],
    [geo.cylinder,ownGeo(new THREE.CylinderGeometry(1,1,1,7))],
    [geo.torus,ownGeo(new THREE.TorusGeometry(1,.07,4,20))],
    [geo.cone,ownGeo(new THREE.ConeGeometry(1,1,10))]
  ]);
  function noiseTexture(size = 128) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d'); const pixels = ctx.createImageData(size, size);
    let seed = 417;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const n = 100 + seed % 90;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n; pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); textures.add(t); return t;
  }
  const grain = noiseTexture();
  function surfaceTexture(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = kind === 'rust' ? '#b2a18d' : '#bacbc5'; ctx.fillRect(0, 0, 256, 256);
    let seed = kind === 'rust' ? 9876 : 285;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 800; i++) {
      const x = random() * 256, y = random() * 256, r = random() * 13 + 1;
      ctx.globalAlpha = .025 + random() * .09;
      ctx.fillStyle = i % 3 ? '#163c3e' : '#a6542d';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = .2; ctx.strokeStyle = '#e3dfc9'; ctx.lineWidth = .6;
    for (let i = 0; i < 70; i++) { const x = random() * 256, y = random() * 256; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2 + random() * 22, y + random() * 2); ctx.stroke(); }
    ctx.globalAlpha = .14; ctx.strokeStyle = '#173439';
    for (let i = 0; i < 15; i++) { const x = random() * 256; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, 256); ctx.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); textures.add(t); return t;
  }
  const agedMetal = surfaceTexture('steel'), oxidized = surfaceTexture('rust');
  function mat(color, props = {}) { const m = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: .2, ...props }); materials.add(m); return m; }
  const m = {
    steel: mat(PALETTE.steel, { map: agedMetal, bumpMap: grain, bumpScale: .045, metalness: .7, roughness: .34 }),
    dark: mat(PALETTE.dark, { metalness: .75, roughness: .38 }),
    rust: mat(PALETTE.rust, { map: oxidized, bumpMap: grain, bumpScale: .07 }),
    concrete: mat(0x526363, { bumpMap: grain, bumpScale: .1 }),
    ivory: mat(PALETTE.ivory, { metalness: .22, roughness: .34 }),
    amber: mat(PALETTE.amber, { emissive: 0xff9e37, emissiveIntensity: 2.5, roughness: .3 }),
    dimAmber: mat(0xbf8051, { emissive: 0xb96b24, emissiveIntensity: .55 }),
    cyan: mat(0x9be9da, { emissive: 0x4ab6bc, emissiveIntensity: 1.4 }),
    glass: mat(0x82bdb2, { transparent: true, opacity: .2, metalness: .7, roughness: .17, depthWrite: false, side: THREE.DoubleSide }),
    water: mat(0x18383d, { roughness: .17, metalness: .88 }),
    leaf: mat(0x356857, { roughness: .65, side: THREE.DoubleSide }),
    beam: mat(0xffb36a, { transparent: true, opacity: .04, depthWrite: false, side: THREE.DoubleSide, emissive: 0xe49b43, emissiveIntensity: .8 }),
    blueBeam: mat(0x82d6cc, { transparent: true, opacity: .035, depthWrite: false, side: THREE.DoubleSide, emissive: 0x82d6cc, emissiveIntensity: .7 }),
    red: mat(0xff7051, { emissive: 0xff4325, emissiveIntensity: 1.8 }),
  };
  function mesh(g, material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, parent = scene) {
    const o = new THREE.Mesh(g, material); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  const box = (p, material, x, y, z, sx, sy, sz) => mesh(geo.box, material, x, y, z, sx, sy, sz, p);
  const orb = (p, material, x, y, z, sx, sy, sz) => mesh(geo.sphere, material, x, y, z, sx, sy, sz, p);
  function rod(p, material, a, b, radius = .05) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b); const d = bv.clone().sub(av);
    const o = mesh(geo.cylinder, material, 0, 0, 0, radius, d.length(), radius, p);
    o.position.copy(av.add(bv).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
  }
  function torus(p, material, x, y, z, r, rotation = 0) {
    const o = mesh(geo.torus, material, x, y, z, r, r, r, p); o.rotation.y = rotation; return o;
  }
  function instanceBoxes(p, material, boxes) {
    const o = new THREE.InstancedMesh(geo.box, material, boxes.length), dummy = new THREE.Object3D();
    boxes.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.scale.set(a[3], a[4], a[5]); dummy.rotation.set(0, 0, a[6] || 0); dummy.updateMatrix(); o.setMatrixAt(i, dummy.matrix); });
    o.castShadow = true; o.receiveShadow = true; p.add(o); return o;
  }
  function iconTexture(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d'); ctx.strokeStyle = '#ffd7a1'; ctx.fillStyle = '#ffd7a1'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    if (kind === 'hand') {
      ctx.beginPath(); ctx.moveTo(42, 87); ctx.lineTo(26, 66); ctx.quadraticCurveTo(23, 55, 33, 60); ctx.lineTo(43, 69); ctx.lineTo(43, 37); ctx.quadraticCurveTo(48, 29, 53, 37); ctx.lineTo(53, 57); ctx.lineTo(56, 28); ctx.quadraticCurveTo(62, 22, 66, 29); ctx.lineTo(66, 57); ctx.lineTo(70, 32); ctx.quadraticCurveTo(76, 27, 80, 35); ctx.lineTo(78, 61); ctx.lineTo(85, 45); ctx.quadraticCurveTo(93, 41, 95, 49); ctx.lineTo(87, 82); ctx.quadraticCurveTo(77, 105, 56, 102); ctx.closePath(); ctx.stroke();
    } else if (kind === 'gear') {
      ctx.save(); ctx.translate(64, 64); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -43, 12, 19); } ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (kind === 'bell') {
      ctx.beginPath(); ctx.moveTo(33, 83); ctx.bezierCurveTo(47, 64, 32, 35, 64, 32); ctx.bezierCurveTo(96, 35, 81, 64, 95, 83); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(64, 92, 8, 0, Math.PI); ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(20, 70); ctx.quadraticCurveTo(30, 25, 64, 70); ctx.quadraticCurveTo(98, 25, 108, 70); ctx.lineTo(64, 98); ctx.closePath(); ctx.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; textures.add(t); return t;
  }
  const symbols = {};
  for (const kind of ['hand', 'gear', 'bell', 'sail']) {
    symbols[kind] = new THREE.MeshBasicMaterial({ map: iconTexture(kind), transparent: true, side: THREE.DoubleSide, depthWrite: false }); materials.add(symbols[kind]);
  }
  function panel(p, x, y, kind, z = .22) {
    box(p, m.dark, x, y, z, .7, .95, .2);
    box(p, m.rust, x, y, z + .11, .57, .81, .02);
    mesh(geo.plane, symbols[kind], x, y, z + .135, .52, .67, 1, p);
    box(p, m.cyan, x, y - .45, z + .15, .3, .035, .03);
  }
  scene.add(new THREE.HemisphereLight(0x9bd2d1, 0x17292d, 1.6));
  const sun = new THREE.DirectionalLight(0xadd9d0, 2.7); sun.position.set(0, 15, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -23; sun.shadow.camera.right = 23; sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -10; sun.shadow.normalBias = .04;
  scene.add(sun); scene.add(sun.target);
  const warm = new THREE.DirectionalLight(0xffbb75, 2); warm.position.set(10, 4, -8); scene.add(warm);
  const rim = new THREE.DirectionalLight(0x5faeae, 1.4); rim.position.set(-8, 8, -6); scene.add(rim);
  const roomGroups = [], roomVisuals = [];
  const workerHeads = {}, endingSails = [];
  const lowMaterials = new Map();
  function applyQuality(group) {
    group.traverse(o => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const original = o.userData.originalMaterial || o.material;
      o.userData.originalMaterial = original;
      if(o.userData.highGeometry)o.geometry=quality==='low'?o.userData.lowGeometry:o.userData.highGeometry;
      if((original===m.beam||original===m.blueBeam)&&!o.userData.essential)o.visible=quality!=='low';
      if (quality === 'low' && original.isMeshStandardMaterial) {
        if (!lowMaterials.has(original)) {
          const cheap = new THREE.MeshLambertMaterial({color:original.color,map:original.map,emissive:original.emissive,emissiveMap:original.emissiveMap,emissiveIntensity:original.emissiveIntensity,transparent:original.transparent,opacity:original.opacity,side:original.side,depthWrite:original.depthWrite,alphaTest:original.alphaTest,vertexColors:original.vertexColors});
          lowMaterials.set(original, cheap); materials.add(cheap);
        }
        o.material = lowMaterials.get(original);
      } else o.material = original;
    });
  }
  function curvePipe(p, points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    return mesh(ownGeo(new THREE.TubeGeometry(curve, 24, radius, 7, false)), material, 0, 0, 0, 1, 1, 1, p);
  }
  const rainFilm = mat(0x9fd1c6,{transparent:true,opacity:.09,depthWrite:false,roughness:.16,metalness:.5});
  const wet = mat(0x9ac0b2,{transparent:true,opacity:.17,depthWrite:false,roughness:.06,metalness:.9});
  const reflection = new THREE.MeshBasicMaterial({color:0xdca260,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide}); materials.add(reflection);

  function lamp(p, x, y, z, amber = true) {
    rod(p, m.dark, [x, y + .7, z], [x, y, z], .06);
    mesh(geo.cone, m.dark, x, y, z, .4, .25, .4, p);
    orb(p, amber ? m.amber : m.cyan, x, y - .1, z, .23, .07, .23);
    const cone = mesh(geo.cone, amber ? m.beam : m.blueBeam, x, y - 2.25, z, 1.9, 4.3, 1.9, p); cone.castShadow = false; cone.receiveShadow = false;
  }
  function plant(p, x, y, z, size = 1) {
    box(p, m.concrete, x, y + .35 * size, z, .9 * size, .7 * size, .7 * size);
    for (let i = 0; i < 5; i++) {
      const dx = Math.sin(i * 2.4) * size, dz = Math.cos(i * 2.4) * size * .7;
      rod(p, m.leaf, [x, y + .3, z], [x + dx, y + (1.8 + i * .1) * size, z + dz], .04 * size);
      const l = orb(p, m.leaf, x + dx, y + (1.7 + i * .1) * size, z + dz, .26 * size, .7 * size, .07 * size); l.rotation.z = -dx * .5;
    }
  }
  function shuttle(p) {
    const ship = new THREE.Group(); ship.position.set(28, 5.9, -18); p.add(ship);
    const body = orb(ship, m.dark, 0, 0, 0, 8, 1.4, 1.8);
    body.rotation.z = -.04;
    box(ship, m.ivory, 1, -.15, 1.4, 6, .2, .15);
    for (let i = -3; i <= 3; i++) box(ship, m.amber, i * .8, .36, 1.58, .42, .22, .08);
    orb(ship, m.cyan, -6, -.25, 0, .35, .45, .65);
    rod(ship, m.steel, [-4, -1, 0], [-5, -2.8, 0], .17);
    rod(ship, m.steel, [4, -1, 0], [5, -2.8, 0], .17);
    return ship;
  }
  function batchStatic(group, exceptions = new Set()) {
    group.updateWorldMatrix(true,true);
    const inverse=group.matrixWorld.clone().invert();
    const batches = new Map(), old = [];
    group.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
      let cursor = o;
      while (cursor && cursor !== group) { if (exceptions.has(cursor)) return; cursor = cursor.parent; }
      if (Array.isArray(o.material)) return;
      const matrix=inverse.clone().multiply(o.matrixWorld);
      const high=o.geometry.clone().applyMatrix4(matrix), low=(lowGeometry.get(o.geometry)||o.geometry).clone().applyMatrix4(matrix);
      if (!batches.has(o.material)) batches.set(o.material, {high:[],low:[]});
      batches.get(o.material).high.push(high); batches.get(o.material).low.push(low);old.push(o);
    });
    old.forEach(o => o.removeFromParent());
    for (const [material, parts] of batches) {
      const merged = mergeGeometries(parts.high, false), cheap=mergeGeometries(parts.low,false);
      parts.high.forEach(g=>g.dispose());parts.low.forEach(g=>g.dispose());
      if (merged) {const combined = new THREE.Mesh(ownGeo(merged), material);combined.userData.highGeometry=merged;combined.userData.lowGeometry=ownGeo(cheap||merged.clone());combined.castShadow=!material.transparent;combined.receiveShadow=true;group.add(combined);}
    }
  }
  function makeRoom(index) {
    const cfg = ROOMS[index], p = new THREE.Group(); scene.add(p); roomGroups.push(p);
    const length = cfg.length || 36;
    const foreground = [], decorative = [], reflections = [];
    const markForeground = (object, min, max) => {
      object.traverse(o => { if(o.isMesh) { o.material = o.material.clone(); materials.add(o.material); o.material.transparent = true; o.material.opacity = 1; o.material.depthWrite = false; } });
      foreground.push({object,min,max}); return object;
    };
    const cuts = cfg.gaps || [];
    const floorSegments = []; let cursor = -3.5;
    for (const gap of cuts) { floorSegments.push([cursor,gap.from]); cursor=gap.to; } floorSegments.push([cursor,length+3.5]);
    // A continuous walkable lip, supported above the rain-filled dock.
    for(const [start,end] of floorSegments){
      box(p, m.concrete, (start+end)/2, -.55, -1.25, end-start, .85, 5.5);
      box(p, m.dark, (start+end)/2, -.05, -.05, end-start, .12, 2.9);
    }
    for (const gap of cuts) for(const x of [gap.from,gap.to]) {
      box(p,m.rust,x,-.28,.1,.13,.5,2.9); box(p,m.amber,x,.035,.5,.08,.035,.5);
    }
    for (const ledge of cfg.ledges || []) {
      const ramp=ledge.ramp || .5, flat=(ledge.to-ledge.from)-2*ramp;
      box(p,m.steel,(ledge.from+ledge.to)/2,ledge.height/2,.1,Math.max(.1,flat),ledge.height,2.5);
      for(const side of [-1,1]) { const x=side<0?ledge.from+ramp/2:ledge.to-ramp/2; const slope=box(p,m.steel,x,ledge.height/2,.1,Math.hypot(ramp,ledge.height),.08,2.5); slope.rotation.z=-side*Math.atan2(ledge.height,ramp); }
      box(p,m.steel,(ledge.from+ledge.to)/2,ledge.height,.1,Math.max(.1,flat),.025,2.5);
      box(p,m.rust,(ledge.from+ledge.to)/2,ledge.height+.02,1.35,Math.max(.1,flat),.04,.05);
    }
    for(const crawl of cfg.crawl || []) {
      box(p,m.dark,(crawl.from+crawl.to)/2,crawl.clearance+.11,-.05,crawl.to-crawl.from,.22,2.6);
      box(p,m.rust,(crawl.from+crawl.to)/2,crawl.clearance+.23,1.25,crawl.to-crawl.from,.05,.05);
      for(const side of [-1,1]){const rise=crawl.clearance+.15;const ramp=box(p,m.steel,side<0?crawl.from-.4:crawl.to+.4,rise/2,-.85,Math.hypot(.8,rise),.07,.7);ramp.rotation.z=-side*Math.atan2(rise,.8);}
    }
    box(p, m.rust, length / 2, -.17, 1.48, length + 3, .28, .18);
    const slats = [], bolts = [];
    for (let x = -2; x < length + 3; x += .34) if(!cuts.some(g=>x>g.from&&x<g.to)) slats.push([x, .015, -.05, .06, .07, 2.8]);
    instanceBoxes(p, m.steel, slats);
    for (let x = -1; x < length + 2; x += 1.2) bolts.push([x, -.15, 1.59, .1, .1, .05]);
    instanceBoxes(p, m.ivory, bolts);
    // Water and vertical depth are visible under the playable catwalk.
    box(p, m.water, length / 2, -4.6, -4, length + 80, .12, 70);
    for (let x = -4; x < length + 12; x += 8) {
      box(p, m.dark, x, -2.8, -.7, .7, 5.5, 1.4);
      rod(p, m.steel, [x, -.7, 1.1], [x + 3, -3.3, .8], .14);
    }
    // Receding monumental window ribs and a shared final destination.
    const ribs = [];
    for (let x = -8; x <= length + 10; x += 5.6) {
      ribs.push([x, 5.3, -6.5, .22, 13.7, .5]);
      ribs.push([x + 2.7, 10.9, -6.5, 5.5, .22, .4]);
      box(p, m.glass, x + 2.8, 5.1, -6.8, 5.3, 10.5, .06);
      const rivulets=[]; for(let d=0;d<8;d++) rivulets.push([x+.4+d*.63,6.5-(d%3),-6.72,.015,2.4+(d%4)*.8,.012]); instanceBoxes(p,rainFilm,rivulets);
      rod(p, m.steel, [x, 10.7, -6.2], [x + 2.8, 13, -3.5], .1);
    }
    instanceBoxes(p, m.steel, ribs);
    box(p, m.dark, length / 2, 11, -3, length + 20, .6, .7);
    box(p, m.dark, length / 2, 2.8, -6.4, length + 20, .18, .5);
    const ship = shuttle(p);
    // Pipes, transmission cables and lit ceramics establish repeated station language.
    for (let x = 1; x < length; x += 7) {
      lamp(p, x, 5.6 + index * .25, -1.8, x % 2 !== 0);
      torus(p, m.rust, x + 1, -1.2, 1.2, .28);
      rod(p, m.rust, [x + 1, -1.2, 1.2], [x + 1, -3.7, 1.2], .19);
      box(p, m.amber, x + .2, -.4, 1.6, .32, .05, .03);
      const puddle=mesh(geo.plane,wet,x,.065,.75,1.8,.45,1,p);puddle.rotation.x=-Math.PI/2;
      const stripe=mesh(geo.plane,reflection,x,-4.5,-2,1.4,7,1,p);stripe.rotation.x=-Math.PI/2;reflections.push(stripe);
    }
    for (let i = 0; i < 3; i++) rod(p, m.dark, [-3, 8.7 + i * .18, -3], [length + 3, 9.4 + i * .2, -3], .027);
    for(const machine of cfg.machines || []) {
      const mid=(machine.from+machine.to)/2, h=machine.maxY-machine.minY;
      box(p,m.steel,mid,(machine.minY+machine.maxY)/2,.1,machine.to-machine.from,h,2.6);
      for(const x of [machine.from,machine.to])box(p,m.rust,x,machine.minY/2,-1.1,.1,machine.minY,.1);
      for(const side of [-1,1]) {const ramp=box(p,m.steel,side<0?machine.from-.4:machine.to+.4,machine.maxY/2,-.8,Math.hypot(.8,machine.maxY),.08,.7);ramp.rotation.z=-side*Math.atan2(machine.maxY,.8);}
    }
    // Cover roofs exactly correspond to the stealth simulation's cover intervals.
    (cfg.covers || []).forEach((cover, i) => {
      const from = cover.from ?? cover[0], to = cover.to ?? cover[1], mid = (from + to) / 2;
      if(index===3 && from>=32)return; // Boarding hatch itself shelters the final recess.
      box(p, m.dark, mid, 1.65, -.9, to - from, .22, 2.8);
      box(p, m.steel, mid, 1.5, -1.2, to - from, .12, 2.2);
      box(p, m.steel, mid, .7, -1.95, to - from, 1.4, .18);
      for (const x of [from, to]) box(p, m.rust, x, .8, -1.1, .1, 1.6, 1.7);
      box(p, m.cyan, mid, 1.37, -.75, .4, .025, .03);
      if (i % 2 === 0) { box(p, m.steel, mid, 2, -.9, 1.7, .45, 1); box(p, m.dark, mid, 2.25, -.85, 1.2, .05, .6); }
    });
    (cfg.glass || []).forEach(g => {
      const x = typeof g === 'number' ? g : g.x;
      box(p, m.glass, x, ((g.minY??.75)+(g.maxY??6))/2, 0, .08, (g.maxY??6)-(g.minY??.75), 2.8);
      box(p, m.steel, x, 4, 0, .16, .13, 3);
      box(p, m.steel, x, 2, -1.4, .18, 4, .15);
      box(p, m.ivory, x, 2.2, .8, .12, .05, 1.2);
    });
    const gate = new THREE.Group(); p.add(gate); gate.position.set(cfg.gateX ?? 25, 0, -.2);
    box(gate, m.dark, 0, 2.2, -.8, .2, 4.4, 3.2);
    for (let y = .3; y < 4.4; y += .42) box(gate, m.steel, .04, y, -.8, .26, .2, 3);
    box(gate, m.amber, .19, 2.1, .63, .1, 2.8, .06);
    const latch = box(p, m.rust, (cfg.gateX ?? 25) + .35, 3.8, .65, .5, .13, .2);
    box(p, m.steel, cfg.gateX ?? 25, 4.6, -.8, 1, .25, 3.8);
    panel(p, cfg.readerX ?? 20, 1.75, 'hand', .08);
    const tech = new THREE.Group(); p.add(tech);
    const consoleX = cfg.consoleX ?? 15;
    tech.visible = Number.isFinite(cfg.consoleX);
    box(tech, m.dark, consoleX, .65, -.8, 1.2, 1.3, .7);
    panel(tech, consoleX, 1.55, 'gear', -.3);
    const wheel = torus(tech, m.rust, consoleX, 1.2, .2, .42); wheel.name = 'wheel';
    const bridge = new THREE.Group(); p.add(bridge); bridge.position.set(cfg.gateX ?? 25, .2, -.1);
    box(bridge, m.rust, 0, .1, 1.2, 5, .12, 1.4);
    rod(bridge, m.steel, [-2.3, .2, 1.9], [-2.3, 1.3, 1.9], .04);
    rod(bridge, m.steel, [2.3, .2, 1.9], [2.3, 1.3, 1.9], .04);
    rod(bridge, m.steel, [-2.3, 1.3, 1.9], [2.3, 1.3, 1.9], .04);
    bridge.scale.x = .01;
    bridge.visible = index === 1 || index === 3;
    bridge.position.set(23.5, 1.8, -.1);
    const ramps = new THREE.Group(); bridge.add(ramps);
    for (const sign of [-1, 1]) { const ramp = box(ramps, m.steel, sign * 3.5, -.8, 1.2, 3.5, .12, 1.4); ramp.rotation.z = -sign * .54; }
    box(bridge, m.dark, 0, 1.8, .6, 9, .14, 2.2);
    for (const x of [-4.3, 4.3]) box(bridge, m.steel, x, .9, -.4, .1, 1.8, .1);
    let cart = null, dockShip = null, windVane = null, conveyor = null;
    const endingLights=[];
    let crate = null, sail = null;
    if (Number.isFinite(cfg.crateX)) {
      crate = new THREE.Group(); p.add(crate); crate.position.set(cfg.crateX, 0, .25);
      box(crate, m.rust, 0, .42, 0, .95, .84, .7);
      box(crate, m.dark, 0, .44, .36, .8, .65, .02);
      for (let i = -.3; i <= .3; i += .15) box(crate, m.ivory, i, .44, .39, .025, .56, .025);
      mesh(geo.plane, symbols.sail, 0, .46, .42, .6, .6, 1, crate);
      sail = new THREE.Group(); p.add(sail); sail.position.set(cfg.crateX, 1.2, .1);
      orb(sail, m.cyan, 0, 0, 0, .17, .12, .27);
      const wingMat = mat(0xdaa477, { emissive: 0x795030, emissiveIntensity: .3, side: THREE.DoubleSide });
      for (const s of [-1, 1]) { const wing = orb(sail, wingMat, s * .3, .07, 0, .5, .06, .32); wing.rotation.z = s * .3; }
      sail.visible = false;
    }
    let bell = null;
    if (index === 3) {
      bell = new THREE.Group(); p.add(bell); bell.position.set(length - 2, 0, 0);
      rod(bell, m.rust, [0, 0, -.5], [0, 4, -.5], .08);
      rod(bell, m.rust, [0, 4, -.5], [-.7, 4, -.5], .07);
      mesh(geo.cone, m.ivory, -.7, 3.6, -.5, .3, .5, .3, bell);
      rod(bell, m.ivory, [-.7, 3.3, -.5], [-.7, 1.3, -.5], .025);
      torus(bell, m.rust, -.7, 1.15, -.5, .16);
      panel(bell, -.7, 2.4, 'bell', -.3);
    }
    // Each hall has a different silhouette and visual depth.
    if (index === 0) {
      // Wind observation apparatus, specimen jars and hand-worn copper tubing.
      windVane=new THREE.Group();p.add(windVane);windVane.position.set(13,6.6,-4.5);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(windVane,m.ivory,[0,0,0],[Math.cos(a)*1.3,Math.sin(a)*1.3,0],.04);orb(windVane,m.rust,Math.cos(a)*1.35,Math.sin(a)*1.35,0,.26,.26,.1);}
      torus(windVane,m.steel,0,0,0,.7);
      curvePipe(p,[[3,2.5,-4],[3,3.5,-4],[4,4,-4],[5,3.8,-4],[5,2.5,-4]],.08,m.rust);
      for(let i=0;i<5;i++){mesh(geo.cylinder,m.glass,5.8+i*.45,2.9,-3.3,.13,.55,.13,p);orb(p,m.cyan,5.8+i*.45,2.76,-3.3,.07,.07,.07);}
      torus(p, m.steel, 12, 5.5, -5.7, 4.2);
      torus(p, m.rust, 12, 5.5, -5.65, 3.9);
      box(p, m.dark, 1, .14, .5, 2.6, .25, 1.4);
      for (let i = 0; i < 6; i++) orb(p, m.leaf, .5 + i * .25, .3, .6, .4, .09, .3);
      plant(p, 3.5, 0, -3.7, 1.1);
      box(p, m.ivory, 8, 3, -3.7, 3.2, 1.1, .5);
      for (let i = 0; i < 4; i++) torus(p, m.dark, 7 + i * .67, 3, -3.39, .22);
    } else if (index === 1) {
      torus(p, m.steel, 17, 5, -5.7, 4.5);
      torus(p, m.amber, 17, 5, -5.8, 4.25);
      box(p, m.dark, 14, 3.6, -3.9, 18, .35, 2.3);
      for (let i = 0; i < 15; i++) {
        box(p, i % 3 ? m.rust : m.ivory, 5 + i * 1.2, 4.1 + (i % 2) * .12, -4, .8, .6 + (i % 2) * .24, .7);
        box(p, m.dark, 5 + i * 1.2, 4.48 + (i % 2) * .22, -3.7, .3, .05, .06);
      }
      for (let x = 3; x < 34; x += 7) rod(p, m.steel, [x, 3.4, -4], [x + 2, 8.5, -4], .08);
      const coat = mesh(geo.cone, m.rust, 7, 3.6, 1.6, .43, 1.7, .25, p); coat.rotation.z = .1; markForeground(coat,6.1,7.9);
      conveyor=new THREE.Group();p.add(conveyor);
      for(let i=0;i<6;i++){const luggage=new THREE.Group();conveyor.add(luggage);luggage.position.set(7+i*3,4.65,-4);box(luggage,i%2?m.rust:m.ivory,0,0,0,.8,.6,.6);torus(luggage,m.dark,0,.36,0,.14);box(luggage,m.dark,0,0,.32,.12,.6,.04);}
      for(let x=1;x<36;x+=3){box(p,m.dark,x,8.3,-5.5,2.7,2.1,.2);box(p,m.dimAmber,x,8.3,-5.3,2.4,1.8,.04);box(p,m.steel,x,8.3,-5.2,.07,1.8,.06);box(p,m.steel,x,8.3,-5.2,2.4,.07,.06);}
      curvePipe(p,[[12,9,-3],[12,6.4,-3],[13,6,-3],[14,6.4,-3],[14,9,-3]],.035,m.dark);
      rod(p, m.dark, [7, 4.4, 1.6], [7, 6.4, 1.6], .04);
    } else if (index === 2) {
      for (let x = -2; x < length + 3; x += 5) {
        const arch = torus(p, m.steel, x, 3, -4.8, 5.8, Math.PI / 2); arch.scale.y = 5.8 * 1.3;
        plant(p, x, 0, -4.2, 2 + (x % 3) * .13);
        curvePipe(p,[[x,.8,-4],[x-.6,2,-4],[x+1,4.4,-4],[x+.3,6,-3.8]],.075,m.leaf);
        for(let leaf=0;leaf<3;leaf++){const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.8,.7,-.55,2.1,0,2.6);shape.bezierCurveTo(.7,1.9,.75,.7,0,0);const lg=ownGeo(new THREE.ShapeGeometry(shape,8));const obj=mesh(lg,m.leaf,x+.5,2+leaf*.8,-3.7,.8,1,1,p);obj.rotation.z=(leaf%2?-.7:.6);rod(p,m.ivory,[x+.5,2+leaf*.8,-3.66],[x+.6,4+leaf*.8,-3.66],.018);}

      }
      for (let x = 4; x < length; x += 5) {
        lamp(p, x, 6.6, -4.3, false);
        box(p, m.ivory, x, .16, -2.9, 3, .3, 1.4);
      }
      cart = new THREE.Group(); p.add(cart); cart.position.set(17, 0, -.55);
      box(cart, m.steel, 0, .8, 0, 3.2, 1.6, 1.1);
      box(cart, m.ivory, 0, 1.5, .57, 2.9, .08, .04);
      for (const x of [-1, 1]) { const w = mesh(geo.cylinder, m.dark, x, .32, .7, .32, .1, .32, cart); w.rotation.x = Math.PI / 2; }
    } else {
      // Open dock, huge nearby hull, orange boarding aperture.
      dockShip=new THREE.Group();p.add(dockShip);
      const hull = orb(dockShip, m.steel, 26, 8, -7, 15, 4.5, 5.3);
      box(dockShip, m.rust, 27, 4.3, -3.2, 17, .35, .3);
      for (let i = 0; i < 12; i++) box(dockShip, i % 3 ? m.amber : m.dark, 12 + i * 1.6, 7.3, -2.4, .75, .4, .16);
      box(dockShip, m.dark, 34, 3, -2.1, 3, 5.2, 1);
      box(dockShip, m.amber, 34, 5.4, -1.45, 2.8, .1, .1);
      box(dockShip, m.amber, 32.6, 3, -1.45, .1, 4.9, .1);
      box(dockShip, m.amber, 35.4, 3, -1.45, .1, 4.9, .1);
      box(dockShip,m.steel,34,.1,-.7,5,.2,3.1);
      box(dockShip,m.dark,34,2.1,-1.2,3.1,4.2,.3);
      // The open hatch has real frame depth and a distant coastal horizon.
      const coastCanvas=document.createElement('canvas');coastCanvas.width=128;coastCanvas.height=256;
      const cc=coastCanvas.getContext('2d'),sky=cc.createLinearGradient(0,0,0,256);
      sky.addColorStop(0,'#10262e');sky.addColorStop(.48,'#244e55');sky.addColorStop(.56,'#577f7c');sky.addColorStop(.59,'#204b51');sky.addColorStop(1,'#102d35');cc.fillStyle=sky;cc.fillRect(0,0,128,256);
      cc.strokeStyle='rgba(162,207,190,.16)';cc.lineWidth=1;for(let line=0;line<18;line++){const y=151+line*5;cc.beginPath();cc.moveTo((line*29)%100,y);cc.lineTo(Math.min(128,(line*29)%100+15+line*2),y);cc.stroke();}
      const coastTexture=new THREE.CanvasTexture(coastCanvas);coastTexture.colorSpace=THREE.SRGBColorSpace;textures.add(coastTexture);
      const coastMaterial=new THREE.MeshBasicMaterial({map:coastTexture});materials.add(coastMaterial);
      mesh(geo.plane,coastMaterial,34,2.15,-1.025,2.9,4,1,dockShip);
      for(const sign of [-1,1]){
        const x=34+sign*1.62;
        box(dockShip,m.steel,x,2.2,-.8,.28,4.45,.45);
        box(dockShip,m.rust,x-sign*.16,2.2,-.53,.07,4.25,.06);
        box(dockShip,m.dimAmber,x-sign*.23,2.15,-.55,.028,3.65,.04);
        for(let y=.45;y<4.2;y+=.48){const rivet=mesh(geo.cylinder,m.ivory,x,y,-.53,.045,.05,.045,dockShip);rivet.rotation.x=Math.PI/2;}
        for(const y of [1.05,3.25]){box(dockShip,m.rust,x+sign*.09,y,-.52,.34,.26,.22);const hinge=mesh(geo.cylinder,m.steel,x+sign*.22,y,-.4,.09,.4,.09,dockShip);}
      }
      for(const y of [.15,4.4]){box(dockShip,m.steel,34,y,-.79,3.55,.28,.42);box(dockShip,m.rust,34,y,-.53,3.38,.07,.04);}
      box(dockShip,m.dimAmber,34,4.16,-.52,2.85,.045,.05);
      const faceLight=new THREE.PointLight(0xffbd7c,7,6,2);faceLight.position.set(32.9,2.8,1.5);faceLight.visible=false;dockShip.add(faceLight);endingLights.push(faceLight);
      const edgeLight=new THREE.PointLight(0x70d7ce,4,5,2);edgeLight.position.set(35.4,2.2,-.2);edgeLight.visible=false;dockShip.add(edgeLight);endingLights.push(edgeLight);
      const netLines=[];for(let i=0;i<9;i++){netLines.push([32.8+i*.3,2.4,-.8,.014,1.3,.02]);netLines.push([34,1.8+i*.15,-.8,2.5,.014,.02]);}instanceBoxes(dockShip,m.ivory,netLines);
      curvePipe(dockShip,[[32,1,-.5],[32,4.1,-.5],[34,4.4,-.5],[36,4.1,-.5],[36,1,-.5]],.09,m.rust);
      const reel = mesh(geo.cylinder, m.rust, 6, -.5, 3.2, 1.1, 2.7, 1.1, p); reel.rotation.z = Math.PI / 2; markForeground(reel,4.4,7.6);
      for (let x = 4.7; x < 7.4; x += .2) { const ring = torus(p, m.dark, x, -.5, 3.2, 1.1, Math.PI / 2); }
      rod(p, m.rust, [7, -.2, 3.5], [13, -2.6, 7], .075);
    }
    p.visible = index === 0;
    const ignored = new Set([gate,latch,wheel,bridge,cart,crate,sail,tech,ship,dockShip,windVane,conveyor,...foreground.map(f=>f.object),...reflections]);
    batchStatic(p, ignored);
    if(dockShip)batchStatic(dockShip);
    batchStatic(gate);batchStatic(bridge);batchStatic(tech,new Set([wheel]));batchStatic(ship);
    if(crate)batchStatic(crate);if(bell)batchStatic(bell);if(windVane)batchStatic(windVane);
    if(conveyor)conveyor.children.forEach(bag=>batchStatic(bag));
    const data = { gate, latch, wheel, bridge, cart, crate, sail, ship, bell, dockShip, endingLights, windVane, conveyor, foreground, reflections, guards: new Map() }; roomVisuals.push(data);
    return data;
  }
  for (let i = 0; i < ROOMS.length; i++) { makeRoom(i); options.onProgress?.(.15 + i * .1); }

  function character(role = 'nim') {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const isNim = role === 'nim';
    const skin = mat(isNim ? 0x84966a : role === 'tech' ? 0xa5a59a : 0x8a9a8a, { bumpMap: grain, bumpScale: .03, roughness: .85 });
    const cloth = role === 'tech' ? m.rust : m.dark;
    if (isNim) {
      orb(body, skin, 0, .88, 0, .21, .37, .16);
      const head = orb(body, skin, 0, 1.34, .015, .28, .36, .25); head.rotation.z = -.08;
      orb(body, skin, 0, 1.17, .17, .19, .12, .14);
      for (const s of [-1, 1]) {
        orb(body, m.amber, s * .15, 1.34, .21, .115, .13, .07);
        orb(body, m.dark, s * .15, 1.34, .278, .04, .065, .016);
        orb(body, m.ivory, s * .15 + .022, 1.38, .29, .016, .018, .008);
      }
      box(body, m.dark, 0, 1.1, .29, .17, .015, .01);
      const cape = mesh(geo.cone, cloth, 0, .88, -.08, .32, .64, .25, body); cape.rotation.x = -.15;
      torus(body, m.rust, 0, 1.1, 0, .22).rotation.x = Math.PI / 2;
      box(body, m.rust, .15, .9, .2, .11, .45, .035).rotation.z = -.2;
    } else {
      orb(body, cloth, 0, 1.8, 0, role === 'tech' ? .29 : .42, .7, .25);
      const helmet=new THREE.Group();body.add(helmet);helmet.position.y=2.29;
      if(workerHeads[role]) helmet.add(workerHeads[role].clone(true));
      else {
        orb(helmet,m.ivory,0,.33,0,.29,.34,.25);
        box(helmet,m.dark,0,.35,.22,.48,.19,.12);
        box(helmet,m.amber,0,.36,.29,.25,.03,.015);
        torus(helmet,m.ivory,0,.05,0,.34).rotation.x=Math.PI/2;
      }
      box(body, m.amber, -.14, 1.95, .24, .12, .17, .08);
      box(body, m.rust, 0, 1.27, .04, .67, .13, .54);
      if (role === 'tech') { for (const sign of [-1, 1]) box(body, m.ivory, sign * .2, 1.8, .25, .07, .95, .04); }
      for(const sign of [-1,1]) {
        orb(body,m.steel,sign*.34,2.05,0,.17,.2,.29);
        box(body,m.rust,sign*.29,1.44,.18,.18,.28,.15);
        for(let stripe=0;stripe<3;stripe++)box(body,m.ivory,sign*.3,1.52-stripe*.06,.263,.13,.02,.02);
      }
      box(body,m.ivory,0,1.78,.26,.13,.42,.03);
    }
    const arms = [], legs = [];
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * (isNim ? .22 : .37), isNim ? 1.02 : 2.14, 0); body.add(arm);
      const len = isNim ? .5 : .87;
      orb(arm, isNim ? skin : cloth, s * .06, -len / 2, .04, isNim ? .065 : .12, len / 2, isNim ? .07 : .13);
      orb(arm, isNim ? skin : m.ivory, s * .06, -len, .07, isNim ? .085 : .11, .09, .07);
      for (let f = 0; f < 4; f++) rod(arm, skin, [s * .06 + (f - 1.5) * .035, -len, .09], [s * .06 + (f - 1.5) * .048, -len - .14, .14], .015);
      arms.push(arm);
      const leg = new THREE.Group(); leg.position.set(s * (isNim ? .12 : .21), isNim ? .62 : 1.25, 0); body.add(leg);
      orb(leg, isNim ? skin : cloth, 0, isNim ? -.23 : -.43, 0, isNim ? .08 : .145, isNim ? .26 : .48, isNim ? .08 : .16);
      orb(leg, isNim ? skin : m.dark, 0, isNim ? -.55 : -1.1, .09, isNim ? .11 : .19, isNim ? .1 : .2, isNim ? .22 : .3);
      legs.push(leg);
    }
    root.userData = { body, arms, legs, role, lastX: 0, pace: 0 };
    return root;
  }
  const nim = character(); scene.add(nim);
  let loadedNim = null, lowNim = null;
  try {
    const loaded = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/nim.glb`);
    loadedNim = loaded.scene;
    loadedNim.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; geometries.add(o.geometry); for (const material of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); } } });
    nim.userData.body.visible = false;
    nim.add(loadedNim);
    nim.userData.art = loadedNim;
    loadedNim.userData.restScaleY=loadedNim.scale.y;
    nim.userData.rig=new Map();loadedNim.traverse(o=>{const key=o.name.replace(/[._]/g,'');if(/^(head|arm[LR]|forearm[LR]|hand[LR]|leg[LR]|shin[LR])$/.test(key)){o.userData.restRotation=o.rotation.clone();nim.userData.rig.set(key,o);}});
  } catch (error) {
    destroy();
    throw new Error('Unable to load the Nim model. Please retry.', { cause: error });
  }
  try {
    const loaded=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/nim-low.glb`);
    lowNim=loaded.scene;nim.add(lowNim);lowNim.visible=false;
    lowNim.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}}});
    for(const model of [loadedNim,lowNim]) {
      model.userData.restScaleY=model.scale.y;model.userData.rig=new Map();model.traverse(o=>{const key=o.name.replace(/[._]/g,'');if(/^(head|arm[LR]|forearm[LR]|hand[LR]|leg[LR]|shin[LR])$/.test(key)){o.userData.restRotation=o.rotation.clone();model.userData.rig.set(key,o);}});
    }
  }catch(error){destroy();throw new Error('Unable to load optimized character. Please retry.',{cause:error});}
  function selectNimQuality() {
    const model=quality==='low'?lowNim:loadedNim;
    loadedNim.visible=model===loadedNim;lowNim.visible=model===lowNim;
    nim.userData.art=model;nim.userData.rig=model.userData.rig;
  }
  selectNimQuality();
  try {
    const loaded = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/sail.glb`);
    loaded.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; geometries.add(o.geometry); for (const material of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); } } });
    for(let i=0;i<2;i++){const creature=loaded.scene.clone(true);creature.visible=false;roomVisuals[3].dockShip?.add(creature);creature.position.set(33.2+i*.75,2.2,-.35);endingSails.push(creature);}
    for (const visual of roomVisuals) {
      if (!visual.sail) continue;
      visual.sail.clear();
      const glider = loaded.scene.clone(true); glider.rotation.y = Math.PI / 4;
      visual.sail.add(glider);
    }
  } catch (error) {
    destroy();
    throw new Error('Unable to load the sail creature. Please retry.', { cause: error });
  }
  try {
    for(const [role,name] of [['keeper','keeper-head'],['tech','tech-head']]) {
      const model=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/${name}.glb`);workerHeads[role]=model.scene;
      model.scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(mat=>{materials.add(mat);for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);});}});
    }
  }catch(error){destroy();throw new Error('Unable to load station crew. Please retry.',{cause:error});}
  applyQuality(scene);
  options.onProgress?.(.85);
  const targetRing = new THREE.Group(); scene.add(targetRing);
  for (const r of [.44, .54]) torus(targetRing, m.amber, 0, 0, 0, r);
  targetRing.visible = false;
  const interactionRing = torus(scene, m.cyan, 0, .1, 0, .45); interactionRing.rotation.x = -Math.PI / 2;
  const blockedArc=new THREE.Group();scene.add(blockedArc);blockedArc.visible=false;
  const halfArc=ownGeo(new THREE.TorusGeometry(.27,.022,5,24,Math.PI*.76));
  for(const angle of [.2,Math.PI+.2]){const a=mesh(halfArc,m.amber,0,0,0,1,1,1,blockedArc);a.rotation.z=angle;}
  const blockedPositions=new Float32Array(6), blockedGeometry=ownGeo(new THREE.BufferGeometry());blockedGeometry.setAttribute('position',new THREE.BufferAttribute(blockedPositions,3));
  const blockedMaterial=new THREE.LineBasicMaterial({color:0xf3bb6e,transparent:true,opacity:.65});materials.add(blockedMaterial);const blockedLine=new THREE.Line(blockedGeometry,blockedMaterial);scene.add(blockedLine);blockedLine.visible=false;
  const threadPositions = new Float32Array(6);
  const threadGeo = ownGeo(new THREE.BufferGeometry()); threadGeo.setAttribute('position', new THREE.BufferAttribute(threadPositions, 3));
  const threadMaterial = new THREE.LineBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: .9 }); materials.add(threadMaterial);
  const thread = new THREE.Line(threadGeo, threadMaterial); scene.add(thread); thread.visible = false;
  // Rain remains behind playable space, never concealing targets or controls.
  const rainCount = quality === 'low' ? 110 : 340, rainData = [];
  const rainGeo = ownGeo(new THREE.BufferGeometry()); const rainPositions = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i++) rainData.push({ x: Math.random() * 70 - 15, y: Math.random() * 20, z: -4 - Math.random() * 24, speed: 7 + Math.random() * 5 });
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0x9ac7c5, transparent: true, opacity: .18, depthWrite: false }); materials.add(rainMat);
  const rain = new THREE.LineSegments(rainGeo, rainMat); scene.add(rain);
  const drop=orb(scene,m.cyan,34,4,0,.035,.075,.035);drop.visible=false;
  const look = new THREE.Vector3(9, 2.3, 0), currentLook = look.clone();
  let elapsed = 0, lastRoom = -1;
  const sightGeo = ownGeo(new THREE.ConeGeometry(1, 1, 20, 1, true));
  function guardVisual(role) {
    const root = character(role);
    const parts=root.userData;batchStatic(parts.body,new Set([...parts.arms,...parts.legs]));[...parts.arms,...parts.legs].forEach(part=>batchStatic(part));
    const signal = new THREE.Group(); root.add(signal); signal.position.y = 3.22;
    const listen=mesh(ownGeo(new THREE.TorusGeometry(.28,.025,5,24,Math.PI)),m.amber,0,.06,.04,1,1,1,signal);
    const a = box(signal, m.amber, -.24, 0, .03, .06, .36, .04); a.rotation.z = -.3;
    const b = box(signal, m.amber, .24, 0, .03, .06, .36, .04); b.rotation.z = .3;
    const sight = mesh(sightGeo, m.beam, 0, 1, -.05, 1, 5.5, .5, root); sight.rotation.z = Math.PI / 2; sight.position.z = -.1; sight.castShadow = false;
    root.userData.listen = listen;
    sight.userData.essential=true;
    root.userData.signal = signal; root.userData.shutters = [a, b]; root.userData.sight = sight;
    return root;
  }
  function animateActor(actor, data, dt, controlled = false, abandoned = false, traversal = {kind:'walk'}) {
    const u = actor.userData;
    const dx = data.x - u.lastX, moving = Math.abs(dx) > .0005;
    if (moving && dt > 0) u.pace += Math.min(Math.abs(dx), .2) * (u.role === 'nim' ? 7 : 4);
    actor.position.x = data.x; actor.position.y = 0; actor.position.z = .2;
    const direction = data.facing || 1;
    const angle = direction > 0 ? 1.12 : -1.12;
    actor.rotation.y = damp(actor.rotation.y, angle, u.role === 'nim' ? 15 : 8, dt);
    const gait = moving && !reduced ? Math.sin(u.pace) : 0;
    u.body.position.y = Math.abs(gait) * .04;
    u.legs?.forEach((leg, i) => leg.rotation.x = gait * (i === 0 ? .5 : -.5));
    u.arms?.forEach((arm, i) => arm.rotation.x = gait * (i === 0 ? -.32 : .32));
    if(controlled && !u.wasControlled)u.gesture=1.4;
    u.wasControlled=controlled;
    u.gesture=Math.max(0,(u.gesture||0)-dt);
    if(u.role!=='nim' && (data.recovery>0 || u.gesture>0)) {
      const touch= data.recovery>0 ? Math.sin((2-data.recovery)*Math.PI/2)*.9+.2 : Math.sin(u.gesture/1.4*Math.PI);
      if(u.arms[0]){u.arms[0].rotation.x=-1.8*touch;u.arms[0].rotation.z=-.65*touch;}
      if(u.arms[1])u.arms[1].rotation.z=.16*touch;
    } else u.arms?.forEach(a=>a.rotation.z=0);
    if (u.art) {
      u.crouch=damp(u.crouch||0,traversal.kind==='crouch'?1:0,14,dt);
      u.art.rotation.x=.25*u.crouch;
      const shrink=1-clamp(((traversal.clearance??.95)+.12)/1.45,.6,.8);
      u.art.scale.y=u.art.userData.restScaleY*(1-shrink*u.crouch);
      u.art.position.y = Math.abs(gait) * .025-.19*u.crouch;
      const bone = name => u.rig?.get(name.replace(/[._]/g,''));
      const pose=(name,x,y=0,z=0)=>{const b=bone(name);if(b)b.rotation.set(b.userData.restRotation.x+x,b.userData.restRotation.y+y,b.userData.restRotation.z+z);};
      const gesture=traversal.kind==='possess'?1:0;
      for(const [side,sign] of [['L',1],['R',-1]]) {
        pose('leg.'+side,gait*sign*.29+.46*u.crouch);
        pose('shin.'+side,-.08-Math.max(0,gait*sign)*.21-.57*u.crouch);
        pose('arm.'+side,-gait*sign*.23-.13-(side==='R'?gesture*.85:0),0,sign*.06);
        pose('forearm.'+side,-.22-gesture*.6);
        pose('hand.'+side,gesture*.35,0,gesture*sign*.16);
      }
      pose('head',-.04+.13*u.crouch,reduced?0:Math.sin(elapsed*.85)*.04,Math.sin(elapsed*.5)*.025);
      if(traversal.kind==='climb') {pose('arm.L',-.8);pose('arm.R',-1.1);}

    }
    actor.rotation.z = abandoned ? -.9 : 0;
    if (abandoned) { actor.position.y = .12; actor.scale.setScalar(.82); } else actor.scale.setScalar(1);
    u.lastX = data.x;
    if (u.signal) {
      const alert = data.alert || 0;
      u.signal.visible = alert > .01 || data.mode === 'investigate' || data.investigate != null;
      u.listen.visible = alert <= .01 && data.investigate != null;
      u.shutters.forEach(shutter=>shutter.visible=alert>.01);
      const amt = clamp(alert / 2, 0, 1);
      u.shutters[0].position.x = -.24 * (1 - amt); u.shutters[1].position.x = .24 * (1 - amt);
      u.signal.rotation.y = -actor.rotation.y;
      u.sight.visible = !controlled && !data.recovery;
      u.sight.rotation.set(0, 0, -Math.PI / 2);
      u.sight.position.set(0, 1.7, 2.75);
      u.sight.rotation.x = -Math.PI / 2;
      u.sight.rotation.z = 0;
    }
  }
  function update(state, dt = 0) {
    if (disposed || !state) return;
    elapsed += Math.min(dt, .05);
    const room = state.room || 0, rs = state.rooms[room], cfg = ROOMS[room], visual = roomVisuals[room];
    if (room !== lastRoom) { roomGroups.forEach((g, i) => g.visible = i === room); lastRoom = room; }
    for (const gd of rs.guards) {
      let actor = visual.guards.get(gd.id);
      if (!actor) { actor = guardVisual(gd.role); roomGroups[room].add(actor); visual.guards.set(gd.id, actor); applyQuality(actor); }
      animateActor(actor, gd, dt, state.controlled === gd.id, false, World.getTraversal?.(state,gd));
      actor.position.y += getHeight(state,gd);
      if(World.getTraversal?.(state,gd).kind==='service')actor.position.z=-.65;
    }
    const traversal=World.getTraversal?.(state,state.nim)||{kind:'walk'};
    traversal.clearance=(cfg.crawl||[]).find(c=>state.nim.x>=c.from&&state.nim.x<=c.to)?.clearance??.95;
    animateActor(nim, state.nim, dt, false, !!state.controlled,state.transition?{...traversal,kind:'possess'}:traversal);
    nim.position.y += getHeight(state, state.nim);
    if (menuMode) { nim.position.set(7.5, 0, 2.2); nim.scale.setScalar(2.1); nim.rotation.set(0, -.18 + (reduced ? 0 : Math.sin(elapsed * .3) * .08), 0); }
    if (visual.cart) visual.cart.position.x = rs.cartX ?? 17;
    const controlled = rs.guards.find(g => g.id === state.controlled);
    const active = controlled || state.nim;
    const target = getTarget(state);
    const targetInfo=World.getTargetInfo?.(state);
    const obstruction=targetInfo?.obstruction;
    const showBlocked=!menuMode&&!ending&&!state.controlled&&!target&&targetInfo?.reason==='glass'&&obstruction;
    blockedArc.visible=!!showBlocked;blockedLine.visible=!!showBlocked;
    if(showBlocked){const blockY=obstruction.y??1.7;blockedArc.position.set(obstruction.x,blockY,.6);blockedPositions.set([state.nim.x,1.25+getHeight(state,state.nim),.5,obstruction.x,blockY,.5]);blockedGeometry.attributes.position.needsUpdate=true;}
    targetRing.visible = !!target && !state.controlled && !menuMode;
    if (target) { targetRing.position.set(target.x, 2.4+getHeight(state,target), .85); targetRing.rotation.y = .05; targetRing.scale.setScalar(reduced ? 1 : 1 + Math.sin(elapsed * 3) * .04); }
    const interaction = getInteraction(state);
    interactionRing.visible = !!interaction && !menuMode;
    if (interaction) interactionRing.position.set(interaction.x ?? active.x, .08, .2);
    const channel = state.transition || state.channel || state.possession;
    thread.visible = !!channel && !state.controlled;
    if (thread.visible) {
      const tg = rs.guards.find(g => g.id === (channel.targetId || channel.target || channel.id)) || target;
      if (tg) { threadPositions.set([state.nim.x, 1.25+getHeight(state,state.nim), .5, tg.x, 2.4+getHeight(state,tg), .5]); threadGeo.attributes.position.needsUpdate = true; } else thread.visible = false;
    }
    visual.gate.position.y = damp(visual.gate.position.y, rs.gateOpen ? 4.6 : 0, 4, dt);
    visual.latch.rotation.z = rs.gateOpen ? -Math.PI / 2 : 0;
    visual.bridge.scale.x = damp(visual.bridge.scale.x, rs.bridgeOpen ? 1 : .015, 3, dt);
    visual.wheel.rotation.z = (typeof rs.mechanism === 'number' ? rs.mechanism : rs.mechanism?.progress || 0) * Math.PI * 4;
    if (visual.crate) {
      visual.crate.rotation.z = rs.rescued ? -.09 : 0;
      if(rs.rescued && !visual.wasRescued)visual.rescueTime=elapsed;
      visual.wasRescued=!!rs.rescued;
      const flight=elapsed-(visual.rescueTime??elapsed);
      visual.sail.visible=!!rs.rescued&&flight<5;
      if(rs.rescued){visual.sail.position.set(cfg.crateX+flight*1.5,1.6+Math.sin(Math.min(1,flight/3)*Math.PI/2)*3,-flight*.5);visual.sail.rotation.z=reduced?0:Math.sin(elapsed*3)*.08;}
    }
    const aspect = width / height;
    const portrait = aspect < .8;
    const viewWidth = portrait ? 10 : aspect < 1.25 ? 18 : 27;
    const distance = viewWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * aspect);
    const visibleHalf = viewWidth * .42;
    const witness=state.phase==='lost'?rs.guards.find(g=>g.id===state.loss?.guardId):null;
    const focusX=state.phase==='lost'?((state.loss?.x??state.nim.x)+(witness?.x??state.nim.x))/2:active.x+(active.facing||1)*(portrait?1:2.5);
    const cx = clamp(focusX, visibleHalf - 1, (cfg.length || 36) - visibleHalf + 1);
    look.set(cx, portrait ? 2.1 : 2.7, -.7);
    currentLook.lerp(look, reduced ? 1 : 1 - Math.exp(-dt * 3.4));
    if (!dt || state.phase==='lost') currentLook.copy(look);
    camera.position.set(currentLook.x - .7, currentLook.y + distance * .22, distance);
    camera.lookAt(currentLook);
    if (menuMode) {
      const portraitMenu = aspect < .8;
      const targetX = portraitMenu ? 7.1 : 4.9;
      camera.position.set(targetX, 3.25, portraitMenu ? 13 : 10.3);
      camera.lookAt(targetX, 1.65, 1);
    }
    camera.updateMatrixWorld(true);
    // Foreground geometry yields when it actually crosses the controlled body's silhouette.
    for(const f of visual.foreground) {
      const bounds=f.bounds||(f.bounds=new THREE.Box3().setFromObject(f.object));
      const screen=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])screen.push(project(x,y,z));
      const head=project(active.x,getHeight(state,active)+(controlled?2.8:traversal.kind==='crouch'?.8:1.4));
      const foot=project(active.x,getHeight(state,active)+.1);
      const obstructs=!menuMode&&head.x>=Math.min(...screen.map(p=>p.x))-10&&head.x<=Math.max(...screen.map(p=>p.x))+10&&Math.max(head.y,foot.y)>=Math.min(...screen.map(p=>p.y))&&Math.min(head.y,foot.y)<=Math.max(...screen.map(p=>p.y));
      f.object.traverse(o=>{if(o.isMesh){o.material.opacity=damp(o.material.opacity,obstructs?.14:1,7,dt);o.castShadow=!obstructs;}});
    }
    if(visual.windVane&&!reduced)visual.windVane.rotation.z=elapsed*.24+Math.sin(elapsed*.4)*.15;
    if(visual.conveyor&&!reduced)visual.conveyor.children.forEach((bag,i)=>bag.position.x=6+(i*3+elapsed*.22)%20);
    visual.reflections.forEach((r,i)=>{r.scale.x=1.4+(reduced?0:Math.sin(elapsed*.8+i)*.12);});
    const rescued=ending?.rescued??state.rooms.filter(r=>r.rescued).length;
    endingSails.forEach((creature,i)=>{creature.visible=i<rescued;creature.rotation.y=.3+(reduced?0:Math.sin(elapsed*.8+i)*.1);creature.position.y=2.2+(reduced?0:Math.sin(elapsed*1.6+i)*.08);});
    drop.visible=false;
    if(room===3&&visual.dockShip) {
      visual.endingLights.forEach(light=>light.visible=!!ending);
      const time=ending?.time??0;
      const departure=ending&&!reduced?Math.max(0,time-5)*1.35:0;
      visual.dockShip.position.set(departure,ending&&!reduced?Math.max(0,time-5)*.035:0,-departure*.22);
      if(ending) {
        const boarding=clamp(time/1.8,0,1);
        nim.position.set(33.15+boarding*.9+departure,.42+visual.dockShip.position.y, .5-departure*.22);
        nim.rotation.set(0,.1,0);nim.scale.setScalar(1);
        const hand=nim.userData.rig?.get('armR');if(hand)hand.rotation.x=-.9*clamp((time-1.5)/1,0,1);
        const head=nim.userData.rig?.get('head');if(head)head.rotation.x=-.1;
        drop.visible=time>=3&&time<=4.2;
        drop.position.set(34.4+departure,3.2-clamp((time-3)/1.2,0,1)*2.3,.85-departure*.22);
        const endWidth=aspect<.8?4.6:6.8;
        const endDistance=endWidth/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*aspect);
        const settle=reduced?1:clamp(time/1.3,0,1);
        const endX=34+departure;
        camera.position.lerp(new THREE.Vector3(endX,2.15,endDistance+visual.dockShip.position.z),settle);
        camera.lookAt(endX,1.7,visual.dockShip.position.z);
        currentLook.set(endX,1.65,0);
        targetRing.visible=interactionRing.visible=thread.visible=blockedArc.visible=blockedLine.visible=false;
      }
    }
    bodyIndicator=state.controlled?{...project(state.nim.x,1+getHeight(state,state.nim)),danger:Math.max(...rs.guards.map(g=>g.alert||0))}:null;
    sun.position.x = currentLook.x - 8; sun.target.position.set(currentLook.x, 0, 0);
    if (!reduced) {
      rainData.forEach((r, i) => { r.y -= dt * r.speed; r.x -= dt * 2; if (r.y < -3) { r.y = 18; r.x = Math.random() * 65 - 10; } const j = i * 6; rainPositions[j] = r.x; rainPositions[j + 1] = r.y; rainPositions[j + 2] = r.z; rainPositions[j + 3] = r.x + .15; rainPositions[j + 4] = r.y + .65; rainPositions[j + 5] = r.z; });
      rainGeo.attributes.position.needsUpdate = true;
    }
    rain.visible = !reduced;
    renderer.render(scene, camera);
  }
  function resize() { width = Math.max(1, container.clientWidth); height = Math.max(1, container.clientHeight); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); if(quality==='low')renderer.setPixelRatio(Math.min(devicePixelRatio||1,1,Math.sqrt(500000/(width*height)))); }
  function setQuality(q) { quality = q; renderer.setPixelRatio(q==='low'?Math.min(devicePixelRatio||1,1,Math.sqrt(500000/(width*height))):Math.min(devicePixelRatio||1,1.5)); renderer.shadowMap.enabled = q !== 'low';applyQuality(scene);selectNimQuality(); }
  function setReducedMotion(value) { reduced = !!value; }
  function project(x, y = 1.8, z = .3) { const p = new THREE.Vector3(x, y, z).project(camera); return { x: (p.x * .5 + .5) * width, y: (-p.y * .5 + .5) * height, visible: p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 }; }
  function destroy() { if (disposed) return; disposed = true; geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove(); scene.clear(); }
  options.onProgress?.(1);
  function setMenuMode(value) { menuMode = !!value; }
  function setEndingMode(seconds,rescued=0){ending=seconds===null?null:{time:Math.max(0,seconds),rescued:clamp(rescued,0,2)};}
  return { update, resize, setMenuMode, setEndingMode, getBodyIndicator:()=>bodyIndicator, setQuality, setReducedMotion, destroy, project, renderer, scene, camera };
}
