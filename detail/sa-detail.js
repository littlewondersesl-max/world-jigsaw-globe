// Close-up miniature for placed South American countries.
// One region at a time: trees, towns, rivers, lakes and a thin coast, dropped when you zoom out.
// Ground colour and elevation stay on the globe's existing painted meshes; this layer only adds the model.
import * as THREE from 'three';

const SAP = 'previews/south-america/';
const BRP = 'previews/brazil/';
const SA = { lon0: -82, lon1: -34, lat0: -56, lat1: 13 };
const BR = { lon0: -74.5, lon1: -34, lat0: -34.5, lat1: 5.8 };
const DEG = 1.5 * Math.PI / 180;
const VEX0 = 0.0022, LIFT0 = 0.00002;
// Capital + the main cities. tier "show" is the denser miniature used for the largest cities.
// Rio also keeps the hand-built model, which takes over only when you are very close.
const CITIES = [
  { id: 3, name: 'Brasília', lon: -47.8828, lat: -15.7939, pop: 4.8, ang: -0.016, tier: 'town', cap: 1 },
  { id: 3, name: 'São Paulo', lon: -46.6333, lat: -23.5505, pop: 22, ang: -0.199, tier: 'show' },
  { id: 3, name: 'Rio de Janeiro', lon: -43.1729, lat: -22.9068, pop: 13.5, ang: -0.579, tier: 'show' },
  { id: 3, name: 'Belo Horizonte', lon: -43.9378, lat: -19.9167, pop: 6, ang: 0.384, tier: 'town' },
  { id: 1, name: 'Buenos Aires', lon: -58.3816, lat: -34.6037, pop: 15.5, ang: 0.28, tier: 'show', cap: 1 },
  { id: 1, name: 'Córdoba', lon: -64.1811, lat: -31.4135, pop: 1.6, ang: 0.086, tier: 'town' },
  { id: 1, name: 'Rosario', lon: -60.6393, lat: -32.9468, pop: 1.3, ang: 0.509, tier: 'town' },
  { id: 1, name: 'Mendoza', lon: -68.8272, lat: -32.8895, pop: 1.2, ang: 0.15, tier: 'town' },
  { id: 4, name: 'Santiago', lon: -70.6693, lat: -33.4489, pop: 7, ang: -0.491, tier: 'show', cap: 1 },
  { id: 4, name: 'Valparaíso', lon: -71.6127, lat: -33.0472, pop: 1, ang: -0.226, tier: 'town' },
  { id: 4, name: 'Concepción', lon: -73.0444, lat: -36.8201, pop: 1, ang: 0.05, tier: 'town' },
  { id: 9, name: 'Lima', lon: -77.0428, lat: -12.0464, pop: 11, ang: -0.265, tier: 'show', cap: 1 },
  { id: 9, name: 'Arequipa', lon: -71.5375, lat: -16.409, pop: 1, ang: 0.431, tier: 'town' },
  { id: 9, name: 'Cusco', lon: -71.9675, lat: -13.5319, pop: 0.5, ang: -0.15, tier: 'town' },
  { id: 9, name: 'Trujillo', lon: -79.029, lat: -8.1116, pop: 1, ang: 0.1, tier: 'town' },
  { id: 5, name: 'Bogotá', lon: -74.0721, lat: 4.711, pop: 11, ang: -0.257, tier: 'show', cap: 1 },
  { id: 5, name: 'Medellín', lon: -75.5636, lat: 6.2476, pop: 4, ang: -0.334, tier: 'town' },
  { id: 5, name: 'Cali', lon: -76.532, lat: 3.4516, pop: 2.8, ang: 0.15, tier: 'town' },
  { id: 5, name: 'Barranquilla', lon: -74.7964, lat: 10.9685, pop: 2.2, ang: 0.56, tier: 'town' },
  { id: 12, name: 'Caracas', lon: -66.9036, lat: 10.4806, pop: 3, ang: 0.484, tier: 'show', cap: 1 },
  { id: 12, name: 'Maracaibo', lon: -71.6406, lat: 10.6544, pop: 2.2, ang: -0.518, tier: 'town' },
  { id: 12, name: 'Valencia', lon: -68.0077, lat: 10.1579, pop: 1.6, ang: 0.2, tier: 'town' },
  { id: 6, name: 'Quito', lon: -78.4678, lat: -0.1807, pop: 2, ang: -0.05, tier: 'town', cap: 1 },
  { id: 6, name: 'Guayaquil', lon: -79.8891, lat: -2.1894, pop: 3, ang: 0.384, tier: 'town' },
  { id: 6, name: 'Cuenca', lon: -79.0059, lat: -2.9001, pop: 0.6, ang: 0.05, tier: 'town' },
  { id: 2, name: 'Sucre', lon: -65.2596, lat: -19.0196, pop: 0.35, ang: -0.1, tier: 'town', cap: 1 },
  { id: 2, name: 'La Paz', lon: -68.1193, lat: -16.5, pop: 1.9, ang: -0.095, tier: 'town' },
  { id: 2, name: 'Santa Cruz', lon: -63.1816, lat: -17.7833, pop: 1.7, ang: -0.179, tier: 'town' },
  { id: 8, name: 'Asunción', lon: -57.5759, lat: -25.2637, pop: 2.3, ang: -0.172, tier: 'town', cap: 1 },
  { id: 8, name: 'Ciudad del Este', lon: -54.6167, lat: -25.5167, pop: 0.5, ang: 0.15, tier: 'town' },
  { id: 8, name: 'Encarnación', lon: -55.8667, lat: -27.3333, pop: 0.4, ang: 0.05, tier: 'town' },
  { id: 11, name: 'Montevideo', lon: -56.1645, lat: -34.9011, pop: 1.8, ang: -0.241, tier: 'town', cap: 1 },
  { id: 11, name: 'Salto', lon: -57.9667, lat: -31.3833, pop: 0.15, ang: 0.1, tier: 'town' },
  { id: 11, name: 'Paysandú', lon: -58.0756, lat: -32.3214, pop: 0.12, ang: 0, tier: 'town' },
  { id: 7, name: 'Georgetown', lon: -58.1551, lat: 6.8013, pop: 0.3, ang: -0.441, tier: 'town', cap: 1 },
  { id: 7, name: 'Linden', lon: -58.3071, lat: 6.0081, pop: 0.06, ang: 0.1, tier: 'town' },
  { id: 7, name: 'New Amsterdam', lon: -57.5144, lat: 6.2479, pop: 0.04, ang: 0.2, tier: 'town' },
  { id: 10, name: 'Paramaribo', lon: -55.2038, lat: 5.852, pop: 0.25, ang: -0.141, tier: 'town', cap: 1 },
  { id: 10, name: 'Nieuw Nickerie', lon: -56.973, lat: 5.926, pop: 0.05, ang: 0.1, tier: 'town' },
  { id: 10, name: 'Moengo', lon: -54.4, lat: 5.6167, pop: 0.03, ang: 0, tier: 'town' },
  { id: 14, name: 'Cayenne', lon: -52.3135, lat: 4.9224, pop: 0.15, ang: 0.191, tier: 'town', cap: 1 },
  { id: 14, name: 'Kourou', lon: -52.6493, lat: 5.1597, pop: 0.04, ang: 0.1, tier: 'town' },
  { id: 14, name: 'Saint-Laurent-du-Maroni', lon: -54.0325, lat: 5.4976, pop: 0.05, ang: -0.15, tier: 'town' },
  { id: 13, name: 'Stanley', lon: -57.8517, lat: -51.6977, pop: 0.03, ang: 0.3, tier: 'town', cap: 1 }
];

