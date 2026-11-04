import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'pt',mob=process.argv[4]=='m';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext(mob?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack).slice(0,300)));p.on('console',m=>m.type()=='error'&&errs.push(m.text()));
const W=ms=>p.waitForTimeout(ms),ev=(f,a)=>p.evaluate(f,a),shot=n=>p.screenshot({path:`shots/${pre}-${n}.png`,timeout:240000});const R={};const M=p.mouse;
const drag=async(a,b2,n=10)=>{await M.move(...a);await M.down();await M.move(...b2,{steps:n});await M.up();};
const box=async s=>{const r=await p.locator(s).first().boundingBox();return [r.x+r.width/2,r.y+r.height/2]};
await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:240000});
await p.selectOption('#set','Americas');await W(2500);
await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});
await ev(()=>__game.spinTo([-60,-15],1.2));await W(1500);await shot('01-start');
const VW=await ev(()=>innerWidth);
// drawers
let h=await box('.drawer.dL .dh');await drag(h,[h[0]+VW*.6,h[1]]);await W(1200);R.Lopen=await ev(()=>__game.DR.L.open);await shot('02-left');
h=await box('.drawer.dR .dh');await drag(h,[h[0]-VW*.8,h[1]]);await W(1200);R.push=await ev(()=>[__game.DR.L.open,__game.DR.R.open]);await shot('03-right');
h=await box('.drawer.dR .dh');await drag(h,[VW-2,h[1]]);await W(400);h=await box('.drawer.dL .dh');await drag(h,[2,h[1]]);await W(300);
// race: click stack immediately while drawers glide shut
const sk=await box('#stack');
await ev(()=>{const P=__game.pieces;for(const n of ['Paraguay','Chile','Brazil']){const i=P.findIndex(q=>q.f.name==n);P.unshift(P.splice(i,1)[0]);}});
await ev(()=>__game.syncDrawers&&0);await W(1500);R.closed=await ev(()=>[__game.DR.L.open,__game.DR.R.open]);
R.hitAtStack=await ev(([x,y])=>{const e=document.elementFromPoint(x,y);return e.id||e.className},sk);
await M.click(...sk);await W(500);R.carry1=await ev(()=>__game.carrying&&__game.carrying.f.name);
const bz=await ev(()=>G3.project(-53,-10));await M.move(bz[0],bz[1],{steps:6});await shot('04-carry');await M.click(bz[0],bz[1]);await W(1800);
const st=()=>ev(()=>__game.anc&&{step:__game.anc.step,s:__game.anc.p.s,a:__game.anc.p.angle,x:__game.anc.p.sx,y:__game.anc.p.sy});
await shot('05-anchor');for(let i=0;i<20&&(await st())?.step=='blink';i++)await W(500);let s=await st();R.anc0=s;
if(s&&s.step=='scale'){const hd=await p.locator('#hdl').boundingBox();const hx=hd.x+9,hy=hd.y+9,k=1/s.s;await drag([hx,hy],[s.x+(hx-s.x)*k,s.y+(hy-s.y)*k],8);await W(500);}
s=await st();R.anc1=s;
if(s&&s.step=='rot'){const r=40,a0=Math.atan2(-1,1),da=-s.a*Math.PI/180;await M.move(s.x+r*Math.cos(a0),s.y+r*Math.sin(a0));await M.down();await M.move(s.x+r*Math.cos(a0+da),s.y+r*Math.sin(a0+da),{steps:8});await M.up();await W(600);}
s=await st();R.anc2=s;await shot('06-lat');
if(s&&s.step=='lat'){const t=await ev(()=>G3.project(...__game.anc.p.f.c));await drag([s.x,s.y],[s.x,t[1]],10);await W(1000);}
R.anc3=await st();R.placed1=await ev(()=>[...__game.placed]);await W(4500);await shot('07-placed');
const closeCard=()=>ev(()=>{const c=document.getElementById('cOk');if(c&&c.offsetParent)c.click()});await closeCard();await W(500);
// park: Chile dropped on open water
await M.click(...sk);await W(400);const wa=await ev(()=>G3.project(-100,-30));await M.click(wa[0],wa[1]);await W(1200);R.parked=await ev(()=>__game.parked.map(q=>q.f.name));await shot('08-parked');
// sort Paraguay into South America section
await M.click(...sk);await W(400);R.carry3=await ev(()=>__game.carrying&&__game.carrying.f.name);
h=await box('.drawer.dR .dh');await drag(h,[h[0]-VW*.95,h[1]]);await W(1200);
const sec=await ev(()=>{const c=[...document.querySelectorAll('.drawer.dR .sec .carve')].find(c=>/South/.test(c.textContent));const r=c.parentElement.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
await M.click(...sec);await W(1200);R.sorted=await ev(()=>__game.pieces.filter(q=>q.dloc=='R').map(q=>q.f.name+':'+q.body.sec));await shot('09-sorted');
h=await box('.drawer.dR .dh');await drag(h,[VW-2,h[1]]);await W(1500);
// take Paraguay back out of the drawer and place it properly
// neighbours: real drops at true centroid for Argentina, Bolivia, Peru, Colombia, Venezuela, Uruguay
for(const n of ['Argentina','Bolivia','Peru','Colombia','Venezuela','Uruguay','Ecuador']){await ev(n=>{const P=__game.pieces;const i=P.findIndex(q=>q.f.name==n);P.unshift(P.splice(i,1)[0]);},n);await W(200);
 await M.click(...sk);await W(400);const c=await ev(n=>{const q=__game.pieces.find(q=>q.f.name==n);q.angle=0;return G3.project(...q.f.c)},n);await M.click(c[0],c[1]);await W(2500);await closeCard();}
R.placed2=await ev(()=>[...__game.placed]);R.parked2=await ev(()=>__game.parked.map(q=>q.f.name));await shot('10-neighbours');
// list screen, labels, menu, credits
R.list=await ev(()=>[...document.querySelectorAll('#scrL>*')].map(e=>e.textContent).slice(0,12));
const li=await ev(()=>{const e=document.querySelector('#scrL>*');if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});if(li){await M.click(...li);await W(1500);}await shot('11-list');
await ev(()=>{const c=document.getElementById('lbl');c.checked=true;c.dispatchEvent(new Event('change'))});await W(1500);await shot('12-labels');
await M.click(...await box('#menuB'));await W(400);await shot('13-menu');await M.click(...await box('#credB'));await W(600);R.cred=await ev(()=>!document.getElementById('credP').hidden);await shot('14-credits');await M.click(...await box('#credX'));await W(300);
// rotate globe + view
const q0=await ev(()=>JSON.stringify(G3.quat()));const g=await ev(()=>G3.project(-28,-45));await drag(g,[g[0]+80,g[1]+20]);await W(800);R.rot=q0!=await ev(()=>JSON.stringify(G3.quat()));await shot('15-rotated');
console.log(JSON.stringify(R));
R.errs=errs;console.log("ERRS",JSON.stringify(errs));await b.close();process.exit(0);
