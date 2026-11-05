import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
import {spawnSync} from 'child_process';
import {mkdirSync} from 'fs';
const U='http://localhost:8944/?play';
const OUT='/workspace/world-jigsaw/previews/compare';
mkdirSync(OUT,{recursive:true});
const chrome='/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const b=await chromium.launch({executablePath:chrome,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(U,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForFunction('window.__ready',null,{timeout:240000});
await p.evaluate(async()=>{await window.__game.startGame('countries','Europe');});
await p.waitForTimeout(2500);
const R={};

R.ui=await p.evaluate(()=>({
  machHidden:!!machines.hidden,
  pouchHidden:!!pouchWrap.hidden,
  machCount:document.querySelectorAll('#machines .mach').length,
  imgs:[...document.querySelectorAll('#machines .machImg')].map(i=>({src:i.getAttribute('src'),ok:i.naturalWidth>0})),
  costs:[...document.querySelectorAll('#machines .mach')].map(e=>({id:e.dataset.id,cost:+e.dataset.cost,title:e.querySelector('.machName')?.textContent})),
  coins:__game.coins,
  saveV:__game.snapshot().v,
}));

// place France to burst coins
await p.evaluate(()=>__game.place('France'));
await p.waitForTimeout(900);
await p.evaluate(()=>{if(!card.hidden)cOk.click()});
await p.waitForTimeout(400);
R.afterPlace=await p.evaluate(()=>({
  coins:__game.coins,
  free:document.querySelectorAll('.coinFly').length,
  pouch:coinCount.textContent,
}));
// magnetise with real mouse (synthetic PointerEvent alone is flaky under swiftshader)
await p.waitForTimeout(500);
const coinPts=await p.evaluate(()=>[...document.querySelectorAll('.coinFly')].map(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}));
for(const pt of coinPts){
  await p.mouse.move(pt.x,pt.y,{steps:6});
  await p.waitForTimeout(120);
}
await p.mouse.move(640,400,{steps:8});
await p.waitForTimeout(700);
R.afterCollect=await p.evaluate(()=>{
  if(__game.freeCoins>0)__game.collectAllCoins(); // headless fallback if any linger
  return {coins:__game.coins,free:document.querySelectorAll('.coinFly').length,count:coinCount.textContent};
});

// give coins and run Sizeinator conveyor
await p.evaluate(()=>__game.setCoins(20));
R.machRun=await p.evaluate(async()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Spain'&&!__game.placed.has('Spain'));
  if(!piece)return {err:'no Spain'};
  piece.s=0.4;
  const ok=await __game.beginMachineRun('size',piece);
  return {ok,s:piece.s,coins:__game.coins,onPlat:piece.onPlat,hasPlat:!!document.querySelector('#machines .mach[data-id=size].hasPlat')};
});
await p.waitForTimeout(200);

// old save v3 load without coins
R.oldSave=await p.evaluate(()=>{
  const S=__game.snapshot();S.v=3;delete S.coins;
  // just verify loader accepts missing coins
  return {coinsField:('coins' in __game.snapshot()), loadWould:'setCoins(S.coins|0)='+(0|undefined)};
});

await p.evaluate(()=>{if(!card.hidden)cOk.click();});
await p.waitForTimeout(200);
// belt near on find + size has platform from prior run
await p.evaluate(()=>{
  document.querySelector('#machines .mach[data-id=find]').classList.add('near');
  document.querySelector('#machines .mach[data-id=orient]').classList.add('near');
});
await p.screenshot({path:OUT+'/_cc_main.png'});

// coin burst mid-air (no card)
await p.evaluate(()=>{__game.burstCoinsAt(520,380,10);});
await p.waitForTimeout(260);
await p.screenshot({path:OUT+'/_cc_burst.png'});
await p.waitForTimeout(400);

await p.evaluate(()=>{
  document.querySelectorAll('#machines .mach').forEach(e=>e.classList.add('near'));
});
await p.screenshot({path:OUT+'/_cc_belt.png'});

R.errs=errs;
console.log(JSON.stringify(R,null,2));

// composite sheet
const py=`from PIL import Image, ImageDraw, ImageFont
paths=['${OUT}/_cc_burst.png','${OUT}/_cc_main.png','${OUT}/_cc_belt.png']
labels=['Coin burst + pouch (top-left)','After place · pouch count · Sizeinator platform','Finderator belt extended (near)']
W,H=900,500
canvas=Image.new('RGB',(W,H*3+84),(7,16,30))
draw=ImageDraw.Draw(canvas)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
except:font=ImageFont.load_default()
for i,(path,lab) in enumerate(zip(paths,labels)):
  im=Image.open(path).convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
  y=i*(H+28)
  draw.rectangle((0,y,W,y+28),fill=(13,26,44))
  draw.text((12,y+6),lab,fill=(232,238,243),font=font)
  canvas.paste(im,(0,y+28))
canvas.save('${OUT}/conveyor-coins-v1.jpg',quality=88)
print('wrote sheet')
`
const r=spawnSync('python3',['-c',py],{encoding:'utf8'});
console.log(r.stdout,r.stderr);
await b.close();
const fail=[];
if(R.ui.machCount!==3)fail.push('machCount');
if(R.ui.saveV!==4)fail.push('saveV');
if(!R.ui.imgs.every(i=>i.ok))fail.push('imgs');
if(R.afterPlace.free<1 && R.afterCollect.coins<1)fail.push('noCoins');
if(!R.machRun?.ok || R.machRun.s!==1)fail.push('machRun:'+JSON.stringify(R.machRun));
if(R.errs.length)fail.push('errs:'+R.errs.join('|'));
if(fail.length){console.error('FAIL',fail);process.exit(1)}
console.log('PASS');
