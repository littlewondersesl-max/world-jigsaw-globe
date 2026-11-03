# Surround tile around a detailed city: z11 DEM relief + Brazil map colour graded to the city palette.
import math,os,glob,json,urllib.request,concurrent.futures as cf,numpy as np,cv2,scipy.ndimage as nd
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
LO0,LO1,LA0,LA1=-44.25,-42.2,-23.45,-22.3   # surround
C0,C1,A0,A1=-43.42,-43.03,-23.03,-22.80      # city bbox
z=11;tx=lambda lo:int((lo+180)/360*2**z);ty=lambda la:int((1-math.log(math.tan(math.radians(la))+1/math.cos(math.radians(la)))/math.pi)/2*2**z)
J=[(x,y) for x in range(tx(LO0),tx(LO1)+1) for y in range(ty(LA1),ty(LA0)+1)]
def g(j):
  x,y=j;f=f't11/{x}_{y}.png'
  if not os.path.exists(f):urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',f)
list(cf.ThreadPoolExecutor(16).map(g,J))
T={}
for f in glob.glob('t11/*.png'):
  x,y=map(int,os.path.basename(f)[:-4].split('_'));a=np.asarray(Image.open(f).convert('RGB')).astype(np.float64);T[(x,y)]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
xs=sorted({k[0] for k in T});ys=sorted({k[1] for k in T});M=np.zeros((len(ys)*256,len(xs)*256))
for (x,y),a in T.items():M[(y-ys[0])*256:(y-ys[0]+1)*256,(x-xs[0])*256:(x-xs[0]+1)*256]=a
def grid(w,h):
  lon=LO0+(np.arange(w)+.5)/w*(LO1-LO0);lat=LA1-(np.arange(h)+.5)/h*(LA1-LA0);return np.meshgrid(lon,lat)
def dem(w,h):
  LON,LAT=grid(w,h);n=2**z*256;X=(LON+180)/360*n-xs[0]*256;la=np.radians(LAT);Y=(1-np.log(np.tan(la)+1/np.cos(la))/np.pi)/2*n-ys[0]*256
  return nd.map_coordinates(M,[Y-.5,X-.5],order=3,mode='nearest')
KX=(LO1-LO0)*math.cos(math.radians(22.9))*111.32;KZ=(LA1-LA0)*110.6
TW=2400;TH=int(TW*KZ/KX);el=dem(TW,TH)
# Brazil map colour + mask (linear lon/lat over shape bbox)
sh=json.load(open('../../brazil/shape.json'));W0,E0,S0,N0=sh['bbox']
c3=np.asarray(Image.open('../../brazil/c3.jpg').convert('RGB')).astype(np.float32);mk=np.asarray(Image.open('../../brazil/mask.png').convert('L')).astype(np.float32)/255
LON,LAT=grid(TW,TH)
def samp(img,):
  X=(LON-W0)/(E0-W0)*img.shape[1]-.5;Y=(N0-LAT)/(N0-S0)*img.shape[0]-.5
  return cv2.remap(img,X.astype(np.float32),Y.astype(np.float32),cv2.INTER_CUBIC)
