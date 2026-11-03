import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8944/previews/globe-reveal/');await p.waitForFunction('window.ready');await p.waitForTimeout(3000);
await p.screenshot({path:'../shots/globe-walls-box.png'});await b.close();
