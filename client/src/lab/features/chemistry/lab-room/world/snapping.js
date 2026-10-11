import { Euler, Quaternion, Vector3 } from "three";

const VESSELS = new Set(["beaker", "conical-flask", "evaporating-dish", "crucible", "crystallizing-dish", "gas-jar", "watch-glass", "wire-gauze"]);
const RACK_HOLES = Array.from({ length: 6 }, (_, i) => [(i - 2.5) * 0.028, 0.009, 0.012]);
const SNAP_REACH = 0.12;

// Resting points in each support's model space; a support not listed here takes items anywhere on its top.
const SNAPS = {
  "hot-plate": { accepts: () => true, points: () => [[0, 0.11, -0.056]] },
  "digital-scale": { accepts: () => true, points: () => [[0, 0.053, -0.035]] },
  "wire-gauze": { accepts: (typeId) => VESSELS.has(typeId), points: () => [[0, 0.004, 0]] },
  "retort-stand": {
    accepts: (typeId) => typeId === "spirit-lamp" || typeId === "bunsen-burner" || typeId === "burette" || VESSELS.has(typeId),
    points: (typeId) => {
      if (typeId === "spirit-lamp" || typeId === "bunsen-burner") return [[0.013, 0.014, 0.03]];
      if (typeId === "burette") return [[0.013, 0.28, 0.03]];
      // Ring height and stand base height (for titration receiving flask)
      return [[0.013, 0.2186, 0.03], [0.013, 0.014, 0.03]];
    },
  },
  burette: {
    accepts: (typeId) => typeId === "funnel",
    points: () => [[0, 0.44, 0]],
    mouth: true,
  },
  "test-tube-rack": { accepts: (typeId) => typeId === "test-tube", points: () => RACK_HOLES },
  // A funnel rests with its cone on the rim or its stem in the neck; its stem overlaps the vessel by design.
  beaker: {
    accepts: (typeId) => typeId === "funnel" || typeId === "watch-glass" || typeId === "thermometer",
    points: (typeId) => (typeId === "watch-glass" ? [[0, 0.095, 0]] : typeId === "thermometer" ? [[0.01, 0.01, 0]] : [[0, -0.034, 0]]),
    mouth: true,
  },
  "conical-flask": {
    accepts: (typeId) => typeId === "funnel" || typeId === "thermometer",
    points: (typeId) => (typeId === "thermometer" ? [[0.005, 0.01, 0]] : [[0, 0.05, 0]]),
    mouth: true,
  },
  "test-tube": { accepts: (typeId) => typeId === "funnel", points: () => [[0, 0.11, 0]], mouth: true },
  "measuring-cylinder": { accepts: (typeId) => typeId === "funnel", points: () => [[0, 0.172, 0]], mouth: true },
};

const tmpEuler = new Euler();
const tmpQuat = new Quaternion();

// Candidate base points (world, nearest first) for placing `typeId` on `support`; [] means it can't go there.
// Snapped items always stand upright (a test tube in a rack, a funnel in a flask).
export const snapCandidates = (support, typeId, hitPoint) => {
  const snap = support ? SNAPS[support.typeId] : null;
  if (!snap) return [{ point: hitPoint, upright: false }];
  if (!snap.accepts(typeId)) return [];
  tmpQuat.setFromEuler(tmpEuler.set(...support.rotation));
  return snap
    .points(typeId)
    .map((local) => new Vector3(...local).applyQuaternion(tmpQuat).add(new Vector3(...support.position)))
    .map((point) => ({ point, distance: Math.hypot(point.x - hitPoint.x, point.z - hitPoint.z) }))
    .filter(({ distance }) => distance <= SNAP_REACH)
    .sort((a, b) => a.distance - b.distance)
    .map(({ point }) => ({ point, upright: true, mouth: Boolean(snap.mouth) }));
};
