"""Original deterministic, seamless PBR materials for OTHERSELF.
No source imagery, downloads, or random runtime texture generation.
Run with Python 3 + NumPy + Pillow from any directory.
"""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets/textures/v2'; SOURCE=ROOT/'art/materials-v2'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
MANIFEST={}
def field(n,frequency,seed,anisotropy=1):
    rng=np.random.default_rng(seed)
    noise=rng.normal(size=(n,n));fy=np.fft.fftfreq(n)*n;fx=np.fft.fftfreq(n)*n
    filt=np.exp(-((fy[:,None]*anisotropy)**2+fx[None,:]**2)/frequency**2)
    out=np.fft.ifft2(np.fft.fft2(noise)*filt).real
    return np.clip(.5+out/(out.std()*5.5),0,1)
def coord(n):
    v,u=np.mgrid[0:n,0:n]/n;return u,v

def smoothstep(a,b,x):
    q=np.clip((x-a)/(b-a),0,1);return q*q*(3-2*q)
def lerp(a,b,t):return a*(1-t[...,None])+np.asarray(b)*t[...,None]
def circular_dist(a,b):return np.abs((a-b+.5)%1-.5)
def periodic_line(n,points,width):
    im=Image.new('L',(n,n));d=ImageDraw.Draw(im)
    for ox in [-n,0,n]:
        for oy in [-n,0,n]:
            d.line([(int(x*n)+ox,int(y*n)+oy) for x,y in points],fill=255,width=width,joint='curve')
    return np.asarray(im,dtype=float)/255

def save_material(name,color,height,roughness,tile_meters,metalness,description,normal_strength=1):
    n=height.shape[0]
    # Central periodic derivatives; green channel is OpenGL +Y tangent-space normal.
    gx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*n/(2*tile_meters)*normal_strength
    gy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*n/(2*tile_meters)*normal_strength
    norm=np.dstack((-gx,gy,np.ones_like(gx)));norm/=np.linalg.norm(norm,axis=2)[...,None]
    normal=np.round((norm*.5+.5)*255).astype(np.uint8)
    passes={}
    if color is not None:
        passes['albedo']=Image.fromarray(np.clip(color,0,255).astype(np.uint8),'RGB')
    passes['normal']=Image.fromarray(normal,'RGB')
    passes['roughness']=Image.fromarray(np.clip(roughness*255,0,255).astype(np.uint8),'L')
    for kind,im in passes.items():
        im.save(OUT/f'{name}-{kind}.webp',lossless=(kind=='normal'),quality=95 if kind=='normal' else 88,method=6)
    # Retain uncompressed authoring maps outside public build.
    source_height=(height-height.min())/max(1e-9,height.max()-height.min())
    Image.fromarray(np.round(source_height*65535).astype(np.uint16)).save(SOURCE/f'{name}-height.png')
    for kind,im in passes.items():im.save(SOURCE/f'{name}-{kind}.png',optimize=True)
    MANIFEST[name]={'resolution':n,'tileMeters':tile_meters,'metalness':metalness,'roughnessMultiplier':1,'normalScale':.35 if name=='glass-grime' else .65 if name=='teal-panel' else .8,'description':description,'maps':{kind:f'assets/textures/v2/{name}-{kind}.webp' for kind in passes},'bytes':{kind:(OUT/f'{name}-{kind}.webp').stat().st_size for kind in passes}}

# 1. Rounded bolted access panels: coherent edge wear, large oxidized streaks.
n=1024;u,v=coord(n);broad=field(n,3,741);mid=field(n,17,743);fine=field(n,125,747)
edge=np.minimum.reduce([u,1-u,v,1-v]);seam=1-smoothstep(.0015,.006,edge)
edge_wear=(1-smoothstep(.012,.085,edge))*(.3+.7*mid)
chips=smoothstep(.57,.72,.6*mid+.3*broad+edge_wear*.42)
color=np.zeros((n,n,3))+np.array([91,128,120]);color*= (.83+.33*broad+.035*(fine-.5))[...,None]
color=lerp(color,[66,66,51],chips*.7)
rust=smoothstep(.30,.70,chips)*smoothstep(.31,.72,mid)
color=lerp(color,[121,72,39],rust*.64)
# Broad water runs, not tiny speckles.
streak=field(n,25,759,anisotropy=10)*(.35+.65*broad)
color*= (1-.12*streak)[...,None]
color=lerp(color,[23,38,37],seam*.82)
height=.00045*(mid-.5)+.00013*(fine-.5)-seam*.003-chips*.0009
rough=.62+.14*mid+.08*chips-.12*streak
# Slightly raised rivets, with chipped paint collars and a narrow screwdriver notch.
for cx in [.032,.5,.968]:
    for cy in [.032,.968]:
        dx=circular_dist(u,cx);dy=circular_dist(v,cy);r=np.sqrt(dx*dx+dy*dy)
        collar=1-smoothstep(.009,.013,r);cap=1-smoothstep(.0065,.009,r)
        color=lerp(color,[57,72,65],collar*.8)
        color=lerp(color,[153,159,132],cap*.84)
        dome=np.sqrt(np.maximum(0,1-(r/.009)**2))*.0033
        height+=dome
        slit=(1-smoothstep(.0007,.0016,dy))*(1-smoothstep(.004,.006,dx))*cap
        height-=slit*.0008;color=lerp(color,[45,51,43],slit*.7)
        rough=rough*(1-cap)+(.36+.08*mid)*cap
