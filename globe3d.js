// Three.js ocean globe for the main game. Countries appear only once placed.
// Brazil gets the detailed "look 3" map + streamed Rio region/city (LOD + activity gating); others a stylised texture.
import * as THREE from 'three';
import {OrbitControls} from './previews/brazil/OrbitControls.js';import {loadCity} from './previews/lib/city.js';import {CITIES} from './previews/lib/cities.js';
const P='previews/brazil/';
const host=document.getElementById('stage');const R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});R.setPixelRatio(Math.min(1.5,devicePixelRatio));
R.toneMapping=THREE.ACESFilmicToneMapping;R.domElement.id='globe';host.prepend(R.domElement);
const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(40,1,.01,200);C.position.set(0,.6,6.2);
const O=new OrbitControls(C,R.domElement);O.enableDamping=true;O.enablePan=false;O.minDistance=2.2;O.maxDistance=12;
const sun=new THREE.Vector3(-.6,.5,.65).normalize();S.add(new THREE.AmbientLight(0xffffff,.22));const dl=new THREE.DirectionalLight(0xfff2e0,2.2);dl.position.copy(sun).multiplyScalar(10);S.add(dl);
const U={t:{value:0},bg:{value:0},sun:{value:sun}};
const NO=`float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fb(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}`;
const bg=new THREE.Mesh(new THREE.SphereGeometry(100,64,32),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:U,
vertexShader:`varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:NO+`uniform float bg;varying vec3 d;
float stars(vec3 d,float s,float th){vec3 p=d*s;vec3 i=floor(p);float r=h(i);vec3 c=i+.5+.35*(vec3(h(i+3.1),h(i+7.7),h(i+1.3))-.5);float k=length(p-c);return r>th?smoothstep(.12,0.,k)*(r-th)/(1.-th):0.;}
void main(){vec3 c;
if(bg<.5){vec3 g=normalize(vec3(.3,1.,.2));float b=abs(dot(d,g));float band=exp(-b*b*18.);float dust=fb(d*6.);
c=vec3(.006,.008,.016)+band*vec3(.16,.14,.12)*(.4+dust)-band*smoothstep(.55,.75,fb(d*9.+2.))*vec3(.1);c+=stars(d,260.,.93)*vec3(1.)+stars(d,600.,.97)*.6*(1.+band*3.);}
else if(bg<1.5){float a=fb(d*2.5),b=fb(d*4.+5.);c=vec3(.01,.01,.02)+pow(a,3.)*vec3(.5,.12,.35)+pow(b,4.)*vec3(.1,.35,.6);c+=stars(d,300.,.95);}
else if(bg<2.5){c=mix(vec3(.02,.02,.025),vec3(.16,.15,.14),pow(1.-abs(d.y),3.));}
c+=stars(d,420.,.985)*.5;
gl_FragColor=vec4(c,1.);}`}));S.add(bg);
// Earth-neighbourhood sky, fixed in the scene (not parented to the spinning globe).
// Distances are shortened so the Sun, Earth's orbit, the Moon and Mars fit in view.
// The globe is Earth. The bright body is the Sun. The line is Earth's path around the Sun.
const skyNear=new THREE.Group();S.add(skyNear);
const sunPos=new THREE.Vector3(0,3.16,-6.54);
const sunBoard=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),new THREE.ShaderMaterial({
 transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 v;void main(){vec2 p=v*2.-1.;float r=length(p);if(r>1.) discard;
  float core=smoothstep(.46,.16,r);
  vec3 col=vec3(4.,3.6,3.)*core+vec3(1.,.8,.55)*(.62*exp(-r*r*7.)+.2*exp(-r*r*1.5));
  gl_FragColor=vec4(col,clamp(core+exp(-r*r*2.4)*.9,0.,1.));}`}));
sunBoard.position.copy(sunPos);sunBoard.renderOrder=1;skyNear.add(sunBoard);
const bodyMat=color=>new THREE.ShaderMaterial({uniforms:{sunP:{value:sunPos},albedo:{value:new THREE.Color(color)}},
 vertexShader:`varying vec3 wn,wp;void main(){wn=normalize(mat3(modelMatrix)*normal);wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform vec3 sunP,albedo;varying vec3 wn,wp;
  void main(){vec3 L=normalize(sunP-wp);float nd=dot(normalize(wn),L);
   vec3 col=albedo*(.08+.92*smoothstep(-.2,.55,nd));
   float rim=pow(1.-abs(dot(normalize(wn),normalize(cameraPosition-wp))),2.);
   gl_FragColor=vec4(col+albedo*rim*.15,1.);}`});
const moon=new THREE.Mesh(new THREE.SphereGeometry(.28,24,16),bodyMat(0xd7d2c8));
moon.position.set(-2.35,.55,-1.35);skyNear.add(moon);
const mars=new THREE.Mesh(new THREE.SphereGeometry(.36,24,16),bodyMat(0xc45532));
const venus=new THREE.Mesh(new THREE.SphereGeometry(.22,24,16),bodyMat(0xe6d2a2));
const earthR=sunPos.length();
const view=new THREE.Vector3(0,0,1);
let planeN=view.clone().sub(sunPos.clone().multiplyScalar(view.dot(sunPos)/sunPos.lengthSq()));
if(planeN.lengthSq()<1e-4)planeN.set(0,1,0);planeN.normalize();
const e1=sunPos.clone().multiplyScalar(-1/earthR),e2=new THREE.Vector3().crossVectors(planeN,e1).normalize();
const onOrbit=(radius,ang)=>{const c=Math.cos(ang),s=Math.sin(ang);return sunPos.clone().addScaledVector(e1,radius*c).addScaledVector(e2,radius*s);};
venus.position.set(-2.54,1.11,-5.9);
mars.position.set(5.04,3.11,-19.64);
skyNear.add(venus);skyNear.add(mars);
const orbitPts=[];
for(let i=0;i<160;i++)orbitPts.push(onOrbit(earthR,i/160*Math.PI*2));
const orbitCurve=new THREE.CatmullRomCurve3(orbitPts,true);
const orbitLine=new THREE.Mesh(new THREE.TubeGeometry(orbitCurve,160,.055,5,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
 vertexShader:`varying float hide;void main(){vec4 w=modelMatrix*vec4(position,1.);hide=smoothstep(2.15,4.6,length(w.xyz));gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying float hide;void main(){gl_FragColor=vec4(.8,.88,1.,hide*.72);}`}));
