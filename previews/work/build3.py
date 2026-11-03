import json,math,sys,numpy as np,cv2
from PIL import Image,ImageDraw,ImageFilter
from scipy.ndimage import map_coordinates,gaussian_filter,distance_transform_edt,label
R=sys.argv[1]
if R=='br':W0,E0,S0,N0=-74.5,-34,-34.5,5.8;OUT='../brazil/'
else:W0,E0,S0,N0=-82,-34,-56,13;OUT='../south-america/'
k=math.cos(math.radians((S0+N0)/2));H=4096;W=int(H*(E0-W0)*k/(N0-S0))
lons=W0+(np.arange(W)+.5)/W*(E0-W0);lats=N0-(np.arange(H)+.5)/H*(N0-S0)
def tx(lon,z):return int((lon+180)/360*2**z)
def ty(lat,z):r=math.radians(lat);return int((1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**z)
z=7;T=256;X0,X1,Y0,Y1=tx(W0,z),tx(E0,z),ty(N0,z),ty(S0,z)
big=np.zeros(((Y1-Y0+1)*T,(X1-X0+1)*T),np.float32)
for x in range(X0,X1+1):
  for y in range(Y0,Y1+1):
    a=np.asarray(Image.open(f't7/t_{x}_{y}.png').convert('RGB')).astype(np.float32)
    big[(y-Y0)*T:(y-Y0+1)*T,(x-X0)*T:(x-X0+1)*T]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
X=((lons+180)/360*2**z-X0)*T;Y=((1-np.log(np.tan(np.radians(lats))+1/np.cos(np.radians(lats)))/math.pi)/2*2**z-Y0)*T
el=np.clip(map_coordinates(big,np.meshgrid(Y,X,indexing='ij'),order=1),0,None).astype(np.float32)
el=gaussian_filter(el,1.0)
P=lambda r:[((p[0]-W0)/(E0-W0)*W,(N0-p[1])/(N0-S0)*H) for p in r]
LL=lambda lo,la:(int((lo-W0)/(E0-W0)*W),int((N0-la)/(N0-S0)*H))
# piece mask + country labels
piece=Image.new('L',(W,H));lab=Image.new('L',(W,H));dp,dl=ImageDraw.Draw(piece),ImageDraw.Draw(lab)
if R=='br':
  g=json.load(open('brazil10.json'));ring=max((p[0] for p in g['coordinates']),key=len);dp.polygon(P(ring),fill=255);dl.polygon(P(ring),fill=1)
else:
  SA={'Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela','Falkland Is.','France'}
  for i,f in enumerate(json.load(open('sa_countries.json'))):
    if f['n'] not in SA:continue
    for poly in (f['g']['coordinates'] if f['g']['type']=='MultiPolygon' else [f['g']['coordinates']]):
      o=poly[0]
      if f['n']=='France' and not(o[0][1]<10 and o[0][0]>-56):continue
      if not any(W0<p[0]<E0 and S0<p[1]<N0 for p in o):continue
      dp.polygon(P(o),fill=255);dl.polygon(P(o),fill=i+1)
pm=np.asarray(piece)>127;labs=np.asarray(lab)
# inner water: lakes inside piece (+ River Plate estuary for SA)
wt=Image.new('L',(W,H));dw=ImageDraw.Draw(wt)
for f in json.load(open('lakes.geojson'))['features']:
  gm=f['geometry']
  for poly in (gm['coordinates'] if gm['type']=='MultiPolygon' else [gm['coordinates']]):
    if any(W0<p[0]<E0 and S0<p[1]<N0 for p in poly[0]):dw.polygon(P(poly[0]),fill=255)
wm=(np.asarray(wt)>127)&pm
if R=='sa':
  est=Image.new('L',(W,H));ImageDraw.Draw(est).polygon(P([(-58.6,-33.9),(-57.8,-33.6),(-56.4,-34.5),(-54.95,-34.95),(-56.68,-36.32),(-57.4,-35.6),(-58.4,-34.6),(-58.9,-34.2)]),fill=255)
  e=(np.asarray(est)>127)&~pm;wm|=e;pm=pm|e
bm=np.asarray(Image.open('bm.jpg' if R=='br' else 'bm_sa.jpg').convert('RGB').resize((W,H),Image.LANCZOS)).astype(np.float32)
bs=np.dstack([gaussian_filter(bm[...,i],1.2) for i in range(3)])
bw=(bs[...,2]>bs[...,0]+6)&(bs[...,2]>=bs[...,1]-4)&(bs.mean(2)<80)
bw=cv2.morphologyEx(cv2.morphologyEx(bw.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8)),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))>0
wm|=bw&pm
ld=Image.new('L',(W,H));dd_=ImageDraw.Draw(ld)
for f in json.load(open('land.geojson'))['features']:
  gm=f['geometry']
  for poly in (gm['coordinates'] if gm['type']=='MultiPolygon' else [gm['coordinates']]):
    if not any(W0-20<p[0]<E0+20 and S0-20<p[1]<N0+20 for p in poly[0][::50]):continue
    dd_.polygon(P(poly[0]),fill=255)
    for hole in poly[1:]:dd_.polygon(P(hole),fill=0)
