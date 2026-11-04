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
window.addEventListener('wheel',()=>{if(drag)updateGhostShape();},{passive:true});
function spinTo(c,z){G3.spinTo(c,z);}
// ---------- pieces ----------
// ---- piece faces: real land colours sampled from the same world texture the globe uses (Natural Earth I + our South America look-3) ----
const WT={w:0,h:0,d:null};const wtReady=new Promise(r=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);WT.w=im.width;WT.h=im.height;WT.d=x.getImageData(0,0,im.width,im.height).data;r()};im.onerror=r;im.src='pieces_world.jpg'});
const FACE={},FS=192;
function face(f){if(FACE[f.name])return FACE[f.name];const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(1).translate([0,0]).clipAngle(90),b=d3.geoPath(pr).bounds(f);
 const bw=b[1][0]-b[0][0],bh=b[1][1]-b[0][1],k=FS/Math.max(bw,bh),cw=Math.max(2,Math.ceil(bw*k)),ch=Math.max(2,Math.ceil(bh*k));const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d'),id=x.createImageData(cw,ch),o=id.data;
 if(WT.d){const l0=f.c[0]*Math.PI/180,p0=f.c[1]*Math.PI/180,sp=Math.sin(p0),cp=Math.cos(p0);
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const X=b[0][0]+(i+.5)/k,Y=-(b[0][1]+(j+.5)/k),rr=X*X+Y*Y;if(rr>=1)continue;const z=Math.sqrt(1-rr);
   const lat=Math.asin(z*sp+Y*cp),lon=l0+Math.atan2(X,z*cp-Y*sp);let u=((lon*180/Math.PI+180)/360%1+1)%1,v=(90-lat*180/Math.PI)/180;
   const px=Math.min(WT.w-1,u*WT.w|0),py=Math.min(WT.h-1,v*WT.h|0),q=(py*WT.w+px)*4,t=(j*cw+i)*4;o[t]=WT.d[q];o[t+1]=WT.d[q+1];o[t+2]=WT.d[q+2];o[t+3]=255;}}
 x.putImageData(id,0,0);return FACE[f.name]={url:c.toDataURL('image/jpeg',.86),b};}
let svgN=0;
function shapeSVG(f,scale,cls){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(scale).translate([0,0]).clipAngle(90),gp=d3.geoPath(pr);
 const b=gp.bounds(f),r=Math.max(Math.abs(b[0][0]),Math.abs(b[0][1]),Math.abs(b[1][0]),Math.abs(b[1][1]))+3;const F=face(f),id='pc'+(svgN++),d=gp(f),rim=Math.max(1.2,r/40);
 const fb=F.b,ix=fb[0][0]*scale,iy=fb[0][1]*scale,iw=(fb[1][0]-fb[0][0])*scale,ih=(fb[1][1]-fb[0][1])*scale;
 return {svg:`<svg class="pc ${cls||''}" viewBox="${-r} ${-r} ${2*r} ${2*r}" width="${2*r}" height="${2*r}"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
<g clip-path="url(#${id})"><path d="${d}" fill="url(#wood)"/><image href="${F.url}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="none" opacity=".9"/>
<rect x="${-r}" y="${-r}" width="${2*r}" height="${2*r}" fill="url(#wood)" opacity=".22" style="mix-blend-mode:multiply"/></g>
<path d="${d}" fill="none" stroke="url(#wood)" stroke-width="${rim*1.2}" stroke-opacity=".7" clip-path="url(#${id})"/><path d="${d}" fill="none" stroke="#2a170a" stroke-opacity=".45" stroke-width="${rim*.3}"/></svg>`,r};}
function trayScale(f){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(1).translate([0,0]),b=d3.geoPath(pr).bounds(f);const m=Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1]);return 80/m;}
function buildSet(){const v=$('set').value;let names=feats.map(f=>f.name);
 if(v=='starter')names=STARTER;else if(v=='Americas')names=names.filter(n=>/America/.test(FACTS[n][0]));
 else if(v=='Oceania')names=names.filter(n=>/Oceania|Antarctica/.test(FACTS[n][0]));else if(v!='all')names=names.filter(n=>FACTS[n][0].includes(v));
 placed.clear();G3.clear();for(const q of [...parked])unpark(q);anc=null;aui.innerHTML='';hdl.style.display='none';G3.outline(null);pieces=d3.shuffle(names.map(n=>({f:byName[n],angle:(Math.random()*300+30)|0,hint:0})));sel=null;
 stripeTotal=pieces.reduce((s,p)=>s+cols(p.f.name).length,0)||1;$('tubeFill').innerHTML='';renderTray();updHints();progress();draw();}
