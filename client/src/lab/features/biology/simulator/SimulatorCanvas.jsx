import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Bounds, Center, useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";
import { resolveMaterial } from "@/lab/data/anatomyMaterials";
import { MODEL_URLS, ORGAN_INFO, BODY_LAYERS } from "./engine/anatomyData";

const HOVER_COLOR = new THREE.Color("#22d3ee");
const SELECT_COLOR = new THREE.Color("#38bdf8");
const NOOP = () => {};

// Restore a mesh material to its base state
function restoreMesh(mesh) {
  if (!mesh?.userData?.baseColor) return;
  mesh.material.color.copy(mesh.userData.baseColor);
  if (mesh.material.emissive) {
    mesh.material.emissive.set("#000000");
    mesh.material.emissiveIntensity = 0;
  }
}

// Highlight a mesh on hover
function applyHover(mesh) {
  if (!mesh?.material?.color) return;
  mesh.material.color.lerp(HOVER_COLOR, 0.35);
  if (mesh.material.emissive) {
    mesh.material.emissive.copy(HOVER_COLOR);
    mesh.material.emissiveIntensity = 0.25;
  }
}

// Highlight a mesh on selection
function applySelect(mesh) {
  if (!mesh?.material?.color) return;
  mesh.material.color.lerp(SELECT_COLOR, 0.55);
  if (mesh.material.emissive) {
    mesh.material.emissive.copy(SELECT_COLOR);
    mesh.material.emissiveIntensity = 0.45;
  }
}

// -------------------------------------------------------------
// Animated Pulsing Heart Component
// -------------------------------------------------------------
function AnimatedHeartModel({ url, speed = 1, paused = false, onPick, frozen }) {
  const gltf = useGLTF(url);
  const groupRef = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const { actions } = useAnimations(gltf.animations, groupRef);
  const selectedMesh = useRef(null);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const action = Object.values(actions)[0];
      if (action) {
        action.reset().play();
      }
    }
  }, [actions]);

  useEffect(() => {
    if (actions) {
      const action = Object.values(actions)[0];
      if (action) {
        action.paused = paused;
        action.timeScale = speed;
      }
    }
  }, [actions, speed, paused]);

  const heartDetail = ORGAN_INFO.heart;

  const handleClick = (e) => {
    e.stopPropagation();
    if (selectedMesh.current) restoreMesh(selectedMesh.current);
    selectedMesh.current = e.object;
    applySelect(e.object);
    onPick?.(heartDetail);
    invalidate();
  };

  useEffect(() => {
    if (!frozen && selectedMesh.current) {
      restoreMesh(selectedMesh.current);
      selectedMesh.current = null;
      invalidate();
    }
  }, [frozen, invalidate]);

  return (
    <group ref={groupRef}>
      <primitive
        object={gltf.scene}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          if (e.object !== selectedMesh.current) applyHover(e.object);
          invalidate();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
          if (e.object !== selectedMesh.current) restoreMesh(e.object);
          invalidate();
        }}
      />
    </group>
  );
}

// -------------------------------------------------------------
// Animated Breathing Lungs Component
// -------------------------------------------------------------
function AnimatedLungsModel({ url, speed = 1, paused = false, onPick, frozen }) {
  const gltf = useGLTF(url);
  const groupRef = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const selectedMesh = useRef(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !paused) {
      const t = clock.elapsedTime * 1.8 * speed;
      const breath = 1 + Math.sin(t) * 0.045;
      groupRef.current.scale.set(breath, breath * 1.05, breath);
    }
  });

  const lungsDetail = ORGAN_INFO.lungs;

  const handleClick = (e) => {
    e.stopPropagation();
    if (selectedMesh.current) restoreMesh(selectedMesh.current);
    selectedMesh.current = e.object;
    applySelect(e.object);
    onPick?.(lungsDetail);
    invalidate();
  };

  useEffect(() => {
    if (!frozen && selectedMesh.current) {
      restoreMesh(selectedMesh.current);
      selectedMesh.current = null;
      invalidate();
    }
  }, [frozen, invalidate]);

  return (
    <group ref={groupRef}>
      <primitive
        object={gltf.scene}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          if (e.object !== selectedMesh.current) applyHover(e.object);
          invalidate();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
          if (e.object !== selectedMesh.current) restoreMesh(e.object);
          invalidate();
        }}
      />
    </group>
  );
}

