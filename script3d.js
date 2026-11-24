import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

const stage = document.getElementById("planStage");
const host = document.getElementById("planCanvas");

if (stage && host) init();

function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  stage.classList.add("is-loading");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.warn("AIRE 3D: WebGL недоступен", error);
    stage.classList.remove("is-loading");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);

  const views = {
    overview: { pos: [17.2, 13.6, 17.8], target: [6.5, 0.8, 5.0] },
    overviewMobile: { pos: [18.4, 25.0, 17.2], target: [6.6, 0.4, 5.2] },
    living: { pos: [2.6, 7.2, 14.2], target: [2.8, 0.55, 5.2] },
    bedrooms: { pos: [16.4, 9.2, 11.6], target: [9.8, 0.5, 4.2] },
    bath: { pos: [15.0, 8.5, 12.0], target: [8.2, 0.2, 7.4] },
    terrace: { pos: [7.0, 5.2, 16.2], target: [2.9, 0.35, 9.2] },
  };

  function viewFor(name) {
    if (name === "overview" && host.clientWidth / host.clientHeight < 1.15) {
      return views.overviewMobile;
    }
    return views[name] || views.overview;
  }

  camera.position.fromArray(viewFor("overview").pos);
  controls.target.fromArray(viewFor("overview").target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 34;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = 1.34;
  controls.autoRotateSpeed = 0.55;
  controls.update();

  /* ---------- Свет ---------- */

  scene.add(new THREE.HemisphereLight(0xdce9fa, 0x2b3542, 1.5));

  const key = new THREE.DirectionalLight(0xfff2df, 2.7);
  key.position.set(9, 18, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -13;
  key.shadow.camera.right = 13;
  key.shadow.camera.top = 13;
  key.shadow.camera.bottom = -13;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 45;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xa9c8ec, 0.85);
  fill.position.set(-10, 9, -7);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.45);
  rim.position.set(-3, 7, 16);
  scene.add(rim);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.26 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.46;
  shadow.receiveShadow = true;
  scene.add(shadow);

  /* ---------- Текстуры ---------- */

  function woodTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    const tones = ["#b98d5f", "#af8355", "#c09566", "#b3885a", "#a97e52"];
    ctx.fillStyle = "#b3885a";
    ctx.fillRect(0, 0, 512, 512);
    let x = 0;
    let i = 0;
    while (x < 512) {
      const w = 54 + ((i * 37) % 46);
      ctx.fillStyle = tones[i % tones.length];
      ctx.fillRect(x, 0, w, 512);
      ctx.fillStyle = "rgba(58, 39, 24, 0.22)";
      ctx.fillRect(x, 0, 1.5, 512);
      ctx.fillStyle = "rgba(255, 240, 220, 0.06)";
      ctx.fillRect(x + 2, 0, 2, 512);
      for (let g = 0; g < 5; g++) {
        ctx.strokeStyle = "rgba(80, 52, 30, 0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gx = x + 8 + ((g * 53 + i * 17) % Math.max(10, w - 16));
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + 8, 170, gx - 7, 330, gx + 4, 512);
        ctx.stroke();
      }
      x += w;
      i++;
    }
    ctx.strokeStyle = "rgba(55, 36, 20, 0.2)";
    ctx.lineWidth = 1.4;
    [170, 340].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.6, 3.2);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  function tileTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#d9d7d0";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(120, 118, 110, 0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  /* ---------- Материалы ---------- */

  const M = {
    oakFloor: new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.66 }),
    bedroomFloor: new THREE.MeshStandardMaterial({ color: 0xc8c1b4, roughness: 0.95 }),
    hallFloor: new THREE.MeshStandardMaterial({ color: 0xcfc8ba, roughness: 0.75 }),
    bathFloor: new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.92 }),
    wallCap: new THREE.MeshStandardMaterial({ color: 0xcfc7b9, roughness: 0.85 }),
    slab: new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.9 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x0d1728, roughness: 0.62, metalness: 0.18 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x243750, roughness: 0.96 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: 0.95 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xd9d1c3, roughness: 0.92 }),
    oak: new THREE.MeshStandardMaterial({ color: 0x8b6644, roughness: 0.74 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.82 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.34, metalness: 0.78 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08d5a, roughness: 0.34, metalness: 0.82 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xbfd9ea,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    sheer: new THREE.MeshStandardMaterial({
      color: 0xe9e4da,
      transparent: true,
      opacity: 0.34,
      roughness: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    navy: new THREE.MeshStandardMaterial({ color: 0x1c3049, roughness: 0.8 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x2f5d8a, roughness: 0.7 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.58 }),
    black: new THREE.MeshStandardMaterial({ color: 0x171a1f, roughness: 0.5 }),
    screen: new THREE.MeshStandardMaterial({
      color: 0x080d15,
      roughness: 0.24,
      metalness: 0.45,
      emissive: 0x0b1b2c,
      emissiveIntensity: 0.5,
    }),
    green: new THREE.MeshStandardMaterial({ color: 0x4d6b53, roughness: 0.9 }),
    greenDark: new THREE.MeshStandardMaterial({ color: 0x35503c, roughness: 0.9 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0x9c6a4c, roughness: 0.9 }),
    water: new THREE.MeshStandardMaterial({ color: 0xaec9d6, roughness: 0.18, metalness: 0.1 }),
    rug: new THREE.MeshStandardMaterial({ color: 0xcac2b3, roughness: 1 }),
    rugBlue: new THREE.MeshStandardMaterial({ color: 0x536a86, roughness: 1 }),
    art1: new THREE.MeshStandardMaterial({ color: 0x24405f, roughness: 0.9 }),
    art2: new THREE.MeshStandardMaterial({ color: 0xb7a98f, roughness: 0.9 }),
  };

  const model = new THREE.Group();
  scene.add(model);

  /* ---------- Хелперы ---------- */

  function box(parent, w, h, d, x, y, z, mat, ry = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (ry) mesh.rotation.y = ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cyl(parent, rt, rb, h, x, y, z, mat, seg = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function plane(parent, w, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const WALL_H = 1.12;

  function wallX(x1, x2, z, mat = M.wall, t = 0.12, h = WALL_H) {
    const w = x2 - x1;
    if (w <= 0) return;
    box(model, w, h, t, (x1 + x2) / 2, h / 2, z, mat);
    box(model, w, 0.035, t + 0.02, (x1 + x2) / 2, h + 0.017, z, M.wallCap);
  }

  function wallZ(z1, z2, x, mat = M.wall, t = 0.12, h = WALL_H) {
    const d = z2 - z1;
    if (d <= 0) return;
    box(model, t, h, d, x, h / 2, (z1 + z2) / 2, mat);
    box(model, t + 0.02, 0.035, d, x, h + 0.017, (z1 + z2) / 2, M.wallCap);
  }

  function post(x, z, t = 0.06) {
    box(model, t, WALL_H + 0.05, t, x, (WALL_H + 0.05) / 2, z, M.oak);
  }

  /* ---------- Полы и основание ---------- */

  box(model, 12.8, 0.18, 8.4, 6.4, -0.09, 4.2, M.slab);
  box(model, 13.2, 0.28, 11.0, 6.4, -0.32, 5.2, M.plinth);

  plane(model, 6.2, 8.4, 3.1, 0.006, 4.2, M.oakFloor);
  plane(model, 1.0, 5.8, 5.7, 0.014, 5.5, M.hallFloor);
  plane(model, 6.6, 1.0, 9.5, 0.014, 3.1, M.hallFloor);
  plane(model, 6.6, 2.6, 9.5, 0.01, 1.3, M.bedroomFloor);
  plane(model, 3.2, 3.0, 7.8, 0.01, 5.1, M.bedroomFloor);
  plane(model, 3.4, 3.0, 11.1, 0.01, 5.1, M.bedroomFloor);
  plane(model, 3.2, 1.8, 7.8, 0.012, 7.5, M.bathFloor);
  plane(model, 3.4, 1.8, 11.1, 0.01, 7.5, M.oakFloor);

  /* ---------- Терраса ---------- */

  box(model, 5.2, 0.12, 2.0, 3.0, -0.06, 9.4, M.darkWood);
  const deckTones = [M.oak, M.darkWood, M.oak];
  for (let i = 0; i < 15; i++) {
    box(model, 0.32, 0.035, 2.0, 0.55 + i * 0.35, 0.018, 9.4, deckTones[i % 3]);
  }
  box(model, 5.2, 0.94, 0.025, 3.0, 0.5, 10.4, M.glass).castShadow = false;
  box(model, 5.24, 0.05, 0.06, 3.0, 1.0, 10.4, M.metal);
  box(model, 0.025, 0.94, 2.0, 0.4, 0.5, 9.4, M.glass).castShadow = false;
  box(model, 0.025, 0.94, 2.0, 5.6, 0.5, 9.4, M.glass).castShadow = false;
  [0.4, 1.7, 3.0, 4.3, 5.6].forEach((x) => post(x, 10.4, 0.05));
  post(0.4, 9.4, 0.05);
  post(5.6, 9.4, 0.05);

  /* ---------- Стены ---------- */

  wallX(0, 12.8, 0.1, M.wall, 0.2);
  wallZ(0, 8.4, 0.1, M.wall, 0.2);
  wallZ(0, 8.4, 12.7, M.wall, 0.2);
  wallX(6.1, 12.8, 8.3, M.wall, 0.2);
  wallZ(4.0, 8.4, 5.2);
  wallZ(0, 2.6, 6.2);
  wallX(6.2, 7.0, 2.6);
  wallX(7.9, 12.8, 2.6);
  wallX(6.2, 7.2, 3.6);
  wallX(8.1, 10.6, 3.6);
  wallX(11.5, 12.8, 3.6);
  wallZ(3.6, 6.6, 9.4);
  wallX(6.2, 10.0, 6.6);
  wallX(10.9, 12.8, 6.6);
  wallZ(3.6, 4.2, 6.2);
  wallZ(5.1, 6.6, 6.2);
  wallZ(6.6, 7.2, 6.2);
  wallZ(8.1, 8.4, 6.2);

  [5.3, 6.1].forEach((x) => post(x, 8.3));
  [7.0, 7.9].forEach((x) => post(x, 2.6));
  [7.2, 8.1, 10.6, 11.5].forEach((x) => post(x, 3.6));
  [7.2, 8.1].forEach((z) => post(6.2, z));
  [10.0, 10.9].forEach((x) => post(x, 6.6));

  /* ---------- Стеклянная стена ---------- */

  box(model, 5.2, 2.5, 0.025, 2.6, 1.25, 8.3, M.glass).castShadow = false;
  box(model, 5.2, 0.06, 0.07, 2.6, 0.03, 8.3, M.metal);
  box(model, 5.2, 0.06, 0.07, 2.6, 2.5, 8.3, M.metal);
  [0.04, 1.3, 2.6, 3.9, 5.16].forEach((x) => box(model, 0.05, 2.5, 0.07, x, 1.25, 8.3, M.metal));
  box(model, 0.42, 2.35, 0.02, 0.5, 1.18, 8.16, M.sheer).castShadow = false;
  box(model, 0.42, 2.35, 0.02, 4.7, 1.18, 8.16, M.sheer).castShadow = false;

  /* ---------- Кухня-гостиная ---------- */

  const kitchen = new THREE.Group();
  model.add(kitchen);
  box(kitchen, 2.7, 0.9, 0.6, 1.75, 0.45, 0.4, M.cream);
  box(kitchen, 2.82, 0.06, 0.66, 1.75, 0.93, 0.4, M.white);
  box(kitchen, 0.56, 0.02, 0.36, 1.15, 0.965, 0.4, M.metal);
  cyl(kitchen, 0.025, 0.025, 0.32, 1.15, 1.12, 0.24, M.brass, 12);
  box(kitchen, 0.24, 0.03, 0.03, 1.28, 1.26, 0.24, M.brass);
  box(kitchen, 0.7, 2.25, 0.64, 3.2, 1.125, 0.42, M.oak);
  box(kitchen, 0.7, 0.02, 0.64, 3.2, 2.26, 0.42, M.metal);
  box(kitchen, 0.018, 1.6, 0.02, 3.0, 1.2, 0.75, M.metal);
  box(kitchen, 0.02, 0.02, 0.14, 2.93, 1.25, 0.75, M.brass);
  box(kitchen, 0.02, 0.02, 0.14, 3.07, 1.25, 0.75, M.brass);

  box(kitchen, 1.9, 0.88, 0.9, 2.1, 0.44, 2.3, M.navy);
  box(kitchen, 2.0, 0.06, 1.0, 2.1, 0.92, 2.3, M.white);
  box(kitchen, 0.6, 0.02, 0.4, 2.1, 0.955, 2.3, M.metal);
  [1.35, 2.1, 2.85].forEach((x) => {
    cyl(kitchen, 0.17, 0.17, 0.05, x, 0.68, 3.0, M.cream);
    cyl(kitchen, 0.025, 0.025, 0.62, x, 0.34, 3.0, M.metal, 10);
  });

  const dining = new THREE.Group();
  model.add(dining);
  box(dining, 1.65, 0.07, 0.92, 4.35, 0.74, 2.2, M.oak);
  [[3.65, 1.83], [5.05, 1.83], [3.65, 2.57], [5.05, 2.57]].forEach(([x, z]) => {
    cyl(dining, 0.035, 0.035, 0.72, x, 0.36, z, M.metal, 10);
  });
  function chair(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    dining.add(g);
    box(g, 0.44, 0.05, 0.44, 0, 0.46, 0, M.cream);
    box(g, 0.44, 0.48, 0.05, 0, 0.7, -0.2, M.oak);
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([cx, cz]) => {
      box(g, 0.035, 0.46, 0.035, cx, 0.23, cz, M.metal);
    });
  }
  chair(3.9, 1.45, Math.PI);
  chair(4.8, 1.45, Math.PI);
  chair(3.9, 2.95, 0);
  chair(4.8, 2.95, 0);

  const sofa = new THREE.Group();
  sofa.position.set(1.0, 0, 6.0);
  sofa.rotation.y = Math.PI / 2;
  model.add(sofa);
  box(sofa, 2.35, 0.3, 0.95, 0, 0.17, 0, M.sofa);
  box(sofa, 2.35, 0.52, 0.2, 0, 0.47, -0.38, M.sofa);
  box(sofa, 0.18, 0.44, 0.9, -1.08, 0.4, 0, M.sofa);
  box(sofa, 0.18, 0.44, 0.9, 1.08, 0.4, 0, M.sofa);
  box(sofa, 1.0, 0.16, 0.72, -0.52, 0.39, 0.06, M.linen);
  box(sofa, 1.0, 0.16, 0.72, 0.52, 0.39, 0.06, M.linen);
  box(sofa, 0.34, 0.34, 0.12, -0.56, 0.56, -0.18, M.cream).rotation.z = 0.16;
  box(sofa, 0.34, 0.34, 0.12, 0.56, 0.56, -0.18, M.rugBlue).rotation.z = -0.12;
  [[-0.95, -0.3], [0.95, -0.3], [-0.95, 0.3], [0.95, 0.3]].forEach(([x, z]) => {
    cyl(sofa, 0.025, 0.025, 0.12, x, 0.06, z, M.metal, 8);
  });

  plane(model, 3.2, 2.3, 2.8, 0.02, 6.0, M.rug);
  box(model, 1.2, 0.05, 0.65, 2.6, 0.37, 6.0, M.oak);
  [[2.15, 5.75], [3.05, 5.75], [2.15, 6.25], [3.05, 6.25]].forEach(([x, z]) => {
    cyl(model, 0.022, 0.022, 0.35, x, 0.18, z, M.metal, 8);
  });
  box(model, 0.34, 0.035, 0.24, 2.4, 0.42, 5.92, M.art2);
  box(model, 0.26, 0.05, 0.2, 2.88, 0.43, 6.1, M.rugBlue);

  const media = new THREE.Group();
  media.position.set(4.95, 0, 6.0);
  media.rotation.y = -Math.PI / 2;
  model.add(media);
  box(media, 1.8, 0.42, 0.42, 0, 0.21, 0, M.darkWood);
  box(media, 0.018, 0.3, 0.34, -0.55, 0.22, 0.06, M.metal);
  box(media, 1.35, 0.76, 0.06, 0, 0.97, 0.02, M.black);
  box(media, 1.28, 0.69, 0.012, 0, 0.97, 0.055, M.screen);

  const arm = new THREE.Group();
  arm.position.set(4.05, 0, 7.35);
  arm.rotation.y = -Math.PI / 4;
  model.add(arm);
  box(arm, 0.78, 0.26, 0.8, 0, 0.15, 0, M.rugBlue);
  box(arm, 0.78, 0.52, 0.18, 0, 0.42, -0.31, M.rugBlue);
  box(arm, 0.14, 0.34, 0.7, -0.32, 0.32, 0, M.rugBlue);
  box(arm, 0.14, 0.34, 0.7, 0.32, 0.32, 0, M.rugBlue);
  box(arm, 0.58, 0.12, 0.56, 0, 0.31, 0.04, M.cream);

  function plant(x, z, s = 1, parent = model) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    parent.add(g);
    cyl(g, 0.18, 0.14, 0.34, 0, 0.17, 0, M.terracotta, 16);
    cyl(g, 0.022, 0.03, 0.72, 0, 0.7, 0, M.greenDark, 8);
    [[0, 1.12, 0, 0.24], [-0.16, 0.98, 0.06, 0.18], [0.15, 1.02, -0.05, 0.2], [0.04, 1.24, 0.02, 0.16]].forEach(
      ([px, py, pz, r]) => {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), M.green);
        leaf.position.set(px, py, pz);
        leaf.castShadow = true;
        g.add(leaf);
      }
    );
  }

  plant(4.65, 7.85, 1.1);
  plant(0.45, 3.6, 0.85);

  function floorLamp(x, z) {
    cyl(model, 0.16, 0.2, 0.03, x, 0.015, z, M.metal, 20);
    cyl(model, 0.018, 0.018, 1.55, x, 0.78, z, M.metal, 8);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 20, 1, true), M.linen);
    shade.position.set(x, 1.58, z);
    shade.rotation.x = Math.PI;
    shade.castShadow = true;
    model.add(shade);
    const light = new THREE.PointLight(0xffd7a4, 5, 3.6, 2);
    light.position.set(x, 1.5, z);
    model.add(light);
  }
  floorLamp(0.55, 7.7);

  function pendant(x, z, y = 2.05) {
    cyl(model, 0.008, 0.008, 1.05, x, y + 0.52, z, M.metal, 6);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.24, 24, 1, true), M.brass);
    shade.position.set(x, y, z);
    shade.castShadow = true;
    model.add(shade);
    const light = new THREE.PointLight(0xffd6a0, 4, 3.2, 2);
    light.position.set(x, y - 0.08, z);
    model.add(light);
  }
  pendant(2.1, 2.3, 2.1);
  pendant(4.35, 2.2, 1.95);

  /* ---------- Спальня 1 ---------- */

  function bed(x, z, w, l, ry = 0, parent = model) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    parent.add(g);
    box(g, w + 0.12, 0.28, l + 0.1, 0, 0.16, 0, M.cream);
    box(g, w, 0.24, l, 0, 0.36, 0, M.linen);
    box(g, w + 0.24, 0.85, 0.09, 0, 0.55, -l / 2 - 0.05, M.oak);
    box(g, w + 0.06, 0.08, l * 0.68, 0, 0.5, 0.16, M.cream);
    box(g, w * 0.42, 0.12, 0.34, -w * 0.23, 0.53, -l / 2 + 0.36, M.white);
    box(g, w * 0.42, 0.12, 0.34, w * 0.23, 0.53, -l / 2 + 0.36, M.white);
    box(g, w + 0.02, 0.05, 0.55, 0, 0.55, l / 2 - 0.4, M.rugBlue);
    [[-w / 2 + 0.12, -l / 2 + 0.1], [w / 2 - 0.12, -l / 2 + 0.1], [-w / 2 + 0.12, l / 2 - 0.1], [w / 2 - 0.12, l / 2 - 0.1]].forEach(
      ([lx, lz]) => box(g, 0.05, 0.1, 0.05, lx, 0.05, lz, M.metal)
    );
    return g;
  }

  plane(model, 3.2, 2.4, 9.5, 0.018, 1.35, M.rug);
  bed(9.5, 1.35, 1.8, 2.0);
  [8.4, 10.6].forEach((x) => {
    box(model, 0.48, 0.44, 0.42, x, 0.22, 0.45, M.oak);
    cyl(model, 0.11, 0.13, 0.24, x, 0.55, 0.45, M.brass, 16);
    cyl(model, 0.14, 0.14, 0.2, x, 0.7, 0.45, M.linen, 16);
  });
  box(model, 1.5, 0.38, 0.42, 9.5, 0.19, 2.42, M.rugBlue);
  box(model, 0.56, 2.3, 2.1, 12.35, 1.15, 1.25, M.oak);
  box(model, 0.018, 1.95, 0.018, 12.06, 1.2, 1.25, M.metal);
  [0.7, 1.25, 1.8].forEach((z) => cyl(model, 0.018, 0.018, 0.16, 12.04, 1.2, z, M.brass, 8));
  box(model, 1.2, 0.58, 0.04, 9.5, 0.72, 0.22, M.art1);
  box(model, 0.3, 0.38, 0.03, 9.15, 0.66, 0.25, M.art2);

  /* ---------- Спальня 2 ---------- */

  plane(model, 2.8, 2.4, 7.9, 0.018, 5.0, M.rugBlue);
  bed(7.6, 5.0, 1.6, 2.0, Math.PI / 2);
  box(model, 0.45, 0.42, 0.4, 6.45, 0.21, 4.0, M.oak);
  cyl(model, 0.1, 0.12, 0.22, 6.45, 0.53, 4.0, M.brass, 16);
  box(model, 1.2, 0.5, 0.5, 8.55, 0.25, 6.25, M.oak);
  box(model, 0.4, 0.44, 0.4, 8.55, 0.22, 5.85, M.cream);
  box(model, 1.1, 0.42, 0.04, 8.55, 0.7, 6.48, M.art2);
  box(model, 0.35, 0.26, 0.03, 8.3, 0.7, 6.46, M.art1);
  box(model, 0.03, 0.58, 1.1, 6.25, 0.7, 5.0, M.art1);

  /* ---------- Спальня 3 ---------- */

  plane(model, 2.6, 2.2, 11.2, 0.018, 5.0, M.rug);
  bed(11.7, 5.0, 1.4, 2.0, -Math.PI / 2);
  box(model, 0.42, 0.4, 0.38, 12.35, 0.2, 4.0, M.oak);
  cyl(model, 0.09, 0.11, 0.2, 12.35, 0.5, 4.0, M.brass, 16);
  box(model, 1.1, 0.48, 0.48, 10.35, 0.24, 3.85, M.oak);
  box(model, 0.4, 0.42, 0.4, 10.35, 0.21, 4.25, M.cream);
  box(model, 0.03, 0.56, 1.0, 12.72, 0.7, 5.0, M.art2);

  /* ---------- Санузел ---------- */

  box(model, 0.78, 0.55, 1.6, 8.95, 0.28, 7.5, M.white);
  box(model, 0.62, 0.06, 1.4, 8.95, 0.52, 7.5, M.water);
  box(model, 1.25, 0.84, 0.5, 7.1, 0.42, 6.9, M.oak);
  box(model, 1.28, 0.05, 0.52, 7.1, 0.87, 6.9, M.white);
  cyl(model, 0.18, 0.15, 0.1, 7.1, 0.92, 6.9, M.white, 20);
  cyl(model, 0.02, 0.02, 0.28, 7.1, 1.05, 6.72, M.brass, 10);
  box(model, 0.9, 0.7, 0.03, 7.1, 1.32, 6.68, M.glass).castShadow = false;
  box(model, 0.42, 0.42, 0.62, 6.55, 0.21, 8.0, M.white);
  box(model, 0.36, 0.5, 0.16, 6.55, 0.55, 8.18, M.white);
  cyl(model, 0.17, 0.15, 0.06, 6.55, 0.43, 7.95, M.white, 18);
  box(model, 0.04, 0.03, 0.5, 9.25, 1.0, 7.5, M.brass);

  /* ---------- Гардеробная ---------- */

  box(model, 0.5, 2.2, 1.6, 12.5, 1.1, 7.5, M.oak);
  box(model, 0.44, 1.5, 1.5, 9.7, 0.75, 7.5, M.cream);
  box(model, 0.04, 0.04, 1.4, 12.18, 1.55, 7.5, M.brass);
  [7.0, 7.5, 8.0].forEach((z) => box(model, 0.16, 0.26, 0.04, 12.14, 1.35, z, M.linen));
  box(model, 1.1, 0.42, 0.4, 11.0, 0.21, 7.9, M.rugBlue);

  /* ---------- Прихожая ---------- */

  box(model, 0.3, 0.8, 1.15, 5.98, 0.4, 5.3, M.oak);
  box(model, 0.03, 0.75, 0.9, 6.12, 1.32, 5.3, M.glass).castShadow = false;
  box(model, 0.06, 0.06, 0.14, 5.98, 0.85, 5.1, M.brass);
  plant(5.95, 7.8, 0.7);
  plane(model, 0.9, 0.6, 5.7, 0.03, 7.9, M.rugBlue);

  /* ---------- Терраса: мебель ---------- */

  function lounger(x, z, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    model.add(g);
    box(g, 0.7, 0.12, 1.55, 0, 0.32, 0, M.oak);
    box(g, 0.66, 0.1, 0.9, 0, 0.41, 0.3, M.cream);
    const back = box(g, 0.66, 0.1, 0.62, 0, 0.55, -0.5, M.cream);
    back.rotation.x = -0.62;
    [[-0.3, -0.65], [0.3, -0.65], [-0.3, 0.65], [0.3, 0.65]].forEach(([lx, lz]) => {
      box(g, 0.04, 0.3, 0.04, lx, 0.16, lz, M.metal);
    });
  }
  lounger(1.4, 9.5, 0);
  lounger(2.5, 9.5, 0);
  cyl(model, 0.24, 0.24, 0.04, 3.5, 0.4, 9.5, M.oak, 20);
  cyl(model, 0.02, 0.02, 0.4, 3.5, 0.2, 9.5, M.metal, 8);
  box(model, 0.8, 0.45, 0.4, 4.9, 0.22, 9.9, M.terracotta);
  plant(4.9, 9.9, 0.8);
  box(model, 0.8, 0.45, 0.4, 0.7, 0.22, 9.9, M.terracotta);
  plant(0.7, 9.9, 0.7);

  /* ---------- Контур основания ---------- */

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(13.2, 0.28, 11.0)),
    new THREE.LineBasicMaterial({ color: 0x3b5a7c, transparent: true, opacity: 0.55 })
  );
  edge.position.set(6.4, -0.32, 5.2);
  model.add(edge);

  /* ---------- Камера и взаимодействие ---------- */

  let fly = null;

  function flyTo(name) {
    const v = viewFor(name);
    fly = {
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3().fromArray(v.pos),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3().fromArray(v.target),
      start: performance.now(),
      dur: reduceMotion ? 0 : 850,
    };
    controls.autoRotate = false;
    syncAuto();
  }

  const chips = Array.from(document.querySelectorAll(".plan__chip"));
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      flyTo(chip.dataset.view);
    });
  });

  const reset = document.getElementById("planReset");
  if (reset) {
    reset.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.view === "overview"));
      flyTo("overview");
    });
  }

  const autoBtn = document.getElementById("planAuto");
  function syncAuto() {
    if (!autoBtn) return;
    autoBtn.classList.toggle("is-active", controls.autoRotate);
    autoBtn.setAttribute("aria-pressed", String(controls.autoRotate));
  }
  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      controls.autoRotate = !controls.autoRotate;
      syncAuto();
    });
  }

  const fullBtn = document.getElementById("planFull");
  if (fullBtn) {
    fullBtn.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        stage.requestFullscreen?.();
      }
    });
    document.addEventListener("fullscreenchange", () => {
      fullBtn.textContent = document.fullscreenElement ? "⤡" : "⤢";
      fullBtn.setAttribute("aria-label", document.fullscreenElement ? "Выйти из полноэкранного режима" : "Открыть на весь экран");
      resize();
    });
  }

  /* ---------- Рендер ---------- */

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { threshold: 0.02 }
    ).observe(stage);
  }

  renderer.render(scene, camera);
  stage.classList.remove("is-loading");
  stage.classList.add("is-3d");

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;

    if (fly) {
      const p = Math.min(1, (now - fly.start) / (fly.dur || 1));
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      camera.position.lerpVectors(fly.fromPos, fly.toPos, e);
      controls.target.lerpVectors(fly.fromTarget, fly.toTarget, e);
      if (p >= 1) fly = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
