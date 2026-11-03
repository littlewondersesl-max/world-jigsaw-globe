import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:960,height:540}});await p.goto('http://localhost:8944/previews/brazil/index.html?look=2&still&trees=25000');await p.waitForFunction('window.ready',null,{timeout:180000});
fs.mkdirSync('/tmp/vf',{recursive:true});const N=120;const t0=Date.now();
for(let i=0;i<N;i++){const d=await p.evaluate(([f,t])=>{lerpShot('full','zoom',f,t);return document.querySelector('canvas').toDataURL('image/jpeg',.9)},[i/(N-1),i/12]);fs.writeFileSync(`/tmp/vf/f${String(i).padStart(4,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'));}
console.log('frames',(Date.now()-t0)/N,'ms/frame');await b.close();