function cols(n){return (FLAGS[n]||[0,['#cccccc']])[1];}
function renderTray(){const box=$('pieces');box.innerHTML='';for(const p of pieces){if(placed.has(p.f.name)||p.parked)continue;const d=document.createElement('div');d.className='piece'+(p===sel?' sel':'');d.dataset.name=p.f.name;
 const s=trayScale(p.f);d.innerHTML=shapeSVG(p.f,s).svg;const sv=d.firstChild;sv.setAttribute('width',86);sv.setAttribute('height',86);sv.style.transform=`rotate(${p.angle}deg)`;
 d.addEventListener('pointerdown',e=>startDrag(e,p,d));box.appendChild(d);p.el=d;}}
function setAngle(p,a){p.angle=((a%360)+360)%360;if(p.ov)p.ov.firstChild.style.transform=`rotate(${p.angle}deg)`;if(anc&&anc.p===p&&anc.step==='rot'){clearTimeout(setAngle.t);setAngle.t=setTimeout(checkAnc,250);}if(p.el)p.el.firstChild.style.transform=`rotate(${p.angle}deg)`;if(drag&&drag.p===p)ghost.firstChild.style.transform=`rotate(${p.angle}deg)`;}
function select(p){sel=p;document.querySelectorAll('.piece').forEach(x=>x.classList.toggle('sel',x.dataset.name==p.f.name));updHints();}
// drag
let drag=null,ghost=null;
function updateGhostShape(){if(!drag)return;const sr=Math.max(G3.screenRadius(),1),gs=drag.p.parked?drag.p.s:placed.size?1:boxScale(drag.p.f);const g=shapeSVG(drag.p.f,sr*gs);ghost.innerHTML=g.svg;let sv=ghost.firstChild,sz=2*g.r;
 if(sz<34){sv.setAttribute('width',34);sv.setAttribute('height',34);sz=34;}drag.half=sz/2;sv.style.transform=`rotate(${drag.p.angle}deg)`;moveGhost(drag.x,drag.y);}
function moveGhost(x,y){drag.x=x;drag.y=y;ghost.style.left='0px';ghost.style.top='0px';ghost.style.transform=`translate3d(${x-drag.half}px,${y-drag.half}px,0)`;}
function startDrag(e,p,el){e.preventDefault();select(p);el.setPointerCapture(e.pointerId);drag={p,el,x:e.clientX,y:e.clientY,moved:false};
 ghost=document.createElement('div');ghost.id='ghost';document.body.appendChild(ghost);ghost.style.display='none';updateGhostShape();
 el.onpointermove=ev=>{if(!drag)return;if(!drag.moved&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)>5){drag.moved=true;ghost.style.display='';el.style.opacity=.3;}moveGhost(ev.clientX,ev.clientY);};
 el.onpointerup=el.onpointercancel=ev=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;const d=drag;drag=null;ghost.remove();el.style.opacity='';if(d.moved&&ev.type==='pointerup')window.__release(d.p,ev.clientX,ev.clientY);};}
window.addEventListener('wheel',e=>{if(drag){e.preventDefault();setAngle(drag.p,drag.p.angle+(e.deltaY>0?15:-15));}},{passive:false,capture:true});
window.addEventListener('keydown',e=>{if(!sel)return;if(e.key=='q'||e.key=='Q')setAngle(sel,sel.angle-15);if(e.key=='e'||e.key=='E')setAngle(sel,sel.angle+15);});
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
 const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=C;c.getContext('2d').drawImage(im,0,0,C,C);if(p.ov)G3.pc.add(p.pid,c,g.r/K);};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function mkOverlay(p){const o=document.createElement('div');o.className='pk';const g=shapeSVG(p.f,K);o.innerHTML=g.svg;o.r=g.r;o.style.width=o.style.height=2*g.r+'px';
 o.firstChild.style.transform=`rotate(${p.angle}deg)`;layer.appendChild(o);p.pid='pc'+(pcN++);pcTex(p,g);return o;}
