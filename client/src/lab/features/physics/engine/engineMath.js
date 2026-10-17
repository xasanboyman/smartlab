// theta ∈ [0, 4π) is cylinder 1's crank angle, 0 = TDC before intake.
// Inline-4: crank axis is +x (front / timing end at +x), exhaust side +z, intake side -z.

export const TAU = Math.PI * 2;
export const CYCLE = Math.PI * 4;
export const DEG = Math.PI / 180;

export const GEOM = {
  crankRadius: 0.34,
  rodLength: 1.2,
  boreRadius: 0.42,
  cylSpacing: 1.1,
  pinToCrown: 0.2,
  pistonHeight: 0.5,
  deckY: 1.78,
  chamberDepth: 0.12,
  linerBottomY: 0.5,
  blockHalfX: 2.3,
  blockHalfZ: 0.88,
  blockBottomY: -0.15,
  panBottomY: -0.86,
  headTopY: 2.52,
  headHalfZ: 0.88,
  coverTopY: 3.0,
  coverHalfZ: 0.7,
  valveTilt: 0.28,
  valveOffsetZ: 0.17,
  valvePairDX: 0.19,
  valveHeadRadius: 0.125,
  valveStemLength: 0.6,
  valveMaxLift: 0.12,
  bucketHeight: 0.08,
  rollerRadius: 0.03,
  camBaseRadius: 0.12,
  crankSprocketRadius: 0.17,
  camSprocketRadius: 0.34,
  chainX: 2.52,
  pulleyX: 2.72,
  flywheelX: -2.5,
  sparkPlugBaseY: 1.9,
  sparkPlugTopY: 3.5,
  floorY: -0.9,
};

export const STROKES = ["intake", "compression", "power", "exhaust"];

export const GAS_COLORS = {
  mixture: "#3b82f6",
  flame: "#ff7a1a",
  exhaust: "#8b93a1",
};

// Cylinder 1 is at the front (+x). Crank throws 0°/180°/180°/0°, firing order 1-3-4-2.
export const CYLINDER_X = [1.5, 0.5, -0.5, -1.5].map((k) => k * GEOM.cylSpacing);
export const CYLINDER_PHASE = [0, Math.PI, 3 * Math.PI, 2 * Math.PI];
export const CYLINDERS = CYLINDER_X.map((x, i) => ({ index: i, x, phase: CYLINDER_PHASE[i] }));
// Main bearings / head bolt columns sit between and outside the bores.
export const MAIN_X = [-2, -1, 0, 1, 2].map((k) => k * GEOM.cylSpacing);
export const HEAD_BOLT_XZ = MAIN_X.flatMap((x) => {
  const bx = Math.max(-2.12, Math.min(2.12, x));
  return [
    [bx, 0.78],
    [bx, -0.78],
  ];
});

export const normTheta = (t) => ((t % CYCLE) + CYCLE) % CYCLE;
export const cylinderTheta = (theta, i) => theta + CYLINDER_PHASE[i];

// Crank pin in the yz-plane; the crank turns about +x so rotation.x = theta puts the pin here.
export const crankPinYZ = (theta) => ({
  y: GEOM.crankRadius * Math.cos(theta),
  z: GEOM.crankRadius * Math.sin(theta),
});

// Wrist-pin height above the crank axis (exact slider-crank).
export const pistonPinY = (theta) => {
  const { crankRadius: r, rodLength: l } = GEOM;
  const s = Math.sin(theta);
  return r * Math.cos(theta) + Math.sqrt(l * l - r * r * s * s);
};

export const PIN_Y_TDC = GEOM.crankRadius + GEOM.rodLength;
export const PIN_Y_BDC = GEOM.rodLength - GEOM.crankRadius;

export const pistonCrownY = (theta) => pistonPinY(theta) + GEOM.pinToCrown;

// 0 at TDC, 1 at BDC.
export const pistonTravel = (theta) =>
  (PIN_Y_TDC - pistonPinY(theta)) / (PIN_Y_TDC - PIN_Y_BDC);

// Rod sits on the crank pin; rotation.x that points its local +y at the wrist pin.
export const rodAngleX = (theta) => {
  const p = crankPinYZ(theta);
  return Math.atan2(-p.z, pistonPinY(theta) - p.y);
};

export const strokeIndex = (theta) => Math.min(3, Math.floor(normTheta(theta) / Math.PI));
export const strokeProgress = (theta) => (normTheta(theta) % Math.PI) / Math.PI;

export const crankRotationX = (theta) => theta;
// Camshafts are chain-driven at half crank speed, same sense as the crank.
export const camRotationX = (theta) => theta / 2;

const valveDef = (which, side, peakDeg) => {
  const {
    valveTilt,
    valveOffsetZ,
    deckY,
    chamberDepth,
    valveStemLength,
    bucketHeight,
    rollerRadius,
    camBaseRadius,
  } = GEOM;
  const dir = { y: Math.cos(valveTilt), z: side * Math.sin(valveTilt) };
  const headClosed = { y: deckY + chamberDepth - 0.01, z: side * valveOffsetZ };
  const stemTop = {
    y: headClosed.y + dir.y * valveStemLength,
    z: headClosed.z + dir.z * valveStemLength,
  };
  const followerLen = bucketHeight + 2 * rollerRadius + camBaseRadius;
  const camCenter = { y: stemTop.y + dir.y * followerLen, z: stemTop.z + dir.z * followerLen };
  const peak = peakDeg * DEG;
  // Lobe local angle (from +y toward +z) that faces the valve at theta is towardValve - theta/2.
  const towardValve = Math.atan2(-dir.z, -dir.y);
  return {
    which,
    side,
    peak,
    width: 170 * DEG,
    dir,
    tiltX: side * valveTilt,
    headClosed,
    stemTop,
    camCenter,
    lobeAngle: towardValve - peak / 2,
  };
};

