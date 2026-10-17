import { useMemo, useRef } from "react";
import { MeshStandardMaterial } from "three";
import { useKit } from "../kit/kitContext";
import { useDevice } from "../kit/deviceState";
import BlobShadow from "../kit/BlobShadow";
import { LampFlame } from "../../effects";

const baseMaterial = new MeshStandardMaterial({
  color: "#23262a",
  roughness: 0.6,
  metalness: 0.2,
});

const brassMaterial = new MeshStandardMaterial({
  color: "#cca43b",
  roughness: 0.28,
  metalness: 0.85,
});

const chromeMaterial = new MeshStandardMaterial({
  color: "#d0d4d8",
  roughness: 0.18,
  metalness: 0.95,
});

const BunsenBurner = ({ simId, ...props }) => {
  const kit = useKit();
  const device = useDevice(simId);
  const lit = Boolean(device?.lit);
  const airOpen = Boolean(device?.airOpen ?? true);

  const flameRef = useRef({
    intensity: lit ? 1 : 0,
    boost: airOpen ? 1.4 : 0.2,
    dousing: 0,
  });

  flameRef.current.intensity = lit ? 1 : 0;
  flameRef.current.boost = airOpen ? 1.4 : 0.2;

  return (
    <group {...props}>
      <BlobShadow radius={0.05} opacity={0.4} />

      {/* Cast Iron Heavy Base */}
      <mesh position={[0, 0.009, 0]} material={baseMaterial}>
        <cylinderGeometry args={[0.042, 0.046, 0.018, 32]} />
      </mesh>

      {/* Gas inlet nipple (side) */}
      <group position={[0.038, 0.012, 0]} rotation-z={Math.PI / 2}>
        <mesh material={brassMaterial}>
          <cylinderGeometry args={[0.004, 0.0045, 0.024, 16]} />
        </mesh>
      </group>

      {/* Air Control Collar */}
      <mesh position={[0, 0.028, 0]} material={brassMaterial}>
        <cylinderGeometry args={[0.0085, 0.0085, 0.016, 24]} />
      </mesh>

      {/* Burner Chimney (Mixing tube) */}
      <mesh position={[0, 0.088, 0]} material={chromeMaterial}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.12, 24]} />
      </mesh>

      {/* Top Flame Rim */}
      <mesh position={[0, 0.15, 0]} material={chromeMaterial}>
        <cylinderGeometry args={[0.0075, 0.0065, 0.006, 24]} />
      </mesh>

      {/* Active Flame */}
      {lit && (
        <>
          <LampFlame
            origin={[0, 0.152, 0]}
            get={() => flameRef.current}
          />
          <pointLight
            position={[0, 0.18, 0]}
            color={airOpen ? "#7dd3fc" : "#f59e0b"}
            intensity={airOpen ? 1.2 : 0.8}
            distance={1.8}
          />
        </>
      )}
    </group>
  );
};

export default BunsenBurner;
