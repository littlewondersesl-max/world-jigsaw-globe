import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
import {createWriteStream,readFileSync,writeFileSync,mkdirSync} from 'fs';
import {spawnSync} from 'child_process';

const U='http://localhost:8944/?play';
const OUT='/workspace/world-jigsaw/previews/compare';
mkdirSync(OUT,{recursive:true});
const chrome='/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const b=await chromium.launch({executablePath:chrome,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

function overlap(a,b){
  return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);
}
function area(r){return Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top)}

async function measure(page){
  return page.evaluate(()=>{
    const box=el=>{if(!el||el.hidden||getComputedStyle(el).display==='none')return null;
      const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return null;
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
    const ids=['stack','zoom','machines','hints','scr','provBox','topbar','menuW','msg'];
    const map={};
    for(const id of ids){const el=document.getElementById(id);map[id]=box(el)}
    // also each machine
    map.machEls=[...document.querySelectorAll('#machines .mach')].map(el=>{
      const r=el.getBoundingClientRect();
      return {id:el.dataset.id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:r.width,h:r.height};
    });
    map.hintsCollapsed=document.getElementById('hints').classList.contains('collapsed');
    map.machinesInHints=!!document.getElementById('hints')?.contains(document.getElementById('machines'));
    map.machParent=document.getElementById('machines')?.parentElement?.id||null;
    return map;
  });
}

function findOverlaps(m){
  const bad=[];
  const machines=m.machines;
  if(!machines){bad.push('machines missing');return bad}
  // machines must not overlap stack or zoom (the original problem)
  for(const other of ['stack','zoom','scr','provBox']){
    if(!m[other])continue;
    if(overlap(machines,m[other]))bad.push(`machines∩${other}`);
  }
  // each mach must be inside hints
  if(m.hints){
    for(const el of m.machEls){
      if(el.left<m.hints.left-1||el.right>m.hints.right+1||el.top<m.hints.top-1||el.bottom>m.hints.bottom+1)
        bad.push(`mach ${el.id} outside hints`);
    }
  }
  // machEls shouldn't overlap each other much
  for(let i=0;i<m.machEls.length;i++)for(let j=i+1;j<m.machEls.length;j++){
    const a=m.machEls[i],b=m.machEls[j];
    if(overlap(a,b)){
      const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left);
      const oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if(ox*oy>4)bad.push(`mach ${a.id}∩${b.id}`);
    }
  }
  return bad;
}

const R={viewports:{},drop:{},toggle:{}};
const shots={};

