import json,math,glob,numpy as np,cv2
from PIL import Image
from scipy import ndimage as nd
LO0,LO1,LA0,LA1=-43.42,-43.03,-23.03,-22.80
KX=(LO1-LO0)*math.cos(math.radians(22.9))*111.32;KZ=(LA1-LA0)*110.6  # km
WX,HZ=KX/10,KZ/10;VE=1.6;U=1/10000*VE  # metres->units vertical
TW,TH=4096,int(4096*KZ/KX);MPX=KX*1000/TW
print('tex',TW,TH,'m/px',MPX)
# --- DEM mosaic (z13 terrarium, Web Mercator) resampled to equirect grid
z=13;T={}
for f in glob.glob('t13/*.png'):
  x,y=map(int,f[4:-4].split('_'));a=np.asarray(Image.open(f).convert('RGB')).astype(np.float64);T[(x,y)]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
xs=sorted({k[0] for k in T});ys=sorted({k[1] for k in T});M=np.zeros((len(ys)*256,len(xs)*256))
for (x,y),a in T.items():M[(y-ys[0])*256:(y-ys[0]+1)*256,(x-xs[0])*256:(x-xs[0]+1)*256]=a
def gp(lon,lat):
  n=2**z*256;X=(lon+180)/360*n-xs[0]*256;la=np.radians(lat);Y=(1-np.log(np.tan(la)+1/np.cos(la))/np.pi)/2*n-ys[0]*256;return X,Y
def dem(w,h):
  lon=LO0+(np.arange(w)+.5)/w*(LO1-LO0);lat=LA1-(np.arange(h)+.5)/h*(LA1-LA0);LON,LAT=np.meshgrid(lon,lat);X,Y=gp(LON,LAT)
  return nd.map_coordinates(M,[Y-.5,X-.5],order=3,mode='nearest')
el=dem(TW,TH);el=nd.gaussian_filter(el,.7)
P=lambda lon,lat:((np.asarray(lon)-LO0)/(LO1-LO0)*TW,(LA1-np.asarray(lat))/(LA1-LA0)*TH)
# --- OSM rasters
O=json.load(open('osm.json'))
def poly(kinds,scale=1):
  m=np.zeros((TH,TW),np.uint8)
  for k,o,inn in O['areas']:
    if k not in kinds:continue
    x,y=P([p[0] for p in o],[p[1] for p in o]);cv2.fillPoly(m,[np.c_[x,y].astype(np.int32)],1)
    for r in inn:
      x,y=P([p[0] for p in r],[p[1] for p in r]);cv2.fillPoly(m,[np.c_[x,y].astype(np.int32)],0)
  return m>0
wat=poly({'water','wetland'});beach=poly({'beach','sand'});wood=poly({'wood','forest'});scrub=poly({'scrub','meadow'});grass=poly({'grass','park','golf_course','pitch'})
urb=poly({'residential','commercial','retail','industrial'});rock=poly({'bare_rock'});air=poly({'airport'})
cb=np.zeros((TH,TW),np.uint8)
for pts in O['coast']:
  x,y=P([p[0] for p in pts],[p[1] for p in pts]);cv2.polylines(cb,[(np.c_[x,y]*16).astype(np.int32)],False,1,2,cv2.LINE_8,shift=4)
