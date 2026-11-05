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
await p.waitForTimeout(2200);
const R={};
R.ui=await p.evaluate(()=>({
  order:[...document.querySelectorAll('#machines .mach')].map(e=>e.dataset.id),
  imgs:[...document.querySelectorAll('#machines .machImg')].map(i=>({src:i.getAttribute('src'),ok:i.naturalWidth>0,w:i.naturalWidth})),
  costs:[...document.querySelectorAll('#machines .mach')].map(e=>({id:e.dataset.id,cost:+e.dataset.cost})),
  saveV:__game.snapshot().v,
  noPlat:!document.querySelector('.machPlat'),
  noOut:!document.querySelector('.outBelt'),
}));
await p.evaluate(()=>__game.setCoins(20));
// machine run → push out → float
R.mach=await p.evaluate(async()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Spain'&&!__game.placed.has('Spain'));
  if(!piece)return {err:'no Spain'};
  const ok=await __game.beginMachineRun('size',piece);
  return {ok,s:piece.s,coins:__game.coins,space:!!piece.space,mode:piece.space&&piece.space.mode,onBelt:piece.onBelt};
});
await p.waitForTimeout(200);
await p.evaluate(()=>{document.querySelectorAll('#machines .mach').forEach(e=>e.classList.add('near'));});
await p.screenshot({path:OUT+'/_td_mach.png'});

// mid push shot: restart a short visual by forcing ride state is hard; show float + orbit
R.float=await p.evaluate(()=>{
  const a=__game.pieces.find(q=>q.f.name==='Portugal'&&!__game.placed.has('Portugal'));
  const b=__game.pieces.find(q=>q.f.name==='Italy'&&!__game.placed.has('Italy'));
  if(a.body){/*ok*/}
  __game.addSpace(a,420,280,30,-10,'float');
  __game.addSpace(b,780,360,-20,15,'float');
  __game.enterOrbit(b);
  return {a:!!a.space,b:b.space&&b.space.mode,snap:__game.snapshot().pieces.filter(q=>q.st==='space').map(q=>({n:q.n,smode:q.smode}))};
});
await p.waitForTimeout(400);
await p.screenshot({path:OUT+'/_td_space.png'});

// push-out mid frame: run orient and screenshot during push
R.push=await p.evaluate(async()=>{
  __game.setCoins(20);
  const piece=__game.pieces.find(q=>q.f.name==='Germany'&&!__game.placed.has('Germany')&&!q.space);
  if(!piece)return {err:'no Germany'};
  // kick run without awaiting full finish — race screenshot
  const prom=__game.beginMachineRun('orient',piece);
  return {started:true,name:piece.f.name,_p:true};
});
await p.waitForTimeout(2800); // into processing / start of push
await p.screenshot({path:OUT+'/_td_push.png'});
await p.waitForTimeout(2200); // finish push
R.afterPush=await p.evaluate(()=>{
  const piece=__game.pieces.find(q=>q.f.name==='Germany');
  return {space:!!piece.space,angle:piece.angle,busy:[...document.querySelectorAll('#machines .mach.busy')].map(e=>e.dataset.id)};
});

R.errs=errs;
console.log(JSON.stringify(R,null,2));

const py=`from PIL import Image, ImageDraw, ImageFont
paths=['${OUT}/_td_mach.png','${OUT}/_td_push.png','${OUT}/_td_space.png']
labels=['Top-down machines (belt left) + pouch','Piece pushed back out of mouth','Floating + orbiting pieces in zero-G']
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
canvas.save('${OUT}/conveyor-topdown-v2.jpg',quality=88)
print('wrote sheet')
`
const r=spawnSync('python3',['-c',py],{encoding:'utf8'});
console.log(r.stdout,r.stderr);
await b.close();
const fail=[];
if(R.ui.order.join()!=='find,size,orient')fail.push('order:'+R.ui.order);
if(R.ui.saveV!==5)fail.push('saveV');
if(!R.ui.imgs.every(i=>i.ok))fail.push('imgs');
if(R.ui.noPlat!==true)fail.push('plat');
if(!R.mach?.ok||R.mach.s!==1)fail.push('mach:'+JSON.stringify(R.mach));
if(!R.mach?.space)fail.push('noFloatAfterMach');
if(!R.float?.b||R.float.b!=='orbit')fail.push('orbit');
if(R.errs.length)fail.push('errs:'+R.errs.join('|'));
if(fail.length){console.error('FAIL',fail);process.exit(1)}
console.log('PASS');
