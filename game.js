(()=>{
const $=id=>document.getElementById(id);
const STARTER=["Russia","Canada","United States of America","Brazil","Australia","China","India","Argentina","Kazakhstan","Algeria","Dem. Rep. Congo","Greenland","Saudi Arabia","Mexico","Indonesia","Libya","Iran","Mongolia","Peru","Chad","Egypt","South Africa","Antarctica","Japan","United Kingdom","France","Madagascar","New Zealand","Spain","Italy"];
const CONT_COL={"Africa":"#f4a259","Asia":"#e76f51","Europe":"#5fa8d3","North America":"#8ac926","South America":"#ffca3a","Oceania":"#c77dff","Antarctica":"#e0f2ff","Europe/Asia":"#4ecdc4"};
let zoom=1;
let feats=[],byName={},neigh={},pieces=[],placed=new Set(),sel=null,pulse=null,muted=false,stripeTotal=1;
const snd={place:new Audio('sounds/place.mp3'),miss:new Audio('sounds/miss.mp3'),win:new Audio('sounds/win.mp3')};
window.__sounds=snd;
function play(k){if(muted)return;const a=snd[k].cloneNode();a.volume=k=='miss'?.5:1;a.play().catch(()=>{});}
// ---------- themed stingers: original, synthesised in the browser (no recordings) ----------
let AC=null;
const THEMES={
 india:{notes:[0,1,4,5,7,8,11,12],wave:'sawtooth',drone:true,step:.16},
 eastasia:{notes:[0,2,4,7,9,12],wave:'triangle',step:.18},
 africa:{notes:[0,2,4,7,9,12,9,7],wave:'sine',mallet:true,step:.12},
 latin:{notes:[0,4,7,12,7,4,0],wave:'square',step:.11},
 arab:{notes:[0,1,4,5,7,8,10,12],wave:'sawtooth',step:.15},
 celtic:{notes:[0,2,4,5,7,9,7,12],wave:'square',step:.12},
 oceania:{notes:[0,4,7,9,12],wave:'sine',step:.2},
 cold:{notes:[12,7,4,0],wave:'sine',step:.3},
 europe:{notes:[0,4,7,12],wave:'triangle',step:.14}};
function themeFor(n){const f=FACTS[n]||[];const c=f[0];
 if(["India","Nepal","Bangladesh","Sri Lanka","Pakistan","Bhutan"].includes(n))return 'india';
 if(["China","Japan","South Korea","North Korea","Taiwan","Mongolia","Vietnam","Thailand","Laos","Cambodia","Myanmar"].includes(n))return 'eastasia';
 if(["Ireland","United Kingdom","Iceland"].includes(n))return 'celtic';
 if(["Egypt","Morocco","Algeria","Tunisia","Libya","Saudi Arabia","Iraq","Jordan","Syria","Lebanon","Yemen","Oman","United Arab Emirates","Qatar","Kuwait","Iran","Turkey","Palestine","Israel"].includes(n))return 'arab';
 if(c=="Africa")return 'africa'; if(c=="South America"||["Mexico","Cuba","Guatemala","Honduras","Nicaragua","Costa Rica","Panama","El Salvador","Dominican Rep.","Puerto Rico","Belize","Jamaica","Haiti","Trinidad and Tobago"].includes(n))return 'latin';
 if(c=="Oceania")return 'oceania'; if(c=="Antarctica"||n=="Greenland")return 'cold'; return 'europe';}
function stinger(n){if(muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return}
 const th=THEMES[themeFor(n)],t0=AC.currentTime+.05,root=220*Math.pow(2,(Math.random()*3|0)/12);
 const out=AC.createGain();out.gain.value=.12;out.connect(AC.destination);
 if(th.drone){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=root/2;g.gain.setValueAtTime(.5,t0);g.gain.linearRampToValueAtTime(0,t0+th.notes.length*th.step+.4);o.connect(g).connect(out);o.start(t0);o.stop(t0+th.notes.length*th.step+.5);}
 th.notes.forEach((s,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=t0+i*th.step;o.type=th.wave;o.frequency.value=root*Math.pow(2,s/12)*2;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(th.wave=='sine'?1:.45,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+(th.mallet?.25:th.step*1.8));o.connect(g).connect(out);o.start(t);o.stop(t+.6);});}
// ---------- globe (three.js ocean globe, see globe3d.js) ----------
function draw(){}
function setZoom(z){G3.zoomBy(z/zoom);zoom=1;if(drag)updateGhostShape();}
$('zin').onclick=()=>setZoom(1.4);$('zout').onclick=()=>setZoom(1/1.4);

function spinTo(c,z){G3.spinTo(c,z);}
// ---------- pieces ----------
// ---- piece faces: real land colours sampled from the same world texture the globe uses (Natural Earth I + our South America look-3) ----
const WT={w:0,h:0,d:null};const wtReady=new Promise(r=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);WT.w=im.width;WT.h=im.height;WT.d=x.getImageData(0,0,im.width,im.height).data;r()};im.onerror=r;im.src='pieces_world.jpg'});
const FACE={},FS=192;
function face(f){if(f._face)return f._face;const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(1).translate([0,0]).clipAngle(90),b=d3.geoPath(pr).bounds(f);
 const bw=b[1][0]-b[0][0],bh=b[1][1]-b[0][1],k=FS/Math.max(bw,bh),cw=Math.max(2,Math.ceil(bw*k)),ch=Math.max(2,Math.ceil(bh*k));const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d'),id=x.createImageData(cw,ch),o=id.data;
 if(WT.d){const l0=f.c[0]*Math.PI/180,p0=f.c[1]*Math.PI/180,sp=Math.sin(p0),cp=Math.cos(p0);
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const X=b[0][0]+(i+.5)/k,Y=-(b[0][1]+(j+.5)/k),rr=X*X+Y*Y;if(rr>=1)continue;const z=Math.sqrt(1-rr);
   const lat=Math.asin(z*sp+Y*cp),lon=l0+Math.atan2(X,z*cp-Y*sp);let u=((lon*180/Math.PI+180)/360%1+1)%1,v=(90-lat*180/Math.PI)/180;
   const px=Math.min(WT.w-1,u*WT.w|0),py=Math.min(WT.h-1,v*WT.h|0),q=(py*WT.w+px)*4,t=(j*cw+i)*4;o[t]=WT.d[q];o[t+1]=WT.d[q+1];o[t+2]=WT.d[q+2];o[t+3]=255;}}
 x.putImageData(id,0,0);return f._face={url:c.toDataURL('image/jpeg',.86),b};}
let svgN=0;
function shapeSVG(f,scale,cls){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(scale).translate([0,0]).clipAngle(90),gp=d3.geoPath(pr);
 const b=gp.bounds(f),m=Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1],1);
 // Border tracks the country, not the old fixed 1.2px minimum (that stroke was wider than a small country and left a wood slab around a tiny terrain patch).
 const rim=Math.max(0.16,Math.min(m*0.028,Math.max(m*0.012,0.42)));
 const pad=Math.max(rim*1.6,m*0.05);
 const r=Math.max(Math.abs(b[0][0]),Math.abs(b[0][1]),Math.abs(b[1][0]),Math.abs(b[1][1]))+pad;
 const F=face(f),id='pc'+(svgN++),d=gp(f);
 const fb=F.b,ix=fb[0][0]*scale,iy=fb[0][1]*scale,iw=(fb[1][0]-fb[0][0])*scale,ih=(fb[1][1]-fb[0][1])*scale;
 return {svg:`<svg class="pc ${cls||''}" viewBox="${-r} ${-r} ${2*r} ${2*r}" width="${2*r}" height="${2*r}"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
<g clip-path="url(#${id})"><path d="${d}" fill="url(#wood)"/><image href="${F.url}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="none" opacity="1"/></g>
<path d="${d}" fill="none" stroke="#5a3d28" stroke-width="${rim}" stroke-opacity=".85" clip-path="url(#${id})"/><path d="${d}" fill="none" stroke="#2a170a" stroke-opacity=".75" stroke-width="${Math.max(0.12,rim*0.45)}"/></svg>`,r,m,d};}
function trayScale(f){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(1).translate([0,0]),b=d3.geoPath(pr).bounds(f);const m=Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1]);return 80/m;}
let anchorName=null;
function buildSet(){if(carrying)dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));anchorName=null;const v=$('set').value;let names=feats.map(f=>f.name);
 if(v=='starter')names=STARTER;else if(v=='Americas')names=names.filter(n=>/America/.test(FACTS[n][0]));
 else if(v=='Oceania')names=names.filter(n=>/Oceania|Antarctica/.test(FACTS[n][0]));else if(v!='all')names=names.filter(n=>FACTS[n][0].includes(v));
 placed.clear();G3.clear();provReset();for(const q of [...parked])unpark(q);anc=null;aui.innerHTML='';aui._h=null;hdl.style.display='none';G3.outline(null);pieces=d3.shuffle(names.map(n=>({f:byName[n],angle:(Math.random()*300+30)|0,hint:0})));sel=null;
 stripeTotal=pieces.reduce((s,p)=>s+cols(p.f.name).length,0)||1;$('tubeFill').innerHTML='';renderTray();updHints();progress();draw();}
function cols(n){return (FLAGS[n]||[0,['#cccccc']])[1];}
function renderTray(){const box=$('pieces');box.innerHTML='';for(const p of pieces){if(placed.has(p.f.name)||p.parked)continue;const d=document.createElement('div');d.className='piece'+(p===sel?' sel':'');d.dataset.name=p.f.name;
 const s=trayScale(p.f);d.innerHTML=shapeSVG(p.f,s).svg;const sv=d.firstChild;sv.setAttribute('width',86);sv.setAttribute('height',86);sv.style.transform=`rotate(${p.angle}deg)`;
 d.addEventListener('pointerdown',e=>startDrag(e,p,d));box.appendChild(d);p.el=d;}}
function setAngle(p,a){p.angle=((a%360)+360)%360;if(p.parked&&!(anc&&anc.p===p)){clearTimeout(setAngle.j);setAngle.j=setTimeout(()=>{if(p.parked&&fits(p,[p.lon,p.lat])){unpark(p);place(p,true);}},350);}// turning a parked piece the right way up snaps it in
if(p.ov)p.ov.firstChild.style.transform=`rotate(${p.angle}deg)`;if(anc&&anc.p===p&&anc.step==='rot'){clearTimeout(setAngle.t);setAngle.t=setTimeout(checkAnc,250);}if(p.el)p.el.firstChild.style.transform=`rotate(${p.angle}deg)`;if(drag&&drag.p===p)ghost.firstChild.style.transform=`rotate(${p.angle}deg)`;}
function select(p){sel=p;document.querySelectorAll('.piece').forEach(x=>x.classList.toggle('sel',x.dataset.name==p.f.name));updHints();}
// drag
let drag=null,ghost=null;
function updateGhostShape(){if(!drag)return;const sr=Math.max(G3.screenRadius(),1),gs=drag.p.parked?drag.p.s:placed.size?1:boxScale(drag.p.f);const g=shapeSVG(drag.p.f,sr*gs);ghost.innerHTML=g.svg;let sv=ghost.firstChild,sz=2*g.r;
 if(sz<34){sv.setAttribute('width',34);sv.setAttribute('height',34);sz=34;}drag.half=sz/2;sv.style.transform=`rotate(${drag.p.angle}deg)`;moveGhost(drag.x,drag.y);}
function moveGhost(x,y){drag.x=x;drag.y=y;ghost.style.left='0px';ghost.style.top='0px';ghost.style.transform=`translate3d(${x-drag.half}px,${y-drag.half}px,0)`;if(drag&&drag.p)tickFinderAt(drag.p,x,y);hiliteMach(x,y);}
function startDrag(e,p,el){e.preventDefault();select(p);el.setPointerCapture(e.pointerId);drag={p,el,x:e.clientX,y:e.clientY,moved:false};
 ghost=document.createElement('div');ghost.id='ghost';document.body.appendChild(ghost);ghost.style.display='none';updateGhostShape();
 el.onpointermove=ev=>{if(!drag)return;if(!drag.moved&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)>5){drag.moved=true;ghost.style.display='';el.style.opacity=.3;}moveGhost(ev.clientX,ev.clientY);};
 el.onpointerup=el.onpointercancel=ev=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;const d=drag;drag=null;ghost.remove();el.style.opacity='';if(d.moved&&ev.type==='pointerup')window.__release(d.p,ev.clientX,ev.clientY);};}
window.addEventListener('wheel',e=>{if(drag){e.preventDefault();e.stopPropagation();setAngle(drag.p,drag.p.angle+(e.deltaY>0?15:-15));updateGhostShape();}},{passive:false,capture:true});
window.addEventListener('keydown',e=>{if(!sel||e.ctrlKey||e.metaKey||e.altKey||(e.target.closest&&e.target.closest('select,input,textarea')))return;if(e.key=='q'||e.key=='Q')setAngle(sel,sel.angle-15);if(e.key=='e'||e.key=='E')setAngle(sel,sel.angle+15);});
$('rl').onclick=()=>sel&&setAngle(sel,sel.angle-15);$('rr').onclick=()=>sel&&setAngle(sel,sel.angle+15);
function say(t,ms){const m=$('msg');m.textContent=t;m.style.display='block';clearTimeout(say.t);say.t=setTimeout(()=>m.style.display='none',ms||1800);}
function bounce(p){play('miss');if(p.el){p.el.animate([{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'none'}],{duration:300});}}
// ---- guided anchor + parking ----
// Pieces dropped on the blank globe park where they land (not locked, not counted). The first piece dropped becomes the anchor:
// it blinks, then the player fixes its size (drag the corner handle), its heading (steering-wheel spin), and finally drags it
// north/south into a blinking true-size outline at its real latitude. Longitude stays where it was dropped: the globe is
// silently re-based so that longitude becomes the country's real one. Later pieces fit relative to the anchor.
const D2R=Math.PI/180,R2D=180/Math.PI;let parked=[],anc=null;const K=100;
const layer=document.createElement('div');layer.id='park';document.body.appendChild(layer);
let WOOD=null;fetch('wood.jpg').then(r=>r.blob()).then(b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b)})).then(u=>WOOD=u);
let pcN=0;function pcTex(p,g){const C=1024,cid=(g.svg.match(/clipPath id="([^"]+)"/)||[])[1],svg=g.svg.replace('stroke="#2a170a"',`clip-path="url(#${cid})" stroke="#2a170a"`).replace(/^<svg /,'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ').replace(/width="[\d.]+" height="[\d.]+">/,`width="${C}" height="${C}">`)
  .replace('<defs>',`<defs><pattern id="wood" patternContentUnits="objectBoundingBox" width="1" height="1"><image href="${WOOD||'wood.jpg'}" width="1" height="1" preserveAspectRatio="none"/></pattern>`);
 const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=C;const x=c.getContext('2d');x.drawImage(im,0,0,C,C);
  // Keep only the country silhouette so a square mesh cannot paint a detached wood slab outside the shape.
  if(g.d){x.globalCompositeOperation='destination-in';x.save();x.translate(C/2,C/2);x.scale(C/(2*g.r),C/(2*g.r));x.fill(new Path2D(g.d));x.restore();x.globalCompositeOperation='source-over';}
  const add=()=>G3.pc.add(p.pid,c,g.r/K);if(window.G3)add();else addEventListener('g3ready',add,{once:true});};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function mkOverlay(p){const o=document.createElement('div');o.className='pk';const g=shapeSVG(p.f,K);o.innerHTML=g.svg;o.r=g.r;o.style.width=o.style.height=2*g.r+'px';
 o.firstChild.style.transform=`rotate(${p.angle}deg)`;layer.appendChild(o);p.pid='pc'+(pcN++);p._ang=(g.m||g.r)/2/K;pcTex(p,g);return o;}
