import { EQUIPMENT_BY_ID } from "../equipment/catalog";
import { SUBSTANCE_BY_ID } from "../substances/catalog";
import { EMPTY_MASS_G } from "../sim/containers";

export const SUBSTANCE_PREFIX = "sub:";

// How each material behaves when it lands: bounce, grip, the impact speed (m/s) that cracks it and that breaks
// it, and the sound it makes. Glass let go over the bench (~3.2 m/s) cracks; over the floor (~5 m/s) it shatters.
export const PHYSICS_MATERIALS = {
  glass: { restitution: 0.14, friction: 0.42, crack: 2.0, shatter: 3.5, sound: "clink" },
  "thin-glass": { restitution: 0.12, friction: 0.42, crack: 1.6, shatter: 2.7, sound: "clink" },
  porcelain: { restitution: 0.1, friction: 0.55, crack: 2.6, shatter: 3.9, sound: "clink" },
  plastic: { restitution: 0.38, friction: 0.5, crack: Infinity, shatter: Infinity, sound: "plastic" },
  metal: { restitution: 0.22, friction: 0.4, crack: Infinity, shatter: Infinity, sound: "clank" },
  wood: { restitution: 0.28, friction: 0.6, crack: Infinity, shatter: Infinity, sound: "thud" },
  paper: { restitution: 0.05, friction: 0.7, crack: Infinity, shatter: Infinity, sound: "thud" },
};

const EQUIPMENT_MATERIAL = {
  "test-tube": "thin-glass",
  "stirring-rod": "thin-glass",
  thermometer: "thin-glass",
  dropper: "thin-glass",
  spatula: "metal",
  "crucible-tongs": "metal",
  "bunsen-burner": "metal",
  "retort-stand": "metal",
  "wire-gauze": "metal",
  "digital-scale": "plastic",
  "ph-paper": "paper",
  "hot-plate": "plastic",
  "test-tube-rack": "wood",
};

// Mass in kg for the rigid body; contents are added by the world when it drops.
const MASS_KG = { "hot-plate": 2.8, "retort-stand": 1.6, "digital-scale": 0.9, "bunsen-burner": 0.45, "test-tube-rack": 0.25, "spirit-lamp": 0.18, extinguisher: 5 };

// Physical proxies in model space (origin at the base). Cylinders stand on y = 0; boxes give size + center.
const EQUIPMENT_BODIES = {
  beaker: { shape: "cylinder", radius: 0.036, height: 0.095, breaks: "glass", support: true },
  "conical-flask": { shape: "cylinder", radius: 0.0425, height: 0.145, breaks: "glass", support: true },
  "test-tube": { shape: "cylinder", radius: 0.01, height: 0.18, breaks: "glass", lying: true, support: true },
  "measuring-cylinder": { shape: "cylinder", radius: 0.042, height: 0.25, breaks: "glass", support: true },
  "evaporating-dish": { shape: "cylinder", radius: 0.05, height: 0.045, breaks: "porcelain" },
  crucible: { shape: "cylinder", radius: 0.021, height: 0.047, breaks: "porcelain" },
  "crystallizing-dish": { shape: "cylinder", radius: 0.076, height: 0.0765, breaks: "glass" },
  "gas-jar": { shape: "cylinder", radius: 0.0375, height: 0.204, breaks: "glass" },
  "watch-glass": { shape: "cylinder", radius: 0.045, height: 0.015, breaks: "glass", support: true },
  dropper: { shape: "box", size: [0.118, 0.017, 0.017], center: [0, 0.0085, 0], breaks: "glass" },
  burette: { shape: "cylinder", radius: 0.012, height: 0.55, breaks: "glass", support: true },
  spatula: { shape: "box", size: [0.18, 0.006, 0.012], center: [0, 0.003, 0] },
  "crucible-tongs": { shape: "box", size: [0.234, 0.008, 0.04], center: [0, 0.004, 0] },
  "stirring-rod": { shape: "box", size: [0.2, 0.0066, 0.0066], center: [0, 0.0033, 0], breaks: "glass" },
  funnel: { shape: "cylinder", radius: 0.0375, height: 0.133, breaks: "glass", lying: true },
  thermometer: { shape: "box", size: [0.3, 0.006, 0.008], center: [0, 0.003, 0], breaks: "glass" },
  "digital-scale": { shape: "box", size: [0.13, 0.053, 0.19], center: [0, 0.0265, 0], support: true, heavy: true },
  "ph-paper": { shape: "box", size: [0.06, 0.042, 0.035], center: [0, 0.021, 0] },
  "spirit-lamp": { shape: "cylinder", radius: 0.038, height: 0.1145, breaks: "glass" },
  "bunsen-burner": { shape: "cylinder", radius: 0.045, height: 0.16, heavy: true },
  "hot-plate": { shape: "box", size: [0.16, 0.11, 0.28], center: [0, 0.055, 0], support: true, heavy: true },
  "wire-gauze": { shape: "box", size: [0.12, 0.004, 0.12], center: [0, 0.002, 0], support: true },
  "retort-stand": {
    shape: "compound",
    parts: [
      { size: [0.13, 0.014, 0.2], center: [0, 0.007, 0] },
      { size: [0.012, 0.6, 0.012], center: [0, 0.31, -0.068] },
      // Ring with wire gauze: vessels stand on it above the lamp.
      { size: [0.085, 0.004, 0.085], center: [0.013, 0.2166, 0.03] },
    ],
    support: true,
    heavy: true,
  },
  "test-tube-rack": { shape: "box", size: [0.2, 0.11, 0.07], center: [0, 0.055, 0], support: true },
};

