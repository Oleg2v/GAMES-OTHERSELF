"""Export lower topology and 512px baked maps using the same weighted Nim rig.
Called from refine_nim.py; may also run on art/nim.blend after loading it.
"""
import bpy,os
_mobile_root=os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if '__file__' in globals() else '/workspace/GAMES-OTHERSELF'
# build_assets.py's __file__ remains within art, so the same root applies.
_mobile_art=os.path.join(_mobile_root,'art');_mobile_out=os.path.join(_mobile_root,'public','assets')
_mobile_objects=[o for o in bpy.context.scene.objects if o.type in ['MESH','ARMATURE'] and not o.name.startswith('SCULPT')]
bpy.ops.object.select_all(action='DESELECT')
for _o in _mobile_objects:_o.select_set(True)
_mobile_material=bpy.data.materials['Moss skin • painted pigmentation']
_mobile_restore=[]
for _node in _mobile_material.node_tree.nodes:
    if _node.type=='TEX_IMAGE' and _node.image:
        _original=_node.image;_small=_original.copy();_small.name=_original.name+' mobile 512';_small.scale(512,512)
        _stem='nim-normal-low.png' if 'normal' in _original.name.lower() else 'nim-albedo-low.png'
        _small.filepath_raw=os.path.join(_mobile_art,_stem);_small.file_format='PNG';_small.save();_small.pack()
        _mobile_restore.append((_node,_original));_node.image=_small
_mobile_modifiers=[]
for _o in _mobile_objects:
    if _o.type=='MESH':
        _mod=_o.modifiers.new('Mobile triangle budget','DECIMATE');_mod.ratio=.34;_mod.use_collapse_triangulate=True
        _mobile_modifiers.append((_o,_mod))
bpy.ops.export_scene.gltf(filepath=os.path.join(_mobile_out,'nim-low.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_animations=False)
for _o,_mod in _mobile_modifiers:_o.modifiers.remove(_mod)
for _node,_original in _mobile_restore:_node.image=_original