function buildMesh(p){if(p.pid)return;const g=shapeSVG(p.f,K);p.pid='pc'+(pcN++);p._ang=(g.m||g.r)/2/K;pcTex(p,g);}
function park(p,ll,s){if(!p.parked){p.parked=true;parked.push(p);p.ov=mkOverlay(p);p.ov.addEventListener('pointerdown',e=>{if(anc&&anc.p===p)return;startDrag(e,p,p.ov)});p.ov.addEventListener('wheel',e=>{if(!drag){e.preventDefault();G3.dom.dispatchEvent(new WheelEvent('wheel',e));}},{passive:false});}
 p.el=p.ov;p.lon=ll[0];p.lat=ll[1];p.s=s;renderTray();}
function unpark(p){if(!p.parked)return;p.parked=false;G3.pc.del(p.pid);parked=parked.filter(q=>q!==p);p.ov.remove();p.ov=null;}
function boxScale(f){return trayScale(f)*86/88/Math.max(G3.screenRadius(),1);}
function posOv(p){const o=p.ov;if(!o)return;G3.pc.set(p.pid,{lon:p.lon,lat:p.lat,s:p.s,a:p.angle,op:p.op??1,vis:!(drag&&drag.p===p)});if(!G3.facing(p.lon,p.lat)){if(o._d!=='none'){o.style.display='none';o._d='none';}return}if(o._d!==''){o.style.display='';o._d='';}const [x,y]=G3.project(p.lon,p.lat);
 const k=G3.screenRadius()*p.s/K;const tf=`translate(${(x-o.r).toFixed(1)}px,${(y-o.r).toFixed(1)}px) scale(${k.toFixed(4)})`;if(o._tf!==tf){o.style.transform=tf;o._tf=tf;}p.sx=x;p.sy=y;p.spx=o.r*k;}
(function loop(){if(window.G3){for(const p of parked)posOv(p);if(anc)ancUI();}requestAnimationFrame(loop);})();
// anchor UI
const aui=document.createElementNS('http://www.w3.org/2000/svg','svg');aui.id='aui';document.body.appendChild(aui);
const angOff=a=>{a=((a%360)+360)%360;return a>180?a-360:a};
function startAnchor(p,ll){park(p,ll,boxScale(p.f));anchorName=p.f.name;anc={p,step:'blink'};sel=p;updHints();p.ov.classList.add('anc');p.ov.style.cursor='default';
 const cont=FACTS[p.f.name][0];say(`⚓ Anchor: ${p.f.name}. The world is built around it.`,2600);{const t0=performance.now();(function bl(){const t=(performance.now()-t0)/1400;if(t>=1||!p.ov){p.op=1;return}p.op=.25+.75*(.5+.5*Math.cos(t*Math.PI*6));requestAnimationFrame(bl);})();}

 setTimeout(()=>nextStep(),1500);p.ov.addEventListener('pointerdown',ancDown);}
function nextStep(){const p=anc.p;if(Math.abs(p.s-1)>.12){anc.step='scale';say(p.s<1?'Too small: drag the handle outward ⤢':'Too big: drag the handle inward ⤡',3500);return}p.s=1;
 if(Math.abs(angOff(p.angle))>10){anc.step='rot';say('Turn it north-up: spin it like a steering wheel ⟲ ⟳',3500);return}setAngle(p,0);
 if(anc.step!=='lat'){anc.step='lat';const d=p.f.c[0]-p.lon;G3.offsetLon(-d);for(const q of parked)q.lon=((q.lon+d+540)%360)-180;
  G3.outline(p.f);say('Now slide it up or down into the outline ↕',3500);}}
function ancDown(e){if(!anc||anc.p.ov!==e.currentTarget&&e.currentTarget!==hdl)return;e.preventDefault();e.stopPropagation();const p=anc.p,st=anc.step;if(st==='blink')return;
 const el=e.currentTarget;el.setPointerCapture(e.pointerId);const cx=p.sx,cy=p.sy,d0=Math.hypot(e.clientX-cx,e.clientY-cy)||1,s0=p.s,a0=p.angle,t0=Math.atan2(e.clientY-cy,e.clientX-cx);
 el.onpointermove=ev=>{if(pin)return;if(st==='scale')p.s=Math.max(.05,Math.min(8,s0*Math.hypot(ev.clientX-cx,ev.clientY-cy)/d0));
  else if(st==='rot')setAngle(p,a0+(Math.atan2(ev.clientY-cy,ev.clientX-cx)-t0)*R2D);
  else if(st==='lat'){const ll=G3.pick(cx,ev.clientY);if(ll)p.lat=Math.max(-85,Math.min(85,ll[1]));}};
 el.onpointerup=el.onpointercancel=()=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;checkAnc();};}

let pin=null;const TP=new Map();
addEventListener('pointerdown',e=>{if(!anc||!['scale','rot'].includes(anc.step))return;TP.set(e.pointerId,[e.clientX,e.clientY]);if(TP.size===2){e.preventDefault();e.stopPropagation();const [a,b]=[...TP.values()];pin={d:Math.hypot(b[0]-a[0],b[1]-a[1])||1,t:Math.atan2(b[1]-a[1],b[0]-a[0]),s:anc.p.s,an:anc.p.angle};}},true);
addEventListener('pointermove',e=>{if(!TP.has(e.pointerId))return;TP.set(e.pointerId,[e.clientX,e.clientY]);if(!pin||!anc||TP.size<2)return;e.stopPropagation();const [a,b]=[...TP.values()],p=anc.p;
 if(anc.step==='scale')p.s=Math.max(.05,Math.min(8,pin.s*Math.hypot(b[0]-a[0],b[1]-a[1])/pin.d));else setAngle(p,pin.an+(Math.atan2(b[1]-a[1],b[0]-a[0])-pin.t)*R2D);},true);
const tpUp=e=>{if(!TP.delete(e.pointerId))return;if(pin&&TP.size<2){pin=null;if(anc)checkAnc();}};addEventListener('pointerup',tpUp,true);addEventListener('pointercancel',tpUp,true);
function checkAnc(){if(!anc)return;const p=anc.p;if(anc.step==='scale'&&Math.abs(p.s-1)<=.12){p.s=1;play('place');nextStep();}
 else if(anc.step==='rot'&&Math.abs(angOff(p.angle))<=10){setAngle(p,0);play('place');nextStep();}
 else if(anc.step==='lat'&&Math.abs(p.lat-p.f.c[1])<=Math.max(2,p.f.rad*R2D*.3)){const q=p;anc=null;aui.innerHTML='';aui._h=null;G3.outline(null);hdl.style.display='none';unpark(q);place(q);}}
const hdl=document.createElement('div');hdl.id='hdl';hdl.style.display='none';document.body.appendChild(hdl);hdl.addEventListener('pointerdown',ancDown);
let olKey='';function ancUI(){const p=anc.p,st=anc.step;if(!p.spx){return}const x=p.sx,y=p.sy,R=p.spx;let h='';
 if(st==='scale'){const out=p.s<1,a=R*.75+14;for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const x1=x+dx*a*.62,y1=y+dy*a*.62,x2=x+dx*(a*.62+16),y2=y+dy*(a*.62+16);const [fx,fy,tx,ty]=out?[x1,y1,x2,y2]:[x2,y2,x1,y1];
   h+=`<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" marker-end="url(#ah)"/>`;}
  hdl.style.display='';hdl.style.left=(x+R*.72)+'px';hdl.style.top=(y+R*.72)+'px';}else hdl.style.display='none';
 if(st==='rot'){const a=R+16;const cw=angOff(p.angle)<0;for(const sd of [-1,1]){const y1=y-a*.55,y2=y+a*.55,xx=x+sd*a;
   const [ya,yb]=(sd>0)===cw?[y1,y2]:[y2,y1];h+=`<path d="M${x+sd*a*.84} ${ya} Q${xx+sd*a*.25} ${y} ${x+sd*a*.84} ${yb}" marker-end="url(#ah)"/>`;}}
 if(st==='lat'){const f=p.f;if(G3.facing(f.c[0],f.c[1])){const [ox,oy]=G3.project(f.c[0],f.c[1]);const sc=G3.screenRadius(),pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(sc).translate([ox,oy]).clipAngle(90);
   G3.outlineOp(.55+.45*Math.cos(performance.now()/160));const dy=oy-y;if(Math.abs(dy)>R*.5)h+=`<line x1="${x}" y1="${y+Math.sign(dy)*(R*.6)}" x2="${x}" y2="${y+Math.sign(dy)*(R*.6+22)}" marker-end="url(#ah)"/>`;}}
 if(aui._h!==h){aui._h=h;aui.innerHTML='<defs><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>'+h;}}
function fits(p,ll){const f=p.f,easy=$('easy').checked,small=f.rad<0.12;let tol=Math.max(0.09,f.rad*0.9);if(easy&&small)tol=Math.max(tol,0.25);
 if(!(d3.geoDistance(ll,f.c)<tol||d3.geoContains(f,ll)))return false;if(Math.abs(angOff(p.angle))>25&&!(easy&&small))return false;
 const nb=neigh[f.name]||[];if(!nb.length||nb.some(n=>placed.has(n)))return true;
 // must join a placed neighbour, unless this piece's whole land group in the set (e.g. UK+Ireland, Haiti+Dominican Rep.) has nothing placed yet
 const inSet=new Set(pieces.map(q=>q.f.name)),seen=new Set([f.name]),Q=[f.name];while(Q.length){for(const n of neigh[Q.pop()]||[])if(inSet.has(n)&&!seen.has(n)){if(placed.has(n))return false;seen.add(n);Q.push(n);}}return true;}
function joinParked(){if(MODE==='prov'&&provPending())return;let again=true;while(again){again=false;for(const q of [...parked]){if(anc&&anc.p===q)continue;if(fits(q,[q.lon,q.lat])){unpark(q);place(q,true);again=true;}}}}
function drop(p,x,y){const r=G3.dom.getBoundingClientRect();const ll=(x<r.left||x>r.right||y<r.top||y>r.bottom)?null:G3.pick(x,y);
 if(!ll){if(p.parked){unpark(p);renderTray();}return;}
 if(anc&&anc.p===p)return;
 if(placed.size===0&&!anc){startAnchor(p,ll);return;}
 if(placed.size===0){park(p,ll,p.parked?p.s:boxScale(p.f));say('Parked. Finish the anchor first ⚓',2000);return;}
 if(MODE==='prov'&&provPending()){park(p,ll,1);say('Finish the provinces of '+provPending()+' first',2400);return;}
 if(fits(p,ll)){unpark(p);place(p);return;}
 park(p,ll,1);say(neighbourHint(p,ll),2200);}
function neighbourHint(p,ll){const f=p.f,tol=Math.max(0.09,f.rad*0.9);return (d3.geoDistance(ll,f.c)<tol||d3.geoContains(f,ll))&&Math.abs(angOff(p.angle))>25?'Right place! Now turn it to fit ⟲ ⟳':'Parked here. It joins when the puzzle reaches it.';}
function place(p,inJoin){placed.add(p.f.name);if(MODE==='prov'){G3.fog(p.f);openProv(p.f.name);}else G3.reveal(p.f,FACTS[p.f.name][0],muted);setTimeout(()=>stinger(p.f.name),250);sel=null;renderTray();updHints();progress();draw();celebrate(p.f.name);setTimeout(()=>spawnPlaceCoins(p),180);if(!inJoin)joinParked();if(placed.size==pieces.length&&pieces.length&&!(MODE==='prov'&&provOpen.length))setTimeout(maybeWin,900);}
function anchorBlocked(p){return !!(p&&((anc&&anc.p===p)||(anchorName&&p.f.name===anchorName)));}
function repaintPlaced(){if(!window.G3)return;G3.clear();for(const n of placed){const f=byName[n];if(!f)continue;if(MODE==='prov')G3.fog(f);else G3.placeNow(f,(FACTS[n]||[''])[0]);}
 if(MODE==='prov'&&GEOP){for(const n of placed)for(const pf of (GEOP.PV[n]||[]))if(provPlaced.has(provKey(pf)))G3.provNow(pf,(FACTS[n]||[''])[0]);}}
function unplace(p){if(!p||!placed.has(p.f.name)||anchorBlocked(p))return false;placed.delete(p.f.name);if(p.parked)unpark(p);repaintPlaced();progress();updHints();return true;}
function placedAt(ll){if(!ll)return null;for(const n of placed){if(anchorName&&n===anchorName)continue;const f=byName[n];if(!f)continue;
  if(d3.geoContains(f,ll)||(f.rad<0.025&&d3.geoDistance(ll,f.c)<Math.max(f.rad*0.85,0.01)))return pieces.find(q=>q.f.name===n);}return null;}
