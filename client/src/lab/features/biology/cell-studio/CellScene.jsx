import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, ContactShadows, Float, Html, OrbitControls, RoundedBox, useGLTF, useProgress } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  Box3,
  CatmullRomCurve3,
  DoubleSide,
  FrontSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  PCFShadowMap,
  PMREMGenerator,
  ACESFilmicToneMapping,
  TubeGeometry,
  Vector3,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MUSCLE_ANNOTATIONS, MUSCLE_OVERVIEW_CAMERA } from "./data/muscleAnnotations";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Highlight/dim a procedural organelle based on the active selection + view mode.
function CellMaterial({ id, activeOrganelle, viewMode, color, opacity = 1, roughness = 0.36, metalness = 0.08 }) {
  const active = id === activeOrganelle;
  const dimmed = viewMode === "focus" && !active;
  const material = {
    color,
    roughness,
    metalness,
    transparent: opacity < 1 || dimmed,
    opacity: dimmed ? Math.min(opacity, 0.18) : opacity,
    emissive: active ? color : "#000000",
    emissiveIntensity: active ? 0.55 : 0,
  };
  return <meshStandardMaterial {...material} />;
}

function CurveTube({ id, color, points, radius = 0.035, activeOrganelle, viewMode }) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(point[0], point[1], point[2])));
    return new TubeGeometry(curve, 80, radius, 12, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color={color} roughness={0.58} />
    </mesh>
  );
}

function applyAssetVertexColors(mesh, cell) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  if (!position) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const sizeX = Math.max(box.max.x - box.min.x, 0.001);
  const sizeY = Math.max(box.max.y - box.min.y, 0.001);
  const sizeZ = Math.max(box.max.z - box.min.z, 0.001);
  const palette = [
    new Color(cell.color),
    new Color(cell.accent),
    ...cell.organelles.map((organelle) => new Color(organelle.color)),
  ];
  const highlight = new Color("#fff4d8");
  const shadow = new Color("#3d4a72");
  const colors = [];

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const nx = (x - box.min.x) / sizeX;
    const ny = (y - box.min.y) / sizeY;
    const nz = (z - box.min.z) / sizeZ;
    const flow = Math.sin(nx * 11.6 + ny * 4.8) + Math.cos(ny * 9.4 + nz * 7.2);
    const paletteIndex = Math.abs(Math.floor((flow + nx * 3.2 + ny * 2.6) * palette.length)) % palette.length;
    const color = new Color(cell.color).lerp(palette[paletteIndex], 0.48);
    color.lerp(highlight, Math.max(0, nz - 0.24) * 0.22);
    color.lerp(shadow, Math.max(0, 0.32 - nz) * 0.12);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function createAssetMaterial({ original, cell, viewMode, crossSection }) {
  const source = Array.isArray(original) ? original[0] : original;
  const sourceMaterial = source || {};
  const material = new MeshStandardMaterial({
    color: "#ffffff",
    map: sourceMaterial.map ?? null,
    normalMap: sourceMaterial.normalMap ?? null,
    roughnessMap: sourceMaterial.roughnessMap ?? null,
    metalnessMap: sourceMaterial.metalnessMap ?? null,
    side: DoubleSide,
    vertexColors: true,
    transparent: crossSection || viewMode === "focus" || sourceMaterial.transparent,
    opacity: crossSection ? 0.92 : viewMode === "focus" ? 0.95 : sourceMaterial.opacity ?? 1,
    roughness: Math.min(0.82, sourceMaterial.roughness ?? 0.46),
    metalness: Math.min(0.12, sourceMaterial.metalness ?? 0.03),
    emissive: new Color(cell.accent).lerp(new Color("#ffffff"), 0.58),
    emissiveIntensity: viewMode === "focus" ? 0.045 : 0.016,
  });

  material.envMapIntensity = 0.75 * (cell.modelAsset?.exposure ?? 1);
  material.needsUpdate = true;
  return material;
}