// -------------------------------------------------------------
// Dedicated Generic Organ Component
// -------------------------------------------------------------
function DedicatedGenericModel({ url, organId, onPick, frozen }) {
  const { scene } = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);
  const selectedMesh = useRef(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const defaultDetail = ORGAN_INFO[organId] || {
    name: "Anatomik tuzilma",
    system: "Inson anatomiyasi",
    desc: "Ushbu a'zo inson tanasi tuzilishining muhim qismi hisoblanadi.",
    fact: "Inson anatomiyasi milliardlab hujayralar va murakkab a'zolardan tashkil topgan.",
    color: "#38bdf8",
  };

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const matName = Array.isArray(child.material)
        ? child.material[0]?.name
        : child.material?.name;
      const meshName = child.name || "";
      const resolved = resolveMaterial(matName) || resolveMaterial(meshName);

      child.userData.detail = resolved
        ? {
            name: resolved.label,
            shortName: resolved.label,
            system: defaultDetail.system,
            desc: resolved.desc,
            fact: defaultDetail.fact,
            color: resolved.color,
          }
        : defaultDetail;

      if (!child.material) {
        child.material = new THREE.MeshStandardMaterial({
          color: resolved?.color || "#cfd8dc",
          roughness: 0.65,
          metalness: 0.05,
        });
      }

      if (child.material?.color) {
        child.userData.baseColor = child.material.color.clone();
      }
    });
    invalidate();
  }, [model, invalidate, defaultDetail]);

  const handleClick = (e) => {
    e.stopPropagation();
    const detail = e.object.userData.detail || defaultDetail;
    if (selectedMesh.current) restoreMesh(selectedMesh.current);
    selectedMesh.current = e.object;
    applySelect(e.object);
    onPick?.(detail);
    invalidate();
  };

  useEffect(() => {
    if (!frozen && selectedMesh.current) {
      restoreMesh(selectedMesh.current);
      selectedMesh.current = null;
      invalidate();
    }
  }, [frozen, invalidate]);

  return (
    <primitive
      object={model}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        if (e.object !== selectedMesh.current) applyHover(e.object);
        invalidate();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
        if (e.object !== selectedMesh.current) restoreMesh(e.object);
        invalidate();
      }}
    />
  );
}

