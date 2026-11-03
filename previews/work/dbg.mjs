import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8944/previews/globe-zoom/');await p.waitForFunction('window.ready');
await p.evaluate('autodrop()');await p.waitForTimeout(500);await p.evaluate('jump()');await p.waitForFunction('placedNow()');
await p.evaluate('zoomTo(.3)');await p.waitForTimeout(500);
console.log(await p.evaluate(`JSON.stringify({cam:dbg.C.position.toArray(),near:dbg.C.near,far:dbg.C.far,pq:dbg.piece.quaternion.toArray(),pp:dbg.piece.position.toArray(),ps:dbg.piece.scale.toArray(),par:dbg.piece.parent===dbg.G})`));
for(const [n,js] of [['a',''],['b','dbg.ocean.visible=false;'],['c','dbg.ocean.visible=true;dbg.bg.visible=false;']]){await p.evaluate(js+'1');const d=await p.evaluate('shotNow()');fs.writeFileSync(`../shots/dbg-${n}.png`,Buffer.from(d.split(',')[1],'base64'));}
await b.close();
