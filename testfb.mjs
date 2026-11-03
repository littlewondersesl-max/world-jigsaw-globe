import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('console',m=>m.type()=='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
await p.goto(process.argv[2]||'http://localhost:8944/');await p.waitForFunction('window.__ready',null,{timeout:90000});
const W=ms=>p.waitForTimeout(ms);const shot=n=>p.screenshot({path:'shots/fb-'+n+'.png'});const log=(...a)=>console.log(...a);
await p.selectOption('#set','all');await W(1500);
const st=await p.evaluate(()=>{const r=G3.dom.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.left+30,r.top+40]});
const state=()=>p.evaluate(()=>({q:G3.quat().map(v=>+v.toFixed(3)),c:G3.C.position.toArray().map(v=>+v.toFixed(2))}));
// 1) drag starting on Earth, crossing into space -> globe rotates, camera fixed
let s0=await state();await p.mouse.move(st[0],st[1]);await p.mouse.down();await p.mouse.move(st[0]+500,st[1]-300,{steps:15});await p.mouse.up();await W(800);let s1=await state();
log('earth-drag  quat',s0.q,'->',s1.q,'cam',s0.c,'->',s1.c);
// 2) drag starting in space crossing the globe -> camera orbits, globe fixed
await p.mouse.move(st[2],st[3]);await p.mouse.down();await p.mouse.move(st[0],st[1],{steps:10});await p.mouse.move(st[0]+300,st[1]+100,{steps:10});await p.mouse.up();await W(1200);let s2=await state();
log('space-drag  quat',s1.q,'->',s2.q,'cam',s1.c,'->',s2.c);
// 4) anchor: first piece dropped far away at a wrong angle
await p.evaluate(()=>{const q=__game.pieces.find(p=>p.f.name=='Argentina');q.angle=140;q.el.firstChild.style.transform='rotate(140deg)'});
await p.evaluate(()=>__game.drop('Argentina',...(()=>{const r=G3.dom.getBoundingClientRect();return [r.left+r.width/2+60,r.top+r.height/2-80]})()));
await W(1350);await shot('1-anchor-fly');await W(3500);log('anchor placed',await p.evaluate('__game.placed.has("Argentina")'),'msg',await p.textContent('#msg'));
if(await p.isVisible('#card'))await p.click('#cOk');
await p.evaluate(()=>__game.drop('Chile',...(()=>{const r=G3.dom.getBoundingClientRect();return [r.left+r.width/2+150,r.top+r.height/2+120]})()));await W(300);
log('second wrong place -> placed?',await p.evaluate('__game.placed.has("Chile")'),'msg',await p.textContent('#msg'));
for(const n of ['Brazil','Peru','Bolivia','Colombia','Venezuela'])await p.evaluate(n=>__game.place(n),n);await W(9000);await p.evaluate(()=>{const c=document.getElementById('card');if(c)c.hidden=true});
await p.evaluate(()=>G3.spinTo([-60,-20],1));await W(1500);await shot('2-labels-sa');
await p.click('#lbl');await W(400);await shot('3-labels-off');await p.click('#lbl');
for(const [i,n] of [[0,'milky'],[1,'nebula'],[2,'studio']]){await p.selectOption('#bg',String(i));await p.evaluate(()=>{const C=G3.C;C.position.set(-.6,.5,.65).normalize().multiplyScalar(-6.5).add({x:3.6,y:-1.6,z:0});C.lookAt(0,0,0)});await W(1200);await shot('4-bg-'+n)}
await p.selectOption('#bg','0');await p.evaluate(()=>{const C=G3.C;C.position.set(0,-6.2,.3);C.lookAt(0,0,0)});await W(1000);await shot('5-below');
await p.evaluate(()=>{const C=G3.C;C.position.set(-3.4,2.4,4);C.lookAt(0,0,0)});await W(1000);await shot('6-terminator');
log('bg options',await p.$$eval('#bg option',o=>o.map(x=>x.textContent)));
log('errs',errs.slice(0,5),'bad',bad.slice(0,5));await b.close();
