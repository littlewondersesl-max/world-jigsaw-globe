import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';import fs from 'fs';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()=='error'||m.type()=='warning')console.log('CE',m.text())});p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});
await p.goto('http://localhost:8944/previews/globe-zoom/');await p.waitForFunction('window.ready',null,{timeout:300000});
await p.evaluate('autodrop()');await p.waitForTimeout(500);await p.evaluate('jump()');await p.waitForFunction('placedNow()');
await p.evaluate('zoomTo(.01)');await p.waitForFunction('cityState()[0]=="ready"',null,{timeout:400000});
const tag=process.argv[2]||'r';
// [name, dx, dz (local units: 10 km, +x east, +z south of Rio centre), alt (globe units), tilt]
for(const [n,dx,dz,a,t] of [['teresopolis',2.3,-5.2,.004,0],['teresopolis-low',2.3,-5.2,.0012,.9],['petropolis-low',.2,-4.3,.0008,1.1],['farm-low',-6,-3,.0015,.8],['serra-collide',1.5,-4.6,.00003,1.2],['region',0,-1.5,.012,.9]]){
 console.log(n,await p.evaluate(([dx,dz,a,t])=>zoomAt(dx,dz,a,t),[dx,dz,a,t]));for(let i=0;i<4;i++){await p.evaluate('shotNow()');await p.waitForTimeout(150)}
 const d=await p.evaluate('shotNow()');fs.writeFileSync(`../shots/${tag}-${n}.png`,Buffer.from(d.split(',')[1],'base64'));console.log(n,await p.evaluate('clearance()'),await p.evaluate('document.getElementById("lod").textContent'));}
await b.close();
