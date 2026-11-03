# Civ-VI-like stylised land cover (ESA WorldCover 2021, CC-BY 4.0) – no hex grid, real geography kept
import rasterio
from rasterio.enums import Resampling
from scipy.spatial import cKDTree
print('stylise',TW,TH)
cls=np.zeros((TH,TW),np.uint8)
for t,(w,e) in {'S24W048':(-48,-45),'S24W045':(-45,-42),'S24W042':(-42,-39)}.items():
  lo0,lo1=max(w,LO0),min(e,LO1)
  if lo0>=lo1:continue
  with rasterio.open(f'../wc/{t}.tif') as R:
    win=rasterio.windows.from_bounds(lo0,LA0,lo1,LA1,R.transform)
    j0=int(round((lo0-LO0)/(LO1-LO0)*TW));j1=int(round((lo1-LO0)/(LO1-LO0)*TW))
    cls[:,j0:j1]=R.read(1,window=win,out_shape=(TH,j1-j0),resampling=Resampling.mode)
print('classes',np.unique(cls,return_counts=True))
rng=np.random.default_rng(7)
def fbm(sc,oct=4,seed=0):
  r=np.random.default_rng(seed);o=np.zeros((TH,TW),np.float32);a=1;t=0
  for i in range(oct):
    w=max(2,int(TW/sc));h=max(2,int(TH/sc));o+=a*cv2.resize(r.random((h,w)).astype(np.float32),(TW,TH),interpolation=cv2.INTER_CUBIC);t+=a;a*=.5;sc/=2.2
  return o/t
# --- field patchwork: anisotropic voronoi cells (~0.5-1 km) with hedgerow borders
n=int(TW*TH/260);P=rng.random((n,2))*[TW,TH];ang=fbm(600,2,1)*3.0
tree=cKDTree(P*[1,1.7]);fid=np.zeros((TH,TW),np.int32);bd=np.zeros((TH,TW),np.float32)
yy,xx=np.mgrid[0:256,0:TW].astype(np.float32)
for r0 in range(0,TH,256):
  h=min(256,TH-r0);q=np.stack([xx[:h].ravel(),(yy[:h]+r0).ravel()*1.7],1)
  d,i=tree.query(q,k=2,workers=8);fid[r0:r0+h]=i[:,0].reshape(h,TW);bd[r0:r0+h]=(d[:,1]-d[:,0]).reshape(h,TW)
