import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const U='http://localhost:8944/?play';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();const errs=[],dlg=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{dlg.push(d.message());d.accept()});
const ev=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),M=p.mouse,R={};
const drag=async(a,c,n=12)=>{await M.move(...a);await M.down();await M.move(...c,{steps:n});await M.up();};
const norm=s=>{s=JSON.parse(JSON.stringify(s));delete s.t;s.pieces.forEach(q=>{for(const k of ['x','y','lon','lat','s','angle'])if(q[k]!=null)q[k]=+q[k].toFixed(2)});s.quat=s.quat.map(v=>+v.toFixed(4));s.cam.p=s.cam.p.map(v=>+v.toFixed(3));s.drawers.L=Math.round(s.drawers.L);s.drawers.R=Math.round(s.drawers.R);return JSON.stringify(s)};
await p.goto(U);await p.waitForFunction('window.__ready',null,{timeout:240000});await p.selectOption('#set','Europe');await W(2000);
await p.check('#easy');await p.selectOption('#bg','1');await p.click('#mute');
// place pieces via game hooks: anchor flow -> place directly a chain
await ev(()=>{const g=__game;const n=['France','Spain','Germany','Italy'].filter(n=>g.pieces.some(p=>p.f.name==n));for(const k of n)g.place(k);});await W(3000);
await ev(()=>{document.getElementById('cOk').click()});
// park one on globe, rotate one
await ev(()=>{const g=__game;const q=g.pieces.find(p=>!g.placed.has(p.f.name));g.park(q.f.name,40,10,1,77);});
let h=await p.locator('.drawer.dR .dh').boundingBox();await drag([h.x+8,h.y+60],[400,h.y+60]);await W(1500);
const sk=await p.locator('#stack').boundingBox();
for(let i=0;i<3;i++){await M.click(sk.x+30,sk.y+30);await W(200);await M.click(1000+i*60,300+(i%2)*200);await W(500);}
await W(3000);
// Escape while carrying: drops piece, menu stays closed
await M.click(sk.x+30,sk.y+30);await W(200);R.carry=await ev(()=>!!__game.carrying);await p.keyboard.press('Escape');await W(300);R.afterEsc={carry:!!await ev(()=>__game.carrying),pause:await ev(()=>__game.pause)};
await p.keyboard.press('Escape');await W(300);R.pauseOpen=await ev(()=>__game.pause);
await p.click('#pzSave');await W(300);R.toast=await ev(()=>document.getElementById('toast').className+':'+document.getElementById('toast').textContent);
await p.screenshot({path:'shots/r28a.png'});
await p.keyboard.press('Escape');await W(200);R.pauseClosed=!await ev(()=>__game.pause);
const before=await ev(()=>__game.readSave());R.placedBefore=before.placed;R.parkedBefore=before.pieces.filter(q=>q.st=='parked').length;R.Rbefore=before.pieces.filter(q=>q.st=='R').map(q=>q.n);
await p.reload();await p.waitForFunction('window.__ready',null,{timeout:240000});await W(1500);
// menu button path
await p.click('#menuB');await p.click('#pauseB');await W(200);R.menuOpens=await ev(()=>__game.pause);
await p.click('#pzLoad');await W(4000);R.dialogs=[...dlg];
const after=await ev(()=>__game.snapshot());
R.match=norm(before)===norm(after);if(!R.match){const A=JSON.parse(norm(before)),B=JSON.parse(norm(after));R.diff=A.pieces.map((q,i)=>JSON.stringify(q)!==JSON.stringify(B.pieces[i])?[q,B.pieces[i]]:null).filter(Boolean);for(const k in A)if(k!="pieces"&&JSON.stringify(A[k])!==JSON.stringify(B[k]))R.diff.push([k,A[k],B[k]]);}
R.ui=await ev(()=>({set:set.value,easy:easy.checked,bg:bg.value,mute:mute.textContent,prog:progress.textContent,stripes:tubeFill.children.length}));
await p.screenshot({path:'shots/r28b.png'});
// load with progress -> confirm asked
dlg.length=0;await p.keyboard.press('Escape');await p.click('#pzLoad');await W(1500);R.confirmAsked=dlg;
R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close();
