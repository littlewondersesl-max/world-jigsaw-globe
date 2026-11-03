import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'ga';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e.stack)));p.on('console',m=>m.type()=='error'&&errs.push(m.text()));
await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:90000});
const W=ms=>p.waitForTimeout(ms);const shot=n=>p.screenshot({path:`shots/${pre}-${n}.png`});const ev=(f,a)=>p.evaluate(f,a);
await p.selectOption('#set','Africa');await W(2500);
await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});
await ev(()=>__game.spinTo([10,10],1.3));await W(1300);
// park-then-anchor: drop Egypt (rotated) on blank water
await ev(()=>{const q=__game.pieces.find(q=>q.f.name=='Egypt');q.angle=40;});
await ev(()=>__game.drop('Egypt',560,330));await W(500);await shot('1-anchor-blink');await W(1300);
const st=()=>ev(()=>__game.anc&&{step:__game.anc.step,s:__game.anc.p.s,a:__game.anc.p.angle,x:__game.anc.p.sx,y:__game.anc.p.sy,lat:__game.anc.p.lat});
console.log('A',await st());await shot('2-scale');
// scale via handle
let h=await p.locator('#hdl').boundingBox();let s=await st();
if(s.step=='scale'){const hx=h.x+9,hy=h.y+9,k=1/s.s;await p.mouse.move(hx,hy);await p.mouse.down();await p.mouse.move(s.x+(hx-s.x)*k,s.y+(hy-s.y)*k,{steps:8});await p.mouse.up();await W(400);}
s=await st();console.log('B',s);await shot('3-rotate');
if(s.step=='rot'){const r=40;const a0=Math.atan2(-1,1);await p.mouse.move(s.x+r*Math.cos(a0),s.y+r*Math.sin(a0));await p.mouse.down();const da=-s.a*Math.PI/180;
 await p.mouse.move(s.x+r*Math.cos(a0+da),s.y+r*Math.sin(a0+da),{steps:8});await p.mouse.up();await W(500);}
s=await st();console.log('C',s);await W(600);await shot('4-outline');
// park another piece meanwhile? drag anchor to latitude
if(s&&s.step=='lat'){const t=await ev(()=>G3.project(...__game.anc.p.f.c));await p.mouse.move(s.x,s.y);await p.mouse.down();await p.mouse.move(s.x,t[1],{steps:10});await W(200);await shot('5-drag');await p.mouse.up();await W(800);}
console.log('D',await st(),'placed',await ev(()=>[...__game.placed]));await shot('6-placed');
await W(4500);await ev(()=>{const c=document.getElementById('card');if(c)c.hidden=true});await W(300);
// park a far piece (wrong place), then place Libya correctly; Sudan parked at correct spot joins after Libya? (Sudan neighbours Egypt -> places directly)
await ev(()=>{for(const n of ['Chad','Libya'])__game.pieces.find(q=>q.f.name==n).angle=0});
const chad=await ev(()=>G3.project(18.6,15.3));await ev(([x,y])=>__game.drop('Chad',x,y),chad);await W(400);
console.log('parked',await ev(()=>__game.parked.map(q=>q.f.name)));await shot('7-parked');
const lib=await ev(()=>G3.project(17.5,27));await ev(([x,y])=>__game.drop('Libya',x,y),lib);await W(1500);
await ev(()=>{const c=document.getElementById('card');if(c)c.hidden=true});
console.log('after',await ev(()=>[...__game.placed]),await ev(()=>__game.parked.map(q=>q.f.name)));await W(1500);await ev(()=>{const c=document.getElementById('card');if(c)c.hidden=true;const f=document.getElementById('flagPop');if(f)f.hidden=true});await W(4000);await ev(()=>{const c=document.getElementById('card');if(c)c.hidden=true;document.getElementById('flagPop').hidden=true});await shot('8-joined');
console.log('errs',errs.slice(0,5));await b.close();
