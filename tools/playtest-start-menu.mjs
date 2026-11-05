import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const U='http://localhost:8944/';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();const errs=[],dlg=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()=='error')errs.push(m.text())});p.on('dialog',d=>{dlg.push(d.message());d.accept()});
const ev=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),M=p.mouse,R={};const S=n=>p.screenshot({path:`/tmp/sm_${n}.png`});
await p.goto(U);await p.waitForFunction('window.__ready',null,{timeout:240000});await W(800);
R.menuShown=await ev(()=>!document.getElementById('startM').hidden);await S('1menu');
R.pick=[];for(let i=0;i<3;i++){R.pick.push(await ev(()=>smPick.dataset.k));await p.click('#smPick .pd');await W(250);}R.pickLoop=await ev(()=>smPick.dataset.k);
await p.hover('#smPick');await M.wheel(0,100);await W(250);R.wheel=await ev(()=>smPick.dataset.k);await M.wheel(0,-100);await W(250);
// Continents game
await p.click('#smPick .pd');await W(200);await p.click('#smNew');await W(300);await S('2cont');await p.click('#startM button:text-is("Africa")');await W(2500);
R.cont={mode:await ev(()=>__game.mode),set:await ev(()=>set.value),n:await ev(()=>__game.pieces.length)};
// play: anchor + place via real drops; place countries via hook then real drops of 2 pieces at their centroid
await ev(()=>{const g=__game;['Algeria','Libya','Egypt'].forEach(n=>g.place(n));});await W(3000);await ev(()=>cOk.click());
const tryDrop=async n=>{await ev(n=>{const g=__game,q=g.pieces.find(q=>q.f.name==n);q.angle=0;g.spinTo(q.f.c,1);},n);await W(1800);
 const xy=await ev(n=>{const f=__game.feat(n);return G3.project(f.c[0],f.c[1])},n);await ev(([n,x,y])=>__game.drop(n,x,y),[n,...xy]);await W(2500);await ev(()=>cOk.click());return await ev(n=>__game.placed.has(n),n)};
R.contDrop=[await tryDrop('Chad'),await tryDrop('Niger')];R.contPlaced=await ev(()=>__game.placed.size);await S('3contplay');
// to start menu -> Provinces -> Continent -> Europe
await p.click('#menuB');await p.click('#startB');await W(400);R.backToMenu=await ev(()=>!startM.hidden);
while(await ev(()=>smPick.dataset.k)!='prov'){await p.click('#smPick .pd');await W(200);}R.k=await ev(()=>smPick.dataset.k);console.log('dbg',R.backToMenu,R.k,R.pick,R.pickLoop,R.wheel,JSON.stringify(R.cont));await p.click('#smNew');await W(300);await S('4provq');
await p.click('#startM button:text-is("Continent")');await W(300);await p.click('#startM button:text-is("Europe")');await W(4000);
R.prov={mode:await ev(()=>__game.mode),set:await ev(()=>set.value),n:await ev(()=>__game.pieces.length)};
// place France via hook -> box pops
await ev(()=>__game.place('France'));await W(2500);await ev(()=>cOk.click());await W(300);
R.box={shown:await ev(()=>!provBox.hidden),left:await ev(()=>__game.provLeft('France').length)};await S('5provbox');
// locked: Spain drop should park
R.locked=await tryDrop('Spain');
// real-mouse drag provinces from box to globe
await ev(()=>__game.spinTo([2.5,46.5],2.2));await W(1800);
const dragProv=async()=>{const t=await ev(()=>{const el=document.querySelector('#provBox .pv');if(!el)return null;const n=el.dataset.n,cn=provBox.querySelector('.pbh b').textContent.replace('Provinces of ','');const pf=__game.GEOP.PV[cn].find(q=>q.name==n);if(!pf)return ['ERR:'+cn+'|'+n,null];if(!G3.facing(pf.c[0],pf.c[1]))return [n,null];const r=el.getBoundingClientRect();return [n,[r.x+r.width/2,r.y+20],G3.project(pf.c[0],pf.c[1])]});return t};
let real=0,hook=0;
for(let i=0;i<40;i++){const t=await dragProv();if(!t)break;if(t[1]){await M.move(...t[1]);await M.down();await M.move(...t[2],{steps:8});await M.up();await W(150);if(!(await ev(n=>__game.provLeft('France').some(q=>q.name==n),t[0]))){real++;continue}}
 if(t[0].startsWith('ERR')){R.err=t[0];break}await ev(n=>__game.placeProv(__game.GEOP.PV.France.find(q=>q.name==n)),t[0]);hook++;await W(50);
 if(i==3){await S('6provpart');}}
R.provRealDrops=real;R.provHook=hook;R.franceDone=await ev(()=>__game.provLeft('France').length===0);R.boxAfter=await ev(()=>provBox.hidden);await W(2000);
R.spainNow=await ev(()=>__game.placed.has('Spain'));R.spainJoin=R.spainNow||await tryDrop('Spain');await W(500);R.spainBox=await ev(()=>__game.provOpen.slice());
// place two Spain provinces, save, reload, load
await ev(()=>{const g=__game;g.GEOP.PV.Spain.slice(0,2).forEach(pf=>g.placeProv(pf))});await W(400);await S('7provspain');
console.log('mid',JSON.stringify(R));await ev(()=>{if(!card.hidden)cOk.click()});await W(300);await p.click('#menuB');await W(200);await p.click('#pauseB');await W(300);await p.click('#pzSave');await W(300);const saved=await ev(()=>__game.readSave());
await p.reload();await p.waitForFunction('window.__ready',null,{timeout:240000});await W(800);R.continueBtn=await ev(()=>!!document.getElementById('smLoad'));
await p.click('#smLoad');await W(4000);const after=await ev(()=>__game.snapshot());
const pick=s=>JSON.stringify({mode:s.mode,set:s.set,placed:s.placed,pp:[...s.provPlaced].sort(),po:s.provOpen,pcs:s.pieces.map(q=>[q.n,q.st,Math.round(q.x||q.lon||0),Math.round(q.y||q.lat||0),q.angle])});
R.loadMatch=pick(saved)===pick(after);R.loadedBox=await ev(()=>[!provBox.hidden,provBox.querySelector('.pbh').textContent]);await S('8loaded');
R.dlg=dlg;R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close();