function createNativeAssetMaterial({ original, asset, crossSection }) {
  const cloneMaterial = (source) => {
    const material = source.clone();
    material.side = DoubleSide;
    material.transparent = crossSection || material.transparent;
    material.opacity = crossSection ? Math.min(material.opacity, 0.86) : material.opacity;

    if (material instanceof MeshStandardMaterial) {
      const displayMap = material.map ?? null;
      if (displayMap) {
        displayMap.anisotropy = 8;
        displayMap.needsUpdate = true;
      }
      material.vertexColors = false;
      material.emissive = new Color("#fff8eb");
      material.emissiveMap = displayMap;
      material.emissiveIntensity = 0.07 * (asset.exposure ?? 1);
      material.envMapIntensity = 0.62 * (asset.exposure ?? 1);
      material.roughness = Math.max(0.34, Math.min(material.roughness, 0.58));
      material.metalness = Math.min(material.metalness, 0.08);
      material.color.setRGB(1.04, 1.035, 1.02);
    }

    material.needsUpdate = true;
    return material;
  };

  return Array.isArray(original) ? original.map(cloneMaterial) : cloneMaterial(original);
}

function createEukaryoticOrganelleMaterial(node, asset, crossSection) {
  const name = node.name || "";
  const isOuterMembrane = name.includes("Plasma_membrane_outlide");
  const isInnerMembrane = name.includes("Plasma_membrane_inside");

  const mat = new MeshStandardMaterial();
  if (name.includes("UMesh_Nucleolous")) {
    mat.color = new Color("#ec4899");
    mat.roughness = 0.25;
  } else if (name.includes("Nucleolus1")) {
    mat.color = new Color("#8b5cf6");
    mat.roughness = 0.4;
  } else if (name.includes("Golgi")) {
    mat.color = new Color("#f97316");
    mat.roughness = 0.35;
  } else if (name.includes("Rough_endoplasmic")) {
    mat.color = new Color("#e11d48");
    mat.roughness = 0.42;
  } else if (name.includes("Smooth_endoplasmic")) {
    mat.color = new Color("#06b6d4");
    mat.roughness = 0.32;
  } else if (name.includes("Centriole")) {
    mat.color = new Color("#f59e0b");
    mat.roughness = 0.25;
  } else if (name.includes("Microtubule")) {
    mat.color = new Color("#38bdf8");
    mat.roughness = 0.3;
  } else if (name.includes("Twisted_Fibers")) {
    mat.color = new Color("#0284c7");
    mat.roughness = 0.3;
  } else if (name.includes("Vesicles")) {
    mat.color = new Color("#a855f7");
    mat.roughness = 0.2;
  } else if (name.includes("Periox")) {
    mat.color = new Color("#10b981");
    mat.roughness = 0.3;
  } else if (name.includes("Mitochondrium")) {
    mat.color = new Color("#ef4444");
    mat.roughness = 0.35;
  } else if (isOuterMembrane) {
    mat.color = new Color("#60a5fa");
    mat.transparent = true;
    mat.opacity = crossSection ? 0.05 : 0.12;
    mat.depthWrite = false;
    mat.side = FrontSide;
  } else if (isInnerMembrane) {
    mat.color = new Color("#3b82f6");
    mat.transparent = true;
    mat.opacity = 0.15;
    mat.depthWrite = false;
    mat.side = FrontSide;
  } else {
    mat.color = new Color("#94a3b8");
  }
  return mat;
}

function getMuscleOrganelleId(name = "") {
  const n = name.toLowerCase();
  if (n.includes("actin")) return "actin";
  if (n.includes("myosin")) return "myosin";
  if (n.includes("myofibril")) return "myofibril";
  if (n.includes("sarcoplasmic")) return "sarcoplasmic";
  if (n.includes("mitochondria")) return "mitochondria";
  if (n.includes("muscle_fiber")) return "sarcolemma";
  if (n.includes("fascicle")) return "fascicle";
  if (n.includes("epimysium") || n.includes("perimysium") || n.includes("muscle_muscle")) return "epimysium";
  return "myofibril";
}

function isSheathForActive(nameLower, activeOrganelle) {
  const isWholeMuscleOrEpimysium =
    nameLower.includes("epimysium") ||
    nameLower.includes("perimysium") ||
    nameLower.includes("muscle_muscle");

  const isFascicle = nameLower.includes("fascicle");
  const isFiber = nameLower.includes("muscle_fiber") || nameLower.includes("muscle_fibers");

  if (["actin", "myosin", "myofibril", "sarcoplasmic", "mitochondria"].includes(activeOrganelle)) {
    return isWholeMuscleOrEpimysium || isFascicle || isFiber;
  }
  if (activeOrganelle === "sarcolemma") {
    return isWholeMuscleOrEpimysium || isFascicle;
  }
  if (activeOrganelle === "fascicle") {
    return isWholeMuscleOrEpimysium;
  }
  return false;
}

