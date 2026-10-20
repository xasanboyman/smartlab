import { SUBSTANCE_BY_ID } from "../substances/catalog";
import { CONTAINERS } from "../sim/containers";
import { mouthOf } from "../sim/anchors";
import { SUBSTANCE_PREFIX, objectType } from "../world/objectTypes";

// Tilt-driven pouring. The liquid surface stays level, so it reaches the lip once the vessel is tilted past
// tan θc = (h − l) / r (h: height to the lip, l: liquid height, r: body radius). The flow after that grows with the
// head of liquid above the lip, like water over a weir, so a nearly empty bottle has to be tipped much further.

const MAX_RATE = { bottle: 18, beaker: 30, "conical-flask": 22, "test-tube": 5, "measuring-cylinder": 12, crucible: 4, "evaporating-dish": 26, "crystallizing-dish": 40, "gas-jar": 26, "watch-glass": 8, burette: 2 };
// Hard tilt limits (rad): bottles go past horizontal, open vessels stop short so the stream still clears the rim.
const TILT_MAX = { bottle: 2.0, "test-tube": 2.0, default: 1.7 };
const HEAD_REF = 0.012;
const RAMP_IN_S = 0.35;
const RAMP_EXTRA_S = 1.3;
const EXTRA_TILT = 0.5;

const substanceOf = (typeId) =>
  typeId?.startsWith(SUBSTANCE_PREFIX) ? SUBSTANCE_BY_ID[typeId.slice(SUBSTANCE_PREFIX.length)] ?? null : null;

// Height to the lip, body radius and liquid height of the held item, in metres.
export const pourGeometry = (lab, held) => {
  const substance = substanceOf(held.typeId);
  const body = objectType(held.typeId)?.body;
  const radius = body?.shape === "cylinder" ? body.radius : 0.03;
  if (substance?.state === "liquid") {
    const mouth = mouthOf(held.typeId) ?? [0.13, 0.01];
    const remaining = lab.device(held.id)?.remaining ?? 1;
    // Bottles are mostly body: the liquid column is the fill share of the shoulder height (~0.62 of the lip height).
    const shoulder = mouth[0] * 0.62;
    return { kind: "bottle", h: mouth[0], r: radius, l: shoulder * remaining * ((substance.container.fillMl ?? 200) / (substance.container.sizeMl ?? 250)), mouthR: mouth[1] };
  }
  const params = CONTAINERS[held.typeId];
  const mixture = lab.mixture(held.id);
  if (!params || !mixture) return null;
  const fill = Math.min(1, mixture.volumeMl / params.capacityMl);
  return { kind: held.typeId, h: params.mouthY, r: radius, l: params.mouthY * fill, mouthR: params.mouthR };
};

export const criticalTilt = ({ h, r, l }) => Math.atan2(Math.max(0, h - l), Math.max(0.004, r));

export const maxTilt = (kind) => TILT_MAX[kind] ?? TILT_MAX.default;

// The tilt the hand reaches after holding for `holdS`: it swings to the critical angle first, then keeps going.
export const pourTilt = (geometry, holdS) => {
  if (!geometry) return Math.min(1, holdS / 0.45) * 1.65;
  const critical = Math.min(criticalTilt(geometry), maxTilt(geometry.kind) - 0.05);
  if (holdS < RAMP_IN_S) return (holdS / RAMP_IN_S) * critical;
  const extra = Math.min(1, (holdS - RAMP_IN_S) / RAMP_EXTRA_S);
  // Ease-in so the stream starts as a trickle and thickens.
  return Math.min(maxTilt(geometry.kind), critical + extra * extra * EXTRA_TILT);
};

// Flow in ml/s at this tilt: zero until the surface reaches the lip, then weir-like with the head above it.
export const pourRateAt = (geometry, tilt) => {
  if (!geometry) return 0;
  const head = geometry.l + geometry.r * Math.tan(Math.min(tilt, 1.52)) - geometry.h;
  if (tilt >= 1.52) return MAX_RATE[geometry.kind] ?? 18;
  if (head <= 0) return 0;
  const max = MAX_RATE[geometry.kind] ?? 18;
  return max * Math.min(1, Math.sqrt(head / HEAD_REF));
};

export const pourMaxRate = (kind) => MAX_RATE[kind] ?? 18;