# Sparse long scratches, restrained relative to panel seams.
for i in range(11):
    rng=np.random.default_rng(800+i);x,y=rng.uniform(.08,.85,2);length=rng.uniform(.035,.14)
    scratch=periodic_line(n,[(x,y),(x+length,y+.003),(x+length+.008,y+.005)],1)
    color=lerp(color,[152,163,141],scratch*.35);height-=scratch*.00025
save_material('teal-panel',color,height,np.clip(rough,.25,.92),1.5,.32,'Painted teal access plate with rivets, peeled edge bands, restrained rust and water runs.')

# 2. Wet copper/steel tread plate: raised diagonal lozenges and readable bolted seams.
n=1024;u,v=coord(n);broad=field(n,3,845);mid=field(n,16,849);fine=field(n,140,851)
color=np.zeros((n,n,3))+np.array([112,101,76]);color*=(.80+.30*broad+.035*(fine-.5))[...,None]
edge=np.minimum.reduce([u,1-u,v,1-v]);seam=1-smoothstep(.001,.0045,edge)
height=.00015*(fine-.5)-.003*seam;rough=.56+.18*mid
# Four offset rows/columns of narrow raised safety bars. Each period is exact.
bar=np.zeros((n,n));ridge=np.zeros((n,n))
for row in range(6):
    for col in range(6):
        cx=(col+.25+.5*(row%2))/6;cy=(row+.5)/6
        dx=(u-cx+.5)%1-.5;dy=(v-cy+.5)%1-.5
        a=(dx+dy)/math.sqrt(2);b=(dy-dx)/math.sqrt(2)
        dist=np.sqrt((a/.043)**2+(b/.009)**2)
        mask=1-smoothstep(.75,1,dist);bar=np.maximum(bar,mask)
        ridge=np.maximum(ridge,np.sqrt(np.maximum(0,1-dist**2))*.0038)
height+=ridge
color=lerp(color,[152,142,109],bar*.6)
# Rain-darkened wear islands make the floor feel wet without painting highlights.
puddle=smoothstep(.48,.72,broad*.7+mid*.3)
color*= (1-.16*puddle)[...,None];rough-=.23*puddle
color=lerp(color,[35,41,36],seam*.85)
for cx in [.035,.965]:
    for cy in [.035,.965]:
        dx=circular_dist(u,cx);dy=circular_dist(v,cy);r=np.sqrt(dx*dx+dy*dy)
        cap=1-smoothstep(.008,.011,r);height+=np.sqrt(np.maximum(0,1-(r/.01)**2))*.0028
        color=lerp(color,[149,144,118],cap*.85);rough=rough*(1-cap)+cap*.38
save_material('copper-tread',color,height,np.clip(rough,.24,.9),1.5,.72,'Bolted raised safety tread with bronze oxidation and broad damp wear. Use on solid walkways; it does not fake open grate holes.')

# 3. Damp mineral structure: broad efflorescence, old hairline fractures and moss.
n=512;u,v=coord(n);broad=field(n,3,923);mid=field(n,18,927);fine=field(n,115,929)
color=np.zeros((n,n,3))+np.array([119,127,116]);color*=(.77+.4*broad+.035*(fine-.5))[...,None]
mineral=smoothstep(.57,.77,broad*.75+mid*.25);color=lerp(color,[161,162,140],mineral*.32)
moss=smoothstep(.51,.76,field(n,8,935))*(1-smoothstep(.25,.65,broad))
color=lerp(color,[58,75,46],moss*.55)
height=.0021*(broad-.5)+.0007*(mid-.5)+.00013*(fine-.5)
crack=periodic_line(n,[(-.05,.57),(.12,.52),(.22,.56),(.35,.49),(.47,.51),(.56,.44),(.64,.48),(.75,.40),(1.05,.44)],1)
crack+=periodic_line(n,[(.35,.49),(.33,.61),(.38,.70)],1);crack=np.clip(crack,0,1)
color=lerp(color,[48,58,49],crack*.65);height-=crack*.0015
rough=.85-.13*broad+.05*mid
save_material('wet-concrete',color,height,np.clip(rough,.62,.98),2,0,'Weathered mineral wall with broad damp patches, faint mineral bloom, sparse cracks and moss.')