orbitLine.renderOrder=1;skyNear.add(orbitLine);
const G=new THREE.Group();S.add(G);
const ocean=new THREE.Mesh(new THREE.SphereGeometry(1.5,160,96),new THREE.ShaderMaterial({uniforms:U,
vertexShader:`varying vec3 p,wn,wp;void main(){p=position;wn=normalize(mat3(modelMatrix)*normal);wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
fragmentShader:NO+`uniform float t;uniform vec3 sun;varying vec3 p,wn,wp;
void main(){vec3 q=normalize(p);float e=.0025;vec3 a=q*40.+vec3(t*.15,0,t*.1);
float g0=fb(a),gx=fb(a+vec3(e*40.,0,0)),gy=fb(a+vec3(0,e*40.,0)),gz=fb(a+vec3(0,0,e*40.));
vec3 N=normalize(wn-.35*vec3(gx-g0,gy-g0,gz-g0)/(e*40.)*.05);vec3 V=normalize(cameraPosition-wp);float fr=pow(1.-max(dot(N,V),0.),5.);
float lat=abs(q.y);vec3 deep=mix(vec3(.01,.06,.13),vec3(.02,.12,.2),fb(q*5.)*.8+.1*(1.-lat));
float dif=max(dot(N,sun),0.);vec3 H=normalize(sun+V);float sp=pow(max(dot(N,H),0.),600.)*.7+pow(max(dot(N,H),0.),40.)*.06;
gl_FragColor=vec4(deep*(.18+.95*smoothstep(-.08,.35,dot(wn,sun)))+mix(vec3(0),vec3(.35,.5,.7),fr)+sp*vec3(1.,.95,.85),1.);}`}));G.add(ocean);
const atm=new THREE.Mesh(new THREE.SphereGeometry(1.56,96,64),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,
vertexShader:`varying vec3 n,v;void main(){n=normalize(normalMatrix*normal);v=normalize(-(modelViewMatrix*vec4(position,1.)).xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 n,v;void main(){float k=pow(1.-abs(dot(n,v)),5.);gl_FragColor=vec4(vec3(.3,.55,1.)*k*.7,k);}`}));G.add(atm);
// ---- stylised country layer: equirectangular canvases (base = placed, fresh = revealing / hint glow) ----
const TW=4096,TH=2048;const mkC=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const baseC=mkC(TW,TH),freshC=mkC(2048,1024);const bctx=baseC.getContext('2d'),fctx=freshC.getContext('2d');
const baseT=new THREE.CanvasTexture(baseC),freshT=new THREE.CanvasTexture(freshC);for(const t of [baseT,freshT]){t.anisotropy=8;}
const LU={...U,bt:{value:baseT},ft:{value:freshT},rc:{value:new THREE.Vector3(0,0,1)},rv:{value:2},pm:{value:0},pa:{value:0}};
const land=new THREE.Mesh(new THREE.SphereGeometry(1.5006,256,128),new THREE.ShaderMaterial({uniforms:LU,transparent:true,depthWrite:false,
vertexShader:`varying vec2 vu;varying vec3 q,wn;void main(){vu=uv;q=normalize(position);wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:NO+`uniform sampler2D bt,ft;uniform vec3 rc,sun;uniform float rv,pm,pa;varying vec2 vu;varying vec3 q,wn;
void main(){vec4 b=texture2D(bt,vu),f=texture2D(ft,vu);float d=acos(clamp(dot(q,rc),-1.,1.));
float w=pm>.5?pa:smoothstep(rv,rv-.04,d);vec3 fc=pm>.5?vec3(1.,.9,.2):f.rgb;float fa=f.a*w;
vec4 c=vec4(mix(b.rgb,fc,fa/max(b.a+fa-b.a*fa,1e-3)),b.a+fa-b.a*fa);if(c.a<.02)discard;
float dif=max(dot(wn,sun),0.);vec3 col=pow(c.rgb,vec3(2.2))*(.22+1.*smoothstep(-.1,.35,dot(wn,sun)));
if(pm<.5){float edge=smoothstep(rv-.04,rv,d)*smoothstep(rv+.02,rv-.01,d)*f.a;col+=vec3(1.,.85,.5)*edge*1.5;}
gl_FragColor=vec4(pow(col,vec3(1./2.2)),c.a);}`}));land.renderOrder=1;G.add(land);
// three.js sphere uv: u=0 at lon=-180 (x=-1?) -> equirect: u=(lon+180)/360, v=(lat+90)/180 flipped for canvas
const eq=(w,h)=>d3.geoEquirectangular().scale(w/(2*Math.PI)).translate([w/2,h/2]).precision(.1);
const PAL={"Africa":["#c9a86a","#a3925a"],"Asia":["#a9a46e","#8f9a62"],"Europe":["#7f9a5e","#6d8a52"],"North America":["#8ea062","#7b9156"],"South America":["#6f9a55","#5f8a4a"],"Oceania":["#c7a26a","#b49460"],"Antarctica":["#eef2f4","#dde5ea"],"Europe/Asia":["#8f9c62","#7f8e58"]};
const WTI=new Image();WTI.src='pieces_world.jpg';await WTI.decode().catch(()=>{});
function paint(ctx,w,h,f,cont,glow){const pr=eq(w,h),gp=d3.geoPath(pr,ctx);const pal=PAL[cont]||["#9a9a70","#888"];
 ctx.save();ctx.beginPath();gp(f);ctx.clip();const b=gp.bounds(f);
 const g=ctx.createLinearGradient(0,b[0][1],0,b[1][1]);g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);ctx.fillStyle=g;ctx.fillRect(b[0][0]-2,b[0][1]-2,b[1][0]-b[0][0]+4,b[1][1]-b[0][1]+4);if(WTI.complete&&WTI.naturalWidth)ctx.drawImage(WTI,0,0,w,h);
 // soft stylised relief speckle (deterministic) for a Civ-like painted look
 const n=Math.min(4000,((b[1][0]-b[0][0])*(b[1][1]-b[0][1])/(w>3000?90:40))|0);let s=f.name.length*977;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 for(let i=0;i<n;i++){const x=b[0][0]+rnd()*(b[1][0]-b[0][0]),y=b[0][1]+rnd()*(b[1][1]-b[0][1]);ctx.fillStyle=rnd()<.5?'rgba(255,250,220,.04)':'rgba(30,40,10,.05)';ctx.beginPath();ctx.arc(x,y,1+rnd()*3*(w/4096),0,7);ctx.fill();}
 ctx.restore();ctx.beginPath();gp(f);ctx.lineWidth=w/4096*.5;ctx.strokeStyle='rgba(40,30,15,.16)';ctx.stroke();}
const sv=(lo,la)=>{lo=THREE.MathUtils.degToRad(lo);la=THREE.MathUtils.degToRad(la);return new THREE.Vector3(Math.cos(la)*Math.sin(lo),Math.sin(la),Math.cos(la)*Math.cos(lo))};
// three SphereGeometry: x=-cos(phi)sin(theta)... u=0 maps to lon -180 with our sv() convention? check: geometry x=-cos(u*2pi)*sin(v), z=sin(u*2pi)*sin(v)
// our sv: lon=0 -> +z. In SphereGeometry +z at u=.25 -> lon(u)=(u-.25)*360 => rotate land so u=.5 is lon 0: rotation.y=-PI/2
land.rotation.y=-Math.PI/2;
// ---- Brazil detailed patch (look 3) ----
const sh=await (await fetch(P+'shape.json')).json();const [x0,x1,y0,y1]=sh.bbox;
const L=new THREE.TextureLoader(),tx=n=>{const t=L.load(P+n);t.anisotropy=8;return t};
const map=tx('c3.jpg');map.colorSpace=THREE.SRGBColorSpace;const mask=tx('mask.png'),hgt=tx('height.png');
const PU={...U,map:{value:map},mask:{value:mask},hgt:{value:hgt},bb:{value:new THREE.Vector4(x0,y0,x1,y1)},vex:{value:.03},lift:{value:.004},rv:{value:0},
 cut:{value:[0,1,2,3].map(()=>new THREE.Vector4())},con:{value:[0,0,0,0]},ct:{value:[0,1,2,3].map(()=>null)},cb:{value:[0,1,2,3].map(()=>new THREE.Vector4(0,0,1,1))},cw:{value:[0,0,0,0]}};
const bmat=new THREE.ShaderMaterial({uniforms:PU,
vertexShader:`uniform float vex,lift;uniform vec4 bb;uniform sampler2D hgt;varying vec2 vu;varying vec3 wn;
void main(){vu=uv;float lon=mix(bb.x,bb.z,uv.x),lat=mix(bb.y,bb.w,uv.y);float hh=texture2D(hgt,uv).r;hh*=hh;float la=radians(lat),lo=radians(lon);
vec3 s=vec3(cos(la)*sin(lo),sin(la),cos(la)*cos(lo));wn=normalize(mat3(modelMatrix)*s);gl_Position=projectionMatrix*modelViewMatrix*vec4(s*(1.5+lift+hh*vex),1.);}`,
fragmentShader:NO+`uniform vec4 bb;uniform vec4 cut[4];uniform float con[4];uniform sampler2D ct[4];uniform vec4 cb[4];uniform float cw[4];uniform float rv;uniform vec3 sun;uniform sampler2D map,mask;varying vec2 vu;varying vec3 wn;
float nz(vec2 p){return .5*sin(p.x*7.1+p.y*3.3)+.3*sin(-p.x*4.3+p.y*9.7+1.3)+.2*sin(p.x*13.+p.y*11.+2.);}
float ell(vec2 L,vec4 b,float k){vec2 c=(b.xy+b.zw)*.5,h=(b.zw-b.xy)*.5;return length((L-c)/h)+k*nz(L);}
void main(){if(texture2D(mask,vu).r<.5)discard;float rd=length(vu-.5)*1.42;if(rd>rv)discard;vec2 LL=vec2(mix(bb.x,bb.z,vu.x),mix(bb.y,bb.w,vu.y));for(int i=0;i<4;i++){if(con[i]>.5&&ell(LL,cut[i],.12)<.48)discard;}
vec3 mp=pow(texture2D(map,vu).rgb,vec3(2.2));
#pragma unroll_loop_start
for(int i=0;i<4;i++){if(cw[i]>0.){float e=ell(LL,cb[i],.12);vec2 cu=(LL-cb[i].xy)/(cb[i].zw-cb[i].xy);
 if(e<1.){vec3 cc=pow(texture2D(ct[i],cu).rgb,vec3(2.2));mp=mix(mp,cc,(1.-smoothstep(.45,1.,e))*cw[i]);}
 float nd=(1.-smoothstep(.8,1.8,e))*cw[i];mp*=mix(1.,.86+.28*n(vec3(LL*260.,0.))*n(vec3(LL*41.,3.)),nd*.5);}}
#pragma unroll_loop_end
float dif=max(dot(normalize(wn),sun),0.);vec3 c=mp*(.22+1.*smoothstep(-.1,.35,dot(normalize(wn),sun)))+vec3(1.,.85,.5)*smoothstep(rv-.05,rv,rd)*(rv<1.4?1.2:0.);gl_FragColor=vec4(pow(c,vec3(1./2.2)),1.);}`});
const brazil=new THREE.Mesh(new THREE.PlaneGeometry(1,1,260,260),bmat);brazil.frustumCulled=false;brazil.visible=false;brazil.renderOrder=2;G.add(brazil);

// ---- rest of South America: one continent-wide look-3 patch, countries switched on by id (hair-thin shared borders) ----
const SAP='previews/south-america/';const SAN=await (await fetch(SAP+'ids.json')).json();
const ltx=(n,near)=>{const t=new THREE.TextureLoader().load(SAP+n);if(near){t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false}else t.anisotropy=8;return t};
const smap=ltx('c3.jpg');smap.colorSpace=THREE.SRGBColorSpace;
const SU={sun:U.sun,map:{value:smap},hgt:{value:ltx('height.png')},ids:{value:ltx('ids.png',true)},bb:{value:new THREE.Vector4(-82,-56,-34,13)},vex:PU.vex,lift:PU.lift,
 on:{value:new Array(16).fill(0)},rid:{value:-1},rc:{value:new THREE.Vector3()},rr:{value:0},px:{value:new THREE.Vector2(1/1325,1/2048)}};
const smat=new THREE.ShaderMaterial({uniforms:SU,
vertexShader:`uniform float vex,lift;uniform vec4 bb;uniform sampler2D hgt;varying vec2 vu;varying vec3 wn,s;
void main(){vu=uv;float lon=mix(bb.x,bb.z,uv.x),lat=mix(bb.y,bb.w,uv.y);float hh=texture2D(hgt,uv).r;hh*=hh;float la=radians(lat),lo=radians(lon);
s=vec3(cos(la)*sin(lo),sin(la),cos(la)*cos(lo));wn=normalize(mat3(modelMatrix)*s);gl_Position=projectionMatrix*modelViewMatrix*vec4(s*(1.5+lift+hh*vex),1.);}`,
fragmentShader:`uniform sampler2D map,ids;uniform float on[16];uniform float rid,rr;uniform vec3 rc,sun;uniform vec2 px;varying vec2 vu;varying vec3 wn,s;
int idAt(vec2 u){return int(texture2D(ids,u).r*255.+.5);}
void main(){int id=idAt(vu);if(id==0||id==3||on[id]<.5)discard;float d=acos(clamp(dot(normalize(s),rc),-1.,1.));bool rev=float(id)==rid;if(rev&&d>rr)discard;
vec3 mp=pow(texture2D(map,vu).rgb,vec3(2.2));
int a=idAt(vu+vec2(px.x,0.)),b=idAt(vu-vec2(px.x,0.)),c=idAt(vu+vec2(0.,px.y)),e=idAt(vu-vec2(0.,px.y));
float bd=((a!=id&&a!=0)||(b!=id&&b!=0)||(c!=id&&c!=0)||(e!=id&&e!=0))?1.:0.;mp=mix(mp,mp*.45,bd*.55);
float dif=max(dot(normalize(wn),sun),0.);vec3 col=mp*(.22+1.*smoothstep(-.1,.35,dot(normalize(wn),sun)));if(rev)col+=vec3(1.,.85,.5)*smoothstep(rr-.05,rr,d)*1.2;
gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);}`});
const sapatch=new THREE.Mesh(new THREE.PlaneGeometry(1,1,500,760),smat);sapatch.frustumCulled=false;sapatch.renderOrder=2;sapatch.visible=false;G.add(sapatch);
const saId=n=>SAN.indexOf(n)+1;
const LBL=await (await fetch(SAP+'labels.json')).json();const lblBox=document.createElement('div');lblBox.id='g3labels';host.appendChild(lblBox);
for(const l of LBL){l.el=document.createElement('div');l.el.className='g3lbl';l.el.textContent=l.n;lblBox.appendChild(l.el);l.v=sv(l.lon,l.lat).multiplyScalar(1.51);}
// label width budget: approx on-screen E-W extent of each country (km) at its label point; text never wider than its country
const AREA={Brazil:8.5,Argentina:2.78,Peru:1.29,Colombia:1.14,Bolivia:1.1,Venezuela:.92,Chile:.76,Paraguay:.41,Ecuador:.28,Guyana:.21,Uruguay:.18,Suriname:.16,"Fr. Guiana":.08,"Falkland Is.":.012};
const WKM={Brazil:3000,Argentina:1050,Peru:1000,Colombia:1000,Bolivia:950,Venezuela:1100,Chile:260,Paraguay:600,Ecuador:550,Guyana:380,Uruguay:430,Suriname:360,"Fr. Guiana":230,"Falkland Is.":220};
LBL.sort((a,b)=>(AREA[b.n]||0)-(AREA[a.n]||0));
const LW=new THREE.Vector3();function labels(){if(lblBox.hidden)return;const r=R.domElement.getBoundingClientRect(),hr=host.getBoundingClientRect();
 const ppu=r.height/2/Math.tan(C.fov*Math.PI/360)/Math.max(.02,C.position.length()-1.5);const boxes=[];
 for(const l of LBL){LW.copy(l.v).applyMatrix4(G.matrixWorld);
 const vis=LW.clone().normalize().dot(C.position.clone().sub(LW).normalize())>.05;const p=LW.project(C);
 const cpx=(WKM[l.n]||200)/6371*1.5*ppu*.85,fs=Math.min(22,cpx/(l.n.length*.62));
 const x=r.left-hr.left+(p.x+1)/2*r.width,y=r.top-hr.top+(1-p.y)/2*r.height,w=l.n.length*fs*.62+4,h=fs+3;
 let ok=vis&&p.z<1&&fs>=8&&(!window.G3||!G3.labelOk||G3.labelOk(l.n));if(ok)for(const b of boxes)if(Math.abs(b[0]-x)*2<b[2]+w&&Math.abs(b[1]-y)*2<b[3]+h){ok=false;break}
 if(ok)boxes.push([x,y,w,h]);l.el.style.display=ok?'':'none';l.el.style.fontSize=fs.toFixed(1)+'px';
 l.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;}}
// ---- city streaming (LOD + activity gating) ----
const KM=1.5/6371;let brPlaced=false;const CS=(CITIES.BR||[]).map((c,i)=>({...c,base:c.base.replace('../','previews/'),i,state:'idle',obj:null}));
for(const c of CS){c.up=sv(c.lon,c.lat);c.pos=c.up.clone().multiplyScalar(1.5+.004+.00004);}
async function load(c){c.state='loading';try{const o=await loadCity(c.base,c.prefix,{walls:false,shadows:false,edgeCull:.06,fade:true,sun,surround:true,featherMap:true,noWater:true,instances:true});
 if(c.state!=='loading'){o.dispose();return}const lo=THREE.MathUtils.degToRad(c.lon);const east=new THREE.Vector3(Math.cos(lo),0,-Math.sin(lo)),south=new THREE.Vector3().crossVectors(east,c.up);
 o.root.matrixAutoUpdate=false;o.root.matrix.makeBasis(east,c.up,south).scale(new THREE.Vector3(KM*10,KM*10,KM*10)).setPosition(c.pos);G.add(o.root);
 const sb=o.sur?o.sur.userData:{bbox:o.meta.bbox,tex:o.tex};const[L0,L1,A0,A1]=sb.bbox;PU.cut.value[c.i].set(L0,A0,L1,A1);PU.ct.value[c.i]=sb.tex;PU.cb.value[c.i].set(L0,A0,L1,A1);c.obj=o;c.state='ready';}catch(e){console.error(e);c.state='idle'}}
function unload(c){PU.cw.value[c.i]=0;PU.ct.value[c.i]=null;if(c.obj){c.obj.dispose();c.obj=null}PU.con.value[c.i]=0;c.state='idle'}
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const TG=new THREE.Vector3(),UP=new THREE.Vector3(),YY=new THREE.Vector3(0,1,0),VD=new THREE.Vector3(),wp=new THREE.Vector3();
function tilt(alt){const k=brPlaced?ss(.06,.02,alt):0;C.getWorldDirection(VD);const o=C.position,b=o.dot(VD),r=1.5+PU.lift.value+.000005,cc=o.lengthSq()-r*r,disc=b*b-cc;
 let Pt;if(disc>0)Pt=o.clone().addScaledVector(VD,-b-Math.sqrt(disc));else Pt=o.clone().normalize().multiplyScalar(r);
 TG.set(0,0,0).lerp(Pt,k);O.target.copy(TG);UP.copy(YY).lerp(Pt.clone().normalize(),k).normalize();C.up.copy(UP);
 O._quat.setFromUnitVectors(C.up,YY);O._quatInverse.copy(O._quat).invert();
 O.minDistance=brPlaced?1.5055*(1-k)+.00012*k:1.62;O.maxPolarAngle=Math.PI-(Math.PI-1.38)*k;}
const FR=new THREE.Frustum(),PM=new THREE.Matrix4(),CW=new THREE.Vector3(),SPH=new THREE.Sphere();
function lod(){C.updateMatrixWorld();FR.setFromProjectionMatrix(PM.multiplyMatrices(C.projectionMatrix,C.matrixWorldInverse));const dist=C.position.length(),alt=dist-1.5;
 O.rotateSpeed=Math.min(1,Math.max(.02,alt/1.2));O.zoomSpeed=Math.min(1,Math.max(.35,alt*2));atm.visible=alt>.08;
 PU.vex.value=.03+(.00113-.03)*ss(.25,.04,alt);tilt(alt);C.near=Math.max(alt*.3,.00003);const hz=Math.sqrt(Math.max(dist*dist-2.25,0));C.far=Math.min(dist+2.5,hz*1.3+.02);
 PU.lift.value=.00002+.00398*ss(.25,1.,alt);land.scale.setScalar(1+Math.min(PU.lift.value*.15,.0004)/1.5);
 let far=Math.min(dist+2.5,hz*1.3+.02);if(alt>.45)far=Math.max(far,96);C.far=far;C.updateProjectionMatrix();bg.position.copy(C.position);bg.scale.setScalar(C.far*.9/100);
 if(!brPlaced)return;
 for(const c of CS){c.pos.copy(c.up).multiplyScalar(1.5+PU.lift.value+.00003);if(c.obj)c.obj.root.matrix.setPosition(c.pos);
  wp.copy(c.pos).applyMatrix4(G.matrixWorld);const d=C.position.distanceTo(wp);
  if(c.state==='idle'&&d<.16)load(c);if(c.state!=='idle'&&d>.3)unload(c);
  if(c.obj){const a=ss(.1,.05,d),da=ss(.04,.022,d);c.obj.setFade(a,da);const inV=FR.intersectsSphere(SPH.set(wp,.03));c.active=inV&&d<.05;c.obj.root.visible=inV||d<.02;if(c.active)c.obj.tick(performance.now()/1000);
   if(c.obj.inst){c.obj.root.updateMatrixWorld(true);for(const k of c.obj.inst.chunks){let v=false;if(c.active){CW.copy(k.c).applyMatrix4(c.obj.root.matrixWorld);const dd=C.position.distanceTo(CW);v=dd<(k.kind==='t'?.0065:.0055)+k.r*KM*10&&FR.intersectsSphere(SPH.set(CW,k.r*KM*10))}if(v&&!k.built){k.build();k.built=true}k.g.visible=v}}
   if(d<.02){c.obj.root.updateMatrixWorld(true);const Lc=c.obj.root.worldToLocal(C.position.clone());let h=c.obj.sAt?c.obj.sAt(Lc.x,Lc.z):0;const hx=c.obj.meta.WX/2,hz2=c.obj.meta.HZ/2;
    if(Math.abs(Lc.x)<hx&&Math.abs(Lc.z)<hz2)h=Math.max(h,c.obj.hAt(Lc.x,Lc.z));h=Math.max(h,0);if(Lc.y<h+.04){Lc.y=h+.04;C.position.copy(c.obj.root.localToWorld(Lc))}}
   PU.con.value[c.i]=a>.55?1:0;PU.cw.value[c.i]=ss(.16,.09,d)}}}
// ---- sound ----
let AC=null;function doosh(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const A=AC,T=A.currentTime;
const len=A.sampleRate*1.2,b=A.createBuffer(1,len,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);
const s=A.createBufferSource();s.buffer=b;const f=A.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(2500,T);f.frequency.exponentialRampToValueAtTime(120,T+.9);
const g=A.createGain();g.gain.setValueAtTime(.0001,T);g.gain.exponentialRampToValueAtTime(.8,T+.04);g.gain.exponentialRampToValueAtTime(.001,T+1.1);s.connect(f).connect(g).connect(A.destination);s.start();
const o=A.createOscillator(),og=A.createGain();o.frequency.setValueAtTime(110,T);o.frequency.exponentialRampToValueAtTime(38,T+.5);og.gain.setValueAtTime(.6,T);og.gain.exponentialRampToValueAtTime(.001,T+.6);o.connect(og).connect(A.destination);o.start();o.stop(T+.7);}catch(_){}}
// ---- animation helpers ----
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;let anims=[];const anim=(ms,fn)=>new Promise(r=>{const t0=performance.now();anims.push(now=>{const x=Math.min(1,(now-t0)/ms);fn(x);if(x>=1){r();return true}})});
let queue=Promise.resolve();
function reveal(f,cont,muted){queue=queue.then(async()=>{if(!muted)doosh();
 if(f.name==='Brazil'){brazil.visible=true;brPlaced=true;await anim(1600,x=>PU.rv.value=ease(x)*1.45);PU.rv.value=2;return}
 const si=saId(f.name);if(si>0){sapatch.visible=true;SU.on.value[si]=1;if(f.name!=='France'){SU.rid.value=si;SU.rc.value.copy(sv(f.c[0],f.c[1]));const mr=f.rad*2.2+.05;await anim(1300,x=>SU.rr.value=ease(x)*mr);SU.rid.value=-1;return}}
 fctx.clearRect(0,0,2048,1024);paint(fctx,2048,1024,f,cont);freshT.needsUpdate=true;LU.pm.value=0;LU.rc.value.copy(sv(f.c[0],f.c[1]));const maxR=f.rad*2.2+.05;
 await anim(1300,x=>LU.rv.value=ease(x)*maxR);paint(bctx,TW,TH,f,cont);baseT.needsUpdate=true;fctx.clearRect(0,0,2048,1024);freshT.needsUpdate=true;LU.rv.value=0;});return queue}
function placeNow(f,cont){if(f.name==='Brazil'){brazil.visible=true;brPlaced=true;PU.rv.value=2;return}const si=saId(f.name);if(si>0){sapatch.visible=true;SU.on.value[si]=1;if(f.name!=='France')return}paint(bctx,TW,TH,f,cont);baseT.needsUpdate=true;}
function clear(){SU.on.value.fill(0);sapatch.visible=false;bctx.clearRect(0,0,TW,TH);baseT.needsUpdate=true;brazil.visible=false;brPlaced=false;PU.rv.value=0;for(const c of CS)unload(c);}
let pulseEnd=0;function pulse(f,ms){fctx.clearRect(0,0,2048,1024);const pr=eq(2048,1024),gp=d3.geoPath(pr,fctx);fctx.beginPath();gp(f);fctx.fillStyle='#fff';fctx.fill();fctx.lineWidth=6;fctx.strokeStyle='#fff';fctx.stroke();freshT.needsUpdate=true;LU.pm.value=1;pulseEnd=performance.now()+ms;}
// camera
function camDist(){return C.position.distanceTo(O.target.lengthSq()>1?O.target.clone().multiplyScalar(0):O.target)}
function spinTo(c,zoom){const p0=C.position.clone(),d0=p0.length(),d1=zoom?Math.max(1.75,6.2/zoom):d0;O.target.set(0,0,0);
 // turn the globe (not the camera) so the place faces the viewer and stays on the sunlit side
 const q0=G.quaternion.clone(),cur=sv(c[0],c[1]).applyQuaternion(q0),q1=new THREE.Quaternion().setFromUnitVectors(cur,p0.clone().normalize()).multiply(q0);
 {const cd=p0.clone().normalize(),nU=new THREE.Vector3(0,1,0).applyQuaternion(q1).projectOnPlane(cd),cU=C.up.clone().projectOnPlane(cd);if(nU.lengthSq()>1e-6&&cU.lengthSq()>1e-6){nU.normalize();cU.normalize();
  const ang=Math.atan2(new THREE.Vector3().crossVectors(nU,cU).dot(cd),nU.dot(cU));q1.premultiply(new THREE.Quaternion().setFromAxisAngle(cd,ang));}}
 return anim(1000,x=>{const e=ease(x);G.quaternion.slerpQuaternions(q0,q1,e);C.position.setLength(d0+(d1-d0)*e)})}
function zoomBy(k){const d=C.position.length();const nd=Math.min(O.maxDistance,Math.max(1.5+(d-1.5)/k,brPlaced?1.505:1.62));C.position.setLength(nd);}
const rc=new THREE.Raycaster(),mv=new THREE.Vector2(),SP=new THREE.Sphere(new THREE.Vector3(),1.5);
function pick(x,y){const r=R.domElement.getBoundingClientRect();mv.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);rc.setFromCamera(mv,C);const p=new THREE.Vector3();if(!rc.ray.intersectSphere(SP,p))return null;
 const q=p.normalize().applyQuaternion(G.quaternion.clone().invert());return [THREE.MathUtils.radToDeg(Math.atan2(q.x,q.z)),THREE.MathUtils.radToDeg(Math.asin(q.y))]}
