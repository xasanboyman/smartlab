import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Loader2, AlertCircle, RefreshCw, Scissors, Sparkles, Eye, RotateCcw } from "lucide-react";
import { LIGHTING_PRESETS, setupCanvasDrawable } from "./engine/HtmlCanvasManager";

// Texture & Material mapping for all 23 anatomical meshes
const TEXTURE_DIR = "/models/textures/";
const MODEL_URL = "/models/human_anatomy_draco.glb";

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
    sliceConfig = { enabled: false, axis: "vertical_x", position: 50, flipped: false },
    lightingPreset = "medical",
    autoRotate = false,
    autoRotateSpeed = 1.0,
    onPick = () => {},
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
  const meshesRef = useRef(new Map());
  const slicePlaneRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
  const sliceHelperRef = useRef(null);
  const modelGroupRef = useRef(null);
  const modelBoundsRef = useRef(new THREE.Box3());

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
      glideCameraTo([-105, 12, 105], [0, 0, 0]);
    },
    focusRegion: (region) => {
      const regions = {
        head: { target: [0, 68, 2], pos: [-42, 70, 42] },
        chest: { target: [0, 38, 4], pos: [-52, 40, 52] },
        abdomen: { target: [0, 20, 4], pos: [-48, 22, 48] },
        pelvis: { target: [0, 4, 2], pos: [-48, 6, 48] },
        legs: { target: [0, -42, 2], pos: [-65, -40, 65] },
        all: { target: [0, 0, 0], pos: [-105, 12, 105] },
      };
      const cfg = regions[region] || regions.all;
      glideCameraTo(cfg.pos, cfg.target);
    },
    focusPosition: (pos, distance = 45) => {
      glideCameraTo([pos[0] - distance, pos[1] + 8, pos[2] + distance], [pos[0], pos[1], pos[2]]);
    },
    focusMesh: (meshName) => {
      const mesh = meshesRef.current.get(meshName);
      if (mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        glideCameraTo([center.x - 30, center.y + 5, center.z + 35], [center.x, center.y, center.z]);
      }
    },
    focusTopic: (topic) => {
      if (!topic || topic.id === "all") {
        glideCameraTo([-105, 12, 105], [0, 0, 0]);
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

    // Camera — positioned closer so human model stands tall and fills viewport
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(-105, 12, 105);
    cameraRef.current = camera;
    window.__anatomyCamera = camera;

    // Renderer with transparent canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      opacity: 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.05;
    podGroup.add(shadowMesh);

    // 2. Concentric Holographic Cyber Rings
    const ringGeo1 = new THREE.RingGeometry(36, 36.6, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(24, 24.5, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh2);

    const ringGeo3 = new THREE.RingGeometry(46, 46.8, 64);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const ringMesh3 = new THREE.Mesh(ringGeo3, ringMat3);
    ringMesh3.rotation.x = Math.PI / 2;
    podGroup.add(ringMesh3);

    scene.add(podGroup);
    podGroupRef.current = podGroup;

    // Realistic Medical Studio Environment (IBL for subtle softbox reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.75;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    window.__anatomyControls = controls;

    // Professional Medical Studio 4-Point Lighting Rig
    // Key Light - soft warm anatomical key light aligned with default front-left camera view
    const dirLight1 = new THREE.DirectionalLight(0xfff8f0, 0.85);
    dirLight1.position.set(-100, 120, 130);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0003;
    dirLight1.shadow.radius = 2.5;
    scene.add(dirLight1);

    // Fill Light - soft cool studio fill to soften shadow areas
    const dirLight2 = new THREE.DirectionalLight(0xe0f2fe, 0.4);
    dirLight2.position.set(110, 60, 90);
    scene.add(dirLight2);

    // Rim / Kicker Light - highlights anatomical silhouettes and muscle separation
    const rimLight = new THREE.DirectionalLight(0xc7d2fe, 0.45);
    rimLight.position.set(0, 90, -120);
    scene.add(rimLight);

    // Under-Fill / Floor Bounce Light - prevents harsh dark voids under chin, ribs, groin
    const bounceLight = new THREE.DirectionalLight(0x52525b, 0.3);
    bounceLight.position.set(0, -90, 80);
    scene.add(bounceLight);

    // Soft Hemisphere ambient illumination
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x27272a, 0.45);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    lightsRef.current = {
      key: dirLight1,
      fill: dirLight2,
      rim: rimLight,
      bounce: bounceLight,
      hemi: hemiLight,
    };

    // Slicing Plane Visual Helper
    const planeGeo = new THREE.PlaneGeometry(120, 210);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const edgesGeo = new THREE.EdgesGeometry(planeGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    const wireMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    planeMesh.add(wireMesh);
    planeMesh.visible = false;
    scene.add(planeMesh);
    sliceHelperRef.current = planeMesh;

    // Raycaster for 3D clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const activeMeshes = Array.from(meshesRef.current.values()).filter((m) => m.visible && m.material.opacity > 0.05);
      const intersects = raycaster.intersectObjects(activeMeshes, false);
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        onPickRef.current?.(clickedMesh.name);
      }
    };
    container.addEventListener("pointerdown", handlePointerDown);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Slowly rotate floor hologram rings
      if (podGroupRef.current) {
        podGroupRef.current.rotation.y += 0.003;
      }

      // Smooth camera glide interpolation
      if (cameraTargetPosRef.current && cameraTargetLookRef.current) {
        camera.position.lerp(cameraTargetPosRef.current, 0.075);
        controls.target.lerp(cameraTargetLookRef.current, 0.075);
        if (camera.position.distanceTo(cameraTargetPosRef.current) < 0.1) {
          cameraTargetPosRef.current = null;
          cameraTargetLookRef.current = null;
        }
      }

      // Subtle biological pulse when Heart is active
      if (activeTopicRef.current?.id === "heart") {
        const heartMesh = meshesRef.current.get("Heart_2");
        if (heartMesh) {
          const t = performance.now() * 0.005;
          const beat = Math.sin(t * 3.5);
          const s = 1.0 + (beat > 0.65 ? (beat - 0.65) * 0.07 : 0);
          heartMesh.scale.set(s, s, s);
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
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
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

    const draco = new DRACOLoader().setDecoderPath("/draco/");
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

        // Textures & Materials setup
        const textureCache = new Map();
        const getTex = (filename, isColor = true) => {
          if (!filename) return null;
          if (!textureCache.has(filename)) {
            const t = texLoader.load(TEXTURE_DIR + filename);
            t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            textureCache.set(filename, t);
          }
          return textureCache.get(filename);
        };

        meshesRef.current.clear();
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            const spec = MESH_SPECS[child.name] || {};
            let mat;

            if (spec.isSkin) {
              // Real Human Skin Shader with Sheen micro-scattering and natural melanin tone
              mat = new THREE.MeshPhysicalMaterial({
                name: child.name,
                color: new THREE.Color(spec.color || 0xffffff),
                roughness: spec.roughnessVal ?? 0.82,
                metalness: 0.0,
                sheen: spec.sheen ?? 0.14,
                sheenColor: new THREE.Color(0xfde2d8),
                sheenRoughness: 0.8,
                specularIntensity: spec.specularIntensity ?? 0.16,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
                clippingPlanes: [],
                clipShadows: true,
              });
            } else {
              mat = new THREE.MeshPhysicalMaterial({
                name: child.name,
                color: new THREE.Color(spec.color || 0xffffff),
                roughness: spec.roughnessVal ?? 0.65,
                metalness: 0.0,
                clearcoat: spec.clearcoat ?? 0.0,
                clearcoatRoughness: 0.35,
                specularIntensity: spec.specularIntensity ?? 0.25,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
                clippingPlanes: [],
                clipShadows: true,
              });
            }

            if (spec.map) mat.map = getTex(spec.map, true);
            if (spec.normal) {
              mat.normalMap = getTex(spec.normal, false);
              mat.normalScale = new THREE.Vector2(spec.isSkin ? 0.5 : 0.65, spec.isSkin ? 0.5 : 0.65);
            }
            if (spec.roughness) mat.roughnessMap = getTex(spec.roughness, false);

            child.material = mat;
            child.renderOrder = LAYER_RENDER_ORDER[spec.layer] || 2;
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
    meshesRef.current.forEach((mesh, meshName) => {
      const spec = MESH_SPECS[meshName] || {};
      const layerName = spec.layer || "organs";

      let visible = true;
      let opacity = 1.0;

      // Single topic isolation mode
      if (activeTopic && activeTopic.id !== "all") {
        const isMatch = activeTopic.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()));
        if (!isMatch) {
          visible = false;
          opacity = 0;
        } else {
          visible = true;
          opacity = 1.0;
        }
      } else {
        // Multi-layer mode with smooth opacity slider
        visible = layerVisibilities[layerName] ?? true;
        opacity = layerOpacities[layerName] ?? 1.0;
      }

      mesh.visible = visible && opacity > 0.005;
      mesh.material.opacity = opacity;
      mesh.material.transparent = opacity < 0.999;
      mesh.material.depthWrite = opacity > 0.6;
    });
  }, [layerOpacities, layerVisibilities, activeTopic, modelLoaded]);

  // 4. Update Slicing Plane Tool with Angle and X-Y Sliding (like eler.ai)
  useEffect(() => {
    const {
      enabled,
      axis = "vertical_x",
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

    // Normalized slider factor: -1.0 to 1.0
    const factor = (position - 50) / 50;
    const extraX = ((offsetX || 0) / 100) * 28;
    const extraY = ((offsetY || 0) / 100) * 80;

    let cx = 0;
    let cy = 0;
    let cz = 0;

    const qBase = new THREE.Quaternion();
    const baseNormal = new THREE.Vector3();

    if (axis === "horizontal") {
      cx = extraX;
      cy = factor * 80 + extraY;
      cz = 0;
      qBase.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      baseNormal.set(0, -1, 0);
    } else if (axis === "vertical_z") {
      cx = extraX;
      cy = extraY;
      cz = factor * 35;
      qBase.setFromEuler(new THREE.Euler(0, 0, 0));
      baseNormal.set(0, 0, -1);
    } else {
      // vertical_x or custom
      cx = factor * 28 + extraX;
      cy = extraY;
      cz = 0;
      qBase.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
      baseNormal.set(-1, 0, 0);
    }

    // Convert degrees to radians
    const radAngle = THREE.MathUtils.degToRad(angle || 0);
    const radTilt = THREE.MathUtils.degToRad(tilt || 0);

    // Dynamic rotation delta for angle and tilt
    const qDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(radTilt, 0, radAngle, "XYZ")
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
      helper.visible = true;
    }

    meshesRef.current.forEach((mesh) => {
      mesh.material.clippingPlanes = [plane];
      mesh.material.clipShadows = true;
      mesh.material.needsUpdate = true;
    });
  }, [sliceConfig, modelLoaded]);

  // Dynamic Studio Lighting Presets
  useEffect(() => {
    const lights = lightsRef.current;
    const renderer = rendererRef.current;
    if (!lights || !renderer) return;

    const preset = LIGHTING_PRESETS[lightingPreset] || LIGHTING_PRESETS.medical;
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
  }, [lightingPreset]);

  // Auto-rotate Turntable
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[radial-gradient(ellipse_90%_80%_at_50%_35%,#131d33_0%,#090e1b_50%,#03050a_100%)]">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08090d]/90 backdrop-blur-md z-30 text-white">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Anatomiya 3D modeli yuklanmoqda...
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Yuqori aniqlikdagi mahalliy WebGL modeli
          </p>
          {loadProgress > 0 && (
            <div className="w-48 bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08090d] z-30 text-white p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-red-400 mb-1">Modelni yuklab bo'lmadi</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-4">{loadError}</p>
        </div>
      )}
    </div>
  );
});

export default NativeAnatomyCanvas;
