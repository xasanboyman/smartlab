import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GEOM, MAIN_X, TAU, VALVES, camProfileRadius, camRotationX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { flat, latheX, merge, polygon, slabX, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.camshafts.shell;
const LOBE_SAMPLES = 160;
const LOBE_HALF = 0.07;
const ROLLER_R = GEOM.rollerRadius;
const REAR_X = -2.15;
const NOSE_END = GEOM.chainX + 0.1;

// Roller-follower cam: the pitch curve (profile + roller radius) offset inward by the roller radius.
// Shape plane is (-z, y); polar angle runs from +y toward +z.
const lobeShape = (which) => {
  const e = 1e-4;
  const pts = [];
  for (let i = 0; i < LOBE_SAMPLES; i++) {
    const a = (i / LOBE_SAMPLES) * TAU;
    const p = camProfileRadius(a, which) + ROLLER_R;
    const dp = (camProfileRadius(a + e, which) - camProfileRadius(a - e, which)) / (2 * e);
    const uy = Math.cos(a);
    const uz = Math.sin(a);
    const ty = dp * uy - p * uz;
    const tz = dp * uz + p * uy;
    const tl = Math.hypot(ty, tz);
    const y = p * uy - (ROLLER_R * tz) / tl;
    const z = p * uz + (ROLLER_R * ty) / tl;
    pts.push([-z, y]);
  }
  return polygon(pts);
};

const buildShaft = (which) => {
  const lobes = [];
  for (const { x, phase } of CYLINDERS) {
    for (const s of [-1, 1]) {
      const cx = x + s * GEOM.valvePairDX;
      // Pre-rotated by half the cylinder's crank phase: the shaft turns at half speed.
      lobes.push(slabX(lobeShape(which), cx - LOBE_HALF, cx + LOBE_HALF, 0.008).rotateX(phase / 2));
    }
  }
  const shaft = latheX(
    [
      [0, REAR_X],
      [0.075, REAR_X, true],
      [0.075, GEOM.chainX - 0.2, true],
      [0.065, GEOM.chainX - 0.2, true],
      [0.065, NOSE_END, true],
      [0, NOSE_END],
    ],
    28,
  );
  const journals = MAIN_X.map((x) =>
    latheX(
      [
        [0, x - 0.085],
        [0.1, x - 0.085, true],
        [0.1, x + 0.085, true],
        [0, x + 0.085],
      ],
      32,
    ),
  );
  const endBolt = flat(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 6).rotateZ(-Math.PI / 2).translate(NOSE_END + 0.02, 0, 0));
  return merge([...lobes, shaft, ...journals, endBolt]);
};

const Camshaft = ({ which, simRef, material }) => {
  const ref = useRef(null);
  const { camCenter } = VALVES[which];
  const geo = useGeometries(() => ({ shaft: buildShaft(which) }), [which]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = camRotationX(simRef.current.theta);
  });

  return (
    <group ref={ref} position={[0, camCenter.y, camCenter.z]}>
      <mesh geometry={geo.shaft} material={material} castShadow />
    </group>
  );
};

const Camshafts = ({ simRef, mode, selected }) => {
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  return (
    <group>
      {Object.keys(VALVES).map((which) => (
        <Camshaft key={which} which={which} simRef={simRef} material={steel} />
      ))}
    </group>
  );
};

export default Camshafts;