function screenRadius(){const r=R.domElement.getBoundingClientRect();const d=Math.max(C.position.length(),1.5001);return (r.height/2)/Math.tan(THREE.MathUtils.degToRad(C.fov/2))*1.5/Math.sqrt(d*d-2.25)}
function resize(){const r=host.getBoundingClientRect();C.aspect=r.width/Math.max(1,r.height);C.updateProjectionMatrix();R.setSize(r.width,r.height);}
let grab=null;const GQ=new THREE.Quaternion(),AX=new THREE.Vector3(),RT=new THREE.Vector3(),UPV=new THREE.Vector3();
R.domElement.addEventListener('pointerdown',e=>{if(window.__claimPiece&&window.__claimPiece(e)){grab=null;return}const alt=C.position.length()-1.5;if(e.button!==0||alt<.06||!pick(e.clientX,e.clientY)){grab=null;return}
 grab={x:e.clientX,y:e.clientY,id:e.pointerId};O.enabled=false;try{R.domElement.setPointerCapture(e.pointerId)}catch(_){}},{capture:true});
addEventListener('pointermove',e=>{if(!grab||e.pointerId!==grab.id)return;const dx=e.clientX-grab.x,dy=e.clientY-grab.y;grab.x=e.clientX;grab.y=e.clientY;
 const h=R.domElement.clientHeight||800,k=1/Math.max(50,screenRadius());
 UPV.copy(C.up).normalize();RT.setFromMatrixColumn(C.matrixWorld,0);GQ.setFromAxisAngle(UPV,dx*k);G.quaternion.premultiply(GQ);GQ.setFromAxisAngle(RT,dy*k);G.quaternion.premultiply(GQ);});
