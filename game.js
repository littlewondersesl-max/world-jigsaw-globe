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
function shapeSVG(f,scale,cls){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(scale).translate([0,0]).clipAngle(90),gp=d3.geoPath(pr);
 const b=gp.bounds(f),r=Math.max(Math.abs(b[0][0]),Math.abs(b[0][1]),Math.abs(b[1][0]),Math.abs(b[1][1]))+3;
 return {svg:`<svg class="${cls||''}" viewBox="${-r} ${-r} ${2*r} ${2*r}" width="${2*r}" height="${2*r}"><path d="${gp(f)}"/></svg>`,r};}
function trayScale(f){const pr=d3.geoOrthographic().rotate([-f.c[0],-f.c[1]]).scale(1).translate([0,0]),b=d3.geoPath(pr).bounds(f);const m=Math.max(b[1][0]-b[0][0],b[1][1]-b[0][1]);return 80/m;}
function buildSet(){const v=$('set').value;let names=feats.map(f=>f.name);
 if(v=='starter')names=STARTER;else if(v=='Americas')names=names.filter(n=>/America/.test(FACTS[n][0]));
 else if(v=='Oceania')names=names.filter(n=>/Oceania|Antarctica/.test(FACTS[n][0]));else if(v!='all')names=names.filter(n=>FACTS[n][0].includes(v));
 placed.clear();G3.clear();pieces=d3.shuffle(names.map(n=>({f:byName[n],angle:(Math.random()*300+30)|0,hint:0})));sel=null;
 stripeTotal=pieces.reduce((s,p)=>s+cols(p.f.name).length,0)||1;$('tubeFill').innerHTML='';renderTray();updHints();progress();draw();}
function cols(n){return (FLAGS[n]||[0,['#cccccc']])[1];}
function renderTray(){const box=$('pieces');box.innerHTML='';for(const p of pieces){if(placed.has(p.f.name))continue;const d=document.createElement('div');d.className='piece'+(p===sel?' sel':'');d.dataset.name=p.f.name;
 const s=trayScale(p.f);d.innerHTML=shapeSVG(p.f,s).svg;const sv=d.firstChild;sv.setAttribute('width',86);sv.setAttribute('height',86);sv.style.transform=`rotate(${p.angle}deg)`;
 d.addEventListener('pointerdown',e=>startDrag(e,p,d));box.appendChild(d);p.el=d;}}
function setAngle(p,a){p.angle=((a%360)+360)%360;if(p.el)p.el.firstChild.style.transform=`rotate(${p.angle}deg)`;if(drag&&drag.p===p)ghost.firstChild.style.transform=`rotate(${p.angle}deg)`;}
function select(p){sel=p;document.querySelectorAll('.piece').forEach(x=>x.classList.toggle('sel',x.dataset.name==p.f.name));updHints();}
// drag
let drag=null,ghost=null;
function updateGhostShape(){if(!drag)return;const g=shapeSVG(drag.p.f,Math.max(G3.screenRadius(),1));ghost.innerHTML=g.svg;let sv=ghost.firstChild,sz=2*g.r;
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
// first piece = anchor: never wrong; it straightens, resizes and flies to its real place
let anchoring=false;async function anchor(p,x,y){if(anchoring)return;anchoring=true;const f=p.f;const sv=p.el.querySelector('svg').cloneNode(true);const fl=document.createElement('div');fl.id='flyer';fl.appendChild(sv);
 const b=p.el.getBoundingClientRect(),w=b.width;Object.assign(fl.style,{position:'fixed',left:'0',top:'0',width:w+'px',height:w+'px',zIndex:9,pointerEvents:'none',transition:'transform .9s cubic-bezier(.6,0,.3,1),opacity .5s',transform:`translate(${x-w/2}px,${y-w/2}px) rotate(${p.angle}deg)`});
 sv.style.transform='none';document.body.appendChild(fl);p.angle=0;say('First piece! It goes right here ✨',2500);await G3.spinTo(f.c);
 const [tx,ty]=G3.project(f.c[0],f.c[1]);const s=Math.max(.15,Math.min(4,G3.screenRadius()*f.rad*2.2/w));fl.getBoundingClientRect();
 fl.style.transform=`translate(${tx-w/2}px,${ty-w/2}px) rotate(0deg) scale(${s})`;await new Promise(r=>setTimeout(r,950));fl.style.opacity='0';place(p);setTimeout(()=>fl.remove(),600);anchoring=false;}
function drop(p,x,y){const r=G3.dom.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom){return;}
 const ll=G3.pick(x,y);if(!ll){bounce(p);say('Drop it on the globe!');return;}
 if(placed.size===0){anchor(p,x,y);return;}
 const f=p.f,easy=$('easy').checked,small=f.rad<0.12;let tol=Math.max(0.09,f.rad*0.9);if(easy&&small)tol=Math.max(tol,0.25);
 const dist=d3.geoDistance(ll,f.c);if(!(dist<tol||d3.geoContains(f,ll))){bounce(p);say('Not here. Try again!');return;}
 const off=Math.min(p.angle,360-p.angle);if(off>25&&!(easy&&small)){bounce(p);say('Right place! Now turn it to fit ⟲ ⟳',2500);return;}
 place(p);}
function place(p){placed.add(p.f.name);G3.reveal(p.f,FACTS[p.f.name][0],muted);setTimeout(()=>stinger(p.f.name),250);sel=null;renderTray();updHints();progress();draw();celebrate(p.f.name);}
function progress(){$('progress').textContent=`${placed.size} / ${pieces.length}`;}
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
 buildSet();window.__ready=true;});
window.__game={get pieces(){return pieces},get placed(){return placed},place:n=>place(pieces.find(p=>p.f.name==n)),spinTo,feat:n=>byName[n],drop:(n,x,y)=>drop(pieces.find(p=>p.f.name==n),x,y)};
})();
