// Procedural Three.js lab room: tiled wall + floor, bench, a glass beaker that mirrors the vessel
// state, burner flame, bubbles, smoke and fog, and the html-cloth journal hanging from a brass rod.
import * as THREE from "three";
import { HtmlCloth } from "./HtmlCloth";

const WALL_Z = -2.2;
const BENCH_TOP = 0.92;
const BEAKER_POS = new THREE.Vector3(0.92, BENCH_TOP, -0.3);

const tileTexture = ({ base, grout, size = 256, tiles = 4, noise = 0.05 }) => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);
  const step = size / tiles;
  const b = new THREE.Color(base);
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const n = (Math.random() - 0.5) * noise;
      ctx.fillStyle = `rgb(${((b.r + n) * 255) | 0},${((b.g + n) * 255) | 0},${((b.b + n) * 255) | 0})`;
      ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

const glowSprite = (inner, outer) => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export const createLabScene = ({ canvas, sourceEl, onCloth }) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f1a);
  scene.fog = new THREE.Fog(0x0a0f1a, 9, 16);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  const camBase = new THREE.Vector3(0, 1.95, 5.4);
  camera.position.copy(camBase);
  const lookAt = new THREE.Vector3(0, 1.62, -0.8);
  camera.lookAt(lookAt);

  /* lights */
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x202a36, 0.55));
  const key = new THREE.DirectionalLight(0xfff3e0, 2.2);
  key.position.set(-2.5, 5.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -3;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.bias = -0.0008;
  scene.add(key);
  const fill = new THREE.PointLight(0x9fd6ff, 18, 12, 2);
  fill.position.set(2.8, 3.2, 1.5);
  scene.add(fill);

  /* room */
  const wallMat = new THREE.MeshStandardMaterial({ map: tileTexture({ base: "#dfe7ea", grout: "#aab6bb", tiles: 6 }), roughness: 0.55 });
  wallMat.map.repeat.set(5, 2.5);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), wallMat);
  wall.position.set(0, 3.2, WALL_Z);
  wall.receiveShadow = true;
  scene.add(wall);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(16, 0.12), new THREE.MeshStandardMaterial({ color: 0x1d6fb8, roughness: 0.6 }));
  stripe.position.set(0, 1.22, WALL_Z + 0.002);
  scene.add(stripe);
  const floorMat = new THREE.MeshStandardMaterial({ map: tileTexture({ base: "#2a3340", grout: "#171c25", tiles: 4, noise: 0.03 }), roughness: 0.75 });
  floorMat.map.repeat.set(8, 8);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  for (const x of [-2.2, 2.2]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeef6ff, emissiveIntensity: 2.4 }));
    lamp.position.set(x, 4.3, -0.4);
    scene.add(lamp);
  }

  /* bench */
  const bench = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 1.5), new THREE.MeshStandardMaterial({ color: 0x1d2229, roughness: 0.35, metalness: 0.1 }));
  top.position.y = BENCH_TOP - 0.04;
  top.castShadow = top.receiveShadow = true;
  bench.add(top);
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, BENCH_TOP - 0.1, 1.3), new THREE.MeshStandardMaterial({ color: 0x7b6a52, roughness: 0.8 }));
  body.position.y = (BENCH_TOP - 0.1) / 2;
  body.castShadow = body.receiveShadow = true;
  bench.add(body);
  for (const x of [-1.6, -0.5, 0.6, 1.7]) {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 0.8, roughness: 0.3 }));
    handle.position.set(x, BENCH_TOP - 0.3, 0.67);
    bench.add(handle);
  }
  bench.position.set(0, 0, -0.55);
  scene.add(bench);

  /* beaker */
  const beaker = new THREE.Group();
  beaker.position.copy(BEAKER_POS);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, transmission: 0, side: THREE.DoubleSide, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.46, 40, 1, true), glassMat);
  glass.position.y = 0.23;
  beaker.add(glass);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), glassMat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.002;
  beaker.add(bottom);
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe9f2, transparent: true, opacity: 0.85, roughness: 0.2 });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.16, 1, 36), liquidMat);
  liquid.scale.y = 0.001;
  liquid.position.y = 0.0005;
  liquid.castShadow = true;
  beaker.add(liquid);
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.7, roughness: 0.35 }));
  burner.position.set(0, -0.025, 0);
  burner.visible = false;
  beaker.add(burner);
  const tripod = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.8, roughness: 0.3 }));
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.17, 0.12, Math.sin(a) * 0.17);
    tripod.add(leg);
  }
  tripod.position.y = -0.24;
  tripod.visible = false;
  beaker.add(tripod);
  const flameMat = new THREE.SpriteMaterial({ map: glowSprite("rgba(255,240,190,1)", "rgba(255,110,20,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(0.36, 0.5, 1);
  flame.position.y = 0.05;
  flame.visible = false;
  beaker.add(flame);
  const flameLight = new THREE.PointLight(0xff8a30, 0, 2.5, 2);
  flameLight.position.y = 0.1;
  beaker.add(flameLight);
  scene.add(beaker);

  /* particles */
  const bubbleGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.2 });
  const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, 48);
  const bubbleState = Array.from({ length: 48 }, () => ({ x: 0, y: 0, z: 0, s: 0, live: false }));
  bubbles.count = 48;
  bubbles.visible = false;
  beaker.add(bubbles);
  const smokeTex = glowSprite("rgba(220,220,225,0.55)", "rgba(220,220,225,0)");
  const smokes = [];
  for (let i = 0; i < 14; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0, depthWrite: false }));
    sp.position.set(0, 0.6, 0);
    sp.userData = { t: Math.random(), speed: 0.22 + Math.random() * 0.14, drift: (Math.random() - 0.5) * 0.3 };
    beaker.add(sp);
    smokes.push(sp);
  }
  const fogTex = glowSprite("rgba(235,240,245,0.45)", "rgba(235,240,245,0)");
  const fogs = [];
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, opacity: 0, depthWrite: false }));
    sp.userData = { t: Math.random(), dx: (Math.random() - 0.5) * 1.2, dz: (Math.random() - 0.5) * 0.5 };
    beaker.add(sp);
    fogs.push(sp);
  }
  const flashLight = new THREE.PointLight(0xffffff, 0, 8, 2);
  flashLight.position.set(BEAKER_POS.x, BEAKER_POS.y + 0.6, BEAKER_POS.z);
  scene.add(flashLight);

  /* html cloth on a rod */
  const clothOrigin = new THREE.Vector3(-0.12, 3.42, WALL_Z + 0.45);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.7, 16), new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 0.9, roughness: 0.25 }));
  rod.rotation.z = Math.PI / 2;
  rod.position.copy(clothOrigin).add(new THREE.Vector3(0, 0.02, 0));
  rod.castShadow = true;
  scene.add(rod);
  for (const x of [-1.2, 1.2]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.44), rod.material);
    bracket.position.set(clothOrigin.x + x, clothOrigin.y + 0.02, WALL_Z + 0.2);
    scene.add(bracket);
  }
  const cloth = new HtmlCloth({
    renderer,
    camera,
    sourceEl,
    width: 2.2,
    height: 2.2,
    segmentsX: 20,
    segmentsY: 20,
    origin: clothOrigin,
    wallZ: WALL_Z,
  });
  scene.add(cloth.group);
  onCloth?.(cloth);

  /* state mirrored from the hook */
  const state = { liquidColor: "#dfe9f2", fill: 0, heating: false, bubbling: false, smoking: false, fogging: false, flash: 0, shake: 0, stir: 0 };
  const targetColor = new THREE.Color("#dfe9f2");
  const setLab = (next) => {
    Object.assign(state, next);
    targetColor.set(state.liquidColor);
    burner.visible = tripod.visible = state.heating;
  };
  const flash = (kind) => {
    state.flash = kind === "explosion" ? 1.6 : 0.9;
    state.shake = kind === "explosion" ? 1 : 0.3;
  };

  /* resize + loop */
  const mouse = new THREE.Vector2();
  const onMove = (e) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow windows get a wider lens so the cloth and beaker stay between the panels.
    const aspect = w / h;
    camera.fov = aspect >= 1.5 ? 40 : aspect >= 1 ? 40 + (1.5 - aspect) * 22 : 60;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const clock = new THREE.Clock();
  let fillLevel = 0;
  const tmp = new THREE.Matrix4();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    cloth.update(dt);

    fillLevel += (state.fill - fillLevel) * Math.min(1, dt * 4);
    const h = Math.max(0.001, fillLevel * 0.42);
    liquid.scale.y = h;
    liquid.position.y = h / 2 + 0.002;
    liquidMat.color.lerp(targetColor, Math.min(1, dt * 3));
    if (state.stir > 0) {
      state.stir -= dt;
      liquid.rotation.y += dt * 6;
    }

    flame.visible = state.heating;
    if (state.heating) {
      const f = 0.85 + Math.sin(t * 23) * 0.08 + Math.sin(t * 7) * 0.07;
      flame.scale.set(0.34 * f, 0.52 * f, 1);
      flameLight.intensity = 6 * f;
    } else flameLight.intensity = 0;

    bubbles.visible = state.bubbling && fillLevel > 0.02;
    if (bubbles.visible) {
      for (let i = 0; i < bubbleState.length; i++) {
        const b = bubbleState[i];
        if (!b.live) {
          if (Math.random() < 0.08) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.13;
            Object.assign(b, { x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.01, s: 0.6 + Math.random(), live: true });
          } else continue;
        }
        b.y += dt * (0.25 + b.s * 0.15);
        if (b.y > h - 0.01) b.live = false;
        tmp.makeScale(b.s, b.s, b.s);
        tmp.setPosition(b.x, b.y, b.z);
        bubbles.setMatrixAt(i, b.live ? tmp : tmp.makeScale(0, 0, 0));
      }
      bubbles.instanceMatrix.needsUpdate = true;
    }

    for (const sp of smokes) {
      const u = sp.userData;
      if (state.smoking || sp.material.opacity > 0.01) {
        u.t += dt * u.speed;
        if (u.t > 1) {
          u.t = 0;
          if (!state.smoking) continue;
        }
        sp.position.set(Math.sin(u.t * 6 + u.drift * 10) * 0.12 + u.drift * u.t, 0.45 + u.t * 1.3, 0);
        sp.scale.setScalar(0.25 + u.t * 0.7);
        sp.material.opacity = state.smoking ? Math.sin(u.t * Math.PI) * 0.55 : Math.max(0, sp.material.opacity - dt);
      }
    }
    for (const sp of fogs) {
      const u = sp.userData;
      if (state.fogging || sp.material.opacity > 0.01) {
        u.t += dt * 0.18;
        if (u.t > 1) u.t = 0;
        sp.position.set(u.dx * u.t * 1.6, 0.46 - u.t * 0.46, u.dz * u.t);
        sp.scale.setScalar(0.4 + u.t * 1.2);
        sp.material.opacity = state.fogging ? Math.sin(u.t * Math.PI) * 0.5 : Math.max(0, sp.material.opacity - dt);
      }
    }

    if (state.flash > 0) {
      flashLight.intensity = state.flash * 60;
      state.flash = Math.max(0, state.flash - dt * 3.2);
    } else flashLight.intensity = 0;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.5);

    camera.position.x = camBase.x + mouse.x * 0.28 + (Math.random() - 0.5) * state.shake * 0.04;
    camera.position.y = camBase.y - mouse.y * 0.12 + (Math.random() - 0.5) * state.shake * 0.04;
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
  });

  const dispose = () => {
    renderer.setAnimationLoop(null);
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    cloth.dispose();
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => { mm.map?.dispose?.(); mm.dispose?.(); });
    });
    renderer.dispose();
  };

  return { renderer, scene, camera, cloth, setLab, flash, stir: () => { state.stir = 1.2; }, dispose };
};