function progress(){updScreen();$('progress').textContent=`${placed.size} / ${pieces.length}`;}
// flag + tube
let celebGen=0,placeTabTimer=0,countriesOpen=false,cardCountry=null;
function prettyCountry(n){return String(n).replace('Dem. Rep.','Democratic Republic of the').replace('Is.','Islands').replace('Rep.','Republic')}
function dismissCard(){celebGen++;cardCountry=null;const c=$('card');if(c)c.hidden=true;const pop=$('flagPop');if(pop)pop.hidden=true;}
function hidePlaceTab(){clearTimeout(placeTabTimer);placeTabTimer=0;const tab=$('placeTab');if(!tab)return;tab.classList.remove('on');}
function closeCountriesDrop(){countriesOpen=false;const d=$('countriesDrop'),b=$('countriesB');if(d)d.hidden=true;if(b)b.setAttribute('aria-expanded','false');}
function updCountriesUI(){const b=$('countriesB'),nEl=$('countriesN'),d=$('countriesDrop');if(!b||!nEl||!d)return;
  const list=[...placed];nEl.textContent=String(list.length);b.disabled=false;
  if(!list.length){d.innerHTML='<div class="empty">No countries placed yet</div>';return;}
  d.innerHTML=list.map(n=>`<button type="button" role="option" data-n="${n.replace(/"/g,'&quot;')}">${prettyCountry(n)}</button>`).join('');
  d.querySelectorAll('button').forEach(btn=>btn.onclick=e=>{e.stopPropagation();openCountryCard(btn.dataset.n);});}
function showPlaceTab(n){const tab=$('placeTab');if(!tab||!FACTS[n])return;clearTimeout(placeTabTimer);closeCountriesDrop();
  const f=FACTS[n],fl=FLAGS[n];const flag=fl?`<img class="ptFlag" alt="" src="flags/${fl[0]}.svg">`:'<span class="ptFlag"></span>';
  tab.innerHTML=`<div class="ptIn">${flag}<div class="ptBody"><strong>${prettyCountry(n)}</strong><span>🏛️ ${f[1]} · ${f[0]}</span><span>⭐ ${f[2]}</span><div class="ptHint">Tap for the full card</div></div></div>`;
  tab.dataset.n=n;tab.hidden=false;
  // Two-frame show so the opacity/transform transition actually runs (display:none→block skips it).
  tab.classList.remove('on');
  tab.style.transition='none';
  void tab.offsetWidth;
  tab.style.transition='';
  requestAnimationFrame(()=>{tab.classList.add('on');});
  tab.onclick=e=>{e.stopPropagation();openCountryCard(n);};
  placeTabTimer=setTimeout(()=>hidePlaceTab(),5000);updCountriesUI();}
function openCountryCard(n){if(!FACTS[n])return;hidePlaceTab();closeCountriesDrop();showCard(n);}
function celebrate(n){const gen=++celebGen;updCountriesUI();const fl=FLAGS[n];const pop=$('flagPop');
  // Never auto-open the blocking full card — show a small tab under Countries instead.
  if(!fl){if(gen===celebGen)showPlaceTab(n);return;}
  $('flagImg').src='flags/'+fl[0]+'.svg';pop.hidden=false;
  const cs=cols(n);let i=0;setTimeout(function next(){if(gen!==celebGen)return;if(i>=cs.length){pop.hidden=true;if(gen===celebGen)showPlaceTab(n);return;}flyStripe(cs[i++]);setTimeout(next,450);},700);}
function flyStripe(c){const img=$('flagImg').getBoundingClientRect(),tube=$('tube').getBoundingClientRect(),fill=$('tubeFill').getBoundingClientRect();
 const w=Math.max(2,tube.width/stripeTotal);const d=document.createElement('div');d.className='fly';d.style.left=img.left+'px';d.style.top=(img.top+img.height/2)+'px';d.style.width=img.width+'px';d.style.height='8px';d.style.background=c;document.body.appendChild(d);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.left=(fill.right)+'px';d.style.top=(tube.top+2)+'px';d.style.width=w+'px';d.style.height=(tube.height-4)+'px';}));
 setTimeout(()=>{d.remove();const s=document.createElement('div');s.className='stripe';s.style.background=c;s.style.width=(100/stripeTotal)+'%';s.style.height='100%';$('tubeFill').appendChild(s);},560);}
function showCard(n){const f=FACTS[n];if(!f)return;cardCountry=n;$('cName').textContent=prettyCountry(n)+' 🎉';
 $('cFacts').innerHTML=[`🌍 Continent: ${f[0]}`,`🏛️ Capital: ${f[1]}`,`⭐ Famous for: ${f[2]}`,`🐾 Animal: ${f[3]}`,`🍽️ Food: ${f[4]}`].map(t=>`<li>${t}</li>`).join('');$('card').hidden=false;if(!carrying)$('cOk').focus({preventScroll:true});}
function maybeWin(){if(placed.size==pieces.length&&pieces.length&&!(MODE==='prov'&&provOpen.length)){play('win');say('🎉 You finished the puzzle! 🎉',5000);}}
$('cOk').onclick=()=>{dismissCard();maybeWin();};
// Click dimmed backdrop (not the card body) to close — card only opens on demand, so this never traps place-flow.
$('card').addEventListener('click',e=>{if(e.target===$('card'))dismissCard();});
$('card').querySelector('.cardIn').addEventListener('click',e=>e.stopPropagation());
// Countries dropdown
(function initCountries(){
  const b=$('countriesB'),d=$('countriesDrop');if(!b||!d)return;
  b.addEventListener('click',e=>{e.stopPropagation();if(countriesOpen){closeCountriesDrop();return;}
    updCountriesUI();countriesOpen=true;d.hidden=false;b.setAttribute('aria-expanded','true');hidePlaceTab();});
  addEventListener('pointerdown',e=>{
    const wrap=$('countriesWrap');
    if(wrap&&wrap.contains(e.target))return;
    closeCountriesDrop();
    // place tab stays until its own timer / click — clicking elsewhere does not steal it unless over UI chrome
  },true);
  updCountriesUI();
})();
// hints
function updHints(){const p=sel;$('sel').innerHTML=p?`Piece selected. Hints used: ${p.hint}/3`:'Tap the stack to draw a piece.';
 ['h1','h2','h3'].forEach((h,i)=>$(h).disabled=!p||p.hint<i);if(!p)$('hintText').textContent='';}
$('h1').onclick=()=>{const p=sel;if(!p)return;p.hint=Math.max(p.hint,1);setAngle(p,0);$('hintText').innerHTML='⬆️ This way is UP (north). I turned the piece for you!';updHints();};
$('h2').onclick=()=>{const p=sel;if(!p)return;p.hint=Math.max(p.hint,2);const n=p.f.name,f=FACTS[n],nb=(neigh[n]||[]);
 $('hintText').innerHTML=`<b>Continent:</b> ${f[0]}<br>${nb.length?'<b>Neighbours:</b> '+nb.slice(0,5).join(', '):'<b>No land neighbours</b> – it has sea all around.'}<br>💡 ${f[5]}`;updHints();};
$('h3').onclick=()=>{const p=sel;if(!p)return;p.hint=3;spinTo(p.f.c,Math.max(1.4,Math.min(3,6.2/(1+19*p.f.rad))));G3.pulse(p.f,5000);$('hintText').innerHTML+='<br>✨ Look for the yellow glow!';updHints();};
$('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'🔇':'🔊';};
const SETVIEW={Africa:[20,2],Asia:[90,30],Europe:[15,50],Americas:[-80,8],Oceania:[150,-25]};
let setPrev=$('set').value;$('set').onchange=e=>{if((placed.size||parked.length)&&!confirm('Start a new puzzle? The pieces you have placed will be cleared.')){e.target.value=setPrev;return;}setPrev=e.target.value;buildSet();const v=SETVIEW[e.target.value];if(v)spinTo(v,1);};// face the chosen region instead of leaving the old view
$('bg').onchange=e=>G3.setBg(+e.target.value);$('lbl').onchange=e=>G3.labels(e.target.checked);
// ---------- load ----------
function fixC(f,n){f.c=d3.geoCentroid(f);if(n=="United States of America")f.c=[-98,39];if(n=="Russia")f.c=[95,62];if(n=="France")f.c=[2.5,46.5];if(n=="Norway")f.c=[9,61];
 const b=d3.geoBounds(f);f.rad=Math.max(d3.geoDistance(f.c,b[0]),d3.geoDistance(f.c,b[1]))/1.6;if(n=="Antarctica"){f.c=[0,-90];f.rad=.5;}return f;}
let MODE='countries',GEO110=null,GEOP=null;
// Provinces mode: countries AND provinces come from one simplified Natural Earth admin-1 topology (data/admin1.json), so each
// country is exactly the union of its provinces and shares its borders with its neighbours (see tools/check-provinces.mjs).
function loadProvGeo(){if(GEOP)return Promise.resolve(GEOP);return fetch('data/admin1.json').then(r=>r.json()).then(t=>{const G=t.objects.prov.geometries,by={};G.forEach(g=>(by[g.properties.g]=by[g.properties.g]||[]).push(g));
 const names=Object.keys(by).filter(n=>FACTS[n]);const fs=[],bn={},ng={},PV={};
 for(const n of names){const f=fixC({type:'Feature',geometry:topojson.merge(t,by[n]),name:n},n);fs.push(f);bn[n]=f;
  PV[n]=by[n].map(g=>{const q=topojson.feature(t,g);const pf={type:'Feature',geometry:q.geometry,name:g.properties.pn,country:n};pf.c=d3.geoCentroid(pf);pf.a=d3.geoArea(pf);const b=d3.geoBounds(pf);pf.rad=Math.max(d3.geoDistance(pf.c,b[0]),d3.geoDistance(pf.c,b[1]))/1.6;return pf;});markOverseas(PV[n]);}
 const nb=topojson.neighbors(names.map(n=>topojson.mergeArcs(t,by[n])));names.forEach((n,i)=>ng[n]=nb[i].map(j=>names[j]));
 return GEOP={feats:fs,byName:bn,neigh:ng,PV};});}
function setMode(m){MODE=m;const g=m==='prov'?GEOP:GEO110;feats=g.feats;byName=g.byName;neigh=g.neigh;document.body.classList.toggle('provMode',m==='prov');}
(window.G3?Promise.resolve():new Promise(r=>addEventListener('g3ready',r,{once:true}))).then(()=>fetch('data/countries-110m.json')).then(r=>r.json()).then(t=>{const geoms=t.objects.countries.geometries;
 const merge={"N. Cyprus":"Cyprus","Somaliland":"Somalia"};const groups={};geoms.forEach((g,i)=>{const n=merge[g.properties.name]||g.properties.name;(groups[n]=groups[n]||[]).push(i);});
 const nb=topojson.neighbors(geoms);
 for(const n in groups){if(!FACTS[n])continue;const gs=groups[n].map(i=>geoms[i]);const geo=gs.length>1?topojson.merge(t,gs):topojson.feature(t,gs[0]).geometry;
  const f={type:'Feature',geometry:geo,name:n};f.c=d3.geoCentroid(f);if(n=="United States of America")f.c=[-98,39];if(n=="Russia")f.c=[95,62];if(n=="France")f.c=[2.5,46.5];if(n=="Norway")f.c=[9,61];
  const b=d3.geoBounds(f);f.rad=Math.max(d3.geoDistance(f.c,b[0]),d3.geoDistance(f.c,b[1]))/1.6;if(n=="Antarctica"){f.c=[0,-90];f.rad=.5;}feats.push(f);byName[n]=f;}
 for(const n in groups){const s=new Set();groups[n].forEach(i=>nb[i].forEach(j=>{const m=merge[geoms[j].properties.name]||geoms[j].properties.name;if(m!=n)s.add(m)}));neigh[n]=[...s];}
 GEO110={feats,byName,neigh};
 wtReady.then(()=>{buildSet();window.__ready=true;dispatchEvent(new Event('gameready'));});});
window.__shape=f=>shapeSVG(f,trayScale(f)).svg;window.__game={park:(n,lon,lat,s,a)=>{const q=pieces.find(q=>q.f.name==n);q.angle=a||0;park(q,[lon,lat],s||1)},unpark:n=>unpark(pieces.find(q=>q.f.name==n)),get anc(){return anc},get parked(){return parked},get pieces(){return pieces},get placed(){return placed},place:n=>place(pieces.find(p=>p.f.name==n)),spinTo,feat:n=>byName[n],drop:(n,x,y)=>drop(pieces.find(p=>p.f.name==n),x,y)};
// ---- placed-countries screen: one borderless translucent panel, stacked thin tabs, pointer line to the country ----
var scr=document.createElement('div');scr.id='scr';scr.innerHTML='<div class="sh">Placed</div><div id="scrL"></div>';$('stage').appendChild(scr);
const ptr=document.createElementNS('http://www.w3.org/2000/svg','svg');ptr.id='ptr';ptr.innerHTML='<line/><circle r="2.5"/><text/>';document.body.appendChild(ptr);
let hot=null,hotRaf=0;
function updScreen(){if(typeof scr==='undefined')return;const L=$('scrL');L.innerHTML='';scr.style.display=placed.size?'':'none';
 for(const n of [...placed].reverse()){const t=document.createElement('div');t.className='tab'+(n===hot?' on':'');t.textContent=n;t.dataset.n=n;t.onmouseenter=()=>setHot(n);t.onmouseleave=()=>setHot(null);L.appendChild(t);}}
function setHot(n){if(n===hot)return;hot=n;for(const t of $('scrL').children)t.classList.toggle('on',t.dataset.n===n);
 if(n){const t=[...$('scrL').children].find(t=>t.dataset.n===n);t&&t.scrollIntoView({block:'nearest'});}
 for(const e of document.querySelectorAll('.g3lbl'))e.style.visibility=e.textContent===n?'hidden':'';cancelAnimationFrame(hotRaf);if(n)drawPtr();else ptr.style.display='none';}
function drawPtr(){const f=byName[hot];if(!f)return;const c=d3.geoCentroid(f);
 if(!G3.facing(c[0],c[1])){ptr.style.display='none'}else{const [x,y]=G3.project(c[0],c[1]);const ty=y-46;ptr.style.display='block';
  const [l,ci,tx]=ptr.children;l.setAttribute('x1',x);l.setAttribute('y1',y);l.setAttribute('x2',x);l.setAttribute('y2',ty+4);ci.setAttribute('cx',x);ci.setAttribute('cy',y);tx.setAttribute('x',x);tx.setAttribute('y',ty);tx.textContent=hot;}
 hotRaf=requestAnimationFrame(drawPtr);}
(function hook(){if(!window.G3)return setTimeout(hook,200);let hq=null,hr=0;G3.dom.addEventListener('pointermove',e=>{if(e.buttons||!placed.size||drag||G3.grabbing())return;hq=[e.clientX,e.clientY];if(hr)return;hr=requestAnimationFrame(()=>{hr=0;if(drag)return;const ll=G3.pick(hq[0],hq[1]);let n=null;if(ll)for(const k of placed)if(d3.geoContains(byName[k],ll)){n=k;break}setHot(n);});}); G3.dom.addEventListener('pointerleave',()=>setHot(null)); })();
window.__game.hot=setHot;
// ---- sliding drawers + stack ----
// Two full-height wooden drawers slide in from the screen edges as overlays. They meet in the middle; pulling one further
// pushes the other shut. Left: every loose piece ("All pieces"). Right: one compartment per continent for guessed pieces.
// Pieces inside get light 2D physics (inertia from the drawer, hops, sliding off each other). Sounds are synthesised here.
const CONTS=['Africa','Asia','Europe','North America','South America','Oceania'];
function contOf(n){const s=(FACTS[n]||[''])[0];for(const c of CONTS)if(s.includes(c))return c;if(/Antarctica/.test(s))return 'Oceania';if(/America/.test(s))return 'North America';return 'Asia';}
let DAC=null;function dac(){if(muted)return null;try{DAC=DAC||new (window.AudioContext||window.webkitAudioContext)();if(DAC.state=='suspended')DAC.resume();}catch(e){return null}return DAC;}
let roll=null;function rollSnd(speed){const a=dac();if(!a)return;if(!roll){const n=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=n.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){b=b*.97+(Math.random()*2-1)*.03;d[i]=b*6+(Math.random()*2-1)*.04;}
 const s=a.createBufferSource();s.buffer=n;s.loop=true;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=160;f.Q.value=.8;const g=a.createGain();g.gain.value=0;s.connect(f).connect(g).connect(a.destination);s.start();roll={g,f,s,acc:0};}
 const v=Math.min(1,Math.abs(speed)/25);roll.g.gain.setTargetAtTime(v*.5,a.currentTime,.03);roll.f.frequency.setTargetAtTime(120+v*160,a.currentTime,.05);
 roll.acc+=Math.abs(speed);if(roll.acc>38){roll.acc=0;knock(.05+v*.08,900);}}
