import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'cr';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const out={};
for(const [tag,opt] of [['d',{viewport:{width:1280,height:800}}],['m',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
 const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const W=ms=>p.waitForTimeout(ms),ev=(f,a)=>p.evaluate(f,a),shot=n=>p.screenshot({path:`shots/${pre}-${tag}-${n}.png`});
 await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:240000});await p.selectOption('#set','all');await W(3000);
 await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});
 await ev(()=>__game.spinTo([60,30],1.2));await W(1500);
 // pieces on lit side and on the terminator/night side
 await ev(()=>{for(const [n,lo,la] of [['Russia',95,62],['India',79,22],['Egypt',30,26],['Australia',134,-25],['Brazil',-53,-10]]){const f=__game.feat(n);__game.park(n,lo,la,1,0)}});await W(1500);await shot('1-lit');
 const ov=await ev(()=>{const z=document.getElementById('zoom').getBoundingClientRect();const hit=[...document.querySelectorAll('#stage *')].filter(e=>e.id!=='zoom'&&!document.getElementById('zoom').contains(e)&&e.offsetParent&&getComputedStyle(e).visibility!='hidden'&&e.tagName!='CANVAS').filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&e.textContent.trim()&&r.left<z.right&&r.right>z.left&&r.top<z.bottom&&r.bottom>z.top}).map(e=>e.id||e.className);return {credit:!!document.getElementById('credit'),overlapZoom:hit}});
 await p.click('#menuB');await W(300);await shot('2-menu');await p.click('#credB');await W(300);await shot('3-credits');
 const txt=await ev(()=>document.querySelector('#credP .cp').innerText);await p.click('#credX');await W(200);
 out[tag]={...ov,panelClosed:await ev(()=>document.getElementById('credP').hidden),hasODbL:/ODbL/.test(txt),hasCCBY:/CC BY 4.0/.test(txt),hasOSM:/OpenStreetMap contributors/.test(txt),errs};await ctx.close();}
console.log(JSON.stringify(out));await b.close();
