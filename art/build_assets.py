"""OTHERSELF original procedural sculpture, authored for Kikkey Games.
Run: blender --background --python art/build_assets.py
Blender coordinates: Z-up; face -Y. glTF: Y-up, face +Z.
"""
import bpy, math, random, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART=os.path.join(ROOT,'art'); OUT=os.path.join(ROOT,'public','assets')
os.makedirs(ART,exist_ok=True);os.makedirs(OUT,exist_ok=True)
random.seed(23)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

# Local skin source texture. Deliberate layered moss pigmentation, no downloaded assets.
W=512
im=bpy.data.images.new('Nim moss pigmentation',W,W,alpha=False)
spots=[(random.random(),random.random(),random.uniform(.012,.07)) for _ in range(100)]
pixels=[]
for y in range(W):
    v=y/W
    for x in range(W):
        u=x/W
        wave=(math.sin(u*91+math.sin(v*53)*2)+math.sin(v*113+u*32))*.014
        fleck=random.random()*.022
        blot=max([max(0,1-((min(abs(u-a),1-abs(u-a))/.8)**2+(v-b)**2)/r**2) for a,b,r in spots]+[0])
        t=blot*.11
        pixels.extend((.255+t+wave+fleck,.318+t*.8+wave+fleck,.185+t*.45+wave*.6+fleck,1))
im.pixels=pixels; im.filepath_raw=os.path.join(ART,'nim_skin.png');im.file_format='PNG';im.save();im.pack()

def mat(name,col,rough=.6,metal=0,texture=None):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if texture:
        n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=texture;m.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color'])
    return m
skin=mat('Moss skin • painted pigmentation',(.29,.35,.20),.56,texture=im)
lip=mat('Warm skin creases',(.19,.23,.12),.65)
black=mat('Obsidian pupils',(.008,.013,.009),.2)
amber=mat('Amber iris',(.94,.39,.035),.23)
iris=mat('Golden iris filaments',(.47,.19,.015),.32)
shine=mat('Eye glints',(.96,.91,.72),.12)
cape=mat('Graphite weathercloth',(.055,.074,.075),.92)
capeEdge=mat('Worn mantle binding',(.105,.127,.115),.85)
scarf=mat('Rust woven scarf',(.39,.095,.045),.91)
thread=mat('Scarf woven seam',(.61,.22,.08),.86)
leather=mat('Leather straps',(.12,.075,.035),.84)
brass=mat('Patinated brass',(.39,.27,.09),.4,.65)

def parent(name,loc=(0,0,0),par=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc
    if par:o.parent=par
    bpy.context.view_layer.update()
    return o
root=parent('Nim')

def finish(o,name,material,par=root):
    o.name=name;o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=True
    if par:
        bpy.context.view_layer.update()
        world=o.matrix_world.copy();o.parent=par;o.matrix_world=world
        bpy.context.view_layer.update()
    return o

def egg(name,loc,scale,material=skin,par=root,seg=24,rings=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc)
    o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,par)

