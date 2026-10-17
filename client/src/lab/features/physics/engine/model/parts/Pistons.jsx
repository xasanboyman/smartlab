import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GEOM, cylinderTheta, pistonPinY } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { lathe, latheX, merge, setInstance, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.piston.shell;
const R = GEOM.boreRadius - 0.01;
const TOP = GEOM.pinToCrown;
const BOTTOM = TOP - GEOM.pistonHeight;
const DISH = 0.025;
const COUNT = CYLINDERS.length;
const GROOVES = [
  [0.012, 0.04, R - 0.03],
  [0.067, 0.085, R - 0.028],
  [0.112, 0.13, R - 0.028],
];

const buildBody = () => {
  const pts = [
    [0, 0.125],
    [0.28, 0.125],
    [0.33, 0.115],
    [0.355, 0.09],
    [0.362, 0.06],
    [0.362, 0.0],
    [0.38, -0.035],
    [0.38, BOTTOM, true],
    [R - 0.012, BOTTOM, true],
    [R, BOTTOM + 0.012, true],
  ];
  for (const [y0, y1, depth] of GROOVES) {
    pts.push([R, y0, true], [depth, y0, true], [depth, y1, true], [R, y1, true]);
  }
  pts.push([R, TOP - 0.025, true], [R - 0.01, TOP, true], [0.3, TOP, true], [0.25, TOP - DISH], [0, TOP - DISH]);
  const body = lathe(pts, 64);
  // Pin bosses with their reinforcing struts under the crown.
  const bossProfile = [
    [0.065, 0.08],
    [0.115, 0.08, true],
    [0.115, 0.3, true],
    [0.065, 0.3, true],
  ];
  const bosses = [latheX(bossProfile, 32), latheX(bossProfile, 32).rotateY(Math.PI)];
  const struts = [1, -1].map((s) => new THREE.BoxGeometry(0.26, 0.05, 0.09).translate(0, 0.1, s * 0.3));
  return merge([body, ...bosses, ...struts]);
};

const buildRings = () => {
  const pts = [];
  GROOVES.forEach(([y0, y1, depth], i) => {
    const ri = depth + 0.002;
    const ro = R + 0.001;
    const g = 0.0015;
    pts.push([ri, y0 + g, i > 0], [ro, y0 + g, true], [ro, y1 - g, true], [ri, y1 - g, i < GROOVES.length - 1]);
  });
  return lathe(pts, 64);
};

const Pistons = ({ simRef, mode, selected }) => {
  const bodyRef = useRef(null);
  const ringRef = useRef(null);
  const bodyMat = usePartMaterial("aluminum", { mode, shell: SHELL, selected });
  const ringMat = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const geo = useGeometries(() => ({ body: buildBody(), rings: buildRings() }));

  useFrame(() => {
    const body = bodyRef.current;
    const rings = ringRef.current;
    if (!body || !rings) return;
    const theta = simRef.current.theta;
    for (let i = 0; i < COUNT; i++) {
      const y = pistonPinY(cylinderTheta(theta, i));
      setInstance(body, i, CYLINDERS[i].x, y, 0);
      setInstance(rings, i, CYLINDERS[i].x, y, 0);
    }
    body.instanceMatrix.needsUpdate = true;
    rings.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geo.body, bodyMat, COUNT]} frustumCulled={false} castShadow receiveShadow />
      <instancedMesh ref={ringRef} args={[geo.rings, ringMat, COUNT]} frustumCulled={false} />
    </group>
  );
};

export default Pistons;
