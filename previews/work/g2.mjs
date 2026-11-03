import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:640,height:360}});
for(const v of ['nobot','noatm']){await p.goto('http://localhost:8944/previews/globe-reveal/?'+v);await p.waitForFunction('window.ready');await p.waitForTimeout(2000);await p.evaluate('autodrop()');await p.waitForTimeout(5000);await p.screenshot({path:'/tmp/d-'+v+'.png'});}
await b.close();
