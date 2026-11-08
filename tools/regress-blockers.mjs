// Focused regressions for the four review blockers. Run: node tools/regress-blockers.mjs
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {mkdirSync} from 'node:fs';
const candidates=[
  '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs',
  '/workspace/four-corners-src/node_modules/playwright/index.mjs'
];
let chromium;
for(const c of candidates){if(existsSync(c)){({chromium}=await import(pathToFileURL(c).href));break;}}
if(!chromium) ({chromium}=await import('playwright'));
const chrome=existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':undefined;
const OUT='/opt/cursor/artifacts';
mkdirSync(OUT,{recursive:true});
const bad=[];
const browser=await chromium.launch({headless:true, executablePath:chrome, args:['--disable-gpu','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://127.0.0.1:8765/?play',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>window.__ready&&window.G3&&window.G3.pc.has,{timeout:30000});
await page.evaluate(()=>__game.startGame('countries','Europe'));
await page.waitForTimeout(400);

const overlapFn=`(function(box){
  if(!box||!box.anyVis||!isFinite(box.minX)) return false;
  const m=14;
  if(box.minX<m||box.minY<m||box.maxX>innerWidth-m||box.maxY>innerHeight-m) return true;
  const rects=[];
  for(const s of ['header','#tubeBar','#hudCol','#stack','#zoom','#pouchWrap','#menuW','#provBox','#scr']){
    const el=document.querySelector(s); if(!el||el.hidden) continue;
    const r=el.getBoundingClientRect(); if(r.width>2&&r.height>2) rects.push(r);
  }
  if(__game.DR.R.open>1) rects.push(__game.DR.R.el.getBoundingClientRect());
  if(__game.DR.L.open>1) rects.push(__game.DR.L.el.getBoundingClientRect());
  for(const r of rects) if(box.maxX>r.left-m&&box.minX<r.right+m&&box.maxY>r.top-m&&box.minY<r.bottom+m) return true;
  return false;
})`;

// 1. park -> lift -> throw, mesh must come back
const life=await page.evaluate(async ()=>{
  const p=__game.pieces.find(q=>q.f.name==='Spain');
  __game.park('Spain',-4,40,1,30);
  const parkedPid=p.pid;
  const had=__game.unpark?null:null;
  __game.unpark('Spain');
  const afterUnpark=p.pid;
  const r=G3.dom.getBoundingClientRect();
  __game.addSpace(p,(r.left+r.right)/2,(r.top+r.bottom)/2,900,40,'orbit');
  const t0=performance.now(); let info=null;
  while(performance.now()-t0<4000){
    info=p.pid&&G3.pc.info(p.pid);
    if(info&&info.vis&&info.rad>1.6&&G3.pc.has(p.pid)) break;
    await new Promise(r=>setTimeout(r,40));
  }
  return {parkedPid,afterUnpark,pid:p.pid,same:parkedPid===p.pid,info,has:!!(p.pid&&G3.pc.has(p.pid)),space:!!p.space};
});
if(life.afterUnpark) bad.push('unpark left pid '+life.afterUnpark);
if(!life.has||!life.info||!life.info.vis||life.info.rad<1.6) bad.push('throw orbit not visible '+JSON.stringify(life));
if(life.same) bad.push('orbit reused deleted parked mesh id');

// conveyor path: parked piece goes through a machine and must orbit visibly
const conv=await page.evaluate(async ()=>{
  const p=__game.pieces.find(q=>q.f.name==='Greece');
  __game.park('Greece',22,39,1,0);
  __game.setCoins(20);
  const ok=await __game.beginMachineRun('size',p);
  const t0=performance.now(); let info=null;
  while(performance.now()-t0<1500){
    info=p.pid&&G3.pc.info(p.pid);
    if(p.space&&info&&info.vis&&info.rad>1.6) break;
    await new Promise(r=>setTimeout(r,40));
  }
  return {ok,space:!!p.space,pid:p.pid,info,has:!!(p.pid&&G3.pc.has(p.pid))};
});
if(!conv.space||!conv.has||!conv.info||!conv.info.vis||conv.info.rad<1.6) bad.push('conveyor orbit invisible '+JSON.stringify(conv));

// 3. empty square corner does not steal the click; the country centre does
const sil=await page.evaluate(()=>{
  const p=__game.pieces.find(q=>q.f.name==='Spain');
  p.angle=35;
  const s=p.space;
  const b=G3.sampleBox(s.lon,s.lat,s.rad,p._h,s.drawS||1,p.angle);
  const centre=b.pts.find(q=>q.u===0&&q.v===0&&!q.occluded);
  const corners=b.pts.filter(q=>Math.abs(q.u)>0.02&&Math.abs(q.v)>0.02&&!q.occluded);
  const hitC=centre?G3.pickPiece(centre.x,centre.y):null;
  let cornerMiss=0, cornerHit=0, used=null;
  for(const c of corners){
    const id=G3.pickPiece(c.x,c.y);
    if(id) cornerHit++; else cornerMiss++;
    used=c;
  }
  return {hitC, pid:p.pid, cornerMiss, cornerHit, n:corners.length, centre:centre&&{x:centre.x,y:centre.y}};
});
if(sil.hitC!==sil.pid) bad.push('centre of Spain did not pick the country '+JSON.stringify(sil));
if(!sil.cornerMiss) bad.push('no transparent corner missed the mesh '+JSON.stringify(sil));

// 2. Brazil and Russia, rotated, drawers open, then zoom and narrow
await page.evaluate(()=>{
  __game.remSpace(__game.pieces.find(q=>q.f.name==='Spain'));
  __game.remSpace(__game.pieces.find(q=>q.f.name==='Greece'));
});
await page.evaluate(()=>__game.startGame('countries','starter'));
await page.waitForTimeout(300);
await page.evaluate(()=>{
  __game.setOpen(__game.DR.R, 172);
  __game.setOpen(__game.DR.L, 180);
  for(const name of ['Brazil','Russia']){
    const p=__game.pieces.find(q=>q.f.name===name);
    p.angle=name==='Brazil'?40:75;
    const r=G3.dom.getBoundingClientRect();
    __game.addSpace(p,(r.left+r.right)/2,(r.top+r.bottom)/2 - 20, 0, 0, 'orbit');
  }
});
async function watch(ms){
  return page.evaluate(async (arg)=>{
    const fn=eval(arg.fn);
    const names=['Brazil','Russia'];
    let over=0, front=0, back=0, shown=0, n=0;
    const t0=performance.now();
    while(performance.now()-t0<arg.ms){
      await new Promise(r=>requestAnimationFrame(r));
      n++;
      for(const name of names){
        const p=__game.pieces.find(q=>q.f.name===name);
        if(!p||!p.space) continue;
        const box=G3.sampleBox(p.space.lon,p.space.lat,p.space.rad,p._h,p.space.drawS||1,p.angle);
        const info=p.pid&&G3.pc.info(p.pid);
        if(!box.anyVis) back++;
        else {
          front++;
          if(info&&info.vis) shown++;
          if(fn(box)) over++;
        }
      }
    }
    const zoomMoved=(()=>{
      const p=__game.pieces.find(q=>q.f.name==='Brazil');
      const a=G3.sampleBox(p.space.lon,p.space.lat,p.space.rad,p._h,p.space.drawS||1,p.angle);
      G3.offsetLon(28);
      const b=G3.sampleBox(p.space.lon,p.space.lat,p.space.rad,p._h,p.space.drawS||1,p.angle);
      return Math.hypot((a.minX||0)-(b.minX||0),(a.minY||0)-(b.minY||0));
    })();
    return {over,front,back,shown,n,zoomMoved,draw:[...['Brazil','Russia']].map(name=>{const p=__game.pieces.find(q=>q.f.name===name);return {name,drawS:p.space&&p.space.drawS,vis:p.pid&&G3.pc.info(p.pid)};})};
  },{ms,fn:overlapFn});
}
const desk=await watch(1600);
if(desk.over) bad.push('desktop orbit overlapped UI '+JSON.stringify(desk));
if(!desk.front) bad.push('Brazil/Russia never in front '+JSON.stringify(desk));
if(desk.zoomMoved<8) bad.push('Brazil did not move with the globe '+desk.zoomMoved);
if(!desk.shown) bad.push('Brazil/Russia never shown '+JSON.stringify(desk));
await page.evaluate(()=>G3.zoomBy(1.7));
await page.setViewportSize({width:480,height:760});
await page.waitForTimeout(200);
const narrow=await watch(1200);
if(narrow.over) bad.push('zoomed narrow orbit overlapped UI '+JSON.stringify(narrow));
if(!narrow.back && !desk.back) bad.push('orbit never passed behind the globe '+JSON.stringify({desk,narrow}));
const sweep=await page.evaluate(()=>{
  const p=__game.pieces.find(q=>q.f.name==='Brazil');
  let sawF=false,sawB=false;
  for(let i=0;i<16;i++){
    const ang=p.space.ang+i*(Math.PI/8), c=Math.cos(ang), sn=Math.sin(ang);
    const d={x:c*p.space.ux+sn*p.space.vx,y:c*p.space.uy+sn*p.space.vy,z:c*p.space.uz+sn*p.space.vz};
    const lon=Math.atan2(d.x,d.z)*180/Math.PI, lat=Math.asin(Math.max(-1,Math.min(1,d.y)))*180/Math.PI;
    const b=G3.sampleBox(lon,lat,p.space.rad,p._h,p.space.drawS||1,p.angle);
    if(b.anyVis) sawF=true; else sawB=true;
  }
  return {sawF,sawB,vis:G3.pc.info(p.pid)};
});
if(!sweep.sawF||!sweep.sawB||!sweep.vis||!sweep.vis.vis) bad.push('Brazil sweep did not occlude '+JSON.stringify(sweep));
await page.screenshot({path:OUT+'/regress-orbit-narrow.jpg', type:'jpeg', quality:78});

// 4. legacy save without anchorName still locks the first placed country
await page.setViewportSize({width:1280,height:800});
const legacy=await page.evaluate(async ()=>{
  const cam=G3.cam(), quat=G3.quat();
  const S={v:5,t:1,coins:4,mode:'countries',set:'Europe',opts:{easy:false,lbl:true,bg:'0',muted:true},
    quat,cam,drawers:{L:0,R:0},placed:['France','Italy'],anc:null,
    pieces:[{n:'France',angle:0,hint:0,st:'placed'},{n:'Italy',angle:12,hint:0,st:'placed'}]};
  await __game.loadGame(S);
  const loaded=__game.anchorName;
  const snap=__game.snapshot();
  await __game.loadGame(snap);
  const round=__game.anchorName;
  G3.spinTo(__game.feat('Italy').c, 2.2);
  return {loaded,round,snapAnchor:snap.anchorName,placed:[...__game.placed]};
});
await page.waitForTimeout(900);
if(legacy.loaded!=='France'||legacy.round!=='France'||legacy.snapAnchor!=='France') bad.push('anchor migration '+JSON.stringify(legacy));
const drag=await page.evaluate(()=>{
  function inland(f){
    if(d3.geoContains(f,f.c)) return f.c;
    for(let d=0.15;d<4;d+=0.15) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]){
      const p=[f.c[0]+dx*d,f.c[1]+dy*d]; if(d3.geoContains(f,p)) return p;
    }
    return f.c;
  }
  const it=inland(__game.feat('Italy')), fr=inland(__game.feat('France'));
  const ip=G3.project(it[0],it[1]), fp=G3.project(fr[0],fr[1]);
  G3.spinTo(it, 2.4);
  return {it,fr,ip,fp};
});
await page.waitForTimeout(1100);
const pts=await page.evaluate((drag)=>{
  const ip=G3.project(drag.it[0],drag.it[1]), fp=G3.project(drag.fr[0],drag.fr[1]);
  const elI=document.elementFromPoint(ip[0],ip[1]), elF=document.elementFromPoint(fp[0],fp[1]);
  return {ip,fp,elI:elI&&elI.id, elF:elF&&elF.id, insideI:d3.geoContains(__game.feat('Italy'), G3.pick(ip[0],ip[1])||[0,0])};
}, drag);
await page.mouse.move(pts.ip[0], pts.ip[1]);
await page.mouse.down();
await page.mouse.move(pts.ip[0]-90, pts.ip[1]+16, {steps:8});
const itMid=await page.evaluate(()=>({carrying:__game.carrying&&__game.carrying.f.name, placed:[...__game.placed], anchor:__game.anchorName}));
await page.mouse.up();
await page.mouse.move(pts.fp[0], pts.fp[1]);
await page.mouse.down();
await page.mouse.move(pts.fp[0]+70, pts.fp[1]+24, {steps:6});
const frMid=await page.evaluate(()=>({carrying:__game.carrying&&__game.carrying.f.name, anchor:__game.anchorName, placed:[...__game.placed]}));
await page.mouse.up();
itMid.pts=pts;
if(frMid.carrying==='France'||!frMid.placed.includes('France')) bad.push('legacy anchor unlocked '+JSON.stringify(frMid));
if(itMid.carrying!=='Italy'||itMid.placed.includes('Italy')) bad.push('legacy second country not liftable '+JSON.stringify(itMid));
if(itMid.anchor!=='France') bad.push('anchor changed during lift '+itMid.anchor);