async function boot(vp){
  const ctx=await b.newContext({viewport:vp});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(U,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction('window.__ready',null,{timeout:240000});
  // clear hints preference then reload state via set
  await p.evaluate(()=>{try{localStorage.removeItem('worldJigsaw.hintsOpen')}catch(e){}});
  // start Continents Europe via start menu (or ?play may skip)
  const hasStart=await p.evaluate(()=>!document.getElementById('startM')?.hidden);
  if(hasStart){
    // pick continents / global and start
    await p.evaluate(()=>{
      // try quick start: click Continents path if present
      const sm=document.getElementById('startM');
      const btns=[...sm.querySelectorAll('button')];
      const cont=btns.find(b=>/Continent/i.test(b.textContent));
      if(cont)cont.click();
    });
    await p.waitForTimeout(200);
    await p.evaluate(()=>{
      const sm=document.getElementById('startM');
      const btns=[...sm.querySelectorAll('button')];
      const eu=btns.find(b=>b.textContent.trim()==='Europe');
      if(eu)eu.click();
      else{
        const any=btns.find(b=>/Start|Play|New/i.test(b.textContent));
        if(any)any.click();
      }
    });
    await p.waitForTimeout(2500);
  }
  // ensure game running and machines visible
  const vis=await p.evaluate(()=>{
    if(window.__game?.startGame && document.getElementById('machines')?.hidden){
      // force start continents europe
      return 'need-start';
    }
    return !document.getElementById('machines')?.hidden;
  });
  if(vis==='need-start' || vis===false){
    await p.evaluate(async()=>{
      if(window.__game?.startGame)await window.__game.startGame('countries','Europe');
    });
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(800);
  return {ctx,p,errs};
}

// --- viewport overlap checks ---
for(const vp of [{width:1280,height:800,k:'1280x800'},{width:1920,height:1080,k:'1920x1080'},{width:900,height:800,k:'900w'}]){
  const {ctx,p,errs}=await boot(vp);
  // open state
  await p.evaluate(()=>{document.getElementById('hintsToggle').click();}); // may toggle; force open
  await p.evaluate(()=>{
    const open=true;
    const hints=document.getElementById('hints');
    hints.classList.toggle('collapsed',!open);
    document.getElementById('hintsToggle').setAttribute('aria-expanded','true');
    document.getElementById('hintsToggle').textContent='▾';
  });
  await p.waitForTimeout(200);
  const openM=await measure(p);
  const openBad=findOverlaps(openM);
  if(vp.k==='1280x800'){
    shots.open=OUT+'/_mach_open.png';
    shots.closed=OUT+'/_mach_closed.png';
    await p.screenshot({path:shots.open});
  }
  // collapsed
  await p.click('#hintsToggle');
  await p.waitForTimeout(200);
  const closedM=await measure(p);
  const closedBad=findOverlaps(closedM);
  if(vp.k==='1280x800'){
    await p.screenshot({path:shots.closed});
  }
  // remember state: set closed, reload mid-game hard — check localStorage
  const stored=await p.evaluate(()=>localStorage.getItem('worldJigsaw.hintsOpen'));
  R.viewports[vp.k]={open:openM,closed:closedM,openBad,closedBad,stored,errs,machinesInHints:openM.machinesInHints,machParent:openM.machParent};
  if(vp.k==='1280x800'){

    // drop test: runMachine via coords
    const drop=await p.evaluate(()=>{
      const pieces=window.__game?.pieces||[];
      const p0=pieces.find(q=>!window.__game.placed.has(q.f.name)&&!q.parked);
      if(!p0)return {err:'no piece'};
      // ensure piece is held-capable: put in left drawer body if needed
      const sizeEl=document.querySelector('#machines .mach[data-id=size]');
      const r=sizeEl.getBoundingClientRect();
      const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
      const before=p0.s;
      const hit=window.__game.machineAt(x,y);
      window.__game.runMachine('size',p0);
      return {hit,before,after:p0.s,ok:p0.s===1,cx:x,cy:y,machR:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}};
    });
    R.drop=drop;

    // toggle remember
    await p.evaluate(()=>{
      // force closed and set storage
      const hints=document.getElementById('hints');
      hints.classList.add('collapsed');
      localStorage.setItem('worldJigsaw.hintsOpen','0');
    });
    await p.reload({waitUntil:'domcontentloaded'});
    await p.waitForFunction('window.__ready',null,{timeout:240000});
    await p.waitForTimeout(500);
    // after reload start menu may show; start again
    const need=await p.evaluate(()=>!document.getElementById('startM')?.hidden);
    if(need){
      await p.evaluate(async()=>{if(window.__game?.startGame)await window.__game.startGame('countries','Europe')});
      await p.waitForTimeout(1500);
    }
    const afterReload=await p.evaluate(()=>({
      collapsed:document.getElementById('hints').classList.contains('collapsed'),
      stored:localStorage.getItem('worldJigsaw.hintsOpen'),
      aria:document.getElementById('hintsToggle').getAttribute('aria-expanded'),
    }));
    R.toggle=afterReload;
  }
  await ctx.close();
}

// composite via PIL
const py=`from PIL import Image, ImageDraw, ImageFont
open_p=r'${shots.open}'
closed_p=r'${shots.closed}'
out=r'${OUT}/machines-v2.jpg'
W,H=960,540
def fit(path):
  im=Image.open(path).convert('RGB')
  im=im.resize((W,H),Image.Resampling.LANCZOS)
  return im
o,c=fit(open_p),fit(closed_p)
canvas=Image.new('RGB',(W,H*2+56),(7,16,30))
draw=ImageDraw.Draw(canvas)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
except:font=ImageFont.load_default()
draw.rectangle((0,0,W,28),fill=(13,26,44))
draw.text((12,6),'Hints OPEN — machines in the blue panel',fill=(232,238,243),font=font)
canvas.paste(o,(0,28))
draw.rectangle((0,H+28,W,H+56),fill=(13,26,44))
draw.text((12,H+34),'Hints CLOSED — compact strip; machines still droppable',fill=(232,238,243),font=font)
canvas.paste(c,(0,H+56))
canvas.save(out,quality=88)
print('wrote',out)`
const r=spawnSync('python3',['-c',py],{encoding:'utf8'});
R.composite=r.status===0?'pil':('fail:'+r.stderr+r.stdout);
if(r.status===0)console.log(r.stdout.trim());

await b.close();
console.log(JSON.stringify(R,null,2));
const fail=[];
for(const [k,v] of Object.entries(R.viewports)){
  if(v.openBad.length)fail.push(k+' open:'+v.openBad.join(','));
  if(v.closedBad.length)fail.push(k+' closed:'+v.closedBad.join(','));
  const ch=v.closed?.hints?.h||0; if(ch>220)fail.push(k+' collapsed-too-tall:'+ch);
  const oh=v.open?.hints?.h||0; if(oh<400)fail.push(k+' open-too-short:'+oh);
  // machines near bottom when open
  const mb=v.open?.machines?.bottom, hb=v.open?.hints?.bottom;
  if(mb!=null&&hb!=null&&Math.abs(mb-hb)>8)fail.push(k+' machines-not-at-bottom');

  if(!v.machinesInHints)fail.push(k+' not-in-hints');
}
if(!R.drop?.ok)fail.push('drop:'+JSON.stringify(R.drop));
if(R.toggle && R.toggle.collapsed!==true)fail.push('remember:'+JSON.stringify(R.toggle));
if(fail.length){console.error('FAIL',fail);process.exit(1)}
console.log('PASS');
