import { CYLINDER_X, GEOM, HEAD_BOLT_XZ, MAIN_X, VALVES } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import {
  Instances,
  circleHole,
  hexBolt,
  matrixAt,
  merge,
  rrect,
  slabX,
  slabY,
  slabZ,
  useGeometries,
  withHoles,
} from "../geometry";

const SHELL = PART_BY_ID.head.shell;
const { boreRadius: RB, deckY: DECK, chamberDepth: CHAMBER, headTopY: TOP, headHalfZ: HZ, blockHalfX: HX, valvePairDX: DX, valveTilt } = GEOM;
const CAP_H = 0.16;
const PLUG_R = 0.07;

const HEAD_BOLT_MATRICES = HEAD_BOLT_XZ.map(([x, z]) => matrixAt(x, TOP, z));
const CAP_BOLT_MATRICES = MAIN_X.flatMap((x) =>
  Object.values(VALVES).flatMap((v) =>
    [1, -1].map((s) => matrixAt(x, v.camCenter.y + CAP_H, v.camCenter.z + s * 0.1)),
  ),
);

const outline = () => rrect(HX * 2, HZ * 2, 0.12);
const plugHoles = () => CYLINDER_X.map((x) => circleHole(PLUG_R, x, 0));

const buildHead = () => {
  const chambers = slabY(
    withHoles(outline(), CYLINDER_X.map((x) => circleHole(RB - 0.03, x, 0))),
    DECK,
    DECK + CHAMBER,
    0.01,
  );
  const middle = slabY(withHoles(outline(), plugHoles()), DECK + CHAMBER, TOP - 0.25, 0.012);
  // Spring pockets follow the tilted stems up to the top face.
  const pocketZ = Object.values(VALVES).map((v) => [
    v.side,
    v.headClosed.z + (TOP - 0.125 - v.headClosed.y) * Math.tan(valveTilt) * v.side,
  ]);
  const pockets = CYLINDER_X.flatMap((x) =>
    pocketZ.flatMap(([, z]) => [circleHole(0.1, x - DX, -z), circleHole(0.1, x + DX, -z)]),
  );
  const top = slabY(withHoles(outline(), [...plugHoles(), ...pockets]), TOP - 0.25, TOP, 0.012);

  const caps = MAIN_X.flatMap((x) =>
    Object.values(VALVES).map((v) => {
      const { y, z } = v.camCenter;
      return slabX(
        withHoles(rrect(0.3, y + CAP_H - TOP, 0.03, -z, (y + CAP_H + TOP) / 2), [circleHole(0.105, -z, y)]),
        x - 0.09,
        x + 0.09,
        0.008,
      );
    }),
  );

  const exhaustFlange = slabZ(
    withHoles(rrect(4.5, 0.52, 0.06, 0, 2.12), CYLINDER_X.map((x) => circleHole(0.12, x, 2.12))),
    HZ - 0.01,
    HZ + 0.05,
    0.008,
  );
  const intakeFlange = slabZ(
    withHoles(rrect(4.5, 0.56, 0.06, 0, 2.22), CYLINDER_X.map((x) => circleHole(0.13, x, 2.22))),
    -HZ - 0.05,
    -HZ + 0.01,
    0.008,
  );

  return {
    cast: merge([chambers, middle, top, ...caps, exhaustFlange, intakeFlange]),
    headBolt: hexBolt(0.05, 0.06, 0.014),
    capBolt: hexBolt(0.028, 0.03, 0.008),
  };
};

const Head = ({ mode, selected }) => {
  const cast = usePartMaterial("castHead", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(buildHead);

  return (
    <group>
      <mesh geometry={geo.cast} material={cast} castShadow receiveShadow />
      <Instances geometry={geo.headBolt} material={steel} matrices={HEAD_BOLT_MATRICES} />
      <Instances geometry={geo.capBolt} material={steel} matrices={CAP_BOLT_MATRICES} />
    </group>
  );
};

export default Head;