const endGrab=e=>{if(grab&&e.pointerId===grab.id){grab=null;O.enabled=true}};addEventListener('pointerup',endGrab);addEventListener('pointercancel',endGrab);
addEventListener('resize',resize);resize();
R.setAnimationLoop(now=>{U.t.value=now/1000;anims=anims.filter(a=>!a(now));if(LU.pm.value>.5){LU.pa.value=now<pulseEnd?.35+.35*Math.sin(now/150):0;if(now>=pulseEnd){LU.pm.value=0;fctx.clearRect(0,0,2048,1024);freshT.needsUpdate=true}}
 O.update();lod();if(skyNear.visible)sunBoard.lookAt(C.position);labels();R.render(S,C);});
function setBg(i){U.bg.value=i;skyNear.visible=i<0.5;}
const KMv=KM;function zoomRio(alt){const c=CS[0];const n=c.up.clone().applyQuaternion(G.quaternion);const T=n.clone().multiplyScalar(1.5+PU.lift.value);if(alt>=.06){O.target.set(0,0,0);C.position.copy(n.multiplyScalar(1.5+alt));C.lookAt(0,0,0);return}
 O.target.copy(T);O.minDistance=.00012;O.maxPolarAngle=1.38;C.up.copy(n);const s=new THREE.Vector3(0,-1,0).projectOnPlane(n).normalize();C.position.copy(T).addScaledVector(n,alt).addScaledVector(s,alt*.6);C.lookAt(T);O.update();}