function MuscleLandmarkPins({ activeLandmarkNum, onSelectLandmark, showLabels = true }) {
  const [hovered, setHovered] = useState(null);

  return (
    <group>
      {MUSCLE_ANNOTATIONS.map((lm) => {
        const isActive = activeLandmarkNum === lm.num;
        const isHovered = hovered === lm.num;
        return (
          <group key={lm.num} position={lm.position}>
            <Html center distanceFactor={14} zIndexRange={[100, 0]}>
              <div style={{ display: showLabels ? "block" : "none" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLandmark?.(lm.num, lm.id);
                  }}
                  onMouseEnter={() => setHovered(lm.num)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group pointer-events-auto relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-2xl select-none ${
                    isActive
                      ? "h-7 w-7 bg-amber-500 text-black font-extrabold ring-4 ring-amber-400/80 scale-125"
                      : "h-6 w-6 bg-black/85 text-white/95 font-bold ring-1 ring-white/50 hover:scale-125 hover:bg-amber-500 hover:text-black"
                  }`}
                  style={{ transform: "translate3d(0,0,0)" }}
                >
                  <span className="text-[11px] leading-none font-black">{lm.num}</span>
                  {(isActive || isHovered) && (
                    <div className="absolute bottom-full mb-1.5 whitespace-nowrap rounded-md bg-black/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xl pointer-events-none border border-white/20 backdrop-blur-md">
                      <span className="text-amber-400 font-bold mr-1">{lm.num}.</span>
                      {lm.nameUz || lm.name}
                    </div>
                  )}
                </button>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function MuscleCameraController({ activeLandmarkNum, controlsRef, isOverview = false }) {
  const { camera } = useThree();
  const animRef = useRef({
    active: false,
    startEye: new Vector3(),
    startTarget: new Vector3(),
    endEye: new Vector3(),
    endTarget: new Vector3(),
    progress: 1,
  });

  useEffect(() => {
    camera.up.set(0, 1, 0);
    const lm = MUSCLE_ANNOTATIONS.find((a) => a.num === activeLandmarkNum);
    const targetEye = isOverview || !lm
      ? new Vector3(...MUSCLE_OVERVIEW_CAMERA.eye)
      : new Vector3(...lm.eye);
    const targetLook = isOverview || !lm
      ? new Vector3(...MUSCLE_OVERVIEW_CAMERA.target)
      : new Vector3(...lm.target);

    animRef.current = {
      active: true,
      startEye: camera.position.clone(),
      startTarget: controlsRef.current ? controlsRef.current.target.clone() : new Vector3(...MUSCLE_OVERVIEW_CAMERA.target),
      endEye: targetEye,
      endTarget: targetLook,
      progress: 0,
    };
  }, [activeLandmarkNum, isOverview, camera, controlsRef]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      animRef.current.active = false;
    };
    controls.addEventListener("start", onStart);
    return () => controls.removeEventListener("start", onStart);
  }, [controlsRef]);

  useFrame((_, delta) => {
    if (!animRef.current.active) return;
    const anim = animRef.current;
    anim.progress += delta * 2.2;
    if (anim.progress >= 1) {
      anim.progress = 1;
      anim.active = false;
      camera.position.copy(anim.endEye);
      if (controlsRef.current) {
        controlsRef.current.target.copy(anim.endTarget);
        controlsRef.current.update();
      }
    } else {
      const p = anim.progress;
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      camera.position.lerpVectors(anim.startEye, anim.endEye, t);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(anim.startTarget, anim.endTarget, t);
        controlsRef.current.update();
      }
    }
  });

  return null;
}

function createMuscleOrganelleMaterial(mesh, activeOrganelle, crossSection, cell, viewMode) {
  const name = mesh.name || "";
  const nameLower = name.toLowerCase();
  const orgId = getMuscleOrganelleId(name);
  const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

  const mat = origMat ? origMat.clone() : new MeshStandardMaterial();
  mat.side = DoubleSide;
  mat.color = new Color(0xffffff);

  if (!mat.map && origMat?.map) mat.map = origMat.map;
  if (!mat.normalMap && origMat?.normalMap) mat.normalMap = origMat.normalMap;
  if (!mat.roughnessMap && origMat?.roughnessMap) mat.roughnessMap = origMat.roughnessMap;

  // Wet organic biological tissue sheen - glossy PBR specular
  mat.roughness = origMat?.roughness !== undefined ? Math.min(origMat.roughness, 0.32) : 0.28;
  mat.metalness = origMat?.metalness !== undefined ? Math.min(origMat.metalness, 0.08) : 0.02;
  mat.envMapIntensity = 1.35;

  if (origMat?.aoMap) {
    mat.aoMap = origMat.aoMap;
    mat.aoMapIntensity = 1.0;
  }
  // Pure native biological colors - no flat emissive washout!
  mat.emissive = new Color(0x000000);
  mat.emissiveIntensity = 0;

  if (viewMode === "focus") {
    const isCurrentActive = orgId === activeOrganelle;
    if (isCurrentActive) {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.depthWrite = true;
    } else {
      mat.transparent = true;
      mat.opacity = 0.16;
      mat.depthWrite = false;
    }
  } else if (crossSection) {
    const isSheath = nameLower.includes("epimysium") || nameLower.includes("perimysium") || nameLower.includes("muscle_muscle");
    mat.transparent = isSheath;
    mat.opacity = isSheath ? 0.22 : 1.0;
    mat.depthWrite = !isSheath;
  } else {
    mat.transparent = origMat?.transparent || false;
    mat.opacity = origMat?.opacity ?? 1.0;
    mat.depthWrite = true;
  }

  mesh.userData.organelleId = orgId;
  return mat;
}

function AssetCellModel({
  cell,
  asset,
  activeOrganelle,
  activeLandmarkNum,
  viewMode,
  crossSection,
  onSelectOrganelle,
  onSelectLandmark,
  showLabels = true,
}) {
  const base = import.meta.env.BASE_URL || "/";
  const dracoPath = `${base}draco/`.replace(/\/+/g, "/");
  const modelUrl = asset.url.startsWith("http") ? asset.url : `${base}${asset.url.replace(/^\//, "")}`;
  const { scene } = useGLTF(modelUrl, dracoPath);
  const isMuscle = !!asset.isSketchfabSkeletalMuscle;

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      const mesh = node;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (asset.url?.includes("eukaryotic-cell")) {
        if (mesh.geometry?.attributes?.color) {
          mesh.geometry.deleteAttribute("color");
        }
        mesh.material = createEukaryoticOrganelleMaterial(mesh, asset, crossSection);
        mesh.material.vertexColors = false;
      } else if (isMuscle) {
        if (mesh.geometry?.attributes?.color) {
          mesh.geometry.deleteAttribute("color");
        }
        mesh.material = createMuscleOrganelleMaterial(mesh, activeOrganelle, crossSection, cell, viewMode);
        mesh.material.vertexColors = false;
      } else if (asset.materialMode === "native") {
        mesh.material = createNativeAssetMaterial({ original: mesh.material, asset, crossSection });
      } else {
        mesh.geometry.computeVertexNormals();
        applyAssetVertexColors(mesh, cell);
        mesh.material = createAssetMaterial({ original: mesh.material, cell, viewMode, crossSection });
      }
    });
    return clone;
  }, [cell, scene, viewMode, crossSection, asset, activeOrganelle, isMuscle]);

  useEffect(() => {
    if (isMuscle) {
      window.__MUSCLE_SCENE__ = clonedScene;
    }
  }, [clonedScene, isMuscle]);

  if (isMuscle) {
    return (
      <group>
        <primitive object={clonedScene} />
        <MuscleLandmarkPins
          activeLandmarkNum={activeLandmarkNum}
          onSelectLandmark={onSelectLandmark}
          showLabels={showLabels}
        />
      </group>
    );
  }

  return (
    <group
      position={asset.position ?? [0, 0, 0]}
      rotation={asset.rotation ?? [0, 0, 0]}
    >
      <Center>
        <primitive object={clonedScene} scale={[asset.scale, asset.scale, asset.scale]} />
      </Center>
    </group>
  );
}

function Dots({ id, color, activeOrganelle, viewMode, count, spread }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const a = index * 1.71;
        const b = index * 2.37;
        return [Math.sin(a) * spread[0], Math.cos(b) * spread[1], Math.sin(a + b) * spread[2]];
      }),
    [count, spread],
  );

  return (
    <>
      {dots.map((position, index) => (
        <mesh key={`${id}-${index}`} position={position} castShadow>
          <sphereGeometry args={[0.055 + (index % 3) * 0.018, 18, 18]} />
          <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color={color} opacity={0.92} />
        </mesh>
      ))}
    </>
  );
}

function Nucleus({ id = "nucleus", position, scale, activeOrganelle, viewMode, color = "#7047a8" }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color={color} opacity={0.92} roughness={0.44} />
      </mesh>
      <mesh position={[0.2, 0.16, 0.38]} castShadow>
        <sphereGeometry args={[0.23, 28, 28]} />
        <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color="#b56ad8" opacity={0.9} />
      </mesh>
    </group>
  );
}

