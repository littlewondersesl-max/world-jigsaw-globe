import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log('C',m.text()));
const o='../shots/globe-';await p.goto('http://localhost:8944/previews/globe-reveal/');await p.waitForFunction('window.ready');await p.waitForTimeout(4000);
await p.screenshot({path:o+'box.png'});
await p.evaluate('autodrop()');await p.waitForTimeout(1200);await p.screenshot({path:o+'mid.png'});
await p.waitForTimeout(5000);await p.screenshot({path:o+'done.png'});
for(const i of [1,2,3]){await p.evaluate(i=>document.querySelector(`[data-b="${i}"]`).click(),i);await p.waitForTimeout(800);await p.screenshot({path:o+'bg'+i+'.png'});}
await b.close();