function knock(vol,fr){const a=dac();if(!a)return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='triangle';o.frequency.setValueAtTime(fr||420,t);o.frequency.exponentialRampToValueAtTime((fr||420)*.6,t+.06);
 f.type='lowpass';f.frequency.value=1800;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.09);o.connect(f).connect(g).connect(a.destination);o.start(t);o.stop(t+.1);}
const DR={};const PS=62;const dwrap=document.createElement('div');dwrap.id='dwrap';document.body.appendChild(dwrap);
for(const side of ['L','R']){const d=document.createElement('div');d.className='drawer d'+side;d.innerHTML=`<div class="din"></div><div class="dh" title="Drag to open"></div>`;dwrap.appendChild(d);
 const o={side,el:d,in:d.firstChild,h:d.lastChild,open:0,v:0,pv:0,bodies:[]};DR[side]=o;
 if(side==='L')o.in.insertAdjacentHTML('beforeend','<div class="carve">All pieces</div>');
 else o.in.insertAdjacentHTML('beforeend',CONTS.map(c=>`<div class="sec" data-c="${c}"><div class="carve">${c}</div></div>`).join(''));
 o.h.addEventListener('pointerdown',e=>{e.preventDefault();o.h.setPointerCapture(e.pointerId);dac();const x0=e.clientX,y0=e.clientY,a0=o.open;let lx=e.clientX,ly=e.clientY,lt=performance.now();
  o.h.onpointermove=ev=>{if(side==='L')setOpen(o,a0+(ev.clientX-x0));else setOpen(o,a0-(ev.clientY-y0));const t=performance.now(),dt=Math.max(1,t-lt);
   o.fling=side==='L'?(ev.clientX-lx)/dt*16:-(ev.clientY-ly)/dt*16;lx=ev.clientX;ly=ev.clientY;lt=t;};
  o.h.onpointerup=o.h.onpointercancel=()=>{o.h.onpointermove=o.h.onpointerup=o.h.onpointercancel=null;o.glide=o.fling||0;o.fling=0;kick();};});}
function boardBox(){const hud=document.getElementById('hudCol');const hudL=hud?hud.getBoundingClientRect().left:innerWidth-220;const edge=innerWidth<760?96:132;const w=Math.max(160,hudL-edge-6);const cols=w>=680?6:w>=380?3:2;const rows=Math.ceil(6/cols);const h=innerWidth<760?Math.max(220,rows*76):172;return {left:edge,w,h,cols,rows};}
function layoutChrome(){const header=document.querySelector('header').getBoundingClientRect(),tube=document.getElementById('tubeBar').getBoundingClientRect();
 document.documentElement.style.setProperty('--chromeTop',(header.height+tube.height)+'px');const B=boardBox();
 document.documentElement.style.setProperty('--boardH',B.h+'px');document.documentElement.style.setProperty('--boardLeft',B.left+'px');document.documentElement.style.setProperty('--boardW',B.w+'px');
 const hud=document.getElementById('hudCol');if(hud)document.documentElement.style.setProperty('--hudW',hud.getBoundingClientRect().width+'px');
 if(typeof DR!=='undefined'&&DR.R)document.documentElement.style.setProperty('--boardOpen',(DR.R.open||0)+'px');}
function openMax(o){return o.side==='L'?innerWidth-44:boardBox().h;}
function setOpen(o,v){o.open=Math.max(0,Math.min(openMax(o),v));kick();}
function secRects(){const B=boardBox(),cw=B.w/B.cols,rh=B.h/B.rows;return CONTS.map((c,i)=>({c,x:(i%B.cols)*cw,y:Math.floor(i/B.cols)*rh,w:cw,h:rh}));}
function layoutSecs(){layoutChrome();const R=secRects();[...DR.R.in.querySelectorAll('.sec')].forEach((s,i)=>{const r=R[i];Object.assign(s.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'})});}
function bounds(o,b){const W=innerWidth,H=innerHeight;if(o.side==='L')return {x:10,y:10,w:W-20,h:H-56};const r=secRects().find(r=>r.c===b.sec)||secRects()[0];return {x:r.x+6,y:r.y+38,w:r.w-12,h:Math.max(28,r.h-56)};}
function pieceEl(p){const e=document.createElement('div');e.className='dp';const g=shapeSVG(p.f,trayScale(p.f)*PS/86);e.innerHTML=g.svg;const sv=e.firstChild;sv.setAttribute('width',PS);sv.setAttribute('height',PS);sv.style.transform=`rotate(${p.angle}deg)`;
 const nm=document.createElement('span');nm.className='dname';nm.textContent=p.f.name;nm.title=p.f.name;e.appendChild(nm);
 e.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();carry(p,ev,e);});return e;}
function addBody(side,p,x,y,hop,sec){remBody(p);const o=DR[side],b={p,x,y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,z:hop?28:0,vz:0,r:PS*.36,sec:side==='R'?(sec||contOf(p.f.name)):null};
 b.el=pieceEl(p);o.in.appendChild(b.el);o.bodies.push(b);p.dloc=side;p.body=b;clampB(o,b);kick();return b;}
function remBody(p){const b=p.body;if(!b)return;for(const s in DR){const o=DR[s],i=o.bodies.indexOf(b);if(i>=0)o.bodies.splice(i,1);}b.el.remove();p.body=null;p.dloc=null;}
// real-shape collision: each piece is its projected outline, split into convex hulls of its main parts (SAT between hulls)
function hullOf(P){P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
 for(const p of P){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
 up.pop();lo.pop();return lo.concat(up);}
function bodyShape(p){if(p._sh&&p._sh.a===p.angle)return p._sh;const sc=trayScale(p.f)*PS/86,pr=d3.geoOrthographic().rotate([-p.f.c[0],-p.f.c[1]]).scale(sc).translate([0,0]).clipAngle(90),gp=d3.geoPath(pr);
 const b=gp.bounds(p.f),r=Math.max(Math.abs(b[0][0]),Math.abs(b[0][1]),Math.abs(b[1][0]),Math.abs(b[1][1]))+3,k=PS/(2*r),an=p.angle*Math.PI/180,ca=Math.cos(an),sa=Math.sin(an);
 const parts=(gp(p.f)||'').split('M').filter(Boolean).map(seg=>(seg.match(/-?[\d.]+(?:e-?\d+)?/g)||[]).map(Number)).map(n=>{const q=[];for(let i=0;i+1<n.length;i+=2){const x=n[i]*k,y=n[i+1]*k;q.push([x*ca-y*sa,x*sa+y*ca]);}return q;}).filter(q=>q.length>2);
 let hs=parts.map(hullOf).filter(h=>h.length>2).map(h=>({h,a:Math.abs(h.reduce((s,p,i)=>{const q=h[(i+1)%h.length];return s+p[0]*q[1]-q[0]*p[1]},0))/2}));
 const mx=Math.max(1,...hs.map(o=>o.a));hs=hs.filter(o=>o.a>mx*.08).sort((a,b)=>b.a-a.a).slice(0,4).map(o=>o.h);if(!hs.length)hs=[[[-8,-8],[8,-8],[8,8],[-8,8]]];
 const all=hs.flat();p._sh={a:p.angle,hs,x0:Math.min(...all.map(v=>v[0])),x1:Math.max(...all.map(v=>v[0])),y0:Math.min(...all.map(v=>v[1])),y1:Math.max(...all.map(v=>v[1]))};
 p._sh.r=Math.max(...all.map(v=>Math.hypot(v[0],v[1])));return p._sh;}
function satMTV(A,ax,ay,Bh,bx,by){let best=1e9,nx=0,ny=0;for(const P of [A,Bh])for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];let ex=q[1]-p[1],ey=p[0]-q[0];const l=Math.hypot(ex,ey);if(!l)continue;ex/=l;ey/=l;
  let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const v of A){const d=(v[0]+ax)*ex+(v[1]+ay)*ey;if(d<a0)a0=d;if(d>a1)a1=d;}for(const v of Bh){const d=(v[0]+bx)*ex+(v[1]+by)*ey;if(d<b0)b0=d;if(d>b1)b1=d;}
  const o=Math.min(a1-b0,b1-a0);if(o<=0)return null;if(o<best){best=o;nx=ex;ny=ey;}}
 if((bx-ax)*nx+(by-ay)*ny<0){nx=-nx;ny=-ny;}return {d:best,nx,ny};}
function collide(a,c){const A=bodyShape(a.p),C=bodyShape(c.p),dx=c.x-a.x,dy=c.y-a.y;if(dx*dx+dy*dy>(A.r+C.r)**2)return false;let hit=false;
 for(const ha of A.hs)for(const hc of C.hs){const m=satMTV(ha,a.x,a.y,hc,c.x,c.y);if(!m)continue;hit=true;const s=Math.min(m.d,6)*.5;c.x+=m.nx*s;c.y+=m.ny*s;a.x-=m.nx*s;a.y-=m.ny*s;
  const rv=(c.vx-a.vx)*m.nx+(c.vy-a.vy)*m.ny;if(rv<0){const j=-rv*.6;c.vx+=m.nx*j;c.vy+=m.ny*j;a.vx-=m.nx*j;a.vy-=m.ny*j;}}return hit;}
function clampB(o,b){const r=bounds(o,b),S=bodyShape(b.p);if(b.x+S.x0<r.x){b.x=r.x-S.x0;b.vx=Math.abs(b.vx)*.3}if(b.x+S.x1>r.x+r.w){b.x=r.x+r.w-S.x1;b.vx=-Math.abs(b.vx)*.3}if(b.y+S.y0<r.y){b.y=r.y-S.y0;b.vy=Math.abs(b.vy)*.3}if(b.y+S.y1>r.y+r.h){b.y=r.y+r.h-S.y1;b.vy=-Math.abs(b.vy)*.3}}
let raf=0,calm=0,budget=0;function kick(){budget=performance.now()+2500;if(!raf)raf=requestAnimationFrame(step);}function tick(){if(!raf)raf=requestAnimationFrame(step);}
function step(){raf=0;let busy=false;const W=innerWidth;
 for(const s in DR){const o=DR[s];const mx=openMax(o);if(o.glide){setOpen(o,o.open+o.glide);o.glide*=.86;if(Math.abs(o.glide)<.3||o.open<=0||o.open>=mx-0.5)o.glide=0;}
  if(o.open<24&&!o.h.onpointermove&&!o.glide&&o.open>0)o.open=Math.max(0,o.open-4);
  const v=o.open-o.pv;const acc=v-o.v;o.v=v;o.pv=o.open;if(Math.abs(v)>.05||o.glide)busy=true;
  if(s==='L'){o.el.style.transform=`translateX(${o.open-W}px)`;o.el.style.zIndex=o.open>40?'17':'12';}
  else {const B=boardBox();o.el.style.transform=`translateY(${B.h-o.open}px)`;document.documentElement.style.setProperty('--boardOpen',o.open+'px');}
  o.el.classList.toggle('shut',o.open<1);
  if(Math.abs(v)>.05)rollSnd(v);
  const B=o.bodies;
  for(const b of B){if(Math.abs(acc)>.05&&!b.z){const push=Math.max(-3,Math.min(3,acc))*.35;if(s==='L')b.vx-=push;else b.vy-=push;}
   if(b.z>0||b.vz){b.vz-=1.6;b.z+=b.vz;if(b.z<=0){b.z=0;if(b.vz<-5){b.vz=-b.vz*.38;knock(Math.min(.25,-b.vz*.02+.04),380+Math.random()*120)}else b.vz=0;}}
   b.vx*=.9;b.vy*=.9;b.x+=b.vx;b.y+=b.vy;clampB(o,b);}
  for(let it=0;it<3;it++){let any=false;for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],c=B[j];if(a.sec!==c.sec||a.z>8||c.z>8)continue;if(collide(a,c))any=true;}for(const b of B)clampB(o,b);if(!any)break;}
  for(const b of B){if(Math.abs(b.vx)+Math.abs(b.vy)>.25||b.z>0||b.vz)busy=true;const tf=`translate3d(${(b.x-PS/2).toFixed(1)}px,${(b.y-PS/2-b.z).toFixed(1)}px,0)`+(b.z>0?` scale(${1+b.z*.006})`:''),zi=b.z>0?5:1;if(b._tf!==tf){b.el.style.transform=tf;b._tf=tf;}if(b._zi!==zi){b.el.style.zIndex=zi;b._zi=zi;}}}
 if(Math.abs(DR.L.v)<.05&&Math.abs(DR.R.v)<.05&&roll)roll.g.gain.setTargetAtTime(0,DAC.currentTime,.05);
 const live=busy&&(performance.now()<budget||[DR.L,DR.R].some(o=>o.glide||o.h.onpointermove||Math.abs(o.v)>.05));if(live){calm=0;tick();}else if(++calm<10)tick();else{calm=0;for(const s in DR)for(const b of DR[s].bodies){b.vx=b.vy=0;}}}
