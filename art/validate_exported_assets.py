"""Validate the actual shipped high/mobile GLB skins through representative gestures.
Uses glTF joint matrices and inverse bind matrices, not Blender source assumptions.
"""
from pathlib import Path
import json,struct,math
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
DTYPE={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(path):
 raw=path.read_bytes();assert raw[:4]==b'glTF';n,kind=struct.unpack_from('<II',raw,12);g=json.loads(raw[20:20+n]);off=20+n;n,kind=struct.unpack_from('<II',raw,off);return g,raw[off+8:off+8+n]
def data(g,b,index):
 a=g['accessors'][index];v=g['bufferViews'][a['bufferView']];dt=np.dtype(DTYPE[a['componentType']]);w=WIDTH[a['type']];stride=v.get('byteStride',w*dt.itemsize);start=v.get('byteOffset',0)+a.get('byteOffset',0)
 x=np.ndarray((a['count'],w),dtype=dt,buffer=b,offset=start,strides=(stride,dt.itemsize)).copy()
 if a.get('normalized') and np.issubdtype(dt,np.integer):x=x.astype(float)/np.iinfo(dt).max
 return x
def transform(n,rx=None):
 if 'matrix'in n:return np.array(n['matrix']).reshape(4,4).T
 t=n.get('translation',[0,0,0]);s=n.get('scale',[1,1,1]);q=n.get('rotation',[0,0,0,1])
 if rx is not None:q=[math.sin(rx/2),0,0,math.cos(rx/2)]
 x,y,z,w=q;rot=np.array([[1-2*y*y-2*z*z,2*x*y-2*z*w,2*x*z+2*y*w],[2*x*y+2*z*w,1-2*x*x-2*z*z,2*y*z-2*x*w],[2*x*z-2*y*w,2*y*z+2*x*w,1-2*x*x-2*y*y]])
 m=np.eye(4);m[:3,:3]=rot@np.diag(s);m[:3,3]=t;return m
def world(g,pose):
 parents={child:i for i,n in enumerate(g['nodes']) for child in n.get('children',[])};cache={}
 def visit(i):
  if i not in cache:
   m=transform(g['nodes'][i],pose.get(g['nodes'][i].get('name')));cache[i]=visit(parents[i])@m if i in parents else m
  return cache[i]
 for i in range(len(g['nodes'])):visit(i)
 return cache
for filename in ['nim.glb','nim-low.glb']:
 g,b=load(ROOT/'public/assets'/filename);skin=g['skins'][0];assert len(skin['joints'])==12
 inverses=[data(g,b,s['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1) for s in g['skins']]
 samples=[]
 for node in g['nodes']:
  if 'skin'not in node:continue
  for p in g['meshes'][node['mesh']]['primitives']:
   attrs=p['attributes'];pos=data(g,b,attrs['POSITION']);joints=data(g,b,attrs['JOINTS_0']).astype(int);weights=data(g,b,attrs['WEIGHTS_0'])
   assert np.max(np.abs(weights.sum(axis=1)-1))<1e-4
   samples.append((np.c_[pos,np.ones(len(pos))],joints,weights,node['skin']))
 def evaluate(pose):
  ws=world(g,pose);palettes=[np.array([ws[i]@inverses[k][j] for j,i in enumerate(s['joints'])]) for k,s in enumerate(g['skins'])];result=[]
  for pos,joints,weights,skin_index in samples:
   matrices=palettes[skin_index]
   moved=np.einsum('nvij,nj->nvi',matrices[joints],pos)
   result.append(np.sum(moved*weights[:,:,None],axis=1)[:,:3])
  return np.concatenate(result)
 rest=evaluate({});bounds=np.array([rest.min(axis=0),rest.max(axis=0)])
 assert -.025<bounds[0,1]<.05 and 1.35<bounds[1,1]<1.55,(filename,bounds)
 maxmove=0
 for step in range(17):
  phase=step*math.tau/16;pose={}
  for side,sign in [('L',1),('R',-1)]:
   pose['arm.'+side]=math.sin(phase)*sign*.45;pose['forearm.'+side]=-.25-abs(math.sin(phase))*.45;pose['hand.'+side]=-.18
   pose['leg.'+side]=math.sin(phase)*sign*.3;pose['shin.'+side]=-abs(math.sin(phase))*.35
  moved=evaluate(pose);delta=np.linalg.norm(moved-rest,axis=1);maxmove=max(maxmove,delta.max())
  assert delta.max()<.59,(filename,step,delta.max())
  assert delta[rest[:,1]<.2].max()<.43,(filename,step,'foot',delta[rest[:,1]<.2].max())
 print(filename,'17 exported skin poses passed; height',round(bounds[1,1]-bounds[0,1],4),'max movement',round(maxmove,4),'vertices',len(rest))
