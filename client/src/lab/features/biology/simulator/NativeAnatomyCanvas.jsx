import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Loader2, AlertCircle, RefreshCw, Scissors, Sparkles, Eye, RotateCcw } from "lucide-react";

// Texture & Material mapping for all 23 anatomical meshes
const TEXTURE_DIR = "/models/textures/";
const MODEL_URL = "/models/human_anatomy_draco.glb";

const MESH_SPECS = {
  Brain_2: { map: "Brain_Albedo.jpeg", normal: "Brain_Normal_DirectX.jpeg", roughness: "Brain_Roughness.jpeg", layer: "organs", color: "#e2adad", roughnessVal: 0.52 },
  Diafragma_2: { map: "Diafragma_Albedo.jpg", normal: "Diafragma_Normal_DirectX.jpeg", roughness: "Diafragma_Roughness.jpeg", layer: "organs", color: "#dc2626", roughnessVal: 0.6 },
  Eye_2: { map: "eye_Albedo.jpeg", normal: "eye_Normal_DirectX.jpeg", roughness: "eye_Roughness.jpeg", layer: "organs", color: "#ffffff", roughnessVal: 0.15 },
  Gallbladder_2: { map: "Galbladder_Mat_Albedo.jpeg", normal: "Galbladder_Mat_Normal_DirectX.jpeg", roughness: "Galbladder_Mat_Roughness.jpeg", layer: "organs", color: "#3f6212", roughnessVal: 0.45 },
  Humanlungs_2: { map: "lungs_LP_albedo.jpeg", normal: "lungs_LP_normal.jpeg", roughness: "lungs_LP_roughness.jpeg", layer: "organs", color: "#f87171", roughnessVal: 0.55 },
  Legs_2: { map: "Legs_Albedo.jpeg", normal: "Legs_Normal_DirectX.jpeg", roughness: "Legs_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Liver_2: { map: "Liver_Mat_Albedo.jpeg", layer: "organs", color: "#7f1d1d", roughnessVal: 0.45 },
  Pelvis_2: { map: "Pelvis_Albedo.jpeg", normal: "Pelvis_Normal_DirectX.jpeg", roughness: "Pelvis_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Hands_2: { map: "Hands_Albedo.jpeg", normal: "Hands_Normal_DirectX.jpeg", roughness: "Hands_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Ribcage_2: { map: "Ribcage_Albedo.jpeg", normal: "Ribcage_Normal_DirectX.jpeg", roughness: "Ribcage_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Spine_2: { roughness: "Spine_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Urinary_system_2: { map: "Urinary_System_Albedo.jpeg", normal: "Urinary_System_Normal_DirectX.jpeg", roughness: "Urinary_System_Roughness.jpeg", layer: "organs", color: "#991b1b", roughnessVal: 0.45 },
  Digestivesystem_2: { map: "DigestiveSystem_Albedo.jpeg", normal: "DigestiveSystem_Normal_DirectX.jpeg", roughness: "DigestiveSystem_Roughness.jpeg", layer: "organs", color: "#c2410c", roughnessVal: 0.5 },
  Skull_2: { map: "Skull_Albedo.jpeg", normal: "Skull_Normal_DirectX.jpeg", roughness: "Skull_Roughness.jpeg", layer: "skeleton", color: "#e2ded4", roughnessVal: 0.72 },
  Musclespart_3_2: { roughness: "Muscles_MusclesPart_3_Roughness.jpg", layer: "muscles", color: "#881337", roughnessVal: 0.6 },
  Musclespart_2_2: { map: "Muscles_MusclesPart_2_BaseColor.jpg", normal: "Muscles_MusclesPart_2_Normal.jpg", roughness: "Muscles_MusclesPart_2_Roughness.jpg", layer: "muscles", color: "#881337", roughnessVal: 0.6 },
  Musclespart_1_2: { map: "Muscles_MusclesPart_1_BaseColor.jpg", normal: "Muscles_MusclesPart_1_Normal.jpg", roughness: "Muscles_MusclesPart_1_Roughness.jpg", layer: "muscles", color: "#881337", roughnessVal: 0.6 },
  Arteriasmesh_2: { map: "CirculatorySystem_albedo.jpeg", normal: "CirculatorySystem_normal.jpg", roughness: "CirculatorySystem_roughness.jpeg", layer: "vessels", color: "#dc2626", roughnessVal: 0.35 },
  Venasmesh_2: { map: "CirculatorySystem_albedo.jpeg", normal: "CirculatorySystem_normal.jpg", roughness: "CirculatorySystem_roughness.jpeg", layer: "vessels", color: "#2563eb", roughnessVal: 0.35 },
  HumanSkin_2: { roughness: "HumanSkin_Roughness.jpg", layer: "skin", color: "#c98f70", roughnessVal: 0.76 },
  Shorts_2: { map: "Shorts_BaseColor.jpg", normal: "Shorts_Normal.jpg", roughness: "Shorts_Roughness.jpg", layer: "skin", color: "#18181b", roughnessVal: 0.85 },
  Eyelash_2: { layer: "organs", color: "#18181b", roughnessVal: 0.9 },
  Heart_2: { map: "Heart_Albedo.jpeg", normal: "Heart_Normal_DirectX.jpeg", roughness: "Heart_Roughness.jpeg", layer: "organs", color: "#9f1239", roughnessVal: 0.38 },
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
    onPick = () => {},
  },
  ref
) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const meshesRef = useRef(new Map());
  const slicePlaneRef = useRef(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
  const sliceHelperRef = useRef(null);
  const modelGroupRef = useRef(null);
  const modelBoundsRef = useRef(new THREE.Box3());

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

  // Expose camera controls
  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (!controlsRef.current || !cameraRef.current) return;
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(-150, 10, 150);
      controlsRef.current.update();
    },
    focusMesh: (meshName) => {
      const mesh = meshesRef.current.get(meshName);
      if (mesh && controlsRef.current && cameraRef.current) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        controlsRef.current.target.copy(center);
        cameraRef.current.position.set(center.x - 30, center.y + 5, center.z + 35);
        controlsRef.current.update();
      }
    },
    focusTopic: (topic) => {
      if (!controlsRef.current || !cameraRef.current) return;
      if (!topic || topic.id === "all") {
        controlsRef.current.target.set(0, 0, 0);
        cameraRef.current.position.set(-150, 10, 150);
        controlsRef.current.update();
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
        const dist = Math.max(maxDim * 1.5, 14);
        controlsRef.current.target.copy(center);
        const dir = new THREE.Vector3(-1.0, 0.15, 1.0).normalize();
        cameraRef.current.position.copy(center).addScaledVector(dir, dist);
        controlsRef.current.update();
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
    scene.background = new THREE.Color("#08090d");
    sceneRef.current = scene;
    window.__anatomyScene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(-150, 10, 150);
    cameraRef.current = camera;
    window.__anatomyCamera = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    window.__anatomyControls = controls;

    // Professional Medical Studio Lighting (High quality, medium lightness, not too bright)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x0f172a, 0.35);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    // Key Light - soft warm anatomical light aligned with default front-left camera view
    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 0.85);
    dirLight1.position.set(-120, 120, 140);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    // Fill Light - soft subtle secondary fill
    const dirLight2 = new THREE.DirectionalLight(0xe2e8f0, 0.45);
    dirLight2.position.set(120, 60, 60);
    scene.add(dirLight2);

    // Rim Light - highlights anatomical contours without washing out
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
    rimLight.position.set(0, 80, -120);
    scene.add(rimLight);

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
            const mat = new THREE.MeshStandardMaterial({
              name: child.name,
              color: new THREE.Color(spec.color || 0xcccccc),
              roughness: spec.roughnessVal ?? 0.68,
              metalness: 0.0,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 1.0,
              clippingPlanes: [],
              clipShadows: true,
            });

            if (spec.map) mat.map = getTex(spec.map, true);
            if (spec.normal) {
              mat.normalMap = getTex(spec.normal, false);
              mat.normalScale = new THREE.Vector2(0.65, 0.65);
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

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#08090d]">
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
