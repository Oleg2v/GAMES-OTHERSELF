"""Original coastal sail creature. Blender Z-up; forward -Y -> glTF +Z."""
import bpy,math,os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
skin=mat('Sail creature • indigo hide',(.07,.21,.25),.5);fin=mat('Warm translucent sail membrane',(.67,.35,.12),.68);rib=mat('Sail ribs',(.11,.29,.27),.6);eye=mat('Sail amber eyes',(.95,.65,.19),.2);pupil=mat('Sail pupil',(.005,.014,.017),.25)
def egg(n,pos,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=14,location=pos);o=bpy.context.object;o.name=n;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def line(n,pts,rad,m):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=rad;c.bevel_resolution=1;p=c.splines.new('BEZIER');p.bezier_points.add(len(pts)-1)
 for bp,co in zip(p.bezier_points,pts):bp.co=co;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
egg('Sail body',(0,0,.02),(.075,.17,.06),skin)
egg('Sail head',(0,-.145,.035),(.09,.065,.065),skin)
for s in [-1,1]:
 egg('Sail eye',(s*.061,-.19,.06),(.028,.012,.032),eye);egg('Sail pupil',(s*.061,-.201,.06),(.01,.004,.018),pupil)
 vs=[];fs=[];N=16;M=8
 for j in range(M+1):
  r=j/M
  for i in range(N+1):
   t=i/N;ang=-.65+t*2.9
   ext=.38*(.7+.3*math.sin(t*math.pi))
   x=s*(.04+r*ext*math.sin(ang+.9));y=-.02+r*ext*math.cos(ang+.9)
   z=.025+math.sin(r*math.pi)*.075+math.sin(t*math.pi*5)*.012*r
   vs.append((x,y,z))
 for j in range(M):
  for i in range(N):q=j*(N+1)+i;fs.append((q,q+1,q+N+2,q+N+1))
 mesh=bpy.data.meshes.new('Membrane');mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new('sail.L' if s<0 else 'sail.R',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(fin)
 for p in mesh.polygons:p.use_smooth=True
 mod=o.modifiers.new('membrane thickness','SOLIDIFY');mod.thickness=.001
 for i in [0,4,8,12,16]:line('membrane rib',[vs[j*(N+1)+i] for j in range(M+1)],.0025,rib)
 line('scalloped fin edge',vs[-N-1:],.002,rib)
line('flowing rudder',[(0,.12,.025),(0,.23,.01),(.02,.32,.02),(.045,.39,.04)],.009,skin)
groups={}
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
for name,objs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 if len(objs)>1:bpy.ops.object.join()
 objs[0].name=name
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','sail.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public','assets','sail.glb'),export_format='GLB',use_selection=True,export_apply=True)
