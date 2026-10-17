import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  Flame,
  Droplet,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Beaker,
  Thermometer,
  Shield,
  Layers,
  Activity,
  Maximize2,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  ChevronRight,
  Hand,
  MessageSquare,
  Heart,
} from "lucide-react";
import { ClothBannerMesh } from "./three/ClothBannerMesh";
import {
  createBeaker3D,
  createErlenmeyerFlask3D,
  createBunsenBurner3D,
  createTitrationStand3D,
  createTestTubeRack3D,
  createReagentBottle3D,
  createLabBench3D,
} from "./three/Glassware3D";
import { ChemicalSimEngine } from "./three/ChemicalSimEngine";
import { createAvatar3D } from "./three/AvatarMesh";
import { createPortalGate3D } from "./three/FloatingPortals";
import { setupDrawableCanvas } from "./htmlInCanvas";

// Procedural Web Audio API sound generator
class WebAudioSFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }
  playPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(360, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  playDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
  playBurnerWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
}

const sfx = new WebAudioSFX();

export default function CanvasChemistryLab() {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);

  // Chemistry Engine State
  const [chemEngine] = useState(() => new ChemicalSimEngine());
  const [telemetry, setTelemetry] = useState({
    temp: 22.0,
    pH: 7.0,
    volume: 80,
    reactionName: "Xona haroratidagi suvli eritma",
    equation: "H₂O (l)",
    isBoiling: false,
    precipitate: null,
  });

  const [activeVessel, setActiveVessel] = useState("beaker"); // 'beaker' | 'flask'
  const [burnerLit, setBurnerLit] = useState(false);
  const [burnerCollar, setBurnerCollar] = useState(true);
  const [buretteOpen, setBuretteOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [curtisQuote, setCurtisQuote] = useState("Salom! 3D matoni va asboblarni bosing.");
  const [likesCount, setLikesCount] = useState(248);

  // References to 3D instances for direct mutation
  const sceneRefs = useRef({
    cloth: null,
    beaker: null,
    flask: null,
    burner: null,
    burette: null,
    avatar: null,
    portals: [],
    flameLight: null,
    camera: null,
    renderer: null,
    controls: {
      azimuth: 0.15,
      elevation: 0.28,
      distance: 6.2,
      target: new THREE.Vector3(0, 1.25, 0),
    },
    touchJoystick: { active: false, startX: 0, startY: 0, curX: 0, curY: 0 },
    mouse: { isDown: false, prevX: 0, prevY: 0, isRight: false },
  });

  // Sound toggle
  const toggleSound = () => {
    sfx.muted = !muted;
    setMuted(!muted);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.04);

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    sceneRefs.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Apply WICG drawable attribute
    setupDrawableCanvas(renderer.domElement);
    container.appendChild(renderer.domElement);
    sceneRefs.current.renderer = renderer;

    // 2. Lighting & Atmosphere (Warm sunset / horizon glow like arrival.space)
    const ambientLight = new THREE.AmbientLight(0xdce5f5, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    sunLight.position.set(5, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm horizon fill light
    const horizonLight = new THREE.DirectionalLight(0xffaa77, 1.0);
    horizonLight.position.set(-6, 3, -6);
    scene.add(horizonLight);

    // 3. Grid Floor (Infinite style like PerfectGridPlane in arrival.space)
    const gridHelper = new THREE.GridHelper(30, 60, 0x00f0ff, 0x1f2e48);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Soft ground plane for receiving shadows
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b101c,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // 4. Central Chemical Research Workbench
    const labBench = createLabBench3D(4.4, 1.8, 0.95);
    labBench.position.set(0, 0, 0);
    scene.add(labBench);

    // 5. Apparatus on the Workbench
    // Beaker (left-center)
    const beaker = createBeaker3D({ liquidColor: 0x2288ff, volume: 100 });
    beaker.position.set(-0.65, 1.0, 0.2);
    scene.add(beaker);
    sceneRefs.current.beaker = beaker;

    // Erlenmeyer Flask (center-right)
    const flask = createErlenmeyerFlask3D({ liquidColor: 0xffffff, volume: 90 });
    flask.position.set(0.65, 1.0, 0.2);
    scene.add(flask);
    sceneRefs.current.flask = flask;

    // Bunsen Burner (behind beaker/flask, can heat)
    const burner = createBunsenBurner3D();
    burner.position.set(-0.65, 1.0, -0.45);
    scene.add(burner);
    sceneRefs.current.burner = burner;

    // Titration Retort Stand with Burette (placed above the flask!)
    const buretteStand = createTitrationStand3D();
    buretteStand.position.set(0.65, 1.0, -0.2);
    scene.add(buretteStand);
    sceneRefs.current.burette = buretteStand;

    // Test Tube Rack (front-left corner)
    const rack = createTestTubeRack3D();
    rack.position.set(-1.45, 1.0, 0.4);
    scene.add(rack);

    // Reagent Bottles on Back Shelf
    const reagentsConfig = [
      { name: "Natriy gidroksid", formula: "NaOH", color: 0x553311, liq: 0xeeeeff },
      { name: "Xlorid kislota", formula: "HCl", color: 0x223344, liq: 0xccddee },
      { name: "Mis kuporosi", formula: "CuSO₄", color: 0x113355, liq: 0x0088ff },
      { name: "Kaliy permanganat", formula: "KMnO₄", color: 0x331144, liq: 0x8800bb },
      { name: "Vodorod peroksid", formula: "H₂O₂", color: 0x224422, liq: 0xeeffff },
    ];

    reagentsConfig.forEach((rg, idx) => {
      const b = createReagentBottle3D(rg.name, rg.formula, rg.color, rg.liq);
      b.position.set(-1.3 + idx * 0.65, 1.35, -0.65);
      scene.add(b);
    });

    // 6. Interactive 3D Verlet Cloth Banner (Right side of world, like arrival.space)
    const clothBanner = new ClothBannerMesh({
      width: 2.2,
      height: 2.7,
      segmentsX: 18,
      segmentsY: 22,
    });
    clothBanner.mesh.position.set(2.8, 3.4, -0.8);
    clothBanner.mesh.rotation.y = -0.42;
    scene.add(clothBanner.mesh);
    sceneRefs.current.cloth = clothBanner;

    // 7. Stylized 3D Avatar (Standing on the right side looking at the bench)
    const avatar = createAvatar3D();
    avatar.position.set(1.65, 0, 0.45);
    avatar.rotation.y = -Math.PI * 0.45;
    scene.add(avatar);
    sceneRefs.current.avatar = avatar;

    // Flash light & shockwave for energetic reactions
    const flashLight = new THREE.PointLight(0xffaa22, 0, 8);
    flashLight.position.set(-0.65, 1.4, 0.2);
    scene.add(flashLight);
    sceneRefs.current.flashLight = flashLight;

    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.16, 32);
    shockwaveGeo.rotateX(-Math.PI / 2);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.position.set(-0.65, 1.25, 0.2);
    scene.add(shockwaveMesh);
    sceneRefs.current.shockwaveMesh = shockwaveMesh;
    sceneRefs.current.shockwaveMat = shockwaveMat;

    // 8. Floating Portal Frames (Left side, like in screenshot)
    const portals = [
      createPortalGate3D("FEATURED", "Reaksiyalar & Portlashlar", "💥", "#e72264"),
      createPortalGate3D("BOSH SAHIFA", "SmartLab 3D Hub", "🏛️", "#00f0ff"),
      createPortalGate3D("XAVFSIZLIK", "Laboratoriya Qoidalari", "🛡️", "#2ed573"),
    ];

    portals.forEach((p, idx) => {
      p.position.set(-3.2 - idx * 0.45, 1.6, -1.2 + idx * 1.6);
      p.rotation.y = 0.55 - idx * 0.15;
      scene.add(p);
      sceneRefs.current.portals.push(p);
    });

    // 9. Camera Orbit Update Function
    const updateCamera = () => {
      const { azimuth, elevation, distance, target } = sceneRefs.current.controls;
      const x = target.x + distance * Math.cos(elevation) * Math.sin(azimuth);
      const y = target.y + distance * Math.sin(elevation);
      const z = target.z + distance * Math.cos(elevation) * Math.cos(azimuth);
      camera.position.set(x, y, z);
      camera.lookAt(target);
    };
    updateCamera();

    // 10. Mouse & Raycast Interaction
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();

    const onPointerDown = (e) => {
      if (e.target !== renderer.domElement) return;
      sfx.init();

      sceneRefs.current.mouse.isDown = true;
      sceneRefs.current.mouse.isRight = e.button === 2;
      sceneRefs.current.mouse.prevX = e.clientX;
      sceneRefs.current.mouse.prevY = e.clientY;

      // Raycast click
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);

      // Check cloth banner click
      if (clothBanner && clothBanner.mesh) {
        const hits = raycaster.intersectObject(clothBanner.mesh);
        if (hits.length > 0) {
          clothBanner.pokeAtPoint(hits[0].point, 0.4);
          sfx.playPop();
          setCurtisQuote(clothBanner.curtisSpeech);
          setLikesCount(clothBanner.likes);
          return;
        }
      }

      // Check glassware clicks
      const checkHits = raycaster.intersectObjects([beaker, flask, burner], true);
      if (checkHits.length > 0) {
        const obj = checkHits[0].object;
        let root = obj;
        while (root.parent && root.parent !== scene) root = root.parent;

        if (root.userData.type === "beaker") {
          setActiveVessel("beaker");
          sfx.playPop();
        } else if (root.userData.type === "flask") {
          setActiveVessel("flask");
          sfx.playPop();
        } else if (root.userData.type === "burner") {
          const isNowLit = !burner.userData.isLit;
          if (isNowLit) {
            burner.userData.ignite();
            sfx.playBurnerWhoosh();
          } else {
            burner.userData.extinguish();
          }
          setBurnerLit(isNowLit);
        }
      }
    };

    const onPointerMove = (e) => {
      if (!sceneRefs.current.mouse.isDown) return;
      const dx = e.clientX - sceneRefs.current.mouse.prevX;
      const dy = e.clientY - sceneRefs.current.mouse.prevY;
      sceneRefs.current.mouse.prevX = e.clientX;
      sceneRefs.current.mouse.prevY = e.clientY;

      const ctrl = sceneRefs.current.controls;
      if (sceneRefs.current.mouse.isRight) {
        // Pan
        const factor = ctrl.distance * 0.0015;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        ctrl.target.addScaledVector(right, -dx * factor);
        ctrl.target.y += dy * factor;
      } else {
        // Orbit
        ctrl.azimuth -= dx * 0.006;
        ctrl.elevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, ctrl.elevation + dy * 0.006));
      }
      updateCamera();
    };

    const onPointerUp = () => {
      sceneRefs.current.mouse.isDown = false;
    };

    const onWheel = (e) => {
      const ctrl = sceneRefs.current.controls;
      ctrl.distance = Math.max(2.5, Math.min(14.0, ctrl.distance + e.deltaY * 0.005));
      updateCamera();
    };

    const onContextMenu = (e) => e.preventDefault();

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: true });
    dom.addEventListener("contextmenu", onContextMenu);

    // 11. Handle Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // 12. Main 60 FPS Render Loop
    let running = true;
    let lastTime = performance.now();

    const animate = (now) => {
      if (!running) return;
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      const time = now * 0.001;

      // 1. Update Chemistry Engine
      chemEngine.heat(dt, burner.userData.isLit, burnerCollar);
      chemEngine.update(dt);

      // Titration drops handling
      buretteStand.userData.animate(dt, (dropAmount) => {
        chemEngine.volume = Math.min(250, chemEngine.volume + dropAmount * 4);
        // Neutralization color transition
        if (chemEngine.reagents.has("Phenolphthalein")) {
          chemEngine.pH = Math.min(12, chemEngine.pH + 0.35);
          if (chemEngine.pH >= 8.2) {
            chemEngine.colorHex = 0xff007f;
            chemEngine.reactionName = "Fenolftalein titrlash ekvivalent nuqtasi (To'q qizil)";
          }
        }
        sfx.playDrop();
      });

      // Update liquid colors and heights
      beaker.userData.setColor(chemEngine.colorHex);
      flask.userData.setColor(chemEngine.colorHex);
      beaker.userData.setVolume(chemEngine.volume);
      flask.userData.setVolume(chemEngine.volume);

      // Burner animation
      burner.userData.animate(time);

      // Cloth banner Verlet physics update
      clothBanner.update(dt, time);

      // Avatar breathing
      avatar.userData.animate(time);

      // Portals floating hover
      portals.forEach((p, idx) => p.userData.animate(time, idx * 1.2));

      // Energetic reaction flash & shockwave animation
      const fl = sceneRefs.current.flashLight;
      const sm = sceneRefs.current.shockwaveMesh;
      const smat = sceneRefs.current.shockwaveMat;
      if (fl && sm && smat) {
        if (chemEngine.activeEvent) {
          const ev = chemEngine.activeEvent;
          if (ev.type === "explosion") {
            fl.intensity = Math.max(0, chemEngine.eventTimer * 3.8);
            fl.color.set(0xff9900);
            smat.opacity = Math.max(0, chemEngine.eventTimer / 3.5);
            const s = Math.max(0.1, (3.5 - chemEngine.eventTimer) * 2.8);
            sm.scale.set(s, s, s);
          } else if (ev.type === "hypergolic") {
            fl.intensity = Math.max(0, chemEngine.eventTimer * 2.5);
            fl.color.set(0xbb00ff);
            smat.opacity = Math.max(0, chemEngine.eventTimer / 5.0) * 0.7;
            const s = Math.max(0.1, (5.0 - chemEngine.eventTimer) * 1.5);
            sm.scale.set(s, s, s);
          }
        } else {
          fl.intensity = 0;
          smat.opacity = 0;
        }
      }

      // Telemetry state sync (throttled to ~10Hz)
      if (Math.random() < 0.2) {
        setTelemetry({
          temp: chemEngine.temperature,
          pH: chemEngine.pH,
          volume: chemEngine.volume,
          reactionName: chemEngine.reactionName,
          equation: chemEngine.equation,
          isBoiling: chemEngine.isBoiling,
          precipitate: chemEngine.precipitate,
        });
      }

      // Render Three.js Scene
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      running = false;
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [chemEngine, burnerCollar]);

  // Actions
  const handleAddChemical = (reagentId, name) => {
    sfx.init();
    chemEngine.addReagent(reagentId);
    sfx.playPop();

    // Check energetic reactions for sound
    if (chemEngine.activeEvent) {
      if (chemEngine.activeEvent.type === "explosion") {
        sfx.playExplosion();
      } else if (chemEngine.activeEvent.type === "geyser" || chemEngine.activeEvent.type === "hypergolic") {
        sfx.playBurnerWhoosh();
      }
    }
  };

  const handleToggleBurner = () => {
    const burner = sceneRefs.current.burner;
    if (!burner) return;
    const isNowLit = !burnerLit;
    if (isNowLit) {
      burner.userData.ignite();
      sfx.playBurnerWhoosh();
    } else {
      burner.userData.extinguish();
    }
    setBurnerLit(isNowLit);
  };

  const handleToggleCollar = () => {
    const burner = sceneRefs.current.burner;
    if (!burner) return;
    burner.userData.toggleCollar();
    setBurnerCollar(burner.userData.collarOpen);
    sfx.playPop();
  };

  const handleToggleBurette = () => {
    const burette = sceneRefs.current.burette;
    if (!burette) return;
    burette.userData.toggleValve();
    setBuretteOpen(burette.userData.isOpen);
    sfx.playPop();
  };

  const handleResetLab = () => {
    chemEngine.reset();
    sfx.playPop();
    const beaker = sceneRefs.current.beaker;
    const flask = sceneRefs.current.flask;
    if (beaker) {
      beaker.userData.setColor(0x2288ff);
      beaker.userData.setVolume(80);
    }
    if (flask) {
      flask.userData.setColor(0xffffff);
      flask.userData.setVolume(80);
    }
  };

  const handleClothAction = (action) => {
    const cloth = sceneRefs.current.cloth;
    if (!cloth) return;
    cloth.interact(action);
    setCurtisQuote(cloth.curtisSpeech);
    setLikesCount(cloth.likes);
    sfx.playPop();
  };

  return (
    <div className="relative h-screen w-full bg-[#0a0e17] text-white overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur hover:bg-[#e72264]/20 hover:border-[#e72264] transition"
          >
            <Compass className="h-5 w-5 text-cyan-400" />
          </Link>
          <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-1.5 backdrop-blur">
            <h1 className="text-sm font-black font-mono tracking-wider text-white">
              SMARTLAB <span className="text-[#00f0ff]">3D KIMYO</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-400">
              HTML-IN-CANVAS (FIMBOX VERLET 3D) · PRO BENCH
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5 text-xs font-mono backdrop-blur">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                telemetry.isBoiling ? "bg-red-500 animate-ping" : "bg-emerald-400"
              }`}
            />
            <span className="text-zinc-300">
              {telemetry.isBoiling ? "QAYNAMOQDA!" : "BARQAROR REJIM"}
            </span>
          </div>

          <button
            onClick={toggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur hover:bg-white/10 transition"
          >
            {muted ? <VolumeX className="h-4 w-4 text-zinc-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Floating 3D Telemetry HUD (Left Side) */}
      <div className="absolute top-20 left-4 z-20 w-72 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md pointer-events-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> ASBOB-USKUNA TELEMETRIYASI
          </span>
          <span className="text-[10px] font-mono text-zinc-400">60 FPS</span>
        </div>

        <div className="space-y-3 font-mono">
          {/* Temperature */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" /> Harorat:
              </span>
              <span className={`font-bold ${telemetry.temp > 100 ? "text-red-400" : "text-amber-300"}`}>
                {telemetry.temp.toFixed(1)} °C
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-500 transition-all duration-200"
                style={{ width: `${Math.min(100, (telemetry.temp / 350) * 100)}%` }}
              />
            </div>
          </div>

          {/* pH Indicator */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5 text-cyan-400" /> Vodorod Ko'rsatkichi (pH):
              </span>
              <span
                className={`font-bold ${
                  telemetry.pH < 4 ? "text-red-400" : telemetry.pH > 10 ? "text-violet-400" : "text-emerald-400"
                }`}
              >
                {telemetry.pH.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-emerald-400 to-purple-600 rounded-full" />
          </div>

          {/* Liquid Volume */}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Eritma Hajmi:</span>
            <span className="font-bold text-cyan-300">{telemetry.volume.toFixed(0)} ml</span>
          </div>

          {/* Reaction Status */}
          <div className="rounded-lg border border-white/5 bg-white/5 p-2.5 mt-2">
            <div className="text-[10px] text-zinc-400 uppercase font-mono">Hozirgi Jarayon:</div>
            <div className="text-xs font-bold text-white mt-0.5">{telemetry.reactionName}</div>
            <div className="text-[11px] font-mono text-cyan-300 mt-1">{telemetry.equation}</div>
            {telemetry.precipitate && (
              <div className="text-[10px] font-bold text-amber-300 mt-1 flex items-center gap-1">
                ⚠️ {telemetry.precipitate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Curtis AI 3D Cloth Banner Interaction Bar (Right Side) */}
      <div className="absolute top-20 right-4 z-20 w-80 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md pointer-events-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-mono font-bold text-[#e72264] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> 3D VERLET MATO BANNERI
          </span>
          <span className="text-[10px] font-mono text-zinc-400">Curtis AI</span>
        </div>

        <p className="text-xs text-zinc-300 italic mb-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
          “{curtisQuote}”
        </p>

        {/* 3D Cloth Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleClothAction("pet")}
            className="flex items-center justify-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition"
          >
            <Hand className="h-3.5 w-3.5" /> PET
          </button>
          <button
            onClick={() => handleClothAction("poke")}
            className="flex items-center justify-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition"
          >
            <Sparkles className="h-3.5 w-3.5" /> POKE
          </button>
          <button
            onClick={() => handleClothAction("talk")}
            className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <MessageSquare className="h-3.5 w-3.5" /> TALK
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-zinc-400 border-t border-white/10 pt-2">
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <Heart className="h-3 w-3 fill-red-400" /> {likesCount} yoqtirishlar
          </span>
          <span>arrival.space / fimbox</span>
        </div>
      </div>

      {/* Bottom Interactive Workbench Control Deck */}
      <footer className="absolute bottom-4 left-4 right-4 z-20 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Left: Vessel Select & Burner Controls */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-md pointer-events-auto shadow-2xl">
          <button
            onClick={() => setActiveVessel("beaker")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeVessel === "beaker"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Beaker className="h-4 w-4" /> Menzurka (250ml)
          </button>

          <button
            onClick={() => setActiveVessel("flask")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeVessel === "flask"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Beaker className="h-4 w-4" /> Kolba (250ml)
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Bunsen Burner Ignite Toggle */}
          <button
            onClick={handleToggleBurner}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              burnerLit
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                : "bg-white/10 text-zinc-300 hover:bg-white/20"
            }`}
          >
            <Flame className="h-4 w-4" />
            {burnerLit ? "Olovni O'chirish" : "Gorelkani Yoqish"}
          </button>

          {/* Flame collar */}
          {burnerLit && (
            <button
              onClick={handleToggleCollar}
              className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-2 text-[11px] font-bold text-zinc-300 hover:bg-white/20 transition"
            >
              Havo: {burnerCollar ? "Moviy (1300°C)" : "Sariq (750°C)"}
            </button>
          )}

          {/* Burette Valve */}
          <button
            onClick={handleToggleBurette}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              buretteOpen
                ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(46,213,115,0.5)]"
                : "bg-white/10 text-zinc-300 hover:bg-white/20"
            }`}
          >
            <Droplet className="h-4 w-4" />
            {buretteOpen ? "Byuretka Ochiq (Tommoqda)" : "Byuretkani Ochish"}
          </button>
        </div>

        {/* Center: Reagent Dispensers */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-md pointer-events-auto overflow-x-auto max-w-full">
          <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase">Reaktivlar:</span>
          <button
            onClick={() => handleAddChemical("NaOH", "Natriy gidroksid")}
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
          >
            + NaOH
          </button>
          <button
            onClick={() => handleAddChemical("HCl", "Xlorid kislota")}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
          >
            + HCl
          </button>
          <button
            onClick={() => handleAddChemical("CuSO4", "Mis kuporosi")}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
          >
            + CuSO₄
          </button>
          <button
            onClick={() => handleAddChemical("KMnO4", "Kaliy permanganat")}
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20"
          >
            + KMnO₄
          </button>
          <button
            onClick={() => handleAddChemical("Glycerin", "Glitserin")}
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20"
          >
            + Glitserin
          </button>
          <button
            onClick={() => handleAddChemical("H2O2", "Vodorod peroksid")}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
          >
            + H₂O₂ (30%)
          </button>
          <button
            onClick={() => handleAddChemical("MnO2", "Marganes dioksid")}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            + MnO₂
          </button>
          <button
            onClick={() => handleAddChemical("Na", "Metall Natriy")}
            className="rounded-xl border border-rose-500/50 bg-rose-500/20 px-3 py-1.5 text-xs font-black text-rose-300 hover:bg-rose-500/30 animate-pulse"
          >
            💥 + Na (Portlash!)
          </button>
          <button
            onClick={() => handleAddChemical("Phenolphthalein", "Fenolftalein")}
            className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-2.5 py-1.5 text-xs font-bold text-pink-300 hover:bg-pink-500/20"
          >
            + Fenolftalein
          </button>
        </div>

        {/* Right: Reset Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetLab}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition shadow-2xl backdrop-blur-md"
          >
            <RotateCcw className="h-4 w-4" /> Idishlarni Yuvish (Tozalash)
          </button>
        </div>
      </footer>

      {/* On-Screen Touch Joystick for Camera Orbit (As in arrival.space screenshot) */}
      <div
        className="absolute bottom-24 left-6 z-20 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-md pointer-events-auto touch-none select-none shadow-xl cursor-grab active:cursor-grabbing hover:border-cyan-400/60 transition"
        title="Kamera boshqaruvi (aylantirish)"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const onMove = (ev) => {
            const dx = ev.clientX - centerX;
            const dy = ev.clientY - centerY;
            const ctrl = sceneRefs.current.controls;
            ctrl.azimuth -= dx * 0.0004;
            ctrl.elevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, ctrl.elevation + dy * 0.0004));
            const cam = sceneRefs.current.camera;
            if (cam) {
              const x = ctrl.target.x + ctrl.distance * Math.cos(ctrl.elevation) * Math.sin(ctrl.azimuth);
              const y = ctrl.target.y + ctrl.distance * Math.sin(ctrl.elevation);
              const z = ctrl.target.z + ctrl.distance * Math.cos(ctrl.elevation) * Math.cos(ctrl.azimuth);
              cam.position.set(x, y, z);
              cam.lookAt(ctrl.target);
            }
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-inner">
          <Compass className="h-4 w-4 text-cyan-300" />
        </div>
      </div>
    </div>
  );
}
