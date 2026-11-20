// Close-up miniature for placed South American countries.
// One region at a time: trees, towns, rivers, lakes and a thin coast, dropped when you zoom out.
// Ground colour and elevation stay on the globe's existing painted meshes; this layer only adds the model.
import * as THREE from 'three';

const SAP = 'previews/south-america/';
const BRP = 'previews/brazil/';
const SA = { lon0: -82, lon1: -34, lat0: -56, lat1: 13 };
const BR = { lon0: -74.5, lon1: -34, lat0: -34.5, lat1: 5.8 };
const DEG = 1.5 * Math.PI / 180;
const VEX0 = 0.011, LIFT0 = 0.00002;
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
  const { G, C, O, PU, SU, U, SAN, isBrazil, flags, tiles } = api;
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
    rioOn: { value: 0 }, rioB: { value: new THREE.Vector4() }
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
      uniform sampler2D mapS, mapB, ids, sat;
      uniform vec4 bbS, bbB, satBox, rioB;
      uniform float on[16], br, rioOn, satOn;
      uniform vec3 sun;
      varying vec3 vWp; varying vec2 vLL;
      void main(){
        vec2 uvS=vec2((vLL.x-bbS.x)/(bbS.z-bbS.x),(vLL.y-bbS.y)/(bbS.w-bbS.y));
        float id=texture2D(ids, clamp(uvS,0.001,0.999)).r*255.0;
        int k=int(id+0.5);
        if(k==0) discard;
        if(k==3){ if(br<0.5) discard; }
        else if(on[k]<0.5) discard;
        if(rioOn>0.45 && vLL.x>rioB.x && vLL.x<rioB.z && vLL.y>rioB.y && vLL.y<rioB.w) discard;
        vec2 tuv=vec2((vLL.x-satBox.x)/(satBox.z-satBox.x),(vLL.y-satBox.y)/(satBox.w-satBox.y));
        vec3 raw;
        if(satOn>0.5 && tuv.x>0.0 && tuv.x<1.0 && tuv.y>0.0 && tuv.y<1.0) raw=texture2D(sat, tuv).rgb;
        else {
          vec2 uvB=vec2((vLL.x-bbB.x)/(bbB.z-bbB.x),(vLL.y-bbB.y)/(bbB.w-bbB.y));
          raw=k==3?texture2D(mapB, clamp(uvB,0.001,0.999)).rgb:texture2D(mapS, clamp(uvS,0.001,0.999)).rgb;
        }
        vec3 mp=pow(raw, vec3(2.2));
        float l=dot(mp, vec3(0.28,0.40,0.26));
        mp=mix(vec3(l), mp, 1.15);
        vec3 n=normalize(cross(dFdx(vWp), dFdy(vWp)));
        float nd=dot(n, normalize(sun));
        float hill=0.74+0.36*smoothstep(-0.25,0.8,nd);
        vec3 col=mp*hill;
        gl_FragColor=vec4(pow(col, vec3(1.0/2.2)), 1.0);
      }`
  });
  mats.patch.userData.u = patchU;
  mats.patch.side = THREE.DoubleSide;
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
    return Math.min(1.5, Math.max(0.32, deg * 0.72));
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
    if (!ll || !inBox(ll) || !anyOn()) return 0;
    if (!maps) return 0;
    if (!overPlaced(ll)) return 0;
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
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const lon = ll.lon + (i / N - 0.5) * 2 * half, lat = ll.lat + (j / N - 0.5) * 2 * half;
      const h = height01(lon, lat), hh = h * h;
      const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
      const r = 1.5 + LIFT0 + hh * VEX0 + 0.000045;
      pos.push(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
      uv.push(i / N, j / N); hhA.push(hh); llA.push(lon, lat);
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

    // trees — a trunk plus two canopy cones, packed so a real forest reads as continuous cover
    const TREES = 14000;
    const canopies = addInst(geos.canopy, mats.canopy, TREES);
    const trunks = addInst(geos.trunk, mats.trunk, TREES);
    let ti = 0;
    const step = Math.max(0.014, (2 * half) / 96);
    for (let lat = ll.lat - half; lat <= ll.lat + half && ti < TREES; lat += step) {
      for (let lon = ll.lon - half; lon <= ll.lon + half && ti < TREES; lon += step) {
        const jlon = lon + (rnd() - 0.5) * step * 0.65, jlat = lat + (rnd() - 0.5) * step * 0.65;
        const id = idAt(jlon, jlat);
        if (!isOn(id) || waterAt(jlon, jlat) > 0.28) continue;
        const [m, ins] = maskInset(jlon, jlat, id);
        if (m < 0.45 || ins < 0.22) continue;
        const h = height01(jlon, jlat);
        const f = forestAt(jlon, jlat, h);
        if (h > 0.62 || f < 0.48) continue;
        if (slope(jlon, jlat) > 0.62) continue;
        let inCity = false;
        for (const c of cities) if (Math.hypot(jlon - c.lon, (jlat - c.lat) * 1.05) < c.rad * 0.9) { inCity = true; break; }
        if (inCity) continue;
        if (rioCover && Math.hypot(jlon + 43.2, jlat + 22.9) < 0.36) continue;
        const o = basis(jlon, jlat, 0.00006);
        const sc = (0.00042 + rnd() * 0.00022) * (f > 0.55 ? 1.15 : 0.8) * (h > 0.5 ? 0.72 : 1);
        const yaw = rnd() * 6.28;
        compose(o.p, yaw, sc, sc * (0.85 + rnd() * 0.45), sc);
        canopies.setMatrixAt(ti, M);
        if (h > 0.5) col.setRGB(0.28 + rnd() * 0.08, 0.40 + rnd() * 0.08, 0.16);
        else if (lat > -12 && lon < -50 && h < 0.3) col.setRGB(0.10 + rnd() * 0.06, 0.40 + rnd() * 0.14, 0.08 + rnd() * 0.04);
        else col.setRGB(0.14 + rnd() * 0.08, 0.42 + rnd() * 0.12, 0.10 + rnd() * 0.05);
        canopies.setColorAt(ti, col);
        canopies.userData.hh[ti] = o.hh;
        compose(o.p, yaw, sc, sc, sc);
        trunks.setMatrixAt(ti, M);
        col.setRGB(0.38 + rnd() * 0.08, 0.24 + rnd() * 0.04, 0.10);
        trunks.setColorAt(ti, col);
        trunks.userData.hh[ti] = o.hh;
        ti++;
        if (f > 0.62 && ti < TREES && rnd() < 0.85) {
          const o2 = basis(jlon + (rnd() - 0.5) * step * 0.45, jlat + (rnd() - 0.5) * step * 0.45, 0.00006);
          const sc2 = sc * (0.65 + rnd() * 0.35);
          compose(o2.p, rnd() * 6, sc2, sc2 * (0.8 + rnd() * 0.4), sc2);
          canopies.setMatrixAt(ti, M);
          col.setRGB(0.12 + rnd() * 0.1, 0.36 + rnd() * 0.16, 0.08);
          canopies.setColorAt(ti, col); canopies.userData.hh[ti] = o2.hh;
          compose(o2.p, 0, sc2, sc2, sc2);
          trunks.setMatrixAt(ti, M);
          col.setRGB(0.36, 0.22, 0.09);
          trunks.setColorAt(ti, col); trunks.userData.hh[ti] = o2.hh;
          ti++;
        }
      }
    }
    canopies.count = ti; trunks.count = ti;
    const canopyMesh = finishInst(canopies);
    const trunkMesh = finishInst(trunks);
    if (canopyMesh) { canopyMesh.renderOrder = 5; root.add(canopyMesh); } else canopies.geometry.dispose();
    if (trunkMesh) { trunkMesh.renderOrder = 5; root.add(trunkMesh); } else trunks.geometry.dispose();

    // cities
    let bN = 0, rN = 0, fN = 0, pN = 0;
    for (const c of cities) {
      const n = c.tier === 'show' ? 22 : 12;
      bN += n * n * 4; rN += n * n * 2; fN += n * n; pN += c.tier === 'show' ? 80 : 16;
    }
    bN = Math.min(9000, bN); rN = Math.min(8000, rN); fN = Math.min(5000, fN); pN = Math.min(420, pN);
    const B = addInst(geos.box, mats.build, bN || 1);
    const RD = addInst(geos.road, mats.road, rN || 1);
    const RF = addInst(geos.roof, mats.roof, fN || 1);
    const FG = addInst(geos.fig, mats.fig, pN || 1);
    let bi = 0, ri = 0, fi = 0, pi = 0;
    const gDeg = DEG;
    for (const c of cities) {
      if (c.name === 'Rio de Janeiro') continue;
      const n = c.tier === 'show' ? 22 : 12;
      const g = c.rad / n;
      const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
      const P2 = (i, j) => [c.lon + (i * ca - j * sa) * g, c.lat + (i * sa + j * ca) * g];
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        const rr = Math.hypot(i, j) * g;
        if (rr > c.rad * (0.82 + rnd() * 0.18)) continue;
        const near = 1 - rr / c.rad;
        for (const [di, dj, rot] of [[0.5, 0, 0], [0, 0.5, 1]]) {
          if (ri >= rN) break;
          const [lon, lat] = P2(i + di, j + dj);
          const id = idAt(lon, lat);
          if (id !== c.id || waterAt(lon, lat) > 0.3) continue;
          const [m, ins] = maskInset(lon, lat, id);
          if (m < 0.5 || ins < 0.35 || slope(lon, lat) > 0.48) continue;
          const o = basis(lon, lat, 0.00016);
          const main = (rot ? i : j) % 5 === 0;
          const len = g * gDeg * 1.05, wid = g * gDeg * (main ? 0.34 : 0.2);
          compose(o.p, -c.ang - (rot ? Math.PI / 2 : 0), len, 1, wid);
          RD.setMatrixAt(ri, M);
          col.setRGB(main ? 0.62 : 0.55, main ? 0.56 : 0.5, main ? 0.46 : 0.4);
          RD.setColorAt(ri, col);
          RD.userData.hh[ri] = o.hh; ri++;
        }
        if (c.tier === 'show' && rr < g * 0.85) {
          if (pi < pN && rnd() < 0.8) {
            const [lon, lat] = P2(i + (rnd() - 0.5) * 0.3, j + (rnd() - 0.5) * 0.3);
            if (idAt(lon, lat) === c.id) {
              const o = basis(lon, lat, 0.00018);
              const hs = g * gDeg * 0.16;
              compose(o.p, rnd() * 6, hs * 0.35, hs, hs * 0.35);
              FG.setMatrixAt(pi, M);
              col.setHSL(rnd() * 0.12 + 0.02, 0.35 + rnd() * 0.3, 0.35 + rnd() * 0.2);
              FG.setColorAt(pi, col); FG.userData.hh[pi] = o.hh; pi++;
            }
          }
          continue;
        }
        const nb = (c.tier === 'show' ? 3 : 2) + (near > 0.45 && rnd() < 0.5 ? 1 : 0);
        for (let b = 0; b < nb && bi < bN; b++) {
          const [lon, lat] = P2(i + 0.5 + (rnd() - 0.5) * 0.55, j + 0.5 + (rnd() - 0.5) * 0.55);
          const id = idAt(lon, lat);
          if (id !== c.id || waterAt(lon, lat) > 0.28) continue;
          const [m, ins] = maskInset(lon, lat, id);
          if (m < 0.5 || ins < 0.38) continue;
          const sl = slope(lon, lat);
          if (sl > 0.5) continue;
          const o = basis(lon, lat, 0.00004);
          const cell = g * gDeg;
          const tall = c.tier === 'show' && near > 0.55 && rnd() < 0.55 && sl < 0.2;
          const tower = c.tier === 'show' && near > 0.78 && rnd() < 0.7 && sl < 0.15;
          const hg = tower ? cell * (2.4 + rnd() * 2.2) : tall ? cell * (1.1 + rnd() * 1.3) : cell * (0.32 + rnd() * 0.38);
          const wd = cell * (tower ? 0.22 + rnd() * 0.08 : 0.34 + rnd() * 0.16);
          const dp = cell * (tower ? 0.22 + rnd() * 0.08 : 0.30 + rnd() * 0.14);
          compose(o.p, -c.ang, wd, hg, dp);
          B.setMatrixAt(bi, M);
          if (tower) col.setRGB(0.78 + rnd() * 0.12, 0.82 + rnd() * 0.1, 0.86 + rnd() * 0.08);
          else if (tall) col.setRGB(0.86 + rnd() * 0.08, 0.84 + rnd() * 0.06, 0.78 + rnd() * 0.06);
          else if (rnd() < 0.55) col.setRGB(0.94, 0.90, 0.80);
          else col.setRGB(0.90 + rnd() * 0.06, 0.86 + rnd() * 0.06, 0.76);
          B.setColorAt(bi, col); B.userData.hh[bi] = o.hh; bi++;
          if (!tower && fi < fN && rnd() < 0.86) {
            const top = o.p.clone().addScaledVector(up, hg);
            const rh = Math.min(wd, dp) * (0.55 + rnd() * 0.25);
            compose(top, -c.ang, wd * 1.08, rh, dp * 1.08);
            RF.setMatrixAt(fi, M);
            const hue = rnd() < 0.7 ? 0.02 + rnd() * 0.03 : 0.07 + rnd() * 0.04;
            col.setHSL(hue, 0.62 + rnd() * 0.15, 0.40 + rnd() * 0.08);
            RF.setColorAt(fi, col); RF.userData.hh[fi] = o.hh; fi++;
          }
          if (c.tier === 'show' && pi < pN && near > 0.25 && rnd() < 0.08) {
            const [x, z] = P2(i + (rnd() - 0.5), j + (rnd() - 0.5));
            if (idAt(x, z) === c.id && waterAt(x, z) < 0.3) {
              const q = basis(x, z, 0.00018);
              const hs = cell * 0.13;
              compose(q.p, rnd() * 6, hs * 0.32, hs, hs * 0.32);
              FG.setMatrixAt(pi, M);
              col.setHSL(rnd(), 0.35 + rnd() * 0.3, 0.32 + rnd() * 0.25);
              FG.setColorAt(pi, col); FG.userData.hh[pi] = q.hh; pi++;
            }
          }
        }
      }
    }
    for (const [mesh, n, order] of [[B, bi, 5], [RD, ri, 4], [RF, fi, 5], [FG, pi, 6]]) {
      mesh.count = n;
      const m = finishInst(mesh);
      if (m) { m.renderOrder = order; root.add(m); }
      else mesh.geometry.dispose();
    }

    // rivers — Natural Earth courses already clipped to the continent (Amazon, Negro, Madeira, Orinoco, Paraná, Paraguay, Uruguay, São Francisco, Magdalena, …)
    if (maps.rivers) {
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
      const nearLake = Math.hypot(ll.lon + 69.2, ll.lat + 16) < 1.4;
      if (nearLake && qidx.length) {
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
      if (fidx.length) {
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
      trees: ti, buildings: bi, roads: ri, roofs: fi, figures: pi,
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
    const key = [Math.round(ll.lon * 2) / 2, Math.round(ll.lat * 2) / 2, Math.round(span * 2) / 2, placedMask(), rio ? 1 : 0].join(':');
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
    const ll = viewLL();
    if (ll && inBox(ll) && anyOn() && alt < 0.11) ensureMaps();
    const w = reliefAt(alt);
    const oldV = 0.03 + (0.00113 - 0.03) * smooth(0.25, 0.04, alt);
    PU.vex.value = oldV * (1 - w) + VEX0 * w;
    syncLive();
    if (w > 0.55 && maps && ll) {
      schedule(ll, spanFor(alt), !!(flags && flags.rio));
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
