import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('console',m=>m.type()=='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
await p.goto(process.argv[2]||'http://localhost:8944/');await p.waitForFunction('window.__ready',null,{timeout:60000});
const W=ms=>p.waitForTimeout(ms);const shot=n=>p.screenshot({path:'shots/g3-'+n+'.png'});
await p.selectOption('#set','all');await W(1500);console.log('pieces',await p.evaluate('__game.pieces.length'));await shot('1-start');
async function dragPiece(name,fix){if(fix)await p.evaluate(n=>{const q=__game.pieces.find(p=>p.f.name==n);q.angle=0;q.el.firstChild.style.transform='rotate(0deg)'},name);
 await p.evaluate(n=>document.querySelector(`.piece[data-name="${n}"]`).scrollIntoView(),name);const pc=await p.locator(`.piece[data-name="${name}"]`).boundingBox();
 await p.evaluate(n=>__game.spinTo(__game.feat(n).c,1),name);await W(1500);const [x,y]=await p.evaluate(n=>{const f=__game.feat(n);return G3.project(f.c[0],f.c[1])},name);
 await p.mouse.move(pc.x+40,pc.y+40);await p.mouse.down();await p.mouse.move(pc.x+60,pc.y+60,{steps:3});await p.mouse.move(x,y,{steps:8});await W(200);if(fix=='ghost')await shot('2-drag');await p.mouse.up();await W(300);}
// wrong rotation first
await p.evaluate(()=>{const q=__game.pieces.find(p=>p.f.name=='Brazil');q.angle=120});await dragPiece('Brazil');console.log('rot msg:',await p.textContent('#msg'),'placed',await p.evaluate('__game.placed.has("Brazil")'));
await dragPiece('Brazil','ghost');await W(800);await shot('3-brazil-reveal');console.log('brazil placed',await p.evaluate('__game.placed.has("Brazil")'),'card',await p.isVisible('#card'));
await W(4000);if(await p.isVisible('#card'))await p.click('#cOk');
for(const n of ['Argentina','France','Egypt','Australia']){await dragPiece(n,true);await W(2500);if(await p.isVisible('#card'))await p.click('#cOk');await W(300);console.log(n,await p.evaluate(n=>__game.placed.has(n),n),await p.textContent('#progress'));}
await p.evaluate(()=>{for(const n of ['India','China','Russia','Canada','United States of America','Peru','Chile','Colombia'])__game.place(n)});await W(6000);await p.evaluate(()=>document.getElementById('card').hidden=true);
await p.evaluate(()=>{G3.spinTo([-30,0],1)});await W(1500);await shot('4-globe');
// hint 3 glow
await p.evaluate(()=>document.querySelector('.piece').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));await p.mouse.up();
await p.click('#h1');await p.click('#h2');await p.click('#h3');await W(1300);await shot('5-hint');
// Rio zoom
for(const a of [.3,.08,.02,.006]){await p.evaluate(a=>G3.zoomRio(a),a);await W(a<.03?25000:5000);console.log('alt',a,await p.evaluate('G3.cityState()'),await p.evaluate('G3.alt().toFixed(0)'));await shot('6-rio-'+a);}
console.log('errs',errs.slice(0,5),'bad',bad.slice(0,5));await b.close();