function park(p,ll,s){if(!p.parked){p.parked=true;parked.push(p);p.ov=mkOverlay(p);p.ov.addEventListener('pointerdown',e=>{if(anc&&anc.p===p)return;startDrag(e,p,p.ov)});}
 p.el=p.ov;p.lon=ll[0];p.lat=ll[1];p.s=s;renderTray();}
function unpark(p){if(!p.parked)return;p.parked=false;G3.pc.del(p.pid);parked=parked.filter(q=>q!==p);p.ov.remove();p.ov=null;}
function boxScale(f){return trayScale(f)*86/88/Math.max(G3.screenRadius(),1);}
function posOv(p){const o=p.ov;if(!o)return;G3.pc.set(p.pid,{lon:p.lon,lat:p.lat,s:p.s,a:p.angle,op:p.op??1,vis:!(drag&&drag.p===p)});if(!G3.facing(p.lon,p.lat)){o.style.display='none';return}o.style.display='';const [x,y]=G3.project(p.lon,p.lat);
 const k=G3.screenRadius()*p.s/K;o.style.transform=`translate(${x-o.r}px,${y-o.r}px) scale(${k})`;p.sx=x;p.sy=y;p.spx=o.r*k;}
(function loop(){if(window.G3){for(const p of parked)posOv(p);if(anc)ancUI();}requestAnimationFrame(loop);})();
// anchor UI
const aui=document.createElementNS('http://www.w3.org/2000/svg','svg');aui.id='aui';document.body.appendChild(aui);
const angOff=a=>{a=((a%360)+360)%360;return a>180?a-360:a};
function startAnchor(p,ll){park(p,ll,boxScale(p.f));anc={p,step:'blink'};sel=p;updHints();p.ov.classList.add('anc');p.ov.style.cursor='default';
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
 else if(anc.step==='lat'&&Math.abs(p.lat-p.f.c[1])<=Math.max(2,p.f.rad*R2D*.3)){const q=p;anc=null;aui.innerHTML='';G3.outline(null);hdl.style.display='none';unpark(q);place(q);}}
const hdl=document.createElement('div');hdl.id='hdl';hdl.style.display='none';document.body.appendChild(hdl);hdl.addEventListener('pointerdown',ancDown);
let olKey='';function ancUI(){const p=anc.p,st=anc.step;if(!p.spx){return}const x=p.sx,y=p.sy,R=p.spx;let h='';
 if(st==='scale'){const out=p.s<1,a=R*.75+14;for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const x1=x+dx*a*.62,y1=y+dy*a*.62,x2=x+dx*(a*.62+16),y2=y+dy*(a*.62+16);const [fx,fy,tx,ty]=out?[x1,y1,x2,y2]:[x2,y2,x1,y1];
   h+=`<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" marker-end="url(#ah)"/>`;}
  hdl.style.display='';hdl.style.left=(x+R*.72)+'px';hdl.style.top=(y+R*.72)+'px';}else hdl.style.display='none';
 if(st==='rot'){const a=R+16;const cw=angOff(p.angle)<0;for(const sd of [-1,1]){const y1=y-a*.55,y2=y+a*.55,xx=x+sd*a;
   const [ya,yb]=(sd>0)===cw?[y1,y2]:[y2,y1];h+=`<path d="M${x+sd*a*.84} ${ya} Q${xx+sd*a*.25} ${y} ${x+sd*a*.84} ${yb}" marker-end="url(#ah)"/>`;}}
 if(st==='lat'){const f=p.f;if(G3.facing(f.c[0],f.c[1])){const [ox,oy]=G3.project(f.c[0],f.c[1]);const sc=G3.screenRadius(),pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(sc).translate([ox,oy]).clipAngle(90);
   G3.outlineOp(.55+.45*Math.cos(performance.now()/160));const dy=oy-y;if(Math.abs(dy)>R*.5)h+=`<line x1="${x}" y1="${y+Math.sign(dy)*(R*.6)}" x2="${x}" y2="${y+Math.sign(dy)*(R*.6+22)}" marker-end="url(#ah)"/>`;}}
 aui.innerHTML='<defs><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>'+h;}
function fits(p,ll){const f=p.f,easy=$('easy').checked,small=f.rad<0.12;let tol=Math.max(0.09,f.rad*0.9);if(easy&&small)tol=Math.max(tol,0.25);
 if(!(d3.geoDistance(ll,f.c)<tol||d3.geoContains(f,ll)))return false;if(Math.abs(angOff(p.angle))>25&&!(easy&&small))return false;
 const nb=neigh[f.name]||[];return !nb.length||nb.some(n=>placed.has(n))||![...nb].some(n=>pieces.some(q=>q.f.name===n));}
