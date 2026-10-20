// HDRI-free studio rig for biology models: hemisphere base + key/fill/rim with a
// soft shadow, plus a procedural room environment for specular response.
// Presets tune colour temperature per model type (organ / cell / bone / molecule).
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const STUDIO_PRESETS = {
  // Warm key for moist tissue; cool fill keeps crevices readable.
  organ: { key: "#fff1e0", keyI: 2.6, fill: "#d6e4ff", fillI: 0.8, rim: "#ffd9b8", rimI: 1.6, sky: "#ffffff", ground: "#2b3140", hemiI: 0.5, env: 0.45 },
  // Cool, slightly blue key so translucent membranes glow at the silhouette.
  cell: { key: "#f3f8ff", keyI: 2.2, fill: "#bff7ea", fillI: 0.9, rim: "#7dd3fc", rimI: 2.2, sky: "#dff3ff", ground: "#0f172a", hemiI: 0.65, env: 0.55 },
  // Bone: neutral-warm key, low fill for porous matte relief.
  bone: { key: "#fff6e8", keyI: 2.8, fill: "#e5e9f0", fillI: 0.55, rim: "#fde7c4", rimI: 1.1, sky: "#ffffff", ground: "#3a3f4b", hemiI: 0.4, env: 0.35 },
  // Molecule/DNA: crisp white key, saturated cyan rim.
  molecule: { key: "#ffffff", keyI: 2.4, fill: "#dbeafe", fillI: 0.9, rim: "#67e8f9", rimI: 1.8, sky: "#e2e8f0", ground: "#111827", hemiI: 0.6, env: 0.4 },
};

// Procedural PMREM room (no HDR download). Kept per renderer and disposed on unmount.
const RoomEnv = ({ intensity = 0.4 }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  useEffect(() => {
    scene.environment = texture;
    scene.environmentIntensity = intensity;
    invalidate();
    return () => {
      if (scene.environment === texture) scene.environment = null;
      texture.dispose();
    };
  }, [scene, texture, intensity, invalidate]);
  return null;
};

/**
 * @param preset   organ | cell | bone | molecule
 * @param scale    world size of the subject (sets light distances + shadow frustum)
 * @param contact  false | { y, opacity, blur } soft ground contact shadow
 * @param shadow   cast a real key-light shadow (needs <Scene shadows>)
 */
const BioStudio = ({ preset = "organ", scale = 6, contact = false, shadow = true, env = true, exposure }) => {
  const p = STUDIO_PRESETS[preset] || STUDIO_PRESETS.organ;
  const d = scale;
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (exposure != null) gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return (
    <>
      <hemisphereLight args={[p.sky, p.ground, p.hemiI]} />
      <directionalLight
        position={[d * 0.8, d * 1.2, d * 0.9]}
        intensity={p.keyI}
        color={p.key}
        castShadow={shadow}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-near={0.1}
        shadow-camera-far={d * 6}
        shadow-camera-left={-d}
        shadow-camera-right={d}
        shadow-camera-top={d}
        shadow-camera-bottom={-d}
      />
      <directionalLight position={[-d, d * 0.4, d * 0.6]} intensity={p.fillI} color={p.fill} />
      <directionalLight position={[d * 0.2, d * 0.6, -d * 1.3]} intensity={p.rimI} color={p.rim} />
      {env && <RoomEnv intensity={p.env} />}
      {contact && (
        <ContactShadows
          position={[0, contact.y ?? -d * 0.5, 0]}
          opacity={contact.opacity ?? 0.5}
          scale={contact.scale ?? d * 2.2}
          blur={contact.blur ?? 2.2}
          far={contact.far ?? d}
          resolution={512}
          frames={contact.frames ?? 1}
          color="#020617"
        />
      )}
    </>
  );
};

export default BioStudio;
