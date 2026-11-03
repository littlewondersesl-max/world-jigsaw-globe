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
 placed.clear();G3.clear();for(const q of [...parked])unpark(q);anc=null;aui.innerHTML='';hdl.style.display='none';pieces=d3.shuffle(names.map(n=>({f:byName[n],angle:(Math.random()*300+30)|0,hint:0})));sel=null;
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
function moveGhost(x,y){drag.x=x;drag.y=y;ghost.style.left=(x-drag.half)+'px';ghost.style.top=(y-drag.half)+'px';}
function startDrag(e,p,el){e.preventDefault();select(p);el.setPointerCapture(e.pointerId);drag={p,el,x:e.clientX,y:e.clientY,moved:false};
 ghost=document.createElement('div');ghost.id='ghost';document.body.appendChild(ghost);ghost.style.display='none';updateGhostShape();
 el.onpointermove=ev=>{if(!drag)return;if(!drag.moved&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)>5){drag.moved=true;ghost.style.display='';el.style.opacity=.3;}moveGhost(ev.clientX,ev.clientY);};
 el.onpointerup=el.onpointercancel=ev=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;const d=drag;drag=null;ghost.remove();el.style.opacity='';if(d.moved)drop(d.p,ev.clientX,ev.clientY);};}
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
function mkOverlay(p){const o=document.createElement('div');o.className='pk';const g=shapeSVG(p.f,K);o.innerHTML=g.svg;o.r=g.r;o.style.width=o.style.height=2*g.r+'px';
 o.firstChild.style.transform=`rotate(${p.angle}deg)`;layer.appendChild(o);return o;}
function park(p,ll,s){if(!p.parked){p.parked=true;parked.push(p);p.ov=mkOverlay(p);p.ov.addEventListener('pointerdown',e=>{if(anc&&anc.p===p)return;startDrag(e,p,p.ov)});}
 p.el=p.ov;p.lon=ll[0];p.lat=ll[1];p.s=s;renderTray();}
function unpark(p){if(!p.parked)return;p.parked=false;parked=parked.filter(q=>q!==p);p.ov.remove();p.ov=null;}
function boxScale(f){return trayScale(f)*86/88/Math.max(G3.screenRadius(),1);}
function posOv(p){const o=p.ov;if(!o)return;if(!G3.facing(p.lon,p.lat)){o.style.display='none';return}o.style.display='';const [x,y]=G3.project(p.lon,p.lat);
 const k=G3.screenRadius()*p.s/K;o.style.transform=`translate(${x-o.r}px,${y-o.r}px) scale(${k})`;p.sx=x;p.sy=y;p.spx=o.r*k;}
(function loop(){if(window.G3){for(const p of parked)posOv(p);if(anc)ancUI();}requestAnimationFrame(loop);})();
// anchor UI
const aui=document.createElementNS('http://www.w3.org/2000/svg','svg');aui.id='aui';document.body.appendChild(aui);
const angOff=a=>{a=((a%360)+360)%360;return a>180?a-360:a};
function startAnchor(p,ll){park(p,ll,boxScale(p.f));anc={p,step:'blink'};sel=p;updHints();p.ov.classList.add('anc');p.ov.style.cursor='default';
 const cont=FACTS[p.f.name][0];say(`⚓ Anchor: ${p.f.name}. The world is built around it.`,2600);p.ov.firstChild.animate([{opacity:1},{opacity:.25},{opacity:1},{opacity:.25},{opacity:1}],{duration:1400});

 setTimeout(()=>nextStep(),1500);p.ov.addEventListener('pointerdown',ancDown);}
function nextStep(){const p=anc.p;if(Math.abs(p.s-1)>.12){anc.step='scale';say(p.s<1?'Too small: drag the handle outward ⤢':'Too big: drag the handle inward ⤡',3500);return}p.s=1;
 if(Math.abs(angOff(p.angle))>10){anc.step='rot';say('Turn it north-up: spin it like a steering wheel ⟲ ⟳',3500);return}setAngle(p,0);
 if(anc.step!=='lat'){anc.step='lat';const d=p.f.c[0]-p.lon;G3.offsetLon(-d);for(const q of parked)q.lon=((q.lon+d+540)%360)-180;
  say('Now slide it up or down into the outline ↕',3500);}}