nl=(np.asarray(ld)<128)&pm;nl=cv2.morphologyEx(nl.astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5),np.uint8))>0;wm|=nl
x0,y0=LL(-52.4,-29.9);x1,y1=LL(-50.5,-32.4)
sub=pm[y0:y1,x0:x1].astype(np.uint8);cl=cv2.morphologyEx(sub,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))>0
add=cl&~(sub>0);pm[y0:y1,x0:x1]|=add;wm[y0:y1,x0:x1]|=add
k5=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9))
pm2=cv2.morphologyEx(cv2.morphologyEx(pm.astype(np.uint8),cv2.MORPH_OPEN,k5),cv2.MORPH_CLOSE,k5)>0
wm|=pm2&~pm;pm=pm2
from scipy.ndimage import binary_fill_holes
hl=binary_fill_holes(pm)&~pm;wm|=hl;pm|=hl
# fill tiny holes, flatten lakes
lb,n=label(wm)
for i in range(1,n+1):
  s=lb==i
  if s.sum()>4:el[s]=np.percentile(el[s],15)
el[wm&(lb>0)]=np.minimum(el[wm&(lb>0)],el[wm&(lb>0)])
el=np.where(pm,el,0)
dist=distance_transform_edt(pm)   # px to edge
# contour for walls (half res to match height map)
h2=(H//2,W//2);pms=np.where(cv2.resize(pm.astype(np.uint8)*255,(W//2,H//2),interpolation=cv2.INTER_AREA)>127,255,0).astype(np.uint8)
cs,_=cv2.findContours((pms>127).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
rings=[]
for c in cs:
  if cv2.contourArea(c)<6:continue
  c=cv2.approxPolyDP(c,.6,True)[:,0,:]
  rings.append([[round((p[0]+.5)/(W//2),5),round((p[1]+.5)/(H//2),5)] for p in c])
# rivers vector, clipped with inset
rvi=Image.new('L',(W,H));d=ImageDraw.Draw(rvi);riv=[]
inset=dist>5
for f in json.load(open('rivers.geojson'))['features']:
  sr=f['properties'].get('scalerank',9);gm=f['geometry']
  if not gm or sr>(7 if R=='br' else 6):continue
  for l in (gm['coordinates'] if gm['type']=='MultiLineString' else [gm['coordinates']]):
    pp=P(l);seg=[]
    for q in pp+[None]:
      ok=q is not None and 0<=q[0]<W and 0<=q[1]<H and inset[int(q[1]),int(q[0])] and not wm[int(q[1]),int(q[0])]
      if ok:seg.append(q);continue
      if len(seg)>1:
        d.line(seg,fill=255,width=max(1,int((10 if R=='br' else 8)-sr*(1.2 if R=='br' else 1))),joint='curve')
        if sr<=(7 if R=='br' else 4):riv.append({'w':max(1.5,(9 if R=='br' else 7)-sr*(1 if R=='br' else 1)),'p':[[round(a/W,5),round(b/H,5)] for a,b in seg]})
      seg=[]
rv=np.asarray(rvi.filter(ImageFilter.GaussianBlur(.7)),np.float32)/255
# hillshade
def hs(e,gain,az=315,alt=42):
  gy,gx=np.gradient(e*gain);a,b=math.radians(az),math.radians(alt)
  sl=np.pi/2-np.arctan(np.hypot(gx,gy));asp=np.arctan2(-gx,gy)
  return np.clip(np.sin(b)*np.sin(sl)+np.cos(b)*np.cos(sl)*np.cos(a-asp),0,1)
bm=np.asarray(Image.open('bm.jpg' if R=='br' else 'bm_sa.jpg').convert('RGB').resize((W,H),Image.LANCZOS)).astype(np.float32)
s=np.dstack([gaussian_filter(bm[...,i],3.5) for i in range(3)])*1.25
pal=np.array([[38,82,46],[58,104,54],[96,124,64],[140,140,84],[178,160,108],[120,128,80],[92,118,92],[150,170,110]],np.float32)
base=np.array([[46,92,56],[68,114,64],[112,136,78],[170,160,104],[204,182,132],[146,146,98],[104,130,104],[168,180,122]],np.float32)
dd=((s[...,None,:]-pal)**2).sum(-1);w=np.exp(-(dd-dd.min(-1,keepdims=True))/250.);w/=w.sum(-1,keepdims=True)
c=np.einsum('hwk,kc->hwc',w,base)
# altitude tint: high andes -> warm grey rock / snow
alt=el/1000.;rock=np.clip((alt-2.8)/1.5,0,1)[...,None];snow=np.clip((alt-5.0)/.8,0,1)[...,None]
c=c*(1-rock*.7)+np.array([150,138,122])*rock*.7;c=c*(1-snow)+np.array([236,236,232])*snow
rng=np.random.default_rng(3)
def fbm(sh,oct):
  o=np.zeros(sh,np.float32)
  for i,(s_,a) in enumerate(oct):o+=a*cv2.resize(rng.normal(0,1,(sh[0]//s_+1,sh[1]//s_+1)).astype(np.float32),(sh[1],sh[0]),interpolation=cv2.INTER_CUBIC)
  return o
br=fbm((H,W),[(64,.5),(16,.35),(4,.25),(1,.2)])  # brush grain
c*= (1+br*.035)[...,None]
fo=np.clip((s[...,1]-s[...,0])/22,0,1)*np.clip((120-s.mean(2))/50,0,1)
st=(rng.random((H,W))<.18*fo).astype(np.float32);st=gaussian_filter(st,.6)*2.2;c*=(1-np.clip(st,0,1)*.22)[...,None]  # canopy stipple
hh=hs(el,.01);c*=(0.74+0.30*hh/np.median(hh[pm])).clip(0,1.35)[...,None]
hf=hs(el,.03,alt=50);c*=(0.92+0.10*hf/np.median(hf[pm])).clip(0,1.15)[...,None]
lv=np.floor(gaussian_filter(el,1.5)/300);edge=((np.diff(lv,axis=0,prepend=lv[:1])!=0)|(np.diff(lv,axis=1,prepend=lv[:,:1])!=0)).astype(np.float32)
c=c*(1-edge[...,None]*.12)+np.array([96,76,56])*edge[...,None]*.12
yy,xx=np.mgrid[0:H,0:W]
for nm,lo,la,pop,ang in json.load(open('cities.json'))[R]:
  cx,cy=LL(lo,la);r=.016*math.sqrt(pop)*H/10*1.05;x0_,x1_,y0_,y1_=max(0,int(cx-r*1.5)),min(W,int(cx+r*1.5)),max(0,int(cy-r*1.5)),min(H,int(cy+r*1.5))
  dd2=np.hypot(xx[y0_:y1_,x0_:x1_]-cx,yy[y0_:y1_,x0_:x1_]-cy)/r;f=np.clip(1.25-dd2,0,1)**1.5*np.clip((dist[y0_:y1_,x0_:x1_]-2)/4,0,1)*(1+.25*br[y0_:y1_,x0_:x1_]).clip(0,1.3)
  c[y0_:y1_,x0_:x1_]=c[y0_:y1_,x0_:x1_]*(1-f[...,None]*.7)+np.array([138,128,114])*f[...,None]*.7
rc=np.array([58,108,138],np.float32);c=c*(1-rv[...,None]*.9)+rc*rv[...,None]*.9
wd=distance_transform_edt(~wm);wi=distance_transform_edt(wm)
wcol=np.array([34,82,104],np.float32)*(1-np.clip(wi/30,0,1)[...,None]*.35)
c=np.where(wm[...,None],wcol,c)
# hair-thin internal borders only
if R=='sa':
  L=labs.astype(np.int32);bd=np.zeros((H,W),bool)
  bd[:,1:]|=(L[:,1:]!=L[:,:-1])&(L[:,1:]>0)&(L[:,:-1]>0);bd[1:]|=(L[1:]!=L[:-1])&(L[1:]>0)&(L[:-1]>0)
  bdv=gaussian_filter(bd.astype(np.float32),.45);c=c*(1-bdv[...,None]*.35)+np.array([238,228,206])*bdv[...,None]*.35
sv=lambda a,n,q=None:Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(OUT+n,**({'quality':q} if q else {}))
sv(c,'c3.jpg',92)
hs_=cv2.resize(np.sqrt(el/(3000 if R=='br' else 4500)).clip(0,1),(W//2,H//2),interpolation=cv2.INTER_AREA);sv(hs_*255,'height.png')
gy,gx=np.gradient(gaussian_filter(el,.8)*.004);nn=np.dstack([-gx,gy,np.ones_like(el)]);nn/=np.linalg.norm(nn,axis=2,keepdims=True);sv((nn*.5+.5)*255,'normal.jpg',92)
sv(pms.astype(np.float32),'mask.png')
sv(cv2.resize(np.clip(wi/6,0,1).astype(np.float32),(W//2,H//2))*255,'water.png')
# inset map (for buildings): 255 at >=30px from edge and off water
ins=np.clip((np.minimum(dist,wd)-3)/5,0,1)*pm*~wm;sv(cv2.resize(ins.astype(np.float32),(W//2,H//2),interpolation=cv2.INTER_AREA)*255,'inset.png')
sv(cv2.resize((fo*ins).astype(np.float32),(1024,int(1024*H/W)),interpolation=cv2.INTER_AREA)*255,'forest.png')
json.dump({'W':W,'H':H,'rings':rings,'bbox':[W0,E0,S0,N0]},open(OUT+'shape.json','w'));json.dump(riv,open(OUT+'rivers.json','w'))
for nm,lo,la in [('Aconcagua',-70.011,-32.653),('Neblina',-66.0,0.8),('Titicaca',-69.4,-15.8),('Brasilia',-47.9,-15.8),('Manaus',-60,-3.1)]:
  x,y=LL(lo,la)
  if 0<=x<W and 0<=y<H:print(nm,'%.0f m (local max %.0f)'%(el[y,x],el[max(0,y-15):y+15,max(0,x-15):x+15].max()))
print(W,H,len(rings),len(riv))
