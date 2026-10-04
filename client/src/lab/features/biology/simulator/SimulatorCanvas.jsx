import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Bounds, Center, useGLTF, useAnimations } from "@react-three/drei";
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
  mesh.material.color.lerp(HOVER_COLOR, 0.4);
  if (mesh.material.emissive) {
    mesh.material.emissive.copy(HOVER_COLOR);
    mesh.material.emissiveIntensity = 0.3;
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
// Animated Heart Component
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
// Full Body Multi-Layer Component
// -------------------------------------------------------------
function FullBodyLayer({ url, opacity = 1, visible = true, flatColor, onPick, frozen }) {
  const { scene } = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);
  const selectedMesh = useRef(null);
  const model = useMemo(() => scene.clone(true), [scene]);

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

      const detail = {
        name: resolved?.label || (flatColor ? "Teri qoplami" : "Anatomik to'qima"),
        system: flatColor ? "Teri tizimi" : "Inson anatomiyasi",
        desc: resolved?.desc || "Inson tanasining tayanch va harakat anatomik to'qimasi.",
        fact: "Inson tanasi qatlamlari a'zolarni tashqi muhitdan himoya qiladi va hayotiy faoliyatni ta'minlaydi.",
        color: flatColor || resolved?.color || "#cfd8dc",
      };
      child.userData.detail = detail;

      child.material = new THREE.MeshStandardMaterial({
        color: flatColor || resolved?.color || "#cfd8dc",
        roughness: flatColor ? 0.85 : 0.68,
        metalness: 0.05,
      });

      child.userData.baseColor = child.material.color.clone();
    });
    invalidate();
  }, [model, invalidate, flatColor]);

  // Adjust opacity and raycastability
  useEffect(() => {
    const isVisible = visible && opacity > 0.01;
    model.visible = isVisible;

    if (isVisible) {
      const isTransparent = opacity < 0.99;
      const canPick = opacity >= 0.25;

      model.traverse((c) => {
        if (!c.isMesh) return;
        c.material.transparent = isTransparent;
        c.material.opacity = opacity;
        c.material.depthWrite = opacity >= 0.75;
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
// Main SimulatorCanvas Export
// -------------------------------------------------------------
export default function SimulatorCanvas({
  selectedOrgan = null,
  speed = 1,
  paused = false,
  layers = { skin: true, muscles: true, organs: true, vessels: true },
  opacities = { skin: 0.35, muscles: 0.9, organs: 1.0, vessels: 0.95 },
  onPick = () => {},
  frozen = false,
  controlsRef,
}) {
  const isDedicated = !!selectedOrgan && selectedOrgan !== "body";

  return (
    <div className="w-full h-full relative select-none">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-10 text-white">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-emerald-400 font-semibold tracking-wide">
              3D Anatomiya modeli yuklanmoqda...
            </p>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#0a0a0a"]} />

          {/* Studio Lights */}
          <ambientLight intensity={0.7} />
          <hemisphereLight args={["#ffffff", "#334155", 0.85]} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 4, -4]} intensity={0.7} />
          <directionalLight position={[0, -5, 3]} intensity={0.4} />

          <Bounds fit observe margin={1.2}>
            <Center>
              {isDedicated ? (
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
                <group key="fullbody">
                  {BODY_LAYERS.map((layer) => (
                    <FullBodyLayer
                      key={layer.id}
                      url={layer.url}
                      visible={layers[layer.id] ?? true}
                      opacity={opacities[layer.id] ?? layer.defaultOpacity}
                      flatColor={layer.id === "skin" ? "#e8b89b" : null}
                      onPick={onPick}
                      frozen={frozen}
                    />
                  ))}
                </group>
              )}
            </Center>
          </Bounds>

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={0.3}
            maxDistance={25}
            enablePan
            zoomSpeed={1.1}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
