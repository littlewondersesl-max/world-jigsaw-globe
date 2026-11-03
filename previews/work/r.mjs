import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e));p.on('console',m=>m.type()=='error'&&console.log('C',m.text()));
await p.goto('http://localhost:8944/previews/work/p.html');await p.waitForFunction('window.ready',null,{timeout:60000});
const styles=(process.argv[2]||'ABCD').split('');
for(const s of styles)for(const [n,t] of [['left',-20],['front',0],['right',20]]){const t0=Date.now();const d=await p.evaluate(([s,t])=>render(s,t),[s,t]);fs.writeFileSync(`/workspace/world-jigsaw/previews/brazil-${s}-${n}.png`,Buffer.from(d.split(',')[1],'base64'));console.log(s,n,Date.now()-t0,'ms');}
await b.close();