function joinParked(){let again=true;while(again){again=false;for(const q of [...parked]){if(anc&&anc.p===q)continue;if(fits(q,[q.lon,q.lat])){unpark(q);place(q,true);again=true;}}}}
function drop(p,x,y){const r=G3.dom.getBoundingClientRect();const ll=(x<r.left||x>r.right||y<r.top||y>r.bottom)?null:G3.pick(x,y);
 if(!ll){if(p.parked){unpark(p);renderTray();}return;}
 if(anc&&anc.p===p)return;
 if(placed.size===0&&!anc){startAnchor(p,ll);return;}
 if(placed.size===0){park(p,ll,p.parked?p.s:boxScale(p.f));say('Parked. Finish the anchor first ⚓',2000);return;}
 if(fits(p,ll)){unpark(p);place(p);return;}
 park(p,ll,1);say(neighbourHint(p,ll),2200);}
function neighbourHint(p,ll){const f=p.f,tol=Math.max(0.09,f.rad*0.9);return (d3.geoDistance(ll,f.c)<tol||d3.geoContains(f,ll))&&Math.abs(angOff(p.angle))>25?'Right place! Now turn it to fit ⟲ ⟳':'Parked here. It joins when the puzzle reaches it.';}
function place(p,inJoin){placed.add(p.f.name);G3.reveal(p.f,FACTS[p.f.name][0],muted);setTimeout(()=>stinger(p.f.name),250);sel=null;renderTray();updHints();progress();draw();celebrate(p.f.name);if(!inJoin)joinParked();}
function progress(){updScreen();$('progress').textContent=`${placed.size} / ${pieces.length}`;}
// flag + tube
function celebrate(n){const fl=FLAGS[n];const pop=$('flagPop');if(!fl){showCard(n);return;}$('flagImg').src='flags/'+fl[0]+'.svg';pop.hidden=false;
 const cs=cols(n);let i=0;setTimeout(function next(){if(i>=cs.length){pop.hidden=true;showCard(n);return;}flyStripe(cs[i++]);setTimeout(next,450);},700);}
function flyStripe(c){const img=$('flagImg').getBoundingClientRect(),tube=$('tube').getBoundingClientRect(),fill=$('tubeFill').getBoundingClientRect();
 const h=Math.max(2,tube.height/stripeTotal);const d=document.createElement('div');d.className='fly';d.style.background=c;d.style.left=img.left+'px';d.style.top=(img.top+img.height/2)+'px';d.style.width=img.width+'px';document.body.appendChild(d);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.left=(tube.left+3)+'px';d.style.width=(tube.width-6)+'px';d.style.top=(fill.top-h)+'px';d.style.height=h+'px';}));
 setTimeout(()=>{d.remove();const s=document.createElement('div');s.className='stripe';s.style.background=c;s.style.height=(100/stripeTotal)+'%';$('tubeFill').appendChild(s);},560);}
function showCard(n){const f=FACTS[n];$('cName').textContent=n.replace('Dem. Rep.','Democratic Republic of the').replace('Is.','Islands').replace('Rep.','Republic')+' 🎉';
 $('cFacts').innerHTML=[`🌍 Continent: ${f[0]}`,`🏛️ Capital: ${f[1]}`,`⭐ Famous for: ${f[2]}`,`🐾 Animal: ${f[3]}`,`🍽️ Food: ${f[4]}`].map(t=>`<li>${t}</li>`).join('');$('card').hidden=false;}
$('cOk').onclick=()=>{$('card').hidden=true;if(placed.size==pieces.length&&pieces.length){play('win');say('🎉 You finished the puzzle! 🎉',5000);}};
// hints
function updHints(){const p=sel;$('sel').innerHTML=p?`Piece selected. Hints used: ${p.hint}/3`:'Tap the stack to draw a piece.';
 ['h1','h2','h3'].forEach((h,i)=>$(h).disabled=!p||p.hint<i);if(!p)$('hintText').textContent='';}
