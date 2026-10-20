// Where everything stands when the lab opens. Benches are 3.6 × 1.35 m with the top at 0.9 m; students work on
// the +Z half, and the raised reagent ledge along the bench's centre line (top at 1.25 m) holds the bottles.
const TOP = 0.9;
const LEDGE_Y = 1.25;
const HOOD_TOP = 0.92;

// Bench 1 (front bench, z = -1.15): ledge at z = -1.15, work strip z ∈ [-1.0, -0.56], monitor at the right end.
const LEDGE_1_Z = -1.15;
// Bench 2 (z = 1.35): same layout.
const LEDGE_2_Z = 1.35;

// Anchors below come from the model files (ring/gauze height, rack holes, funnel seat, stand base).
const STAND_RING = [0.013, 0.2186, 0.03];
const STAND_BASE = [0.013, 0.014, 0.03];
const BURETTE_SEAT = [0.013, 0.28, 0.03];
const GAUZE_TOP = 0.004;
const RACK_TUBE_Y = 0.009;
const RACK_HOLE_Z = 0.012;
const RACK_PITCH = 0.028;
// Flask rim (0.1445) minus the funnel height where its cone matches the Ø31 mm neck bore (0.0945).
const FUNNEL_IN_FLASK = 0.1445 - 0.0945;
const HOT_PLATE_TOP = [0, 0.11, -0.056];

const WATER = { liquidColor: "#0d2230", liquidOpacity: 0.08 };

const at = (key, id, x, y, z, extra = {}) => ({ key, id, position: [x, y, z], ...extra });
const onStand = (stand, local) => [stand[0] + local[0], stand[1] + local[1], stand[2] + local[2]];

// ---- Bench 1: heating (left) → measuring → hot plate → weighing & test tubes (right, by the monitor) ----
const STAND_1 = [-1.3, TOP, -0.82];
const RING_1 = onStand(STAND_1, STAND_RING);
const RACK_1 = [1.3, TOP, -0.64];
const FLASK_1 = [-0.5, TOP, -0.88];
const HOT_PLATE = [0.3, TOP, -0.8];

const bench1 = [
  // Heating corner: stand with gauze and a beaker of water over the spirit lamp; burner and crucible beside it.
  at("retort-stand", "retort-stand", ...STAND_1),
  at("spirit-lamp", "spirit-lamp", ...onStand(STAND_1, STAND_BASE), { on: "retort-stand" }),
  at("wire-gauze", "wire-gauze", ...RING_1, { on: "retort-stand" }),
  at("beaker-heating", "beaker", RING_1[0], RING_1[1] + GAUZE_TOP, RING_1[2], { on: "wire-gauze", rotation: [0, -0.4, 0], volumeMl: 120, ...WATER }),
  at("bunsen-burner", "bunsen-burner", -1.0, TOP, -0.9),
  at("crucible", "crucible", -1.05, TOP, -0.62),
  at("crucible-tongs", "crucible-tongs", -1.32, TOP, -0.58, { rotation: [0, 0.05, 0] }),

  // Measuring: cylinder, flask with funnel, beaker, thermometer and rod within reach.
  at("measuring-cylinder", "measuring-cylinder", -0.72, TOP, -0.9, { rotation: [0, -0.2, 0] }),
  at("conical-flask", "conical-flask", ...FLASK_1, { rotation: [0, 0.2, 0] }),
  at("funnel", "funnel", FLASK_1[0], TOP + FUNNEL_IN_FLASK, FLASK_1[2], { rotation: [0, 1.1, 0], on: "conical-flask" }),
  at("beaker-1", "beaker", -0.3, TOP, -0.64, { rotation: [0, 0.3, 0] }),
  at("thermometer", "thermometer", -0.72, TOP, -0.62, { rotation: [0, 0.08, 0] }),
  at("stirring-rod", "stirring-rod", -0.44, TOP, -0.73, { rotation: [0, 0.02, 0] }),
  at("dropper", "dropper", -0.12, TOP, -0.9, { rotation: [0, 0.4, 0] }),

  // Hot plate with a beaker of water on it; porcelain beside it.
  at("hot-plate", "hot-plate", ...HOT_PLATE),
  at("beaker-2", "beaker", HOT_PLATE[0] + HOT_PLATE_TOP[0], HOT_PLATE[1] + HOT_PLATE_TOP[1], HOT_PLATE[2] + HOT_PLATE_TOP[2], { on: "hot-plate", rotation: [0, 0.2, 0], volumeMl: 150, ...WATER }),
  at("evaporating-dish", "evaporating-dish", 0.62, TOP, -0.9, { rotation: [0, 0.6, 0] }),
  at("watch-glass", "watch-glass", 0.62, TOP, -0.64),

  // Weighing and test tubes next to the computer.
  at("digital-scale", "digital-scale", 0.95, TOP, -0.86),
  at("ph-paper", "ph-paper", 0.95, TOP, -0.62, { rotation: [0, -0.2, 0] }),
  at("test-tube-rack", "test-tube-rack", ...RACK_1),
  at("test-tube-1", "test-tube", RACK_1[0] - 2.5 * RACK_PITCH, TOP + RACK_TUBE_Y, RACK_1[2] + RACK_HOLE_Z, { on: "test-tube-rack" }),
  at("test-tube-2", "test-tube", RACK_1[0] - 0.5 * RACK_PITCH, TOP + RACK_TUBE_Y, RACK_1[2] + RACK_HOLE_Z, { on: "test-tube-rack" }),
  at("test-tube-3", "test-tube", RACK_1[0] + 1.5 * RACK_PITCH, TOP + RACK_TUBE_Y, RACK_1[2] + RACK_HOLE_Z, { on: "test-tube-rack" }),
  at("spatula", "spatula", 1.25, TOP, -0.9, { rotation: [0, 0.1, 0] }),
];

