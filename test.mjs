import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('console',m=>m.type()=='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
const bad=[];p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
await p.goto(process.argv[2]||'http://localhost:8765/');await p.waitForFunction('window.__ready',null,{timeout:8000}).catch(()=>{console.log('NOTREADY',errs,bad);process.exit(1)});
console.log('pieces',await p.evaluate('__game.pieces.length'));
await p.screenshot({path:'shots/1-start.png'});
const snd=await p.evaluate(async()=>{const o={};for(const k of ['place','miss','win']){const r=await fetch('sounds/'+k+'.mp3');o[k]=r.status+':'+(await r.arrayBuffer()).byteLength}return o});console.log('sounds',snd);
// pick Brazil, hints
const name='Brazil';await p.click(`.piece[data-name="${name}"]`);
await p.click('#h1');await p.click('#h2');console.log('hint2:',await p.textContent('#hintText'));
await p.click('#h3');await p.waitForTimeout(1200);await p.screenshot({path:'shots/2-hints.png'});
// wrong drop first: drop at opposite corner of globe
const box=await p.locator('#globe').boundingBox();const pc=await p.locator(`.piece[data-name="${name}"]`).boundingBox();
async function dragTo(x,y){await p.mouse.move(pc.x+40,pc.y+40);await p.mouse.down();await p.mouse.move(pc.x+80,pc.y+80,{steps:5});await p.mouse.move(x,y,{steps:10});await p.mouse.up();}
await dragTo(box.x+box.width/2+box.height*.3,box.y+box.height*.2);
console.log('after wrong drop placed:',await p.evaluate('__game.placed.size'));
const xy=await p.evaluate(n=>{const f=__game.pieces.find(q=>q.f.name==n).f;return __game.proj()(f.c)},name);
await dragTo(box.x+xy[0],box.y+xy[1]);
console.log('after right drop placed:',await p.evaluate('__game.placed.size'));
await p.waitForTimeout(900);await p.screenshot({path:'shots/3-flag.png'});
await p.waitForSelector('#card:not([hidden])',{timeout:6000});console.log('card:',(await p.textContent('#card')).slice(0,120));
console.log('stripes',await p.locator('.stripe').count());await p.screenshot({path:'shots/4-card.png'});
console.log('errors',errs,'bad',bad);await b.close();
