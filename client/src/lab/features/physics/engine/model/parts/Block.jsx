import * as THREE from "three";
import { CYLINDER_X, GEOM, HEAD_BOLT_XZ, MAIN_X } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import {
  Instances,
  circleHole,
  flat,
  lathe,
  matrixAt,
  merge,
  rrect,
  slabX,
  slabY,
  useGeometries,
  withHoles,
} from "../geometry";

const SHELL = PART_BY_ID.block.shell;
const { boreRadius: RB, deckY: DECK, linerBottomY: LINER_Y, blockHalfX: HX, blockHalfZ: HZ, blockBottomY: BOTTOM } = GEOM;

// Coolant passages around every bore; the head gasket repeats them.
export const COOLANT_HOLES = [
  ...CYLINDER_X.flatMap((x) => [
    [x, 0.6],
    [x, -0.6],
  ]),
  ...MAIN_X.flatMap((x) => {
    const bx = Math.max(-2.12, Math.min(2.12, x));
    return [
      [bx, 0.52],
      [bx, -0.52],
    ];
  }),
];

const LINER_MATRICES = CYLINDER_X.map((x) => matrixAt(x, 0, 0));
const PLUG_MATRICES = CYLINDER_X.flatMap((x) => [
  matrixAt(x, 1.2, HZ - 0.005, Math.PI / 2, 0, 0),
  matrixAt(x, 1.2, -HZ + 0.005, -Math.PI / 2, 0, 0),
]);

const deckShape = () =>
  withHoles(rrect(HX * 2, HZ * 2, 0.12), [
    ...CYLINDER_X.map((x) => circleHole(RB, x, 0)),
    ...COOLANT_HOLES.map(([x, z]) => circleHole(0.032, x, -z)),
    ...HEAD_BOLT_XZ.map(([x, z]) => circleHole(0.04, x, -z)),
  ]);

const buildBlock = () => {
  const upper = slabY(
    withHoles(rrect(HX * 2, HZ * 2, 0.12), CYLINDER_X.map((x) => circleHole(RB, x, 0))),
    LINER_Y,
    DECK - 0.05,
    0.015,
  );
  const deck = slabY(deckShape(), DECK - 0.05, DECK, 0.006);
  const skirt = slabY(
    withHoles(rrect(HX * 2, (HZ + 0.06) * 2, 0.14), [rrect(HX * 2 - 0.5, HZ * 2 - 0.44, 0.1)]),
    BOTTOM,
    LINER_Y,
    0.02,
  );
  const bulkheads = MAIN_X.map((x) =>
    slabX(withHoles(rrect((HZ - 0.2) * 2, 0.8, 0.05, 0, 0.1), [circleHole(0.165, 0, 0)]), x - 0.07, x + 0.07, 0.008),
  );
  const ribs = [-2.05, -1.1, 0, 1.1, 2.05].flatMap((x) =>
    [1, -1].map((s) =>
      new THREE.BoxGeometry(0.09, DECK - LINER_Y - 0.12, 0.06).translate(x, (DECK + LINER_Y) / 2 - 0.04, s * (HZ + 0.02)),
    ),
  );
  const lugs = [-1.6, 1.6].flatMap((x) =>
    [1, -1].map((s) =>
      flat(new THREE.CylinderGeometry(0.085, 0.085, 0.18, 24).rotateX(Math.PI / 2).translate(x, 0.72, s * (HZ + 0.05))),
    ),
  );
  const cast = merge([upper, deck, skirt, ...bulkheads, ...ribs, ...lugs]);

  // Honed liner, slightly proud below the bore like a real spigot.
  const liner = lathe(
    [
      [RB, LINER_Y - 0.06],
      [RB + 0.022, LINER_Y - 0.06, true],
      [RB + 0.022, DECK - 0.002, true],
      [RB, DECK - 0.002, true],
    ],
    64,
  );

  const corePlug = lathe(
    [
      [0, 0],
      [0.1, 0, true],
      [0.1, 0.02, true],
      [0.08, 0.03],
      [0, 0.03],
    ],
    32,
  );

  // Dipstick tube on the front corner, oil filter low on the exhaust side.
  const dipstick = merge([
    new THREE.CylinderGeometry(0.022, 0.022, 2.1, 12).translate(0, 1.05, 0).rotateZ(-0.08).translate(2.05, 0.55, HZ + 0.08),
    new THREE.TorusGeometry(0.06, 0.012, 8, 24).translate(2.19, 2.72, HZ + 0.08),
  ]);
  const filter = lathe(
    [
      [0, 0],
      [0.17, 0, true],
      [0.17, 0.3, true],
      [0.15, 0.33, true],
      [0.08, 0.33, true],
      [0.08, 0.36],
      [0, 0.36],
    ],
    40,
  )
    .rotateX(Math.PI / 2)
    .translate(1.9, 0.33, HZ - 0.02);

  return { cast, liner, corePlug, dipstick, filter };
};

const Block = ({ mode, selected }) => {
  const cast = usePartMaterial("castAluminum", { mode, shell: SHELL, selected });
  const dark = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const paint = usePartMaterial("paintBlack", { mode, shell: SHELL, selected });
  const geo = useGeometries(buildBlock);

  return (
    <group>
      <mesh geometry={geo.cast} material={cast} castShadow receiveShadow />
      <Instances geometry={geo.liner} material={dark} matrices={LINER_MATRICES} />
      <Instances geometry={geo.corePlug} material={steel} matrices={PLUG_MATRICES} />
      <mesh geometry={geo.dipstick} material={steel} />
      <mesh geometry={geo.filter} material={paint} />
    </group>
  );
};

export default Block;