// which drawer (and where in it) is under a screen point
function drawerAt(x,y){const W=innerWidth;if(DR.L.open>0&&x<DR.L.open)return {side:'L',x:x+W-DR.L.open,y};
 const B=boardBox();if(DR.R.open>8&&y>=innerHeight-DR.R.open&&x>=B.left&&x<=B.left+B.w)return {side:'R',x:x-B.left,y:y-(innerHeight-DR.R.open)};return null;}
function secAt(lx,ly){const r=secRects().find(r=>lx>=r.x&&lx<r.x+r.w&&ly>=r.y&&ly<r.y+r.h);return r?r.c:null;}
// release a held piece: into a drawer, else onto the globe (anything not placed/parked goes back to the left drawer)
function release(p,x,y,vx,vy){hiliteMach(-1,-1);vx=vx||0;vy=vy||0;
 const mk=machineAt(x,y);if(mk){beginMachineRun(mk,p).then(ok=>{if(ok)return;if(p.parked){renderTray();return}if(p.body){renderTray();return}if(p.space){renderTray();return}
  if(!placed.has(p.f.name)&&!p.onPlat&&!p.onBelt){const W=innerWidth;addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),true);}renderTray();syncDrawers();});return;}
 const d=drawerAt(x,y);if(d){if(p.parked)unpark(p);remSpace(p);addBody(d.side,p,d.x,d.y,true,d.side==='R'?secAt(d.x,d.y):null);renderTray();return;}
 const r=G3.dom.getBoundingClientRect();
 const onStage=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
 const ll=onStage?G3.pick(x,y):null;
 if(ll){remSpace(p);drop(p,x,y);if(!placed.has(p.f.name)&&!p.parked&&!p.body&&!p.space){const W=innerWidth;addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),true);}syncDrawers();return;}
 // empty space (not globe, not UI): float or orbit
 if(onStage&&!isUiBlocked(x,y)){const spd=Math.hypot(vx,vy);
  if(spd>=THROW_SPD){addSpace(p,x,y,vx,vy,'float');enterOrbit(p);say('Thrown into orbit 🪐',1600);}
  else addSpace(p,x,y,vx*.35,vy*.35,'float');
  renderTray();syncDrawers();return;}
 if(!placed.has(p.f.name)&&!p.parked&&!p.body&&!p.space){const W=innerWidth;addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),true);}
 syncDrawers();}
window.__release=release;
// carry: piece follows the pointer. A drag releases on lift; a click/tap keeps it on the cursor until the next click/tap.
let carrying=null;function carry(p,e,src){if(carrying)return;select(p);if(p.body)p.body.el.style.visibility='hidden';remSpace(p);
 drag={p,el:src,x:e.clientX,y:e.clientY,moved:true,hist:[{t:performance.now(),x:e.clientX,y:e.clientY}]};ghost=document.createElement('div');ghost.id='ghost';document.body.appendChild(ghost);updateGhostShape();moveGhost(e.clientX,e.clientY);
 const x0=e.clientX,y0=e.clientY,t0=performance.now();let downs=0,hd=0;carrying=p;
 const mv=ev=>{if(!drag)return;moveGhost(ev.clientX,ev.clientY);const h=drag.hist;h.push({t:performance.now(),x:ev.clientX,y:ev.clientY});if(h.length>8)h.shift();},
 dn=ev=>{const skip=ev.target.closest&&ev.target.closest('.dh,#card,#credP,#hints,#zoom,#menuW,#topbar,#machines,header');if(skip&&!(ev.target.closest&&ev.target.closest('.mach'))){hd=1;return;}if(performance.now()-t0<450&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<12){hd=1;ev.stopPropagation();ev.preventDefault();return;}
  downs++;ev.stopPropagation();ev.preventDefault();},
  up=ev=>{if(hd){hd=0;return;}const far=Math.hypot(ev.clientX-x0,ev.clientY-y0)>12;if(!far&&!downs)return;ev.stopPropagation();
   removeEventListener('pointermove',mv,true);removeEventListener('pointerdown',dn,true);removeEventListener('pointerup',up,true);removeEventListener('keydown',esc);
   let vx=0,vy=0;const h=drag&&drag.hist||[];if(h.length>=2){const a=h[0],b=h[h.length-1],dt=Math.max(16,b.t-a.t);vx=(b.x-a.x)/(dt/1000);vy=(b.y-a.y)/(dt/1000);}
   drag=null;ghost.remove();carrying=null;if(p.body)p.body.el.style.visibility='';const b=p.body;if(b)remBody(p);release(p,ev.clientX,ev.clientY,vx,vy);};
 const esc=ev=>{if(ev.key!=='Escape'||carrying!==p)return;removeEventListener('keydown',esc);removeEventListener('pointermove',mv,true);removeEventListener('pointerdown',dn,true);removeEventListener('pointerup',up,true);
  drag=null;ghost.remove();carrying=null;if(p.body)p.body.el.style.visibility='';if(!p.body&&!p.parked&&!p.space&&!placed.has(p.f.name)){const W=innerWidth;addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),true);}renderTray();syncDrawers();};
 addEventListener('keydown',esc);
 addEventListener('pointermove',mv,true);addEventListener('pointerdown',dn,true);addEventListener('pointerup',up,true);}
// stack bottom-left: a random loose piece from the left drawer
const stk=document.createElement('div');stk.id='stack';stk.title='Take a piece';document.body.appendChild(stk);
function drawStack(){const L=pieces.filter(p=>p.dloc==='L');stk.innerHTML=L.slice(0,4).map((p,i)=>`<div class="sp" style="transform:translate(${i*2}px,${-i*3}px) rotate(${(i*37)%20-10}deg)">${shapeSVG(p.f,trayScale(p.f)*.6).svg}</div>`).join('')+`<b>${L.length}</b>`;stk.classList.toggle('empty',!L.length);}
stk.addEventListener('pointerdown',e=>{e.preventDefault();const L=pieces.filter(p=>p.dloc==='L');if(!L.length)return;stk.animate([{transform:'scale(1)'},{transform:'scale(.86,.8)'},{transform:'scale(1)'}],{duration:220});knock(.12,300);carry(L[0],e,stk);});
function syncDrawers(){if(!pieces)return;const W=innerWidth;for(const s in DR)for(const b of [...DR[s].bodies])if(!pieces.includes(b.p))remBody(b.p);for(const p of pieces){const gone=placed.has(p.f.name)||p.parked||p.space||p.onBelt;if((placed.has(p.f.name)||p.parked||p.space||p.onBelt)&&p.body)remBody(p);
  else if(!gone&&!p.body&&carrying!==p)addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),false);}drawStack();}
const _rt=renderTray;renderTray=function(){_rt();if(typeof DR!=='undefined')syncDrawers();};
addEventListener('resize',()=>{layoutSecs();for(const s in DR){const o=DR[s];setOpen(o,o.open);for(const b of o.bodies)clampB(o,b);}kick();});layoutSecs();
syncDrawers();kick();
// ---------- provinces: a box of named, fogged province pieces pops out for each placed country ----------
let provPlaced=new Set(),provOpen=[],provFind={};// provOpen: countries whose provinces are still being placed (in order)
const pbox=document.createElement('div');pbox.id='provBox';pbox.hidden=true;document.body.appendChild(pbox);
function provPending(){return provOpen[0]||null}
function provReset(){provPlaced=new Set();provOpen=[];provFind={};pbox.hidden=true;pbox.innerHTML='';}
function provKey(pf){return pf.country+'|'+pf.name}
/* Far-flung overseas: not in the densest geographic cluster (join ≤2800 km). */
function markOverseas(feats){if(!feats||feats.length<2){for(const f of feats||[])f.overseas=false;return}
 const JOIN=2800/6371,NEAR=800/6371;let best=feats[0],bestN=-1;
 for(const f of feats){let n=0;for(const g of feats)if(g!==f&&d3.geoDistance(f.c,g.c)<NEAR)n++;if(n>bestN||(n===bestN&&(f.a||0)>(best.a||0))){best=f;bestN=n}}
 const main=new Set([best]);let grew=true;
 while(grew){grew=false;for(const f of feats){if(main.has(f))continue;for(const m of main){if(d3.geoDistance(f.c,m.c)<=JOIN){main.add(f);grew=true;break}}}}
 for(const f of feats)f.overseas=!main.has(f)}
function provAll(n){return GEOP.PV[n]||[]}
function provMainland(n){return provAll(n).filter(pf=>!pf.overseas)}
function provOverseas(n){return provAll(n).filter(pf=>pf.overseas)}
function provLeft(n){return provAll(n).filter(pf=>!provPlaced.has(provKey(pf)))}
function openProv(n,quiet){if(!provLeft(n).length){return}if(!provOpen.includes(n))provOpen.push(n);renderProv(!quiet);}
function renderProv(pop){const n=provPending();if(!n){pbox.hidden=true;pbox.innerHTML='';return}const L=provLeft(n),tot=provAll(n).length;
 pbox.innerHTML=`<div class="pbh"><b>Provinces of ${n}</b> <span>${tot-L.length} / ${tot}</span></div><div class="pbl"></div>`;const box=pbox.lastChild;
 for(const pf of L){const d=document.createElement('div');d.className='pv'+(pf.overseas?' ovseas':'');d.dataset.n=pf.name;
  if(pf.overseas){ensureProvFinder(pf);d.dataset.find='1'}
  const g=shapeSVG(pf,Math.min(60/Math.max(pf.rad,.004)/2.2,2400));d.innerHTML=g.svg+`<span>${pf.name}</span>`+(pf.overseas?'<i class="fmeter" title="Finderator">🧭</i>':'');
  const sv=d.firstChild;sv.setAttribute('width',54);sv.setAttribute('height',54);d.addEventListener('pointerdown',e=>provDrag(e,pf,d));box.appendChild(d);}
 pbox.hidden=false;if(pop)pbox.animate([{transform:'translate(-50%,60px) scale(.6)',opacity:0},{transform:'translate(-50%,0) scale(1)',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});}
function placeProv(pf,quiet){if(provPlaced.has(provKey(pf)))return;provPlaced.add(provKey(pf));G3.provNow(pf,FACTS[pf.country][0]);clearProvFinder(pf);if(quiet)return;play('place');
 const n=pf.country;if(!provLeft(n).length){provOpen=provOpen.filter(q=>q!==n);say(`✅ ${n} complete! Connect the next country.`,2600);renderProv(true);joinParked();
  if(placed.size==pieces.length&&!provOpen.length){play('win');setTimeout(()=>say('🎉 You finished the puzzle! 🎉',5000),2700);}}else renderProv(false);}

let pdrag=null;
function provDrag(e,pf,el){if(carrying||drag)return;e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);const gh=document.createElement('div');gh.id='ghost';gh.className='pvg';document.body.appendChild(gh);
 const g=shapeSVG(pf,Math.max(G3.screenRadius(),1));gh.innerHTML=g.svg;let sz=2*g.r;if(sz<28){gh.firstChild.setAttribute('width',28);gh.firstChild.setAttribute('height',28);sz=28}
 const mv=(x,y)=>gh.style.transform=`translate3d(${x-sz/2}px,${y-sz/2}px,0)`;mv(e.clientX,e.clientY);pdrag={pf,el,gh};el.style.opacity=.3;
 el.onpointermove=ev=>{mv(ev.clientX,ev.clientY);tickProvFinder(pf,ev.clientX,ev.clientY,gh)};
 el.onpointerup=el.onpointercancel=ev=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;gh.remove();el.style.opacity='';pdrag=null;if(ev.type==='pointerup')provDrop(pf,ev.clientX,ev.clientY,el);};}
function provCancel(){if(!pdrag)return false;const {el,gh}=pdrag;el.onpointermove=el.onpointerup=el.onpointercancel=null;gh.remove();el.style.opacity='';pdrag=null;return true}
function provFits(pf,x,y){const ll=G3.pick(x,y);if(!ll)return false;if(d3.geoContains(pf,ll))return true;if(d3.geoDistance(ll,pf.c)<Math.max(.02,pf.rad*.6))return true;
 if(G3.facing(pf.c[0],pf.c[1])){const [px,py]=G3.project(pf.c[0],pf.c[1]);if(Math.hypot(px-x,py-y)<22)return true}return false}
function provDrop(pf,x,y,el){if(provFits(pf,x,y)){placeProv(pf);return}play('miss');el.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:280});}

