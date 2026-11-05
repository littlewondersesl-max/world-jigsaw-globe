import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
import {spawnSync} from 'child_process';
import {mkdirSync,writeFileSync} from 'fs';
const U='http://localhost:8944/?play';
const OUT='/workspace/world-jigsaw/previews/compare';
mkdirSync(OUT,{recursive:true});
const chrome='/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const b=await chromium.launch({executablePath:chrome,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});
const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
const R={bugs:[],notes:[]};
const ev=(fn,a)=>page.evaluate(fn,a);
const shot=n=>page.screenshot({path:`${OUT}/_pt5_${n}.png`});

async function boot(){
  await page.goto(U,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction('window.__ready',null,{timeout:240000});
}
await boot();

// ===== Start menu via openStart + real clicks =====
await ev(()=>__game.openStart());
await page.waitForTimeout(300);
R.menu={visible:await ev(()=>!startM.hidden), opts:await ev(()=>{
  // walk Global / Continents / Provinces via picker
  const seen=[];
  for(let i=0;i<3;i++){seen.push(document.querySelector('#smPick .pr')?.textContent.trim()); document.querySelector('#smPick .pd').click();}
  return seen;
})};
if(!R.menu.visible) R.bugs.push('start menu not visible after openStart');
if(!R.menu.opts.includes('Global')||!R.menu.opts.includes('Continents')||!R.menu.opts.includes('Provinces'))
  R.bugs.push('menu picker missing modes: '+JSON.stringify(R.menu.opts));

async function pickMode(k){
  await ev(()=>__game.openStart());
  await page.waitForTimeout(150);
  await ev((want)=>{
    for(let i=0;i<6;i++){
      if(smPick.dataset.k===want) return;
      document.querySelector('#smPick .pd').click();
    }
  },k);
}
await pickMode('cont');
await page.click('#smNew');
await page.waitForTimeout(250);
R.contAsk=await ev(()=>({h2:document.querySelector('#startM h2')?.textContent, opts:[...document.querySelectorAll('#startM .smg button')].map(b=>b.textContent.trim()), back:!!document.querySelector('#startM .smBack')}));
if(!R.contAsk.back) R.bugs.push('Continents ask missing Back');
if(!/continent/i.test(R.contAsk.h2||'')) R.bugs.push('Continents ask wrong: '+JSON.stringify(R.contAsk));
await page.click('#startM .smBack');
await page.waitForTimeout(150);

await pickMode('prov');
await page.click('#smNew');
await page.waitForTimeout(250);
R.provAsk=await ev(()=>({h2:document.querySelector('#startM h2')?.textContent, opts:[...document.querySelectorAll('#startM .smg button')].map(b=>b.textContent.trim()), back:!!document.querySelector('#startM .smBack')}));
if(!R.provAsk.back) R.bugs.push('Provinces ask missing Back');
if(!/Provinces/i.test(R.provAsk.h2||'')) R.bugs.push('Provinces ask wrong: '+JSON.stringify(R.provAsk));
await page.click('#startM .smBack');
await page.waitForTimeout(100);

await pickMode('cont');
await page.click('#smNew');
await page.waitForTimeout(200);
await page.click('#startM .smg button:text-is("Europe")');
await page.waitForTimeout(2800);
R.afterStart=await ev(()=>({mode:__game.mode,set:document.getElementById('set').value,n:__game.pieces.length,mach:!document.getElementById('machines').hidden,pouch:!document.getElementById('pouchWrap').hidden,coins:__game.coins}));
if(!R.afterStart.mach) R.bugs.push('machines still hidden after startGame');
if(!R.afterStart.pouch) R.bugs.push('pouch still hidden after startGame');
if(R.afterStart.set!=='Europe') R.bugs.push('expected Europe set got '+R.afterStart.set);

// Hints collapse
await page.click('#hintsToggle');
await page.waitForTimeout(150);
R.hintsCollapsed=await ev(()=>hints.classList.contains('collapsed'));
await page.click('#hintsToggle');
await page.waitForTimeout(100);
if(!R.hintsCollapsed) R.bugs.push('hints did not collapse');

// ===== Anchor + neighbours + coins =====
await ev(()=>__game.place('France'));
await page.waitForTimeout(700);
await page.waitForTimeout(2500);
await ev(()=>__game.dismissCard());
await page.waitForTimeout(500);
R.coinsBurst=await ev(()=>({free:__game.freeCoins, coins:__game.coins, pouch:coinCount.textContent}));
const coinPts=await ev(()=>[...document.querySelectorAll('.coinFly')].map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}));
for(const pt of coinPts){ await page.mouse.move(pt.x,pt.y,{steps:6}); await page.waitForTimeout(80); }
await page.mouse.move(240,220,{steps:12});
await page.waitForTimeout(900);
R.coinsMagnet=await ev(()=>{
  const left=__game.freeCoins; if(left) __game.collectAllCoins();
  return {coins:__game.coins, free:__game.freeCoins, pouch:coinCount.textContent, usedMagnet:!left};
});
if(R.coinsBurst.free<1 && R.coinsBurst.coins<1) R.bugs.push('no coin burst on place');
if(R.coinsMagnet.coins<1) R.bugs.push('coin collect failed');
await shot('coins');

