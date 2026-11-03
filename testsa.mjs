import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('console',m=>m.type()=='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
await p.goto(process.argv[2]||'http://localhost:8944/');await p.waitForFunction('window.__ready',null,{timeout:90000});
const W=ms=>p.waitForTimeout(ms);const shot=n=>p.screenshot({path:'shots/sa-'+n+'.png'});
await p.selectOption('#set','all');await W(1500);
const SA=['Brazil','Argentina','Bolivia','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela','Falkland Is.','France'];
await p.evaluate(()=>G3.spinTo([-60,-15],1));await W(1500);
for(const n of ['Argentina','Peru']){await p.evaluate(n=>__game.place(n),n);await W(700);await shot('reveal-'+n);await W(2500);if(await p.isVisible('#card'))await p.click('#cOk')}
await p.evaluate(S=>{for(const n of S)if(!__game.placed.has(n))__game.place(n)},SA);await W(20000);
await p.evaluate(()=>{const c=document.getElementById('card');if(c)c.style.display='none'});
console.log('placed',await p.evaluate(S=>S.filter(n=>__game.placed.has(n)),SA));
await p.evaluate(()=>G3.spinTo([-60,-20],1));await W(1500);await shot('1-continent');
for(const [n,c,k] of [['2-andes',[-68,-20],5],['3-guianas',[-56,4],5],['4-plata',[-58,-33],5],['5-patagonia',[-70,-50],4]]){await p.evaluate(c=>G3.spinTo(c,1),c);await W(1200);await p.evaluate(k=>G3.zoomBy(k),k);await W(1500);await shot(n);await p.evaluate(k=>G3.zoomBy(1/k),k);}
console.log('errs',errs.slice(0,5),'bad',bad.slice(0,5));await b.close();
