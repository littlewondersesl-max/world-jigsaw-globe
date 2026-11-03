import re
s=open('brazil.html').read()
R=[("<title>Brazil HD preview","<title>South America HD preview"),
("Brazil HD preview · drag","South America HD preview · drag"),
(' · look: <a href="?look=1">1</a><a href="?look=2">2</a><a href="?look=3">3</a>',' · <a href="../brazil/">Brazil close-up</a>'),
("const S=await (await fetch('hd_shape.json')).json();","const S=await (await fetch('sa_shape.json')).json();const LON0=-82,LONS=48,LAT0=13,LATS=69;"),
("const ring=S.ring.filter((p,i)=>i%3==0).map(p=>new THREE.Vector2((p[0]/S.W-.5)*Wu,-(p[1]/S.H-.5)*Hu));\nconst sg=new THREE.ExtrudeGeometry(new THREE.Shape(ring),{depth:.3,bevelEnabled:true,bevelThickness:.03,bevelSize:.025,bevelSegments:3,curveSegments:1});\nconst slab=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:LOOK==3?0xd9cdb4:0x3b3128,roughness:.6}));slab.rotation.x=-Math.PI/2;slab.position.y=-.335;slab.castShadow=slab.receiveShadow=true;sc.add(slab);",
"const smat=new THREE.MeshStandardMaterial({color:0x3b3128,roughness:.6});for(const pc of S.pieces){const st=pc.r.length>400?2:1;const ring=pc.r.filter((p,i)=>i%st==0).map(p=>new THREE.Vector2((p[0]-.5)*Wu,-(p[1]-.5)*Hu));if(ring.length<4)continue;\nconst sg=new THREE.ExtrudeGeometry(new THREE.Shape(ring),{depth:.3,bevelEnabled:true,bevelThickness:.02,bevelSize:.006,bevelSegments:2,curveSegments:1});\nconst slab=new THREE.Mesh(sg,smat);slab.rotation.x=-Math.PI/2;slab.position.y=-.325;slab.castShadow=slab.receiveShadow=true;slab.name=pc.n;sc.add(slab);}"),
("new THREE.PlaneGeometry(Wu,Hu,1400,1440)","new THREE.PlaneGeometry(Wu,Hu,1000,1540)"),
("await tex(`hd_c${LOOK}.jpg`)","await tex('sa_c.jpg')"),
("hd_height_s.png","sa_height.png"),("hd_mask_s.png","sa_mask.png"),("hd_normal.jpg","sa_normal.jpg"),
("if(LOOK==2){tm.emissiveMap=await tex('hd_e2.jpg')","if(true){tm.emissiveMap=await tex('sa_e.jpg')"),
("'coast.png'","'sa_coast.png'"),("'rivers_main.json'","'sa_rivers.json'"),("'forest.png'","'sa_forest.png'"),
(":90000;",":110000;"),
("const C=[['São Paulo'","const C=[['Buenos Aires',-58.38,-34.6,15.5],['Lima',-77.04,-12.05,11],['Bogotá',-74.07,4.71,11],['Santiago',-70.65,-33.45,7],['Medellín',-75.57,6.24,4],['Caracas',-66.9,10.48,3],['Guayaquil',-79.9,-2.19,3],['Cali',-76.53,3.45,2.8],['Asunción',-57.58,-25.28,2.3],['Maracaibo',-71.64,10.65,2.2],['Barranquilla',-74.8,10.96,2.2],['Quito',-78.47,-.18,2],['La Paz',-68.15,-16.5,1.9],['Montevideo',-56.16,-34.9,1.8],['Santa Cruz',-63.18,-17.78,1.7],['Córdoba',-64.18,-31.42,1.6],['Rosario',-60.65,-32.95,1.3],['Arequipa',-71.54,-16.4,1],['Valparaíso',-71.62,-33.05,1],['Georgetown',-58.16,6.8,.3],['Paramaribo',-55.2,5.85,.25],['Cayenne',-52.33,4.92,.15],['São Paulo'"),
("const u=(lo+74.5)/40.5,v=(5.8-la)/40.3;","const u=(lo-LON0)/LONS,v=(LAT0-la)/LATS;"),
("const SH={full:[[0,15.2,7.0],[0,-.1,.3]]","const ll=(lo,la)=>[(((lo-LON0)/LONS)-.5)*Wu,(((LAT0-la)/LATS)-.5)*Hu];const [ax,az]=ll(-69.4,-15.8),[px,pz]=ll(-58,-34.6),[rx,rz]=ll(-43.2,-22.9);\nconst SH={full:[[0,15.6,7.4],[0,-.1,.35]],andes:[[ax-.6,.9,az+.9],[ax,.06,az]],plata:[[px,1.0,pz+.9],[px,.02,pz]],rio:[[rx-.1,1.0,rz+.75],[rx-.05,.03,rz-.07]]"),
]
for a,b in R:
  assert a in s,a[:60];s=s.replace(a,b)
s=re.sub(r",zoom:\[\[2\.79.*?manaus:\[\[[^\]]*\],\[[^\]]*\]\]","",s,flags=re.S)
open('sa.html','w').write(s)
