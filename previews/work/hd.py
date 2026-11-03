import json,math,numpy as np
from PIL import Image,ImageDraw,ImageFilter
W0,E0,S0,N0=-74.5,-34,-34.5,5.8
k=math.cos(math.radians((S0+N0)/2));H=4096;W=int(H*(E0-W0)*k/(N0-S0))
lons=W0+(np.arange(W)+.5)/W*(E0-W0);lats=N0-(np.arange(H)+.5)/H*(N0-S0)
# DEM z6
z=6;T=256;X0,Y0=18,30;big=np.zeros((9*T,8*T))
for x in range(18,26):
  for y in range(30,39):
    a=np.asarray(Image.open(f't6/t_{x}_{y}.png').convert('RGB')).astype(float)
    big[(y-Y0)*T:(y-Y0+1)*T,(x-X0)*T:(x-X0+1)*T]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
X=((lons+180)/360*2**z-X0)*T;Y=((1-np.log(np.tan(np.radians(lats))+1/np.cos(np.radians(lats)))/math.pi)/2*2**z-Y0)*T
from scipy.ndimage import map_coordinates,gaussian_filter
el=np.clip(map_coordinates(big,np.meshgrid(Y,X,indexing='ij'),order=1),0,None)
el=gaussian_filter(el,2.2)  # stylised smoothing
P=lambda r:[((p[0]-W0)/(E0-W0)*W,(N0-p[1])/(N0-S0)*H) for p in r]
g=json.load(open('brazil10.json'));ring=max((p[0] for p in g['coordinates']),key=len)
m=Image.new('L',(W,H));ImageDraw.Draw(m).polygon(P(ring),fill=255);m.save('hd_mask.png')
json.dump({'ring':P(ring),'W':W,'H':H},open('hd_shape.json','w'))
bm=np.asarray(Image.open('bm.jpg').convert('RGB').resize((W,H),Image.LANCZOS)).astype(float)
# rivers
rv=Image.new('L',(W,H));d=ImageDraw.Draw(rv)
for f in json.load(open('rivers.geojson'))['features']:
  sr=f['properties'].get('scalerank',9);gm=f['geometry']
  if not gm or sr>7:continue
  ls=gm['coordinates'] if gm['type']=='MultiLineString' else [gm['coordinates']]
  for l in ls:
    if any(W0<p[0]<E0 and S0<p[1]<N0 for p in l):d.line(P(l),fill=255,width=max(2,int(11-sr*1.2)),joint='curve')
rv=np.asarray(rv.filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255*np.asarray(m)/255
# hillshade
def hs(e,gain,az=315,alt=42):
  gy,gx=np.gradient(e*gain);a,b=math.radians(az),math.radians(alt)
  sl=np.pi/2-np.arctan(np.hypot(gx,gy));asp=np.arctan2(-gx,gy)
  return np.clip(np.sin(b)*np.sin(sl)+np.cos(b)*np.cos(sl)*np.cos(a-asp),0,1)
h=hs(el,.012);hn=h/ np.median(h)
sv=lambda a,n:Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(n)
sv(np.sqrt(el/3000).clip(0,1)*255,'hd_height.png')
gy,gx=np.gradient(gaussian_filter(el,1.5)*.004);nn=np.dstack([-gx,gy,np.ones_like(el)]);nn/=np.linalg.norm(nn,axis=2,keepdims=True);sv((nn*.5+.5)*255,'hd_normal.png')
def grade(c,sat,con,warm):
  l=c.mean(2,keepdims=True);c=l+(c-l)*sat;c=(c-128)*con+128;c[...,0]+=warm;c[...,2]-=warm;return c
# 1 painterly
c=np.dstack([gaussian_filter(bm[...,i],3) for i in range(3)])
from PIL import ImageFilter as F
c=np.asarray(Image.fromarray(c.astype(np.uint8)).filter(F.ModeFilter(7)).filter(F.GaussianBlur(1.5))).astype(float)
c=grade(c*1.25,1.25,1.08,4)*(0.6+0.4*hn.clip(0,2))[...,None]
riv=np.array([62,104,128.]);c=c*(1-rv[...,None]*.85)+riv*rv[...,None]*.85;sv(c,'hd_c1.png')
# 2 modern
c=np.dstack([gaussian_filter(bm[...,i],1.4) for i in range(3)]);c=grade(c*1.2,1.05,1.12,0)
h2=hs(el,.02,az=330,alt=38);c=c*(0.45+0.65*h2/np.median(h2)).clip(0,1.5)[...,None]
glow=gaussian_filter(rv,5)*1.6+rv;glow=glow.clip(0,1)
c=c*(1-rv[...,None]*.7)+np.array([70,150,185.])*rv[...,None]*.7;sv(c,'hd_c2.png')
sv(np.dstack([glow*60,glow*170,glow*220]),'hd_e2.png')
# 3 illustrated: quantised biomes + contours
s=np.dstack([gaussian_filter(bm[...,i],6) for i in range(3)])
pal=np.array([[38,82,46],[58,104,54],[96,124,64],[140,140,84],[178,160,108],[120,128,80],[92,118,92],[150,170,110]],float)
lab=((s[...,None,:]*1.25-pal)**2).sum(-1).argmin(-1);lab=np.asarray(Image.fromarray(lab.astype(np.uint8)).filter(F.ModeFilter(11)))
base=np.array([[44,96,58],[70,118,66],[116,140,78],[176,166,104],[210,186,130],[150,150,96],[110,138,110],[176,190,126]],float)
c=base[lab]
paper=np.random.default_rng(1).normal(0,4,(H,W));c+=paper[...,None]
c*= (0.78+0.25*hs(el,.008)/np.median(hs(el,.008))).clip(0,1.3)[...,None]
lv=np.floor(el/250);edge=((np.abs(np.diff(lv,axis=0,prepend=lv[:1]))+np.abs(np.diff(lv,axis=1,prepend=lv[:,:1])))>0).astype(float)
edge=gaussian_filter(edge,.7).clip(0,1)*0.35;c=c*(1-edge[...,None])+np.array([90,70,50.])*edge[...,None]
c=c*(1-rv[...,None])+np.array([46,92,140.])*rv[...,None]
# coast outline darkening inside edge
md=gaussian_filter(np.asarray(m).astype(float)/255,6);ring_=((md<.97)&(np.asarray(m)>0)).astype(float);c=c*(1-ring_[...,None]*.18)
sv(c,'hd_c3.png')
print(W,H,el.max())