function project(lo,la){const v=sv(lo,la).multiplyScalar(1.5).applyMatrix4(G.matrixWorld).project(C);const r=R.domElement.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]}

// ---- curved pieces: parked/anchor pieces are sphere patches built in the country's own orthographic frame (same lon/lat->sphere mapping as the globe),
// so a piece with scale 1 and angle 0 at its true centre lies exactly on its painted outline. Rigid rotation on the sphere moves it elsewhere.
const PCS={};const PR=1.5*1.002;
function pcGeom(h,s){const N=40,pos=[],uv=[],idx=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const u=-h+2*h*i/N,v=-h+2*h*j/N;let r=Math.hypot(u,v);
  let th=Math.asin(Math.min(1,r))*s;th=Math.min(th,Math.PI*.98);const k=r>1e-9?Math.sin(th)/r:s;pos.push(u*k*PR,v*k*PR,Math.cos(th)*PR);uv.push(i/N,j/N);}
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;idx.push(a,b,d,a,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;}
function pcAdd(id,canvas,h){pcDel(id);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
 const m=new THREE.Mesh(pcGeom(h,1),new THREE.ShaderMaterial({uniforms:{map:{value:t},op:{value:1},sun:U.sun},transparent:true,depthWrite:false,depthTest:true,polygonOffset:true,polygonOffsetFactor:-4,
 vertexShader:`varying vec2 vu;varying vec3 wn;void main(){vu=uv;wn=normalize(mat3(modelMatrix)*normalize(position));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D map;uniform float op;uniform vec3 sun;varying vec2 vu;varying vec3 wn;void main(){vec4 c=texture2D(map,vu);if(c.a<.02)discard;vec3 N=normalize(wn);float l=dot(N,sun);
 vec3 col=pow(c.rgb,vec3(2.2))*(.22+1.*smoothstep(-.1,.35,l))+vec3(1.,.95,.85)*pow(max(dot(N,normalize(sun+vec3(0.,0.,1.))),0.),60.)*.08*smoothstep(0.,.3,l);gl_FragColor=vec4(pow(col,vec3(1./2.2)),c.a*op);}`}));m.renderOrder=5;m.userData.pid=id;
 const hold=new THREE.Group();hold.add(m);G.add(hold);PCS[id]={hold,m,h,s:1,rad:PR};}
