const fs=require('fs');global.window={};eval(fs.readFileSync('/workspace/world-jigsaw/data/facts.js','utf8'));
const MAP={"United Republic of Tanzania":"Tanzania","Western Sahara":"W. Sahara","Democratic Republic of the Congo":"Dem. Rep. Congo","Dominican Republic":"Dominican Rep.","The Bahamas":"Bahamas","Falkland Islands":"Falkland Is.","French Southern and Antarctic Lands":"Fr. S. Antarctic Lands","East Timor":"Timor-Leste","Ivory Coast":"Côte d'Ivoire","Guinea Bissau":"Guinea-Bissau","Central African Republic":"Central African Rep.","Republic of the Congo":"Congo","Equatorial Guinea":"Eq. Guinea","Swaziland":"eSwatini","West Bank":"Palestine","Gaza Strip":"Palestine","Solomon Islands":"Solomon Is.","Czech Republic":"Czechia","Bosnia and Herzegovina":"Bosnia and Herz.","Republic of Serbia":"Serbia","Northern Cyprus":"Cyprus","Somaliland":"Somalia"};
const rows=require('fs').readFileSync('raw.csv','utf8');
const csv=rows.split('\n').slice(1).filter(Boolean);const cnt={};
// naive csv parse
const P=l=>{const o=[];let c='',q=false;for(const ch of l){if(ch=='"'){q=!q;continue}if(ch==','&&!q){o.push(c);c='';continue}c+=ch}o.push(c);return o};
const R=csv.map(P);for(const r of R){const g=MAP[r[0]]||r[0];cnt[g]=(cnt[g]||0)+1}
const regionize=new Set(Object.keys(cnt).filter(g=>cnt[g]>52));
fs.writeFileSync('lookup.json',JSON.stringify({MAP,F:Object.keys(window.FACTS),regionize:[...regionize]}));console.log([...regionize]);
