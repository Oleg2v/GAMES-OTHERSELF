"""Original ceramic authority helmets for OTHERSELF, Blender 4.3.2.
Run from repository root: blender --background --python art/build_workers.py
Outputs GLBs with Y-up, forward +Z, collar-base origin (place at actor Y=2.29).
"""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.context.preferences.filepaths.save_version=0

def material(name,c,rough=.5,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
 return m

def mesh(name,verts,faces,mat,smooth=True):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(mat)
 for p in me.polygons:p.use_smooth=smooth
 return o

def line(name,pts,r,mat):
 vs=[];fs=[];N=6
 for i,co in enumerate(pts):
  p=Vector(co);d=Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(i-1,0)]);d.normalize();n=d.cross(Vector((0,1,0)))
  if n.length<.001:n=d.cross(Vector((1,0,0)))
  n.normalize();b=d.cross(n)
  for j in range(N):a=j/N*math.tau;vs.append(p+r*(n*math.cos(a)+b*math.sin(a)))
 for i in range(len(pts)-1):
  for j in range(N):q=i*N+j;fs.append((q,i*N+(j+1)%N,(i+1)*N+(j+1)%N,q+N))
 return mesh(name,vs,fs,mat)

def box(name,pos,scale,mat,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:
  m=o.modifiers.new('worn edges','BEVEL');m.width=bevel;m.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 for p in o.data.polygons:p.use_smooth=False
 return o

def pin(name,pos,r,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=10,ring_count=6,location=pos);o=bpy.context.object;o.name=name;o.scale=(r,r*.45,r);o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True

def build(role):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 ceramic=material(role+' • weathered porcelain',(.72,.71,.6),.47)
 dark=material(role+' • graphite visor',(.018,.042,.043),.2,.25)
 brass=material(role+' • patinated metal',(.28,.245,.13),.37,.62)
 rust=material(role+' • rust seal',(.22,.055,.027),.85)
 amber=material(role+' • eye slit',(.95,.43,.06),.28,0,1.3)
 istech=role=='tech'
 # Hand-shaped shell section: broad at temples, quiet rounded faceting, flatter face.
 rx=.248 if istech else .292;ry=.218 if istech else .249
 profiles=[(.105,.58),(.15,.78),(.22,.95),(.29,1),(.38,1),(.46,.98),(.53,.86),(.595,.68),(.635,.43),(.66,.12)]
 N=28;vs=[];fs=[]
 for k,(z,f) in enumerate(profiles):
  for j in range(N):
   a=j/N*math.tau;c=math.cos(a);s=math.sin(a)
   x=rx*f*math.copysign(abs(c)**.83,c)
   y=ry*f*math.copysign(abs(s)**.9,s)
   if istech:x+=.017*(z/.66)**2;z2=z+.018*math.sin(a+.3)*max(0,(z-.45)/.21)
   else:z2=z+.008*math.cos(a*2)*(z/.66)
   vs.append((x,y,z2))
 for k in range(len(profiles)-1):
  for j in range(N):q=k*N+j;fs.append((q,k*N+(j+1)%N,(k+1)*N+(j+1)%N,q+N))
 fs.append(tuple(reversed(range(N))));fs.append(tuple((len(profiles)-1)*N+j for j in range(N)))
 mesh('Continuous shaped ceramic shell',vs,fs,ceramic)
 # Curved optical band sits slightly proud of the shell; not an opaque box.
 seg=24;vv=[];ff=[]
 for row,z in enumerate([.319,.342,.415,.438]):
  for i in range(seg+1):
   a=-1.22+i/seg*2.44
   x=math.copysign(abs(math.sin(a))**.83,math.sin(a))*rx*1.018;y=-(math.cos(a)**.9)*ry*1.028
   if abs(a)>.7:y-=.012
   vv.append((x,y,z+.012*math.cos(a)))
 for row in range(3):
  for i in range(seg):q=row*(seg+1)+i;ff.append((q,q+1,q+seg+2,q+seg+1))
 mesh('Wraparound optical glass',vv,ff,dark)
 for z in [.319,.438]:
  pts=[]
  for i in range(seg+1):
   a=-1.22+i/seg*2.44;pts.append((math.copysign(abs(math.sin(a))**.83,math.sin(a))*rx*1.024,-(math.cos(a)**.9)*ry*1.035-(.012 if abs(a)>.7 else 0),z+.012*math.cos(a)))
  line('Visor fine gasket',pts,.0045,brass)
 # Small amber eyes recessed under dark lens, not a giant glowing panel.
 for sign in [-1,1]:
  x=sign*.083;eyeY=-ry*1.035
  line('Amber sight aperture',[(x-.034,eyeY,.379),(x+.034,eyeY,.379)],[.004][0],amber)
  for z in [.359,.399]:line('Aperture shade',[(x-.039,eyeY-.002,z),(x+.039,eyeY-.002,z)],.003,dark)
 # Divided white porcelain collar: individual interlocking petals with chipped tips.
 count=8 if istech else 7
 for j in range(count):
  a0=j/count*math.tau+.025;a1=(j+1)/count*math.tau-.025
  rin=.145;rout=.305 if istech else .355
  points=[]
  for z,r in [(.012,rin),(.012,rout),(.082,rout*.95),(.137,rin*1.08)]:
   for i in range(5):
    a=a0+(a1-a0)*i/4;rr=r
    if j==2 and i==2 and r>rin*1.2:rr-=.016
    points.append((math.cos(a)*rr,math.sin(a)*rr,z+.014*math.sin(a)))
  faces=[]
  for band in range(3):
   for i in range(4):q=band*5+i;faces.append((q,q+1,q+6,q+5))
  faces.extend([(0,5,10,15),(4,19,14,9)])
  mesh('Articulated porcelain collar petal',points,faces,ceramic,False)
  mid=(a0+a1)/2
  line('Collar locking seam',[(math.cos(mid)*.17,math.sin(mid)*.17,.137),(math.cos(mid)*rout*.9,math.sin(mid)*rout*.9,.082)],.004,rust)
  pin('Collar latch', (math.cos(mid)*rout*.78,math.sin(mid)*rout*.78,.092),.012,brass)
 # Recessed jaw vents and offset forehead manufacturing marks.
 for x in [-.086,-.043,0,.043,.086]:
  pts=[]
  for i in range(6):
   z=.197+i/5*.073;f=.95 if z>=.22 else .78+(z-.15)/.07*.17
   if z>=.22:f=.95+(z-.22)/.07*.05
   y=-ry*f*(max(.01,1-(abs(x)/(rx*f))**(2/.83)))**(.9/2)-.003
   pts.append((x,y,z))
  line('Lower ceramic ventilation channel',pts,.004,dark)
 for sign in [-1,1]:
  x=sign*rx*.93
  line('Temple panel seam',[(x,-.06,.47),(x,.03,.53),(x,.09,.42)],.004,brass)
  for z in [.25,.29,.33]:
   box('Temple latch', (sign*rx*.99,.025,z),(.026,.065,.018),brass,.003)
  pin('Temple shell pin',(sign*rx*.82,-.15,.49),.011,brass)
 # Authority insignia is physically embossed into the collar front.
 y=-.31 if not istech else -.274
 if not istech:
  line('Palm authority outline',[(-.025,y,.063),(-.033,y,.083),(-.03,y,.108),(.027,y,.108),(.033,y,.084),(.022,y,.061),(-.025,y,.063)],.003,dark)
  for i in range(4):
   x=-.025+i*.016;line('Palm digit',[(x,y,.108),(x,y,.133+(.008 if i in [1,2] else 0))],.003,dark)
  line('Palm thumb',[(-.03,y,.092),(-.048,y,.11)],.003,dark)
 else:
  pts=[]
  for i in range(49):
   a=i/48*math.tau;r=.036 if i%4 in [1,2] else .028
   pts.append((r*math.cos(a),y,.099+r*math.sin(a)))
  line('Technician gear authority',pts,.0032,dark)
  line('Gear hub',[(.012*math.cos(i/24*math.tau),y,.099+.012*math.sin(i/24*math.tau)) for i in range(25)],.003,dark)
 # Keeper: broad brow plate with ceramic slot; tech: asymmetrical machine hood and radiator.
 if not istech:
  line('Forehead inset', [(-.13,-.156,.55),(0,-.188,.581),(.13,-.156,.55)],.004,brass)
  for x in [-.045,0,.045]:box('Ceramic calibration notch',(x,-.173,.561),(.018,.007,.008),dark,.001)
 else:
  box('Offset machine brow',(.107,.023,.607),(.11,.2,.085),ceramic,.018)
  for i in range(6):
   box('Radiator lamella',(-.203,.075,.385+i*.026),(.065,.13,.009),brass,.002)
  line('Insulated diagnostic line',[(.18,.16,.17),(.2,.18,.38),(.16,.12,.57)],.01,rust)
 # Merge per material: at most five runtime draw calls, preserve authored source meshes in blend.
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art',role+'-worker.blend'))
 groups={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name,obs in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0]
  if len(obs)>1:bpy.ops.object.join()
  obs[0].name=name
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public','assets',role+'-head.glb'),export_format='GLB',use_selection=True,export_apply=True)
 # Source review render, not exported.
 scene=bpy.context.scene;scene.world.color=(.035,.045,.05)
 for name,loc,power,color in [('key',(1,-2,2),90,(1,.82,.58)),('rim',(-1,1,1),110,(.22,.8,1)),('fill',(-1,-2,1),35,(.6,.75,1))]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.size=1.8;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.35))-o.location).to_track_quat('-Z','Y').to_euler()
 data=bpy.data.cameras.new('asset review');cam=bpy.data.objects.new('asset review',data);bpy.context.collection.objects.link(cam);cam.location=(1.4,-3,1.25);cam.rotation_euler=(Vector((0,0,.33))-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=.91;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100;scene.render.filepath=os.path.join(ROOT,'art',role+'-worker-preview.png');bpy.ops.render.render(write_still=True)

build('keeper');build('tech')
print('WORKER HEADS COMPLETE')