// ---------- Coins + metallic conveyor machines ----------
let coins=0;
const pouchWrap=document.getElementById('pouchWrap');
const coinCountEl=document.getElementById('coinCount');
const freeCoins=[]; // {el,x,y,vx,vy,phase,peak,frozen,ang}
let mx=0,my=0;
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;for(const c of freeCoins){if(c.phase==='hover'){const d=Math.hypot(mx-c.x,my-c.y);if(d<120){c.phase='magnet';c.el.classList.remove('spin');}}}if(freeCoins.length&&!burstCoinsAt._raf)burstCoinsAt._raf=requestAnimationFrame(tickCoins);},{passive:true});
function setCoins(n){coins=Math.max(0,n|0);if(coinCountEl)coinCountEl.textContent=String(coins);updMachCosts();try{/* live */}catch(e){}}
function addCoins(n){setCoins(coins+n)}
function updMachCosts(){for(const el of machWrap.querySelectorAll('.mach')){const c=+el.dataset.cost||0;const costEl=el.querySelector('.machCost');if(costEl){costEl.textContent='🪙 '+c;costEl.classList.toggle('broke',coins<c);}}}
function beepMach(){try{const ctx=dac()||DAC;if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=880;g.gain.value=muted?0:.05;o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.12);o.stop(ctx.currentTime+.14);setTimeout(()=>{const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='square';o2.frequency.value=1320;g2.gain.value=muted?0:.04;o2.connect(g2);g2.connect(ctx.destination);o2.start();g2.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.1);o2.stop(ctx.currentTime+.12);},90);}catch(e){}}
// Stylised canopy height in screen px (city trees ~0.005 world ≈ R/300; floor so hover stays readable at globe zoom).
function coinTreePx(){const R=(window.G3&&G3.screenRadius)?G3.screenRadius():240;return Math.max(10,Math.min(16,R*0.042));}
// Hi-res per-angle coin textures (≥512px); linear scale via CSS image-rendering:auto
const COIN_FRAMES=Array.from({length:8},(_,i)=>'img/coin-f'+i+'.png?v=coins3');
COIN_FRAMES.forEach(u=>{const im=new Image();im.src=u;});
function burstCoinsAt(x,y,n){n=n||5;const zoom=Math.max(.55,Math.min(1.15,(window.G3&&G3.screenRadius?G3.screenRadius():220)/280));
 const tree=coinTreePx(),peakLift=tree*2; // hover peak ≈ twice treetops above the country surface
 for(let i=0;i<n;i++){const el=document.createElement('div');el.className='coinFly';const sz=Math.round(16+10*zoom);el.style.width=sz+'px';el.style.height=sz+'px';el.style.margin=(-sz/2)+'px 0 0 '+(-sz/2)+'px';
  el.style.backgroundSize='100% 100%';el.style.backgroundPosition='0 0';
  // Burst is still snappy, but apex is the low peak (no sky-high arc).
  const lift=peakLift*(.88+Math.random()*.24),peak=y-lift;
  const ang=-Math.PI/2+(Math.random()-.5)*.55; // mostly straight up
  const spd=Math.sqrt(2*1500*lift)*(0.92+Math.random()*0.2); // physics apex ≈ peak
  const c={el,x,y,vx:Math.cos(ang)*spd*(.35+Math.random()*.35),vy:Math.sin(ang)*spd,phase:'up',peak,frozen:false,ang:Math.random()*360,spin:220+Math.random()*160,born:performance.now(),frame:-1,sz};
  coinSetFrame(c);el.style.left=x+'px';el.style.top=y+'px';document.body.appendChild(el);freeCoins.push(c);}
 if(!burstCoinsAt._raf)burstCoinsAt._raf=requestAnimationFrame(tickCoins);}
function coinSetFrame(c){const n=8;const fi=((Math.floor(c.ang/45)%n)+n)%n;if(fi===c.frame)return;c.frame=fi;c.el.style.backgroundImage='url('+COIN_FRAMES[fi]+')';}
function tickCoins(t){burstCoinsAt._raf=0;const dt=Math.min(.032,(tickCoins._t? (t-tickCoins._t):16)/1000);tickCoins._t=t;const MAG=120;
 for(let i=freeCoins.length-1;i>=0;i--){const c=freeCoins[i];
  if(c.phase==='up'){c.vy+=1500*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=.985;
   if(c.y<c.peak){c.y=c.peak;c.vy=0;} // never overshoot the treetop peak
   c.ang+=c.spin*dt;coinSetFrame(c);
   if(c.vy>=0&&c.y>=c.peak-0.5){c.y=c.peak;c.vy=0;c.vx*=.15;c.phase='hover';c.el.classList.add('spin');}}
  else if(c.phase==='hover'){c.ang+=c.spin*dt;coinSetFrame(c);c.x+=Math.sin(t/450+c.ang)*.9*dt;c.y=c.peak+Math.sin(t/380+c.ang*.7)*1.2;const dx=mx-c.x,dy=my-c.y,d=Math.hypot(dx,dy);
   if(d<MAG&&d>1){c.phase='magnet';c.el.classList.remove('spin');}}
  else if(c.phase==='magnet'){const dx=mx-c.x,dy=my-c.y,d=Math.hypot(dx,dy)||1;const pull=Math.min(4200,1400+3200*(1-Math.min(d,MAG)/MAG));c.vx=c.vx*.55+(dx/d)*pull*dt*60;c.vy=c.vy*.55+(dy/d)*pull*dt*60;c.x+=c.vx*dt;c.y+=c.vy*dt;c.ang+=c.spin*dt;coinSetFrame(c);
   if(d<18){const b=document.createElement('div');b.className='coinBurst';b.style.left=c.x+'px';b.style.top=c.y+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),360);c.el.remove();freeCoins.splice(i,1);addCoins(1);play('place');continue;}}
  c.el.style.left=c.x+'px';c.el.style.top=c.y+'px';}
 if(freeCoins.length)burstCoinsAt._raf=requestAnimationFrame(tickCoins);else tickCoins._t=0;}
function spawnPlaceCoins(p){if(!p||!window.G3)return;const c=p.f.c;if(!G3.facing(c[0],c[1]))return;const [x,y]=G3.project(c[0],c[1]);const n=4+((Math.random()*3)|0);burstCoinsAt(x,y,n);}


// ---------- planet-relative orbit (depth-tested; UI only blocks the visible part) ----------
const THROW_SPD=780,HOLD_MS=480,MIN_RAD=1.72;
function globeXY(){const r=G3.dom.getBoundingClientRect();return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2,R:Math.max(G3.screenRadius(),80)};}
function isUiBlocked(x,y){try{const el=document.elementFromPoint(x,y);if(!el)return false;
  if(el.closest&&(el.closest('.spPiece')||el.closest('#ghost')||el.closest('.ride')||el.closest('.coinFly')||el.closest('.pk')))return false;
  if(el.closest&&el.closest('.dh'))return true;
  return !!(el.closest&&el.closest('#machines,#hints,#hudCol,#stack,#zoom,#menuW,#topbar,header,#tubeBar,#countriesWrap,#placeTab,#countriesDrop,#pouchWrap,#provBox,#card,#credP,#startM,#pause,.drawer:not(.shut),#scr'));}catch(e){return false;}}
function uiRects(){const rects=[];for(const s of ['header','#tubeBar','#hudCol','#stack','#zoom','#pouchWrap','#menuW','#provBox']){const el=document.querySelector(s);if(!el||el.hidden)continue;const r=el.getBoundingClientRect();if(r.width>2&&r.height>2&&r.bottom>0&&r.right>0)rects.push(r);}
 if(DR.R&&DR.R.open>1)rects.push(DR.R.el.getBoundingClientRect());if(DR.L&&DR.L.open>1)rects.push(DR.L.el.getBoundingClientRect());return rects;}
function overlapsUI(box){const m=14;if(box.minX<m||box.minY<m||box.maxX>innerWidth-m||box.maxY>innerHeight-m)return true;
 for(const r of uiRects())if(box.maxX>r.left-m&&box.minX<r.right+m&&box.maxY>r.top-m&&box.minY<r.bottom+m)return true;return false;}
function maxOrbitRad(){const cam=G3.cam().p,D=Math.hypot(cam[0],cam[1],cam[2]);const g=Math.max(48,G3.screenRadius());
 const maxPx=Math.min(innerWidth,innerHeight)*0.46-12;let rad=1.5*maxPx/g;return Math.max(MIN_RAD,Math.min(rad,D*0.55,3.05));}
function orbDir(s){const c=Math.cos(s.ang),sn=Math.sin(s.ang);return {x:c*s.ux+sn*s.vx,y:c*s.uy+sn*s.vy,z:c*s.uz+sn*s.vz};}
function dirToLonLat(d){const lat=Math.asin(Math.max(-1,Math.min(1,d.y)))*180/Math.PI,lon=Math.atan2(d.x,d.z)*180/Math.PI;return [lon,lat];}
function makeOrbit(dir,speed,sign){let x=dir.x,y=dir.y,z=dir.z,len=Math.hypot(x,y,z)||1;x/=len;y/=len;z/=len;
 let ax=-z,ay=0,az=x,al=Math.hypot(ax,ay,az);if(al<1e-4){ax=1;ay=0;az=0;al=1;}ax/=al;ay/=al;az/=al;
 const vx=ay*z-az*y,vy=az*x-ax*z,vz=ax*y-ay*x;return {ux:x,uy:y,uz:z,vx,vy,vz,ang:0,angV:(sign<0?-1:1)*speed};}
function screenDir(x,y){const ll=G3.pick(x,y);if(ll){const la=ll[1]*Math.PI/180,lo=ll[0]*Math.PI/180;return {x:Math.cos(la)*Math.sin(lo),y:Math.sin(la),z:Math.cos(la)*Math.cos(lo)};}return G3.viewDirLocal();}
function syncOrb(s){const d=orbDir(s),ll=dirToLonLat(d);s.lon=ll[0];s.lat=ll[1];}
function orbitBad(p){const s=p.space;if(!s||!G3.sampleBox)return false;const box=G3.sampleBox(s.lon,s.lat,s.rad,(p._ang||0.03)*(s.drawS||1));if(!box.anyVis)return false;return overlapsUI(box);}
function settleOrbit(p){const s=p.space;for(let i=0;i<40;i++){syncOrb(s);if(!orbitBad(p))break;s.ang+=0.14;if(i%5===4)s.drawS=Math.max(0.34,(s.drawS||1)*0.9);}s.prevAng=s.ang;syncOrb(s);}
function applyOrb(p){const s=p.space;if(!s||!p.pid)return;G3.pc.set(p.pid,{lon:s.lon,lat:s.lat,s:s.drawS||1,a:p.angle,rad:s.rad,op:1,vis:true});}
function stepOrbit(p,dt){const s=p.space;s.ang+=s.angV*dt;syncOrb(s);
 const cap=maxOrbitRad();if(s.rad>cap)s.rad+=(cap-s.rad)*Math.min(1,dt*2);if(s.rad<MIN_RAD)s.rad=MIN_RAD;
 if(orbitBad(p)){s.angV*=-1;let cleared=false;
  for(let i=0;i<18;i++){s.ang+=s.angV*0.06;syncOrb(s);if(!orbitBad(p)){cleared=true;break;}}
  if(!cleared){s.drawS=Math.max(0.32,(s.drawS||1)*0.86);s.rad=Math.max(MIN_RAD,Math.min(s.rad,cap));syncOrb(s);}
 }s.prevAng=s.ang;applyOrb(p);}
function remSpace(p){if(!p||!p.space)return;if(p.pid&&!p.parked){G3.pc.del(p.pid);p.pid=null;}p.space=null;kickSpace();}
function addSpace(p,x,y,vx,vy,mode){if(p.parked)unpark(p);if(p.body)remBody(p);remSpace(p);p.onPlat=null;p.onBelt=null;buildMesh(p);
 const spd=Math.hypot(vx||0,vy||0),orbiting=mode==='orbit'||spd>=THROW_SPD;
 const s=makeOrbit(screenDir(x,y),orbiting?1.05:0.22,vx<0?-1:1);
 s.rad=Math.min(2.15,maxOrbitRad());s.drawS=1;s.mode=orbiting?'orbit':'float';s.stuck=0;p.space=s;settleOrbit(p);applyOrb(p);kickSpace();return s;}
function restoreOrbit(p,o){if(p.parked)unpark(p);if(p.body)remBody(p);remSpace(p);buildMesh(p);
 p.space=Object.assign({drawS:1,mode:'float',stuck:0,angV:0.16},o);syncOrb(p.space);settleOrbit(p);applyOrb(p);kickSpace();}
function enterOrbit(p){const s=p.space;if(!s)return;s.mode='orbit';const sign=s.angV<0?-1:1;s.angV=sign*Math.max(0.55,Math.abs(s.angV));}
function kickSpace(){if(!kickSpace._raf)kickSpace._raf=requestAnimationFrame(tickSpace);}
function tickSpace(t){kickSpace._raf=0;const dt=Math.min(.033,(tickSpace._t?(t-tickSpace._t):16)/1000);tickSpace._t=t;let live=0;
 for(const p of (pieces||[])){if(!p.space)continue;live++;stepOrbit(p,dt);}if(live)kickSpace._raf=requestAnimationFrame(tickSpace);else tickSpace._t=0;}
function claimPiece(e){if(e.button>0||carrying||drag)return false;let p=null,kind=null;
 const pid=G3.pickPiece&&G3.pickPiece(e.clientX,e.clientY);if(pid){p=pieces.find(q=>q.pid===pid);if(p)kind=p.space?'space':p.parked?'park':null;}
 if(p&&anchorBlocked(p)){p=null;kind=null;}
 if(!p){p=placedAt(G3.pick(e.clientX,e.clientY));kind=p?'placed':null;}
 if(!p)return false;e.preventDefault();e.stopImmediatePropagation();select(p);
 const x0=e.clientX,y0=e.clientY,id=e.pointerId;let moved=false,held=false;
 const timer=kind==='space'?setTimeout(()=>{held=true;if(p.space){enterOrbit(p);say('Orbiting 🪐',1400);}},HOLD_MS):0;
 const off=()=>{clearTimeout(timer);removeEventListener('pointermove',mv,true);removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);};
 const mv=ev=>{if(ev.pointerId!==id||moved)return;if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<6)return;moved=true;clearTimeout(timer);off();
  if(kind==='placed')unplace(p);else if(kind==='space')remSpace(p);else if(kind==='park')unpark(p);carry(p,ev,document.body);};
 const up=ev=>{if(ev.pointerId!==id)return;off();};
 addEventListener('pointermove',mv,true);addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);return true;}
window.__claimPiece=claimPiece;

const BELT={find:{l:'7.67%',t:'23.9%',w:'25.33%',h:'37.74%',iw:600,pitch:20,src:'img/belt-find.png'},
 size:{l:'7.65%',t:'23.79%',w:'25.29%',h:'37.62%',iw:601,pitch:20,src:'img/belt-size.png'},
 orient:{l:'7.67%',t:'23.66%',w:'25.33%',h:'37.85%',iw:600,pitch:20,src:'img/belt-orient.png'}};
