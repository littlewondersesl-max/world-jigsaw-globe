import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'px';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e.stack)));
await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:90000});const W=ms=>p.waitForTimeout(ms),ev=(f,a)=>p.evaluate(f,a);
await p.selectOption('#set','all');await W(4000);await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});
for(const [n,view,z] of [['Russia',[95,62],1.2],['Canada',[-100,60],1.2],['Chile',[-20,-30],1.3]]){
 await ev(([v,z])=>__game.spinTo(v,z),[view,z]);await W(1300);
 await ev(n=>{const f=__game.feat(n);__game.park(n,f.c[0],f.c[1],1,0)},n);await W(1500);await p.screenshot({path:`shots/${pre}-${n}-mesh.png`});
 await ev(n=>{__game.unpark(n);__game.place(n)},n);await W(4500);await ev(()=>{document.getElementById('card').hidden=true;document.getElementById('flagPop').hidden=true});await W(4000);
 await ev(()=>{document.getElementById('card').hidden=true;document.getElementById('flagPop').hidden=true});await p.screenshot({path:`shots/${pre}-${n}-paint.png`});}
console.log('errs',errs);await b.close();
