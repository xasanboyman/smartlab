import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Loader2, AlertCircle, RefreshCw, Scissors, Sparkles, Eye, RotateCcw } from "lucide-react";
import { LIGHTING_PRESETS, setupCanvasDrawable, ANATOMICAL_REGIONS } from "./engine/HtmlCanvasManager";
import { anatomyAudio } from "./engine/AnatomyAudio";

// Texture & Material mapping for all 23 anatomical meshes
const BASE = import.meta.env.BASE_URL || "/";
const TEXTURE_DIR = `${BASE}models/textures/`.replace(/\/+/g, "/");
const MODEL_URL = `${BASE}models/human_anatomy_draco.glb`.replace(/\/+/g, "/");

const MESH_SPECS = {
  // Organs (Moist natural tissue)
  Brain_2: { map: "Brain_Albedo.jpeg", normal: "Brain_Normal_DirectX.jpeg", roughness: "Brain_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.48, clearcoat: 0.12, specularIntensity: 0.3 },
  Diafragma_2: { map: "Diafragma_Albedo.jpg", normal: "Diafragma_Normal_DirectX.jpeg", roughness: "Diafragma_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.55, specularIntensity: 0.25 },
  Eye_2: { map: "eye_Albedo.jpeg", normal: "eye_Normal_DirectX.jpeg", roughness: "eye_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.12, clearcoat: 0.45, specularIntensity: 0.8 },
  Gallbladder_2: { map: "Galbladder_Mat_Albedo.jpeg", normal: "Galbladder_Mat_Normal_DirectX.jpeg", roughness: "Galbladder_Mat_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.42, clearcoat: 0.15, specularIntensity: 0.3 },
  Humanlungs_2: { map: "lungs_LP_albedo.jpeg", normal: "lungs_LP_normal.jpeg", roughness: "lungs_LP_roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.58, specularIntensity: 0.25 },
  Liver_2: { map: "Liver_Mat_Albedo.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.45, clearcoat: 0.12, specularIntensity: 0.3 },
  Urinary_system_2: { map: "Urinary_System_Albedo.jpeg", normal: "Urinary_System_Normal_DirectX.jpeg", roughness: "Urinary_System_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.45, clearcoat: 0.12, specularIntensity: 0.3 },
  Digestivesystem_2: { map: "DigestiveSystem_Albedo.jpeg", normal: "DigestiveSystem_Normal_DirectX.jpeg", roughness: "DigestiveSystem_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.5, clearcoat: 0.12, specularIntensity: 0.3 },
  Heart_2: { map: "Heart_Albedo.jpeg", normal: "Heart_Normal_DirectX.jpeg", roughness: "Heart_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.38, clearcoat: 0.2, specularIntensity: 0.35 },
  Eyelash_2: { layer: "organs", color: "#18181b", roughnessVal: 0.9, specularIntensity: 0.1 },

  // Skeleton (Matte porous ivory bone)
  Legs_2: { map: "Legs_Albedo.jpeg", normal: "Legs_Normal_DirectX.jpeg", roughness: "Legs_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },
  Pelvis_2: { map: "Pelvis_Albedo.jpeg", normal: "Pelvis_Normal_DirectX.jpeg", roughness: "Pelvis_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },
  Hands_2: { map: "Hands_Albedo.jpeg", normal: "Hands_Normal_DirectX.jpeg", roughness: "Hands_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },
  Ribcage_2: { map: "Ribcage_Albedo.jpeg", normal: "Ribcage_Normal_DirectX.jpeg", roughness: "Ribcage_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },
  Spine_2: { map: "Spine_Albedo.jpeg", normal: "Spine_Normal_DirectX.jpeg", roughness: "Spine_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },
  Skull_2: { map: "Skull_Albedo.jpeg", normal: "Skull_Normal_DirectX.jpeg", roughness: "Skull_Roughness.jpeg", layer: "skeleton", color: "#ffffff", roughnessVal: 0.75, specularIntensity: 0.2 },

  // Muscles (Anatomical striated fibers)
  Musclespart_1_2: { map: "Muscles_MusclesPart_1_BaseColor.jpg", normal: "Muscles_MusclesPart_1_Normal.jpg", roughness: "Muscles_MusclesPart_1_Roughness.jpg", layer: "muscles", color: "#ffffff", roughnessVal: 0.58, clearcoat: 0.05, specularIntensity: 0.22 },
  Musclespart_2_2: { map: "Muscles_MusclesPart_2_BaseColor.jpg", normal: "Muscles_MusclesPart_2_Normal.jpg", roughness: "Muscles_MusclesPart_2_Roughness.jpg", layer: "muscles", color: "#ffffff", roughnessVal: 0.58, clearcoat: 0.05, specularIntensity: 0.22 },
  Musclespart_3_2: { map: "Muscles_MusclesPart_3_BaseColor.jpg", normal: "Muscles_MusclesPart_3_Normal.jpg", roughness: "Muscles_MusclesPart_3_Roughness.jpg", layer: "muscles", color: "#ffffff", roughnessVal: 0.58, clearcoat: 0.05, specularIntensity: 0.22 },

  // Vessels (Circulatory tree)
  Arteriasmesh_2: { map: "CirculatorySystem_albedo.jpeg", normal: "CirculatorySystem_normal.jpg", roughness: "CirculatorySystem_roughness.jpeg", layer: "vessels", color: "#ffffff", roughnessVal: 0.42, specularIntensity: 0.3 },
  Venasmesh_2: { map: "CirculatorySystem_albedo.jpeg", normal: "CirculatorySystem_normal.jpg", roughness: "CirculatorySystem_roughness.jpeg", layer: "vessels", color: "#ffffff", roughnessVal: 0.42, specularIntensity: 0.3 },

  // Skin & Outer (Natural human melanin finish)
  HumanSkin_2: {
    map: "HumanSkin_BaseColor.jpg",
    normal: "HumanSkin_Normal.jpg",
    roughness: "HumanSkin_Roughness.jpg",
    layer: "skin",
    color: "#ffffff",
    roughnessVal: 0.82,
    specularIntensity: 0.16,
    sheen: 0.14,
    isSkin: true,
  },
  Shorts_2: { map: "Shorts_BaseColor.jpg", normal: "Shorts_Normal.jpg", roughness: "Shorts_Roughness.jpg", layer: "skin", color: "#ffffff", roughnessVal: 0.9, specularIntensity: 0.08 },
};

const LAYER_RENDER_ORDER = {
  skeleton: 1,
  organs: 2,
  vessels: 3,
  muscles: 4,
  skin: 5,
};

const NativeAnatomyCanvas = forwardRef(function NativeAnatomyCanvas(
  {
    layerOpacities = { skeleton: 1, organs: 1, vessels: 1, muscles: 1, skin: 1 },
    layerVisibilities = { skeleton: true, organs: true, vessels: true, muscles: true, skin: true },
    activeTopic = null, // e.g. "skeleton" | "heart" | null for all
    sliceConfig = { enabled: false, axis: "vertical_z", direction: "front_to_back", position: 40, flipped: false },
    lightingPreset = "medical",
    themeMode = "night", // "day" | "night"
    autoRotate = false,
    autoRotateSpeed = 1.0,
    onPick = () => {},
    isPhysiologicalActive = true,
    heartBpm = 72,
    isHeartBeating = true,
    isBreathing = true,
    isAcousticHeart = false,
  },
  ref
) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const lightsRef = useRef(null);
  const podGroupRef = useRef(null);
  const shadowMeshRef = useRef(null);
  const ringMeshesRef = useRef([]);
  const meshesRef = useRef(new Map());
  const slicePlaneRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
  const sliceHelperRef = useRef(null);
  const modelGroupRef = useRef(null);
  const modelBoundsRef = useRef(new THREE.Box3());

  // Physiological animation refs
  const isPhysiologicalActiveRef = useRef(isPhysiologicalActive);
  useEffect(() => {
    isPhysiologicalActiveRef.current = isPhysiologicalActive;
    if (!isPhysiologicalActive) {
      // Reset mesh transforms when physiological engine is paused
      const heart = meshesRef.current.get("Heart_2");
      if (heart) {
        heart.scale.set(1, 1, 1);
        heart.position.set(0, 0, 0);
        heart.material?.emissive?.setRGB(0, 0, 0);
      }
      const lungs = meshesRef.current.get("Humanlungs_2");
      if (lungs) {
        lungs.scale.set(1, 1, 1);
        lungs.position.set(0, 0, 0);
      }
      const dia = meshesRef.current.get("Diafragma_2");
      if (dia) dia.position.set(0, 0, 0);
      const rib = meshesRef.current.get("Ribcage_2");
      if (rib) {
        rib.scale.set(1, 1, 1);
        rib.position.set(0, 0, 0);
      }
      const art = meshesRef.current.get("Arteriasmesh_2");
      if (art) art.material?.emissive?.setRGB(0, 0, 0);
    }
  }, [isPhysiologicalActive]);

  const heartBpmRef = useRef(heartBpm);
  useEffect(() => {
    heartBpmRef.current = heartBpm;
  }, [heartBpm]);

  const isHeartBeatingRef = useRef(isHeartBeating);
  useEffect(() => {
    isHeartBeatingRef.current = isHeartBeating;
  }, [isHeartBeating]);

  const isBreathingRef = useRef(isBreathing);
  useEffect(() => {
    isBreathingRef.current = isBreathing;
  }, [isBreathing]);

  const isAcousticHeartRef = useRef(isAcousticHeart);
  useEffect(() => {
    isAcousticHeartRef.current = isAcousticHeart;
  }, [isAcousticHeart]);

  const lastBeatTriggeredRef = useRef(false);

  // Smooth camera interpolation targets
  const cameraTargetPosRef = useRef(null);
  const cameraTargetLookRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const activeTopicRef = useRef(activeTopic);
  useEffect(() => {
    activeTopicRef.current = activeTopic;
  }, [activeTopic]);

  // Smoothly glide camera to destination
  const glideCameraTo = useCallback((targetPos, targetLook) => {
    cameraTargetPosRef.current = new THREE.Vector3(...targetPos);
    cameraTargetLookRef.current = new THREE.Vector3(...targetLook);
  }, []);

  // Expose camera controls & instances for HTML-in-Canvas overlays
  useImperativeHandle(ref, () => ({
    getCamera: () => cameraRef.current,
    getContainer: () => containerRef.current,
    recenter: () => {
      glideCameraTo([-195, 8, 195], [0, 0, 0]);
    },
    zoomIn: (scale = 0.82) => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraTargetPosRef.current = null;
      cameraTargetLookRef.current = null;
      const cam = cameraRef.current;
      const target = controlsRef.current.target;
      const offset = cam.position.clone().sub(target);
      const newLen = Math.max(14, offset.length() * scale);
      offset.setLength(newLen);
      cam.position.copy(target).add(offset);
      controlsRef.current.update();
    },
    zoomOut: (scale = 1.22) => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraTargetPosRef.current = null;
      cameraTargetLookRef.current = null;
      const cam = cameraRef.current;
      const target = controlsRef.current.target;
      const offset = cam.position.clone().sub(target);
      const newLen = Math.min(450, offset.length() * scale);
      offset.setLength(newLen);
      cam.position.copy(target).add(offset);
      controlsRef.current.update();
    },
    rotateBy: (degX = 15, degY = 0) => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraTargetPosRef.current = null;
      cameraTargetLookRef.current = null;
      const cam = cameraRef.current;
      const target = controlsRef.current.target;
      const offset = cam.position.clone().sub(target);
      const radX = THREE.MathUtils.degToRad(degX);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), radX);
      cam.position.copy(target).add(offset);
      controlsRef.current.update();
    },
    focusRegion: (region) => {
      const reg = ANATOMICAL_REGIONS[region] || ANATOMICAL_REGIONS.all;
      glideCameraTo(reg.cameraPos, reg.cameraTarget);
    },
    focusPosition: (pos, distance = 45) => {
      glideCameraTo([pos[0] - distance, pos[1] + 8, pos[2] + distance], [pos[0], pos[1], pos[2]]);
    },
    focusPoint: (point, distance = 42) => {
      if (!point || !cameraRef.current || !controlsRef.current) return;
      const pt = point instanceof THREE.Vector3 ? point : new THREE.Vector3(point.x, point.y, point.z);
      const cam = cameraRef.current;
      const dir = cam.position.clone().sub(pt);
      if (dir.lengthSq() < 0.001) {
        dir.set(-0.7, 0.2, 0.7);
      }
      dir.normalize();

      const targetCamPos = pt.clone().addScaledVector(dir, distance);
      glideCameraTo(
        [targetCamPos.x, targetCamPos.y, targetCamPos.z],
        [pt.x, pt.y, pt.z]
      );
    },
    focusMesh: (meshName) => {
      const mesh = meshesRef.current.get(meshName);
      if (mesh) {
        // Skip zooming into the whole-body bounding box center (groin) for full body meshes
        if (meshName.startsWith("Musclespart_") || meshName === "HumanSkin_2") {
          return;
        }
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        glideCameraTo([center.x - 30, center.y + 5, center.z + 35], [center.x, center.y, center.z]);
      }
    },
    focusTopic: (topic) => {
      if (!topic || topic.id === "all") {
        glideCameraTo([-195, 8, 195], [0, 0, 0]);
        return;
      }
      const box = new THREE.Box3();
      let found = false;
      meshesRef.current.forEach((mesh, meshName) => {
        const isMatch = topic.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()));
        if (isMatch) {
          box.expandByObject(mesh);
          found = true;
        }
      });
      if (found) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = Math.max(maxDim * 1.5, 16);
        const dir = new THREE.Vector3(-1.0, 0.15, 1.0).normalize();
        const endPos = center.clone().addScaledVector(dir, dist);
        glideCameraTo([endPos.x, endPos.y, endPos.z], [center.x, center.y, center.z]);
      }
    },
  }));

  // 1. Initialize Scene, Renderer, Lights, and OrbitControls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // Let the radial gradient from container shine through
    sceneRef.current = scene;
    window.__anatomyScene = scene;

    // Camera — positioned to frame the entire human body head to toe centered at (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(-195, 8, 195);
    cameraRef.current = camera;
    window.__anatomyCamera = camera;

    // High-Definition Renderer with transparent canvas & crisp anti-aliasing (Forced 2.0x minimum supersampling)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2.0), 3.0);
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    setupCanvasDrawable(renderer.domElement);
    container.appendChild(renderer.domElement);

    // Floor Contact Shadow & Scanning Pedestal at y = -86.3
    const podGroup = new THREE.Group();
    podGroup.position.y = -86.3;

    // 1. Soft Circular Radial Contact Shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d");
    const sgrad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    sgrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    sgrad.addColorStop(0.35, "rgba(0, 0, 0, 0.45)");
    sgrad.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
    sgrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(85, 85);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: themeMode === "day" ? 0.35 : 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.05;
    podGroup.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // 2. Concentric Holographic Cyber Rings
    const isDay = themeMode === "day";
    const ringGeo1 = new THREE.RingGeometry(36, 36.6, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: isDay ? 0x0284c7 : 0x10b981,
      transparent: true,
      opacity: isDay ? 0.3 : 0.45,
      side: THREE.DoubleSide,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(24, 24.5, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: isDay ? 0x059669 : 0x06b6d4,
      transparent: true,
      opacity: isDay ? 0.25 : 0.35,
      side: THREE.DoubleSide,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh2);

    const ringGeo3 = new THREE.RingGeometry(46, 46.8, 64);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: isDay ? 0x6366f1 : 0x8b5cf6,
      transparent: true,
      opacity: isDay ? 0.2 : 0.25,
      side: THREE.DoubleSide,
    });
    const ringMesh3 = new THREE.Mesh(ringGeo3, ringMat3);
    ringMesh3.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh3);
    ringMeshesRef.current = [ringMesh1, ringMesh2, ringMesh3];

    scene.add(podGroup);
    podGroupRef.current = podGroup;

    // Realistic Medical Studio Environment (IBL for subtle softbox reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.18;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 0.85;
    controls.panSpeed = 0.85;
    controls.target.set(0, 0, 0);
    controls.minDistance = 14;
    controls.maxDistance = 450;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.update();

    const cancelCameraGlide = () => {
      cameraTargetPosRef.current = null;
      cameraTargetLookRef.current = null;
    };
    controls.addEventListener("start", cancelCameraGlide);
    controlsRef.current = controls;
    window.__anatomyControls = controls;

    container.addEventListener("wheel", cancelCameraGlide, { passive: true });
    container.addEventListener("touchstart", cancelCameraGlide, { passive: true });

    // Professional Medical Studio 4-Point High-Contrast Lighting Rig
    // Key Light - intense, focused anatomical studio light for crisp relief and cast shadows
    const dirLight1 = new THREE.DirectionalLight(0xfffaed, 1.45);
    dirLight1.position.set(-90, 110, 120);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 4096;
    dirLight1.shadow.mapSize.height = 4096;
    dirLight1.shadow.bias = -0.0001;
    dirLight1.shadow.radius = 1.2;
    scene.add(dirLight1);

    // Fill Light - subtle cool fill to gently light shadowed crevices
    const dirLight2 = new THREE.DirectionalLight(0xbfdbfe, 0.35);
    dirLight2.position.set(100, 50, 80);
    scene.add(dirLight2);

    // Rim Light - sharp specular silhouette kicker from behind
    const rimLight = new THREE.DirectionalLight(0xe0e7ff, 0.85);
    rimLight.position.set(0, 90, -110);
    scene.add(rimLight);

    // Floor Bounce Light - soft subtle bounce
    const bounceLight = new THREE.DirectionalLight(0x3f3f46, 0.15);
    bounceLight.position.set(0, -80, 70);
    scene.add(bounceLight);

    // Gentle Ambient Hemisphere
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.22);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    lightsRef.current = {
      key: dirLight1,
      fill: dirLight2,
      rim: rimLight,
      bounce: bounceLight,
      hemi: hemiLight,
    };

    // High-tech CT / MRI Slicing Laser Helper Plane (Dynamic Scalable)
    const helperGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Laser cyan
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    helperGroup.add(planeMesh);

    // Glowing laser boundary
    const edgesGeo = new THREE.EdgesGeometry(planeGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const wireMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    helperGroup.add(wireMesh);

    // Center crosshair grid lines
    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, 0, 0.01),
      new THREE.Vector3(0.5, 0, 0.01),
      new THREE.Vector3(0, -0.5, 0.01),
      new THREE.Vector3(0, 0.5, 0.01),
    ]);
    const crossMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.55,
    });
    helperGroup.add(new THREE.LineSegments(crossGeo, crossMat));

    helperGroup.visible = false;
    scene.add(helperGroup);
    sliceHelperRef.current = helperGroup;

    // Raycaster for 3D clicking - only fires on stationary tap/click (<6px movement, <350ms)
    // to strictly prevent accidental mesh picks during pinch-to-zoom, pan, or orbit rotation gestures
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    const handlePointerDown = (e) => {
      cancelCameraGlide();
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = performance.now();
    };

    const handlePointerUp = (e) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const elapsed = performance.now() - pointerDownTime;

      // Only pick if this was an intentional stationary tap/click
      if (dist < 6 && elapsed < 350) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const activeMeshes = Array.from(meshesRef.current.values()).filter(
          (m) => m.visible && m.material && m.material.opacity > 0.05
        );
        const intersects = raycaster.intersectObjects(activeMeshes, false);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const clickedMesh = hit.object;
          onPickRef.current?.(clickedMesh.name, hit.point);
        }
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Slowly rotate floor hologram rings
      if (podGroupRef.current) {
        podGroupRef.current.rotation.y += 0.003;
      }
      // Smooth camera glide interpolation
      if (cameraTargetPosRef.current && cameraTargetLookRef.current) {
        camera.position.lerp(cameraTargetPosRef.current, 0.08);
        controls.target.lerp(cameraTargetLookRef.current, 0.08);
        if (camera.position.distanceTo(cameraTargetPosRef.current) < 0.2) {
          camera.position.copy(cameraTargetPosRef.current);
          controls.target.copy(cameraTargetLookRef.current);
          cameraTargetPosRef.current = null;
          cameraTargetLookRef.current = null;
          controls.update();
        }
      } else {
        controls.update();
      }

      // Real Anatomical Physiological Animations (Cardiac Cycle, Vascular Pulse, Pulmonary Respiration)
      if (isPhysiologicalActiveRef.current) {
        const now = performance.now() * 0.001; // in seconds
        const bpm = heartBpmRef.current || 72;
        const heartHz = bpm / 60; // beats per second

        // 1. CARDIAC CYCLE (Lub-Dub rhythm & Aorta pulse)
        if (isHeartBeatingRef.current) {
          const heartMesh = meshesRef.current.get("Heart_2");
          if (heartMesh) {
            const phase = (now * heartHz) % 1.0;
            // Dual lub-dub contraction waveform:
            // S1 (Atrial / initial systole): phase 0.0 -> 0.12
            // S2 (Ventricular / main systole): phase 0.15 -> 0.38
            let beatDelta = 0;
            if (phase < 0.12) {
              beatDelta = Math.sin((phase / 0.12) * Math.PI) * 0.045;
            } else if (phase >= 0.15 && phase < 0.38) {
              beatDelta = Math.sin(((phase - 0.15) / 0.23) * Math.PI) * 0.085;
            }

            const hs = 1.0 + beatDelta;
            heartMesh.scale.set(hs, hs, hs);
            // Pivot around exact heart geometry center so it doesn't drift
            heartMesh.position.set(
              0.2518 * (hs - 1.0),
              0.0028 * (hs - 1.0),
              0.0041 * (hs - 1.0)
            );

            // Subtle systolic emissive flash on heart material
            if (heartMesh.material) {
              if (beatDelta > 0.01) {
                const glow = beatDelta * 2.2;
                heartMesh.material.emissive?.setRGB(glow * 0.45, glow * 0.04, glow * 0.04);
              } else {
                heartMesh.material.emissive?.setRGB(0, 0, 0);
              }
            }

            // Sync arterial tree pulsation with heart systole
            const artMesh = meshesRef.current.get("Arteriasmesh_2");
            if (artMesh && artMesh.material) {
              if (beatDelta > 0.02) {
                artMesh.material.emissive?.setRGB(beatDelta * 0.28, 0, 0);
              } else {
                artMesh.material.emissive?.setRGB(0, 0, 0);
              }
            }

            // Stethoscope heartbeat sound trigger
            if (isAcousticHeartRef.current) {
              if (phase < 0.04 && !lastBeatTriggeredRef.current) {
                lastBeatTriggeredRef.current = true;
                anatomyAudio.playHeartbeat(0.06);
              } else if (phase > 0.45) {
                lastBeatTriggeredRef.current = false;
              }
            }
          }
        }

        // 2. RESPIRATORY CYCLE (Breathing Lungs, Diaphragm & Ribcage)
        if (isBreathingRef.current) {
          // Respiratory frequency: ~14 breaths per min = ~0.233 Hz
          const breathHz = 0.233;
          // Smooth asymmetrical breathing: inhalation faster (1.8s), exhalation gentle (2.4s)
          const breathPhase = (now * breathHz) % 1.0;
          let breathFactor = 0;
          if (breathPhase < 0.42) {
            // Inhalation (expansion)
            breathFactor = 0.5 - 0.5 * Math.cos((breathPhase / 0.42) * Math.PI);
          } else {
            // Exhalation (gentle deflation)
            breathFactor = 0.5 + 0.5 * Math.cos(((breathPhase - 0.42) / 0.58) * Math.PI);
          }

          // A) LUNGS expansion
          const lungsMesh = meshesRef.current.get("Humanlungs_2");
          if (lungsMesh) {
            // Expand laterally and anteroposteriorly
            const lsX = 1.0 + 0.052 * breathFactor;
            const lsY = 1.0 + 0.044 * breathFactor;
            const lsZ = 1.0 + 0.032 * breathFactor;
            lungsMesh.scale.set(lsX, lsY, lsZ);
            lungsMesh.position.set(
              0.2905 * (lsX - 1.0),
              -1.4063 * (lsY - 1.0),
              -131.17 * (lsZ - 1.0)
            );
          }

          // B) DIAPHRAGM descent/ascent
          const diaMesh = meshesRef.current.get("Diafragma_2");
          if (diaMesh) {
            const diaOffsetZ = -0.45 * breathFactor;
            diaMesh.position.set(0, 0, diaOffsetZ);
          }

          // C) RIBCAGE subtle expansion (bucket-handle motion)
          const ribMesh = meshesRef.current.get("Ribcage_2");
          if (ribMesh) {
            const ribScale = 1.0 + 0.012 * breathFactor;
            ribMesh.scale.set(ribScale, ribScale, ribScale);
            ribMesh.position.set(
              0.3308 * (ribScale - 1.0),
              -1.4705 * (ribScale - 1.0),
              -128.37 * (ribScale - 1.0)
            );
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2.0), 3.0);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("wheel", cancelCameraGlide);
      container.removeEventListener("touchstart", cancelCameraGlide);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Load the 3D Model with Draco
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setLoading(true);
    setLoadError(null);

    const draco = new DRACOLoader().setDecoderPath(`${BASE}draco/`.replace(/\/+/g, "/"));
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const texLoader = new THREE.TextureLoader();

    loader.load(
      MODEL_URL,
      (gltf) => {
        // Group and center
        const group = new THREE.Group();
        group.name = "HumanAnatomy";

        // Center offset from our earlier bounding box calculation
        // Total center: [-20.9, -23.9, -392.5]
        gltf.scene.position.set(20.9, 23.9, 392.5);
        group.add(gltf.scene);
        scene.add(group);
        modelGroupRef.current = group;

        // Bounding Box
        const box = new THREE.Box3().setFromObject(group);
        modelBoundsRef.current = box;

        // Textures & Materials setup with Ultra-Sharp Full-Resolution Texture Filtering
        const textureCache = new Map();
        const maxAniso = rendererRef.current?.capabilities?.getMaxAnisotropy() || 16;
        const getTex = (filename, isColor = true) => {
          if (!filename) return null;
          if (!textureCache.has(filename)) {
            const t = texLoader.load(TEXTURE_DIR + filename);
            t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            t.anisotropy = maxAniso;
            t.generateMipmaps = true;
            t.minFilter = THREE.LinearFilter; // Always sharpest 1536x1536 base texture
            t.magFilter = THREE.LinearFilter;
            textureCache.set(filename, t);
          }
          return textureCache.get(filename);
        };

        meshesRef.current.clear();
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            const spec = MESH_SPECS[child.name] || {};
            let mat;

            const isFrontOnly = spec.isSkin || spec.layer === "skin" || spec.layer === "muscles";

            if (spec.isSkin) {
              // Real Human Skin Shader with Sheen micro-scattering and natural melanin tone
              mat = new THREE.MeshPhysicalMaterial({
                name: child.name,
                color: new THREE.Color(spec.color || 0xffffff),
                roughness: spec.roughnessVal ?? 0.54,
                metalness: 0.0,
                clearcoat: 0.16,
                clearcoatRoughness: 0.28,
                sheen: spec.sheen ?? 0.22,
                sheenColor: new THREE.Color(0xfed7aa),
                sheenRoughness: 0.7,
                specularIntensity: spec.specularIntensity ?? 0.38,
                side: THREE.FrontSide, // FrontSide lets us see right through sliced skin into organs
                transparent: false,
                opacity: 1.0,
                clippingPlanes: [],
                clipShadows: true,
              });
            } else {
              mat = new THREE.MeshPhysicalMaterial({
                name: child.name,
                color: new THREE.Color(spec.color || 0xffffff),
                roughness: spec.roughnessVal ?? 0.48,
                metalness: 0.0,
                clearcoat: spec.clearcoat ?? 0.2,
                clearcoatRoughness: 0.28,
                specularIntensity: spec.specularIntensity ?? 0.35,
                side: isFrontOnly ? THREE.FrontSide : THREE.DoubleSide, // Muscles: FrontSide so inner cavity is clear; Bones & Organs: DoubleSide
                transparent: false,
                opacity: 1.0,
                clippingPlanes: [],
                clipShadows: true,
              });
            }

            if (spec.map) mat.map = getTex(spec.map, true);
            if (spec.normal) {
              mat.normalMap = getTex(spec.normal, false);
              mat.normalScale = new THREE.Vector2(spec.isSkin ? 1.5 : 1.7, spec.isSkin ? 1.5 : 1.7);
            }
            if (spec.roughness) mat.roughnessMap = getTex(spec.roughness, false);

            if (child.name === "Shorts_2") {
              mat.polygonOffset = true;
              mat.polygonOffsetFactor = -2;
              mat.polygonOffsetUnits = -2;
            }

            child.material = mat;
            child.renderOrder = child.name === "Shorts_2" ? 6 : (LAYER_RENDER_ORDER[spec.layer] || 2);
            child.castShadow = true;
            child.receiveShadow = true;
            meshesRef.current.set(child.name, child);
          }
        });

        window.__anatomyMeshes = meshesRef.current;
        window.__anatomyBounds = box;

        draco.dispose();
        setLoading(false);
        setModelLoaded(true);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error("Error loading anatomy GLB:", err);
        setLoadError("3D modelni yuklashda xatolik.");
        setLoading(false);
      }
    );

    return () => {
      if (modelGroupRef.current && scene) {
        scene.remove(modelGroupRef.current);
      }
    };
  }, []);

  // 3. Update Layers & Opacities & Topic Isolation
  useEffect(() => {
    const isSlicing = Boolean(sliceConfig?.enabled);

    meshesRef.current.forEach((mesh, meshName) => {
      const spec = MESH_SPECS[meshName] || {};
      const layerName = spec.layer || "organs";

      let visible = true;
      let opacity = 1.0;

      if (isSlicing || !activeTopic || activeTopic.id === "all") {
        // Multi-layer mode with smooth opacity slider & full body slicing
        visible = layerVisibilities[layerName] ?? true;
        opacity = layerOpacities[layerName] ?? 1.0;
      } else {
        // Single topic focus mode: highlighted organ is prominent,
        // while other layers stay as translucent anatomical context (instead of disappearing completely)
        const isMatch = activeTopic.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()));
        if (isMatch) {
          visible = true;
          opacity = 1.0;
        } else {
          // Keep other layers as semi-transparent anatomical context if layer is visible
          const layerVis = layerVisibilities[layerName] ?? true;
          const baseOp = layerOpacities[layerName] ?? 1.0;
          if (layerVis && baseOp > 0.05) {
            visible = true;
            opacity = Math.min(baseOp, 0.2);
          } else {
            visible = false;
            opacity = 0;
          }
        }
      }

      mesh.visible = visible && opacity > 0.005;
      mesh.material.opacity = opacity;
      const isTrans = opacity < 0.999;
      if (mesh.material.transparent !== isTrans) {
        mesh.material.transparent = isTrans;
        mesh.material.needsUpdate = true;
      }
      mesh.material.depthWrite = opacity > 0.6;
      mesh.renderOrder = meshName === "Shorts_2" ? 6 : (LAYER_RENDER_ORDER[layerName] || 2);
    });
  }, [layerOpacities, layerVisibilities, activeTopic, sliceConfig?.enabled, modelLoaded]);

  // 4. Update Slicing Plane Tool with Angle, Direction, and Multi-region Scaling
  useEffect(() => {
    const {
      enabled,
      axis = "horizontal",
      direction = "top_to_below",
      region = "all",
      position = 50,
      angle = 0,
      tilt = 0,
      offsetX = 0,
      offsetY = 0,
      flipped = false,
    } = sliceConfig;

    const helper = sliceHelperRef.current;

    if (!enabled) {
      if (helper) helper.visible = false;
      meshesRef.current.forEach((mesh) => {
        mesh.material.clippingPlanes = [];
        mesh.material.needsUpdate = true;
      });
      return;
    }

    const reg = ANATOMICAL_REGIONS[region] || ANATOMICAL_REGIONS.all;
    const b = reg.bounds;

    // Normalized progress strictly 0 to 1
    const p = Math.max(0, Math.min(100, position)) / 100;

    let cx = reg.center[0] + ((offsetX || 0) / 100) * 16;
    let cy = reg.center[1] + ((offsetY || 0) / 100) * 24;
    let cz = reg.center[2];

    const baseNormal = new THREE.Vector3();
    const qBase = new THREE.Quaternion();

    if (axis === "horizontal") {
      // Y-axis transverse cut (horizontal plane)
      const span = b.maxY - b.minY;
      if (direction === "below_to_top") {
        cy = b.minY + p * span;
        baseNormal.set(0, 1, 0); // Keep above cut
        qBase.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      } else {
        // top_to_below
        cy = b.maxY - p * span;
        baseNormal.set(0, -1, 0); // Keep below cut
        qBase.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      }
    } else if (axis === "vertical_z") {
      // Z-axis coronal cut (front-back plane)
      const span = b.maxZ - b.minZ;
      if (direction === "back_to_front") {
        cz = b.minZ + p * span;
        baseNormal.set(0, 0, 1);
        qBase.setFromEuler(new THREE.Euler(0, Math.PI, 0));
      } else {
        // front_to_back
        cz = b.maxZ - p * span;
        baseNormal.set(0, 0, -1);
        qBase.setFromEuler(new THREE.Euler(0, 0, 0));
      }
    } else {
      // vertical_x (Sagittal X - side plane)
      const span = b.maxX - b.minX;
      if (direction === "right_to_left") {
        cx = b.maxX - p * span;
        baseNormal.set(-1, 0, 0);
        qBase.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      } else {
        // left_to_right
        cx = b.minX + p * span;
        baseNormal.set(1, 0, 0);
        qBase.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
      }
    }

    // 0 to 360 degree arbitrary rotation
    const radAngle = THREE.MathUtils.degToRad(angle || 0);
    const radTilt = THREE.MathUtils.degToRad(tilt || 0);

    const qDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(radTilt, radAngle, 0, "YXZ")
    );
    const qTotal = qBase.clone().multiply(qDelta);

    const normal = baseNormal.clone().applyQuaternion(qDelta).normalize();
    if (flipped) {
      normal.negate();
    }

    const center = new THREE.Vector3(cx, cy, cz);
    const constant = -normal.dot(center);

    const plane = new THREE.Plane(normal, constant);
    slicePlaneRef.current = plane;

    if (helper) {
      helper.position.copy(center);
      helper.quaternion.copy(qTotal);
      helper.scale.set(reg.helperSize[0], reg.helperSize[1], 1);
      helper.visible = true;
    }

    meshesRef.current.forEach((mesh) => {
      mesh.material.clippingPlanes = [plane];
      mesh.material.clipShadows = true;
      mesh.material.needsUpdate = true;
    });
  }, [sliceConfig, modelLoaded]);

  // Dynamic Studio Lighting Presets & Theme Mode adaptation
  useEffect(() => {
    const lights = lightsRef.current;
    const renderer = rendererRef.current;
    if (!lights || !renderer) return;

    const activePresetKey = themeMode === "day" && lightingPreset === "medical"
      ? "day_clinical"
      : lightingPreset;
    const preset = LIGHTING_PRESETS[activePresetKey] || LIGHTING_PRESETS.day_clinical || LIGHTING_PRESETS.medical;

    lights.key.color.setHex(preset.keyColor);
    lights.key.intensity = preset.keyIntensity;

    lights.fill.color.setHex(preset.fillColor);
    lights.fill.intensity = preset.fillIntensity;

    lights.rim.color.setHex(preset.rimColor);
    lights.rim.intensity = preset.rimIntensity;

    lights.bounce.color.setHex(preset.fillColor);
    lights.bounce.intensity = preset.fillIntensity * 0.75;

    lights.hemi.color.setHex(preset.hemiSky);
    lights.hemi.groundColor.setHex(preset.hemiGround);
    lights.hemi.intensity = preset.hemiIntensity;

    renderer.toneMappingExposure = preset.exposure;
    if (sceneRef.current) {
      sceneRef.current.environmentIntensity = preset.envIntensity;
    }
  }, [lightingPreset, themeMode]);

  // Dynamic Theme Mode Floor & Laser Helper Updates
  useEffect(() => {
    const isDay = themeMode === "day";
    if (shadowMeshRef.current) {
      shadowMeshRef.current.material.opacity = isDay ? 0.3 : 0.85;
      shadowMeshRef.current.material.needsUpdate = true;
    }
    if (ringMeshesRef.current && ringMeshesRef.current.length === 3) {
      const [r1, r2, r3] = ringMeshesRef.current;
      if (isDay) {
        r1.material.color.setHex(0x0284c7);
        r1.material.opacity = 0.3;
        r2.material.color.setHex(0x059669);
        r2.material.opacity = 0.25;
        r3.material.color.setHex(0x6366f1);
        r3.material.opacity = 0.2;
      } else {
        r1.material.color.setHex(0x10b981);
        r1.material.opacity = 0.45;
        r2.material.color.setHex(0x06b6d4);
        r2.material.opacity = 0.35;
        r3.material.color.setHex(0x8b5cf6);
        r3.material.opacity = 0.25;
      }
      r1.material.needsUpdate = true;
      r2.material.needsUpdate = true;
      r3.material.needsUpdate = true;
    }
  }, [themeMode]);

  // Auto-rotate Turntable
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  const isDay = themeMode === "day";

  return (
    <div
      className={`w-full h-full relative select-none overflow-hidden transition-colors duration-500 ${
        isDay
          ? "bg-[radial-gradient(ellipse_90%_80%_at_50%_35%,#f8fafc_0%,#e2e8f0_50%,#cbd5e1_100%)]"
          : "bg-[radial-gradient(ellipse_90%_80%_at_50%_35%,#131d33_0%,#090e1b_50%,#03050a_100%)]"
      }`}
    >
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ touchAction: "none" }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md z-30 transition-colors ${
            isDay ? "bg-white/90 text-slate-900" : "bg-[#08090d]/90 text-white"
          }`}
        >
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <h3
            className={`text-base font-bold tracking-wide ${
              isDay ? "text-slate-800" : "text-white"
            }`}
          >
            Anatomiya 3D modeli yuklanmoqda...
          </h3>
          <p className={`text-xs mt-1 ${isDay ? "text-slate-500" : "text-zinc-400"}`}>
            Yuqori aniqlikdagi mahalliy WebGL modeli
          </p>
          {loadProgress > 0 && (
            <div
              className={`w-48 rounded-full h-1.5 mt-3 overflow-hidden ${
                isDay ? "bg-slate-200" : "bg-zinc-800"
              }`}
            >
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center z-30 p-6 text-center ${
            isDay ? "bg-slate-50 text-slate-900" : "bg-[#08090d] text-white"
          }`}
        >
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-red-500 mb-1">Modelni yuklab bo'lmadi</h3>
          <p className={`text-xs max-w-md mb-4 ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
            {loadError}
          </p>
        </div>
      )}
    </div>
  );
});

export default NativeAnatomyCanvas;
