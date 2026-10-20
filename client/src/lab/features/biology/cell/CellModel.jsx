// Schematic cell: translucent membrane with organelle spheres. Click to select.
import { useRef, useState } from "react";
import { usePausableFrame } from "@/lab/components/usePausableFrame";
import { ORGANELLES } from "@/lab/data/cell";
import BioLabel from "../shared/BioLabel";

const Organelle = ({ organelle, selected, dimmed, onSelect, showLabels }) => {
  const [hover, setHover] = useState(false);
  const lit = hover || selected;
  return (
    <group position={organelle.pos}>
      <mesh
        castShadow
        scale={lit ? 1.15 : 1}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(organelle.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[organelle.size, 40, 40]} />
        <meshPhysicalMaterial
          color={organelle.color}
          roughness={0.32}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
          emissive={lit ? organelle.color : "#000000"}
          emissiveIntensity={selected ? 0.45 : hover ? 0.25 : 0}
        />
      </mesh>
      {showLabels && lit && (
        <BioLabel position={[0, organelle.size + 0.12, 0]} text={organelle.name} color={organelle.color} active={selected} occlude={false} />
      )}
    </group>
  );
};

const CellModel = ({ activeId, onSelect, autoRotate = true, showLabels = true }) => {
  const group = useRef();
  usePausableFrame((_, delta) => {
    if (group.current && autoRotate) group.current.rotation.y += delta * 0.15;
  });
  const focusMode = activeId && activeId !== "eukaryotic-cell" && activeId !== "membrane";

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[3, 64, 64]} />
        <meshPhysicalMaterial
          color="#7cc4ff"
          transparent
          opacity={activeId === "membrane" ? 0.3 : 0.12}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#1d4ed8"
          emissiveIntensity={activeId === "membrane" ? 0.5 : 0.12}
          depthWrite={false}
        />
      </mesh>
      {ORGANELLES.filter((o) => o.id !== "membrane").map((o) => (
        <Organelle
          key={o.id}
          organelle={o}
          selected={activeId === o.id}
          dimmed={!!focusMode && activeId !== o.id}
          onSelect={onSelect}
          showLabels={showLabels}
        />
      ))}
    </group>
  );
};

export default CellModel;