// Reagent ledge of bench 1: liquids left to right in the order they are usually needed, labels facing the student.
const LEDGE_1 = [
  "water", "hcl", "h2so4", "hno3", "naoh", "nh3", "limewater", "h2o2", "ethanol", "phenolphthalein", "cuso4", "agno3", "fecl3", "ki",
].map((id, i) => at(`ledge-${id}`, `sub:${id}`, -1.35 + i * 0.15, LEDGE_Y, LEDGE_1_Z));
const LEDGE_1_POWDERS = ["nahco3", "kmno4", "mno2"].map((id, i) => at(`ledge-${id}`, `sub:${id}`, 0.78 + i * 0.14, LEDGE_Y, LEDGE_1_Z));

// ---- Bench 2: titration stand, crystallizing dish for sodium, gas jar and cylinders, solids on the ledge ----
const STAND_2 = [-1.0, TOP, 1.72];
const RACK_2 = [1.2, TOP, 1.62];

const bench2 = [
  at("retort-stand-2", "retort-stand", ...STAND_2),
  at("burette", "burette", ...onStand(STAND_2, BURETTE_SEAT), { on: "retort-stand-2" }),
  at("beaker-titration", "beaker", ...onStand(STAND_2, STAND_BASE), { on: "retort-stand-2", rotation: [0, 0.1, 0] }),
  at("crystallizing-dish", "crystallizing-dish", -0.42, TOP, 1.76, { volumeMl: 500, ...WATER }),
  at("gas-jar", "gas-jar", -0.08, TOP, 1.86),
  at("cylinder-o2", "sub:oxygen", 0.38, TOP, 1.86),
  at("cylinder-co2", "sub:co2", 0.6, TOP, 1.86),
  at("beaker-3", "beaker", 0.9, TOP, 1.7, { rotation: [0, -0.3, 0] }),
  at("test-tube-rack-2", "test-tube-rack", ...RACK_2),
  at("test-tube-4", "test-tube", RACK_2[0] - 1.5 * RACK_PITCH, TOP + RACK_TUBE_Y, RACK_2[2] + RACK_HOLE_Z, { on: "test-tube-rack-2" }),
  at("test-tube-5", "test-tube", RACK_2[0] + 0.5 * RACK_PITCH, TOP + RACK_TUBE_Y, RACK_2[2] + RACK_HOLE_Z, { on: "test-tube-rack-2" }),
];
const LEDGE_2_SOLIDS = ["sodium", "magnesium", "zinc", "copper", "marble"].map((id, i) => at(`ledge-${id}`, `sub:${id}`, -1.0 + i * 0.16, LEDGE_Y, LEDGE_2_Z));
const LEDGE_2_POWDERS = ["sulfur", "iron-filings", "sugar", "nacl"].map((id, i) => at(`ledge-${id}`, `sub:${id}`, 0.05 + i * 0.14, LEDGE_Y, LEDGE_2_Z));

// ---- Sink counter: clean glassware drying beside the sink ----
const sinkCounter = [
  at("beaker-clean", "beaker", 1.2, TOP, 3.66, { rotation: [0, 0.5, 0] }),
  at("flask-clean", "conical-flask", 1.45, TOP, 3.72, { rotation: [0, -0.3, 0] }),
  at("cylinder-clean", "measuring-cylinder", 1.68, TOP, 3.66),
];

// ---- Fume hood: the fuming acid and copper live here, with a dish ready ----
const fumeHood = [
  at("hood-hno3", "sub:hno3", -4.66, HOOD_TOP, -1.2),
  at("hood-copper", "sub:copper", -4.45, HOOD_TOP, -1.2),
  at("hood-dish", "evaporating-dish", -4.55, HOOD_TOP, -0.6),
];

export const BENCH_LAYOUT = [...bench1, ...LEDGE_1, ...LEDGE_1_POWDERS, ...bench2, ...LEDGE_2_SOLIDS, ...LEDGE_2_POWDERS, ...sinkCounter, ...fumeHood];

// Dev review rows (?showcase=glass-test or ?showcase=beaker,funnel): items lined up along bench_1's front edge.
const SHOWCASE_PRESETS = {
  "glass-test": [
    { id: "beaker" },
    { id: "beaker", props: { volumeMl: 150, ...WATER } },
    { id: "beaker", props: { volumeMl: 200, liquidColor: "#1f6fd1", liquidOpacity: 0.55 } },
    { id: "beaker", props: { volumeMl: 120, liquidColor: "#7a1f8f", liquidOpacity: 0.8 } },
  ],
};

export const showcaseLayout = (spec, spacing = 0.16) => {
  const entries = SHOWCASE_PRESETS[spec] ?? spec.split(",").map((id) => ({ id: id.trim() }));
  const start = 0.3 - ((entries.length - 1) * spacing) / 2;
  return entries.map((entry, i) => ({
    key: `showcase-${i}`,
    id: entry.id,
    position: [start + i * spacing, TOP, -0.72],
    rotation: [0, 0, 0],
    ...entry.props,
  }));
};