// -------------------------------------------------------------
// Full Body Multi-Layer Component with Explode Separation
// -------------------------------------------------------------
function FullBodyLayer({
  layer,
  targetX = 0,
  explode = 0,
  opacity = 1,
  visible = true,
  onPick,
  frozen,
}) {
  const { scene } = useGLTF(layer.url);
  const invalidate = useThree((s) => s.invalidate);
  const selectedMesh = useRef(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef();

  // Smooth sliding animation along X axis
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.damp(
        groupRef.current.position.x,
        targetX,
        7.5,
        delta
      );
    }
  });

  // Configure high-definition materials based on layer type
  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const matName = (
        Array.isArray(child.material)
          ? child.material[0]?.name
          : child.material?.name
      ) || "";
      const meshName = child.name || "";
      const resolved = resolveMaterial(matName) || resolveMaterial(meshName);

      let layerColor = layer.color || "#cbd5e1";
      let detailName = resolved?.label || child.name || layer.name;
      let systemName = layer.name;
      let descText = resolved?.desc || `${layer.name}ning muhim anatomik qismi.`;
      let roughnessVal = 0.65;
      let metalnessVal = 0.04;

      if (layer.id === "skeleton") {
        layerColor = "#ece6d8"; // Natural bone tint
        roughnessVal = 0.72;
        systemName = "Tayanch-harakat (Skelet) tizimi";
        detailName = child.name ? child.name.replace(/[-_.]/g, " ") : "Suyak";
        descText = "Inson tanasining tayanch skeletini tashkil etuvchi 206 suyakdan biri.";
      } else if (layer.id === "muscles") {
        layerColor = resolved?.color || "#be382d"; // Rich muscle crimson
        roughnessVal = 0.62;
        systemName = "Mushaklar tizimi (Miologiya)";
        detailName = resolved?.label || "Mushak to'qimasi";
        descText = resolved?.desc || "Tana harakatini ta'minlovchi 600 dan ortiq mushak tolalari.";
      } else if (layer.id === "organs") {
        layerColor = resolved?.color || "#cd6155";
        roughnessVal = 0.58;
        systemName = "Ichki a'zolar (Splanxnologiya)";
        detailName = resolved?.label || "Ichki a'zo";
        descText = resolved?.desc || "Ko'krak va qorin bo'shlig'i hayotiy muhim ichki a'zolari.";
      } else if (layer.id === "vessels") {
        const isArt = (matName + meshName).toLowerCase().includes("artery");
        const isVn = (matName + meshName).toLowerCase().includes("vein");
        layerColor = isArt ? "#dc2626" : isVn ? "#2563eb" : "#3b82f6";
        roughnessVal = 0.48;
        systemName = "Qon-tomir tizimi (Angiologiya)";
        detailName = isArt ? "Arteriya tomiri" : isVn ? "Vena tomiri" : "Qon tomiri";
        descText = isArt ? "Kislorodga boy qonni tashiydi." : "Qonni yurakka qaytaradi.";
      } else if (layer.id === "skin") {
        layerColor = "#d49b7f"; // Skin tone
        roughnessVal = 0.82;
        systemName = "Teri tizimi";
        detailName = "Tashqi teri qoplami";
        descText = "Tananing eng katta tashqi himoya va termoregulyatsiya a'zosi.";
      }

      child.userData.detail = {
        name: detailName,
        shortName: detailName,
        system: systemName,
        desc: descText,
        fact: "Har bir to'qima va a'zo inson organizmining yaxlit hayotiy faoliyatida beqiyos o'ringa ega.",
        color: layerColor,
      };

      child.material = new THREE.MeshStandardMaterial({
        color: layerColor,
        roughness: roughnessVal,
        metalness: metalnessVal,
      });

      child.userData.baseColor = child.material.color.clone();
    });
    invalidate();
  }, [model, invalidate, layer]);

  // Adjust transparency and raycasting
  useEffect(() => {
    const isVisible = visible && opacity > 0.01;
    model.visible = isVisible;

    if (isVisible) {
      const isTransparent = opacity < 0.99;
      const canPick = opacity >= 0.2;

      model.traverse((c) => {
        if (!c.isMesh) return;
        c.material.transparent = isTransparent;
        c.material.opacity = opacity;
        c.material.depthWrite = opacity >= 0.7;
        c.material.needsUpdate = true;
        c.raycast = canPick ? THREE.Mesh.prototype.raycast : NOOP;
      });
    }
    invalidate();
  }, [model, opacity, visible, invalidate]);

  const handleClick = (e) => {
    e.stopPropagation();
    const detail = e.object.userData.detail;
    if (!detail) return;
    if (selectedMesh.current) restoreMesh(selectedMesh.current);
    selectedMesh.current = e.object;
    applySelect(e.object);
    onPick?.(detail);
    invalidate();
  };

  useEffect(() => {
    if (!frozen && selectedMesh.current) {
      restoreMesh(selectedMesh.current);
      selectedMesh.current = null;
      invalidate();
    }
  }, [frozen, invalidate]);

  const showPedestal = explode > 0.15 && visible && opacity > 0.05;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 3D Model Scene */}
      <primitive
        object={model}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          if (e.object !== selectedMesh.current) applyHover(e.object);
          invalidate();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
          if (e.object !== selectedMesh.current) restoreMesh(e.object);
          invalidate();
        }}
      />

      {/* Floating 3D Badge (when exploded) */}
      {showPedestal && (
        <Html
          center
          position={[0, 1.86, 0]}
          style={{
            pointerEvents: "none",
            transform: "translate3d(-50%, -50%, 0)",
          }}
        >
          <div className="px-2.5 py-1 rounded-full bg-zinc-950/90 border border-zinc-700/80 shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-[11px] font-bold text-zinc-100">
              {layer.icon} {layer.short}
            </span>
          </div>
        </Html>
      )}

      {/* Glowing Circular Pedestal on Floor (when exploded) */}
      {showPedestal && (
        <group position={[0, -0.01, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.44, 32]} />
            <meshBasicMaterial
              color={layer.color}
              transparent
              opacity={0.45 * Math.min(1, explode * 1.5)}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
            <circleGeometry args={[0.32, 32]} />
            <meshStandardMaterial
              color="#111827"
              roughness={0.9}
              transparent
              opacity={0.7 * Math.min(1, explode * 1.5)}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// -------------------------------------------------------------
// Main Three.js HD SimulatorCanvas
// -------------------------------------------------------------
export default function SimulatorCanvas({
  selectedOrgan = null,
  isDedicated = false,
  explode = 0, // 0 = assembled, 1 = fully exploded
  speed = 1,
  paused = false,
  layers = {
    skin: true,
    organs: true,
    skeleton: true,
    vessels: true,
    muscles: true,
  },
  opacities = {
    skin: 0.45,
    organs: 1.0,
    skeleton: 1.0,
    vessels: 0.95,
    muscles: 0.9,
  },
  onPick = () => {},
  frozen = false,
  controlsRef,
}) {
  const showDedicated = isDedicated && !!selectedOrgan && selectedOrgan !== "body";

  return (
    <div className="w-full h-full relative select-none">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-10 text-white">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-emerald-400 font-semibold tracking-wide">
              3D Inson anatomiyasi modeli yuklanmoqda...
            </p>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [0, 0.8, 6.2], fov: 42 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
        >
          <color attach="background" args={["#0a0a0a"]} />

          {/* Balanced Studio Lighting */}
          <ambientLight intensity={0.75} />
          <hemisphereLight args={["#ffffff", "#1e293b", 0.9]} />
          <directionalLight
            position={[5, 9, 6]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.7} />
          <directionalLight position={[0, -4, 4]} intensity={0.4} />

          <Bounds fit observe margin={1.2}>
            <Center>
              {showDedicated ? (
                selectedOrgan === "heart" ? (
                  <AnimatedHeartModel
                    key="heart"
                    url={MODEL_URLS.heart}
                    speed={speed}
                    paused={paused}
                    onPick={onPick}
                    frozen={frozen}
                  />
                ) : selectedOrgan === "lungs" ? (
                  <AnimatedLungsModel
                    key="lungs"
                    url={MODEL_URLS.lungs}
                    speed={speed}
                    paused={paused}
                    onPick={onPick}
                    frozen={frozen}
                  />
                ) : (
                  <DedicatedGenericModel
                    key={selectedOrgan}
                    url={MODEL_URLS[selectedOrgan] || MODEL_URLS.brain}
                    organId={selectedOrgan}
                    onPick={onPick}
                    frozen={frozen}
                  />
                )
              ) : (
                /* Full Multi-Layer Human Anatomy with Exploded Side-by-Side Presentation */
                <group key="fullbody-exploded">
                  {BODY_LAYERS.map((layer) => {
                    const targetX = (layer.explodeX || 0) * explode;
                    return (
                      <FullBodyLayer
                        key={layer.id}
                        layer={layer}
                        targetX={targetX}
                        explode={explode}
                        visible={layers[layer.id] ?? true}
                        opacity={opacities[layer.id] ?? layer.defaultOpacity}
                        onPick={onPick}
                        frozen={frozen}
                      />
                    );
                  })}
                </group>
              )}
            </Center>
          </Bounds>

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.4}
            maxDistance={25}
            enablePan
            zoomSpeed={1.1}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
