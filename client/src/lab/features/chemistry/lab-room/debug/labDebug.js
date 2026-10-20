import { EYE_HEIGHT, lookAngles } from "../scene/playerMath";
import { objectType } from "../world/objectTypes";
import { mouthOf } from "../sim/anchors";

const DEG = Math.PI / 180;

// Camera presets for review screenshots (?debug=1&pose=bench). x/z are feet, yaw 0 looks toward -Z.
export const POSE_PRESETS = {
  spawn: null,
  bench: { x: 0.1, z: 0.05, yaw: 0, pitch: -0.42 },
  "bench-left": { x: -0.9, z: -0.05, yaw: 0.25, pitch: -0.45 },
  "bench-right": { x: 1.0, z: 0.0, yaw: -0.2, pitch: -0.45 },
  heating: { x: -1.15, z: -0.1, yaw: 0, pitch: -0.5 },
  shelf: { x: -0.2, z: -0.25, yaw: 0, pitch: -0.12 },
  overview: { x: 0.3, z: 2.7, yaw: 0, pitch: -0.18 },
  bench2: { x: 0.3, z: 2.55, yaw: 0, pitch: -0.5 },
  sink: { x: 0.6, z: 2.95, yaw: Math.PI, pitch: -0.3 },
  cabinet: { x: -2.8, z: 2.5, yaw: Math.PI, pitch: 0.02 },
  hood: { x: -3.5, z: -0.85, yaw: Math.PI / 2, pitch: -0.12 },
  safety: { x: -3.7, z: 2.7, yaw: 2.55, pitch: 0.1 },
  door: { x: -3.6, z: 1.6, yaw: 1.9, pitch: 0 },
  floor: { x: 0.3, z: 0.2, yaw: 0, pitch: -0.9 },
};

// ?pose=name or ?pose=x,z,yawDeg,pitchDeg
export const parsePose = (text) => {
  if (!text) return null;
  if (text in POSE_PRESETS) return POSE_PRESETS[text];
  const parts = text.split(",").map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite)) {
    return { x: parts[0], z: parts[1], yaw: parts[2] * DEG, pitch: parts[3] * DEG };
  }
  return null;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// window.__lab: scripted interactions for headless review (no pointer lock needed, see ?debug=1&autostart=1).
export const createDebugHandle = ({ world, lab, inputRef, teleportRef, poseRef, phaseRef, modeRef, actions, settings }) => {
  const input = () => inputRef.current;
  const teleport = (pose) => {
    teleportRef.current = { token: teleportRef.current.token + 1, pose };
    return pose;
  };

  const objects = () =>
    world.store.get().objects.map((o) => ({ id: o.id, typeId: o.typeId, state: o.state, position: o.position.map((v) => Math.round(v * 1000) / 1000), supportId: o.supportId }));

  const find = (typeId, index = 0) => {
    const list = world.store.get().objects.filter((o) => o.typeId === typeId && o.state !== "held");
    return list[index]?.id ?? null;
  };

  const resolve = (ref) => (ref && world.get(ref) ? ref : find(ref));

  // Stand on the student side of an object and look at its mouth (or its base).
  const aimObject = (ref, { standOff = 0.55, mouth = true, side = null, eye = EYE_HEIGHT } = {}) => {
    const id = resolve(ref);
    const object = id ? world.get(id) : null;
    if (!object) return null;
    const [x, y, z] = object.position;
    const mouthY = mouth ? (mouthOf(object.typeId)?.[0] ?? 0.05) : 0.02;
    const dir = side ?? (z > 3 ? -1 : 1);
    const from = [x, eye, z + dir * standOff];
    const angles = lookAngles(from, [x, y + mouthY, z]);
    return teleport({ x: from[0], z: from[2], yaw: angles.yaw, pitch: angles.pitch });
  };

  const aimPoint = (point, { standOff = 0.6, side = 1, eye = EYE_HEIGHT } = {}) => {
    const from = [point[0], eye, point[2] + side * standOff];
    const angles = lookAngles(from, point);
    return teleport({ x: from[0], z: from[2], yaw: angles.yaw, pitch: angles.pitch });
  };

  const click = () => {
    input().events.push({ type: "primary" });
  };

  // Hold the primary button for `ms` (pour, heat, stir).
  const press = async (ms = 1500) => {
    input().events.push({ type: "primary" });
    input().primaryDown = true;
    await wait(ms);
    input().primaryDown = false;
  };

  const drop = () => input().events.push({ type: "drop" });
  const slot = (index) => input().events.push({ type: "slot", slot: index });

  const pick = (ref) => {
    const id = resolve(ref);
    if (!id) return { ok: false, reason: "missing" };
    return world.take(id);
  };

  // Hold keys for `ms` (walking: KeyW/KeyA/KeyS/KeyD, ShiftLeft).
  const keys = async (codes, ms = 500) => {
    for (const code of codes) input().keys.add(code);
    await wait(ms);
    for (const code of codes) input().keys.delete(code);
  };

  const state = () => ({
    phase: phaseRef.current,
    mode: modeRef.current,
    pose: poseRef.current,
    prompt: world.hud.get().prompt,
    flash: world.hud.get().flash,
    held: world.activeObject(),
    hotbar: world.store.get().hotbar,
    activity: Object.fromEntries(Object.entries(lab.activity).filter(([k]) => !["heldPositions", "cameraPosition", "cameraDirection", "aim", "action"].includes(k))),
    feed: lab.feed.get().items.map((i) => i.kind + ":" + (i.id ?? i.text ?? "")),
    puddles: lab.hazards.puddles.map((p) => ({ ml: Math.round(p.ml), at: p.position.map((v) => Math.round(v * 100) / 100), burning: p.burning })),
    bursts: world.store.get().bursts.length,
    journal: lab.journal?.get().entries.slice(-5),
  });

  const mixture = (ref) => {
    const id = resolve(ref);
    const m = id ? lab.mixture(id) : null;
    if (!m) return null;
    return { volumeMl: m.volumeMl, tempC: m.tempC, aq: m.aq, solids: m.solids.map((s) => `${s.species}:${s.mmol.toFixed(2)}`), history: m.history.map((h) => `${h.amount}${h.unit} ${h.label}`) };
  };

  return {
    world,
    lab,
    presets: POSE_PRESETS,
    teleport,
    pose: (name) => teleport(POSE_PRESETS[name] ?? parsePose(name)),
    aimObject,
    aimPoint,
    objects,
    find,
    pick,
    click,
    press,
    drop,
    slot,
    keys,
    state,
    mixture,
    device: (ref) => lab.device(resolve(ref)),
    setDevice: (ref, patch) => lab.setDevice(resolve(ref), patch),
    wait,
    actions,
    settings,
    goggles: (on) => settings?.set?.("goggles", on),
  };
};