def tube(name,points,radii,material=skin,par=root,sides=10):
    vs=[];fs=[]
    for i,p in enumerate(points):
        p=Vector(p);d=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
        d.normalize();n=d.cross(Vector((0,1,0)))
        if n.length<.01:n=d.cross(Vector((1,0,0)))
        n.normalize();b=d.cross(n).normalized()
        for j in range(sides):
            a=j/sides*math.tau;r=radii[i]
            vs.append(p+(n*math.cos(a)+b*math.sin(a))*r)
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j;c=i*sides+(j+1)%sides;fs.append((a,c,c+sides,a+sides))
    fs.append(tuple(reversed(range(sides))));fs.append(tuple((len(points)-1)*sides+j for j in range(sides)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    uv=mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vi=mesh.loops[li].vertex_index;uv.data[li].uv=(vi%sides/sides,vi//sides/max(1,len(points)-1))
    return finish(o,name,material,par)

# The body is narrow and nonhuman, with a long pear-shaped cranium and sinewy limbs.
egg('torso', (0,.012,.86),(.145,.09,.235),seg=28,rings=18)
egg('pelvis', (0,.018,.632),(.122,.087,.11))
egg('sternum', (0,-.061,.902),(.082,.027,.115),seg=20,rings=12)
tube('neck',[(0,.018,1.025),(0,.012,1.1),(0,-.005,1.15)],[.057,.047,.063],sides=16)
head=parent('head',(0,0,1.13),root)
skull=egg('asymmetric cranium',(-.012,.005,1.285),(.157,.13,.207),par=head,seg=40,rings=24)
for v in skull.data.vertices:
    z=v.co.z/.207
    v.co.x += .016*(z*z)-.006*math.sin(z*4)
    v.co.y += .008*math.sin(z*5+v.co.x*4)
egg('soft jaw',(0,-.068,1.145),(.112,.09,.063),par=head,seg=28,rings=16)
# Rounded amber eyes: no sclera, no human brow ridges.
for s in [-1,1]:
    ex=s*.112;eyeZ=1.282+(s+1)*.006
    egg('eye socket.'+str(s),(ex,-.082,eyeZ),(.096,.065,.101),skin,head,28,18)
    egg('amber eye.'+str(s),(ex,-.125,eyeZ),(.078,.047,.085),amber,head,32,20)
    egg('pupil.'+str(s),(ex+s*.01,-.169,eyeZ+.002),(.032,.008,.032),black,head,24,16)
    egg('eye glint.'+str(s),(ex-.017,-.175,eyeZ+.031),(.01,.003,.012),shine,head,16,10)
    for i in range(18):
        a=i/18*math.tau
        p0=(ex+math.cos(a)*.036,-.171+abs(math.cos(a))*.008,eyeZ+math.sin(a)*.045)
        p1=(ex+math.cos(a)*.065,-.158+abs(math.cos(a))*.005,eyeZ+math.sin(a)*.072)
        tube('iris radial', [p0,p1],[.0013,.0007],iris,head,sides=4)
    pts=[(ex+math.cos(a)*.081,-.137+math.sin(a)*.006,eyeZ+math.sin(a)*.086) for a in [i/20*math.tau for i in range(21)]]
    tube('soft eyelid',pts,[.006]*21,skin,head,sides=6)
for s in [-1,1]:
    egg('nostril', (s*.022,-.147,1.194),(.009,.004,.013),black,head,16,10)
pts=[]
for i in range(11):
    x=-.083+i*.0166;z=1.133+.005*math.cos((i-5)/5*math.pi)
    y=-.068-.09*math.sqrt(max(.01,1-(x/.112)**2-((z-1.145)/.063)**2))-.0015
    pts.append((x,y,z))
tube('mouth crease',pts,[.003]*11,lip,head,sides=6)
tube('lower lip',[(x,y-.001,z-.007) for x,y,z in pts],[.0035]*11,skin,head,sides=6)
# Organic shallow cheek folds, conspicuously no ears or eyebrows.
for s in [-1,1]:
    tube('jaw crease',[(s*.085,-.126,1.174),(s*.104,-.111,1.16),(s*.098,-.112,1.139)],[.0025,.002,.0008],lip,head,6)

for s,label in [(-1,'L'),(1,'R')]:
    arm=parent('arm.'+label,(s*.133,.006,1.004),root)
    egg('deltoid.'+label,(s*.126,.008,1.006),(.075,.066,.079),par=arm,seg=24,rings=14)
    tube('upper arm.'+label,[(s*.128,.006,1.005),(s*.19,-.001,.938),(s*.224,-.018,.848),(s*.25,-.043,.785)],[.059,.045,.031,.029],par=arm,sides=14)
    egg('elbow.'+label,(s*.25,-.043,.785),(.032,.029,.034),par=arm,seg=16,rings=12)
    tube('forearm.'+label,[(s*.25,-.043,.785),(s*.269,-.086,.724),(s*.285,-.13,.671),(s*.284,-.162,.64)],[.032,.036,.025,.019],par=arm,sides=12)
    egg('hand.'+label,(s*.285,-.174,.606),(.038,.027,.054),par=arm,seg=20,rings=12)
    for f in range(4):
        xx=s*(.259+f*.018)
        zz=.584+(abs(f-1.3))*.003
        length=.108 if f in [1,2] else .087
        tube('finger'+str(f)+'.'+label,[(xx,-.18,zz),(xx+s*.004,-.192,zz-length*.48),(xx+s*.005,-.213,zz-length*.86),(xx,-.216,zz-length)],[.008,.009,.006,.0035],par=arm,sides=8)
        egg('knuckle', (xx+s*.004,-.192,zz-length*.48),(.009,.009,.01),par=arm,seg=12,rings=8)
    tube('thumb.'+label,[(s*.261,-.18,.624),(s*.234,-.202,.602),(s*.233,-.222,.575)],[.012,.01,.004],par=arm,sides=8)
    leg=parent('leg.'+label,(s*.081,.02,.633),root)
    tube('thigh.'+label,[(s*.081,.02,.633),(s*.105,.012,.55),(s*.13,-.016,.442),(s*.139,-.042,.362)],[.064,.061,.044,.036],par=leg,sides=16)
    egg('kneecap.'+label,(s*.139,-.047,.363),(.036,.027,.042),par=leg,seg=20,rings=12)
    tube('shin.'+label,[(s*.139,-.032,.354),(s*.147,.009,.257),(s*.147,.027,.151),(s*.148,.008,.065)],[.031,.044,.026,.02],par=leg,sides=14)
    egg('heel.'+label,(s*.148,-.016,.056),(.04,.067,.043),par=leg,seg=20,rings=12)
    egg('foot.'+label,(s*.148,-.073,.04),(.063,.09,.031),par=leg,seg=24,rings=12)
    for t in range(4):
        xx=s*(.107+t*.026)
        length=.10-abs(t-1)*.012
        tube('toe'+str(t)+'.'+label,[(xx,-.095,.039),(xx+s*.005,-.13,.032),(xx+s*.006,-.1-length,.026)],[.014,.015,.01],par=leg,sides=10)
        egg('toe pad',(xx+s*.006,-.1-length,.026),(.015,.02,.012),par=leg,seg=12,rings=8)
# Short graphite mantle, authored as a draped quad surface with visible seam.
verts=[];faces=[];N=24;M=9
for k in range(M):
    f=k/(M-1)
    for j in range(N+1):
        a=-.12+j/N*(math.pi+.24)
        r=.115+f*.065
        x=math.cos(a)*r*(1+.04*math.sin(j*2))
        y=math.sin(a)*r*.8+.04
        z=1.032-f*.37+.012*math.cos(j*2)*(f*f)
        verts.append((x,y,z))
for k in range(M-1):
    for j in range(N):
        q=k*(N+1)+j;faces.append((q,q+1,q+N+2,q+N+1))
mesh=bpy.data.meshes.new('mantle drape');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('graphite mantle',mesh);bpy.context.collection.objects.link(o);finish(o,'graphite mantle',cape)
sol=o.modifiers.new('cloth thickness','SOLIDIFY');sol.thickness=.004
bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
tube('mantle hem',verts[-N-1:],[.003]*(N+1),capeEdge,sides=6)
for j in [0,N//2,N]:
    tube('mantle seam',[verts[k*(N+1)+j] for k in range(M)],[.0018]*M,capeEdge,sides=5)
# Rust scarf wraps the neck without a human collar; tail hangs over front.
for h in [0,.013]:
    pts=[(.069*math.cos(i/32*math.tau),.005+.061*math.sin(i/32*math.tau),1.06+h+.006*math.cos(i/32*math.tau*3)) for i in range(33)]
    tube('rust scarf wrap',pts,[.015]*33,scarf,sides=10)
vs=[];fs=[]
for i in range(9):
    z=1.059-i*.026;x=.045+i*.004;y=-.066-i*.003+.008*math.sin(i*.7)
    vs.extend([(x-.022,y,z),(x+.024,y,z+.004)])
for i in range(8):q=i*2;fs.append((q,q+1,q+3,q+2))
me=bpy.data.meshes.new('scarf tail');me.from_pydata(vs,[],fs);me.update();ob=bpy.data.objects.new('scarf tail',me);bpy.context.collection.objects.link(ob);finish(ob,'scarf tail',scarf)
for i in range(0,8):
    a=vs[i*2];b=vs[i*2+1];tube('woven scarf stitch',[a,b],[.0014,.0014],thread,sides=4)
for i in range(6):
    x=.053+i*.008;tube('scarf fringe',[(x,-.09,.852),(x+.004,-.09,.826-random.random()*.006)],[.0018,.001],thread,sides=5)
# Thin waist belt and side pouch.
pts=[(.124*math.cos(i/32*math.tau),.017+.088*math.sin(i/32*math.tau),.668) for i in range(33)]
tube('waist strap',pts,[.012]*33,leather,sides=6)
egg('small weather pouch',(-.13,.013,.632),(.039,.045,.052),leather,root,20,12)
egg('pouch clasp',(-.15,-.02,.64),(.009,.005,.012),brass,root,12,8)


# Continuous sculpture, UV baking, weighted rig and optimized exports.
exec(compile(open(os.path.join(ART,'refine_nim.py')).read(), os.path.join(ART,'refine_nim.py'), 'exec'))
