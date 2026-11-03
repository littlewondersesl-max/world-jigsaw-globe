import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'dw';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const out={};
for(const [tag,opt] of [['d',{viewport:{width:1280,height:800}}],['m',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
 const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack).slice(0,300)));
 const W=ms=>p.waitForTimeout(ms),ev=(f,a)=>p.evaluate(f,a),shot=n=>p.screenshot({path:`shots/${pre}-${tag}-${n}.png`});const R={};
 const cdp=await ctx.newCDPSession(p);const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
 const touch=tag=='m';
 async function gest(a,c,n=12){if(touch){await T('touchStart',[a]);for(let k=1;k<=n;k++){await T('touchMove',[[a[0]+(c[0]-a[0])*k/n,a[1]+(c[1]-a[1])*k/n]]);await W(16);}await T('touchEnd',[]);}else{await p.mouse.move(...a);await p.mouse.down();await p.mouse.move(...c,{steps:n});await p.mouse.up();}await W(200);}
 async function tap(x,y){if(touch){await T('touchStart',[[x,y]]);await W(40);await T('touchEnd',[]);}else{await p.mouse.move(x,y);await p.mouse.down();await W(40);await p.mouse.up();}await W(150);}
 await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:240000});await p.selectOption('#set','Africa');await W(2500);
 await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});await W(500);
 R.title=await p.title();R.h1=await ev(()=>document.querySelector('h1').textContent);
 const S=()=>ev(()=>({L:Math.round(__game.DR.L.open),R:Math.round(__game.DR.R.open),nL:__game.DR.L.bodies.length,nR:__game.DR.R.bodies.length,W:innerWidth}));
 R.start=await S();await shot('1-closed');
 const VW=opt.viewport.width,VH=opt.viewport.height;
 const hl=await p.locator('.dL .dh').boundingBox();
 const pos0=await ev(()=>__game.DR.L.bodies.slice(0,5).map(b=>[b.x,b.y]));
 await gest([hl.x+8,hl.y+48],[VW*.6,hl.y+48],10);await W(900);R.leftOpen=await S();
 R.piecesSlid=await ev(p0=>__game.DR.L.bodies.slice(0,5).map((b,i)=>Math.round(Math.hypot(b.x-p0[i][0],b.y-p0[i][1]))),pos0);await shot('2-left');
 const hr=await p.locator('.dR .dh').boundingBox();
 await gest([hr.x+8,hr.y+48],[VW*.2,hr.y+48],10);await W(900);R.pushed=await S();await shot('3-right-pushes');
 // carry from stack: close both first
 await ev(v=>{__game.setOpen(__game.DR.L,0);__game.setOpen(__game.DR.R,v*.55)},VW);await W(500);
 const sb=await p.locator('#stack').boundingBox();R.atStack=await ev(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.className)},[sb.x+39,sb.y+39]);await ev(()=>{window.LG=[];for(const t of ['pointerdown','pointerup','pointercancel'])addEventListener(t,e=>LG.push(t+':'+(__game.carrying&&1)+':'+e.target.id),true)});await tap(sb.x+39,sb.y+39);R.carrying=await ev(()=>__game.carrying&&__game.carrying.f.name);
 if(!touch)await p.mouse.move(VW*.8,VH*.5,{steps:6});await W(200);await shot('4-carry');
 await tap(VW*.8,VH*.55);await W(1200);R.afterDrawerDrop=await S();R.secOf=await ev(()=>__game.DR.R.bodies.map(b=>b.sec+':'+b.p.f.name));await shot('5-in-right');
 // carry from stack onto the globe -> anchor starts
 await ev(()=>__game.setOpen(__game.DR.R,0));await W(400);
 await ev(()=>__game.spinTo([10,10],1.3));await W(1200);
 const st=await p.locator('#stage').boundingBox();const tgt=await ev(()=>G3.project(-20,0));
 await gest([sb.x+39,sb.y+39],tgt,14);await W(800);R.globeDrop={anc:await ev(()=>__game.anc&&__game.anc.p.f.name),parked:await ev(()=>__game.parked.map(q=>q.f.name))};await shot('6-on-globe');
 R.fps0=await ev(async()=>{let n=0;const t=performance.now();await new Promise(r=>{(function f(){n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r()})()});return n;});R.fps=await ev(async()=>{__game.setOpen(__game.DR.L,innerWidth*.9);let n=0;const t=performance.now();await new Promise(r=>{(function f(){n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r()})()});return n;});await W(600);await shot('7-full');
 R.errs=errs;out[tag]=R;await ctx.close();}
console.log(JSON.stringify(out));await b.close();