const _e=new THREE.Vector3(),_n=new THREE.Vector3(),_u=new THREE.Vector3(),_M=new THREE.Matrix4(),_Q=new THREE.Quaternion();
function pcSet(id,o){const P=PCS[id];if(!P)return;if(o.s!=null&&Math.abs(o.s-P.s)>1e-4){P.m.geometry.dispose();P.m.geometry=pcGeom(P.h,o.s);P.s=o.s;}
 const lo=THREE.MathUtils.degToRad(o.lon);_n.copy(sv(o.lon,o.lat));_e.set(Math.cos(lo),0,-Math.sin(lo));_u.crossVectors(_n,_e);_M.makeBasis(_e,_u,_n);P.hold.quaternion.setFromRotationMatrix(_M);
 const rad=o.rad||PR;P.hold.scale.setScalar(rad/PR);P.rad=rad;
 P.m.rotation.z=-THREE.MathUtils.degToRad(o.a||0);if(o.op!=null)P.m.material.uniforms.op.value=o.op;P.hold.visible=o.vis!==false;}
function pcDel(id){const P=PCS[id];if(!P)return;G.remove(P.hold);P.m.geometry.dispose();P.m.material.uniforms.map.value.dispose();P.m.material.dispose();delete PCS[id];}
function pcHas(id){return !!PCS[id];}
function pcInfo(id){const P=PCS[id];if(!P)return null;return {vis:!!P.hold.visible,rad:P.rad||PR};}
let OL=null;function outline(f){if(OL){G.remove(OL);OL.geometry.dispose();OL=null}if(!f)return;const pts=[];const geo=f.geometry;const polys=geo.type=='Polygon'?[geo.coordinates]:geo.coordinates;
 for(const p of polys)for(const ring of p){for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1],n=Math.max(1,Math.ceil(d3.geoDistance(a,b)/0.01));const it=d3.geoInterpolate(a,b);
  for(let k=0;k<n;k++){pts.push(sv(...it(k/n)).multiplyScalar(PR*1.001),sv(...it((k+1)/n)).multiplyScalar(PR*1.001));}}}
 OL=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffe7a8,transparent:true,depthWrite:false}));OL.renderOrder=6;G.add(OL);}
