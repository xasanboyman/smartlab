import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import BlobShadow from "../kit/BlobShadow";

const wireMaterial = new MeshStandardMaterial({
  color: "#9ca3af",
  roughness: 0.5,
  metalness: 0.7,
});

const ceramicMaterial = new MeshStandardMaterial({
  color: "#ede8df",
  roughness: 0.85,
  metalness: 0.0,
});

const rimMaterial = new MeshStandardMaterial({
  color: "#6b7280",
  roughness: 0.4,
  metalness: 0.8,
});

const WireGauze = (props) => {
  return (
    <group {...props}>
      <BlobShadow radius={0.065} opacity={0.3} />

      {/* Wire mesh flat square plate */}
      <mesh position={[0, 0.001, 0]} material={wireMaterial}>
        <boxGeometry args={[0.12, 0.0015, 0.12]} />
      </mesh>

      {/* Folded edge rim borders */}
      <mesh position={[0, 0.0015, 0.059]} material={rimMaterial}>
        <boxGeometry args={[0.12, 0.0025, 0.003]} />
      </mesh>
      <mesh position={[0, 0.0015, -0.059]} material={rimMaterial}>
        <boxGeometry args={[0.12, 0.0025, 0.003]} />
      </mesh>
      <mesh position={[0.059, 0.0015, 0]} material={rimMaterial}>
        <boxGeometry args={[0.003, 0.0025, 0.12]} />
      </mesh>
      <mesh position={[-0.059, 0.0015, 0]} material={rimMaterial}>
        <boxGeometry args={[0.003, 0.0025, 0.12]} />
      </mesh>

      {/* Ceramic Refractory Center Disc */}
      <mesh position={[0, 0.0022, 0]} material={ceramicMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 0.002, 36]} />
      </mesh>
    </group>
  );
};

export default WireGauze;
