// Sketchfab eukaryotic cell (Draco GLB). Each mesh is mapped to an organelle id,
// re-materialed with a wet PBR look, and exposes its centre so the page can fly the
// camera to it and pin a label on it.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ORGANELLES } from "@/lab/data/cell";
import { assetUrl, preloadGLTF, useBioGLTF } from "../shared/loaders";
import BioLabel from "../shared/BioLabel";
import CameraFocus from "../shared/CameraFocus";

export const CELL_MODEL_URL = assetUrl("models/eukaryotic-cell.glb");
const MODEL_SCALE = 1.8;

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

// Material recipe per mesh name: colour + surface finish (wet organelles, glassy membrane).
const MATERIALS = [
  ["UMesh_Nucleolous", { color: "#ec4899", roughness: 0.3, clearcoat: 0.6 }],
  ["Nucleolus1", { color: "#8b5cf6", roughness: 0.42, clearcoat: 0.35 }],
  ["Golgi", { color: "#f97316", roughness: 0.38, clearcoat: 0.5 }],
  ["Rough_endoplasmic", { color: "#e11d48", roughness: 0.45, clearcoat: 0.3 }],
  ["Smooth_endoplasmic", { color: "#06b6d4", roughness: 0.35, clearcoat: 0.5 }],
  ["Centriole", { color: "#f59e0b", roughness: 0.3, clearcoat: 0.4, metalness: 0.15 }],
  ["Microtubule", { color: "#38bdf8", roughness: 0.32, clearcoat: 0.3 }],
  ["Twisted_Fibers", { color: "#0284c7", roughness: 0.35 }],
  ["Vesicles", { color: "#a855f7", roughness: 0.22, clearcoat: 0.7 }],
  ["Periox", { color: "#10b981", roughness: 0.32, clearcoat: 0.5 }],
  ["Mitochondrium", { color: "#ef4444", roughness: 0.4, clearcoat: 0.45 }],
];