function outlineOp(o){if(OL)OL.material.opacity=o}
function offsetLon(d){G.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(d)));G.updateMatrixWorld();}
function facing(lo,la){const v=sv(lo,la).multiplyScalar(1.5).applyMatrix4(G.matrixWorld);return v.clone().normalize().dot(C.position.clone().sub(v).normalize())>.05}
function fogNow(f){const pr=eq(TW,TH),gp=d3.geoPath(pr,bctx);bctx.save();bctx.beginPath();gp(f);bctx.fillStyle='rgba(120,134,150,.92)';bctx.fill();bctx.lineWidth=Math.max(1,TW/4096);bctx.strokeStyle='rgba(225,232,240,.55)';bctx.stroke();bctx.restore();baseT.needsUpdate=true;}
function provNow(f,cont){paint(bctx,TW,TH,f,cont);const pr=eq(TW,TH),gp=d3.geoPath(pr,bctx);bctx.save();bctx.beginPath();gp(f);bctx.lineWidth=Math.max(1,TW/5000);bctx.strokeStyle='rgba(40,30,15,.45)';bctx.stroke();bctx.restore();baseT.needsUpdate=true;}
function occludedWorld(world){const O=C.position,d=world.clone().sub(O),dist=d.length();if(dist<1e-4)return false;d.multiplyScalar(1/dist);
 const b=O.dot(d),c0=O.lengthSq()-1.52*1.52,disc=b*b-c0;if(disc<0)return false;const tN=-b-Math.sqrt(disc);return tN>0.02&&tN<dist-0.03;}
