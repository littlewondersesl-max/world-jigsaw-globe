import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const out='/workspace/world-jigsaw/previews/';const save=(n,d)=>fs.writeFileSync(out+n,Buffer.from(d.split(',')[1],'base64'));
const job=process.argv[2];
const p=await b.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>console.log('ERR',e.message));
if(job=='looks'){for(const L of [1,2,3]){await p.goto(`http://localhost:8944/previews/work/brazil.html?look=${L}&fx=0&still`);await p.waitForFunction('window.ready',null,{timeout:120000});
  let t=Date.now();save(`brazil-hd-${L}.png`,await p.evaluate(()=>shot('full')));save(`brazil-hd-${L}-zoom.png`,await p.evaluate(()=>shot('zoom')));console.log(L,Date.now()-t);}}
else {const L=job.slice(2);await p.goto(`http://localhost:8944/previews/work/brazil.html?look=${L}&still`);await p.waitForFunction('window.ready',null,{timeout:180000});
  console.log('trees',await p.evaluate('treeCount'),await p.evaluate('cityCount'));
  for(const k of ['full','zoom','zoom2','manaus']){const t=Date.now();save(`brazil-live-${k}.png`,await p.evaluate(k=>shot(k,3),k));console.log(k,Date.now()-t,'ms');}}
await b.close();
