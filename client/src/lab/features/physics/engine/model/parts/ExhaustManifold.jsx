import * as THREE from "three";
import {
  COLLECTOR,
  CYLINDER_X,
  DOWNPIPE_POINTS,
  EXHAUST_PIPE_RADIUS,
  GEOM,
  exhaustPrimaryPoints,
} from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import {
  Instances,
  circleHole,
  flat,
  hexBolt,
  lathe,
  matrixAt,
  merge,
  rrect,
  slabZ,
  tube,
  useGeometries,
  withHoles,
} from "../geometry";

const SHELL = PART_BY_ID.exhaust.shell;
const HZ = GEOM.headHalfZ;
const NUT_MATRICES = CYLINDER_X.flatMap((x) =>
  [1, -1].map((s) => matrixAt(x + s * 0.23, 2.12, HZ + 0.11, Math.PI / 2, 0, 0)),
);

const build = () => {
  const primaries = CYLINDER_X.map((x) => {
    const pts = exhaustPrimaryPoints(x);
    return tube([[x, 2.12, HZ + 0.06], ...pts.slice(3)], EXHAUST_PIPE_RADIUS, 44, 12);
  });
  const flanges = CYLINDER_X.map((x) =>
    slabZ(withHoles(rrect(0.62, 0.44, 0.06, x, 2.12), [circleHole(0.115, x, 2.12)]), HZ + 0.05, HZ + 0.11, 0.008),
  );
  const collector = lathe(
    [
      [0, -0.3],
      [0.17, -0.3, true],
      [0.27, -0.14, true],
      [0.27, 0.18, true],
      [0.2, 0.3, true],
      [0, 0.3],
    ],
    32,
  ).translate(COLLECTOR.x, COLLECTOR.y, COLLECTOR.z);
  const downpipe = tube(DOWNPIPE_POINTS, 0.15, 32, 12);
  const end = DOWNPIPE_POINTS[DOWNPIPE_POINTS.length - 1];
  const pipeFlange = lathe(
    [
      [0, -0.02],
      [0.22, -0.02, true],
      [0.22, 0.02, true],
      [0, 0.02],
    ],
    32,
  )
    .rotateX(Math.PI / 2)
    .translate(end[0], end[1], end[2] - 0.1);
  // Oxygen sensor screwed into the collector.
  const sensor = merge([
    hexBolt(0.035, 0.04, 0.01),
    flat(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 10).translate(0, 0.1, 0)),
  ])
    .rotateX(-0.9)
    .translate(COLLECTOR.x + 0.05, COLLECTOR.y + 0.26, COLLECTOR.z + 0.14);
  return {
    iron: merge([...primaries, ...flanges, collector]),
    steel: merge([downpipe, pipeFlange]),
    sensor,
    nut: hexBolt(0.03, 0.035, 0.01),
  };
};

const ExhaustManifold = ({ mode, selected }) => {
  const iron = usePartMaterial("castIron", { mode, shell: SHELL, selected });
  const dark = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  return (
    <group>
      <mesh geometry={geo.iron} material={iron} castShadow receiveShadow />
      <mesh geometry={geo.steel} material={dark} castShadow />
      <mesh geometry={geo.sensor} material={steel} />
      <Instances geometry={geo.nut} material={steel} matrices={NUT_MATRICES} />
    </group>
  );
};

export default ExhaustManifold;