// Footprint radius, height with the cap on and nominal volume, as measured on the substance templates.
const BOTTLES = { narrow: [0.035, 0.1438, 250], dropper: [0.024, 0.1235, 100], hdpe: [0.031, 0.1372, 250] };

const substanceBody = (substance) => {
  const c = substance.container;
  if (substance.state === "liquid") {
    const kind = c.bottle === "plastic" ? "hdpe" : c.sizeMl <= 100 ? "dropper" : "narrow";
    const [radius, height, nominalMl] = BOTTLES[kind];
    const scale = Math.cbrt(c.sizeMl / nominalMl);
    return { shape: "cylinder", radius: radius * scale, height: height * scale, breaks: kind === "hdpe" ? null : "glass" };
  }
  if (substance.state === "powder") {
    return { shape: "cylinder", radius: 0.0275, height: 0.0792, breaks: c.jar === "plastic" ? null : "glass" };
  }
  if (substance.state === "solid") {
    return { shape: "cylinder", radius: 0.035, height: 0.0902, breaks: c.jar === "plastic" ? null : "glass" };
  }
  return { shape: "cylinder", radius: 0.033, height: 0.442, breaks: null };
};

// Wall fittings the player takes off their bracket instead of out of the cabinet.
export const FIXTURES = {
  extinguisher: { name: "O't o'chirgich", body: { shape: "cylinder", radius: 0.078, height: 0.53, heavy: true } },
};

const materialOf = (typeId, body, substance = null) => {
  if (substance) {
    if (substance.state === "gas") return "metal";
    if (body.breaks === "glass") return "glass";
    return "plastic";
  }
  if (EQUIPMENT_MATERIAL[typeId]) return EQUIPMENT_MATERIAL[typeId];
  if (body.breaks === "porcelain") return "porcelain";
  return body.breaks === "glass" ? "glass" : "plastic";
};

const massOf = (typeId, substance = null) => {
  if (substance) {
    if (substance.state === "gas") return 2.4;
    if (substance.state === "liquid") return 0.16 + (substance.container.fillMl ?? 200) / 1000;
    return substance.state === "solid" ? 0.26 : 0.17;
  }
  return MASS_KG[typeId] ?? (EMPTY_MASS_G[typeId] ?? 100) / 1000;
};

const cache = new Map();

export const objectType = (typeId) => {
  if (cache.has(typeId)) return cache.get(typeId);
  let type = null;
  if (typeId.startsWith(SUBSTANCE_PREFIX)) {
    const substance = SUBSTANCE_BY_ID[typeId.slice(SUBSTANCE_PREFIX.length)];
    if (substance) {
      const body = substanceBody(substance);
      type = { kind: "substance", name: substance.name, substance, body, material: materialOf(typeId, body, substance), mass: massOf(typeId, substance) };
    }
  } else if (EQUIPMENT_BY_ID[typeId]) {
    const body = EQUIPMENT_BODIES[typeId];
    type = { kind: "equipment", name: EQUIPMENT_BY_ID[typeId].name, body, material: materialOf(typeId, body), mass: massOf(typeId) };
  } else if (FIXTURES[typeId]) {
    type = { kind: "fixture", name: FIXTURES[typeId].name, body: FIXTURES[typeId].body, material: "metal", mass: massOf(typeId) };
  }
  cache.set(typeId, type);
  return type;
};

// Rigid-body tuning for a type: material response plus its mass.
export const physicsOf = (typeId) => {
  const type = objectType(typeId);
  const material = PHYSICS_MATERIALS[type?.material] ?? PHYSICS_MATERIALS.plastic;
  return { ...material, material: type?.material ?? "plastic", mass: type?.mass ?? 0.1, breaks: type?.body.breaks ?? null };
};

// Half extents of the body's bounding box in model space, plus its center.
export const bodyBounds = (body) => {
  if (body.shape === "cylinder") {
    return { half: [body.radius, body.height / 2, body.radius], center: [0, body.height / 2, 0] };
  }
  const parts = body.shape === "box" ? [body] : body.parts;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < 3; i += 1) {
      min[i] = Math.min(min[i], part.center[i] - part.size[i] / 2);
      max[i] = Math.max(max[i], part.center[i] + part.size[i] / 2);
    }
  }
  return {
    half: max.map((v, i) => (v - min[i]) / 2),
    center: max.map((v, i) => (v + min[i]) / 2),
  };
};
