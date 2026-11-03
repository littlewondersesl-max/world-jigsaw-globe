import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8944/previews/south-america/index.html?still');await p.waitForFunction('window.ready',null,{timeout:300000});
console.log(await p.evaluate('treeCount'),await p.evaluate('cityCount'));
for(const k of ['full','andes','plata','rio']){const t=Date.now();const d=await p.evaluate(k=>shot(k,3),k);fs.writeFileSync(`/workspace/world-jigsaw/previews/sa-${k}.png`,Buffer.from(d.split(',')[1],'base64'));console.log(k,Date.now()-t);}
await b.close();
