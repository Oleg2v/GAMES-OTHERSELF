"""Repair/revalidate source weights and export without repeating the texture bake.
Usage: blender --background art/nim.blend --python art/rebind_and_validate.py
"""
import bpy,os,math
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));ART=os.path.join(ROOT,'art');OUT=os.path.join(ROOT,'public','assets')
source=open(os.path.join(ART,'refine_nim.py')).read()
exec(source[source.index('def smooth('):source.index('bind(body,skin_weights)')])
rig=bpy.data.objects['Nim'];body=bpy.data.objects['Nim • continuous game skin'];high=bpy.data.objects['SCULPT • Nim high detail bake source']
for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
bpy.context.view_layer.update()
body.vertex_groups.clear()
groups={name:body.vertex_groups.new(name=name) for name in rig.data.bones.keys()}
to_rig=rig.matrix_world.inverted()@body.matrix_world
for vert in body.data.vertices:
    pos=to_rig@vert.co
    weights=skin_weights(pos)
    assert abs(sum(weights.values())-1)<1e-6
    if pos.z<.2:assert all(name.startswith(('shin.','leg.','torso')) for name,v in weights.items() if v>0)
    for name,value in weights.items():
        if value>.0001:groups[name].add([vert.index],value,'REPLACE')
# Evaluate many gait/gesture positions and verify feet never follow hand bones.
bpy.context.view_layer.update();rest=[v.co.copy() for v in body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
max_delta=0
for step in range(17):
    phase=step*math.tau/16
    for label,sign in [('L',1),('R',-1)]:
        rig.pose.bones['arm.'+label].rotation_euler.x=math.sin(phase)*sign*.45
        rig.pose.bones['forearm.'+label].rotation_euler.x=-.25-abs(math.sin(phase))*.45
        rig.pose.bones['hand.'+label].rotation_euler.x=-.18
        rig.pose.bones['leg.'+label].rotation_euler.x=math.sin(phase)*sign*.3
        rig.pose.bones['shin.'+label].rotation_euler.x=-abs(math.sin(phase))*.35
    bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    for i,vertex in enumerate(ev.data.vertices):
        distance=(vertex.co-rest[i]).length;max_delta=max(max_delta,distance)
        assert distance<.55,(step,i,distance)
        if body.data.vertices[i].co.z<.2:assert distance<.43,(step,'foot',i,distance)
for bone in rig.pose.bones:bone.rotation_euler=(0,0,0)
bpy.context.view_layer.update()
print('RIG_VALIDATED: 17 walking/gesture poses; max displacement',max_delta)
# Keep the eye pupils circular in the face plane; nostril components remain untouched.
pupils=bpy.data.objects.get('Nim • Obsidian pupils')
if pupils:
    adjacency={i:set() for i in range(len(pupils.data.vertices))}
    for edge in pupils.data.edges:
        a,b=edge.vertices;adjacency[a].add(b);adjacency[b].add(a)
    pending=set(adjacency)
    to_rig=rig.matrix_world.inverted()@pupils.matrix_world;from_rig=to_rig.inverted()
    while pending:
        seed=pending.pop();component={seed};stack=[seed]
        while stack:
            for other in adjacency[stack.pop()]:
                if other in pending:pending.remove(other);component.add(other);stack.append(other)
        coords=[to_rig@pupils.data.vertices[i].co for i in component]
        lo=Vector(tuple(min(p[k] for p in coords) for k in range(3)));hi=Vector(tuple(max(p[k] for p in coords) for k in range(3)))
        if hi.x-lo.x>.04 and hi.z-lo.z>.04:
            center=(lo+hi)/2
            for i,p in zip(component,coords):
                p.x=center.x+(p.x-center.x)*.064/(hi.x-lo.x);p.z=center.z+(p.z-center.z)*.064/(hi.z-lo.z)
                pupils.data.vertices[i].co=from_rig@p
export_objects=[o for o in bpy.context.scene.objects if o!=high and o.type in ['MESH','ARMATURE']]
bpy.ops.object.select_all(action='DESELECT')
for obj in export_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'nim.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_extras=True,export_animations=False)
exec(compile(open(os.path.join(ART,'export_mobile.py')).read(),os.path.join(ART,'export_mobile.py'),'exec'))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ART,'nim.blend'),compress=True)
exec(compile(source[source.index('# Inspect the actual weighted mesh'):],os.path.join(ART,'refine_nim.py'),'exec'))
