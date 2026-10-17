import * as THREE from "three";
import { CYLINDER_X, GEOM, INTAKE_PIPE_RADIUS, PLENUM, intakeRunnerPoints } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import {
  Instances,
  circleHole,
  flat,
  hexBolt,
  lathe,
  latheX,
  matrixAt,
  merge,
  rrect,
  slabZ,
  tube,
  useGeometries,
  withHoles,
} from "../geometry";

const SHELL = PART_BY_ID.intake.shell;
const HZ = GEOM.headHalfZ;
const { y: PY, z: PZ, radius: PR } = PLENUM;
const NUT_MATRICES = CYLINDER_X.flatMap((x) =>
  [1, -1].map((s) => matrixAt(x + s * 0.24, 2.22, -HZ - 0.11, -Math.PI / 2, 0, 0)),
);
const INJECTOR_MATRICES = CYLINDER_X.map((x) => matrixAt(x, 2.46, -1.0, -0.42));

const build = () => {
  const plenum = latheX(
    [
      [0, -2.3],
      [PR - 0.06, -2.3, true],
      [PR, -2.24, true],
      [PR, 2.26, true],
      [PR - 0.06, 2.32, true],
      [0.17, 2.32, true],
      [0.17, 2.5, true],
      [0.21, 2.5, true],
      [0.21, 2.56, true],
      [0.16, 2.56, true],
      [0.16, 2.82, true],
      [0.21, 2.82, true],
      [0.21, 2.88, true],
      [0, 2.88],
    ],
    40,
  ).translate(0, PY, PZ);
  // Air inlet elbow after the throttle body.
  const inlet = tube(
    [
      [2.86, PY, PZ],
      [3.05, PY, PZ],
      [3.2, PY - 0.05, PZ - 0.25],
      [3.25, PY - 0.2, PZ - 0.5],
    ],
    0.15,
    24,
    12,
  );
  const runners = CYLINDER_X.map((x) => {
    const pts = intakeRunnerPoints(x);
    return tube([pts[0], pts[1], pts[2], [x, 2.22, -HZ + 0.06]], INTAKE_PIPE_RADIUS, 28, 12);
  });
  const flange = slabZ(
    withHoles(rrect(4.5, 0.56, 0.06, 0, 2.22), CYLINDER_X.map((x) => circleHole(0.125, x, 2.22))),
    -HZ - 0.11,
    -HZ - 0.05,
    0.008,
  );
  const throttlePlate = lathe(
    [
      [0, 0],
      [0.15, 0, true],
      [0.15, 0.008, true],
      [0, 0.008],
    ],
    32,
  )
    .rotateZ(Math.PI / 2 + 0.35)
    .translate(2.7, PY, PZ);
  const throttleShaft = flat(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8).rotateX(Math.PI / 2)).translate(2.7, PY, PZ);
  const rail = flat(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 14).rotateZ(Math.PI / 2).translate(0, 2.6, -1.04));
  const injector = merge([
    lathe(
      [
        [0, -0.1],
        [0.03, -0.1, true],
        [0.03, -0.02, true],
        [0.045, -0.02, true],
        [0.045, 0.1, true],
        [0.035, 0.1, true],
        [0.035, 0.14, true],
        [0, 0.14],
      ],
      16,
    ),
  ]);
  return {
    cast: merge([plenum, ...runners, flange]),
    bright: merge([inlet, throttlePlate, throttleShaft]),
    rail,
    injector,
    nut: hexBolt(0.03, 0.035, 0.01),
  };
};

const IntakeManifold = ({ mode, selected }) => {
  const cast = usePartMaterial("castAluminum", { mode, shell: SHELL, selected });
  const bright = usePartMaterial("aluminum", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const plastic = usePartMaterial("plastic", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  return (
    <group>
      <mesh geometry={geo.cast} material={cast} castShadow receiveShadow />
      <mesh geometry={geo.bright} material={bright} />
      <mesh geometry={geo.rail} material={steel} />
      <Instances geometry={geo.injector} material={plastic} matrices={INJECTOR_MATRICES} />
      <Instances geometry={geo.nut} material={steel} matrices={NUT_MATRICES} />
    </group>
  );
};

export default IntakeManifold;