crop=np.array([[218,186,84],[178,176,64],[124,164,52],[164,112,64],[206,168,74],[96,150,48],[226,204,120],[150,134,58]],np.float32)
past=np.array([[150,182,76],[118,160,62],[178,186,92],[100,146,58],[196,180,98],[134,170,70],[166,150,82]],np.float32)
ck=rng.integers(0,len(crop),n);pk=rng.integers(0,len(past),n);tint=(rng.random(n)*.14+.93).astype(np.float32)
hedge=np.clip((bd-.6)/1.4,0,1);hedge=hedge*hedge*(3-2*hedge)  # 0 at border
cropC=crop[ck][fid]*tint[fid][...,None];pastC=past[pk][fid]*tint[fid][...,None]
# subtle furrow stripes inside crop fields (direction per field)
fa_=(rng.random(n)*np.pi).astype(np.float32)[fid];Y_,X_=np.mgrid[0:TH,0:TW].astype(np.float32)
stripe=.5+.5*np.sin((X_*np.cos(fa_)+Y_*np.sin(fa_))*2.2);del X_,Y_,fa_
cropC*=(.94+.08*stripe)[...,None]
hedgeC=np.array([70,100,48],np.float32)
cropC=cropC*hedge[...,None]+hedgeC*(1-hedge[...,None]);pastC=pastC*hedge[...,None]+hedgeC*(1-hedge[...,None])
# --- forest: lush stylised canopy clumps
f1=fbm(TW/3,3,2);f2=fbm(TW/9,2,3)
clump=np.clip((f1-.35)*2.2,0,1)
forC=np.stack([38+30*clump+14*f2,86+46*clump+18*f2,40+22*clump],-1).astype(np.float32)
# --- towns: warm terracotta/cream blocks with grey streets
bl=fbm(TW/1.5,2,4);blk=(nd.uniform_filter(rng.random((TH//2,TW//2)).astype(np.float32),2));blk=cv2.resize(blk,(TW,TH),interpolation=cv2.INTER_NEAREST)
townC=np.stack([178-36*blk+16*bl,160-34*blk+10*bl,140-30*blk],-1).astype(np.float32)
street=((np.arange(TW)%5==0)[None,:]|(np.arange(TH)%5==0)[:,None]);townC[street]=[150,146,140]
out=np.zeros((TH,TW,3),np.float32);ws=np.zeros((TH,TW),np.float32)
def acc(c,C):
  global out,ws
  w=nd.gaussian_filter(np.isin(cls,c).astype(np.float32),1.2);out+=C*w[...,None];ws+=w
acc([20],forC*.5+pastC*.5);acc([10],forC);del forC;acc([30,100],pastC);del pastC;acc([40],cropC);del cropC;acc([50],townC);del townC
for c,v in [([60,70],[176,160,130]),([80],[38,66,92]),([90],[78,112,80]),([95],[50,96,64])]:
  w=nd.gaussian_filter(np.isin(cls,c).astype(np.float32),1.2);out+=np.array(v,np.float32)*w[...,None];ws+=w
out/=np.maximum(ws,1e-3)[...,None];
miss=ws<.05;out[miss]=col[miss]
# painterly light: warm lit / cool shade, soft AO
lit=np.clip(hs,0,1)[...,None];warm=np.array([1.06,1.02,.92],np.float32);cool=np.array([.78,.84,1.0],np.float32)
fl=nd.gaussian_filter(np.isin(cls,[30,40,100]).astype(np.float32),2)[...,None];lit2=lit*(1-.55*fl)+.62*.55*fl
out=out*(cool+(warm-cool)*lit2)*(.70+.40*lit2)*ao[...,None]
# altitude tint: higher ground slightly cooler/greyer (serra)
hi=np.clip((el-900)/900,0,1)[...,None];g_=out.mean(2,keepdims=True);out=out*(1-.3*hi)+g_*.3*hi
out=cv2.bilateralFilter(np.clip(out,0,255).astype(np.uint8),3,10,2).astype(np.float32)
# fade style toward the Brazil host map at the outer ring so the ellipse edge is invisible
LONs,LATs=grid(TW,TH);eo=np.hypot((LONs-(LO0+LO1)/2)/((LO1-LO0)/2),(LATs-(LA0+LA1)/2)/((LA1-LA0)/2))
wst=(1-np.clip((eo-.55)/.4,0,1))[...,None];base=col*(.72+.38*lit)*ao[...,None]
img=out*wst+base*(1-wst);del out,base,LONs,LATs,eo
np.save('/tmp/cls.npy',cls)

rs=np.random.default_rng(11);LONs,LATs=grid(TW,TH)
_nz=.5*np.sin(LONs*7.1+LATs*3.3)+.3*np.sin(-LONs*4.3+LATs*9.7+1.3)+.2*np.sin(LONs*13.+LATs*11.+2.)
cityE=np.hypot((LONs-(C0+C1)/2)/((C1-C0)/2),(LATs-(A0+A1)/2)/((A1-A0)/2))+.1*_nz;regE=np.hypot((LONs-(LO0+LO1)/2)/((LO1-LO0)/2),(LATs-(LA0+LA1)/2)/((LA1-LA0)/2))
ok=(cityE>.8)&(regE<.8)&land
def pick(m,N):
  idx=np.flatnonzero(m.ravel());idx=rs.choice(idx,min(N,len(idx)),replace=False);j,i=np.unravel_index(idx,m.shape)
  lo=LONs[j,i]+(rs.random(len(j))-.5)*(LO1-LO0)/TW;la=LATs[j,i]+(rs.random(len(j))-.5)*(LA1-LA0)/TH
  return np.stack([lo,la],1).astype(np.float32)
trees=pick(ok&(cls==10)&(nd.binary_erosion(cls==10,iterations=1)),180000);houses=pick(ok&(cls==50),90000)
trees.tofile('../../brazil-showcase/rio_trees.bin');houses.tofile('../../brazil-showcase/rio_houses.bin');print('inst',len(trees),len(houses))
del LONs,LATs,cityE,regE,ok
