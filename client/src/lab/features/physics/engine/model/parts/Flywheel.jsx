import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GEOM, TAU, crankRotationX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { Instances, hexBolt, latheX, matrixAt, slabX, toothedShape, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.flywheel.shell;
const X = GEOM.flywheelX;
const RIM_R = 0.68;
const BOLT_MATRICES = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * TAU;
  return matrixAt(X + 0.06, 0.2 * Math.cos(a), 0.2 * Math.sin(a), 0, 0, -Math.PI / 2);
});

const build = () => {
  const disc = latheX(
    [
      [0, X + 0.06],
      [0.32, X + 0.06, true],
      [0.32, X + 0.0, true],
      [RIM_R - 0.1, X + 0.0, true],
      [RIM_R - 0.1, X + 0.05, true],
      [RIM_R, X + 0.05, true],
      [RIM_R, X - 0.1, true],
      [RIM_R - 0.1, X - 0.1, true],
      [RIM_R - 0.1, X - 0.06, true],
      [0.32, X - 0.06, true],
      [0.32, X - 0.02, true],
      [0, X - 0.02],
    ],
    80,
  );
  // Friction face for the clutch on the rear side.
  const face = latheX(
    [
      [0.34, X - 0.1],
      [RIM_R - 0.12, X - 0.1, true],
      [RIM_R - 0.12, X - 0.108, true],
      [0.34, X - 0.108, true],
    ],
    64,
  );
  const ringGear = slabX(toothedShape(RIM_R + 0.045, 110, 0.03, RIM_R - 0.01), X - 0.07, X + 0.01, 0.004, 2);
  return { disc, face, ringGear, bolt: hexBolt(0.04, 0.045, 0.012) };
};

const Flywheel = ({ simRef, mode, selected }) => {
  const ref = useRef(null);
  const dark = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = crankRotationX(simRef.current.theta);
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo.disc} material={dark} castShadow />
      <mesh geometry={geo.face} material={steel} />
      <mesh geometry={geo.ringGear} material={steel} />
      <Instances geometry={geo.bolt} material={steel} matrices={BOLT_MATRICES} />
    </group>
  );
};

export default Flywheel;