await ev(()=>{__game.place('Spain');});
await page.waitForTimeout(500);
await page.waitForTimeout(2500);
await ev(()=>{__game.dismissCard(); if(__game.freeCoins)__game.collectAllCoins();});

// ===== not enough coins =====
await ev(()=>__game.setCoins(2));
R.broke=await ev(async()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Portugal'&&!__game.placed.has(q.f.name));
  const ok=await __game.beginMachineRun('find',piece);
  return {ok,coins:__game.coins,msg:(document.getElementById('msg').textContent||'')};
});
if(R.broke.ok) R.bugs.push('Finderator ran with only 2 coins');
if(!/not enough|need|coin/i.test(R.broke.msg)) R.notes.push('broke msg: '+R.broke.msg);

// ===== each machine =====
await ev(()=>__game.setCoins(40));
async function mach(kind,name){
  return ev(async({kind,name})=>{
    const piece=__game.pieces.find(q=>q.f.name===name&&!__game.placed.has(name)&&!q.space&&!q.onBelt);
    if(!piece) return {err:'missing '+name};
    const el=document.querySelector(`#machines .mach[data-id="${kind}"]`);
    el.classList.add('near');
    const beltBefore=el.querySelector('.inBelt').getBoundingClientRect().width;
    const t0=performance.now();
    const ok=await __game.beginMachineRun(kind,piece);
    const beltAfter=el.querySelector('.inBelt').getBoundingClientRect().width;
    // during run belt extends; after may retract — capture max via class
    return {ok,dt:performance.now()-t0,coins:__game.coins,space:!!piece.space,mode:piece.space?.mode,s:piece.s,angle:piece.angle,finder:!!piece.finder,beltBefore,beltAfter,busyWas:el.classList.contains('busy'),name};
  },{kind,name});
}
// Observe belt extend mid-run for Sizeinator
R.sizeBelt=await (async()=>{
  await ev(()=>{
    const piece=__game.pieces.find(q=>q.f.name==='Portugal'&&!__game.placed.has('Portugal'));
    window.__szP=piece;
    window.__szProm=__game.beginMachineRun('size',piece);
  });
  let maxW=0;
  for(let i=0;i<40;i++){
    const w=await ev(()=>document.querySelector('#machines .mach[data-id="size"] .inBelt')?.getBoundingClientRect().width||0);
    if(w>maxW) maxW=w;
    await page.waitForTimeout(60);
  }
  await ev(async()=>{try{await window.__szProm}catch(e){}});
  await page.waitForTimeout(300);
  return ev((maxW)=>{
    const p=window.__szP;
    return {maxW,space:!!p.space,mode:p.space?.mode,s:p.s,dtOk:true};
  }, maxW);
})();
await shot('mach-size');
if(R.sizeBelt.maxW<40) R.bugs.push('Sizeinator belt did not extend (maxW='+R.sizeBelt.maxW+')');
if(!R.sizeBelt.space) R.bugs.push('Sizeinator did not float after push-out');
if(R.sizeBelt.s!==1) R.bugs.push('Sizeinator did not set s=1');

