# Executed by build_assets.py after the primary shape pass.
# Unioning the skin removes primitive intersections and enables weighted deformation.
from mathutils import Matrix
bpy.context.scene.render.engine='CYCLES'
bpy.context.scene.cycles.samples=8
bpy.context.scene.cycles.use_denoising=False
bpy.context.view_layer.update()
all_parts=[o for o in bpy.context.scene.objects if o.type=='MESH']
source_parent={o.name:o.parent.name if o.parent else 'Nim' for o in all_parts}
for obj in all_parts:
    world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# All skin starts as one continuous volume, including neck, palms and toe pads.
skinparts=[o for o in all_parts if o.data.materials[0]==skin]
bpy.ops.object.select_all(action='DESELECT')
for obj in skinparts:obj.select_set(True)
bpy.context.view_layer.objects.active=skinparts[0];bpy.ops.object.join()
body=bpy.context.object;body.name='Nim • continuous game skin'
# Bake coordinates in world space for robust anatomical weights.
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
rem=body.modifiers.new('Sculptural volume union','REMESH');rem.mode='VOXEL';rem.voxel_size=.0028;rem.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Organic surface relaxation','SMOOTH');sm.factor=.82;sm.iterations=8
bpy.ops.object.modifier_apply(modifier=sm.name)
for p in body.data.polygons:p.use_smooth=True
# High source retains volume surface before game decimation and adds layered pore relief.
high=body.copy();high.data=body.data.copy();bpy.context.collection.objects.link(high);high.name='SCULPT • Nim high detail bake source'
bpy.context.view_layer.objects.active=high
sub=high.modifiers.new('Dense sculpt surface','SUBSURF');sub.levels=1;sub.render_levels=1
bpy.ops.object.modifier_apply(modifier=sub.name)
for name,scale,strength in [('Moss grain relief',.026,.0016),('Fine skin pores',.006,.0007)]:
    tex=bpy.data.textures.new(name,'CLOUDS');tex.noise_scale=scale;tex.noise_depth=2
    mod=high.modifiers.new(name,'DISPLACE');mod.texture=tex;mod.strength=strength;mod.mid_level=.5;mod.texture_coords='GLOBAL'
    bpy.ops.object.modifier_apply(modifier=mod.name)
# The face retains the shape, asymmetry and subtle mouth from the primary sculpt.
bpy.context.view_layer.objects.active=body
tri=sum(len(p.vertices)-2 for p in body.data.polygons)
dec=body.modifiers.new('Game topology budget','DECIMATE');dec.ratio=min(1,17800/tri);dec.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.018);bpy.ops.object.mode_set(mode='OBJECT')

