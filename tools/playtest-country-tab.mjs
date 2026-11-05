import {chromium} from '/workspace/four-corners-src/node_modules/playwright/index.mjs';
import {spawnSync} from 'child_process';
import {mkdirSync} from 'fs';

const U = 'http://localhost:8944/?play&_=' + Date.now();
const OUT = '/workspace/world-jigsaw/previews/compare';
mkdirSync(OUT, {recursive: true});
const chrome = '/home/box/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const browser = await chromium.launch({
  executablePath: chrome,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({viewport: {width: 1280, height: 800}});
const bugs = [];
page.on('pageerror', e => bugs.push('pageerror:' + e.message));

await page.goto(U, {waitUntil: 'domcontentloaded', timeout: 60000});
await page.waitForFunction('window.__ready && window.__game && window.G3', null, {timeout: 120000});
await page.waitForTimeout(400);

const name = await page.evaluate(() => {
  const g = window.__game;
  // Prefer a small-stripe flag for faster celebrate in tests
  const prefer = ['Canada', 'Japan', 'France', 'Italy', 'Spain'];
  let p = g.pieces.find(x => prefer.includes(x.f.name) && !g.placed.has(x.f.name));
  if (!p) p = g.pieces.find(x => !g.placed.has(x.f.name));
  if (!p) return null;
  g.place(p.f.name);
  return p.f.name;
});
if (!name) bugs.push('no piece to place');

// Wait until place tab is visually on (after celebrate)
let shown = false;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(250);
  const s = await page.evaluate(() => {
    const tab = document.getElementById('placeTab');
    const card = document.getElementById('card');
    return {
      on: tab.classList.contains('on'),
      op: getComputedStyle(tab).opacity,
      vis: getComputedStyle(tab).visibility,
      cardHidden: !!card.hidden,
      cardDisplay: getComputedStyle(card).display,
      hit: (document.elementFromPoint(640, 420) || {}).id || (document.elementFromPoint(640, 420) || {}).tagName,
      count: countriesN.textContent,
      coins: __game.coins,
      free: __game.freeCoins,
    };
  });
  if (i === 0 || s.on) console.log('poll', i, s);
  if (!s.cardHidden || s.cardDisplay !== 'none') {
    bugs.push('full card auto-opened after place');
    break;
  }
  if (s.on && +s.op > 0.5 && s.vis === 'visible') {
    shown = true;
    if (s.count !== '1') bugs.push('countries count not 1: ' + s.count);
    if (String(s.hit).toLowerCase().includes('card')) bugs.push('card intercepts mouse');
    // coins: either pouch or free coins ok
    break;
  }
}
if (!shown) bugs.push('place tab never became visible');

await page.screenshot({path: `${OUT}/_ctab_tab.png`});

// Click tab via evaluate (more reliable than playwright visibility)
await page.evaluate(() => document.getElementById('placeTab').click());
await page.waitForTimeout(300);
const state2 = await page.evaluate(() => ({
  cardHidden: document.getElementById('card').hidden,
  cName: document.getElementById('cName').textContent,
  tabOn: document.getElementById('placeTab').classList.contains('on'),
}));
console.log('after tab click', state2);
if (state2.cardHidden) bugs.push('card did not open from tab');

await page.mouse.click(30, 220);
await page.waitForTimeout(250);
let state3 = await page.evaluate(() => ({cardHidden: document.getElementById('card').hidden}));
console.log('after click off', state3);
if (!state3.cardHidden) bugs.push('card did not close on click-off');

await page.click('#countriesB');
await page.waitForTimeout(250);
const drop = await page.evaluate(() => {
  const d = document.getElementById('countriesDrop');
  return {hidden: d.hidden, opts: [...d.querySelectorAll('button')].map(b => b.dataset.n)};
});
console.log('dropdown', drop);
if (drop.hidden) bugs.push('dropdown not open');
if (!drop.opts.includes(name)) bugs.push('placed country missing from dropdown');

await page.screenshot({path: `${OUT}/_ctab_drop.png`});

await page.evaluate((n) => {
  const btn = [...document.querySelectorAll('#countriesDrop button')].find(b => b.dataset.n === n);
  if (btn) btn.click();
}, name);
await page.waitForTimeout(300);
const state4 = await page.evaluate(() => ({
  cardHidden: document.getElementById('card').hidden,
  dropHidden: document.getElementById('countriesDrop').hidden,
}));
console.log('after dropdown pick', state4);
if (state4.cardHidden) bugs.push('card did not reopen from dropdown');
if (!state4.dropHidden) bugs.push('dropdown still open after pick');

await page.click('#cOk');
await page.waitForTimeout(200);

await page.evaluate(() => {
  const g = window.__game;
  const p = g.pieces.find(x => !g.placed.has(x.f.name));
  if (p) g.place(p.f.name);
});
shown = false;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(250);
  const s = await page.evaluate(() => ({
    cardHidden: document.getElementById('card').hidden,
    on: document.getElementById('placeTab').classList.contains('on'),
    op: getComputedStyle(document.getElementById('placeTab')).opacity,
    count: countriesN.textContent,
  }));
  if (s.on && +s.op > 0.5) {
    shown = true;
    console.log('second place', s);
    if (!s.cardHidden) bugs.push('card auto-opened on second place');
    if (s.count !== '2') bugs.push('count not 2');
    break;
  }
}
if (!shown) bugs.push('tab missing on second place');

// Wait for vanish (5s from show — poll until off)
let vanished = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => ({
    on: document.getElementById('placeTab').classList.contains('on'),
    op: getComputedStyle(document.getElementById('placeTab')).opacity,
    vis: getComputedStyle(document.getElementById('placeTab')).visibility,
  }));
  if (!s.on || s.vis === 'hidden' || +s.op < 0.1) { vanished = true; console.log('vanished', s); break; }
}
if (!vanished) bugs.push('tab did not vanish after 5s');

const snap = await page.evaluate(() => window.__game.snapshot());
if (!snap.placed || snap.placed.length !== 2) bugs.push('save placed list wrong: ' + JSON.stringify(snap.placed));

const a = `${OUT}/_ctab_tab.png`;
const b = `${OUT}/_ctab_drop.png`;
const jpg = `${OUT}/country-tab-v1.jpg`;
let ok = false;
for (const cmd of [
  ['magick', a, b, '+append', '-quality', '85', jpg],
  ['convert', a, b, '+append', '-quality', '85', jpg],
]) {
  const r = spawnSync(cmd[0], cmd.slice(1), {encoding: 'utf8'});
  if (r.status === 0) { ok = true; break; }
}
if (!ok) {
  const f = spawnSync('ffmpeg', ['-y', '-i', a, '-i', b, '-filter_complex', 'hstack', '-q:v', '3', jpg], {encoding: 'utf8'});
  if (f.status !== 0) {
    console.log('ffmpeg', f.stderr?.slice(-400));
    spawnSync('cp', [a, jpg]); // last resort wrong format
    bugs.push('could not compose jpg (copied png bytes)');
  } else ok = true;
}
if (ok) console.log('wrote', jpg);

await browser.close();
if (bugs.length) {
  console.error('BUGS:\n' + bugs.map(x => '- ' + x).join('\n'));
  process.exit(1);
}
console.log('NO_BUGS');