function ancDown(e){if(!anc||anc.p.ov!==e.currentTarget&&e.currentTarget!==hdl)return;e.preventDefault();e.stopPropagation();const p=anc.p,st=anc.step;if(st==='blink')return;
 const el=e.currentTarget;el.setPointerCapture(e.pointerId);const cx=p.sx,cy=p.sy,d0=Math.hypot(e.clientX-cx,e.clientY-cy)||1,s0=p.s,a0=p.angle,t0=Math.atan2(e.clientY-cy,e.clientX-cx);
 el.onpointermove=ev=>{if(st==='scale')p.s=Math.max(.05,Math.min(8,s0*Math.hypot(ev.clientX-cx,ev.clientY-cy)/d0));
  else if(st==='rot')setAngle(p,a0+(Math.atan2(ev.clientY-cy,ev.clientX-cx)-t0)*R2D);
  else if(st==='lat'){const ll=G3.pick(cx,ev.clientY);if(ll)p.lat=Math.max(-85,Math.min(85,ll[1]));}};
 el.onpointerup=el.onpointercancel=()=>{el.onpointermove=el.onpointerup=el.onpointercancel=null;checkAnc();};}
function checkAnc(){const p=anc.p;if(anc.step==='scale'&&Math.abs(p.s-1)<=.12){p.s=1;play('place');nextStep();}
 else if(anc.step==='rot'&&Math.abs(angOff(p.angle))<=10){setAngle(p,0);play('place');nextStep();}
 else if(anc.step==='lat'&&Math.abs(p.lat-p.f.c[1])<=Math.max(2,p.f.rad*R2D*.3)){const q=p;anc=null;aui.innerHTML='';hdl.style.display='none';unpark(q);place(q);}}
const hdl=document.createElement('div');hdl.id='hdl';hdl.style.display='none';document.body.appendChild(hdl);hdl.addEventListener('pointerdown',ancDown);
let olKey='';function ancUI(){const p=anc.p,st=anc.step;if(!p.spx){return}const x=p.sx,y=p.sy,R=p.spx;let h='';
 if(st==='scale'){const out=p.s<1,a=R*.75+14;for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const x1=x+dx*a*.62,y1=y+dy*a*.62,x2=x+dx*(a*.62+16),y2=y+dy*(a*.62+16);const [fx,fy,tx,ty]=out?[x1,y1,x2,y2]:[x2,y2,x1,y1];
   h+=`<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" marker-end="url(#ah)"/>`;}
  hdl.style.display='';hdl.style.left=(x+R*.72)+'px';hdl.style.top=(y+R*.72)+'px';}else hdl.style.display='none';
 if(st==='rot'){const a=R+16;const cw=angOff(p.angle)<0;for(const sd of [-1,1]){const y1=y-a*.55,y2=y+a*.55,xx=x+sd*a;
   const [ya,yb]=(sd>0)===cw?[y1,y2]:[y2,y1];h+=`<path d="M${x+sd*a*.84} ${ya} Q${xx+sd*a*.25} ${y} ${x+sd*a*.84} ${yb}" marker-end="url(#ah)"/>`;}}
 if(st==='lat'){const f=p.f;if(G3.facing(f.c[0],f.c[1])){const [ox,oy]=G3.project(f.c[0],f.c[1]);const sc=G3.screenRadius(),pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(sc).translate([ox,oy]).clipAngle(90);
   h+=`<path class="ol" d="${d3.geoPath(pr)(f)}"/>`;const dy=oy-y;if(Math.abs(dy)>R*.5)h+=`<line x1="${x}" y1="${y+Math.sign(dy)*(R*.6)}" x2="${x}" y2="${y+Math.sign(dy)*(R*.6+22)}" marker-end="url(#ah)"/>`;}}
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
function updHints(){const p=sel;$('sel').innerHTML=p?`Piece selected. Hints used: ${p.hint}/3`:'Tap a piece to pick it.';
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
window.__shape=f=>shapeSVG(f,trayScale(f)).svg;window.__game={get anc(){return anc},get parked(){return parked},get pieces(){return pieces},get placed(){return placed},place:n=>place(pieces.find(p=>p.f.name==n)),spinTo,feat:n=>byName[n],drop:(n,x,y)=>drop(pieces.find(p=>p.f.name==n),x,y)};
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
(function hook(){if(!window.G3)return setTimeout(hook,200);G3.dom.addEventListener('pointermove',e=>{if(e.buttons||!placed.size)return;const ll=G3.pick(e.clientX,e.clientY);let n=null;  if(ll)for(const k of placed)if(d3.geoContains(byName[k],ll)){n=k;break}setHot(n);}); G3.dom.addEventListener('pointerleave',()=>setHot(null)); })();
window.__game.hot=setHot;
})();