# Author continuous 3D pigmentation on the high surface, then bake color + tangent normals.
highmat=mat('SCULPT • continuous moss pigmentation',(.25,.30,.14),.62)
nt=highmat.node_tree;p=nt.nodes.get('Principled BSDF')
coord=nt.nodes.new('ShaderNodeTexCoord')
noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=18;noise.inputs['Detail'].default_value=4;noise.inputs['Roughness'].default_value=.72
nt.links.new(coord.outputs['Generated'],noise.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position=.25;ramp.color_ramp.elements[0].color=(.055,.085,.025,1)
ramp.color_ramp.elements[1].position=.77;ramp.color_ramp.elements[1].color=(.30,.34,.12,1)
e=ramp.color_ramp.elements.new(.5);e.color=(.15,.20,.075,1)
nt.links.new(noise.outputs['Fac'],ramp.inputs['Fac']);nt.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
high.data.materials.clear();high.data.materials.append(highmat)
body.data.materials.clear();body.data.materials.append(skin)
normal=bpy.data.images.new('Nim baked sculpt normals',1024,1024,alpha=False);normal.colorspace_settings.name='Non-Color'
albedo=bpy.data.images.new('Nim baked moss albedo',1024,1024,alpha=False)
nt=skin.node_tree
for n in list(nt.nodes):
    if n.type=='TEX_IMAGE':nt.nodes.remove(n)
bake_node=nt.nodes.new('ShaderNodeTexImage');bake_node.image=normal;nt.nodes.active=bake_node
bpy.ops.object.select_all(action='DESELECT');high.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=body
bake=bpy.context.scene.render.bake;bake.use_selected_to_active=True;bake.cage_extrusion=.012;bake.max_ray_distance=.035;bake.margin=8
bpy.ops.object.bake(type='NORMAL')
normal.filepath_raw=os.path.join(ART,'nim-normal.png');normal.file_format='PNG';normal.save();normal.pack()
bake_node.image=albedo
bake.use_pass_direct=False;bake.use_pass_indirect=False;bake.use_pass_color=True
bpy.ops.object.bake(type='DIFFUSE')
albedo.filepath_raw=os.path.join(ART,'nim-albedo.png');albedo.file_format='PNG';albedo.save();albedo.pack()
bsdf=nt.nodes.get('Principled BSDF');nt.links.new(bake_node.outputs['Color'],bsdf.inputs['Base Color'])
nmap=nt.nodes.new('ShaderNodeTexImage');nmap.image=normal;nmap.label='Baked from high-detail sculpture'
normal_node=nt.nodes.new('ShaderNodeNormalMap');normal_node.inputs['Strength'].default_value=.65
nt.links.new(nmap.outputs['Color'],normal_node.inputs['Color']);nt.links.new(normal_node.outputs['Normal'],bsdf.inputs['Normal'])
high.hide_render=True;high.hide_set(True)
# Build joints whose local rotation rest pose is identity, preserving runtime gait API.
for o in list(bpy.context.scene.objects):
    if o.type=='EMPTY':bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
arm_data=bpy.data.armatures.new('Nim anatomical rig');rig=bpy.data.objects.new('Nim',arm_data);bpy.context.collection.objects.link(rig);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
pivots={'torso':((0,0,0),None),'head':((0,0,1.11),'torso')}
for s,label in [(-1,'L'),(1,'R')]:
    pivots['arm.'+label]=((s*.133,.006,1.004),'torso')
    pivots['forearm.'+label]=((s*.25,-.043,.785),'arm.'+label)
    pivots['hand.'+label]=((s*.284,-.162,.64),'forearm.'+label)
    pivots['leg.'+label]=((s*.081,.02,.633),'torso')
    pivots['shin.'+label]=((s*.139,-.042,.362),'leg.'+label)
for name,(pos,par) in pivots.items():
    bone=arm_data.edit_bones.new(name);bone.head=pos;bone.tail=Vector(pos)+Vector((0,.1,0))
    if par:bone.parent=arm_data.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def bind(obj,weights):
    world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world
    mod=obj.modifiers.new('Weighted organic deformation','ARMATURE');mod.object=rig
    groups={name:obj.vertex_groups.new(name=name) for name in pivots}
    for vert in obj.data.vertices:
        pos=obj.matrix_world@vert.co
        for name,value in weights(pos).items():
            if value>.0001:groups[name].add([vert.index],value,'REPLACE')
def skin_weights(pos):
    x,y,z=pos;side='L' if x<0 else 'R';ax=abs(x)
    head_weight=smooth(1.055,1.15,z)
    if head_weight>.001:return {'head':head_weight,'torso':1-head_weight}
    if z<.7:
        # Arms are outside body/leg region, including long lowered fingers.
        if ax>.206 and z>.42:
            hand=smooth(.69,.59,z);return {'hand.'+side:hand,'forearm.'+side:1-hand}
        leg=smooth(.70,.59,z);shin=smooth(.41,.31,z)
        return {'torso':1-leg,'leg.'+side:leg*(1-shin),'shin.'+side:leg*shin}
    if ax>.10:
        arm=smooth(.105,.19,ax)*smooth(1.11,.96,z)
        forearm=smooth(.84,.75,z)
        return {'torso':1-arm,'arm.'+side:arm*(1-forearm),'forearm.'+side:arm*forearm}
    return {'torso':1}
bind(body,skin_weights)
# Eyes, clothing and details follow anatomical pivots and remain reusable editable meshes.
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH' or obj in [body,high]:continue
    old_parent=source_parent.get(obj.name,'Nim')
    key=old_parent if old_parent in pivots else 'torso'
    bind(obj,lambda pos,key=key:{key:1})
# Consolidate rigid accessories by material; compatible skin modifiers share one skeleton.
groups={}
for obj in list(bpy.context.scene.objects):
    if obj.type=='MESH' and obj not in [body,high]:groups.setdefault(obj.data.materials[0].name,[]).append(obj)
for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    objects[0].name='Nim • '+name
rig.scale=(.972,.972,.972)
bpy.context.view_layer.update()
# Source contains the editable game rig AND hidden high-detail baking source.
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ART,'nim.blend'),compress=True)
export_objects=[o for o in bpy.context.scene.objects if o!=high and o.type in ['MESH','ARMATURE']]
bpy.ops.object.select_all(action='DESELECT')
for obj in export_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'nim.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_extras=True,export_animations=False)
# Mobile export preserves skeleton while reducing mesh and maps.
exec(compile(open(os.path.join(ART,'export_mobile.py')).read(),os.path.join(ART,'export_mobile.py'),'exec'))
# Inspect the actual weighted mesh and baked materials, with no compositing tricks.
world=bpy.context.scene.world;world.color=(.025,.045,.05)
def area(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,.8))-obj.location).to_track_quat('-Z','Y').to_euler()
area('warm key',(1.7,-2.4,3.1),220,(1,.75,.48),3)
area('teal rim',(-1.5,1,2.1),300,(.24,.85,1),2)
area('soft fill',(-1,-2,1.4),90,(.64,.8,1),2)
data=bpy.data.cameras.new('portrait');cam=bpy.data.objects.new('portrait',data);bpy.context.collection.objects.link(cam);cam.location=(2.4,-4.5,2);cam.rotation_euler=(Vector((0,0,.75))-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=1.85;bpy.context.scene.camera=cam
bpy.context.scene.cycles.samples=48
bpy.context.scene.render.resolution_x=700;bpy.context.scene.render.resolution_y=900;bpy.context.scene.render.resolution_percentage=100
bpy.context.scene.render.image_settings.file_format='PNG';bpy.context.scene.render.filepath=os.path.join(ART,'nim-preview.png')
bpy.ops.render.render(write_still=True)
# A second inspection image exercises continuous shoulder/knee skin deformation.
for name,angle in [('arm.L',-.3),('arm.R',.22),('forearm.L',-.55),('forearm.R',-.22),('leg.L',.22),('shin.L',-.25),('hand.L',-.18)]:
    rig.pose.bones[name].rotation_mode='XYZ';rig.pose.bones[name].rotation_euler.x=angle
rig.pose.bones['head'].rotation_mode='XYZ';rig.pose.bones['head'].rotation_euler.z=.08
bpy.context.scene.render.filepath=os.path.join(ART,'nim-pose-preview.png')
bpy.ops.render.render(write_still=True)
print('NIM_SCULPT_BAKE_RIG_COMPLETE')
