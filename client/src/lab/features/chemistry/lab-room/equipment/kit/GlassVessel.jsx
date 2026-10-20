import { useMemo } from "react";
import { CylinderGeometry, DoubleSide, MeshBasicMaterial } from "three";
import { useKit } from "./kitContext";
import { crackTexture } from "./crackTexture";

// Crack decal wrapped on the front of the wall where the impact was, between the glass passes.
const CRACK_ARC = 1.35;
const crackMaterials = new Map();
const crackMaterial = () => {
  if (!crackMaterials.has("m")) {
    crackMaterials.set("m", new MeshBasicMaterial({ map: crackTexture(), transparent: true, depthWrite: false, side: DoubleSide, opacity: 0.95 }));
  }
  return crackMaterials.get("m");
};

const CrackBand = ({ outer }) => {
  const geometry = useMemo(() => {
    if (!outer.boundingBox) outer.computeBoundingBox();
    const { min, max } = outer.boundingBox;
    const radius = Math.max(max.x - min.x, max.z - min.z) / 2 + 0.0004;
    const height = max.y - min.y;
    const band = Math.min(radius * 2.2, height * 0.55);
    const g = new CylinderGeometry(radius, radius, band, 24, 1, true, Math.PI - CRACK_ARC / 2, CRACK_ARC);
    g.translate(0, min.y + height * 0.42, 0);
    return g;
  }, [outer]);
  return <mesh geometry={geometry} material={crackMaterial()} renderOrder={2.9} />;
};

// Draw order for a convex vessel seen from outside: far inner wall → contents → near outer wall.
const GlassVessel = ({ vessel, print, cracked = false, children }) => {
  const { glass } = useKit();
  return (
    <group>
      <mesh geometry={vessel.inner} material={glass} renderOrder={1} />
      {children}
      {cracked && <CrackBand outer={vessel.outer} />}
      <mesh geometry={vessel.outer} material={glass} renderOrder={3} />
      {print && <mesh geometry={print.geometry} material={print.material} />}
    </group>
  );
};

export default GlassVessel;