$('h1').onclick=()=>{const p=sel;if(!p)return;p.hint=Math.max(p.hint,1);setAngle(p,0);$('hintText').innerHTML='⬆️ This way is UP (north). I turned the piece for you!';updHints();};
$('h2').onclick=()=>{const p=sel;if(!p)return;p.hint=Math.max(p.hint,2);const n=p.f.name,f=FACTS[n],nb=(neigh[n]||[]);
 $('hintText').innerHTML=`<b>Continent:</b> ${f[0]}<br>${nb.length?'<b>Neighbours:</b> '+nb.slice(0,5).join(', '):'<b>No land neighbours</b> – it has sea all around.'}<br>💡 ${f[5]}`;updHints();};
$('h3').onclick=()=>{const p=sel;if(!p)return;p.hint=3;spinTo(p.f.c,p.f.rad<.15?3:1.4);G3.pulse(p.f,5000);$('hintText').innerHTML+='<br>✨ Look for the yellow glow!';updHints();};
$('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'🔇':'🔊';};
$('set').onchange=buildSet;$('bg').onchange=e=>G3.setBg(+e.target.value);$('lbl').onchange=e=>G3.labels(e.target.checked);
// ---------- load ----------
(window.G3?Promise.resolve():new Promise(r=>addEventListener('g3ready',r,{once:true}))).then(()=>fetch('data/countries-110m.json')).then(r=>r.json()).then(t=>{const geoms=t.objects.countries.geometries;
 const merge={"N. Cyprus":"Cyprus","Somaliland":"Somalia"};const groups={};geoms.forEach((g,i)=>{const n=merge[g.properties.name]||g.properties.name;(groups[n]=groups[n]||[]).push(i);});
 const nb=topojson.neighbors(geoms);
 for(const n in groups){if(!FACTS[n])continue;const gs=groups[n].map(i=>geoms[i]);const geo=gs.length>1?topojson.merge(t,gs):topojson.feature(t,gs[0]).geometry;
  const f={type:'Feature',geometry:geo,name:n};f.c=d3.geoCentroid(f);if(n=="United States of America")f.c=[-98,39];if(n=="Russia")f.c=[95,62];if(n=="France")f.c=[2.5,46.5];if(n=="Norway")f.c=[9,61];
  const b=d3.geoBounds(f);f.rad=Math.max(d3.geoDistance(f.c,b[0]),d3.geoDistance(f.c,b[1]))/1.6;if(n=="Antarctica"){f.c=[0,-90];f.rad=.5;}feats.push(f);byName[n]=f;}
 for(const n in groups){const s=new Set();groups[n].forEach(i=>nb[i].forEach(j=>{const m=merge[geoms[j].properties.name]||geoms[j].properties.name;if(m!=n)s.add(m)}));neigh[n]=[...s];}
 wtReady.then(()=>{buildSet();window.__ready=true;});});
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
 o.h.addEventListener('pointerdown',e=>{e.preventDefault();o.h.setPointerCapture(e.pointerId);dac();const x0=e.clientX,a0=o.open;let lx=e.clientX,lt=performance.now();
  o.h.onpointermove=ev=>{const W=innerWidth,dx=ev.clientX-x0;setOpen(o,a0+(side==='L'?dx:-dx));const t=performance.now();o.fling=(side==='L'?1:-1)*(ev.clientX-lx)/Math.max(1,t-lt)*16;lx=ev.clientX;lt=t;};
  o.h.onpointerup=o.h.onpointercancel=()=>{o.h.onpointermove=o.h.onpointerup=o.h.onpointercancel=null;o.glide=o.fling||0;o.fling=0;kick();};});}