# 4. Broad waxy greenhouse leaf with coherent midrib and arching secondary veins.
n=512;u,v=coord(n);broad=field(n,4,1011);fine=field(n,110,1013)
# Tile-safe midribs at U=.5; long direction V. Useful on thin custom leaf meshes.
dx=np.abs(u-.5);center=1-smoothstep(.007,.022,dx)
height=.00035*(broad-.5);color=np.zeros((n,n,3))+np.array([68,109,67]);color*=(.83+.26*broad+.03*(fine-.5))[...,None]
veins=np.zeros((n,n))
for j in range(-1,9):
    # Parallel diagonals form flowing secondary venation, symmetrical about midrib.
    curve=(v-(j/8+.45*dx+.08*np.sin(dx*math.pi*2))+.5)%1-.5
    vein=np.exp(-(curve/.004)**2)*smoothstep(.015,.045,dx)*(1-smoothstep(.39,.49,dx))
    veins=np.maximum(veins,vein)
height+=center*.0019+veins*.00065
color=lerp(color,[118,146,79],center*.65+veins*.3)
edge=smoothstep(.40,.49,dx);color=lerp(color,[47,79,46],edge*.38)
rough=.43+.10*broad+.06*veins
save_material('leaf',color,height,rough,.6,.02,'Waxy jade leaf, continuous central rib and arching side veins. V follows leaf length; U follows width.')

# 5. Condensation and grime affect glass roughness/normal, without opaque painted dirt.
n=512;u,v=coord(n);broad=field(n,3,1111);mid=field(n,18,1117);runs=field(n,45,1123,anisotropy=12)
height=.000025*(mid-.5);rough=.10+.18*broad+.18*runs
for i in range(58):
    rng=np.random.default_rng(1200+i);cx,cy=rng.random(2);rx=rng.uniform(.002,.008);ry=rx*rng.uniform(1.3,3.5)
    dx=circular_dist(u,cx)/rx;dy=circular_dist(v,cy)/ry;r2=dx*dx+dy*dy
    bead=np.maximum(0,1-r2);height+=bead**.75*.00016
    rough-=bead*.10
save_material('glass-grime',None,height,np.clip(rough,.07,.56),1.8,0,'Thin condensation beads and vertical grime film. Use maps on existing transparent glass, not opaque albedo.',normal_strength=1)

MANIFEST['_integration']={'albedoColorSpace':'SRGBColorSpace','dataColorSpace':'NoColorSpace','normalConvention':'OpenGL (+Y)','wrap':'RepeatWrapping','note':'Colored albedo maps need a white or pale material color. Avoid multiplying by a second dark teal. Set roughness=1 with roughnessMap; the maps already contain authored roughness. Teal paint metalness is lower than exposed floor metal.'}
(OUT/'manifest.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2)+'\n')
# A reproducible readable inspection sheet of original texture data, no source photo edits.
labels=[k for k in MANIFEST if not k.startswith('_')];cols=3;tile=256;pad=18;header=44
sheet=Image.new('RGB',(cols*(tile+pad)+pad,len(labels)*(tile+header)+pad),(18,27,28));d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
for row,name in enumerate(labels):
    for col,kind in enumerate(['albedo','normal','roughness']):
        x=pad+col*(tile+pad);y=pad+row*(tile+header)
        d.text((x,y),f'{name} / {kind}',fill=(214,213,187),font=font)
        p=SOURCE/f'{name}-{kind}.png'
        if p.exists():sheet.paste(Image.open(p).convert('RGB').resize((tile,tile),Image.Resampling.LANCZOS),(x,y+28))
sheet.save(SOURCE/'contact-sheet.jpg',quality=92)
print(json.dumps({k:v.get('bytes') for k,v in MANIFEST.items() if not k.startswith('_')},indent=2))
print('TOTAL_PUBLIC_BYTES',sum(p.stat().st_size for p in OUT.glob('*.webp')))
