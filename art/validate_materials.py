"""Check the encoded shipped material data, including tangent-normal distortion."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'public/assets/textures/v2/manifest.json').read_text())
count=0;total=0
for name,entry in manifest.items():
 if name.startswith('_'):continue
 for kind,relative in entry['maps'].items():
  path=ROOT/'public'/relative;im=Image.open(path);assert im.size==(entry['resolution'],)*2,(name,kind,im.size)
  a=np.asarray(im.convert('RGB'),dtype=float)
  if kind=='normal':
   length=np.linalg.norm(a/127.5-1,axis=2)
   assert np.percentile(abs(length-1),99)<.025,(name,'encoded normal-vector distortion')
   assert a[:,:,2].min()>=127,(name,'tangent normal points behind surface')
  if kind=='roughness':assert a.std()>1,(name,'constant roughness map')
  seam=(np.mean(abs(a[0]-a[-1]))+np.mean(abs(a[:,0]-a[:,-1])))/2
  assert seam<16,(name,kind,'visible wrap discontinuity',seam)
  assert path.stat().st_size==entry['bytes'][kind],(name,kind,'stale manifest size')
  total+=path.stat().st_size;count+=1
print(f'{count} encoded material maps validated; {total} bytes; dimensions, periodic edges and tangent normals passed')