function Mitochondrion({ id = "mitochondrion", position, rotation = [0, 0, 0], scale = [1, 1, 1], activeOrganelle, viewMode }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.16, 0.46, 10, 24]} />
        <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color="#cf7042" />
      </mesh>
      {[0, 1, 2].map((item) => (
        <mesh key={item} position={[0, -0.18 + item * 0.18, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.09, 0.012, 8, 18]} />
          <CellMaterial id={id} activeOrganelle={activeOrganelle} viewMode={viewMode} color="#f0b074" />
        </mesh>
      ))}
    </group>
  );
}

function PlantModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.1, -0.28, 0]}>
      <RoundedBox args={[4.7, 2.7, 0.42]} radius={0.18} smoothness={8} position={[0, 0, 0]}>
        <CellMaterial id="cellWall" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#65a30d" opacity={crossSection ? 0.15 : 0.28} />
      </RoundedBox>
      <RoundedBox args={[4.18, 2.24, 0.24]} radius={0.12} smoothness={8} position={[0.02, 0.02, 0.08]}>
        <CellMaterial id="cellWall" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#15803d" opacity={0.12} />
      </RoundedBox>
      <mesh position={[-0.45, -0.12, 0.32]} scale={[1.05, 0.78, 0.28]} castShadow>
        <sphereGeometry args={[0.78, 46, 46]} />
        <CellMaterial id="vacuole" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#38bdf8" opacity={0.7} />
      </mesh>
      <Nucleus position={[0.92, 0.42, 0.45]} scale={[0.52, 0.52, 0.38]} color="#8b5cf6" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      {[
        [-1.65, 0.48, 0.28],
        [1.68, -0.38, 0.3],
        [-1.52, -0.62, 0.22],
      ].map((position, index) => (
        <group key={index} position={position} rotation={[0, 0, index * 0.7]}>
          <mesh scale={[0.35, 0.18, 0.12]} castShadow>
            <sphereGeometry args={[1, 30, 20]} />
            <CellMaterial id="chloroplast" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#22c55e" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]}>
            <torusGeometry args={[0.22, 0.012, 8, 42]} />
            <CellMaterial id="chloroplast" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#86efac" />
          </mesh>
        </group>
      ))}
      <Mitochondrion position={[0.28, -0.72, 0.42]} rotation={[0.3, 0.2, 1.35]} scale={[0.95, 0.95, 0.95]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <CurveTube id="nucleus" color="#f97316" points={[[0.42, 0.12, 0.42], [0.62, -0.06, 0.5], [1.05, -0.08, 0.46], [1.44, 0.06, 0.38]]} radius={0.05} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Dots id="vacuole" color="#a855f7" count={18} spread={[1.72, 0.92, 0.42]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function WhiteBloodModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group scale={[1.2, 1.2, 1.2]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.35, 64, 64]} />
        <CellMaterial id="membrane" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#e2e8f0" opacity={crossSection ? 0.12 : 0.22} />
      </mesh>
      {[
        [-0.42, 0.22, 0.34],
        [0.28, 0.06, 0.36],
        [0.02, -0.42, 0.28],
      ].map((position, index) => (
        <Nucleus key={index} id="nucleus" position={position} scale={[0.42, 0.36, 0.28]} color="#7c3aed" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      ))}
      <Dots id="granules" color="#ec4899" count={30} spread={[1.05, 1.02, 0.72]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Dots id="lysosome" color="#06b6d4" count={12} spread={[0.92, 0.88, 0.62]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function NeuronModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.02, -0.2, 0]} scale={[1.05, 1.05, 1.05]}>
      <Nucleus id="soma" position={[-0.55, 0, 0.08]} scale={[0.64, 0.58, 0.44]} color="#8b5cf6" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <mesh position={[-0.55, 0, 0]} scale={[0.94, 0.82, 0.62]} castShadow receiveShadow>
        <sphereGeometry args={[1, 52, 52]} />
        <CellMaterial id="soma" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#6366f1" opacity={crossSection ? 0.18 : 0.38} />
      </mesh>
      <CurveTube id="axon" color="#06b6d4" points={[[0.04, 0.02, 0.04], [0.72, -0.02, 0.02], [1.56, 0.04, 0.02], [2.35, -0.04, 0]]} radius={0.08} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      {[0.55, 1.06, 1.58, 2.08].map((x, index) => (
        <mesh key={index} position={[x, 0, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.16, 0.24, 8, 24]} />
          <CellMaterial id="axon" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#f59e0b" opacity={0.94} />
        </mesh>
      ))}
      {[
        [[-1.08, 0.28, 0], [-1.55, 0.82, 0.08], [-2.1, 1.03, 0]],
        [[-1.16, -0.18, 0], [-1.7, -0.54, 0.05], [-2.2, -0.9, 0]],
        [[-0.78, 0.58, 0.04], [-0.82, 1.16, 0.02], [-1.12, 1.58, 0]],
        [[-0.9, -0.55, 0.04], [-0.92, -1.04, 0], [-1.2, -1.44, 0.02]],
      ].map((points, index) => (
        <CurveTube key={index} id="dendrites" color="#38bdf8" points={points} radius={0.052} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      ))}
      <Dots id="dendrites" color="#ec4899" count={12} spread={[2.2, 1.4, 0.2]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function EpithelialModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.08, -0.22, 0]} scale={[1.08, 1.08, 1.08]}>
      <RoundedBox args={[2.4, 2.0, 0.72]} radius={0.1} smoothness={8} position={[0, -0.12, 0]}>
        <CellMaterial id="membrane" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#fb7185" opacity={crossSection ? 0.16 : 0.28} />
      </RoundedBox>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={index} position={[-1.1 + index * 0.2, 1.04, 0.08]} castShadow>
          <capsuleGeometry args={[0.045, 0.34, 8, 14]} />
          <CellMaterial id="microvilli" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#e11d48" />
        </mesh>
      ))}
      <Nucleus position={[0.15, -0.2, 0.32]} scale={[0.55, 0.5, 0.36]} color="#8b5cf6" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <CurveTube id="junctions" color="#06b6d4" points={[[-1.18, 0.74, 0.38], [-0.6, 0.7, 0.44], [0.1, 0.73, 0.4], [0.96, 0.68, 0.42]]} radius={0.04} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Dots id="nucleus" color="#ec4899" count={18} spread={[0.96, 0.72, 0.38]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function BacteriaModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.02, 0.1, -0.02]} scale={[1.12, 1.12, 1.12]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.78, 2.9, 14, 48]} />
        <CellMaterial id="cellWall" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#0d9488" opacity={crossSection ? 0.18 : 0.38} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.88, 0.88, 0.82]}>
        <capsuleGeometry args={[0.62, 2.6, 12, 40]} />
        <CellMaterial id="cellWall" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#047857" opacity={0.22} />
      </mesh>
      <CurveTube id="nucleoid" color="#eab308" points={[[-0.9, 0.12, 0.3], [-0.42, -0.14, 0.38], [0.1, 0.18, 0.34], [0.62, -0.12, 0.36], [1.02, 0.06, 0.32]]} radius={0.12} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <CurveTube id="flagellum" color="#38bdf8" points={[[1.82, -0.22, 0.08], [2.35, -0.72, 0], [2.95, -0.5, 0.02], [3.55, -0.95, 0]]} radius={0.055} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Dots id="nucleoid" color="#f59e0b" count={34} spread={[1.42, 0.48, 0.36]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function AnimalModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.06, -0.34, 0]} scale={[1.08, 1.08, 1.08]}>
      <mesh scale={[1.7, 1.25, 0.72]} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <CellMaterial id="membrane" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#60a5fa" opacity={crossSection ? 0.12 : 0.25} />
      </mesh>
      <Nucleus position={[0.22, 0.18, 0.36]} scale={[0.55, 0.55, 0.42]} color="#8b5cf6" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Mitochondrion position={[-0.82, 0.44, 0.32]} rotation={[0.4, 0.1, 1.12]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      <Mitochondrion position={[0.82, -0.42, 0.25]} rotation={[0.1, 0.35, -0.75]} scale={[0.9, 0.9, 0.9]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[-0.24 + index * 0.18, -0.56 + index * 0.08, 0.46]} rotation={[0.2, 0, 0.7]}>
          <torusGeometry args={[0.38 + index * 0.035, 0.025, 10, 52]} />
          <CellMaterial id="golgi" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#f97316" />
        </mesh>
      ))}
      <Dots id="nucleus" color="#ec4899" count={28} spread={[1.25, 0.85, 0.46]} activeOrganelle={activeOrganelle} viewMode={viewMode} />
    </group>
  );
}

