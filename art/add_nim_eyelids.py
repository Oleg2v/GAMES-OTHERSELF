"""Final amphibian expression: conforming olive lids, restrained amber and slight forward posture.
Run after shape_nim_v3.py on the weighted source. Idempotent.
"""
import bpy,os,math
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));ART=os.path.join(ROOT,'art');OUT=os.path.join(ROOT,'public','assets')
rig=bpy.data.objects['Nim'];body=bpy.data.objects['Nim • continuous game skin'];high=bpy.data.objects['SCULPT • Nim high detail bake source']
def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def lean(p,head):
 q=p.copy();q.y-=.015*smooth(.70,1.03,p.z)+.035*head;return q
if rig.get('eyelid_revision',0)<1:
 for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
 bpy.context.view_layer.update()
 for obj in list(bpy.context.scene.objects):
  if obj.type!='MESH':continue
  is_high=obj==high;to_rig=obj.matrix_world if is_high else rig.matrix_world.inverted()@obj.matrix_world;back=to_rig.inverted()
  for v in obj.data.vertices:
   p=to_rig@v.co
   if is_high:head=smooth(1.075,1.195,p.z)
   else:head=sum(g.weight for g in v.groups if obj.vertex_groups[g.group].name=='head')
   v.co=back@lean(p,head)
  obj.data.update()
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
 for bone in rig.data.edit_bones:
  bone.head=lean(bone.head,1 if bone.name=='head' else 0);bone.tail=bone.head+Vector((0,.1,0));bone.roll=0
 bpy.ops.object.mode_set(mode='OBJECT')
 # Olive material is skin, not eyebrows or white sclera. Conforming shells shade with the face.
 lidmat=bpy.data.materials.new('Nim • olive amphibian eyelids');lidmat.use_nodes=True
 p=lidmat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.145,.19,.071,1);p.inputs['Roughness'].default_value=.60;p.inputs['Metallic'].default_value=0
 # Narrow inset amber apertures; no nearly white/yellow sphere surface.
 amber=bpy.data.materials.get('Amber iris')
 if amber:
  p=amber.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.66,.255,.021,1);p.inputs['Roughness'].default_value=.28
 vs=[];faces=[];U=24;V=4
 for side in [-1,1]:
  # Final center/radii derived from the fixed geometry transforms in shape_nim_v3.py.
  oldz=1.282+(side+1)*.006
  center=Vector((side*.112*.92*.9,-.125*.92*.94,1.11+(oldz-1.11)*.85+.05))
  center=lean(center,1)
  rx=.078*.8*.92*.9;ry=.047*.88*.92*.94;rz=.085*.8*.85
  for upper,opening in [(True,.66),(False,.80)]:
   start=len(vs)
   for j in range(V+1):
    t=j/V
    for i in range(U+1):
     xx=math.sin(-math.pi/2+.012+i/U*(math.pi-.024))
     maxz=math.sqrt(max(0,1-xx*xx));zz=maxz*(opening+(.997-opening)*t)
     if not upper:zz=-zz
     surface=math.sqrt(max(0,1-xx*xx-zz*zz))
     # Smooth folded fullness along the aperture, blending back into the surrounding socket.
     puff=.0015+.0022*math.sin(t*math.pi)*maxz
     vs.append((center.x+rx*xx,center.y-ry*surface-puff,center.z+rz*zz))
   for j in range(V):
    for i in range(U):
     q=start+j*(U+1)+i
     faces.append((q,q+1,q+U+2,q+U+1) if upper else (q+U+1,q+U+2,q+1,q))
 me=bpy.data.meshes.new('Conforming amphibian eyelid surfaces');me.from_pydata(vs,[],faces);me.update()
 obj=bpy.data.objects.new('Nim • upper and lower eyelids',me);bpy.context.collection.objects.link(obj);obj.data.materials.append(lidmat)
 for poly in me.polygons:poly.use_smooth=True
 # UVs stay available for subsequent painted art passes; current material is authored olive skin.
 uv=me.uv_layers.new(name='UVMap')
 for loop in me.loops:
  co=me.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(co.x*5+.5,co.z*5)
 obj.parent=rig;obj.matrix_parent_inverse.identity()
 group=obj.vertex_groups.new(name='head');group.add(list(range(len(me.vertices))),1,'REPLACE')
 mod=obj.modifiers.new('Head deformation','ARMATURE');mod.object=rig
 rig['eyelid_revision']=1
 rig['eyelid_note']='Olive conforming lids cover 17% upper and 10% lower eye height; shallow forward head/shoulder posture.'
 bpy.context.view_layer.update()
# Geometry and bind transformations were coherent; preserve foot/head bounds and export.
export_objects=[o for o in bpy.context.scene.objects if o!=high and o.type in ['MESH','ARMATURE']]
bpy.ops.object.select_all(action='DESELECT')
for obj in export_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'nim.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_extras=True,export_animations=False)
exec(compile(open(os.path.join(ART,'export_mobile.py')).read(),os.path.join(ART,'export_mobile.py'),'exec'))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ART,'nim.blend'),compress=True)
source=open(os.path.join(ART,'refine_nim.py')).read()
exec(compile(source[source.index('# Inspect the actual weighted mesh'):],os.path.join(ART,'refine_nim.py'),'exec'))