function projectWorld(world){const p=world.clone().project(C),r=R.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height,z:p.z,occluded:occludedWorld(world)};}
function sampleBox(lon,lat,rad,h,drawS,angle){G.updateMatrixWorld(true);const n=sv(lon,lat),lo=THREE.MathUtils.degToRad(lon),e=new THREE.Vector3(Math.cos(lo),0,-Math.sin(lo)),north=new THREE.Vector3().crossVectors(n,e);
 const th=-THREE.MathUtils.degToRad(angle||0),ca=Math.cos(th),sa=Math.sin(th),sc=drawS==null?1:drawS,hh=h||0.05;
 const uv=[[0,0],[hh,hh],[hh,-hh],[-hh,hh],[-hh,-hh],[hh,0],[-hh,0],[0,hh],[0,-hh],[hh*.5,hh*.5],[-hh*.5,hh*.5],[hh*.5,-hh*.5],[-hh*.5,-hh*.5]];
 let any=false,minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;const pts=[];
 for(const [u0,v0] of uv){const u=u0*ca-v0*sa,v=u0*sa+v0*ca,r=Math.hypot(u,v);
  let ang=Math.asin(Math.min(1,r))*sc;ang=Math.min(ang,Math.PI*.98);const k=r>1e-9?Math.sin(ang)/r:sc;
  const dir=n.clone().multiplyScalar(Math.cos(ang)).addScaledVector(e,u*k).addScaledVector(north,v*k).normalize();
  const pr=projectWorld(dir.multiplyScalar(rad).applyMatrix4(G.matrixWorld));
  pts.push({x:pr.x,y:pr.y,occluded:pr.occluded||pr.z>1,u:u0,v:v0});
  if(pr.occluded||pr.z>1)continue;any=true;if(pr.x<minX)minX=pr.x;if(pr.x>maxX)maxX=pr.x;if(pr.y<minY)minY=pr.y;if(pr.y>maxY)maxY=pr.y;}
 return {anyVis:any,minX,minY,maxX,maxY,pts};}
function alphaAt(mesh,uv){const img=mesh.material&&mesh.material.uniforms&&mesh.material.uniforms.map&&mesh.material.uniforms.map.value&&mesh.material.uniforms.map.value.image;
 if(!img||!uv||!img.width)return 255;const ctx=img.getContext&&img.getContext('2d');if(!ctx)return 255;
 const px=Math.max(0,Math.min(img.width-1,uv.x*img.width|0)),py=Math.max(0,Math.min(img.height-1,(1-uv.y)*img.height|0));
 try{return ctx.getImageData(px,py,1,1).data[3];}catch(e){return 255;}}
function pickPiece(x,y){G.updateMatrixWorld(true);const r=R.domElement.getBoundingClientRect();mv.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);rc.setFromCamera(mv,C);
 const hits=rc.intersectObjects(Object.values(PCS).map(P=>P.m),false).sort((a,b)=>a.distance-b.distance);
 for(const h of hits){const sp=new THREE.Vector3();if(rc.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(),1.52),sp)&&sp.distanceTo(C.position)<h.distance-0.02)continue;
  if(alphaAt(h.object,h.uv)<16)continue;return h.object.userData.pid||null;}
 return null;}
function viewDirLocal(){const w=C.position.clone().normalize().applyQuaternion(G.quaternion.clone().invert());return {x:w.x,y:w.y,z:w.z};}
window.G3={fog:fogNow,provNow,pc:{add:pcAdd,set:pcSet,del:pcDel,has:pcHas,info:pcInfo},outline,outlineOp,offsetLon,facing,labels:on=>{lblBox.hidden=!on},grabbing:()=>!!grab,quat:()=>G.quaternion.toArray(),setQuat:q=>{G.quaternion.fromArray(q);G.updateMatrixWorld();},cam:()=>({p:C.position.toArray(),t:O.target.toArray()}),setCam:c=>{C.position.fromArray(c.p);O.target.fromArray(c.t);O.update();},project,reveal,placeNow,clear,pulse,spinTo,zoomBy,pick,screenRadius,setBg,doosh,zoomRio,dom:R.domElement,cityState:()=>CS.map(c=>c.state),alt:()=>(C.position.length()-1.5)/KMv,shot:()=>{O.update();lod();R.render(S,C);return R.domElement.toDataURL('image/jpeg',.85)},sampleBox,pickPiece,viewDirLocal,C,O};
window.dispatchEvent(new Event('g3ready'));