R.orient=await mach('orient','Italy');
R.find=await mach('find','Germany');
await shot('mach-find');
for(const [k,r] of [['orient',R.orient],['find',R.find]]){
  if(r.err) R.bugs.push(k+':'+r.err);
  else {
    if(!r.ok) R.bugs.push(k+' failed');
    if(!r.space) R.bugs.push(k+' did not float after push-out');
    if(r.dt<1800) R.bugs.push(k+' process too fast '+r.dt.toFixed(0)+'ms');
  }
}
if(R.orient && R.orient.angle!==0) R.bugs.push('Orientationator angle='+R.orient.angle);
if(R.find && !R.find.finder) R.bugs.push('Finderator no meter');

// ===== grab during push with real mouse =====
R.grab=await (async()=>{
  await ev(()=>__game.setCoins(20));
  await ev(()=>{
    window.__grabTest={};
    const piece=__game.pieces.find(q=>q.f.name==='Poland'&&!__game.placed.has('Poland')&&!q.space);
    window.__grabTest.piece=piece;
    window.__grabTest.prom=__game.beginMachineRun('size',piece);
  });
  let grabbed=false;
  for(let i=0;i<110;i++){
    const box=await ev(()=>{
      const ride=document.querySelector('.ride.grabOK');
      if(!ride) return null;
      const r=ride.getBoundingClientRect();
      return {x:r.left+r.width/2,y:r.top+r.height/2};
    });
    if(box){
      await page.mouse.move(box.x,box.y,{steps:3});
      await page.mouse.down();
      await page.mouse.move(box.x-90, box.y-20,{steps:10});
      await page.mouse.up();
      grabbed=true; break;
    }
    await page.waitForTimeout(60);
  }
  await ev(async()=>{try{await window.__grabTest.prom}catch(e){}});
  await page.waitForTimeout(400);
  return ev((grabbed)=>{
    const piece=window.__grabTest.piece;
    return {grabbed, space:!!piece?.space, body:!!piece?.body, parked:!!piece?.parked, onBelt:piece?.onBelt};
  }, grabbed);
})();
if(!R.grab.grabbed) R.notes.push('grab-during-push missed grabOK (timing)');

// Ensure fact card is not blocking the stage
await ev(()=>__game.dismissCard());

// ===== float drag onto globe (real mouse) =====
R.floatToGlobe=await (async()=>{
  await ev(()=>{
    const piece=__game.pieces.find(q=>q.f.name==='Belgium'&&!__game.placed.has('Belgium'));
    __game.remSpace(piece);
    __game.addSpace(piece,500,200,0,0,'float');
    window.__bel=piece;
  });
  await page.waitForTimeout(80);
  const from=await ev(()=>{const s=window.__bel.space;const r=s.el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  const to=await ev(()=>{const f=__game.feat('Belgium');const [x,y]=G3.project(f.c[0],f.c[1]);return{x,y,facing:G3.facing(f.c[0],f.c[1])}});
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  // move immediately past 8px so hold-to-orbit does not fire
  await page.mouse.move(from.x+30,from.y+12,{steps:3});
  await page.mouse.move(to.x,to.y,{steps:20});
  await page.mouse.up();
  await page.waitForTimeout(700);
  return ev(()=>{
    const piece=window.__bel;
    return {placed:__game.placed.has('Belgium'),parked:!!piece.parked,space:!!piece.space,body:!!piece.body,facing:true};
  });
})();
if(!R.floatToGlobe.placed && !R.floatToGlobe.parked)
  R.bugs.push('drag float→globe failed: '+JSON.stringify(R.floatToGlobe));

// ===== empty space placement =====
R.empty=await ev(()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Austria'&&!__game.placed.has('Austria'));
  __game.remSpace(piece);
  const r=G3.dom.getBoundingClientRect();
  let spot=null;
  for(let x=r.left+40;x<r.right-40 && !spot;x+=28)
    for(let y=r.top+40;y<r.bottom-40;y+=28){
      if(G3.pick(x,y)) continue;
      if(__game.isUiBlocked(x,y)) continue;
      spot={x,y}; break;
    }
  if(!spot) return {err:'no empty spot',space:false};
  window.__release(piece,spot.x,spot.y,12,-4);
  return {x:spot.x,y:spot.y,pick:!!G3.pick(spot.x,spot.y),ui:__game.isUiBlocked(spot.x,spot.y),space:!!piece.space,mode:piece.space?.mode};
});
if(!R.empty.space) R.bugs.push('empty space release did not float: '+JSON.stringify(R.empty));

// ===== orbit by hold (real mouse) =====
R.orbitHold=await (async()=>{
  const pt=await ev(()=>{
    let piece=__game.pieces.find(q=>q.f.name==='Hungary'&&!__game.placed.has('Hungary'));
    __game.remSpace(piece);
    __game.addSpace(piece,640,280,0,0,'float');
    window.__orbP=piece;
    return {x:piece.space.x,y:piece.space.y,n:piece.f.name};
  });
  await page.mouse.move(pt.x,pt.y);
  await page.mouse.down();
  await page.waitForTimeout(750);
  await page.mouse.up();
  await page.waitForTimeout(300);
  return ev(()=>{
    const piece=window.__orbP;
    const sr=G3.screenRadius();
    return {n:piece.f.name,mode:piece.space?.mode,r:piece.space?.r,sr,ok:piece.space?.mode==='orbit'};
  });
})();
if(!R.orbitHold.ok) R.bugs.push('hold-to-orbit failed: '+JSON.stringify(R.orbitHold));

// ===== orbit throw + clamp =====
R.orbitThrow=await ev(()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Netherlands'&&!__game.placed.has('Netherlands'));
  __game.remSpace(piece);
  const r=G3.dom.getBoundingClientRect();
  let spot=null;
  for(let x=r.left+50;x<r.right-50 && !spot;x+=28)
    for(let y=r.top+50;y<r.bottom-50;y+=28){
      if(G3.pick(x,y)||__game.isUiBlocked(x,y)) continue;
      spot={x,y}; break;
    }
  if(!spot) return {err:'no spot'};
  window.__release(piece,spot.x,spot.y,1800,-400);
  const sr=G3.screenRadius();
  const s=piece.space;
  return {mode:s?.mode,r:s?.r,sr,min:sr*1.15,max:sr*2.55,
    clamped:!!s && s.mode==='orbit' && s.r>=sr*1.15-2 && s.r<=sr*2.55+2};
});
if(!R.orbitThrow.clamped) R.bugs.push('throw orbit/clamp failed: '+JSON.stringify(R.orbitThrow));