const MACH=[{id:'find',title:'Finderator',blurb:'Hot & cold meter',cost:5,img:'img/mach-find.png'},
 {id:'size',title:'Sizeinator',blurb:'True globe size',cost:3,img:'img/mach-size.png'},
 {id:'orient',title:'Orientationator',blurb:'Turns north-up',cost:3,img:'img/mach-orient.png'}];
const machWrap=document.getElementById('machines');
machWrap.innerHTML=MACH.map(m=>{const b=BELT[m.id];return `<div class="mach" data-id="${m.id}" data-cost="${m.cost}" title="${m.blurb} · ${m.cost} coins">
  <img class="machImg" src="${m.img}" alt="${m.title}" draggable="false">
  <div class="beltWin" style="left:${b.l};top:${b.t};width:${b.w};height:${b.h}"><div class="beltScroll" data-pitch="${b.pitch}" data-iw="${b.iw}" style="background-image:url(${b.src})"></div></div>
  <div class="machMeta"><span class="machName">${m.title}</span><span class="machCost">🪙 ${m.cost}</span></div>
  <div class="inBelt" title="Drop piece on belt" style="left:${b.l};top:${b.t};width:${b.w};height:${b.h}"></div>
</div>`;}).join('');
(function tickBelts(now){for(const el of machWrap.querySelectorAll('.mach')){const sc=el.querySelector('.beltScroll');if(!sc)continue;
  const moving=el.classList.contains('near')||el.classList.contains('busy')||el.classList.contains('over')||el.classList.contains('pushing');
  if(!moving){if(sc._on){sc.style.backgroundPositionX='0px';sc._on=0;}continue;}
  const w=el.getBoundingClientRect().width||200,pitch=Math.max(4,(+sc.dataset.pitch)/(+sc.dataset.iw)*w);
  const dir=el.classList.contains('pushing')?-1:1;sc.style.backgroundPositionX=(((-now/14)*dir)%pitch)+'px';sc._on=1;}
 requestAnimationFrame(tickBelts);})(performance.now());
machWrap.hidden=true;
const machById={};for(const el of machWrap.querySelectorAll('.mach'))machById[el.dataset.id]=el;

const hintsEl=document.getElementById('hints');
const hintsToggle=document.getElementById('hintsToggle');
const HINTS_KEY='worldJigsaw.hintsOpen';
function setHintsOpen(open){
  hintsEl.classList.toggle('collapsed',!open);
  hintsToggle.setAttribute('aria-expanded',open?'true':'false');
  hintsToggle.textContent=open?'▾':'▸';
  try{localStorage.setItem(HINTS_KEY,open?'1':'0')}catch(e){}
}
(function initHints(){
  let open=true;
  try{const v=localStorage.getItem(HINTS_KEY);if(v==='0')open=false;else if(v==='1')open=true}catch(e){}
  setHintsOpen(open);
})();
hintsToggle.addEventListener('click',()=>setHintsOpen(hintsEl.classList.contains('collapsed')));

function machMouth(el){const r=el.getBoundingClientRect();return {x:r.left+r.width*0.55,y:r.top+r.height*0.52};}
function machBeltEnds(el){const belt=el.querySelector('.inBelt');const br=belt.getBoundingClientRect();
  const mouth=machMouth(el);return {left:br.left+10,right:mouth.x,y:(br.top+br.bottom)/2,br};}
function machineAt(x,y){for(const el of machWrap.querySelectorAll('.mach')){if(el.classList.contains('busy')&&!el.classList.contains('pushing'))continue;
  const belt=el.querySelector('.inBelt');const br=belt.getBoundingClientRect();
  const near=el.classList.contains('near')||el.classList.contains('over')||br.width>20;
  if(near&&x>=br.left-8&&x<=br.right+10&&y>=br.top-12&&y<=br.bottom+12)return el.dataset.id;
  const r=el.getBoundingClientRect();
  if(x>=r.left&&x<=r.left+r.width*0.55&&y>=r.top+8&&y<=r.bottom-8)return el.dataset.id;}
 return null}
function hiliteMach(x,y){if(machWrap.hidden)return;for(const el of machWrap.querySelectorAll('.mach')){
  if(el.classList.contains('busy')&&!el.classList.contains('pushing')){el.classList.remove('near','over');continue;}
  const m=machMouth(el);const d=Math.hypot(x-m.x,y-m.y);const near=d<150;el.classList.toggle('near',near);
  const id=machineAt(x,y);el.classList.toggle('over',el.dataset.id===id);}}
function applyMachEffect(kind,p){if(kind==='size'){p.s=1;say('Sizeinator: true size ✓',1600);return true}
 if(kind==='orient'){setAngle(p,0);say('Orientationator: north-up ✓',1600);return true}
 if(kind==='find'){if(p.finderLost){say('Finderator already spent on this piece',1800);return false}
  enableFinder(p);say('Finderator: hot & cold meter on — drag toward the spot',2600);return true}
 return false}
function runMachine(kind,p){return applyMachEffect(kind,p)}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function beginMachineRun(kind,p){const el=machById[kind];if(!el||!p||placed.has(p.f.name))return false;
 const cost=+el.dataset.cost||0;
 if(coins<cost){say('Not enough coins for the '+el.querySelector('.machName').textContent+' (need '+cost+')',2200);play('miss');return false;}
 if(el.classList.contains('busy')){say('That machine is busy',1800);return false;}
 if(kind==='find'&&p.finderLost){say('Finderator already spent on this piece',1800);return false;}
 setCoins(coins-cost);el.classList.add('busy','near');el._grabbed=false;el._runId=(el._runId|0)+1;const runId=el._runId;
 if(p.parked)unpark(p);if(p.body)remBody(p);remSpace(p);p.onPlat=null;p.onBelt=kind;
 const gsvg=shapeSVG(p.f,trayScale(p.f)*.7);
 const ride=document.createElement('div');ride.className='ride';ride.innerHTML=gsvg.svg;const sv=ride.firstChild;if(sv){sv.setAttribute('width',56);sv.setAttribute('height',56);sv.style.transform=`rotate(${p.angle}deg)`;}
 document.body.appendChild(ride);
 await wait(40);
 const ends=machBeltEnds(el);
 ride.style.transition='none';ride.style.left=ends.left+'px';ride.style.top=ends.y+'px';
 await wait(30);
 ride.style.transition='left .65s linear, top .65s linear';
 ride.style.left=ends.right+'px';ride.style.top=ends.y+'px';
 await wait(680);
 if(el._runId!==runId){ride.remove();return false;}
 ride.style.opacity='0';el.classList.add('blink');try{beepMach();}catch(_){ }play('place');
 await wait(2000);
 if(el._runId!==runId){ride.remove();return false;}
 el.classList.remove('blink');
 applyMachEffect(kind,p);
 el.classList.add('pushing');
 ride.style.opacity='1';
 const ends2=machBeltEnds(el);
 ride.style.transition='none';ride.style.left=ends2.right+'px';ride.style.top=ends2.y+'px';
 await wait(20);
 const outLeft=ends2.left-36;
 const grabAt=ends2.right-36;
 let grabbed=false;
 const onGrab=e=>{if(grabbed||el._runId!==runId)return;e.preventDefault();e.stopPropagation();
  grabbed=true;el._grabbed=true;ride.classList.remove('grabOK');ride.onpointerdown=null;
  ride.remove();p.onBelt=null;el.classList.remove('busy','pushing','near','over');
  carry(p,e,ride);};
 await new Promise(resolve=>{
  const t0=performance.now();const dur=1600;const x0=ends2.right,x1=outLeft;
  function step(now){if(el._runId!==runId||grabbed){resolve();return;}
   const u=Math.min(1,(now-t0)/dur);const xx=x0+(x1-x0)*u;ride.style.left=xx+'px';ride.style.top=ends2.y+'px';
   if(xx<=grabAt&&!ride.classList.contains('grabOK')){ride.classList.add('grabOK');ride.onpointerdown=onGrab;el.classList.remove('busy');}
   if(u>=1){resolve();return;}
   requestAnimationFrame(step);}
  requestAnimationFrame(step);});
 if(grabbed||el._runId!==runId){if(!grabbed)ride.remove();return true;}
 const fx=parseFloat(ride.style.left)||outLeft,fy=ends2.y;
 ride.remove();p.onBelt=null;el.classList.remove('busy','pushing','near','over');
 addSpace(p,fx,fy,-140-Math.random()*80,(Math.random()-.5)*50,'float');
 say('Floating in zero-G — drag onto the globe or throw into orbit',2600);
 renderTray();syncDrawers();return true}
function enableFinder(p){if(p.finderLost)return;p.finder={on:true,calibrated:false,pct0:20+Math.random()*20,dZero:0,tgt:p.f.c.slice(),pct:null};updFinderBadge(p)}
function applyFinder(p,ll){enableFinder(p);if(ll)calibrateFinder(p.finder,ll);return p.finder}
function ensureProvFinder(pf){const k=provKey(pf);if(provFind[k]===null)return;if(!provFind[k])provFind[k]={on:true,calibrated:false,pct0:20+Math.random()*20,dZero:0,tgt:pf.c.slice(),pct:null,builtIn:true}}
function clearProvFinder(pf){}
function calibrateFinder(F,ll){if(!F||!F.on||F.calibrated||!ll)return;
 const d=Math.max(d3.geoDistance(ll,F.tgt),1e-5);F.dZero=d/(1-F.pct0/100);F.calibrated=true;F.start=ll.slice();F.pct=F.pct0}
function finderPctFrom(F,ll){if(!F||!F.on)return null;if(!F.calibrated){calibrateFinder(F,ll);if(!F.calibrated)return F.pct0}
 const d=d3.geoDistance(ll,F.tgt);const pct=Math.max(0,Math.min(100,100*(1-d/F.dZero)));F.pct=pct;return pct}
function finderPct(p,ll){return p&&p.finder?finderPctFrom(p.finder,ll):null}
function loseFinder(p){if(!p||!p.finder)return;p.finder=null;p.finderLost=true;updFinderBadge(p);say('Finderator meter lost (0%)',2000);play('miss')}
function loseProvFinder(pf){const k=provKey(pf);provFind[k]=null;say('Finderator meter lost (0%)',2000);play('miss')}
function updFinderBadge(p){if(p&&p.ov){let b=p.ov.querySelector('.fbadge');if(p.finder&&p.finder.on){if(!b){b=document.createElement('div');b.className='fbadge';p.ov.appendChild(b)}
  const v=p.finder.pct==null?Math.round(p.finder.pct0):Math.round(p.finder.pct);b.textContent=v+'%';b.dataset.hot=v>=70?'1':v>=40?'2':'3'}
  else if(b)b.remove()}}
function showGhostMeter(pct){if(!ghost)return;let m=ghost.querySelector('.fbadge');if(pct==null){if(m)m.remove();return}
 if(!m){m=document.createElement('div');m.className='fbadge';ghost.appendChild(m)}
 m.textContent=Math.round(pct)+'%';m.dataset.hot=pct>=70?'1':pct>=40?'2':'3'}
function tickFinderAt(p,x,y){if(!p||!p.finder||!p.finder.on){showGhostMeter(null);return}
 const ll=G3.pick(x,y);if(!ll){showGhostMeter(p.finder.calibrated?(p.finder.pct??p.finder.pct0):p.finder.pct0);return}
 const pct=finderPctFrom(p.finder,ll);showGhostMeter(pct);updFinderBadge(p);if(pct<=0)loseFinder(p)}
function tickProvFinder(pf,x,y,gh){ensureProvFinder(pf);const F=provFind[provKey(pf)];if(!F){const m=gh.querySelector('.fbadge');if(m)m.remove();return}
 const ll=G3.pick(x,y);const pct=ll?finderPctFrom(F,ll):(F.calibrated?(F.pct??F.pct0):F.pct0);
 let m=gh.querySelector('.fbadge');if(pct==null){if(m)m.remove();return}if(!m){m=document.createElement('div');m.className='fbadge';gh.appendChild(m)}
 m.textContent=Math.round(pct)+'%';m.dataset.hot=pct>=70?'1':pct>=40?'2':'3';if(pct<=0){loseProvFinder(pf);m.remove()}}

// ---------- start menu ----------

const SM_OPTS=[{k:'global',t:'Global',i:'<svg class="tg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="#2d6fa8" stroke="#cfe6ff" stroke-width="1.2"/><path d="M5 6c2 0 3 1 3 3s-2 2-2 4 1 3 1 3M12 3.5c-1 2 1 3 3 3.5s2 3 0 4-2 3-1 4" fill="none" stroke="#9bd17a" stroke-width="2" stroke-linecap="round"/></svg>'},{k:'cont',t:'Continents',i:''},{k:'prov',t:'Provinces',i:''}];
const CONT_SETS=[['Africa','Africa'],['Asia','Asia'],['Europe','Europe'],['Americas','Americas'],['Oceania','Oceania + Antarctica']];
let smI=0;const sm=document.createElement('div');sm.id='startM';sm.hidden=true;document.body.appendChild(sm);
function smMain(){sm.innerHTML=`<div class="smc"><h1>🌍 A World Apart</h1><p class="sub">A jigsaw of the whole wide world</p>
 <div class="ngbar"><button id="smNew">New game</button><div id="smPick" tabindex="0" role="spinbutton" aria-label="Game type" title="Scroll or use ▲ ▼"><button class="pu" aria-label="Previous">▲</button><div class="pw"><div class="pr"></div></div><button class="pd" aria-label="Next">▼</button></div></div>
 ${readSave()?'<button id="smLoad" class="ln">Continue saved game</button>':''}</div>`;
 smShow(0);const pk=$('smPick');pk.querySelector('.pu').onclick=()=>smShow(-1);pk.querySelector('.pd').onclick=()=>smShow(1);
 pk.addEventListener('wheel',e=>{e.preventDefault();smShow(e.deltaY>0?1:-1)},{passive:false});pk.onkeydown=e=>{if(e.key=='ArrowUp'){e.preventDefault();smShow(-1)}if(e.key=='ArrowDown'){e.preventDefault();smShow(1)}};
 $('smNew').onclick=()=>smChoose(SM_OPTS[smI].k);if($('smLoad'))$('smLoad').onclick=async()=>{const S=readSave();if(S){sm.hidden=true;await loadGame(S);}};}