function MuscleModel({ activeOrganelle, viewMode, crossSection }) {
  return (
    <group rotation={[0.15, -0.26, -0.03]} scale={[1.08, 1.08, 1.08]}>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.95, 1, 0.82]} castShadow receiveShadow>
        <capsuleGeometry args={[0.76, 2.9, 14, 48]} />
        <CellMaterial id="sarcolemma" activeOrganelle={activeOrganelle} viewMode={viewMode} color="#ea580c" opacity={crossSection ? 0.14 : 0.28} />
      </mesh>
      {[-0.42, 0, 0.42].map((y, row) =>
        [-0.58, 0.24, 1.06].map((x, index) => (
          <mesh key={`${row}-${index}`} position={[x, y, 0.15]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.86, 24]} />
            <CellMaterial id="myofibril" activeOrganelle={activeOrganelle} viewMode={viewMode} color={index % 2 === 0 ? "#dc2626" : "#b91c1c"} />
          </mesh>
        )),
      )}
      {[-1.1, 1.42].map((x, index) => (
        <Nucleus key={index} id="mitochondria" position={[x, 0.54 - index * 0.92, 0.36]} scale={[0.26, 0.2, 0.18]} color="#ef4444" activeOrganelle={activeOrganelle} viewMode={viewMode} />
      ))}
      {[0, 1, 2, 3, 4].map((index) => (
        <CurveTube key={index} id="sarcolemma" color="#f97316" points={[[-1.55 + index * 0.65, -0.86, 0.26], [-1.45 + index * 0.65, -0.24, 0.34], [-1.55 + index * 0.65, 0.72, 0.28]]} radius={0.035} activeOrganelle={activeOrganelle} viewMode={viewMode} />
      ))}
    </group>
  );
}