const RAD_VS = `
attribute float hh;
uniform float vex,vex0,lift,lift0;
vec3 saInst(vec3 transformed, mat4 im){
  vec3 ori = im[3].xyz;
  vec3 dir = normalize(ori);
  float r = length(ori) + (lift - lift0) + hh * (vex - vex0);
  return mat3(im) * transformed + dir * r;
}
vec3 saPoint(vec3 p){
  vec3 dir = normalize(p);
  float r = length(p) + (lift - lift0) + hh * (vex - vex0);
  return dir * r;
}`;
const RAD_U = { vex: { value: VEX0 }, vex0: { value: VEX0 }, lift: { value: LIFT0 }, lift0: { value: LIFT0 }, t: { value: 0 } };

function loadImg(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => {
      const c = document.createElement('canvas');
      c.width = i.width; c.height = i.height;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(i, 0, 0);
      res({ w: i.width, h: i.height, d: x.getImageData(0, 0, i.width, i.height).data });
    };
    i.onerror = () => rej(new Error(url));
    i.src = url;
  });
}
function clamp01(u) { return u < 0 || u > 1; }
function sample(im, u, v) {
  if (!im || clamp01(u) || clamp01(v)) return 0;
  const x = Math.min(im.w - 1, Math.max(0, u * im.w | 0));
  const y = Math.min(im.h - 1, Math.max(0, v * im.h | 0));
  return im.d[(y * im.w + x) * 4] / 255;
}
function sampleB(im, u, v) {
  if (!im || clamp01(u) || clamp01(v)) return 0;
  const fx = u * im.w - 0.5, fy = v * im.h - 0.5, x = Math.floor(fx), y = Math.floor(fy), a = fx - x, b = fy - y;
  const g = (i, j) => {
    const ix = Math.min(im.w - 1, Math.max(0, i)), iy = Math.min(im.h - 1, Math.max(0, j));
    return im.d[(iy * im.w + ix) * 4] / 255;
  };
  return (g(x, y) * (1 - a) + g(x + 1, y) * a) * (1 - b) + (g(x, y + 1) * (1 - a) + g(x + 1, y + 1) * a) * b;
}
function uvOf(box, lon, lat) {
  return [(lon - box.lon0) / (box.lon1 - box.lon0), (box.lat1 - lat) / (box.lat1 - box.lat0)];
}