lab,_=nd.label(cb==0);seeds=[P(-43.2,-23.02),P(-43.15,-22.87),P(-43.13,-22.93),P(-43.05,-23.02)]
ids={lab[int(y),int(x)] for x,y in seeds}-{0};sea=np.isin(lab,list(ids));sea=nd.binary_dilation(sea,iterations=1)&~nd.binary_erosion(cb==0,iterations=0)|sea
print('sea frac',sea.mean(),ids)
water=sea|wat
land=~water
gy,gx=np.gradient(el,MPX);slope=np.degrees(np.arctan(np.hypot(gx,gy)))
# depth below sea for colouring; inland water uses distance-from-shore as proxy
dsh=nd.distance_transform_edt(water)*MPX
depth=np.where(sea,np.maximum(-el,0)*.5+dsh*.01,dsh*.01)
# --- palette (tidy miniature)
rng=np.random.default_rng(3)
def fbm(s,o=5):
  r=np.zeros((TH,TW));a=1
  for i in range(o):
    sh=(max(2,TH//(s*2**i)),max(2,TW//(s*2**i)));r+=a*cv2.resize(rng.random(sh).astype(np.float32),(TW,TH),interpolation=cv2.INTER_CUBIC);a*=.5
  return (r-r.min())/(r.max()-r.min())
n1=fbm(6);n2=fbm(40);grain=rng.random((TH,TW))
C=np.zeros((TH,TW,3))
alt=np.clip(el/900,0,1)[...,None]
forest=np.array([40,68,38]);forest2=np.array([58,86,44]);C[:]=forest+(forest2-forest)*(n1*.6+n2*.4)[...,None]
C=C*(1-alt*.25)+np.array([70,84,58])*alt*.25
C[scrub]=np.array([102,112,66])+(n2[scrub,None]-.5)*20
C[grass]=np.array([112,134,72])+(n2[grass,None]-.5)*18
ug=np.array([168,165,154])+(n2[...,None]-.5)*7
nat=wood|scrub|grass
urbanish=(urb|((el<40)&~nat&(slope<10)))&land
C[urbanish]=ug[urbanish]
n3=fbm(420,2);yard=urbanish&(n3>.58)&~air;C[yard]=np.array([110,128,82])+(n3[yard,None]-.58)*-60
C[air&land]=np.array([168,166,156])
rk=(rock|(slope>48))&land;C[rk]=np.array([148,138,126])+(n1[rk,None]-.5)*22
C[beach&land]=np.array([230,212,176])
# sea colours by depth
sh_=np.array([80,162,158]);md=np.array([38,122,136]);dp=np.array([20,66,96])
t1=np.clip(depth/6,0,1)[...,None];t2=np.clip((depth-6)/25,0,1)[...,None]
WC=sh_*(1-t1)+md*t1;WC=WC*(1-t2)+dp*t2
lag=wat&~sea;WC[lag]=(np.array([66,124,118])*(1-np.clip(depth[lag,None]/40,0,1))+np.array([40,92,98])*np.clip(depth[lag,None]/40,0,1))
C[water]=WC[water]
# wet-sand edge
edge=land&nd.binary_dilation(water,iterations=2)&(beach|(el<3));C[edge]=C[edge]*.8+np.array([190,170,132])*.2
# roads (anti-aliased, widths in m)
RW={0:24,1:16,2:11,3:7,4:4};RCOL={0:(96,92,88),1:(108,103,96),2:(122,116,108),3:(134,128,120),4:(150,144,134)}
img=np.ascontiguousarray(C.astype(np.uint8))
SS=2;big=cv2.resize(img,(TW*SS,TH*SS),interpolation=cv2.INTER_LINEAR)
for cls in [4,3,2,1,0]:
  for c,pts,br in O['roads']:
    if c!=cls:continue
    x,y=P([p[0] for p in pts],[p[1] for p in pts]);pp=(np.c_[x,y]*SS*16).astype(np.int32)
    cv2.polylines(big,[pp],False,RCOL[c],max(1,int(round(RW[c]/MPX*SS))),cv2.LINE_AA,shift=4)
img=cv2.resize(big,(TW,TH),interpolation=cv2.INTER_AREA).astype(np.float64)
img[water&~edge]=C[water&~edge]  # keep water clean (bridges are 3D)
# lighting bake: soft hillshade + AO + grain
L=np.array([-.6,-.55,.6]);L/=np.linalg.norm(L)
nx,ny=-gx*VE,-gy*VE;nn=np.sqrt(nx**2+ny**2+1);hs=(nx*L[0]+ny*L[1]+L[2])/nn
ao=np.clip(1-(nd.gaussian_filter(el,25)-el)/120,.75,1.05)
sh=np.where(land,.72+.38*np.clip(hs,0,1),1)*np.where(land,ao,1)
img=img*sh[...,None]*(1+(grain[...,None]-.5)*np.where(land,.06,.015)[...,None])
Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save('../../brazil-showcase/rio_c.jpg',quality=88)
bz=nd.binary_dilation(beach&land,iterations=2)
fo=nd.gaussian_filter((sea&nd.binary_dilation(bz,iterations=3)).astype(np.float32),1.5)
W=np.dstack([water*255,np.clip(depth/40,0,1)*255,np.clip(fo*2,0,1)*255]).astype(np.uint8)
Image.fromarray(W).resize((2048,TH*2048//TW),Image.BILINEAR).save('../../brazil-showcase/rio_w.png')
# normal map (detail) from full-res DEM
nmap=np.dstack([nx/nn*.5+.5,-ny/nn*.5+.5,1/nn*.5+.5]);nmap[water]=[.5,.5,1]
Image.fromarray((nmap*255).astype(np.uint8)).resize((2048,TH//2),Image.LANCZOS).save('../../brazil-showcase/rio_n.jpg',quality=90)
# mesh heights
GW,GH=1400,int(1400*KZ/KX)
eg=cv2.resize(el.astype(np.float32),(GW,GH),interpolation=cv2.INTER_AREA)
sg=cv2.resize(water.astype(np.float32),(GW,GH),interpolation=cv2.INTER_AREA)>.5
eg=np.where(sg,np.minimum(eg,-2-cv2.resize(depth.astype(np.float32),(GW,GH))*.8),np.maximum(eg,.5))
ys_=np.where(eg>0,eg,eg*.35)  # gentle bathymetry
q=np.clip((ys_+60)*50,0,65535).astype(np.uint16);q.tofile('../../brazil-showcase/rio_h.bin')
# ---------- instances ----------
def tex(lon,lat):x,y=P(lon,lat);return int(np.clip(y,0,TH-1)),int(np.clip(x,0,TW-1))
def tw(lon,lat):x,y=P(lon,lat);return x/TW*WX,y/TH*HZ
D=[(-43.185,-22.970,1.7,9,15,.9),(-43.205,-22.984,1.6,7,13,.85),(-43.222,-22.985,1.3,6,13,.8),(-43.178,-22.903,1.3,10,35,.7),(-43.180,-22.940,1.6,8,16,.75),
 (-43.175,-22.925,1.0,8,14,.7),(-43.110,-22.905,1.6,8,18,.75),(-43.212,-22.965,1.0,6,12,.6),(-43.240,-22.920,2.2,3,12,.35),(-43.370,-23.003,2.5,10,25,.35),(-43.20,-22.90,2.0,3,8,.3),(-43.25,-22.925,2,3,8,.3)]
def district(lon,lat):
  best=None
  for a,b,r,f0,f1,p in D:
    d=math.hypot((lon-a)*102.5,(lat-b)*110.6)
    if d<r and (best is None or d/r<best[0]):best=(d/r,f0,f1,p)
  return best
occ=np.zeros((TH//2,TW//2),bool)  # ~20m cells
cell=MPX*2
B=[];rr=np.random.default_rng(11)
def put(lon,lat,ang,w,d,h,col,kd=0):
  x,y=P(lon,lat);i,j=int(y/2),int(x/2)
  if not(0<=i<occ.shape[0] and 0<=j<occ.shape[1]):return False
  r=max(0,int(max(w,d)/cell/2-.3))
  if occ[max(0,i-r):i+r+1,max(0,j-r):j+r+1].any():return False
  occ[max(0,i-r):i+r+1,max(0,j-r):j+r+1]=True;B.append((lon,lat,ang,w,d,h,col,kd));return True
def okland(lon,lat):
  i,j=tex(lon,lat);return land[i,j] and not beach[i,j] and not wood[i,j] and not grass[i,j] and not rk[i,j] and slope[i,j]<32 and not air[i,j]
m2lon=1/(102.5e3);m2lat=1/(110.6e3)
PAL_T=[(236,232,222),(222,216,204),(208,204,198),(230,220,200),(196,200,204)]
PAL_L=[(214,196,170),(200,170,140),(226,214,190),(188,160,132),(232,226,214)]
PAL_F=[(178,96,64),(196,120,80),(160,84,60),(214,180,150),(226,216,196),(150,110,84)]
for c,pts,br in O['roads']:
  if c>3 or br:continue
  for k in range(len(pts)-1):
    (a0,b0),(a1,b1)=pts[k],pts[k+1];dx=(a1-a0)/m2lon;dy=(b1-b0)/m2lat;Ls=math.hypot(dx,dy)
    if Ls<8:continue
    ux,uy=dx/Ls,dy/Ls;ang=math.atan2(dy,dx)
    lon_m,lat_m=(a0+a1)/2,(b0+b1)/2;ds=district(lon_m,lat_m);i,j=tex(lon_m,lat_m)
    fav=slope[i,j]>11 and (urb[i,j] or not nat[i,j]) and el[i,j]<260
    if fav:sp,dep=9,8
    elif ds and ds[0]<1:sp,dep=24,18
    else:sp,dep=16,13
    s=sp*.5+rr.random()*4
    while s<Ls:
      for side in(-1,1):
        w=sp*(.75+rr.random()*.2);d=dep*(.8+rr.random()*.4)
        off=RW[c]/2+3+d/2
        lon=a0+(ux*s-uy*off*side)*m2lon;lat=b0+(uy*s+ux*off*side)*m2lat
        if not okland(lon,lat):continue
        ii,jj=tex(lon,lat);fv=slope[ii,jj]>11 and el[ii,jj]<260
        if fv:fl=1+int(rr.random()*3.2);col=PAL_F[rr.integers(len(PAL_F))]
        elif ds and rr.random()<ds[3]*(1-ds[0]*.6):fl=int(ds[1]+rr.random()*(ds[2]-ds[1]));col=PAL_T[rr.integers(len(PAL_T))]
        else:fl=1+int(rr.random()*3);col=PAL_L[rr.integers(len(PAL_L))]
        put(lon,lat,ang,w,d,fl*3.1,col,1 if fv else (0 if fl>4 else .5))
      s+=sp
# favela infill (dense small blocks on urban hillsides)
FI=np.argwhere((slope[::4,::4]>12)&(slope[::4,::4]<34)&urb[::4,::4]&land[::4,::4]&(el[::4,::4]<260))
for i,j in FI:
  for t in range(2):
    y=min(i*4+rr.random()*4,TH-1);x=min(j*4+rr.random()*4,TW-1);lon=LO0+x/TW*(LO1-LO0);lat=LA1-y/TH*(LA1-LA0)
    if not land[int(y),int(x)] or wood[int(y),int(x)]:continue
    put(lon,lat,rr.random()*.6,6+rr.random()*4,6+rr.random()*4,3.1*(1+int(rr.random()*3)),PAL_F[rr.integers(len(PAL_F))],1)
print('buildings',len(B))
B=[b for b in B if b[5]>12 or rr.random()<.45];print('kept',len(B))
def pack(rows,f):
  a=np.zeros((len(rows),10),np.float32)
  for k,(lon,lat,ang,w,d,h,col,kd) in enumerate(rows):
    x,zz=tw(lon,lat);a[k]=[x,zz,ang,w/1e4,d/1e4,h*U,col[0]/255,col[1]/255,col[2]/255,kd]
  # quantise to uint16 for size
  lim=np.array([WX,HZ,2*math.pi,.01,.01,.03,1,1,1,1]);a[:,2]%=2*math.pi
  np.clip(a/lim*65535,0,65535).astype(np.uint16).tofile(f)
pack(B,'../../brazil-showcase/rio_b.bin')
# trees: forest + parks, grounded (placed in JS on mesh height)
T2=[];ti=np.argwhere((wood|scrub|(~urbanish&land&~rk&~beach&~air&(el>25))|grass)[::3,::3])
rr.shuffle(ti)
for i,j in ti[:180000]:
  y=min(i*3+rr.random()*3,TH-1);x=min(j*3+rr.random()*3,TW-1);ii,jj=int(y),int(x)
  if not land[ii,jj] or rk[ii,jj] or beach[ii,jj]:continue
  if grass[ii,jj] and rr.random()<.35:continue
  if occ[min(ii//2,occ.shape[0]-1),min(jj//2,occ.shape[1]-1)]:continue
  g=rr.random();col=(int(34+g*30),int(62+g*34),int(30+g*16)) if not grass[ii,jj] else (70,104,52)
  T2.append((x/TW*WX,y/TH*HZ,(6+rr.random()*7)*U*1.0,col))
YI=np.argwhere(yard[::3,::3]);rr.shuffle(YI)
for i,j in YI[:60000]:
  ii,jj=min(i*3+1,TH-1),min(j*3+1,TW-1)
  if occ[min(ii//2,occ.shape[0]-1),min(jj//2,occ.shape[1]-1)]:continue
  g=rr.random();T2.append((jj/TW*WX,ii/TH*HZ,(4+rr.random()*4)*U,(int(52+g*30),int(84+g*30),int(40+g*14))))
print('trees',len(T2))
a=np.array([[x,z_,s,c[0],c[1],c[2]] for x,z_,s,c in T2],np.float32)
lim=np.array([WX,HZ,.003,255,255,255]);np.clip(a/lim*65535,0,65535).astype(np.uint16).tofile('../../brazil-showcase/rio_t.bin')

# bridges (3D decks) from OSM bridge segments
BR=[]
for c,pts,br in O['roads']:
  if br and c<=1:
    xy=[tw(p[0],p[1]) for p in pts if LO0<p[0]<LO1 and LA0<p[1]<LA1]
    if len(xy)>1:BR.append([[round(x,5),round(z_,5)] for x,z_ in xy])
json.dump(dict(WX=WX,HZ=HZ,GW=GW,GH=GH,U=U,bbox=[LO0,LO1,LA0,LA1],bridges=BR),open('../../brazil-showcase/rio_meta.json','w'))
print('ok',WX,HZ)