// ===== UI: release over hints should NOT float on UI =====
R.overUI=await ev(()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Switzerland'&&!__game.placed.has('Switzerland'));
  __game.remSpace(piece);
  const hr=hints.getBoundingClientRect();
  const x=hr.left+hr.width/2, y=hr.top+hr.height/2;
  window.__release(piece,x,y,0,0);
  return {space:!!piece.space,body:!!piece.body,dloc:piece.dloc,ui:__game.isUiBlocked(x,y)};
});
if(R.overUI.space) R.bugs.push('piece floated over hints UI');

await shot('space-orbit');

// ===== save/load v5 =====
R.save=await ev(()=>{
  const S=__game.snapshot();
  __game.saveGame();
  return {v:S.v, spaces:S.pieces.filter(q=>q.st==='space').map(q=>({n:q.n,smode:q.smode,r:q.sr})), coins:S.coins, placed:S.placed};
});
if(R.save.v!==5) R.bugs.push('snapshot v!='+R.save.v);
if(R.save.spaces.length<1) R.bugs.push('save missing space pieces');

await boot();
await ev(async()=>{const S=__game.readSave(); if(!S) throw new Error('no save'); await __game.loadGame(S);});
await page.waitForTimeout(2500);
R.load=await ev(()=>{
  const spaces=__game.pieces.filter(q=>q.space).map(q=>({n:q.f.name,mode:q.space.mode,r:q.space.r}));
  return {coins:__game.coins, placed:[...__game.placed], spaces, mach:!document.getElementById('machines').hidden, pouch:!document.getElementById('pouchWrap').hidden, v:__game.snapshot().v};
});
if(R.load.spaces.length<1) R.bugs.push('load lost floating/orbiting pieces');
if(!R.load.mach) R.bugs.push('machines hidden after load');
const savedOrbit=R.save.spaces.filter(s=>s.smode==='orbit').map(s=>s.n).sort().join();
const loadedOrbit=R.load.spaces.filter(s=>s.mode==='orbit').map(s=>s.n).sort().join();
if(savedOrbit && savedOrbit!==loadedOrbit) R.bugs.push('orbit set mismatch save='+savedOrbit+' load='+loadedOrbit);