function oth(o){return DR[o.side==='L'?'R':'L']}
function setOpen(o,v){const W=innerWidth;v=Math.max(0,Math.min(W,v));o.open=v;const q=oth(o);if(v+q.open>W)q.open=W-v;kick();}
function secRects(){const o=DR.R,W=innerWidth,H=innerHeight,cols=W>H?6:2,rows=W>H?1:3,cw=W/cols,rh=(H-0)/rows;return CONTS.map((c,i)=>({c,x:(i%cols)*cw,y:Math.floor(i/cols)*rh,w:cw,h:rh}));}
function layoutSecs(){const R=secRects();[...DR.R.in.querySelectorAll('.sec')].forEach((s,i)=>{const r=R[i];Object.assign(s.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'})});}
function bounds(o,b){const W=innerWidth,H=innerHeight;if(o.side==='L')return {x:10,y:10,w:W-20,h:H-56};const r=secRects().find(r=>r.c===b.sec)||secRects()[0];return {x:r.x+6,y:r.y+26,w:r.w-12,h:r.h-32};}
function pieceEl(p){const e=document.createElement('div');e.className='dp';const g=shapeSVG(p.f,trayScale(p.f)*PS/86);e.innerHTML=g.svg;const sv=e.firstChild;sv.setAttribute('width',PS);sv.setAttribute('height',PS);sv.style.transform=`rotate(${p.angle}deg)`;
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
 for(const s in DR){const o=DR[s];if(o.glide){setOpen(o,o.open+o.glide);o.glide*=.86;if(Math.abs(o.glide)<.3||o.open<=0||o.open>=W)o.glide=0;}
  if(o.open<24&&!o.h.onpointermove&&!o.glide&&o.open>0)o.open=Math.max(0,o.open-4);
  const v=o.open-o.pv;const acc=v-o.v;o.v=v;o.pv=o.open;if(Math.abs(v)>.05||o.glide)busy=true;
  o.el.style.transform=s==='L'?`translateX(${o.open-W}px)`:`translateX(${W-o.open}px)`;o.el.classList.toggle('shut',o.open<1);
  if(Math.abs(v)>.05)rollSnd(v);
  const dir=s==='L'?1:-1,B=o.bodies;
  for(const b of B){if(Math.abs(acc)>.05&&!b.z){b.vx-=Math.max(-3,Math.min(3,acc))*dir*.35;}
   if(b.z>0||b.vz){b.vz-=1.6;b.z+=b.vz;if(b.z<=0){b.z=0;if(b.vz<-5){b.vz=-b.vz*.38;knock(Math.min(.25,-b.vz*.02+.04),380+Math.random()*120)}else b.vz=0;}}
   b.vx*=.9;b.vy*=.9;b.x+=b.vx;b.y+=b.vy;clampB(o,b);}
  for(let it=0;it<3;it++){let any=false;for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],c=B[j];if(a.sec!==c.sec||a.z>8||c.z>8)continue;if(collide(a,c))any=true;}for(const b of B)clampB(o,b);if(!any)break;}
  for(const b of B){if(Math.abs(b.vx)+Math.abs(b.vy)>.25||b.z>0||b.vz)busy=true;const tf=`translate3d(${(b.x-PS/2).toFixed(1)}px,${(b.y-PS/2-b.z).toFixed(1)}px,0)`+(b.z>0?` scale(${1+b.z*.006})`:''),zi=b.z>0?5:1;if(b._tf!==tf){b.el.style.transform=tf;b._tf=tf;}if(b._zi!==zi){b.el.style.zIndex=zi;b._zi=zi;}}}
 if(Math.abs(DR.L.v)<.05&&Math.abs(DR.R.v)<.05&&roll)roll.g.gain.setTargetAtTime(0,DAC.currentTime,.05);
 const live=busy&&(performance.now()<budget||[DR.L,DR.R].some(o=>o.glide||o.h.onpointermove||Math.abs(o.v)>.05));if(live){calm=0;tick();}else if(++calm<10)tick();else{calm=0;for(const s in DR)for(const b of DR[s].bodies){b.vx=b.vy=0;}}}
// which drawer (and where in it) is under a screen point
function drawerAt(x,y){const W=innerWidth;if(DR.L.open>0&&x<DR.L.open)return {side:'L',x:x+W-DR.L.open,y};if(DR.R.open>0&&x>W-DR.R.open)return {side:'R',x:x-(W-DR.R.open),y};return null;}
function secAt(lx,ly){const r=secRects().find(r=>lx>=r.x&&lx<r.x+r.w&&ly>=r.y&&ly<r.y+r.h);return r?r.c:null;}
// release a held piece: into a drawer, else onto the globe (anything not placed/parked goes back to the left drawer)
function release(p,x,y){const d=drawerAt(x,y);if(d){if(p.parked)unpark(p);addBody(d.side,p,d.x,d.y,true,d.side==='R'?secAt(d.x,d.y):null);renderTray();return;}
 drop(p,x,y);if(!placed.has(p.f.name)&&!p.parked&&!p.body){const W=innerWidth;addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),true);}syncDrawers();}
