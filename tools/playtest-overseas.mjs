import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const U='http://localhost:8944/';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();
const errs=[],dlg=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()=='error')errs.push(m.text())});p.on('dialog',d=>{dlg.push(d.message());d.accept()});
const ev=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),R={};
await p.goto(U);await p.waitForFunction('window.__ready',null,{timeout:240000});await W(600);
// Provinces → Continent → Europe
while(await ev(()=>smPick.dataset.k)!='prov'){await p.click('#smPick .pd');await W(150)}
await p.click('#smNew');await W(250);
await p.click('#startM button:text-is("Continent")');await W(250);
await p.click('#startM button:text-is("Europe")');await W(4500);
R.mode=await ev(()=>__game.mode);R.set=await ev(()=>set.value);
// France overseas tagging
R.fr=await ev(()=>{
  const all=__game.GEOP.PV.France;
  return {n:all.length,
    over:all.filter(q=>q.overseas).map(q=>q.name).sort(),
    main:all.filter(q=>!q.overseas).map(q=>q.name).sort()};
});
// place France → box should only list mainland
await ev(()=>__game.place('France'));await W(2200);await ev(()=>{if(!card.hidden)cOk.click()});await W(200);
R.boxNames=await ev(()=>[...document.querySelectorAll('#provBox .pv')].map(e=>e.dataset.n).sort());
R.boxShowsOverseas=R.boxNames.some(n=>R.fr.over.includes(n));
R.boxCount=R.boxNames.length;
R.counter=await ev(()=>document.querySelector('#provBox .pbh span')?.textContent);
// place just under 50% — overseas should NOT auto yet
const need=Math.ceil(R.fr.main.length/2);
const under=need-1;
await ev(([n])=>{const g=__game;g.provMainland('France').slice(0,n).forEach(pf=>g.placeProv(pf,true));
  // quiet place skips afterProvPlace — call it once at end
  g.afterProvPlace('France');},[under]);
await W(800);
R.atUnder={placed:await ev(()=>[...__game.provPlaced].filter(k=>k.startsWith('France|')).length),
  overDone:await ev(()=>__game.provOverseas('France').filter(pf=>__game.provPlaced.has(__game.provLeft?pf.country+'|'+pf.name:0)).length)};
// fix overDone check
R.atUnder.overPlaced=await ev(()=>__game.provOverseas('France').filter(pf=>__game.provPlaced.has(pf.country+'|'+pf.name)).length);
R.atUnder.mainPlaced=await ev(()=>__game.provMainland('France').filter(pf=>__game.provPlaced.has(pf.country+'|'+pf.name)).length);
// place one more to cross 50%
await ev(()=>{const g=__game;const next=g.provMainland('France').find(pf=>!g.provPlaced.has(pf.country+'|'+pf.name));
  g.placeProv(next);});
await W(9000);
R.after50={mainPlaced:await ev(()=>__game.provMainland('France').filter(pf=>__game.provPlaced.has(pf.country+'|'+pf.name)).length),
  overPlaced:await ev(()=>__game.provOverseas('France').filter(pf=>__game.provPlaced.has(pf.country+'|'+pf.name)).length),
  toast:await ev(()=>(document.getElementById('toast')||{textContent:''}).textContent)};
// finish remaining mainland
await ev(()=>{const g=__game;g.provMainland('France').forEach(pf=>{if(!g.provPlaced.has(pf.country+'|'+pf.name))g.placeProv(pf,true)});
  g.afterProvPlace('France');});
await W(2500);
R.done={open:await ev(()=>__game.provOpen.slice()),
  left:await ev(()=>__game.provLeft('France').length),
  over:await ev(()=>__game.provOverseas('France').every(pf=>__game.provPlaced.has(pf.country+'|'+pf.name))),
  toast:await ev(()=>(document.getElementById('toast')||{}).textContent||'')};
// save / reload
await ev(()=>{if(!card.hidden)cOk.click()});await W(200);
await p.click('#menuB');await W(150);await p.click('#pauseB');await W(250);await p.click('#pzSave');await W(400);
const saved=await ev(()=>__game.readSave());
await p.reload();await p.waitForFunction('window.__ready',null,{timeout:240000});await W(700);
await p.click('#smLoad');await W(4500);
R.loaded={mode:await ev(()=>__game.mode),
  open:await ev(()=>__game.provOpen.slice()),
  frKeys:[...await ev(()=>[...__game.provPlaced].filter(k=>k.startsWith('France|')).sort())],
  overAll:await ev(()=>__game.provOverseas('France').every(pf=>__game.provPlaced.has(pf.country+'|'+pf.name))),
  match:false};
R.loaded.match=JSON.stringify(saved.provPlaced?.slice?.()||[...saved.provPlaced||[]].sort())===JSON.stringify(R.loaded.frKeys) ||
  JSON.stringify([...(saved.provPlaced||[])].sort())===JSON.stringify(R.loaded.frKeys);
// also compare full snapshot essentials
R.snapMatch=await ev(s=>{const a=__game.snapshot();
  return a.mode===s.mode&&a.set===s.set&&a.placed.join()===s.placed.join()
    &&[...a.provPlaced].sort().join()===[...s.provPlaced].sort().join()
    &&(a.provOpen||[]).join()===(s.provOpen||[]).join()},saved);
R.dlg=dlg;R.errs=errs;R.need50=need;
console.log(JSON.stringify(R,null,1));
await b.close();
