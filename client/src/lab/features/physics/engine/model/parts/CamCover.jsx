import { Suspense } from "react";
import { Text } from "@react-three/drei";
import { CYLINDER_X, GEOM, VALVES } from "../../engineMath";
import { ENGINE_FONT } from "../engineFont";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import {
  Instances,
  circleHole,
  hexBolt,
  lathe,
  latheX,
  matrixAt,
  merge,
  rrect,
  slabY,
  useGeometries,
  withHoles,
} from "../geometry";

const SHELL = PART_BY_ID.camCover.shell;
const { headTopY: BOTTOM, coverTopY: TOP, coverHalfZ: HZ } = GEOM;
const HX = 2.2;
const WELL_R = 0.08;
const FLANGE_H = 0.05;
// Between the head-bolt columns so the two bolt rows never overlap.
const BOLT_XZ = [
  ...[-1.65, -0.55, 0.55, 1.65].flatMap((x) => [
    [x, HZ + 0.06],
    [x, -HZ - 0.06],
  ]),
  [-HX - 0.05, 0],
  [HX + 0.05, 0],
];
const BOLT_MATRICES = BOLT_XZ.map(([x, z]) => matrixAt(x, BOTTOM + FLANGE_H, z));
const CAP_POS = [-1.1, TOP, 0.0];
const noRaycast = () => null;

const build = () => {
  const wells = () => CYLINDER_X.map((x) => circleHole(WELL_R, x, 0));
  const flange = slabY(
    withHoles(rrect(HX * 2 + 0.2, HZ * 2 + 0.22, 0.16), [rrect(HX * 2 - 0.3, HZ * 2 - 0.3, 0.1)]),
    BOTTOM,
    BOTTOM + FLANGE_H,
    0.01,
  );
  const body = slabY(withHoles(rrect(HX * 2, HZ * 2, 0.16), wells()), BOTTOM + 0.02, TOP - 0.08, 0.03);
  const lid = slabY(withHoles(rrect(HX * 2 - 0.16, HZ * 2 - 0.16, 0.14), wells()), TOP - 0.1, TOP, 0.03);
  // Raised ridge over each camshaft.
  const ridges = Object.values(VALVES).map((v) =>
    latheX(
      [
        [0, -HX + 0.25],
        [0.14, -HX + 0.25],
        [0.17, -HX + 0.3, true],
        [0.17, HX - 0.3, true],
        [0.14, HX - 0.25],
        [0, HX - 0.25],
      ],
      32,
    ).translate(0, TOP - 0.06, v.camCenter.z),
  );
  const paint = merge([flange, body, lid, ...ridges]);

  const oilCap = lathe(
    [
      [0, 0],
      [0.13, 0, true],
      [0.15, 0.03, true],
      [0.15, 0.09, true],
      [0.12, 0.1, true],
      [0.12, 0.13, true],
      [0.045, 0.13, true],
      [0.045, 0.15],
      [0, 0.15],
    ],
    36,
  );
  const wellRim = lathe(
    [
      [WELL_R, -0.02],
      [WELL_R + 0.03, -0.02, true],
      [WELL_R + 0.03, 0.035, true],
      [WELL_R, 0.035, true],
    ],
    32,
  );
  return { paint, oilCap, wellRim, bolt: hexBolt(0.03, 0.03, 0.01) };
};

const WELL_MATRICES = CYLINDER_X.map((x) => matrixAt(x, TOP, 0));

const CamCover = ({ mode, selected }) => {
  const paintMat = usePartMaterial("paintRed", { mode, shell: SHELL, selected });
  const black = usePartMaterial("paintBlack", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  return (
    <group>
      <mesh geometry={geo.paint} material={paintMat} castShadow receiveShadow />
      <mesh geometry={geo.oilCap} material={black} position={CAP_POS} />
      <Instances geometry={geo.wellRim} material={steel} matrices={WELL_MATRICES} />
      <Instances geometry={geo.bolt} material={steel} matrices={BOLT_MATRICES} />
      {/* Cylinder numbers on the front face; cylinder 1 is at the timing end. */}
      <Suspense fallback={null}>
        {CYLINDER_X.map((x, i) => (
          <Text
            key={x}
            font={ENGINE_FONT}
            position={[x - 0.3, (BOTTOM + TOP) / 2 + 0.04, HZ + 0.003]}
            fontSize={0.2}
            color="#f3dede"
            anchorX="center"
            anchorY="middle"
            fillOpacity={mode === "xray" ? 0.08 : 1}
            raycast={noRaycast}
          >
            {String(i + 1)}
          </Text>
        ))}
      </Suspense>
    </group>
  );
};

export default CamCover;
