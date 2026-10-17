import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GAS_COLORS, GEOM, cylinderTheta, gasStateInto, pistonCrownY } from "../../engineMath";

const RADIUS = GEOM.boreRadius - 0.015;
const SEGMENTS = 40;
const TOP_Y = GEOM.deckY + GEOM.chamberDepth - 0.02;
// Crown is dished; start the column a touch lower so no sliver shows at the edge.
const CROWN_DROP = 0.02;
const KIND_COLORS = [GAS_COLORS.mixture, GAS_COLORS.flame, GAS_COLORS.exhaust].map((c) => new THREE.Color(c));
const noRaycast = () => null;

const makeMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: GAS_COLORS.mixture,
    emissive: GAS_COLORS.flame,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true,
    roughness: 0.9,
    metalness: 0,
  });

// One gas column per cylinder, each on its own phase. Always mounted so the scene's
// light count (and every lit shader) stays the same across modes.
const CombustionGas = ({ simRef, active = true }) => {
  const columns = useRef([]);
  const floors = useRef([]);
  const lights = useRef([]);
  const smooth = useRef(CYLINDERS.map(() => ({ heat: 0, init: false })));
  const gas = useRef({ fill: 0, kind: 0, heat: 0 });

  const assets = useMemo(
    () => ({
      column: new THREE.CylinderGeometry(RADIUS, RADIUS, 1, SEGMENTS, 1, true).translate(0, 0.5, 0),
      disc: new THREE.CircleGeometry(RADIUS, SEGMENTS).rotateX(-Math.PI / 2),
      materials: CYLINDERS.map(makeMaterial),
    }),
    [],
  );
  useEffect(
    () => () => {
      assets.column.dispose();
      assets.disc.dispose();
      assets.materials.forEach((m) => m.dispose());
    },
    [assets],
  );

  useFrame((_, delta) => {
    const theta = simRef.current.theta;
    const k0 = 1 - Math.exp(-Math.min(delta, 0.1) * 10);
    for (let i = 0; i < CYLINDERS.length; i++) {
      const light = lights.current[i];
      const column = columns.current[i];
      const floor = floors.current[i];
      if (!light || !column || !floor) continue;
      const st = smooth.current[i];
      if (!active) {
        light.intensity = 0;
        st.init = false;
        continue;
      }
      const t = cylinderTheta(theta, i);
      const g = gasStateInto(t, gas.current);
      const bottom = pistonCrownY(t) - CROWN_DROP;
      const height = Math.max(0.001, TOP_Y - bottom);
      column.position.y = bottom;
      column.scale.y = height;
      floor.position.y = bottom;

      const mat = assets.materials[i];
      const k = st.init ? k0 : 1;
      st.init = true;
      mat.color.lerp(KIND_COLORS[g.kind], k);
      const targetHeat = g.kind === 1 ? g.heat : g.kind === 2 ? g.heat * 0.25 : 0;
      st.heat += (targetHeat - st.heat) * k;
      mat.opacity += (0.18 + 0.45 * g.fill - mat.opacity) * k;
      mat.emissiveIntensity = st.heat * 1.8;

      light.position.y = bottom + height * 0.5;
      light.intensity = g.kind === 1 ? st.heat * 7 : 0;
    }
  });

  return (
    <group>
      {CYLINDERS.map(({ x, index }) => (
        <group key={index} position={[x, 0, 0]}>
          <group visible={active}>
            <mesh
              ref={(m) => {
                columns.current[index] = m;
              }}
              geometry={assets.column}
              material={assets.materials[index]}
              raycast={noRaycast}
              renderOrder={2}
            />
            <mesh
              ref={(m) => {
                floors.current[index] = m;
              }}
              geometry={assets.disc}
              material={assets.materials[index]}
              raycast={noRaycast}
              renderOrder={2}
            />
            <mesh
              geometry={assets.disc}
              material={assets.materials[index]}
              position={[0, TOP_Y, 0]}
              raycast={noRaycast}
              renderOrder={2}
            />
          </group>
          <pointLight
            ref={(l) => {
              lights.current[index] = l;
            }}
            position={[0, GEOM.deckY - 0.2, 0]}
            color="#ff8a3d"
            intensity={0}
            distance={2.4}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
};

export default CombustionGas;
