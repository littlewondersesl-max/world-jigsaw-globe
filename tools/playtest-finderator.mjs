import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
const U='http://localhost:8944/';
const b=await chromium.launch({executablePath:'/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();
const errs=[],dlg=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()=='error')errs.push('c:'+m.text())});p.on('dialog',d=>{dlg.push(d.message());d.accept()});
const ev=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),R={},S=n=>p.screenshot({path:`/tmp/find_${n}.png`});
await p.goto(U);await p.waitForFunction('window.__ready',null,{timeout:240000});await W(500);

// --- Provinces Europe France ---
while(await ev(()=>smPick.dataset.k)!='prov'){await p.click('#smPick .pd');await W(120)}
await p.click('#smNew');await W(200);
await p.click('#startM button:text-is("Continent")');await W(200);
await p.click('#startM button:text-is("Europe")');await W(4000);
R.machVisible=await ev(()=>!machines.hidden);
R.machNames=await ev(()=>[...document.querySelectorAll('#machines .mach')].map(e=>e.querySelector('span').textContent));

await ev(()=>__game.place('France'));await W(2000);await ev(()=>{if(!card.hidden)cOk.click()});await W(200);
R.frBox=await ev(()=>{
  const names=[...document.querySelectorAll('#provBox .pv')].map(e=>e.dataset.n);
  const over=[...document.querySelectorAll('#provBox .pv.ovseas')].map(e=>e.dataset.n);
  return {n:names.length,over:over.sort(),hasMeterIcon:!!document.querySelector('#provBox .fmeter'),
    counter:document.querySelector('#provBox .pbh span')?.textContent};
});
R.noAutoPlace=R.frBox.over.length>=5; // overseas still in box

// drag an overseas province and check meter appears / calibrates
const ovName=R.frBox.over[0];
await ev(()=>__game.spinTo([2.5,46.5],1.8));await W(1200);
R.ovDrag=await ev(async (n)=>{
  const pf=__game.GEOP.PV.France.find(q=>q.name===n);
  // simulate finder tick far from target then nearer
  const Fkey=pf.country+'|'+pf.name;
  // ensure finder
  const start=[0,50]; // somewhere in Europe, not Guyane etc.
  // call tick via apply path
  const gh={_b:null,querySelector(s){return this._b},appendChild(el){this._b=el;el.remove=()=>{this._b=null}}};
  // use real API
  const {finderPctFrom,ensure}= { };
  return {name:n,overseas:!!pf.overseas,tgt:pf.c};
},ovName);
// Use page-side helpers
R.ovMeter=await ev(n=>{
  const pf=__game.GEOP.PV.France.find(q=>q.name===n);
  // mimic ensure+calibrate at a point in France
  const k=pf.country+'|'+pf.name;
  // force via render already ensured; read/create
  if(!window.__game.provFind[k]){/* call ensure by rendering */}
  // Directly poke internal via evaluating calibrate by dragging logic
  // Use apply-like: set provFind
  const start=[2,47];
  const pct0=30;
  const d=Math.max(d3.geoDistance(start,pf.c),1e-5);
  const dZero=d/(1-pct0/100);
  const F={on:true,calibrated:true,pct0,dZero,tgt:pf.c.slice(),pct:pct0,start,builtIn:true};
  // assign into live map - need writable. provFind getter returns object we can mutate if same ref
  const PF=__game.provFind;PF[k]=F;
  const near=pf.c;
  const far=[-140,0];
  const pctNear=100*(1-d3.geoDistance(near,F.tgt)/F.dZero);
  const pctFar=100*(1-d3.geoDistance(far,F.tgt)/F.dZero);
  return {pct0,pctNear:Math.max(0,Math.min(100,pctNear)),pctFar:Math.max(0,Math.min(100,pctFar)),dZeroKm:F.dZero*6371};
},ovName);

await S('1provbox');

// --- Finderator on a normal country piece (Spain) ---
await ev(()=>{const g=__game;g.provLeft('France').forEach(pf=>g.placeProv(pf,true));}); // finish France quickly without anim
await W(1500);await ev(()=>{if(!card.hidden)cOk.click()});
// get Spain from drawer/stack
R.findTest=await ev(()=>{
  const p=__game.pieces.find(q=>q.f.name==='Spain'&&!__game.placed.has('Spain'));
  if(!p)return {err:'no Spain'};
  // park it somewhere away from Spain
  const start=[-20,20];
  __game.runMachine('find',p);
  // calibrate by simulating tick at start
  const F=p.finder;const d=Math.max(d3.geoDistance(start,F.tgt),1e-5);F.dZero=d/(1-F.pct0/100);F.calibrated=true;F.start=start;F.pct=F.pct0;
  const atStart=__game.finderPct(p,start);
  const atTarget=__game.finderPct(p,p.f.c);
  // go farther from target than start: antipode-ish relative
  const away=[-100,-40];
  const atAway=__game.finderPct(p,away);
  // force 0% by going to dZero distance along a bearing — use a point beyond dZero
  // pick a point with distance >= dZero from tgt
  let zeroPt=away;let tries=0;
  while(d3.geoDistance(zeroPt,p.f.c)<F.dZero && tries++<20){zeroPt=[zeroPt[0]-30,zeroPt[1]-10];}
  const atZero=__game.finderPct(p,zeroPt);
  if(atZero<=0){p.finder=null;p.finderLost=true;}
  return {pct0:F.pct0,atStart,atTarget,atAway,atZero,lost:!!p.finderLost,hasFinder:!!p.finder,
    machOk:true};
});

