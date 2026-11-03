import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const [,,url,out,...keys]=process.argv;
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()=='error')console.log('CE',m.text())});
await p.goto('http://localhost:8944/previews/'+url);await p.waitForFunction('window.ready',null,{timeout:400000});
console.log(await p.evaluate('[window.treeCount,window.cityCount,window.showCount]'));
for(const k of keys){const d=await p.evaluate(k=>shot(k,3),k);fs.writeFileSync(`${out}-${k}.png`,Buffer.from(d.split(',')[1],'base64'));}
await b.close();