function CellModel({
  cell,
  activeOrganelle,
  activeLandmarkNum,
  viewMode,
  crossSection,
  autoRotate,
  onSelectOrganelle,
  onSelectLandmark,
  showLabels,
}) {
  const group = useRef(null);
  const isMuscle = !!cell.modelAsset?.isSketchfabSkeletalMuscle;

  useFrame((_, delta) => {
    if (group.current && autoRotate && !isMuscle) {
      group.current.rotation.y += delta * 0.1;
    }
  });

  const common = {
    cell,
    activeOrganelle,
    activeLandmarkNum,
    viewMode,
    crossSection,
    onSelectOrganelle,
    onSelectLandmark,
    showLabels,
  };

  return (
    <group ref={group} position={[0, 0, 0]}>
      {cell.modelAsset ? (
        <AssetCellModel asset={cell.modelAsset} {...common} />
      ) : (
        <>
          {cell.modelKind === "plant" && <PlantModel {...common} />}
          {cell.modelKind === "whiteBlood" && <WhiteBloodModel {...common} />}
          {cell.modelKind === "neuron" && <NeuronModel {...common} />}
          {cell.modelKind === "epithelial" && <EpithelialModel {...common} />}
          {cell.modelKind === "bacteria" && <BacteriaModel {...common} />}
          {cell.modelKind === "animal" && <AnimalModel {...common} />}
          {cell.modelKind === "muscle" && <MuscleModel {...common} />}
        </>
      )}
    </group>
  );
}

