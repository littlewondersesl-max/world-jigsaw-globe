const fs=require('fs');const cj=require('/tmp/p_i18n-iso-countries/codes.json');const c={numericToAlpha2:n=>{const r=cj.find(x=>x[2]==n);return r?r[0]:null}};const t=require('./data/countries-110m.json');
const extra={"Kosovo":"xk","N. Cyprus":null,"Somaliland":null,"W. Sahara":"eh","Antarctica":"aq","Fr. S. Antarctic Lands":"tf","Taiwan":"tw","Palestine":"ps"};
const out={};
for(const g of t.objects.countries.geometries){const n=g.properties.name;let a=(n in extra)?extra[n]:(g.id?c.numericToAlpha2(g.id):null);if(!a)continue;a=a.toLowerCase();
const src='/tmp/p_flag-icons/flags/4x3/'+a+'.svg';if(!fs.existsSync(src)){console.log('noflag',n);continue}
const s=fs.readFileSync(src,'utf8');fs.writeFileSync('flags/'+a+'.svg',s);
let cols=[...s.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map(m=>m[1].toLowerCase());
const norm=x=>x.length==4?'#'+[...x.slice(1)].map(ch=>ch+ch).join(''):x;cols=[...new Set(cols.map(norm))];
if(!/fill="#/.test(s.split('<path')[0])&&!cols.includes('#000000')&&/<path(?![^>]*fill)/.test(s))cols.unshift('#000000');
out[n]=[a,cols.slice(0,4)];}
fs.writeFileSync('data/flags.js','// name: [iso2, main flag colours in flag order] (flags: flag-icons, MIT)\nwindow.FLAGS='+JSON.stringify(out)+';\n');
console.log(Object.keys(out).length, out.France, out.India, out.Japan, out.Germany);
