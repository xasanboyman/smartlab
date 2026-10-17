import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, DEG, GEOM, crankRotationX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { latheX, merge, polygon, slabX, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.crankshaft.shell;
const R = GEOM.crankRadius;
const PIN_R = 0.12;
const PIN_HALF = 0.13;
const WEB_T = 0.14;
const MAIN_R = 0.15;
const REAR_X = -2.36;
const FRONT_X = 2.45;
const NOSE_END = 2.95;

// Web outline in (-z, y): boss around the pin, counterweight opposite it.
const webShape = (flip) => {
  const pts = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = (-35 + (250 * i) / n) * DEG;
    pts.push([0.17 * Math.cos(a), R + 0.17 * Math.sin(a)]);
  }
  for (let i = 0; i <= n; i++) {
    const a = (200 + (140 * i) / n) * DEG;
    pts.push([0.42 * Math.cos(a), 0.42 * Math.sin(a)]);
  }
  const k = flip ? -1 : 1;
  return polygon(pts.map(([z, y]) => [-z * k, y * k]));
};

const build = () => {
  const webs = [];
  const pins = [];
  for (const { x, phase } of CYLINDERS) {
    const flip = Math.abs(Math.cos(phase) + 1) < 1e-6;
    const shape = () => webShape(flip);
    webs.push(slabX(shape(), x - PIN_HALF - WEB_T, x - PIN_HALF, 0.012));
    webs.push(slabX(shape(), x + PIN_HALF, x + PIN_HALF + WEB_T, 0.012));
    pins.push(
      new THREE.CylinderGeometry(PIN_R, PIN_R, PIN_HALF * 2 + 0.02, 32)
        .rotateZ(Math.PI / 2)
        .translate(x, R * Math.cos(phase), R * Math.sin(phase)),
    );
  }
  // Main journals fill the gaps between throws; nose and rear flange on the ends.
  const edges = [REAR_X, ...CYLINDERS.flatMap(({ x }) => [x - PIN_HALF - WEB_T, x + PIN_HALF + WEB_T]), FRONT_X].sort(
    (a, b) => a - b,
  );
  const mains = [];
  for (let i = 0; i < edges.length; i += 2) {
    const x0 = edges[i];
    const x1 = edges[i + 1];
    mains.push(latheX([[0, x0 - 0.01], [MAIN_R, x0 - 0.01, true], [MAIN_R, x1 + 0.01, true], [0, x1 + 0.01]], 40));
  }
  const nose = latheX(
    [
      [0, FRONT_X],
      [0.1, FRONT_X, true],
      [0.1, NOSE_END - 0.02, true],
      [0.08, NOSE_END, true],
      [0, NOSE_END],
    ],
    24,
  );
  const flange = latheX(
    [
      [0, REAR_X - 0.08],
      [0.3, REAR_X - 0.08, true],
      [0.3, REAR_X, true],
      [0, REAR_X],
    ],
    40,
  );
  return { journals: merge([...pins, ...mains, nose, flange]), webs: merge(webs) };
};

const Crankshaft = ({ simRef, mode, selected }) => {
  const ref = useRef(null);
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const forged = usePartMaterial("forgedSteel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = crankRotationX(simRef.current.theta);
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo.journals} material={steel} castShadow />
      <mesh geometry={geo.webs} material={forged} castShadow />
    </group>
  );
};

export default Crankshaft;
