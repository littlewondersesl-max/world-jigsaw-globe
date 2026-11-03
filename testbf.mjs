import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const [url,pre]=[process.argv[2],process.argv[3]];
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()=='error'&&errs.push(m.text()));
await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:90000});
const W=ms=>p.waitForTimeout(ms);const shot=n=>p.screenshot({path:`shots/${pre}-${n}.png`});
await p.selectOption('#set','all');await W(4500);
await p.evaluate(()=>{const c=document.getElementById('lbl');if(c&&!c.checked){c.checked=true;c.dispatchEvent(new Event('change'))}});
const SA=['Brazil','Argentina','Chile','Peru','Colombia','Venezuela','Bolivia','Ecuador','Paraguay','Uruguay','Guyana','Suriname','Falkland Is.','Libya','Egypt','Sudan','Chad','Niger','Algeria','Madagascar','Mozambique','Tanzania','Kenya','Ethiopia','Somalia'];
for(const n of SA)await p.evaluate(n=>{try{__game.place(n)}catch(e){}},n);await W(14000);
await p.evaluate(()=>{const c=document.getElementById('card');if(c)c.hidden=true});
for(const [n,c,z] of [['sa-far',[-60,-15],1],['sa-mid',[-62,-12],2.2],['north',[-62,4],4.5],['horn',[-68,-53],5],['madagascar',[45,-18],3.5]]){await p.evaluate(([c,z])=>__game.spinTo(c,z),[c,z]);await W(2200);await shot(n);}
await p.evaluate(()=>__game.spinTo([-62,-20],2.2));await W(2200);
if(await p.evaluate(()=>!!__game.hot)){await p.evaluate(()=>__game.hot('Argentina'));await W(300);await shot('screen');await p.evaluate(()=>__game.hot(null));
 const xy=await p.evaluate(()=>G3.project(-52,-10));await p.mouse.move(xy[0],xy[1]);await W(400);console.log('on',await p.evaluate(()=>[...document.querySelectorAll('#scr .on')].map(e=>e.textContent)));await shot('hover');}
// tray close crop
await p.screenshot({path:`shots/${pre}-tray.png`,clip:{x:0,y:40,width:260,height:500}});
console.log('errs',errs.slice(0,5));await b.close();
