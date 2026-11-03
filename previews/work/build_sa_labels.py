# Data-driven country-ID map for the South America look-3 texture (same bbox/grid as south-america/height.png).
# ids: index+1 in NAMES; the game reveals a country by switching its id on (hair-thin borders come from id edges).
import json,numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt
W0,E0,S0,N0=-82,-34,-56,13
NAMES=['Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela','Falkland Is.','France']
m=np.asarray(Image.open('../south-america/mask.png').convert('L'))>127;H,W=m.shape
P=lambda r:[((p[0]-W0)/(E0-W0)*W,(N0-p[1])/(N0-S0)*H) for p in r]
lab=Image.new('L',(W,H));d=ImageDraw.Draw(lab)
for f in json.load(open('sa_countries.json')):
  if f['n'] not in NAMES:continue
  for poly in (f['g']['coordinates'] if f['g']['type']=='MultiPolygon' else [f['g']['coordinates']]):
    o=poly[0]
    if f['n']=='France' and not(o[0][1]<10 and o[0][0]>-56):continue
    if not any(W0<p[0]<E0 and S0<p[1]<N0 for p in o):continue
    d.polygon(P(o),fill=NAMES.index(f['n'])+1)
L=np.asarray(lab).copy()
_,ind=distance_transform_edt(L==0,return_indices=True)
L=np.where(m,L[ind[0],ind[1]],0).astype(np.uint8)
Image.fromarray(L).save('../south-america/ids.png',optimize=True)
json.dump(NAMES,open('../south-america/ids.json','w'))
print(W,H,{n:int((L==i+1).sum()) for i,n in enumerate(NAMES)})
