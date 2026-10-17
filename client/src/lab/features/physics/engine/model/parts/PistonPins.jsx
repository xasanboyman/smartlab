import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, cylinderTheta, pistonPinY } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { latheX, merge, setInstance, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.pin.shell;
const COUNT = CYLINDERS.length;
const HALF = 0.27;

// Hollow wrist pin with a circlip at each end.
const build = () => {
  const pin = latheX(
    [
      [0.036, -HALF],
      [0.054, -HALF, true],
      [0.06, -HALF + 0.008, true],
      [0.06, HALF - 0.008, true],
      [0.054, HALF, true],
      [0.036, HALF, true],
    ],
    32,
  );
  const clips = [1, -1].map((s) =>
    new THREE.TorusGeometry(0.063, 0.007, 6, 28).rotateY(Math.PI / 2).translate(s * (HALF - 0.02), 0, 0),
  );
  return { pin: merge([pin, ...clips]) };
};

const PistonPins = ({ simRef, mode, selected }) => {
  const ref = useRef(null);
  const mat = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const theta = simRef.current.theta;
    for (let i = 0; i < COUNT; i++) {
      setInstance(mesh, i, CYLINDERS[i].x, pistonPinY(cylinderTheta(theta, i)), 0);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo.pin, mat, COUNT]} frustumCulled={false} />;
};

export default PistonPins;