export const VALVES = {
  intake: valveDef("intake", -1, 90),
  exhaust: valveDef("exhaust", 1, 630),
};

const wrapCycle = (d) => {
  const x = (((d + CYCLE / 2) % CYCLE) + CYCLE) % CYCLE;
  return x - CYCLE / 2;
};

export const valveLift = (theta, which) => {
  const v = VALVES[which];
  const d = wrapCycle(normTheta(theta) - v.peak);
  if (Math.abs(d) >= v.width / 2) return 0;
  const c = Math.cos((Math.PI * d) / v.width);
  return GEOM.valveMaxLift * c * c;
};

export const isValveOpen = (theta, which) =>
  valveLift(theta, which) > GEOM.valveMaxLift * 0.15;

// Contact offset from the lobe nose is (theta - peak) / 2, so this matches valveLift for a point follower.
export const camProfileRadius = (a, which) => {
  const v = VALVES[which];
  let delta = (((a - v.lobeAngle) % TAU) + TAU) % TAU;
  if (delta > Math.PI) delta -= TAU;
  const d = delta * 2;
  let lift = 0;
  if (Math.abs(d) < v.width / 2) {
    const c = Math.cos((Math.PI * d) / v.width);
    lift = GEOM.valveMaxLift * c * c;
  }
  return GEOM.camBaseRadius + lift;
};

export const SPARK_ANGLE = TAU - 3 * DEG;

export const sparkIntensity = (theta) => {
  const d = wrapCycle(normTheta(theta) - SPARK_ANGLE) / (4 * DEG);
  return Math.abs(d) > 4 ? 0 : Math.exp(-d * d);
};

const setGas = (out, fill, kind, heat) => {
  out.fill = fill;
  out.kind = kind;
  out.heat = heat;
  return out;
};

// fill 0..1 (visibility), kind 0 mixture / 1 flame / 2 exhaust, heat 0..1; writes into `out` so frame loops don't allocate.
export const gasStateInto = (theta, out) => {
  const t = normTheta(theta);
  const i = strokeIndex(t);
  const p = strokeProgress(t);
  if (t >= SPARK_ANGLE && i === 1) return setGas(out, 1, 1, 1);
  if (i === 0) return setGas(out, 0.25 + 0.5 * p, 0, 0);
  if (i === 1) return setGas(out, 0.75 + 0.2 * p, 0, 0.2 * p);
  if (i === 2) return setGas(out, 1, 1, 1 - 0.65 * p);
  return setGas(out, 0.8 - 0.65 * p, 2, 0.3 * (1 - p));
};

export const gasState = (theta) => gasStateInto(theta, { fill: 0, kind: 0, heat: 0 });

// True when angle (mod 4π) is passed while moving prev -> next (next >= prev, unwrapped).
export const crossed = (prev, next, angle) => {
  const k = Math.ceil((prev - angle) / CYCLE);
  const a = angle + k * CYCLE;
  return a > prev && a <= next;
};

export const rpmToRadPerSec = (rpm) => (rpm / 60) * TAU;

// Intake plenum runs along x behind the head; runners drop into the ports on the -z face.
export const PLENUM = { y: 2.58, z: -1.42, radius: 0.26 };
export const intakeRunnerPoints = (x) => [
  [x, PLENUM.y, PLENUM.z],
  [x, 2.52, -1.2],
  [x, 2.34, -1.0],
  [x, 2.22, -GEOM.headHalfZ],
  [x, 2.12, -0.55],
  [x, 1.98, -0.3],
];

// Exhaust primaries leave the +z face and merge 4-into-1 under the manifold.
export const COLLECTOR = { x: -0.3, y: 0.55, z: 1.22 };
export const exhaustPrimaryPoints = (x) => [
  [x, 1.98, 0.3],
  [x, 2.08, 0.55],
  [x, 2.12, GEOM.headHalfZ],
  [x, 2.1, 1.12],
  [x * 0.88 + COLLECTOR.x * 0.12, 1.7, 1.34],
  [x * 0.5 + COLLECTOR.x * 0.5, 1.15, 1.32],
  [x * 0.12 + COLLECTOR.x * 0.88, 0.78, 1.24],
  [COLLECTOR.x, COLLECTOR.y, COLLECTOR.z],
];
export const DOWNPIPE_POINTS = [
  [COLLECTOR.x, COLLECTOR.y, COLLECTOR.z],
  [COLLECTOR.x, 0.05, 1.3],
  [COLLECTOR.x - 0.05, -0.35, 1.7],
  [COLLECTOR.x - 0.1, -0.45, 2.3],
];
export const INTAKE_PIPE_RADIUS = 0.12;
export const EXHAUST_PIPE_RADIUS = 0.135;

// Assembled engine spans roughly y ∈ [-0.9, 3.5]; shift it so the orbit target is its middle.
export const ENGINE_CENTER_Y = 1.25;