const makeMaterial = (name) => {
  const isOuter = name.includes("Plasma_membrane_outlide");
  const isInner = name.includes("Plasma_membrane_inside");
  if (isOuter || isInner) {
    // Glassy membrane: faint fill + emissive rim so it reads as a soft glow, not a grey shell.
    const m = new THREE.MeshPhysicalMaterial({
      color: isOuter ? "#7cc4ff" : "#3b82f6",
      transparent: true,
      opacity: isOuter ? 0.1 : 0.16,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      emissive: new THREE.Color("#1d4ed8"),
      emissiveIntensity: 0.12,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    m.userData.membrane = true;
    return m;
  }
  const recipe = MATERIALS.find(([key]) => name.includes(key))?.[1] || { color: "#94a3b8", roughness: 0.4 };
  return new THREE.MeshPhysicalMaterial({
    color: recipe.color,
    roughness: recipe.roughness,
    metalness: recipe.metalness ?? 0.04,
    clearcoat: recipe.clearcoat ?? 0.2,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide,
  });
};

preloadGLTF(CELL_MODEL_URL);

const EukaryoticCellModel = ({ activeId, onSelect, autoRotate = true, showLabels = true, focusKey = 0 }) => {
  const groupRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const invalidate = useThree((s) => s.invalidate);
  const { scene } = useBioGLTF(CELL_MODEL_URL);

  // Clone, re-material, centre at origin and collect organelle centres (local space).
  const { model, centers } = useMemo(() => {
    const clone = scene.clone(true);
    const boxes = new Map();
    clone.updateMatrixWorld(true);
    const tmp = new THREE.Box3();
    clone.traverse((child) => {
      if (!child.isMesh) return;
      if (child.geometry?.attributes?.color) child.geometry.deleteAttribute("color");
      const name = child.name || "";
      const orgId = getOrganelleIdForName(name);
      child.material = makeMaterial(name);
      child.userData.organelleId = orgId;
      child.userData.defaultColor = child.material.color.clone();
      child.userData.defaultOpacity = child.material.opacity;
      child.userData.defaultEmissive = child.material.emissiveIntensity;
      if (orgId && orgId !== "membrane") {
        tmp.setFromObject(child);
        if (!boxes.has(orgId)) boxes.set(orgId, tmp.clone());
        else boxes.get(orgId).union(tmp);
      }
    });
    const whole = new THREE.Box3().setFromObject(clone);
    const center = whole.getCenter(new THREE.Vector3());
    clone.position.sub(center).multiplyScalar(MODEL_SCALE);
    clone.scale.setScalar(MODEL_SCALE);
    const centers = new Map();
    boxes.forEach((box, id) => {
      const c = box.getCenter(new THREE.Vector3()).sub(center).multiplyScalar(MODEL_SCALE);
      centers.set(id, { pos: c, radius: box.getSize(new THREE.Vector3()).length() * MODEL_SCALE * 0.5 });
    });
    centers.set("membrane", { pos: new THREE.Vector3(0, 0, 0), radius: whole.getSize(new THREE.Vector3()).length() * MODEL_SCALE * 0.5 });
    return { model: clone, centers };
  }, [scene]);

  // Fly to the selected organelle (world position at the moment of selection).
  useEffect(() => {
    const entry = centers.get(activeId);
    if (!entry || !groupRef.current) {
      setFocusTarget(activeId === "eukaryotic-cell" ? { pos: [0, 0, 0], dist: 7.2 } : null);
      return;
    }
    const world = groupRef.current.localToWorld(entry.pos.clone());
    setFocusTarget({ pos: world.toArray(), dist: Math.max(1.6, entry.radius * 2.6) });
  }, [activeId, centers, focusKey]);

  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + Math.sin(t * 3) * 0.5;
    const focusMode = activeId && activeId !== "eukaryotic-cell";
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const orgId = child.userData.organelleId;
      const m = child.material;
      const isSelected = orgId === activeId;
      const isHovered = hoveredId && orgId === hoveredId;
      if (m.userData.membrane) {
        const target = isSelected || isHovered ? 0.3 : focusMode ? 0.035 : child.userData.defaultOpacity;
        m.opacity += (target - m.opacity) * 0.15;
        m.emissiveIntensity = isSelected ? 0.4 + pulse * 0.3 : child.userData.defaultEmissive;
        return;
      }
      if (isSelected || isHovered) {
        m.emissive.copy(child.userData.defaultColor);
        m.emissiveIntensity = isSelected ? 0.35 + pulse * 0.25 : 0.25;
      } else {
        m.emissiveIntensity = 0;
      }
    });
  });

  const hoveredInfo = hoveredId ? ORGANELLES.find((o) => o.id === hoveredId) : null;
  const activeInfo = activeId ? ORGANELLES.find((o) => o.id === activeId) : null;
  const activeCenter = activeInfo && centers.get(activeId);
  const hoverCenter = hoveredInfo && hoveredId !== activeId && centers.get(hoveredId);

  return (
    <group ref={groupRef}>
      <primitive
        object={model}
        onPointerOver={(e) => {
          e.stopPropagation();
          const id = e.object.userData.organelleId;
          if (id) {
            setHoveredId(id);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredId(null);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          const id = e.object.userData.organelleId;
          if (id && onSelect) onSelect(id);
          invalidate();
        }}
      />
      {showLabels && activeCenter && activeId !== "membrane" && (
        <BioLabel position={activeCenter.pos.toArray()} text={activeInfo.name} color={activeInfo.color} active occlude={false} />
      )}
      {showLabels && hoverCenter && (
        <BioLabel position={hoverCenter.pos.toArray()} text={hoveredInfo.name} color={hoveredInfo.color} occlude={false} />
      )}
      {focusTarget && <CameraFocus target={focusTarget.pos} distance={focusTarget.dist} />}
    </group>
  );
};

export default EukaryoticCellModel;
