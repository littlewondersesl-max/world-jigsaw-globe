import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
import {spawnSync} from 'child_process';
import {mkdirSync} from 'fs';

const OUT='/workspace/world-jigsaw/previews/compare';
mkdirSync(OUT,{recursive:true});
const chrome='/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const b=await chromium.launch({executablePath:chrome,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:1280,height:800}});
const bugs=[];
page.on('pageerror',e=>bugs.push(String(e)));

await page.goto('http://localhost:8944/?play&_='+Date.now(),{waitUntil:'domcontentloaded'});
await page.waitForFunction('window.__ready && window.__game && window.G3',null,{timeout:120000});
await page.mouse.move(10,10);

const info=await page.evaluate(()=>{
  const n=['Spain','France','Italy'].find(x=>__game.pieces.some(p=>p.f.name===x))||__game.pieces[0].f.name;
  __game.place(n);
  const f=__game.feat(n); const [x,y]=G3.project(f.c[0],f.c[1]);
  return {n,x,y,tree:__game.coinTreePx(),R:G3.screenRadius()};
});
console.log('placed',info);

// Wait until coins are hovering (spin class)
let hovered=null;
for(let i=0;i<60;i++){
  await page.waitForTimeout(50);
  hovered=await page.evaluate((surfY)=>{
    const els=[...document.querySelectorAll('.coinFly.spin')];
    if(els.length<2) return null;
    const lifts=els.map(e=>{const r=e.getBoundingClientRect();return surfY-(r.top+r.height/2);});
    return {
      n:els.length,
      meanLift:lifts.reduce((a,b)=>a+b,0)/lifts.length,
      maxLift:Math.max(...lifts),
      minLift:Math.min(...lifts),
      tree:__game.coinTreePx(),
      spinBg:getComputedStyle(els[0]).backgroundImage,
    };
  }, info.y);
  if(hovered) break;
}
console.log('hover',hovered);
await page.mouse.move(5,5);
await page.waitForTimeout(100);

if(!hovered) bugs.push('coins never reached hover/spin');
else {
  const expect=hovered.tree*2;
  if(hovered.meanLift>expect*1.45) bugs.push(`hover too high: ${hovered.meanLift.toFixed(1)} vs ~${expect.toFixed(1)}`);
  if(hovered.meanLift<expect*0.7) bugs.push(`hover too low: ${hovered.meanLift.toFixed(1)} vs ~${expect.toFixed(1)}`);
  if(!/coin-spin/.test(hovered.spinBg||'')) bugs.push('not using coin-spin sheet');
}

const box=await page.evaluate((surf)=>{
  const els=[...document.querySelectorAll('.coinFly')];
  const xs=[],ys=[];
  for(const e of els){const r=e.getBoundingClientRect();xs.push(r.left+r.width/2);ys.push(r.top+r.height/2);}
  xs.push(surf.x); ys.push(surf.y);
  const pad=110;
  const x=Math.max(0,Math.min(...xs)-pad);
  const y=Math.max(0,Math.min(...ys)-pad);
  return {x,y,width:Math.min(1280-x,Math.max(...xs)+pad-x),height:Math.min(800-y,Math.max(...ys)+pad-y)};
}, info);
await page.screenshot({path:`${OUT}/_coins_hover.png`,clip:box});

const py=spawnSync('python3',['-'],{input:`
from PIL import Image, ImageDraw
hover=Image.open('${OUT}/_coins_hover.png').convert('RGB')
strip=Image.open('/workspace/world-jigsaw/img/coin-spin.png').convert('RGBA')
coin=Image.open('/workspace/world-jigsaw/img/coin.png').convert('RGBA')
pouch=Image.open('/workspace/world-jigsaw/img/pouch.png').convert('RGBA')
W,H=1100,520
canvas=Image.new('RGB',(W,H),(12,22,38))
hh=Image.new('RGB',(520,400),(8,16,28))
s=min(520/hover.size[0],400/hover.size[1])
hr=hover.resize((max(1,int(hover.size[0]*s)),max(1,int(hover.size[1]*s))))
hh.paste(hr,((520-hr.size[0])//2,(400-hr.size[1])//2))
canvas.paste(hh,(20,40))
ss=strip.resize((strip.size[0]*2,strip.size[1]*2),Image.Resampling.NEAREST)
panel=Image.new('RGBA',(520,400),(20,32,50,255))
panel.paste(ss,((520-ss.size[0])//2,50),ss)
c2=coin.resize((96,96),Image.Resampling.LANCZOS)
p2=pouch.resize((96,96),Image.Resampling.LANCZOS)
panel.paste(c2,(120,260),c2)
panel.paste(p2,(300,260),p2)
canvas.paste(panel.convert('RGB'),(560,40))
d=ImageDraw.Draw(canvas)
d.text((20,12),'Coins near treetops (hover ≈ 2× canopy)',fill=(230,236,245))
d.text((560,12),'Rotation strip · front · pouch',fill=(230,236,245))
canvas.save('${OUT}/coins-v2.jpg',quality=88)
print('wrote', canvas.size)
`,encoding:'utf8'});
console.log(py.stdout); if(py.status){console.error(py.stderr); bugs.push('sheet failed');}

await b.close();
if(bugs.length){console.error('BUGS:\n'+bugs.map(x=>'- '+x).join('\n')); process.exit(1);}
console.log('NO_BUGS');
