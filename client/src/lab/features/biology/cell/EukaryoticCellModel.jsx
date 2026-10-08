import { useMemo, useRef, useState } from "react";
import { useGLTF, Html, Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORGANELLES } from "@/lab/data/cell";

const BASE = import.meta.env.BASE_URL || "/";
const MODEL_URL = `${BASE}models/eukaryotic-cell.glb`.replace(/\/+/g, "/");
const DRACO_URL = `${BASE}draco/`.replace(/\/+/g, "/");

// Map mesh name keywords to organelle IDs
export function getOrganelleIdForName(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("nucleo")) return "nucleus";
  if (n.includes("mitochondri")) return "mitochondria";
  if (n.includes("golgi")) return "golgi";
  if (n.includes("rough_endoplasmic")) return "rough_er";
  if (n.includes("smooth_endoplasmic")) return "smooth_er";
  if (n.includes("centriole")) return "centriole";
  if (n.includes("microtubule") || n.includes("fiber")) return "microtubule";
  if (n.includes("periox")) return "peroxisome";
  if (n.includes("vesicle")) return "vesicles";
  if (n.includes("plasma_membrane")) return "membrane";
  return null;
}

// Preload the model with Draco decoder path
useGLTF.preload(MODEL_URL, DRACO_URL);

const EukaryoticCellModel = ({ activeId, onSelect, autoRotate = true }) => {
  const groupRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);

  const { scene } = useGLTF(MODEL_URL, DRACO_URL);

  // Clone scene and apply smart materials per organelle
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const orgId = getOrganelleIdForName(child.name);
        const name = child.name || "";

        // Standardize material
        let mat = child.material;
        if (Array.isArray(mat)) mat = mat[0];

        const isOuterMembrane = name.includes("Plasma_membrane_outlide");
        const isInnerMembrane = name.includes("Plasma_membrane_inside");

        // Create clean PBR material per mesh
        const newMat = new THREE.MeshStandardMaterial();

        if (name.includes("UMesh_Nucleolous")) {
          // Nucleolus (Yadrocha - inner core)
          newMat.color = new THREE.Color("#ec4899");
          newMat.roughness = 0.25;
          newMat.metalness = 0.15;
        } else if (name.includes("Nucleolus1")) {
          // Nucleus envelope (Yadro qobig'i)
          newMat.color = new THREE.Color("#8b5cf6");
          newMat.roughness = 0.4;
          newMat.metalness = 0.08;
        } else if (name.includes("Golgi")) {
          // Golgi apparatus
          newMat.color = new THREE.Color("#f97316");
          newMat.roughness = 0.35;
          newMat.metalness = 0.08;
        } else if (name.includes("Rough_endoplasmic")) {
          // Rough ER (Donador ER)
          newMat.color = new THREE.Color("#e11d48");
          newMat.roughness = 0.42;
          newMat.metalness = 0.05;
        } else if (name.includes("Smooth_endoplasmic")) {
          // Smooth ER (Silliq ER)
          newMat.color = new THREE.Color("#06b6d4");
          newMat.roughness = 0.32;
          newMat.metalness = 0.1;
        } else if (name.includes("Centriole")) {
          // Centriole (Sentriola)
          newMat.color = new THREE.Color("#f59e0b");
          newMat.roughness = 0.25;
          newMat.metalness = 0.2;
        } else if (name.includes("Microtubule")) {
          // Microtubules (Mikronaychalar)
          newMat.color = new THREE.Color("#38bdf8");
          newMat.roughness = 0.3;
          newMat.metalness = 0.15;
        } else if (name.includes("Twisted_Fibers")) {
          // Cytoskeleton fibers
          newMat.color = new THREE.Color("#0284c7");
          newMat.roughness = 0.3;
          newMat.metalness = 0.1;
        } else if (name.includes("Vesicles")) {
          // Vesicles (Pufakchalar)
          newMat.color = new THREE.Color("#a855f7");
          newMat.roughness = 0.2;
          newMat.metalness = 0.25;
        } else if (name.includes("Periox")) {
          // Peroxisome (Peroksisoma)
          newMat.color = new THREE.Color("#10b981");
          newMat.roughness = 0.3;
          newMat.metalness = 0.1;
        } else if (name.includes("Mitochondrium")) {
          // Mitochondria (Mitoxondriya)
          newMat.color = new THREE.Color("#ef4444");
          newMat.roughness = 0.35;
          newMat.metalness = 0.1;
        } else if (isOuterMembrane) {
          // Outer plasma membrane: delicate translucent glass shell
          newMat.color = new THREE.Color("#60a5fa");
          newMat.transparent = true;
          newMat.opacity = 0.18;
          newMat.roughness = 0.2;
          newMat.metalness = 0.05;
          newMat.depthWrite = false;
        } else if (isInnerMembrane) {
          // Inner plasma membrane / cut bed
          newMat.color = new THREE.Color("#3b82f6");
          newMat.transparent = true;
          newMat.opacity = 0.22;
          newMat.roughness = 0.35;
          newMat.metalness = 0.05;
          newMat.depthWrite = false;
        } else {
          newMat.color = new THREE.Color("#94a3b8");
          newMat.roughness = 0.4;
          newMat.metalness = 0.1;
        }

        newMat.side = isOuterMembrane || isInnerMembrane ? THREE.FrontSide : THREE.DoubleSide;
        child.material = newMat;
        child.userData.organelleId = orgId;
        child.userData.defaultColor = newMat.color.clone();
        child.userData.defaultOpacity = newMat.opacity;
      }
    });

    return clone;
  }, [scene]);

  // Dynamic highlight based on activeId and hover
  useFrame((state, delta) => {
    // Gentle auto-rotation
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }

    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + Math.sin(t * 4) * 0.5;

    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const orgId = child.userData.organelleId;
        const isSelected = activeId && orgId === activeId;
        const isHovered = hoveredId && orgId === hoveredId;

        const isMembrane = orgId === "membrane";

        if (isSelected || isHovered) {
          // Highlight with glowing emissive matching organelle color
          if (child.userData.defaultColor) {
            child.material.emissive.copy(child.userData.defaultColor);
          }
          child.material.emissiveIntensity = 0.5 + pulse * 0.5;
          if (isMembrane) {
            child.material.opacity = 0.5;
          }
        } else if (activeId && activeId !== "eukaryotic-cell") {
          // Dim non-selected organelles slightly so active one pops
          child.material.emissiveIntensity = 0;
          if (isMembrane) {
            child.material.opacity = 0.08; // Make membrane super sheer to see selected inner organelle
          }
        } else {
          // Default state (overview)
          child.material.emissiveIntensity = 0;
          if (isMembrane) {
            child.material.opacity = child.userData.defaultOpacity ?? 0.18;
          }
        }
      }
    });
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    const orgId = e.object.userData.organelleId;
    if (orgId) {
      setHoveredId(orgId);
      setHoverPos(e.point);
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredId(null);
    setHoverPos(null);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const orgId = e.object.userData.organelleId;
    if (orgId && onSelect) {
      onSelect(orgId);
    }
  };

  // Find info for hovered organelle
  const hoveredInfo = hoveredId ? ORGANELLES.find((o) => o.id === hoveredId) : null;

  return (
    <group ref={groupRef}>
      <Center scale={1.8}>
        <primitive
          object={clonedScene}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      </Center>

      {hoveredInfo && hoverPos && (
        <Html position={hoverPos} center distanceFactor={8} className="pointer-events-none select-none">
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/85 px-3 py-1 shadow-xl backdrop-blur-md">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white/30"
              style={{ backgroundColor: hoveredInfo.color }}
            />
            <span className="text-xs font-semibold tracking-wide text-white">
              {hoveredInfo.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

export default EukaryoticCellModel;
