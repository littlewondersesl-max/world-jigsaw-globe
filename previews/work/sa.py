import json,math,numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy.ndimage import map_coordinates,gaussian_filter,distance_transform_edt
W0,E0,S0,N0=-82,-34,-56,13
k=math.cos(math.radians(21.5));H=4096;W=int(H*(E0-W0)*k/(N0-S0))
lons=W0+(np.arange(W)+.5)/W*(E0-W0);lats=N0-(np.arange(H)+.5)/H*(N0-S0)
z=6;T=256;X0,Y0=17,29;big=np.zeros((16*T,9*T))
for x in range(17,26):
  for y in range(29,45):
    a=np.asarray(Image.open(f't6/t_{x}_{y}.png').convert('RGB')).astype(float)
    big[(y-Y0)*T:(y-Y0+1)*T,(x-X0)*T:(x-X0+1)*T]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
X=((lons+180)/360*2**z-X0)*T;Y=((1-np.log(np.tan(np.radians(lats))+1/np.cos(np.radians(lats)))/math.pi)/2*2**z-Y0)*T
el=gaussian_filter(np.clip(map_coordinates(big,np.meshgrid(Y,X,indexing='ij'),order=1),0,None),2.0)
P=lambda r:[((p[0]-W0)/(E0-W0)*W,(N0-p[1])/(N0-S0)*H) for p in r]
G=json.load(open('sa_countries.json'))
SA={'Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela','Falkland Is.','France'}
land=Image.new('L',(W,H));m=Image.new('L',(W,H));bd=Image.new('L',(W,H));dl,dm,db=ImageDraw.Draw(land),ImageDraw.Draw(m),ImageDraw.Draw(bd)
pieces=[]
for f in G:
  polys=f['g']['coordinates'] if f['g']['type']=='MultiPolygon' else [f['g']['coordinates']]
  for poly in polys:
    o=poly[0]
    if not any(W0<p[0]<E0 and S0<p[1]<N0 for p in o):continue
    pp=P(o);dl.polygon(pp,fill=255)
    if f['n'] in SA and (f['n']!='France' or o[0][1]<10 and o[0][0]>-56):
      dm.polygon(pp,fill=255);db.line(pp+[pp[0]],fill=255,width=2)
      xs=[q[0] for q in pp];ys=[q[1] for q in pp]
      if (max(xs)-min(xs))*(max(ys)-min(ys))>60:pieces.append({'n':'French Guiana' if f['n']=='France' else f['n'],'r':[[round(q[0]/W,5),round(q[1]/H,5)] for q in pp]})
m.save('sa_mask.png');json.dump({'W':W,'H':H,'pieces':pieces},open('sa_shape.json','w'))
bm=np.asarray(Image.open('bm_sa.jpg').convert('RGB').resize((W,H),Image.LANCZOS)).astype(float)
riv=[];rv=Image.new('L',(W,H));d=ImageDraw.Draw(rv)
for f in json.load(open('rivers.geojson'))['features']:
  sr=f['properties'].get('scalerank',9);g=f['geometry']
  if not g or sr>6:continue
  for l in (g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]):
    if any(W0<p[0]<E0 and S0<p[1]<N0 for p in l):
      d.line(P(l),fill=255,width=max(1,int(8-sr)),joint='curve')
      if sr<=4:riv.append({'w':max(2,7-sr),'p':[[round((p[0]-W0)/(E0-W0),5),round((N0-p[1])/(N0-S0),5)] for p in l]})
json.dump(riv,open('sa_rivers.json','w'))
ma=np.asarray(m)/255.;rv=np.asarray(rv.filter(ImageFilter.GaussianBlur(1)))/255.*ma
def hs(e,gain,az=330,alt=38):
  gy,gx=np.gradient(e*gain);a,b=math.radians(az),math.radians(alt)
  sl=np.pi/2-np.arctan(np.hypot(gx,gy));asp=np.arctan2(-gx,gy)
  return np.clip(np.sin(b)*np.sin(sl)+np.cos(b)*np.cos(sl)*np.cos(a-asp),0,1)
c=np.dstack([gaussian_filter(bm[...,i],1.4) for i in range(3)])*1.2;l=c.mean(2,keepdims=True);c=(l+(c-l)*1.05-128)*1.12+128
h2=hs(el,.02);c=c*(0.45+0.65*h2/np.median(h2)).clip(0,1.5)[...,None]
c=c*(1-rv[...,None]*.7)+np.array([70,150,185.])*rv[...,None]*.7
bdv=np.asarray(bd.filter(ImageFilter.GaussianBlur(.8)))/255.*ma;c=c*(1-bdv[...,None]*.45)+np.array([235,225,200.])*bdv[...,None]*.45
sv=lambda a,n,q=None:Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(n,**({'quality':q} if q else {}))
sv(c,'sa_c.jpg',88)
glow=(gaussian_filter(rv,4)*1.6+rv).clip(0,1);sv(np.dstack([glow*60,glow*170,glow*220]),'sa_e.jpg',85)
sv(np.sqrt(el/4500).clip(0,1)*255,'sa_height.png')
gy,gx=np.gradient(gaussian_filter(el,1.5)*.004);nn=np.dstack([-gx,gy,np.ones_like(el)]);nn/=np.linalg.norm(nn,axis=2,keepdims=True);sv((nn*.5+.5)*255,'sa_normal.jpg',90)
la=np.asarray(land)>127;dd=distance_transform_edt(~la);sv(np.clip(1-dd/14,0,1)*(~la)*255,'sa_coast.png')
b5=np.asarray(Image.fromarray(bm.astype(np.uint8)).resize((512,512))).astype(float);m5=np.asarray(m.resize((512,512)))/255.
fd=np.clip((b5[...,1]-b5[...,0])/20,0,1)*np.clip((100-b5.mean(2))/40,0,1)*m5;sv(fd*255,'sa_forest.png')
print(W,H,len(pieces),len(riv))
