import { CYLINDER_X, GEOM, HEAD_BOLT_XZ } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { Instances, circleHole, lathe, matrixAt, rrect, slabY, useGeometries, withHoles } from "../geometry";
import { COOLANT_HOLES } from "./Block";

const SHELL = PART_BY_ID.headGasket.shell;
const { boreRadius: RB, deckY: DECK, blockHalfX: HX, blockHalfZ: HZ } = GEOM;
const HALF = 0.012;
const RING_MATRICES = CYLINDER_X.map((x) => matrixAt(x, 0, 0));

const build = () => {
  const sheet = slabY(
    withHoles(rrect(HX * 2 - 0.02, HZ * 2 - 0.02, 0.11), [
      ...CYLINDER_X.map((x) => circleHole(RB + 0.03, x, 0)),
      ...COOLANT_HOLES.map(([x, z]) => circleHole(0.036, x, -z)),
      ...HEAD_BOLT_XZ.map(([x, z]) => circleHole(0.044, x, -z)),
    ]),
    DECK - HALF,
    DECK + HALF,
  );
  // Steel fire ring around each bore.
  const ring = lathe(
    [
      [RB + 0.004, DECK - HALF - 0.002],
      [RB + 0.032, DECK - HALF - 0.002, true],
      [RB + 0.032, DECK + HALF + 0.002, true],
      [RB + 0.004, DECK + HALF + 0.002, true],
    ],
    64,
  );
  return { sheet, ring };
};

const HeadGasket = ({ mode, selected }) => {
  const sheetMat = usePartMaterial("gasket", { mode, shell: SHELL, selected });
  const ringMat = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);
  return (
    <group>
      <mesh geometry={geo.sheet} material={sheetMat} />
      <Instances geometry={geo.ring} material={ringMat} matrices={RING_MATRICES} />
    </group>
  );
};

export default HeadGasket;
