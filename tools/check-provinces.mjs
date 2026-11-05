// overlap / gap check: provinces vs their country (dissolved from same topology) and vs the 110m master outline
import fs from 'fs';import * as topo from 'topojson-client';import pc from 'polygon-clipping';import {geoArea} from 'd3-geo';
const t=JSON.parse(fs.readFileSync(process.argv[2]));const G=t.objects.prov.geometries;const by={};G.forEach(g=>(by[g.properties.g]=by[g.properties.g]||[]).push(g));
const polys=f=>f.type=='Polygon'?[f.coordinates]:f.type=='MultiPolygon'?f.coordinates:[];
const ar=mp=>mp.length?geoArea({type:'MultiPolygon',coordinates:mp}):0;// steradians
let ERR=0;const KM=6371**2;const out=[];
// countries are each country's provinces merged; neighbours: merged country geometries
const C={};for(const n in by)C[n]=topo.merge(t,by[n]);
for(const n in by){const ps=by[n].map(g=>polys(topo.feature(t,g).geometry));const cA=ar(polys(C[n]));
 let sum=0;for(const p of ps)sum+=ar(p);let ov=0;
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){try{const x=pc.intersection(ps[i],ps[j]);if(x.length)ov+=ar(x);}catch(e){ERR++}}
 let un=ps.length>1?pc.union(...ps):ps[0];const gap=Math.max(0,cA-ar(un));
 out.push({n,provs:ps.length,countryKm2:Math.round(cA*KM),overlapKm2:+(ov*KM).toFixed(2),gapKm2:+(gap*KM).toFixed(2),sumDiffKm2:+((sum-cA)*KM).toFixed(2)});}
// country vs country overlaps (neighbour borders)
const names=Object.keys(C),nb=topo.neighbors(names.map(n=>topo.mergeArcs(t,by[n])));let cc=[];
names.forEach((n,i)=>nb[i].forEach(j=>{if(j<i)return;try{const x=pc.intersection(polys(C[n]),polys(C[names[j]]));const a=ar(x)*KM;if(a>0.01)cc.push([n,names[j],+a.toFixed(2)])}catch(e){ERR++}}));
out.sort((a,b)=>(b.overlapKm2+b.gapKm2)-(a.overlapKm2+a.gapKm2));
console.log(JSON.stringify({clipErrors:ERR,countries:out.length,provinces:G.length,worst:out.slice(0,8),totOverlapKm2:+out.reduce((s,o)=>s+o.overlapKm2,0).toFixed(2),totGapKm2:+out.reduce((s,o)=>s+o.gapKm2,0).toFixed(2),countryCountryOverlaps:cc.sort((a,b)=>b[2]-a[2]).slice(0,8)},null,1));