function smShow(d){smI=(smI+d+SM_OPTS.length)%SM_OPTS.length;const r=sm.querySelector('.pr');if(!r)return;const o=SM_OPTS[smI];r.innerHTML=`${o.i}<span>${o.t}</span>`;$('smPick').dataset.k=o.k;
 if(d)r.animate([{transform:`translateY(${d>0?18:-18}px)`,opacity:0},{transform:'none',opacity:1}],{duration:180});}
function smAsk(title,opts,back){sm.innerHTML=`<div class="smc"><h2>${title}</h2><div class="smg">${opts.map((o,i)=>`<button data-i="${i}">${o[1]}</button>`).join('')}</div><button class="ln smBack">← Back</button></div>`;
 sm.querySelectorAll('.smg button').forEach(b=>b.onclick=()=>opts[+b.dataset.i][2]());sm.querySelector('.smBack').onclick=back||smMain;}
function smChoose(k){if(k==='global')return startGame('countries','all');
 if(k==='cont')return smAsk('Which continent?',CONT_SETS.map(([v,t])=>[v,t,()=>startGame('countries',v)]));
 smAsk('Provinces: Global or Continent?',[['g','🌍 Global (30 big countries)',()=>startGame('prov','starter')],['c','Continent',()=>smAsk('Which continent?',CONT_SETS.map(([v,t])=>[v,t,()=>startGame('prov',v)]),()=>smChoose('prov'))]]);}
async function startGame(mode,set){sm.querySelectorAll('button').forEach(b=>b.disabled=true);if(mode==='prov')await loadProvGeo();setMode(mode);$('set').value=set;setPrev=set;buildSet();const v=SETVIEW[set];if(v)spinTo(v,1);sm.hidden=true;machWrap.hidden=false;if(pouchWrap)pouchWrap.hidden=false;setCoins(0);for(const el of machWrap.querySelectorAll('.mach')){el._platP=null;el._runId=(el._runId|0)+1;el.classList.remove('hasPlat','busy','blink','near','over','pushing','delivering');}document.querySelectorAll('.ride').forEach(e=>e.remove());for(const p of (pieces||[])){remSpace(p);p.onBelt=null;p.onPlat=null;}while(freeCoins.length){const c=freeCoins.pop();c.el.remove();}
 hidePlaceTab();closeCountriesDrop();dismissCard();updCountriesUI();say(mode==='prov'?'Provinces: place a country, then fill in its provinces':'New game: '+$('set').selectedOptions[0].textContent,2400);}
function openStart(){cancelHeld&&cancelHeld();smMain();sm.hidden=false;machWrap.hidden=true;if(pouchWrap)pouchWrap.hidden=true;}
// ---------- pause menu + save / load (localStorage) ----------
const SAVE_KEY='worldJigsaw.save.v1';
function snapshot(){return {v:5,t:Date.now(),coins,mode:MODE,provPlaced:[...provPlaced],provOpen:[...provOpen],provFind:Object.assign({},provFind),set:$('set').value,opts:{easy:$('easy').checked,lbl:$('lbl').checked,bg:$('bg').value,muted},
 quat:G3.quat(),cam:G3.cam(),drawers:{L:DR.L.open,R:DR.R.open},placed:[...placed],anchorName,anc:anc?{n:anc.p.f.name,step:anc.step}:null,
 pieces:pieces.map(p=>{const o={n:p.f.name,angle:p.angle,hint:p.hint};if(p.finder)o.finder=JSON.parse(JSON.stringify(p.finder));if(p.finderLost)o.finderLost=true;if(placed.has(p.f.name))o.st='placed';else if(p.parked){o.st='parked';o.lon=p.lon;o.lat=p.lat;o.s=p.s;}
  else if(p.space){const s=p.space;o.st='space';o.smode=s.mode;o.orb={ux:s.ux,uy:s.uy,uz:s.uz,vx:s.vx,vy:s.vy,vz:s.vz,ang:s.ang,angV:s.angV,rad:s.rad,drawS:s.drawS,mode:s.mode};}
  else if(p.body){o.st=p.dloc;o.x=p.body.x;o.y=p.body.y;o.sec=p.body.sec;}else o.st='L';return o;})};}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()));toast('Game saved');}catch(e){toast('Could not save: '+e.message);}updPause();}
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){return null}}
function cancelHeld(){if(carrying){dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return true}
 if(provCancel())return true;
 if(drag){const d=drag;d.el.onpointermove=d.el.onpointerup=d.el.onpointercancel=null;drag=null;ghost.remove();d.el.style.opacity='';return true}return false}
async function loadGame(S){if(!S||!S.pieces)return false;cancelHeld();for(const p of (pieces||[]))remSpace(p);document.querySelectorAll('.ride').forEach(e=>e.remove());sm.hidden=true;machWrap.hidden=false;if(pouchWrap)pouchWrap.hidden=false;setCoins(S.coins|0);const md=S.mode||'countries';if(md==='prov')await loadProvGeo();setMode(md);$('card').hidden=true;$('flagPop').hidden=true;
 const o=S.opts||{};$('easy').checked=!!o.easy;$('lbl').checked=o.lbl!==false;G3.labels($('lbl').checked);$('bg').value=o.bg||'0';G3.setBg(+$('bg').value);muted=!!o.muted;$('mute').textContent=muted?'🔇':'🔊';
 $('set').value=S.set;setPrev=S.set;buildSet();
 const byN={};for(const p of pieces)byN[p.f.name]=p;pieces=S.pieces.map(q=>{const p=byN[q.n];p.angle=q.angle;p.hint=q.hint||0;p.finder=q.finder?JSON.parse(JSON.stringify(q.finder)):null;p.finderLost=!!q.finderLost;return p}).filter(Boolean);
 stripeTotal=pieces.reduce((s,p)=>s+cols(p.f.name).length,0)||1;
 G3.setQuat(S.quat);
 anchorName=S.anchorName||(S.anc&&S.anc.n)||null;
 for(const n of S.placed){const p=byN[n];if(!p)continue;placed.add(n);if(MODE==='prov')G3.fog(p.f);else G3.placeNow(p.f,FACTS[n][0]);for(const c of cols(n)){const st=document.createElement('div');st.className='stripe';st.style.background=c;st.style.width=(100/stripeTotal)+'%';st.style.height='100%';$('tubeFill').appendChild(st);}}
 if(MODE==='prov'){const K=new Set(S.provPlaced||[]);for(const n of S.placed)for(const pf of GEOP.PV[n]||[])if(K.has(provKey(pf)))placeProv(pf,true);
  provFind=Object.assign({},S.provFind||{});
  for(const n of (S.provOpen||[]))openProv(n,true);}
 for(const q of S.pieces)if(q.st==='parked')park(byN[q.n],[q.lon,q.lat],q.s);
 if(S.anc){const p=byN[S.anc.n];if(p&&p.parked){anc={p,step:S.anc.step};p.ov.classList.add('anc');p.ov.style.cursor='default';p.ov.addEventListener('pointerdown',ancDown);if(anc.step==='lat')G3.outline(p.f);else if(anc.step==='blink')nextStep();}}
 for(const q of S.pieces){const p=byN[q.n];if(!p)continue;if(q.st==='space'){if(q.orb)restoreOrbit(p,q.orb);else addSpace(p,q.x||innerWidth/2,q.y||innerHeight/2,q.vx||0,q.vy||0,q.smode||'float');}else if(q.st==='L'||q.st==='R'){if(q.x==null){if(!p.body)addBody('L',p,40+Math.random()*(innerWidth-80),40+Math.random()*(innerHeight-120),false);continue}const b=addBody(q.st,p,q.x,q.y,false,q.sec);b.vx=b.vy=0;}}
 DR.L.glide=DR.R.glide=0;DR.L.open=Math.max(0,Math.min(innerWidth-44,S.drawers.L||0));DR.R.open=Math.max(0,Math.min(boardBox().h,S.drawers.R||0));for(const s in DR){DR[s].pv=DR[s].open;DR[s].v=0;}
 sel=null;renderTray();for(const s in DR)for(const b of DR[s].bodies){b.vx=b.vy=0;}
 if(S.cam)G3.setCam(S.cam);updHints();progress();hidePlaceTab();closeCountriesDrop();updCountriesUI();kick();toast('Game loaded');return true;}
const pz=document.createElement('div');pz.id='pause';pz.hidden=true;pz.innerHTML='<div class="pb"><h3>Paused</h3><button id="pzRes">Resume</button><button id="pzSave">Save game</button><button id="pzLoad">Load saved game</button><div id="pzInfo"></div></div>';document.body.appendChild(pz);
const tst=document.createElement('div');tst.id='toast';document.body.appendChild(tst);
function toast(t){tst.textContent=t;tst.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>tst.classList.remove('on'),1800);}
function updPause(){const S=readSave();$('pzLoad').disabled=!S;$('pzInfo').textContent=S?'Saved: '+new Date(S.t).toLocaleString()+' · '+S.placed.length+' placed':'No saved game yet';}
function openPause(){cancelHeld();updPause();pz.hidden=false;$('pzRes').focus({preventScroll:true});}
function closePause(){pz.hidden=true;}
$('pzRes').onclick=closePause;$('pzSave').onclick=()=>{saveGame();};
$('pzLoad').onclick=async()=>{const S=readSave();if(!S)return;if((placed.size||parked.length||anc)&&!confirm('Load your saved game? Your current progress will be replaced.'))return;closePause();await loadGame(S);};
pz.onclick=e=>{if(e.target===pz)closePause()};
addEventListener('keydown',e=>{if(e.key!=='Escape')return;
 if(carrying)return;// the carry handler drops the piece first
 if(pdrag){provCancel();e.stopImmediatePropagation();return}
 if(drag){cancelHeld();e.stopImmediatePropagation();return}
 if(!pz.hidden){closePause();e.stopImmediatePropagation();return}
 if(!$('card').hidden||!$('credP').hidden||!sm.hidden)return;// Esc closes those first; no pause over the start menu
 if(e.target.closest&&e.target.closest('select'))return;
 openPause();},true);
{const sb=document.createElement('button');sb.id='startB';sb.textContent='Start menu';$('menuL').prepend(sb);sb.onclick=()=>{$('menuL').hidden=true;if((placed.size||parked.length)&&!confirm('Go to the start menu? Unsaved progress will be lost when you start a new game.'))return;openStart();};}
{const mb=document.createElement('button');mb.id='pauseB';mb.textContent='Pause / Save / Load (Esc)';$('menuL').prepend(mb);mb.onclick=()=>{$('menuL').hidden=true;$('menuB').setAttribute('aria-expanded',false);openPause();};}
Object.assign(window.__game,{saveGame,loadGame,snapshot,readSave,openPause,openStart,startGame,placeProv,provLeft,provMainland,provOverseas,applyFinder,finderPct,runMachine,enableFinder,machineAt,beginMachineRun,burstCoinsAt,spawnPlaceCoins,coinTreePx,setCoins,addCoins,addSpace,remSpace,enterOrbit,isUiBlocked,dismissCard,showPlaceTab,openCountryCard,updCountriesUI,hidePlaceTab,collectAllCoins:()=>{while(freeCoins.length){const c=freeCoins.pop();c.el.remove();addCoins(1);}}});Object.defineProperty(window.__game,'coins',{get:()=>coins});Object.defineProperty(window.__game,'freeCoins',{get:()=>freeCoins.length});Object.defineProperty(window.__game,'provFind',{get:()=>provFind});Object.defineProperty(window.__game,'GEOP',{get:()=>GEOP});Object.defineProperty(window.__game,'mode',{get:()=>MODE});Object.defineProperty(window.__game,'provOpen',{get:()=>provOpen});Object.defineProperty(window.__game,'provPlaced',{get:()=>provPlaced});
addEventListener('gameready',()=>{if(!/[?&]play\b/.test(location.search))openStart();});Object.defineProperty(window.__game,'pause',{get:()=>!pz.hidden});
Object.assign(window.__game,{DR,setOpen:(o,v)=>{o.glide=0;setOpen(o,v)},carry,release,drawStack,addBody,unplace,claimPiece,layoutChrome});Object.defineProperty(window.__game,'carrying',{get:()=>carrying});Object.defineProperty(window.__game,'anchorName',{get:()=>anchorName});
addEventListener('resize',()=>{layoutSecs();});layoutChrome();
})();
(function(){const B=document.getElementById('menuB'),L=document.getElementById('menuL'),P=document.getElementById('credP');if(!B)return;
B.onclick=e=>{e.stopPropagation();L.hidden=!L.hidden;B.setAttribute('aria-expanded',!L.hidden)};document.addEventListener('click',e=>{if(!L.hidden&&!L.contains(e.target)){L.hidden=true;B.setAttribute('aria-expanded',false)}});
document.getElementById('credB').onclick=()=>{L.hidden=true;P.hidden=false};document.getElementById('credX').onclick=()=>P.hidden=true;P.onclick=e=>{if(e.target===P)P.hidden=true};addEventListener('keydown',e=>{if(e.key==='Escape')P.hidden=true});})();
(function(){const st=document.getElementById('stack'),sg=document.getElementById('stage');if(!st||!sg)return;
 const f=()=>{const r=sg.getBoundingClientRect();st.style.bottom=Math.max(14,innerHeight-r.bottom+14)+'px';st.style.left=Math.max(14,r.left+14)+'px';};
 addEventListener('resize',f);setTimeout(f,0);setTimeout(f,1500);})();
// after using a top-bar control, hand the keyboard back to the game (Q/E rotate, Esc) instead of the control
document.addEventListener('change',e=>{if(e.target.matches&&e.target.matches('header select,header input,#topbar select,#topbar input'))setTimeout(()=>e.target.blur(),0);});
addEventListener('keydown',e=>{const c=document.getElementById('card');if(e.key==='Escape'&&c&&!c.hidden&&!(window.__game&&__game.carrying))document.getElementById('cOk').click();});// Esc closes the fact card (Enter/Space work via focus)
(function lf(){if(!window.G3)return setTimeout(lf,200);G3.labelOk=n=>!!(window.__game&&__game.placed.has(n));})();// name a country only once it is placed (no spoilers, no stray names outside the set)