col=samp(c3);pm=samp(mk)
land=(el>.5)&~((col[...,2]>col[...,1]*1.05)&(el<8));land=nd.binary_opening(land,iterations=1)
# hillshade bake like the city
VE=1.6;px=KX*1000/TW;gy,gx=np.gradient(nd.gaussian_filter(el,.8),px);L=np.array([-.6,-.55,.6]);L/=np.linalg.norm(L)
nx,ny=-gx*VE,-gy*VE;nn=np.sqrt(nx**2+ny**2+1);hs=(nx*L[0]+ny*L[1]+L[2])/nn
ao=np.clip(1-(nd.gaussian_filter(el,8)-el)/120,.75,1.05)
img=col*(.72+.38*np.clip(hs,0,1))[...,None]*ao[...,None]
rng=np.random.default_rng(3);gr=cv2.resize(rng.random((TH//2,TW//2)).astype(np.float32),(TW,TH));img*=1+(gr[...,None]-.5)*.06
# grade to the city texture over the overlap (land only)
rc=np.asarray(Image.open('../../brazil-showcase/rio_c.jpg').convert('RGB')).astype(np.float32);rw=np.asarray(Image.open('../../brazil-showcase/rio_w.png'))[...,0]
rws=cv2.resize(rw,(rc.shape[1],rc.shape[0]),interpolation=cv2.INTER_NEAREST)<128
i0=int((LA1-A1)/(LA1-LA0)*TH);i1=int((LA1-A0)/(LA1-LA0)*TH);j0=int((C0-LO0)/(LO1-LO0)*TW);j1=int((C1-LO0)/(LO1-LO0)*TW)
sub=img[i0:i1,j0:j1];sl=land[i0:i1,j0:j1]
for k in range(3):
  a=sub[...,k][sl];b=rc[...,k][rws]
  img[...,k]=(img[...,k]-a.mean())/a.std()*b.std()*.85+b.mean()
print('grade',[round(float(x),1) for x in rc[rws].mean(0)])
g_=img.mean(2,keepdims=True);img=g_+(img-g_)*.8;LONf,LATf=grid(TW,TH);cu_=(LONf-C0)/(C1-C0);cv_=(LATf-A0)/(A1-A0);cd_=np.minimum(np.minimum(cu_,1-cu_),np.minimum(cv_,1-cv_))
wgt=np.clip(cd_/.3,0,1);wgt=wgt*wgt*(3-2*wgt)
rcs=cv2.resize(rc,(j1-j0,i1-i0),interpolation=cv2.INTER_AREA);blk=img[i0:i1,j0:j1];w_=wgt[i0:i1,j0:j1,None]*sl[...,None]
img[i0:i1,j0:j1]=blk*(1-w_)+rcs*w_
img=np.clip(img,0,255);img[~land]=[30,60,80]
Image.fromarray(img.astype(np.uint8)).save('../../brazil-showcase/rio_sc.jpg',quality=86)
# alpha: land * outer feather * hole where the city tile is opaque (complement of its 7% feather)
AW=1024;AH=int(AW*TH/TW);LON,LAT=grid(AW,AH)
u=(LON-LO0)/(LO1-LO0);v=(LAT-LA0)/(LA1-LA0);d=np.minimum(np.minimum(u,1-u),np.minimum(v,1-v))
ss=lambda a,b,x:(lambda t:t*t*(3-2*t))(np.clip((x-a)/(b-a),0,1))
outer=ss(0,.22,d)
cu=(LON-C0)/(C1-C0);cv=(LAT-A0)/(A1-A0);cd=np.minimum(np.minimum(cu,1-cu),np.minimum(cv,1-cv))
city=ss(0,.2,cd)*(cd>0);la=cv2.resize(land.astype(np.float32),(AW,AH),interpolation=cv2.INTER_AREA)
al=np.clip(outer*(1-city)*ss(.35,.65,la),0,1)
Image.fromarray((al*255).astype(np.uint8)).save('../../brazil-showcase/rio_sa.png')
GW=720;GH=int(GW*KZ/KX);eg=cv2.resize(el.astype(np.float32),(GW,GH),interpolation=cv2.INTER_AREA)
lg=cv2.resize(land.astype(np.float32),(GW,GH),interpolation=cv2.INTER_AREA)>.5
eg=np.where(lg,np.maximum(eg,.5),np.minimum(eg,-2)*.35)
np.clip((eg+60)*50,0,65535).astype(np.uint16).tofile('../../brazil-showcase/rio_sh.bin')
json.dump(dict(GW=GW,GH=GH,U=.00016,bbox=[LO0,LO1,LA0,LA1]),open('../../brazil-showcase/rio_smeta.json','w'))
print(len(J),'tiles',TW,TH,GW,GH)