function mergeParts(parts) {
  const pos = [], nrm = [], idx = [];
  let base = 0;
  for (const g of parts) {
    const p = g.attributes.position, nr = g.attributes.normal, id = g.index;
    for (let v = 0; v < p.count; v++) {
      pos.push(p.getX(v), p.getY(v), p.getZ(v));
      nrm.push(nr.getX(v), nr.getY(v), nr.getZ(v));
    }
    if (id) for (let k = 0; k < id.count; k++) idx.push(id.getX(k) + base);
    base += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  return geo;
}
function treeParts() {
  const trunk = new THREE.CylinderGeometry(0.18, 0.26, 0.55, 6);
  trunk.translate(0, 0.28, 0);
  const low = new THREE.ConeGeometry(0.72, 0.85, 8);
  low.translate(0, 0.78, 0);
  const high = new THREE.ConeGeometry(0.46, 0.62, 7);
  high.translate(0, 1.22, 0);
  return { trunk, canopy: mergeParts([low, high]) };
}

export function attachSADetail(THREE, api) {
  const { G, C, O, PU, SU, U, SAN, isBrazil, flags, tiles, land, covers } = api;
  const win = PU.win, winOn = PU.winOn;
  let maps = null, loading = false, group = null, token = 0, builtKey = '', pendingKey = '';
  let natureOn = true, muted = false, audio = null, birdAt = 0;
  const treesGeo = treeParts();
  const geos = {
    trunk: treesGeo.trunk,
    canopy: treesGeo.canopy,
    box: new THREE.BoxGeometry(1, 1, 1),
    roof: new THREE.ConeGeometry(0.72, 0.55, 4),
    road: new THREE.PlaneGeometry(1, 1),
    fig: new THREE.BoxGeometry(1, 1, 1)
  };
  geos.box.translate(0, 0.5, 0);
  geos.roof.rotateY(Math.PI / 4); geos.roof.translate(0, 0.28, 0);
  geos.road.rotateX(-Math.PI / 2);
  geos.fig.translate(0, 0.5, 0);
  const col = new THREE.Color(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3(), east = new THREE.Vector3(), south = new THREE.Vector3(), up = new THREE.Vector3();

  function radUniforms() {
    const u = {};
    for (const k in RAD_U) u[k] = { value: RAD_U[k].value };
    u.t = { value: 0 };
    return u;
  }
  // Painted miniature: albedo stays the colour we set. A face that points up is a little brighter, but nothing goes black.
  function paintMat(sway) {
    const u = radUniforms();
    const m = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: RAD_VS + `
        uniform float t;
        varying vec3 vCol; varying float vUp;
        void main(){
          vec3 p = position;
          ${sway ? `float ph=instanceMatrix[3].x*37.0+instanceMatrix[3].z*23.0;
          p.x += sin(t*1.55+ph)*0.055*max(position.y,0.0);
          p.z += cos(t*1.25+ph)*0.04*max(position.y,0.0);` : ''}
          vUp = abs(normalize(normal).y);
          vCol = instanceColor;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(saInst(p, instanceMatrix), 1.0);
        }`,
      fragmentShader: `
        varying vec3 vCol; varying float vUp;
        void main(){
          vec3 col = vCol * (0.86 + 0.28 * vUp);
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    m.userData.u = u;
    return m;
  }
  const mats = {};
  mats.canopy = paintMat(true);
  mats.trunk = paintMat(false);
  mats.build = paintMat(false);
  mats.roof = paintMat(false);
  mats.road = paintMat(false);
  mats.road.polygonOffset = true; mats.road.polygonOffsetFactor = -2;
  mats.fig = paintMat(false);
  function shaderMat(frag, extra) {
    const u = radUniforms();
    if (extra) Object.assign(u, extra);
    const m = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3,
      vertexShader: RAD_VS + `
        varying vec2 vUv; varying vec3 vW;
        void main(){
          vUv=uv;
          vec3 wp=saPoint(position);
          vec4 c=modelViewMatrix*vec4(wp,1.0);
          vW=(modelMatrix*vec4(wp,1.0)).xyz;
          gl_Position=projectionMatrix*c;
        }`,
      fragmentShader: frag
    });
    m.userData.u = u;
    return m;
  }
  mats.bank = shaderMat(`
    varying vec2 vUv;
    void main(){
      float e = abs(vUv.y * 2.0 - 1.0);
      vec3 earth = vec3(0.42, 0.34, 0.18);
      vec3 grass = vec3(0.28, 0.40, 0.16);
      vec3 col = mix(grass, earth, smoothstep(0.25, 0.85, e));
      gl_FragColor = vec4(col, 1.0);
    }`);
  mats.bank.transparent = false; mats.bank.depthWrite = true;
  mats.river = shaderMat(`
    uniform float t; varying vec2 vUv; varying vec3 vW;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
    void main(){
      vec2 q=vec2(vUv.x*1.4-t*1.3, vUv.y*5.0);
      float r=n(q*vec2(1.2,2.4))*0.65+n(q*vec2(3.1,6.0)+4.0)*0.35;
      float edge=smoothstep(0.0,0.18,vUv.y)*smoothstep(1.0,0.82,vUv.y);
      vec3 V=normalize(cameraPosition-vW);
      vec3 N=normalize(vW);
      float fres=pow(1.0-max(dot(N,V),0.0), 3.0);
      vec3 deep=vec3(0.02,0.14,0.20), mid=vec3(0.05,0.30,0.36);
      vec3 col=mix(deep, mid, r);
      col += smoothstep(0.72,0.95,r)*vec3(0.55,0.7,0.78)*0.28;
      col += fres*vec3(0.35,0.5,0.58)*0.22;
      gl_FragColor=vec4(pow(col,vec3(1./2.2)), 0.94*edge);
    }`);
  mats.lake = shaderMat(`
    uniform float t; varying vec2 vUv; varying vec3 vW;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
    void main(){
      vec2 q=vW.xz*420.0;
      float r=n(q+vec2(t*0.8,t*0.3));
      vec3 col=mix(vec3(0.05,0.22,0.30), vec3(0.35,0.58,0.66), r*0.35+0.15);
      col+=smoothstep(0.78,0.95,r)*vec3(0.8,0.9,0.95)*0.2;
      gl_FragColor=vec4(pow(col,vec3(1./2.2)), 0.72);
    }`);
  mats.foam = shaderMat(`
    uniform float t; varying vec2 vUv; varying vec3 vW;
    float h(vec2 p){return fract(sin(dot(p,vec2(41.3,17.7)))*43758.5);}
    void main(){
      float band=smoothstep(0.15,0.85,vUv.y);
      float wave=0.5+0.5*sin(vUv.x*46.0 - t*2.4 + h(floor(vUv.xx*8.0))*6.0);
      float foam=band*(0.35+0.65*smoothstep(0.55,0.9,wave));
      vec3 col=mix(vec3(0.55,0.72,0.78), vec3(0.95,0.97,0.96), foam);
      float a=foam*0.55*smoothstep(0.0,0.15,vUv.y)*smoothstep(1.0,0.72,vUv.y);
      if(a<0.03) discard;
      gl_FragColor=vec4(pow(col,vec3(1./2.2)), a);
    }`);
  const patchU = {
    ...radUniforms(),
    mapS: { value: SU.map.value }, mapB: { value: PU.map.value }, ids: { value: SU.ids.value },
    bbS: { value: SU.bb.value }, bbB: { value: PU.bb.value },
    on: SU.on, br: { value: 0 }, sun: U.sun,
    sat: { value: SU.map.value }, satOn: { value: 0 }, satBox: { value: new THREE.Vector4() },
    land: { value: land || SU.map.value }, world: { value: 0 },
    rioOn: { value: 0 }, rioB: { value: new THREE.Vector4() },
    ctr: { value: new THREE.Vector2() }, span: { value: 1 }
  };
  mats.patch = new THREE.ShaderMaterial({
    uniforms: patchU,
    vertexShader: RAD_VS + `
      attribute vec2 ll;
      varying vec3 vWp; varying vec2 vLL;
      void main(){
        vLL=ll;
        vec3 dir=normalize(position);
        float r=length(position)+(lift-lift0)+hh*(vex-vex0);
        vec3 wp=dir*r;
        vWp=(modelMatrix*vec4(wp,1.0)).xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(wp,1.0);
      }`,
    fragmentShader: `
      uniform sampler2D mapS, mapB, ids, sat, land;
      uniform vec4 bbS, bbB, satBox, rioB;
      uniform float on[16], br, rioOn, satOn, span, world;
      uniform vec2 ctr;
      uniform vec3 sun;
      varying vec3 vWp; varying vec2 vLL;
      int idOf(vec2 uv){ return int(texture2D(ids, clamp(uv,0.001,0.999)).r*255.0+0.5); }
      bool placedId(int id){
        if(id<=0) return false;
        if(id==3) return br>0.5;
        return on[id]>0.5;
      }
      void main(){
        vec2 uvS=vec2((vLL.x-bbS.x)/(bbS.z-bbS.x),(vLL.y-bbS.y)/(bbS.w-bbS.y));
        int k=idOf(uvS);
        if(rioOn>0.45 && vLL.x>rioB.x && vLL.x<rioB.z && vLL.y>rioB.y && vLL.y<rioB.w) discard;
        if(satOn<0.5) discard;
        vec2 tuv=vec2((vLL.x-satBox.x)/(satBox.z-satBox.x),(vLL.y-satBox.y)/(satBox.w-satBox.y));
        float tileEdge=min(min(tuv.x, 1.0-tuv.x), min(tuv.y, 1.0-tuv.y));
        if(tileEdge<=0.0) discard;
        vec3 raw=texture2D(sat, tuv).rgb;
        if(dot(raw, vec3(1.0))<0.004) discard;
        // The country mask is a few kilometres per pixel, so it stair-steps the shore.
        // Keep a thin fringe around a placed country and let the photo's own blue water draw the coast.
        bool placed=false;
        bool nearPlaced=false;
        bool nearOcean=false;
        if(world>0.5){
          vec2 wuv=vec2(fract((vLL.x+180.0)/360.0), clamp((vLL.y+90.0)/180.0, 0.001, 0.999));
          vec2 px=vec2(1.0/4096.0, 1.0/2048.0);
          float here=texture2D(land, wuv).r;
          placed=here>0.45;
          nearPlaced=placed;
          nearOcean=here<0.2;
          for(int s=1;s<=2;s++){
            float o=float(s);
            float a=texture2D(land, wuv+vec2(px.x*o,0.0)).r;
            float b=texture2D(land, wuv+vec2(-px.x*o,0.0)).r;
            float c=texture2D(land, wuv+vec2(0.0,px.y*o)).r;
            float d=texture2D(land, wuv+vec2(0.0,-px.y*o)).r;
            if(a<0.2||b<0.2||c<0.2||d<0.2) nearOcean=true;
            if(a>0.45||b>0.45||c>0.45||d>0.45) nearPlaced=true;
          }
        }else{
          placed=placedId(k);
          nearPlaced=placed;
          nearOcean=(k==0);
          vec2 px=vec2(1.0/1325.0, 1.0/2048.0);
          for(int s=1;s<=3;s++){
            float o=float(s);
            int a=idOf(uvS+vec2(px.x*o,0.0)); int b=idOf(uvS+vec2(-px.x*o,0.0));
            int c=idOf(uvS+vec2(0.0,px.y*o)); int d=idOf(uvS+vec2(0.0,-px.y*o));
            if(a==0||b==0||c==0||d==0) nearOcean=true;
            if(placedId(a)||placedId(b)||placedId(c)||placedId(d)) nearPlaced=true;
          }
        }
        // The tile is sampled in linear light. Ocean is the pixel that is clearly bluer than it is red.
        bool water=raw.b>raw.r*1.45 && raw.g<raw.b*2.1 && raw.r<0.15 && raw.b>0.015;
        if(world>0.5){
          if(!nearPlaced) discard;
          if(!placed && water) discard;
        }else{
          if(water && (k==0 || nearOcean)) discard;
          if(!nearPlaced) discard;
        }
        // One daylight grade for every region. The photo is linear; this opens the shadows and holds the highlights.
        float lum=dot(raw, vec3(0.30,0.50,0.20));
        float sh=1.0-smoothstep(0.01, 0.055, lum);
        vec3 x=raw*mix(1.35, 3.8, sh);
        vec3 col=(x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14);
        float y=dot(col, vec3(0.28,0.55,0.17));
        col=mix(vec3(y), col, 1.12);
        vec3 n=normalize(cross(dFdx(vWp), dFdy(vWp)));
        float nd=dot(n, normalize(sun));
        float hill=0.96+0.14*smoothstep(-0.15,0.8,nd);
        col*=hill;
        float edge=max(abs(vLL.x-ctr.x), abs(vLL.y-ctr.y))/max(span,0.05);
        float fade=min(smoothstep(1.0, 0.45, edge), smoothstep(0.0, 0.16, tileEdge));
        if(fade<0.97){
          float hsh=fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
          if(hsh>fade) discard;
        }
        gl_FragColor=vec4(pow(clamp(col,0.0,1.0), vec3(1.0/2.2)), 1.0);
      }`
  });
  mats.patch.userData.u = patchU;
  mats.patch.side = THREE.DoubleSide;
  mats.patch.depthTest = false;
  mats.patch.depthWrite = false;
  mats.patch.polygonOffset = true; mats.patch.polygonOffsetFactor = -1;

  const live = [mats.canopy, mats.trunk, mats.build, mats.roof, mats.road, mats.fig, mats.bank, mats.river, mats.lake, mats.foam, mats.patch];

  function countryName(id) {
    const n = SAN[id - 1] || '';
    return n === 'France' ? 'French Guiana' : n;
  }
  function isOn(id) {
    if (id === 3) return !!isBrazil();
    if (id < 1 || id >= SU.on.value.length) return false;
    return SU.on.value[id] > 0.5;
  }
  function anyOn() {
    if (isBrazil()) return true;
    for (let i = 1; i < SU.on.value.length; i++) if (SU.on.value[i] > 0.5) return true;
    return false;
  }
  function placedMask() {
    let m = isBrazil() ? 1 : 0;
    for (let i = 1; i < SU.on.value.length; i++) if (SU.on.value[i] > 0.5) m |= (1 << i);
    return m;
  }
  function viewLL() {
    const tgt = O.target;
    let p;
    if (tgt.lengthSq() > 0.2) p = tgt.clone();
    else {
      const v = new THREE.Vector3(0, 0, 0.5).unproject(C);
      const o = C.position.clone();
      const d = v.sub(o).normalize();
      const b = o.dot(d), c0 = o.lengthSq() - 2.25, disc = b * b - c0;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc);
      if (t < 0) return null;
      p = o.addScaledVector(d, t);
    }
    const local = p.applyQuaternion(G.quaternion.clone().invert());
    const len = local.length() || 1;
    return {
      lon: Math.atan2(local.x, local.z) * 180 / Math.PI,
      lat: Math.asin(Math.max(-1, Math.min(1, local.y / len))) * 180 / Math.PI
    };
  }
  function inBox(ll) { return ll.lon > -84 && ll.lon < -32 && ll.lat > -58 && ll.lat < 14; }
  function onLand(ll) {
    if (!ll) return false;
    if (covers && covers(ll.lon, ll.lat)) return true;
    if (inBox(ll) && maps && overPlaced(ll)) return true;
    if (covers) {
      for (const [dx, dy] of [[0.5, 0], [-0.5, 0], [0, 0.4], [0, -0.4]]) {
        if (covers(ll.lon + dx, ll.lat + dy)) return true;
      }
    }
    return false;
  }
  function idAt(lon, lat) {
    if (!maps) return 0;
    const [u, v] = uvOf(SA, lon, lat);
    return Math.round(sample(maps.ids, u, v) * 255);
  }
  function height01(lon, lat) {
    if (!maps) return 0;
    const id = idAt(lon, lat);
    if (id === 3 && maps.brH) {
      const [u, v] = uvOf(BR, lon, lat);
      if (u >= 0 && v >= 0 && u <= 1 && v <= 1) return sampleB(maps.brH, u, v);
    }
    const [u, v] = uvOf(SA, lon, lat);
    return sampleB(maps.height, u, v);
  }
  function waterAt(lon, lat) {
    const [u, v] = uvOf(SA, lon, lat);
    return sample(maps.water, u, v);
  }
  function maskInset(lon, lat, id) {
    if (id === 3 && maps.brM) {
      const [u, v] = uvOf(BR, lon, lat);
      if (u >= 0 && v >= 0 && u <= 1 && v <= 1) return [sample(maps.brM, u, v), sample(maps.brI, u, v)];
    }
    const [u, v] = uvOf(SA, lon, lat);
    return [sample(maps.mask, u, v), sample(maps.inset, u, v)];
  }
  function forestRaw(lon, lat) {
    const [u, v] = uvOf(SA, lon, lat);
    return sample(maps.forest, u, v);
  }
  // The coarse forest mask misses the Atlantic forest and the wet side of Patagonia. Add those belts, and keep deserts empty.
  function forestAt(lon, lat, h) {
    let f = forestRaw(lon, lat);
    if (lon > -49.2 && lat < -6 && lat > -30.5 && h > 0.02 && h < 0.72) {
      const coast = Math.max(0, Math.min(1, (lon + 49.2) / 7.5));
      f = Math.max(f, 0.32 + 0.4 * coast);
    }
    if (lon < -71.1 && lon > -75.4 && lat < -38 && lat > -55 && h > 0.04 && h < 0.62) f = Math.max(f, 0.5);
    if (h > 0.8 && f < 0.3) f *= 0.1;
    return f;
  }
  function slope(lon, lat) {
    const e = 0.045, h = height01(lon, lat);
    const dx = Math.abs(height01(lon + e, lat) ** 2 - h * h);
    const dy = Math.abs(height01(lon, lat + e) ** 2 - h * h);
    return Math.max(dx, dy) * 4500 / (e * 111000);
  }
  function place(lon, lat, eps) {
    const h = height01(lon, lat);
    const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
    const r = 1.5 + LIFT0 + h * h * VEX0 + (eps || 0);
    tmp.set(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
    return { p: tmp.clone(), h, hh: h * h };
  }
  function basis(lon, lat, eps) {
    const o = place(lon, lat, eps);
    up.copy(o.p).normalize();
    const lo = lon * Math.PI / 180;
    east.set(Math.cos(lo), 0, -Math.sin(lo));
    east.addScaledVector(up, -east.dot(up)).normalize();
    south.crossVectors(east, up).normalize();
    return o;
  }
  function compose(p, ang, sx, sy, sz) {
    const b = new THREE.Matrix4().makeBasis(east, up, south);
    Q.setFromRotationMatrix(b);
    const yaw = new THREE.Quaternion().setFromAxisAngle(Y, ang);
    Q.multiply(yaw);
    M.compose(p, Q, tmp.set(sx, sy, sz));
    return M;
  }
  // Nearest land of this country that is inset from the shore and not a cliff or a lake.
  function snapCity(c) {
    const step = 0.025, max = c.id === 13 || c.id === 14 ? 0.7 : 0.42;
    let best = null;
    for (let rad = 0; rad <= max; rad += step) {
      const n = rad === 0 ? 1 : Math.max(8, Math.ceil(rad / step * 4));
      for (let k = 0; k < n; k++) {
        const a = rad === 0 ? 0 : k / n * Math.PI * 2;
        const lon = c.lon + Math.cos(a) * rad, lat = c.lat + Math.sin(a) * rad;
        const id = idAt(lon, lat);
        if (id !== c.id || !isOn(id)) continue;
        if (waterAt(lon, lat) > 0.35) continue;
        const [m, ins] = maskInset(lon, lat, id);
        if (m < 0.5 || ins < 0.42) continue;
        if (slope(lon, lat) > 0.42) continue;
        const d = rad + (1 - ins) * 0.02;
        if (!best || d < best.d) best = { lon, lat, d, id };
      }
      if (best && rad > best.d + step) break;
    }
    return best;
  }
  function radiusDeg(c) {
    const s = c.tier === 'show' ? 0.062 : 0.042;
    return Math.min(0.30, Math.max(c.tier === 'show' ? 0.12 : 0.045, s * Math.sqrt(c.pop)));
  }
  function spanFor(alt) {
    const fov = C.fov * Math.PI / 180;
    const width = 2 * Math.tan(fov * 0.5) * Math.max(alt, 0.003);
    const deg = width / DEG;
    return Math.min(2.4, Math.max(0.32, deg * 1.35));
  }
  function overPlaced(ll) {
    if (!maps || !ll) return false;
    if (isOn(idAt(ll.lon, ll.lat))) return true;
    for (const [dx, dy] of [[0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35], [0.28, 0.28], [-0.28, 0.28]]) {
      if (isOn(idAt(ll.lon + dx, ll.lat + dy))) return true;
    }
    return false;
  }
  function reliefAt(alt) {
    const ll = viewLL();
    if (!ll || !onLand(ll)) return 0;
    const t = Math.min(1, Math.max(0, (alt - 0.092) / (0.042 - 0.092)));
    const s = t * t * (3 - 2 * t);
    return s;
  }

  function ensureMaps() {
    if (maps || loading) return;
    loading = true;
    const need = [
      ['height', SAP + 'height.png'], ['forest', SAP + 'forest.png'], ['inset', SAP + 'inset.png'],
      ['mask', SAP + 'mask.png'], ['ids', SAP + 'ids.png'], ['water', SAP + 'water.png'],
      ['brH', BRP + 'height.png'], ['brM', BRP + 'mask.png'], ['brI', BRP + 'inset.png']
    ];
    Promise.all(need.map(([, u]) => loadImg(u)).concat([fetch(SAP + 'rivers.json').then(r => r.json())])).then(imgs => {
      maps = {};
      need.forEach((n, i) => { maps[n[0]] = imgs[i]; });
      maps.rivers = imgs[need.length];
      loading = false;
      builtKey = '';
    }).catch(e => { console.error('sa detail', e); loading = false; });
  }

  function disposeGroup(g) {
    if (!g) return;
    G.remove(g);
    g.traverse(o => {
      if (o.geometry && o.geometry !== geos.trunk && o.geometry !== geos.canopy && o.geometry !== geos.box && o.geometry !== geos.roof && o.geometry !== geos.road && o.geometry !== geos.fig) o.geometry.dispose();
    });
  }

  function addInst(geo, mat, n) {
    const g = geo.clone();
    const mesh = new THREE.InstancedMesh(g, mat, Math.max(1, n));
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.userData.hh = new Float32Array(Math.max(1, n));
    return mesh;
  }
  function finishInst(mesh) {
    if (!mesh.count) return null;
    const hh = mesh.userData.hh;
    const arr = hh.length === mesh.count ? hh : hh.subarray(0, mesh.count);
    const attr = new THREE.InstancedBufferAttribute(mesh.count === hh.length ? hh : new Float32Array(arr), 1);
    mesh.geometry.setAttribute('hh', attr);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  function build(ll, span, rioCover) {
    const rngS = (Math.round((ll.lon + 180) * 10) * 1000 + Math.round((ll.lat + 90) * 10)) >>> 0;
    let seed = rngS || 1;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const root = new THREE.Group();
    root.frustumCulled = false;
    const half = span;
    const cities = [];
    for (const c of CITIES) {
      if (!isOn(c.id)) continue;
      if (Math.abs(c.lon - ll.lon) > half + 0.2 || Math.abs(c.lat - ll.lat) > half + 0.2) continue;
      const s = snapCity(c);
      if (!s) continue;
      cities.push({ ...c, lon: s.lon, lat: s.lat, rad: radiusDeg(c) });
    }
    cities.sort((a, b) => Math.hypot(a.lon - ll.lon, a.lat - ll.lat) - Math.hypot(b.lon - ll.lon, b.lat - ll.lat));
    // ground patch
    const N = 168;
    const pos = [], uv = [], hhA = [], llA = [], idx = [];
    const H = N + 1;
    const hhG = new Float32Array(H * H);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const lon = ll.lon + (i / N - 0.5) * 2 * half, lat = ll.lat + (j / N - 0.5) * 2 * half;
      const h = height01(lon, lat);
      hhG[j * H + i] = h * h;
      llA.push(lon, lat);
    }
    // Keep neighbouring vertices from folding into big flat faces on a steep ridge.
    for (let pass = 0; pass < 6; pass++) {
      const next = hhG.slice();
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        let s = hhG[j * H + i], c = 1;
        if (i > 0) { s += hhG[j * H + i - 1]; c++; }
        if (i < N) { s += hhG[j * H + i + 1]; c++; }
        if (j > 0) { s += hhG[(j - 1) * H + i]; c++; }
        if (j < N) { s += hhG[(j + 1) * H + i]; c++; }
        next[j * H + i] = s / c;
      }
      hhG.set(next);
    }
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const lon = llA[(j * H + i) * 2], lat = llA[(j * H + i) * 2 + 1];
      const hh = hhG[j * H + i];
      const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
      const r = 1.5 + LIFT0 + hh * VEX0 + 0.000045;
      pos.push(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
      uv.push(i / N, j / N); hhA.push(hh);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      idx.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    pg.setAttribute('hh', new THREE.Float32BufferAttribute(hhA, 1));
    pg.setAttribute('ll', new THREE.Float32BufferAttribute(llA, 2));
    pg.setIndex(idx); pg.computeVertexNormals();
    const patch = new THREE.Mesh(pg, mats.patch);
    patch.frustumCulled = false; patch.renderOrder = 3;
    root.add(patch);

    // Satellite colours decide what grows where, so the forest follows the real canopy and stops at rivers.
    const grab = tiles && tiles.grab ? tiles.grab() : null;
    const satAt = (lon, lat) => {
      if (!grab) return null;
      const b = grab.box;
      const u = (lon - b.lon0) / (b.lon1 - b.lon0);
      const v = (b.lat1 - lat) / (b.lat1 - b.lat0);
      if (u <= 0 || v <= 0 || u >= 1 || v >= 1) return null;
      const x = Math.min(grab.w - 1, Math.max(0, u * grab.w | 0));
      const y = Math.min(grab.h - 1, Math.max(0, v * grab.h | 0));
      const i = (y * grab.w + x) * 4;
      if (grab.data[i + 3] < 20) return null;
      return [grab.data[i], grab.data[i + 1], grab.data[i + 2]];
    };
    const landKind = (lon, lat) => {
      const rgb = satAt(lon, lat);
      if (!rgb) return 'none';
      const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
      const l = (r + g + b) / 3, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn;
      const green = g - Math.max(r, b);
      if (l < 0.15 && b + 0.03 >= r && b + 0.02 >= g) return 'water';
      if (b > r * 1.08 && b > g * 0.92 && l < 0.4 && green < 0.02) return 'water';
      if (green > 0.055 && g > r * 1.12 && g > b && l > 0.1 && l < 0.48) return 'forest';
      if (l > 0.58 && sat < 0.18) return 'bare';
      if (r > g + 0.035 && r > b + 0.05 && l > 0.28 && sat > 0.07) return 'bare';
      if (l > 0.14 && l < 0.62 && green < 0.025 && sat < 0.2) return 'urban';
      return 'land';
    };
    const coverAt = (lon, lat) => {
      const e = Math.max(Math.abs(lon - ll.lon), Math.abs(lat - ll.lat)) / half;
      const t = (0.9 - e) / 0.5;
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t * t * (3 - 2 * t);
    };
    const greens = [
      [0.07, 0.30, 0.06], [0.11, 0.40, 0.07], [0.16, 0.36, 0.09],
      [0.09, 0.26, 0.05], [0.18, 0.44, 0.10], [0.13, 0.33, 0.08], [0.22, 0.46, 0.12]
    ];

    const TREES = 9000;
    const canopies = addInst(geos.canopy, mats.canopy, TREES);
    const trunks = addInst(geos.trunk, mats.trunk, TREES);
    let ti = 0, nForest = 0, nUrban = 0;
    const step = Math.max(0.012, (2 * half) / 80);
    for (let lat = ll.lat - half; lat <= ll.lat + half && false && ti < TREES; lat += step) {
      for (let lon = ll.lon - half; lon <= ll.lon + half && ti < TREES; lon += step) {
        const jlon = lon + (rnd() - 0.5) * step * 0.85, jlat = lat + (rnd() - 0.5) * step * 0.85;
        const fade = coverAt(jlon, jlat);
        if (fade < 0.08 || rnd() > fade) continue;
        const id = idAt(jlon, jlat);
        if (!isOn(id) || waterAt(jlon, jlat) > 0.2) continue;
        const [m, ins] = maskInset(jlon, jlat, id);
        if (m < 0.4 || ins < 0.16) continue;
        const kind = landKind(jlon, jlat);
        if (kind !== 'forest') continue;
        const h = height01(jlon, jlat);
        if (h > 0.42 || slope(jlon, jlat) > 0.2) continue;
        if (rioCover && Math.hypot(jlon + 43.2, jlat + 22.9) < 0.32) continue;
        if (rnd() > 0.42 * fade) continue;
        nForest++;
        const o = basis(jlon, jlat, 0.00005);
        const sc = (0.00011 + rnd() * 0.0002) * (0.55 + fade * 0.45) * (0.6 + rnd() * 0.9);
        const yaw = rnd() * 6.28;
        compose(o.p, yaw, sc, sc * (0.55 + rnd() * 0.9), sc);
        canopies.setMatrixAt(ti, M);
        const tone = greens[(rnd() * greens.length) | 0];
        col.setRGB(tone[0] + rnd() * 0.03, tone[1] + rnd() * 0.04, tone[2]);
        canopies.setColorAt(ti, col);
        canopies.userData.hh[ti] = o.hh;
        compose(o.p, yaw, sc * 0.85, sc * 0.85, sc * 0.85);
        trunks.setMatrixAt(ti, M);
        col.setRGB(0.36 + rnd() * 0.08, 0.22 + rnd() * 0.04, 0.09);
        trunks.setColorAt(ti, col);
        trunks.userData.hh[ti] = o.hh;
        ti++;
      }
    }
    canopies.count = ti; trunks.count = ti;
    const canopyMesh = finishInst(canopies);
    const trunkMesh = finishInst(trunks);
    if (canopyMesh) { canopyMesh.renderOrder = 5; root.add(canopyMesh); } else canopies.geometry.dispose();
    if (trunkMesh) { trunkMesh.renderOrder = 5; root.add(trunkMesh); } else trunks.geometry.dispose();

    // Generated block cities read as clumps on the satellite, so the sharp imagery stands on its own.
    // Rio keeps the hand-built model, which is loaded separately.
    let bi = 0, ri = 0, fi = 0, pi = 0;

    // rivers — Natural Earth courses already clipped to the continent (Amazon, Negro, Madeira, Orinoco, Paraná, Paraguay, Uruguay, São Francisco, Magdalena, …)
    if (false && maps.rivers) {
      const rpos = [], ruv = [], rhh = [], ridx = [];
      const bpos = [], buv = [], bhh = [], bidx = [];
      for (const rv of maps.rivers) {
        const raw = rv.p.map(p => [SA.lon0 + p[0] * (SA.lon1 - SA.lon0), SA.lat1 - p[1] * (SA.lat1 - SA.lat0)]);
        const line = [];
        for (let i = 0; i < raw.length; i++) {
          if (!line.length) { line.push(raw[i]); continue; }
          const a = line[line.length - 1], b = raw[i];
          const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const n = Math.min(30, Math.max(1, Math.ceil(dist / 0.018)));
          for (let k = 1; k <= n; k++) line.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
        }
        const pts = [];
        for (const [lon, lat] of line) {
          if (Math.abs(lon - ll.lon) > half + 0.35 || Math.abs(lat - ll.lat) > half + 0.35) { pts.push(null); continue; }
          const id = idAt(lon, lat);
          if (!isOn(id)) { pts.push(null); continue; }
          const [m] = maskInset(lon, lat, id);
          if (m < 0.22 || slope(lon, lat) > 0.045) { pts.push(null); continue; }
          pts.push(place(lon, lat, 0.00028));
        }
        let run = [];
        const flush = () => {
          if (run.length < 2) { run = []; return; }
          const w = 0.00016;
          let s = 0;
          const pushQuad = (pos, uv, hh, idx, a, b, c, d, ha, hb) => {
            const base = pos.length / 3;
            pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
            uv.push(s, 0, s, 1, s + 1, 1, s + 1, 0);
            hh.push(ha, ha, hb, hb);
            idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
          };
          for (let i = 0; i < run.length - 1; i++) {
            const p = run[i].p, q = run[i + 1].p;
            const step = q.clone().sub(p);
            const radial = p.clone().normalize();
            step.addScaledVector(radial, -step.dot(radial));
            const len = step.length();
            if (len < 1e-5 || len > 0.0012) continue;
            step.multiplyScalar(1 / len);
            const side = new THREE.Vector3().crossVectors(radial, step);
            if (side.lengthSq() < 1e-8) continue;
            side.normalize();
            const nw = side.clone().multiplyScalar(w), bw = side.clone().multiplyScalar(w * 2.3);
            const qrad = q.clone().normalize();
            const side2 = new THREE.Vector3().crossVectors(qrad, step);
            if (side2.dot(side) < 0) side2.negate();
            side2.normalize();
            const nw2 = side2.clone().multiplyScalar(w), bw2 = side2.clone().multiplyScalar(w * 2.3);
            pushQuad(bpos, buv, bhh, bidx, p.clone().sub(bw), p.clone().add(bw), q.clone().add(bw2), q.clone().sub(bw2), run[i].hh, run[i + 1].hh);
            pushQuad(rpos, ruv, rhh, ridx, p.clone().sub(nw), p.clone().add(nw), q.clone().add(nw2), q.clone().sub(nw2), run[i].hh, run[i + 1].hh);
            s += 1;
          }
          run = [];
        };
        let last = null;
        for (const p of pts) {
          if (!p || (last && Math.abs(p.hh - last.hh) > 0.06)) { flush(); last = null; if (!p) continue; }
          run.push(p); last = p;
        }
        flush();
      }
      // Steep ground turns this ribbon into shards, so the satellite water stands in for now.
      if (false && bidx.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(buv, 2));
        g.setAttribute('hh', new THREE.Float32BufferAttribute(bhh, 1));
        g.setIndex(bidx);
        const mesh = new THREE.Mesh(g, mats.bank);
        mesh.frustumCulled = false; mesh.renderOrder = 4;
        root.add(mesh);
      }
      if (false && ridx.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(rpos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
        g.setAttribute('hh', new THREE.Float32BufferAttribute(rhh, 1));
        g.setIndex(ridx);
        const mesh = new THREE.Mesh(g, mats.river);
        mesh.frustumCulled = false; mesh.renderOrder = 5;
        root.add(mesh);
      }
    }

    // lakes (Titicaca and the smaller painted lakes) — a sheet on the water mask, not the ocean
    {
      const step = Math.max(0.04, half / 28);
      const qpos = [], quv = [], qhh = [], qidx = [];
      let qi = 0;
      for (let lat = ll.lat - half; lat < ll.lat + half; lat += step) for (let lon = ll.lon - half; lon < ll.lon + half; lon += step) {
        let wet = 0;
        const corners = [[lon, lat], [lon + step, lat], [lon, lat + step], [lon + step, lat + step]];
        for (const [x, y] of corners) {
          const id = idAt(x, y);
          if (isOn(id) && waterAt(x, y) > 0.45) wet++;
        }
        if (wet < 4 || qi > 4000) continue;
        let wide = 0;
        for (const [dx, dy] of [[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1]]) if (waterAt(lon + dx, lat + dy) > 0.4) wide++;
        if (wide < 3) continue;
        const base = qi;
        for (const [x, y] of corners) {
          const o = place(x, y, 0.0002);
          qpos.push(o.p.x, o.p.y, o.p.z); quv.push(0, 0); qhh.push(o.hh); qi++;
        }
        qidx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
      if (false && qidx.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(qpos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(quv, 2));
        g.setAttribute('hh', new THREE.Float32BufferAttribute(qhh, 1));
        g.setIndex(qidx);
        const mesh = new THREE.Mesh(g, mats.lake);
        mesh.frustumCulled = false; mesh.renderOrder = 4; root.add(mesh);
      }
    }

    // thin coastal foam, only where placed land meets open ocean
    {
      const step = Math.max(0.05, half / 22);
      const fpos = [], fuv = [], fhh = [], fidx = [];
      let fi2 = 0;
      for (let lat = ll.lat - half; lat < ll.lat + half && fi2 < 900; lat += step) for (let lon = ll.lon - half; lon < ll.lon + half && fi2 < 900; lon += step) {
        const id = idAt(lon, lat);
        if (!isOn(id)) continue;
        const [m] = maskInset(lon, lat, id);
        if (m < 0.4) continue;
        let sx = 0, sy = 0, sea = false;
        for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
          if (idAt(lon + dx, lat + dy) === 0) { sea = true; sx += dx; sy += dy; }
        }
        if (!sea) continue;
        const len = Math.hypot(sx, sy) || 1; sx /= len; sy /= len;
        const o = place(lon + sx * step * 0.35, lat + sy * step * 0.35, 0.00012);
        basis(lon, lat, 0);
        const along = east.clone().multiplyScalar(-sy).addScaledVector(south, sx).normalize();
        const out = east.clone().multiplyScalar(sx).addScaledVector(south, sy).normalize();
        const hw = step * DEG * 0.55, thick = 0.012 * DEG;
        const c0 = o.p.clone().addScaledVector(along, -hw).addScaledVector(out, -thick * 0.2);
        const c1 = o.p.clone().addScaledVector(along, hw).addScaledVector(out, -thick * 0.2);
        const c2 = o.p.clone().addScaledVector(along, -hw).addScaledVector(out, thick);
        const c3 = o.p.clone().addScaledVector(along, hw).addScaledVector(out, thick);
        const base = fi2;
        for (const p of [c0, c1, c2, c3]) { fpos.push(p.x, p.y, p.z); fhh.push(0); }
        fuv.push(0, 0, 1, 0, 0, 1, 1, 1);
        fidx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        fi2 += 4;
      }
      if (false && fidx.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
        g.setAttribute('hh', new THREE.Float32BufferAttribute(fhh, 1));
        g.setIndex(fidx);
        const mesh = new THREE.Mesh(g, mats.foam);
        mesh.frustumCulled = false; mesh.renderOrder = 5; root.add(mesh);
      }
    }

    root.userData.stats = {
      trees: ti, buildings: bi, roads: ri, roofs: fi, figures: pi, forest: nForest, urban: nUrban, sat: grab ? 1 : 0,
      center: [Math.round(ll.lon * 100) / 100, Math.round(ll.lat * 100) / 100],
      cities: cities.map(c => ({ name: c.name, country: countryName(c.id), tier: c.tier, cap: !!c.cap }))
    };
    root.userData.rect = [ll.lon - half, ll.lat - half, ll.lon + half, ll.lat + half];
    return root;
  }

  function applyWin() {
    winOn.value = 0;
    const u = mats.patch.userData.u;
    u.br.value = isBrazil() ? 1 : 0;
    const rio = flags && flags.rio > 0.4 && flags.rioB;
    u.rioOn.value = rio ? flags.rio : 0;
    if (rio) u.rioB.value.set(flags.rioB[0], flags.rioB[1], flags.rioB[2], flags.rioB[3]);
    const rect = group && group.userData.rect;
    if (rect) {
      u.ctr.value.set((rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2);
      u.span.value = (rect[2] - rect[0]) / 2;
      const cLon = u.ctr.value.x, cLat = u.ctr.value.y;
      u.world.value = (cLon > -84 && cLon < -32 && cLat > -58 && cLat < 14) ? 0 : 1;
    }
    if (tiles && tiles.ready && tiles.box && tiles.tex) {
      u.sat.value = tiles.tex;
      u.satOn.value = 1;
      const b = tiles.box;
      u.satBox.value.set(b.lon0, b.lat0, b.lon1, b.lat1);
    } else u.satOn.value = 0;
  }

  function syncLive() {
    const vex = PU.vex.value, lift = PU.lift.value, t = U.t.value;
    for (const m of live) {
      const u = m.userData.u;
      if (!u) continue;
      u.vex.value = vex; u.lift.value = lift; u.t.value = t;
    }
  }

  function groundMix(ll) {
    if (!maps || !ll) return { forest: 0, water: 0, city: 0 };
    const id = idAt(ll.lon, ll.lat);
    const h = height01(ll.lon, ll.lat);
    const forest = isOn(id) ? forestAt(ll.lon, ll.lat, h) : 0;
    const water = isOn(id) ? waterAt(ll.lon, ll.lat) : 0;
    let city = 0;
    for (const c of CITIES) {
      if (!isOn(c.id)) continue;
      const d = Math.hypot(ll.lon - c.lon, ll.lat - c.lat);
      city = Math.max(city, Math.max(0, 1 - d / (c.tier === 'show' ? 0.35 : 0.18)));
    }
    return { forest, water, city };
  }

  function ensureAudio() {
    if (audio || !natureOn || muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const actx = new AC();
      const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < len; i++) { b = b * 0.985 + (Math.random() * 2 - 1) * 0.02; d[i] = b * 4 + (Math.random() * 2 - 1) * 0.015; }
      const loop = (type, freq) => {
        const s = actx.createBufferSource(); s.buffer = buf; s.loop = true;
        const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
        const g = actx.createGain(); g.gain.value = 0;
        s.connect(f).connect(g).connect(actx.destination); s.start();
        return g;
      };
      audio = { actx, leaves: loop('lowpass', 900), water: loop('lowpass', 380), city: loop('lowpass', 180) };
    } catch (e) { audio = null; }
  }
  function chirp() {
    if (!audio) return;
    try {
      const a = audio.actx, t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      const f0 = 1400 + Math.random() * 1800;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * (1.4 + Math.random() * 0.6), t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.24);
    } catch (e) {}
  }
  function mixAudio(w, ll) {
    if (!natureOn || muted || w < 0.35) {
      if (audio) {
        const t = audio.actx.currentTime;
        audio.leaves.gain.setTargetAtTime(0, t, 0.2);
        audio.water.gain.setTargetAtTime(0, t, 0.2);
        audio.city.gain.setTargetAtTime(0, t, 0.2);
      }
      return;
    }
    ensureAudio();
    if (!audio) return;
    if (audio.actx.state === 'suspended') audio.actx.resume().catch(() => {});
    const gnd = groundMix(ll);
    const t = audio.actx.currentTime;
    const k = Math.min(1, (w - 0.35) / 0.4);
    audio.leaves.gain.setTargetAtTime(k * gnd.forest * 0.09, t, 0.25);
    audio.water.gain.setTargetAtTime(k * Math.max(gnd.water, gnd.forest > 0.4 ? 0.15 : 0) * 0.1, t, 0.25);
    audio.city.gain.setTargetAtTime(k * gnd.city * 0.05, t, 0.3);
    if (gnd.forest > 0.35 && performance.now() > birdAt) { chirp(); birdAt = performance.now() + 1600 + Math.random() * 2800; }
  }

  function schedule(ll, span, rio) {
    const key = [Math.round(ll.lon * 2) / 2, Math.round(ll.lat * 2) / 2, Math.round(span * 2) / 2, placedMask(), rio ? 1 : 0, tiles && tiles.stamp ? tiles.stamp() : '0'].join(':');
    if (key === builtKey || key === pendingKey) return;
    pendingKey = key;
    const my = ++token;
    setTimeout(() => {
      if (my !== token) return;
      let root = null;
      try { root = build(ll, span, rio); }
      catch (e) { console.error(e); pendingKey = ''; return; }
      if (my !== token) { disposeGroup(root); return; }
      disposeGroup(group);
      group = root;
      if (group) G.add(group);
      builtKey = key;
      pendingKey = '';
      applyWin();
    }, 0);
  }

  function unload() {
    token++;
    pendingKey = '';
    builtKey = '';
    disposeGroup(group);
    group = null;
    winOn.value = 0;
  }

  function clearance(ll) {
    if (!maps || !ll || (flags && flags.city)) return;
    let h = 0;
    for (const [dx, dy] of [[0, 0], [0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08]]) h = Math.max(h, height01(ll.lon + dx, ll.lat + dy));
    const r = 1.5 + PU.lift.value + h * h * PU.vex.value + 0.0015;
    if (C.position.length() < r) C.position.setLength(r);
  }

  function update(alt) {
    if (alt > 0.12) {
      PU.vex.value = 0.03;
      if (group || pendingKey) unload();
      mixAudio(0, null);
      return 0;
    }
    const ll = viewLL();
    if (ll && inBox(ll) && anyOn() && alt < 0.11) ensureMaps();
    const w = reliefAt(alt);
    const oldV = 0.03 + (0.00113 - 0.03) * smooth(0.25, 0.04, alt);
    PU.vex.value = oldV * (1 - w) + VEX0 * w;
    syncLive();
    if (w > 0.55 && ll) {
      schedule(ll, spanFor(alt), false);
      if (group) applyWin();
      clearance(ll);
    } else if (w < 0.18) {
      if (group || pendingKey) unload();
    } else if (group) {
      applyWin();
    }
    mixAudio(w, ll);
    return w;
  }
  function smooth(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  addEventListener('pointerdown', () => { if (natureOn && !muted) ensureAudio(); }, { once: true });

  return {
    update, unload, viewLL, reliefAt,
    clear: unload,
    setNature(on) { natureOn = !!on; if (!natureOn) mixAudio(0, null); },
    setMuted(m) { muted = !!m; if (muted) mixAudio(0, null); },
    stats() {
      const s = group && group.userData.stats || {};
      return { active: !!group, loading: !!loading, maps: !!maps, ...s };
    }
  };
}
