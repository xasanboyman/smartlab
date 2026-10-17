import { GEOM } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { Instances, hexBolt, matrixAt, merge, rrect, slabY, useGeometries, withHoles } from "../geometry";

const SHELL = PART_BY_ID.crankcase.shell;
const { blockHalfX: HX, blockHalfZ: HZ, blockBottomY: TOP, panBottomY: BOTTOM } = GEOM;
const FLANGE_H = 0.06;
const BOLT_MATRICES = [
  ...[-2.0, -1.2, -0.4, 0.4, 1.2, 2.0].flatMap((x) => [
    [x, HZ + 0.1],
    [x, -HZ - 0.1],
  ]),
  [-HX - 0.09, 0.45],
  [-HX - 0.09, -0.45],
  [HX + 0.09, 0.45],
  [HX + 0.09, -0.45],
].map(([x, z]) => matrixAt(x, TOP, z));
const DRAIN_MATRICES = [matrixAt(0.9, BOTTOM, 0.35, Math.PI, 0, 0)];

// Oil pan: bolted flange, deep sump with a stepped, rounded bottom.
const build = () => {
  const flange = slabY(
    withHoles(rrect(HX * 2 + 0.3, HZ * 2 + 0.3, 0.18), [rrect(HX * 2 - 0.5, HZ * 2 - 0.44, 0.1)]),
    TOP - FLANGE_H,
    TOP,
    0.012,
  );
  const upper = slabY(rrect(HX * 2 - 0.1, HZ * 2 - 0.1, 0.2), BOTTOM + 0.3, TOP - FLANGE_H + 0.001, 0.03);
  const sump = slabY(rrect(HX * 2 - 0.4, HZ * 2 - 0.4, 0.28), BOTTOM, BOTTOM + 0.3 + 0.001, 0.07);
  return { pan: merge([flange, upper, sump]), bolt: hexBolt(0.03, 0.03, 0.01), drain: hexBolt(0.05, 0.05, 0.016) };
};

const Crankcase = ({ mode, selected }) => {
  const paint = usePartMaterial("paintBlack", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const geo = useGeometries(build);

  return (
    <group>
      <mesh geometry={geo.pan} material={paint} castShadow receiveShadow />
      <Instances geometry={geo.bolt} material={steel} matrices={BOLT_MATRICES} />
      <Instances geometry={geo.drain} material={steel} matrices={DRAIN_MATRICES} />
    </group>
  );
};

export default Crankcase;
