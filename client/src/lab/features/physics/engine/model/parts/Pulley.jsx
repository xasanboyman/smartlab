import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GEOM, crankRotationX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { flat, latheX, merge, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.pulley.shell;
const X = GEOM.pulleyX;
const OUTER_R = 0.44;
const MARK_COLOR = "#fde047";

// Harmonic damper: inner hub, rubber ring, outer belt pulley with three V-grooves.
const build = () => {
  const hub = latheX(
    [
      [0.1, X - 0.12],
      [0.2, X - 0.12, true],
      [0.2, X + 0.1, true],
      [0.1, X + 0.1, true],
    ],
    40,
  );
  const rubber = latheX(
    [
      [0.195, X - 0.09],
      [0.305, X - 0.09, true],
      [0.305, X + 0.07, true],
      [0.195, X + 0.07, true],
    ],
    48,
  );
  const ring = latheX(
    [
      [0.3, X - 0.1],
      [OUTER_R, X - 0.1, true],
      [OUTER_R, X - 0.075, true],
      [OUTER_R - 0.035, X - 0.055, true],
      [OUTER_R, X - 0.035, true],
      [OUTER_R, X - 0.01, true],
      [OUTER_R - 0.035, X + 0.01, true],
      [OUTER_R, X + 0.03, true],
      [OUTER_R, X + 0.055, true],
      [OUTER_R - 0.035, X + 0.075, true],
      [OUTER_R, X + 0.095, true],
      [OUTER_R, X + 0.1, true],
      [0.3, X + 0.1, true],
    ],
    80,
  );
  const bolt = merge([
    flat(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 6).rotateZ(-Math.PI / 2).translate(X + 0.135, 0, 0)),
    latheX(
      [
        [0, X + 0.1],
        [0.11, X + 0.1, true],
        [0.11, X + 0.115, true],
        [0, X + 0.115],
      ],
      24,
    ),
  ]);
  // TDC notch on the rim; the fixed pointer sits on the block above it.
  const mark = new THREE.BoxGeometry(0.03, 0.035, 0.035).translate(X + 0.09, OUTER_R - 0.005, 0);
  const pointer = new THREE.ConeGeometry(0.03, 0.08, 4).rotateX(Math.PI).translate(X + 0.09, OUTER_R + 0.08, 0);
  return { steel: merge([hub, ring]), rubber, bolt, mark, pointer };
};

const Pulley = ({ simRef, mode, selected }) => {
  const ref = useRef(null);
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const rubber = usePartMaterial("rubber", { mode, shell: SHELL, selected });
  const brass = usePartMaterial("brass", { mode, shell: SHELL, selected });
  const markMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MARK_COLOR, emissive: MARK_COLOR, emissiveIntensity: 0.6, roughness: 0.4 }),
    [],
  );
  const geo = useGeometries(build);
  useEffect(() => () => markMat.dispose(), [markMat]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = crankRotationX(simRef.current.theta);
  });

  return (
    <group>
      <group ref={ref}>
        <mesh geometry={geo.steel} material={steel} castShadow />
        <mesh geometry={geo.rubber} material={rubber} />
        <mesh geometry={geo.bolt} material={brass} />
        <mesh geometry={geo.mark} material={markMat} />
      </group>
      <mesh geometry={geo.pointer} material={markMat} />
    </group>
  );
};

export default Pulley;