// belt still the slat crop, no pale fringe along the bottom of the machine art
await page.evaluate(()=>__game.startGame('countries','Europe'));
await page.waitForTimeout(300);
await page.evaluate(()=>document.querySelector('#machines .mach').classList.add('near'));
await page.waitForTimeout(200);
const belt=await page.evaluate(()=>{
  const mach=document.querySelector('#machines .mach').getBoundingClientRect();
  const win=document.querySelector('.beltWin').getBoundingClientRect();
  const sc=document.querySelector('.beltScroll');
  return {l:(win.left-mach.left)/mach.width, t:(win.top-mach.top)/mach.height, w:win.width/mach.width, h:win.height/mach.height, pos:sc.style.backgroundPositionX, bg:getComputedStyle(document.querySelector('.inBelt')).backgroundImage};
});
if(Math.abs(belt.l-0.0767)>0.02||Math.abs(belt.t-0.239)>0.02) bad.push('belt window misaligned '+JSON.stringify(belt));
if(!belt.pos||belt.pos==='0px') bad.push('belt not scrolling '+belt.pos);
if(/repeating-linear-gradient|linear-gradient/.test(belt.bg)) bad.push('generic belt is back '+belt.bg);
await page.screenshot({path:OUT+'/regress-belt.jpg', type:'jpeg', quality:82});
const fringe=await page.evaluate(async ()=>{
  const img=document.querySelector('#machines .machImg');
  if(!img.complete) await new Promise(r=>{img.onload=r;});
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
  const x=c.getContext('2d'); x.drawImage(img,0,0);
  const d=x.getImageData(0,0,c.width,c.height).data;
  let light=0;
  for(let y=c.height-12;y<c.height;y++) for(let i=0;i<c.width;i++){
    const o=(y*c.width+i)*4,a=d[o+3]; if(a<40) continue;
    const lum=(d[o]+d[o+1]+d[o+2])/3;
    if(lum>190&&Math.max(d[o],d[o+1],d[o+2])-Math.min(d[o],d[o+1],d[o+2])<30) light++;
  }
  return {light,w:c.width,h:c.height};
});
if(fringe.light>40) bad.push('white fringe under machine '+JSON.stringify(fringe));

console.log(JSON.stringify({bad,life,conv,sil,desk,narrow,legacy,frMid,itMid,belt,fringe,errs},null,2));
await browser.close();
process.exit(bad.length||errs.length?1:0);
