import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('console',m=>m.type()=='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});const t0=Date.now();
await p.goto(process.argv[2]||'http://localhost:8944/');await p.waitForFunction('window.__ready',null,{timeout:90000});console.log('ready ms',Date.now()-t0);
const W=ms=>p.waitForTimeout(ms);const shot=(n,o={})=>p.screenshot({path:'shots/pc-'+n+'.png',...o});
let t1=Date.now();await p.selectOption('#set','all');await W(300);console.log('all-set build ms',Date.now()-t1);await W(1000);
await shot('1-tray',{clip:{x:0,y:40,width:260,height:760}});
// ghost in hand
const pc=await p.locator('.piece').nth(2).boundingBox();await p.mouse.move(pc.x+40,pc.y+40);await p.mouse.down();await p.mouse.move(pc.x+80,pc.y+80,{steps:3});await p.mouse.move(700,300,{steps:6});await W(300);await shot('2-ghost');
await p.mouse.move(pc.x+40,pc.y+40,{steps:4});await p.mouse.up();await W(300);
// anchor flight
const nm='Egypt';await p.evaluate(n=>document.querySelector(`.piece[data-name="${n}"]`).scrollIntoView(),nm);
await p.evaluate(n=>__game.drop(n,700,350),nm);await W(1300);await shot('3-flyer');await W(3000);if(await p.isVisible('#card'))await p.click('#cOk');
for(const n of ['Libya','Sudan','Chad','Niger','Algeria','Saudi Arabia','Ethiopia','Kenya','Tanzania','Dem. Rep. Congo'])await p.evaluate(n=>__game.place(n),n);await W(12000);
await p.evaluate(()=>{const c=document.getElementById('card');if(c)c.hidden=true});await p.evaluate(()=>__game.spinTo([25,15],1.6));await W(1600);await shot('4-globe-africa');
// neighbour pieces side by side at one scale
await p.evaluate(()=>{const d=document.createElement('div');d.id='nb';d.style.cssText='position:fixed;inset:60px 300px 60px 280px;background:#2b1a0e;z-index:50;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;padding:10px';
 for(const n of ['Mauritania','Mali','Burkina Faso','Ghana','Nigeria','Cameroon','Angola','Namibia','Botswana','South Africa','Argentina','Chile','Peru','Bolivia','Brazil','Paraguay'])
  {const s=document.createElement('div');s.style.cssText='width:150px;height:170px;color:#eee;font:11px sans-serif;text-align:center';const f=__game.feat(n);s.innerHTML=window.__shape(f)+n;s.firstChild.setAttribute('width',150);s.firstChild.setAttribute('height',150);d.appendChild(s)}document.body.appendChild(d)});
await W(500);await shot('5-pieces');
console.log('errs',errs.slice(0,5),'bad',bad.slice(0,5));await b.close();
