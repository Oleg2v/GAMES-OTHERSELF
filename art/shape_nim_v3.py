"""Non-destructive-topology anatomy refinement on Nim's validated weighted rig.
Run after the bake and weight validation: blender --background art/nim.blend --python art/shape_nim_v3.py
Preserves UVs, skin indices, joint names, identity child rest rotations and total height.
"""
import bpy,math,os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));ART=os.path.join(ROOT,'art');OUT=os.path.join(ROOT,'public','assets')
rig=bpy.data.objects['Nim'];body=bpy.data.objects['Nim • continuous game skin'];high=bpy.data.objects['SCULPT • Nim high detail bake source']
def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def transform(p,head_weight=0,arm_weight=0,hand_weight=0):
 q=p.copy()
 # Lankier forearm and longer expressive fingers, elbow pivot held in place.
 q.z-=.025*smooth(.81,.64,p.z)*arm_weight
 q.z+=(p.z-.64)*.10*hand_weight
 side=-1 if p.x<0 else 1
 q.x+=(p.x-side*.284)*.07*hand_weight
 # A slightly narrower full-body silhouette makes the limbs read as long.
 q.x*=.92;q.y*=.92
 # Raise/shrink the cranium to reveal the neck while retaining overall height.
 h=Vector((q.x*.9,q.y*.94,1.11+(q.z-1.11)*.85+.05))
 q=q*(1-head_weight)+h*head_weight
 return q

def point_weights(obj,vert):
 weights={obj.vertex_groups[g.group].name:g.weight for g in vert.groups}
 return weights.get('head',0),sum(v for k,v in weights.items() if k.startswith(('forearm.','hand.'))),sum(v for k,v in weights.items() if k.startswith('hand.'))

if rig.get('anatomy_version',2)<3:
 for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
 bpy.context.view_layer.update()
 for obj in list(bpy.context.scene.objects):
  if obj.type!='MESH':continue
  is_high=obj==high
  to_rig=obj.matrix_world if is_high else rig.matrix_world.inverted()@obj.matrix_world
  back=to_rig.inverted()
  eye_material=obj.data.materials[0].name if obj.data.materials else ''
  is_eyes=eye_material in ['Amber iris','Golden iris filaments','Obsidian pupils','Eye glints']
  for v in obj.data.vertices:
   p=to_rig@v.co
   if is_high:
    hw=smooth(1.055,1.15,p.z)
    aw=smooth(.17,.22,abs(p.x))*smooth(.85,.73,p.z) if p.z>.42 else 0
    hand=aw*smooth(.69,.59,p.z)
   else:hw,aw,hand=point_weights(obj,v)
   # Only ocular pieces are reduced; the nostrils in the pupil material are excluded.
   if is_eyes and p.z>1.215:
    side=-1 if p.x<0 else 1;center=Vector((side*.112,-.125,1.282+(side+1)*.006))
    p=center+Vector(((p.x-center.x)*.80,(p.y-center.y)*.88,(p.z-center.z)*.80))
   v.co=back@transform(p,hw,aw,hand)
  obj.data.update()
 # Reposition bind-joint pivots coherently; keep all child local rotations identity.
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
 for bone in rig.data.edit_bones:
  name=bone.name;p=bone.head.copy()
  hw=1 if name=='head' else 0
  arm=1 if name.startswith(('forearm.','hand.')) else 0
  hand=1 if name.startswith('hand.') else 0
  bone.head=transform(p,hw,arm,hand);bone.tail=bone.head+Vector((0,.1,0));bone.roll=0
 bpy.ops.object.mode_set(mode='OBJECT')
 rig['anatomy_version']=3
 rig['anatomy_note']='Narrower lanky silhouette, longer neck/forearms/fingers, smaller inset amber eyes; UVs and bone contract preserved.'
 bpy.context.view_layer.update()
# Preserve current weights, evaluate a representative full limb sweep, and reject stretched geometry.
rest=[v.co.copy() for v in body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
maxdelta=0
for step in range(17):
 phase=step*math.tau/16
 for label,sign in [('L',1),('R',-1)]:
  rig.pose.bones['arm.'+label].rotation_euler.x=math.sin(phase)*sign*.45
  rig.pose.bones['forearm.'+label].rotation_euler.x=-.25-abs(math.sin(phase))*.45
  rig.pose.bones['hand.'+label].rotation_euler.x=-.18
  rig.pose.bones['leg.'+label].rotation_euler.x=math.sin(phase)*sign*.3
  rig.pose.bones['shin.'+label].rotation_euler.x=-abs(math.sin(phase))*.35
 bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
 for i,v in enumerate(ev.data.vertices):
  delta=(v.co-rest[i]).length;maxdelta=max(maxdelta,delta)
  assert delta<.59,(step,i,delta)
  if body.data.vertices[i].co.z<.2:assert delta<.43,(step,'foot',i,delta)
for bone in rig.pose.bones:bone.rotation_euler=(0,0,0)
bpy.context.view_layer.update()
print('NIM_V3_VALIDATED_17_POSES',maxdelta)
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
