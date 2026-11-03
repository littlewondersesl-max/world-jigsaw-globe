import {chromium,devices} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const url=process.argv[2]||'http://localhost:8944/',pre=process.argv[3]||'tt';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack)));
const cdp=await ctx.newCDPSession(p);const W=ms=>p.waitForTimeout(ms),ev=(f,a)=>p.evaluate(f,a),shot=n=>p.screenshot({path:`shots/${pre}-${n}.png`});
const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
async function gest(from,to,n=10){await T('touchStart',from);for(let k=1;k<=n;k++){await T('touchMove',from.map((f,i)=>[f[0]+(to[i][0]-f[0])*k/n,f[1]+(to[i][1]-f[1])*k/n]));await W(16);}await T('touchEnd',[]);await W(300);}
const R={};
await p.goto(url);await p.waitForFunction('window.__ready',null,{timeout:90000});
await p.selectOption('#set','Africa');await W(2500);
await ev(()=>{const c=document.getElementById('lbl');c.checked=false;c.dispatchEvent(new Event('change'))});
await ev(()=>__game.spinTo([10,10],1.3));await W(1300);await shot('0-start');
// tray scroll (horizontal swipe on tray)
const tr=await p.locator('#pieces').boundingBox();const sl0=await ev(()=>document.getElementById('pieces').scrollLeft);
await gest([[tr.x+tr.width-20,tr.y+tr.height/2]],[[tr.x+40,tr.y+tr.height/2]]);await W(500);
R.trayScroll=[sl0,await ev(()=>document.getElementById('pieces').scrollLeft)];
// globe one-finger rotate vs empty-space orbit
const st=await p.locator('#stage').boundingBox();const cx=st.x+st.width/2,cy=st.y+st.height/2;
const q0=await ev(()=>G3.quat());const c0=await ev(()=>G3.C.position.toArray());
await gest([[cx,cy]],[[cx+60,cy]]);R.globeRot={quatChanged:JSON.stringify(q0)!=JSON.stringify(await ev(()=>G3.quat())),camChanged:JSON.stringify(c0)!=JSON.stringify(await ev(()=>G3.C.position.toArray()))};
const q1=await ev(()=>G3.quat());const c1=await ev(()=>G3.C.position.toArray());
await gest([[st.x+12,st.y+14]],[[st.x+80,st.y+14]]);R.orbit={quatChanged:JSON.stringify(q1)!=JSON.stringify(await ev(()=>G3.quat())),camChanged:JSON.stringify(c1)!=JSON.stringify(await ev(()=>G3.C.position.toArray()))};
await ev(()=>__game.spinTo([10,10],1.3));await W(1300);
// tap-to-pick + drag: touch a tray piece and drag to blank water on globe
await ev(()=>{const q=__game.pieces.find(q=>q.f.name=='Egypt');q.angle=40;const el=q.el;el.scrollIntoView({inline:'center'})});await W(300);
const eb=await ev(()=>{const r=__game.pieces.find(q=>q.f.name=='Egypt').el.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
const wat=await ev(()=>G3.project(-20,0));
await gest([eb],[wat],14);await W(600);R.drag={parked:await ev(()=>__game.parked.map(q=>q.f.name)),anc:await ev(()=>__game.anc&&__game.anc.step)};await shot('1-dropped');
await W(1800);const S=()=>ev(()=>__game.anc&&{step:__game.anc.step,s:__game.anc.p.s,a:__game.anc.p.angle,x:__game.anc.p.sx,y:__game.anc.p.sy});
let s=await S();R.before=s;
if(s&&s.step=='scale'){const k=1/s.s,d=40;await gest([[s.x-d,s.y],[s.x+d,s.y]],[[s.x-d*k,s.y],[s.x+d*k,s.y]]);}
await W(400);s=await S();R.afterPinch=s;await shot('2-pinched');
if(s&&s.step=='rot'){const r=50,da=-s.a*Math.PI/180;await gest([[s.x-r,s.y],[s.x+r,s.y]],[[s.x-r*Math.cos(da),s.y-r*Math.sin(da)],[s.x+r*Math.cos(da),s.y+r*Math.sin(da)]],12);}
await W(600);s=await S();R.afterTwist=s;await shot('3-twisted');
if(s&&s.step=='lat'){const t=await ev(()=>G3.project(...__game.anc.p.f.c));await gest([[s.x,s.y]],[[s.x,t[1]]],12);}
await W(800);R.final={anc:await S(),placed:await ev(()=>[...__game.placed])};await shot('4-latdone');
await W(4500);await ev(()=>{for(const i of ['card','flagPop']){const c=document.getElementById(i);if(c)c.hidden=true}});
// placed list scroll
const L=await ev(()=>{const l=document.getElementById('scrL');for(let i=0;i<30;i++){const d=document.createElement('div');d.textContent='row '+i;l.appendChild(d)}const r=l.getBoundingClientRect();return [r.x,r.y,r.width,r.height,getComputedStyle(l).overflowY,l.scrollHeight,l.clientHeight]});
if(L[3]>20){await gest([[L[0]+L[2]/2,L[1]+L[3]-6]],[[L[0]+L[2]/2,L[1]+6]]);await W(500);}R.listScroll={box:L,scrollTop:await ev(()=>document.getElementById('scrL').scrollTop)};await shot('5-list');
console.log(JSON.stringify(R,null,1));console.log('errs',errs);await b.close();
