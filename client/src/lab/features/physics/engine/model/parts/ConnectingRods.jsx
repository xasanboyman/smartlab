import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GEOM, crankPinYZ, cylinderTheta, rodAngleX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { hexBolt, latheX, merge, setInstance, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.rod.shell;
const COUNT = CYLINDERS.length;
const L = GEOM.rodLength;

// Local frame: big end on the crank pin at the origin, small end at +y = rod length.
const build = () => {
  const bigEnd = latheX(
    [
      [0.125, -0.1],
      [0.19, -0.1, true],
      [0.2, -0.09, true],
      [0.2, 0.09, true],
      [0.19, 0.1, true],
      [0.125, 0.1, true],
    ],
    48,
  );
  const smallEnd = latheX(
    [
      [0.063, -0.075],
      [0.108, -0.075, true],
      [0.115, -0.068, true],
      [0.115, 0.068, true],
      [0.108, 0.075, true],
      [0.063, 0.075, true],
    ],
    40,
  ).translate(0, L, 0);
  const shankY0 = 0.14;
  const shankY1 = L - 0.08;
  const shankH = shankY1 - shankY0;
  const shankMid = (shankY0 + shankY1) / 2;
  const web = new THREE.BoxGeometry(0.045, shankH, 0.11).translate(0, shankMid, 0);
  const flanges = [1, -1].map((s) => new THREE.BoxGeometry(0.13, shankH, 0.024).translate(0, shankMid, s * 0.055));
  // Bolt bosses either side of the big end with the cap nuts underneath.
  const bosses = [1, -1].map((s) => new THREE.BoxGeometry(0.12, 0.3, 0.08).translate(0, -0.03, s * 0.15));
  const nuts = [1, -1].map((s) => hexBolt(0.028, 0.03, 0.008).rotateX(Math.PI).translate(0, -0.18, s * 0.15));
  return { rod: merge([bigEnd, smallEnd, web, ...flanges, ...bosses, ...nuts]) };
};

const ConnectingRods = ({ simRef, mode, selected }) => {
  const ref = useRef(null);
  const mat = usePartMaterial("forgedSteel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const theta = simRef.current.theta;
    for (let i = 0; i < COUNT; i++) {
      const t = cylinderTheta(theta, i);
      const pin = crankPinYZ(t);
      setInstance(mesh, i, CYLINDERS[i].x, pin.y, pin.z, rodAngleX(t));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo.rod, mat, COUNT]} frustumCulled={false} castShadow />;
};

export default ConnectingRods;