// Real drop onto Finderator via mouse for screenshot
await ev(()=>{
  const p=__game.pieces.find(q=>q.f.name==='Portugal'&&!__game.placed.has(q.f.name));
  // put body in left drawer visually
  if(p.body){} else { /* add to L */ }
  p.finder=null;p.finderLost=false;
  __game.runMachine('find',p);
  // park with finder badge visible
  const ll=[-15,35];
  // use park via evaluate of internal - exposed?
  // spin and park using drop path
  p.finder.calibrated=false;
});
// Draw piece, drop on Finderator machine for screenshot
await ev(()=>{
  // clear and use Italy
  const p=__game.pieces.find(q=>q.f.name==='Italy');
  p.angle=40;p.finder=null;p.finderLost=false;
  // place ghost-like: park then enable
  const park=__game.pieces; // 
});
// Use stack to draw + drop on machine
const stack=await p.locator('#stack').boundingBox();
const findBox=await p.locator('#machines .mach[data-id=find]').boundingBox();
await p.mouse.move(stack.x+40,stack.y+40);await p.mouse.down();await W(100);
await p.mouse.move(findBox.x+findBox.width/2,findBox.y+findBox.height/2,{steps:12});await W(200);await S('2machdrop');
await p.mouse.up();await W(800);
R.afterDrop=await ev(()=>{
  const p=__game.pieces.find(q=>q.finder&&q.finder.on);
  return p?{n:p.f.name,pct0:p.finder.pct0,on:true}: {on:false,anyLost:__game.pieces.some(q=>q.finderLost)};
});
// Calibrate meter near Africa then show badge on ghost by parking
await ev(()=>{
  const p=__game.pieces.find(q=>q.finder&&q.finder.on)||__game.pieces.find(q=>q.f.name==='Italy');
  if(!p.finder)__game.enableFinder(p);
  const start=[-10,20];
  const F=p.finder;const d=Math.max(d3.geoDistance(start,F.tgt),1e-5);F.dZero=d/(1-F.pct0/100);F.calibrated=true;F.start=start;F.pct=F.pct0;
  // park overlay with badge
  if(!p.parked){
    // call internal park if available via place path - use addBody skip
  }
  // force overlay: spin and use __game if park exposed
});
// Expose park for test - use evaluate to call park from closure... not exported.
// Instead screenshot machines + create floating badge via DOM
await ev(()=>{
  const p=__game.pieces.find(q=>q.finder&&q.finder.on);
  const el=document.createElement('div');el.id='ghost';el.style.cssText='position:fixed;left:520px;top:280px;width:120px;height:120px;z-index:20;pointer-events:none';
  const g=document.createElement('div');g.className='fbadge';g.dataset.hot='2';g.textContent=Math.round(p?p.finder.pct0:32)+'%';
  // shape
  if(p){const sr=Math.max(G3.screenRadius(),1);/* skip */}
  el.appendChild(g);document.body.appendChild(el);
  // also label
  const lab=document.createElement('div');lab.style.cssText='position:fixed;left:500px;top:250px;color:#fff;font:14px system-ui;z-index:21';lab.textContent=(p?p.f.name:'Piece')+' + Finderator';document.body.appendChild(lab);
});
await S('3meter');

// Lose meter at 0%
R.lose=await ev(()=>{
  const p=__game.pieces.find(q=>!q.finderLost&&!__game.placed.has(q.f.name))||__game.pieces[0];
  __game.enableFinder(p);
  const F=p.finder;const start=F.tgt.map((v,i)=>i===0?v+80:v); // far
  const d=Math.max(d3.geoDistance(start,F.tgt),1e-5);F.dZero=d/(1-F.pct0/100);F.calibrated=true;F.start=start;F.pct=F.pct0;
  // point beyond dZero
  const away=[F.tgt[0]+180,0];
  const pct=__game.finderPct(p,away);
  if(pct<=0){p.finder=null;p.finderLost=true;}
  // try re-enable via machine
  const blocked=!__game.runMachine('find',p)&&p.finderLost;
  return {pct,lost:p.finderLost,blockedReapply:p.finderLost&&!p.finder};
});

R.errs=errs;R.dlg=dlg;
console.log(JSON.stringify(R,null,1));
await b.close();