function ModelLoadingOverlay({ cell }) {
  const { progress } = useProgress();
  const displayProgress = Math.max(8, Math.min(100, Math.round(progress)));

  return (
    <Html center>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 180, color: "#334155", fontSize: 13 }}>
        <span style={{ opacity: 0.75 }}>3D namuna yuklanmoqda</span>
        <strong>{cell.name}</strong>
        <i style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden", fontStyle: "normal" }}>
          <b style={{ display: "block", height: "100%", width: `${displayProgress}%`, background: cell.accent }} />
        </i>
        <em style={{ fontStyle: "normal", opacity: 0.7 }}>{displayProgress}%</em>
      </div>
    </Html>
  );
}

function CameraResetWatcher({ resetKey, isMuscle, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (resetKey > 0) {
      if (isMuscle) {
        camera.position.set(...MUSCLE_OVERVIEW_CAMERA.eye);
        camera.up.set(0, 1, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(...MUSCLE_OVERVIEW_CAMERA.target);
          controlsRef.current.update();
        }
      } else {
        camera.position.set(0, 0.2, 5.8);
        camera.up.set(0, 1, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    }
  }, [resetKey, isMuscle, camera, controlsRef]);
  return null;
}

export default function CellScene({
  cell,
  activeOrganelle,
  activeLandmarkNum = 1,
  viewMode,
  crossSection,
  autoRotate,
  resetKey,
  onSelectOrganelle,
  onSelectLandmark,
  showLabels = true,
  isOverview = false,
  studioTheme = "dark",
}) {
  const isMuscle = !!cell.modelAsset?.isSketchfabSkeletalMuscle;
  const controlsRef = useRef(null);

  const initialCamera = useMemo(() => {
    if (isMuscle) {
      return {
        position: MUSCLE_OVERVIEW_CAMERA.eye,
        fov: MUSCLE_OVERVIEW_CAMERA.fov,
        near: 0.01,
        far: 500,
        up: [0, 1, 0],
      };
    }
    return {
      position: [0, 0.2, 5.8],
      fov: 38,
      near: 0.05,
      far: 100,
      up: [0, 1, 0],
    };
  }, [isMuscle]);

  const bgColor = studioTheme === "light" ? "#f8fafc" : "#0d131f";

  return (
    <ErrorBoundary>
      <Canvas
        key={cell.id}
        dpr={[1, 2]}
        shadows={{ type: PCFShadowMap }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          premultipliedAlpha: false,
        }}
        camera={initialCamera}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={[bgColor]} />
        <StudioEnvironment />
        <CameraResetWatcher resetKey={resetKey} isMuscle={isMuscle} controlsRef={controlsRef} />

      {/* Studio Lighting */}
      {isMuscle ? (
        <>
          <directionalLight position={[10, 24, 15]} intensity={1.6} castShadow color="#ffffff" />
          <directionalLight position={[-15, 10, 8]} intensity={0.9} color="#e0f2fe" />
          <pointLight position={[15, -12, 10]} intensity={1.2} color="#fef08a" />
          <ambientLight intensity={0.7} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.8} />
          <hemisphereLight skyColor="#ffffff" groundColor="#334155" intensity={0.65} />
          <directionalLight position={[4.5, 6.0, 5.5]} intensity={1.5} castShadow />
          <directionalLight position={[-4.5, 2.5, 3.5]} intensity={0.85} color="#e2e8f0" />
          <pointLight position={[2.5, -1.5, 3.0]} intensity={0.5} color="#94a3b8" />
        </>
      )}

      <Suspense fallback={null}>
        {isMuscle ? (
          <>
            <CellModel
              cell={cell}
              activeOrganelle={activeOrganelle}
              activeLandmarkNum={activeLandmarkNum}
              viewMode={viewMode}
              crossSection={crossSection}
              autoRotate={autoRotate}
              onSelectOrganelle={onSelectOrganelle}
              onSelectLandmark={onSelectLandmark}
              showLabels={showLabels}
            />
            <MuscleCameraController
              activeLandmarkNum={activeLandmarkNum}
              controlsRef={controlsRef}
              isOverview={isOverview}
            />
            <ContactShadows
              position={[3.605, -2.95, -12.659]}
              opacity={0.35}
              scale={45}
              blur={2.4}
              far={12}
              color="#020617"
            />
          </>
        ) : (
          <>
            <Float speed={1.25} rotationIntensity={0.08} floatIntensity={0.18}>
              <CellModel
                cell={cell}
                activeOrganelle={activeOrganelle}
                viewMode={viewMode}
                crossSection={crossSection}
                autoRotate={autoRotate}
                onSelectOrganelle={onSelectOrganelle}
                showLabels={showLabels}
              />
            </Float>
            <ContactShadows
              position={[0, -1.8, 0]}
              opacity={0.25}
              scale={7.5}
              blur={2.4}
              far={4.2}
            />
          </>
        )}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        enablePan
        screenSpacePanning
        minDistance={0.005}
        maxDistance={100.0}
        zoomSpeed={1.2}
        rotateSpeed={0.8}
        panSpeed={0.8}
      />
    </Canvas>
  </ErrorBoundary>
  );
}
