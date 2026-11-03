// High-detail city diorama loader (shared by the showcase page and the globe zoom).
// Local frame: origin = bbox centre at sea level, +x east, +y up, +z south. 1 unit = 10 km.
import * as THREE from 'three';
const ab=async f=>(await fetch(f)).arrayBuffer();
const PAL_ROOF=[[.62,.30,.20],[.56,.27,.19],[.66,.36,.24],[.48,.24,.18],[.58,.40,.30]].map(c=>new THREE.Color().setRGB(...c,THREE.SRGBColorSpace));
function prism(){const g=new THREE.BufferGeometry();const v=[-.5,0,-.5, .5,0,-.5, .5,1,0, -.5,0,-.5, .5,1,0, -.5,1,0,  -.5,0,.5, -.5,1,0, .5,1,0, -.5,0,.5, .5,1,0, .5,0,.5,
 -.5,0,-.5, -.5,1,0, -.5,0,.5,  .5,0,-.5, .5,0,.5, .5,1,0];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g}
export async function loadCity(base,prefix,o={}){
 const {walls=true,shadows=false,feather=0,sun=new THREE.Vector3(-.6,.7,.4).normalize(),edgeCull=0,light=1}=o;
 const M=await (await fetch(base+prefix+'meta.json')).json();const {WX,HZ,GW,GH,U}=M;const [LO0,LO1,LA0,LA1]=M.bbox;
 const root=new THREE.Group();const G=new THREE.Group();G.position.set(-WX/2,0,-HZ/2);root.add(G);const disp=[];
 const q=new Uint16Array(await ab(base+prefix+'h.bin'));const H=new Float32Array(q.length);for(let i=0;i<q.length;i++)H[i]=(q[i]/50-60)*U;
 const hAt=(x,z)=>{const fx=Math.min(GW-1.001,Math.max(0,x/WX*(GW-1))),fz=Math.min(GH-1.001,Math.max(0,z/HZ*(GH-1)));const i=fx|0,j=fz|0,a=fx-i,b=fz-j,k=j*GW+i;
  return H[k]*(1-a)*(1-b)+H[k+1]*a*(1-b)+H[k+GW]*(1-a)*b+H[k+GW+1]*a*b};
 const ll=(lo,la)=>[(lo-LO0)/(LO1-LO0)*WX,(LA1-la)/(LA1-LA0)*HZ];
 const tl=new THREE.TextureLoader();const ld=f=>new Promise(r=>tl.load(base+prefix+f,r));
 const [tc,tn,tw]=await Promise.all([ld('c.jpg'),ld('n.jpg'),ld('w.png')]);tc.colorSpace=THREE.SRGBColorSpace;tc.anisotropy=8;tw.anisotropy=4;disp.push(tc,tn,tw);
 let am=null;if(feather>0){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const f=feather*256;
  const id=x.createImageData(256,256);for(let j=0;j<256;j++)for(let i=0;i<256;i++){const d=Math.min(i,j,255-i,255-j);const v=Math.max(0,Math.min(1,d/f));const s=v*v*(3-2*v)*255;const k=(j*256+i)*4;id.data[k]=id.data[k+1]=id.data[k+2]=s;id.data[k+3]=255}
  x.putImageData(id,0,0);am=new THREE.CanvasTexture(c);disp.push(am)}
 const mats=[];const mk=p=>{const m=new THREE.MeshStandardMaterial(p);if(feather>0||o.fade){m.alphaHash=true;m.transparent=false}mats.push(m);disp.push(m);return m};
 const tg=new THREE.PlaneGeometry(WX,HZ,GW-1,GH-1);tg.rotateX(-Math.PI/2);tg.translate(WX/2,0,HZ/2);const p=tg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,H[i]);tg.computeVertexNormals();disp.push(tg);
 const tm=mk({map:tc,normalMap:tn,normalScale:new THREE.Vector2(.6,.6),roughness:.92,alphaMap:am});
 const terr=new THREE.Mesh(tg,tm);terr.receiveShadow=shadows;G.add(terr);
 // optional surround: lower-res relief tile around the city, feathered into the host map
 let sur=null;if(o.surround){try{const SM=await (await fetch(base+prefix+'smeta.json')).json();const sq=new Uint16Array(await ab(base+prefix+'sh.bin'));
  const cl=(LO0+LO1)/2,ca=(LA0+LA1)/2,kx=Math.cos(ca*Math.PI/180)*11.132,kz=11.06,[s0,s1,a0,a1]=SM.bbox;
  const sg=new THREE.PlaneGeometry(1,1,SM.GW-1,SM.GH-1);const sp=sg.attributes.position;
  for(let j=0;j<SM.GH;j++)for(let i=0;i<SM.GW;i++){const k=j*SM.GW+i;const lo=s0+(i+.5)/SM.GW*(s1-s0),la=a1-(j+.5)/SM.GH*(a1-a0);
   const x=(lo-cl)*kx,z=(ca-la)*kz;sp.setXYZ(k,x,(sq[k]/50-60)*SM.U-.00002-(x*x+z*z)/1274.2,z)}
  sg.computeVertexNormals();disp.push(sg);const [sc,sa]=await Promise.all([ld('sc.jpg'),ld('sa.png')]);sc.colorSpace=THREE.SRGBColorSpace;sc.anisotropy=8;disp.push(sc,sa);
  const sm=mk({map:sc,alphaMap:sa,roughness:.95});sm.alphaHash=true;sur=new THREE.Mesh(sg,sm);sur.renderOrder=-1;root.add(sur);sur.userData={bbox:SM.bbox,tex:sc}}catch(e){console.warn('surround',e)}}
 // living water: depth-graded colour, animated normals, foam only along beaches
 const WU={etw:{value:o.edgeTint?1:0},etc:{value:new THREE.Color(...(o.edgeTint||[0,0,0]))},wt:{value:tw},t:{value:0},sun:{value:sun},fade:{value:1},fea:{value:feather}};
 const wmat=new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,
  vertexShader:`varying vec2 vu;varying vec3 wp,ex,ez,ey;void main(){vu=uv;wp=(modelMatrix*vec4(position,1.)).xyz;ex=normalize(mat3(modelMatrix)*vec3(1,0,0));ey=normalize(mat3(modelMatrix)*vec3(0,0,1));ez=cross(ex,ey);ez=normalize(mat3(modelMatrix)*vec3(0,1,0));gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
  fragmentShader:`uniform sampler2D wt;uniform float t,fade,fea,etw;uniform vec3 etc;uniform vec3 sun;varying vec2 vu;varying vec3 wp,ex,ez,ey;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){vec4 w=texture2D(wt,vec2(vu.x,1.-vu.y));if(w.r<.5)discard;float d=w.g;
  vec2 P=vu*vec2(900.,580.);float e=.6;
  float a0=n(P+vec2(t*.7,t*.4))+.5*n(P*2.1-vec2(t*.9,-t*.6));float ax=n(P+vec2(e,0)+vec2(t*.7,t*.4))+.5*n((P+vec2(e,0))*2.1-vec2(t*.9,-t*.6));float ay=n(P+vec2(0,e)+vec2(t*.7,t*.4))+.5*n((P+vec2(0,e))*2.1-vec2(t*.9,-t*.6));
  vec3 N=normalize(ez-(.10*(ax-a0)/e)*ex-(.10*(ay-a0)/e)*ey);
  vec3 sh=vec3(.11,.34,.32),md=vec3(.035,.19,.23),dp=vec3(.014,.075,.12);vec3 c=mix(sh,md,smoothstep(0.,.3,d));c=mix(c,dp,smoothstep(.25,1.,d));
  vec3 V=normalize(cameraPosition-wp);float fr=pow(1.-max(dot(N,V),0.),4.);vec3 Hh=normalize(sun+V);
  float sp=pow(max(dot(N,Hh),0.),220.)*1.4;c=c*(.55+.5*max(dot(N,sun),0.))+fr*vec3(.25,.33,.38)+sp*vec3(1.,.95,.85);
  float fo=w.b*(.55+.45*sin(t*1.6-w.b*9.+n(P*.5)*6.))*smoothstep(.35,.75,n(P*1.3+t*.3)+w.b*.5);c=mix(c,vec3(.9,.92,.9),clamp(fo,0.,1.)*.85);
  float al=mix(.42,.9,smoothstep(0.,.35,d));al=max(al,fo);
  float ed=min(min(vu.x,1.-vu.x),min(vu.y,1.-vu.y));if(etw>0.){float eb=1.-smoothstep(fea*.3,fea+.08,ed);c=mix(c,etc*(.4+.9*max(dot(N,sun),0.))+sp*vec3(1.,.95,.85)+fr*vec3(.05,.08,.12),eb);al=mix(al,1.,eb);}if(fea>0.)al*=smoothstep(0.,fea,ed);
  gl_FragColor=vec4(c,al*fade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});disp.push(wmat);
 const wg=new THREE.PlaneGeometry(WX,HZ);wg.rotateX(-Math.PI/2);disp.push(wg);const wat=new THREE.Mesh(wg,wmat);wat.position.set(WX/2,.00012,HZ/2);wat.renderOrder=2;G.add(wat);
 if(walls){const base=-.035,wm=mk({color:0xe9e1d2,roughness:.85,side:THREE.DoubleSide});
  const wall=pts=>{const g=new THREE.BufferGeometry(),v=[];for(let i=0;i<pts.length-1;i++){const[a,b]=[pts[i],pts[i+1]];const ha=Math.max(hAt(...a),0),hb=Math.max(hAt(...b),0);
   v.push(a[0],ha,a[1],a[0],base,a[1],b[0],hb,b[1],b[0],hb,b[1],a[0],base,a[1],b[0],base,b[1]);}g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();disp.push(g);G.add(new THREE.Mesh(g,wm))};
  const edge=f=>{const a=[];for(let i=0;i<=400;i++)a.push(f(i/400));return a};
  wall(edge(t=>[t*WX,0]));wall(edge(t=>[t*WX,HZ]));wall(edge(t=>[0,t*HZ]));wall(edge(t=>[WX,t*HZ]));
  const cap=new THREE.Mesh(new THREE.BoxGeometry(WX+.06,.02,HZ+.06),mk({color:0x3a2c22,roughness:.7}));cap.position.set(WX/2,base-.01,HZ/2);G.add(cap);disp.push(cap.geometry)}
 const inside=(x,z)=>edgeCull<=0||(x>WX*edgeCull&&x<WX*(1-edgeCull)&&z>HZ*edgeCull&&z<HZ*(1-edgeCull));
 const detail=new THREE.Group();G.add(detail);
 // buildings + roofs
 {const b=new Uint16Array(await ab(base+prefix+'b.bin'));const L=[WX,HZ,2*Math.PI,.01,.01,.03,1,1,1,1];const n=b.length/10;
  const rows=[];for(let i=0;i<n;i++){const r=k=>b[i*10+k]/65535*L[k];const x=r(0),z=r(1);if(inside(x,z))rows.push(i)}
  const bg=new THREE.BoxGeometry(1,1,1);bg.translate(0,.5,0);disp.push(bg);const im=new THREE.InstancedMesh(bg,mk({roughness:.8}),rows.length);
  const pr=prism();disp.push(pr);const ac=new THREE.BoxGeometry(1,1,1);ac.translate(0,.5,0);disp.push(ac);
  const roofs=[],acs=[];const m=new THREE.Matrix4(),qq=new THREE.Quaternion(),c=new THREE.Color(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3();
  let rnd=1;const R=()=>(rnd=(rnd*16807)%2147483647)/2147483647;
  rows.forEach((i,k)=>{const r=j=>b[i*10+j]/65535*L[j];const x=r(0),z=r(1),w=Math.max(r(3),.00025),d=Math.max(r(4),.00025),h=r(5),kd=r(9),ang=r(2);
   const y=hAt(x,z)-.0003;qq.setFromAxisAngle(Y,ang);m.compose(V.set(x,y,z),qq,S.set(w,h+.0003,d));im.setMatrixAt(k,m);
   c.setRGB(r(6),r(7),r(8),THREE.SRGBColorSpace);if(kd<.2&&h>.004)c.multiplyScalar(.9+R()*.15);im.setColorAt(k,c);
   const top=y+h+.0003;
   if(kd>.4&&kd<.6&&R()<.7)roofs.push([x,top,z,ang,w*1.04,Math.min(w,d)*.45,d*1.04]);
   else if(kd<.2&&h>.004){const nA=1+(R()*3|0);for(let a=0;a<nA;a++){const ox=(R()-.5)*w*.6,oz=(R()-.5)*d*.6;const cs=Math.cos(ang),sn=Math.sin(ang);
     acs.push([x+ox*cs+oz*sn,top,z-ox*sn+oz*cs,ang,w*(.12+R()*.15),.00025+R()*.0003,d*(.12+R()*.15)])}}});
  im.castShadow=im.receiveShadow=shadows;detail.add(im);
  const rm=new THREE.InstancedMesh(pr,mk({roughness:.75,flatShading:true}),roofs.length);roofs.forEach((a,k)=>{qq.setFromAxisAngle(Y,a[3]);m.compose(V.set(a[0],a[1],a[2]),qq,S.set(a[4],a[5],a[6]));rm.setMatrixAt(k,m);rm.setColorAt(k,c.copy(PAL_ROOF[k%5]).multiplyScalar(.92+R()*.16))});
  rm.castShadow=shadows;detail.add(rm);
  const am2=new THREE.InstancedMesh(ac,mk({color:0xbfbcb6,roughness:.6}),acs.length);acs.forEach((a,k)=>{qq.setFromAxisAngle(Y,a[3]);m.compose(V.set(a[0],a[1],a[2]),qq,S.set(a[4],a[5],a[6]));am2.setMatrixAt(k,m)});
  am2.castShadow=shadows;detail.add(am2)}
 // trees
 {const b=new Uint16Array(await ab(base+prefix+'t.bin'));const L=[WX,HZ,.003,255,255,255];const n=b.length/6;
  const ids=[];for(let i=0;i<n;i++)if(inside(b[i*6]/65535*WX,b[i*6+1]/65535*HZ))ids.push(i);
  const tg=new THREE.IcosahedronGeometry(1,0);tg.scale(1,1.15,1);tg.translate(0,.75,0);disp.push(tg);const im=new THREE.InstancedMesh(tg,mk({roughness:1,flatShading:true}),ids.length);
  const m=new THREE.Matrix4(),c=new THREE.Color(),qq=new THREE.Quaternion(),V=new THREE.Vector3(),S=new THREE.Vector3();
  ids.forEach((i,k)=>{const r=j=>b[i*6+j]/65535*L[j];const x=r(0),z=r(1),s=Math.max(r(2),.0003);m.compose(V.set(x,hAt(x,z)-s*.35,z),qq,S.set(s,s,s));im.setMatrixAt(k,m);c.setRGB(r(3)/255,r(4)/255,r(5)/255,THREE.SRGBColorSpace);im.setColorAt(k,c)});
  im.castShadow=shadows;im.receiveShadow=shadows;detail.add(im)}
 // bridges
 {const bm=mk({color:0xd8d2c6,roughness:.7});const bx=new THREE.BoxGeometry(1,1,1);disp.push(bx);
  for(const Ls of M.bridges)for(let i=0;i<Ls.length-1;i++){const[a,b]=[Ls[i],Ls[i+1]];const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<1e-6||!inside(a[0],a[1]))continue;
   const y=Math.max(hAt((a[0]+b[0])/2,(a[1]+b[1])/2),0)+.0012;const k=new THREE.Mesh(bx,bm);k.scale.set(len,.0004,.0018);
   k.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);k.rotation.y=-Math.atan2(dz,dx);k.castShadow=shadows;detail.add(k)}}
 // landmarks (Rio)
 if(prefix==='rio_'){const white=mk({color:0xf3efe6,roughness:.55});
  {const [x,z]=ll(-43.21055,-22.95192);const g=new THREE.Group();const add=(geo,px,py,pz)=>{const m=new THREE.Mesh(geo,white);m.position.set(px,py,pz);m.castShadow=shadows;g.add(m);disp.push(geo)};
   add(new THREE.BoxGeometry(.9,1,.9),0,.5,0);add(new THREE.CylinderGeometry(.32,.45,3,10),0,2.5,0);add(new THREE.BoxGeometry(3.4,.32,.32),0,3.65,0);add(new THREE.SphereGeometry(.27,10,8),0,4.2,0);
   g.position.set(x,hAt(x,z)-.0004,z);g.scale.setScalar(.0016);g.rotation.y=.35;detail.add(g)}
  {const st=[[-43.1647,-22.9554,.0012],[-43.1620,-22.9503,.0014],[-43.1566,-22.9488,.0012]].map(a=>{const[x,z]=ll(a[0],a[1]);return new THREE.Vector3(x,hAt(x,z)+a[2],z)});
   const cm=mk({color:0x2b2724,roughness:.5}),cab=mk({color:0xd9473a,roughness:.4,emissive:0x3a0d08});
   for(let i=0;i<2;i++){const A=st[i],B=st[i+1];const mid=A.clone().lerp(B,.5);mid.y-=A.distanceTo(B)*.04;
    const cu=new THREE.QuadraticBezierCurve3(A,mid,B);const tg=new THREE.TubeGeometry(cu,24,.00022,5);disp.push(tg);const tb=new THREE.Mesh(tg,cm);detail.add(tb);
    for(const f of [.33,.66]){const cg=new THREE.BoxGeometry(.0016,.0012,.0011);disp.push(cg);const cb=new THREE.Mesh(cg,cab);const P=cu.getPoint(f);cb.position.set(P.x,P.y-.0009,P.z);cb.lookAt(B.x,cb.position.y,B.z);cb.castShadow=shadows;detail.add(cb)}}
   for(const s of st){const pg=new THREE.BoxGeometry(.0009,s.y-hAt(s.x,s.z)+.0004,.0009);pg.translate(0,(s.y-hAt(s.x,s.z))/2,0);disp.push(pg);const pm=new THREE.Mesh(pg,cm);pm.position.set(s.x,hAt(s.x,s.z)-.0002,s.z);detail.add(pm)}}
  {const [x,z]=ll(-43.2302,-22.9122);const tg=new THREE.TorusGeometry(.0105,.0028,6,40);disp.push(tg);const r=new THREE.Mesh(tg,white);r.rotation.x=-Math.PI/2;r.scale.z=.35;r.position.set(x,hAt(x,z)+.0008,z);r.castShadow=shadows;detail.add(r);
   const cg=new THREE.CircleGeometry(.0085,32);disp.push(cg);const f=new THREE.Mesh(cg,mk({color:0x4f8a3e}));f.rotation.x=-Math.PI/2;f.scale.set(1.15,.85,1);f.position.set(x,hAt(x,z)+.0003,z);detail.add(f)}}
 const setFade=(a,dA=a)=>{for(const m of mats)m.opacity=a;WU.fade.value=a;detail.traverse(o=>{if(o.material&&o.material.alphaHash!==undefined){}});detail.visible=dA>.01;
  if(detail.visible)detail.traverse(o=>{if(o.isMesh)o.material.opacity=dA});terr.visible=wat.visible=a>.01};
 return {root,meta:M,tex:tc,sur,hAt:(x,z)=>hAt(x+WX/2,z+HZ/2),ll:(lo,la)=>{const[x,z]=ll(lo,la);return[x-WX/2,z-HZ/2]},detail,
  tick:t=>{WU.t.value=t},setFade,setSun:v=>WU.sun.value.copy(v),
  dispose:()=>{for(const d of disp)d.dispose&&d.dispose();root.traverse(o=>{if(o.isInstancedMesh)o.dispose()});root.removeFromParent()}};
}