window.__release=release;
// carry: piece follows the pointer. A drag releases on lift; a click/tap keeps it on the cursor until the next click/tap.
let carrying=null;function carry(p,e,src){if(carrying)return;select(p);if(p.body)p.body.el.style.visibility='hidden';
 drag={p,el:src,x:e.clientX,y:e.clientY,moved:true};ghost=document.createElement('div');ghost.id='ghost';document.body.appendChild(ghost);updateGhostShape();moveGhost(e.clientX,e.clientY);
 const x0=e.clientX,y0=e.clientY,t0=performance.now();let downs=0,hd=0;carrying=p;
 const mv=ev=>{if(drag)moveGhost(ev.clientX,ev.clientY)},dn=ev=>{if(ev.target.closest&&ev.target.closest('.dh')){hd=1;return;}downs++;ev.stopPropagation();ev.preventDefault();},
  up=ev=>{if(hd){hd=0;return;}const far=Math.hypot(ev.clientX-x0,ev.clientY-y0)>12;if(!far&&!downs)return;ev.stopPropagation();
   removeEventListener('pointermove',mv,true);removeEventListener('pointerdown',dn,true);removeEventListener('pointerup',up,true);
   drag=null;ghost.remove();carrying=null;if(p.body)p.body.el.style.visibility='';const b=p.body;if(b)remBody(p);release(p,ev.clientX,ev.clientY);};
 addEventListener('pointermove',mv,true);addEventListener('pointerdown',dn,true);addEventListener('pointerup',up,true);}
// stack bottom-left: a random loose piece from the left drawer
const stk=document.createElement('div');stk.id='stack';stk.title='Take a piece';document.body.appendChild(stk);
function drawStack(){const L=pieces.filter(p=>p.dloc==='L');stk.innerHTML=L.slice(0,4).map((p,i)=>`<div class="sp" style="transform:translate(${i*2}px,${-i*3}px) rotate(${(i*37)%20-10}deg)">${shapeSVG(p.f,trayScale(p.f)*.6).svg}</div>`).join('')+`<b>${L.length}</b>`;stk.classList.toggle('empty',!L.length);}
stk.addEventListener('pointerdown',e=>{e.preventDefault();const L=pieces.filter(p=>p.dloc==='L');if(!L.length)return;stk.animate([{transform:'scale(1)'},{transform:'scale(.86,.8)'},{transform:'scale(1)'}],{duration:220});knock(.12,300);carry(L[0],e,stk);});
function syncDrawers(){if(!pieces)return;const W=innerWidth;for(const s in DR)for(const b of [...DR[s].bodies])if(!pieces.includes(b.p))remBody(b.p);for(const p of pieces){const gone=placed.has(p.f.name)||p.parked;if(gone&&p.body)remBody(p);
  else if(!gone&&!p.body&&carrying!==p)addBody('L',p,40+Math.random()*(W-80),40+Math.random()*(innerHeight-120),false);}drawStack();}
const _rt=renderTray;renderTray=function(){_rt();if(typeof DR!=='undefined')syncDrawers();};
addEventListener('resize',()=>{layoutSecs();for(const s in DR){const o=DR[s];setOpen(o,o.open);for(const b of o.bodies)clampB(o,b);}kick();});layoutSecs();
syncDrawers();kick();
Object.assign(window.__game,{DR,setOpen:(o,v)=>{o.glide=0;setOpen(o,v)},carry,release,drawStack});Object.defineProperty(window.__game,'carrying',{get:()=>carrying});
})();
(function(){const B=document.getElementById('menuB'),L=document.getElementById('menuL'),P=document.getElementById('credP');if(!B)return;
B.onclick=e=>{e.stopPropagation();L.hidden=!L.hidden;B.setAttribute('aria-expanded',!L.hidden)};document.addEventListener('click',e=>{if(!L.hidden&&!L.contains(e.target)){L.hidden=true;B.setAttribute('aria-expanded',false)}});
document.getElementById('credB').onclick=()=>{L.hidden=true;P.hidden=false};document.getElementById('credX').onclick=()=>P.hidden=true;P.onclick=e=>{if(e.target===P)P.hidden=true};addEventListener('keydown',e=>{if(e.key==='Escape')P.hidden=true});})();
(function(){const st=document.getElementById('stack'),sg=document.getElementById('stage');if(!st||!sg)return;
 const f=()=>{const r=sg.getBoundingClientRect();st.style.bottom=Math.max(14,innerHeight-r.bottom+14)+'px';st.style.left=Math.max(14,r.left+14)+'px';};
 addEventListener('resize',f);setTimeout(f,0);setTimeout(f,1500);})();
