import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()=='error')console.log('CE',m.text())});
await p.goto('http://localhost:8944/previews/globe-zoom/');await p.waitForFunction('window.ready',null,{timeout:300000});
await p.evaluate('autodrop()');await p.waitForTimeout(500);await p.evaluate('jump()');await p.waitForFunction('placedNow()');
const tag=process.argv[2]||'z';
for(const a of (process.argv[3]||'3,1,.3,.1,.05,.03,.015,.008').split(',').map(Number)){
 await p.evaluate(a=>zoomTo(a),a);await p.waitForTimeout(300);
 await p.waitForFunction('!cityState().includes("loading")',null,{timeout:400000});await p.waitForTimeout(300);
 const d=await p.evaluate('shotNow()');fs.writeFileSync(`../shots/${tag}-${a}.png`,Buffer.from(d.split(',')[1],'base64'));console.log(a,await p.evaluate('document.getElementById("lod").textContent'));}
await b.close();