// ===== Provinces + overseas finder =====
await ev(async()=>{await __game.startGame('prov','starter');});
await page.waitForTimeout(2800);
R.provFr=await ev(async()=>{
  const fr=__game.pieces.find(q=>q.f.name==='France');
  if(!fr) return {err:'no France in starter prov'};
  __game.place('France');
  await new Promise(r=>setTimeout(r,400));
  if(!card.hidden) cOk.click();
  await new Promise(r=>setTimeout(r,600));
  const box=document.getElementById('provBox');
  const meters=[...document.querySelectorAll('#provBox .fmeter, #provBox .ovseas, #provBox [class*="meter"]')].map(e=>({cls:e.className,t:e.textContent}));
  const ov=__game.provOverseas?__game.provOverseas('France'):null;
  // Finderator on an overseas province piece if any
  let overseasMeter=null;
  if(ov && ov.length){
    const pf=ov[0];
    // look for finder badge / meter after enabling
  }
  return {provOpen:[...__game.provOpen], box:box&&!box.hidden, meters, overseas:ov&&ov.length, leftCount:(__game.provLeft&&__game.provLeft('France')||[]).length};
});
if(R.provFr.err) R.bugs.push(R.provFr.err);
await shot('prov');

// Overseas Finderator meter: start find machine on overseas piece if available
R.overseas=await ev(async()=>{
  const ov=__game.provOverseas('France')||[];
  if(!ov.length) return {skip:true};
  __game.setCoins(20);
  // find a province feature that's overseas — pieces may be named differently
  // try beginMachineRun find on first drawer province related
  const names=ov.map(f=>f.name||f.properties?.name).filter(Boolean);
  return {overseasNames:names.slice(0,5), count:ov.length};
});

// ===== perf =====
R.perf=await ev(async()=>{
  const loose=__game.pieces.filter(q=>!__game.placed.has(q.f.name)).slice(0,4);
  loose.forEach((q,i)=>{__game.addSpace(q,400+i*70,280,15,-8,'float'); if(i)__game.enterOrbit(q);});
  const ts=[]; let last=performance.now();
  await new Promise(res=>{let n=0; function f(t){ts.push(t-last);last=t; if(++n<60)requestAnimationFrame(f); else res();} requestAnimationFrame(f);});
  const avg=ts.reduce((a,b)=>a+b,0)/ts.length, max=Math.max(...ts);
  return {avg:+avg.toFixed(2),max:+max.toFixed(2),stutter:max>52};
});
if(R.perf.stutter) R.notes.push('frame stutter max='+R.perf.max);

await shot('final');
R.errs=errs;
if(errs.length) R.bugs.push('pageerrors:'+errs.join('|'));
writeFileSync('/tmp/pt5-result.json',JSON.stringify(R,null,2));
console.log(JSON.stringify(R,null,2));

const py=`from PIL import Image, ImageDraw, ImageFont
import os
files=[('coins','Coins + pouch'),('mach-size','Sizeinator → zero-G'),('mach-find','Finderator'),('space-orbit','Float / orbit / UI'),('prov','Provinces'),('final','After load / play')]
W,H=860,460
exist=[(n,l) for n,l in files if os.path.exists('${OUT}/_pt5_%s.png'%n)]
canvas=Image.new('RGB',(W,(H+28)*len(exist)+4),(7,16,30))
draw=ImageDraw.Draw(canvas)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
except:font=ImageFont.load_default()
for i,(n,lab) in enumerate(exist):
  im=Image.open('${OUT}/_pt5_%s.png'%n).convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
  y=i*(H+28)
  draw.rectangle((0,y,W,y+28),fill=(13,26,44))
  draw.text((12,y+6),lab,fill=(232,238,243),font=font)
  canvas.paste(im,(0,y+28))
canvas.save('${OUT}/playtest-v5.jpg',quality=88)
print('wrote',len(exist),'panels')
`
console.log(spawnSync('python3',['-c',py],{encoding:'utf8'}).stdout);
await b.close();
console.log(R.bugs.length?'BUGS:'+R.bugs.join(' || '):'NO_BUGS');
process.exit(R.bugs.length?1:0);
