import { SUBSTANCE_BY_ID } from "../substances/catalog";
import { SPECIES } from "../chemistry/species";
import { SOURCES, SPATULA_G } from "../chemistry/sources";
import {
  EPS,
  addGasMl,
  addPiece,
  addPowder,
  aq,
  clearMixture,
  createMixture,
  mixIn,
  nitricFraction,
  reagentPortion,
  sulfuricFraction,
  takePortion,
} from "../chemistry/mixture";
import { phOf, phPaperColor, phWord } from "../chemistry/acidity";
import { CONTAINERS } from "../sim/containers";
import { spillPortion } from "../sim/spills";
import { pushFeed, warnOnce } from "../sim/feed";
import { pushSound } from "../sound/queue";
import { SUBSTANCE_PREFIX } from "../world/objectTypes";
import { displayName } from "../world/prompts";
import { logJournal } from "../sim/journal";
import { pourGeometry, pourMaxRate, pourRateAt, pourTilt } from "./pourPhysics";

const DROP_ML = 0.05;
const DROP_EVERY_S = 0.22;
const GAS_ML_PER_S = 25;
const JAR_GRAMS = { powder: 100, ribbon: 25, chunks: 50, wire: 100, granules: 250 };
const HOT_PLATE_STEPS = ["O'chiq", "50 °C", "100 °C", "200 °C", "300 °C"];

const substanceOf = (typeId) =>
  typeId?.startsWith(SUBSTANCE_PREFIX) ? SUBSTANCE_BY_ID[typeId.slice(SUBSTANCE_PREFIX.length)] ?? null : null;
export const isVessel = (typeId) => Boolean(CONTAINERS[typeId]) && (CONTAINERS[typeId].capacityMl ?? 0) > 0;

const liquidMl = (lab, object) => {
  const substance = substanceOf(object.typeId);
  if (substance?.state === "liquid") {
    const { fillMl } = substance.container;
    return fillMl * (lab.device(object.id)?.remaining ?? 1);
  }
  return isVessel(object.typeId) ? lab.mixture(object.id)?.volumeMl ?? 0 : 0;
};

const streamLook = (lab, object) => {
  const substance = substanceOf(object.typeId);
  if (substance) return { color: substance.container.color ?? "#0d2230", opacity: substance.container.opacity ?? 0.08 };
  const liquid = lab.visual(object.id)?.liquid;
  return liquid
    ? { color: liquid.turbidity > 0.3 ? liquid.turbidColor : liquid.color, opacity: Math.max(liquid.opacity, liquid.turbidity) }
    : { color: "#0d2230", opacity: 0.08 };
};

// Part of a device under the crosshair, from the hit point in the object's local space.
export const partAt = (typeId, local) => {
  if (!local) return null;
  const [x, y, z] = local;
  if (typeId === "hot-plate") {
    // The plate sits at the back (z < 0.01); everything in front of it is the sloped control panel.
    if (z > 0.02) return x < 0 ? "heat-knob" : "stir-knob";
    return "plate";
  }
  if (typeId === "gas-jar") return y > 0.19 ? "cover" : "body";
  if (typeId === "digital-scale") return z > 0.02 ? "panel" : "pan";
  if (typeId === "spirit-lamp") return "lamp";
  if (typeId === "bunsen-burner") return y < 0.04 ? "collar" : "burner";
  if (typeId === "burette") return y < 0.08 ? "stopcock" : "barrel";
  return null;
};

const click = (id, label, targetId, extra = {}) => ({ id, label, mode: "click", targetId, valid: true, ...extra });
const hold = (id, label, targetId, extra = {}) => ({ id, label, mode: "hold", targetId, valid: true, ...extra });
const blocked = (id, reason, targetId) => ({ id, label: reason, mode: "click", targetId, valid: false });

// Reaching for the lamp with something in hand should still light it; without this the flame actions
// are a dead end ("light the lamp first" with no way to light it).
const lampToggle = (lab, lamp) => {
  const lit = lab.device(lamp.id)?.lit;
  if (!lit && lamp.typeId === "bunsen-burner" && lab.utilityState?.gasOpen === false) {
    return blocked("lamp-toggle", "Gaz magistrali yopiq! (Kranni oching)", lamp.id);
  }
  return click("lamp-toggle", lit ? "O'chirish" : "Yoqish", lamp.id);
};

const deviceAction = (lab, target, part) => {
  const device = lab.device(target.id);
  if (!device) return null;
  if (target.typeId === "spirit-lamp") return click("lamp-toggle", device.lit ? "O'chirish" : "Yoqish", target.id);
  if (target.typeId === "bunsen-burner") {
    if (part === "collar") {
      const airOpen = !(device.airOpen ?? true);
      return click("bunsen-air", airOpen ? "Havo darchasini ochish (Moviy alanga)" : "Havo darchasini yopish (Sariq alanga)", target.id);
    }
    const gasOpen = lab.utilityState?.gasOpen ?? true;
    if (!device.lit && !gasOpen) {
      return blocked("lamp-toggle", "Gaz magistrali yopiq! (Kranni oching)", target.id);
    }
    return click("lamp-toggle", device.lit ? "O'chirish" : "Yoqish", target.id);
  }
  if (target.typeId === "burette" && part === "stopcock") {
    return hold("burette-titrate", "Byuretkadan tomizish", target.id);
  }
  if (target.typeId === "hot-plate" && part === "heat-knob") {
    return click("hotplate-heat", `Harorat: ${HOT_PLATE_STEPS[(device.level + 1) % HOT_PLATE_STEPS.length]}`, target.id);
  }
  if (target.typeId === "hot-plate" && part === "stir-knob") {
    return click("hotplate-stir", device.stir ? "Aralashtirgichni o'chirish" : "Aralashtirgichni yoqish", target.id);
  }
  if (target.typeId === "gas-jar" && part === "cover") {
    return click("cover-toggle", device.coverOn ? "Qopqoqni ochish" : "Qopqoqni yopish", target.id);
  }
  if (target.typeId === "digital-scale" && part === "panel") return click("scale-tare", "Nolga keltirish (Tara)", target.id);
  return null;
};

// What left click does right now for the held item and the object under the crosshair (null = take / put down).
export const resolveAction = ({ lab, world, held, focus }) => {
  // The extinguisher sprays wherever the player aims, so it needs no target under the crosshair.
  if (held?.typeId === "extinguisher") {
    const charge = lab.device(held.id)?.chargeS ?? 0;
    return charge > 0.05 ? hold("spray", "Purkash", null) : blocked("spray", "O't o'chirgich bo'shadi", null);
  }
  const target = focus?.objectId ? world.get(focus.objectId) : null;
  if (!target) return null;
  if (!held) return deviceAction(lab, target, focus.part);

  const heldSubstance = substanceOf(held.typeId);
  const targetSubstance = substanceOf(target.typeId);
  const lamp = (target.typeId === "spirit-lamp" || target.typeId === "bunsen-burner") ? lab.device(target.id) : null;
  const targetVessel = isVessel(target.typeId);

  if (held.typeId === "dropper") {
    const dropper = lab.device(held.id);
    const loaded = (dropper?.mixture?.volumeMl ?? 0) > DROP_ML * 0.5;
    if (!loaded && liquidMl(lab, target) > 0.1) return click("dropper-draw", "Tortib olish (Pipetka)", target.id);
    if (loaded && targetVessel) return hold("dropper-drop", "Tomizish (Bosib turing yoki bosing)", target.id);
    return null;
  }
  if (held.typeId === "spatula") {
    const load = lab.device(held.id)?.load;
    const isScoopable = targetSubstance?.state === "powder" || targetSubstance?.state === "solid";
    const targetMix = isVessel(target.typeId) ? lab.mixture(target.id) : null;
    const hasVesselSolids = targetMix && targetMix.solids.length > 0;
    if (!load && (isScoopable || hasVesselSolids)) {
      const name = isScoopable ? `${SPATULA_G} g` : `${targetMix.solids[0].species}`;
      return click("spatula-scoop", `Kukun olish (${name})`, target.id);
    }
    if (load && targetVessel) return click("spatula-tip", `Solish (${load.sourceId ? (SUBSTANCE_BY_ID[load.sourceId]?.name ?? load.sourceId) : "modda"})`, target.id);
    if (load && isScoopable) return click("spatula-return", "Qaytarish", target.id);
    return null;
  }
  if (held.typeId === "crucible-tongs") {
    const piece = lab.device(held.id)?.piece;
    if (!piece && targetSubstance?.state === "solid") return click("tongs-pick", "Bo'lak olish", target.id);
    if (piece && targetVessel && target.typeId !== "gas-jar") return click("tongs-release", "Tushirish", target.id);
    if (piece && lamp) return lamp.lit ? hold("heat-in-flame", "Alangada qizdirish", target.id) : lampToggle(lab, target);
    if (piece && target.typeId === "gas-jar") {
      const hot = piece.state?.burning || piece.state?.molten;
      return hot ? hold("immerse", "Silindrga tushirish", target.id) : click("tongs-release", "Tushirish", target.id);
    }
    return null;
  }
  if (heldSubstance?.state === "gas") {
    if (targetVessel) return hold("gas-flow", "Gaz o'tkazish", target.id);
    if (lamp?.lit) return hold("gas-at-flame", "Alangaga yo'naltirish", target.id);
    return null;
  }
  if (held.typeId === "stirring-rod") return targetVessel && liquidMl(lab, target) > 0.1 ? hold("stir", "Aralashtirish (erishni tezlatish)", target.id) : null;
  if (held.typeId === "thermometer") {
    const tm = lab.mixture(target.id);
    const tempText = tm?.tempC != null ? `${tm.tempC.toFixed(1)} °C` : "22.0 °C";
    return targetVessel ? hold("measure", `Haroratni o'lchash (${tempText})`, target.id) : null;
  }
  if (held.typeId === "ph-paper") {
    const pm = lab.mixture(target.id);
    const estPh = pm ? (phOf(pm) ?? 7) : 7;
    return targetVessel && liquidMl(lab, target) > 0.05 ? click("ph-test", `pH ni tekshirish (~${estPh.toFixed(1)})`, target.id) : null;
  }
  if (held.typeId === "spirit-lamp" || held.typeId === "bunsen-burner") {
    if (!lab.device(held.id)?.lit) return null;
    return targetVessel ? click("ignite", "Alanga yaqinlashtirish", target.id) : null;
  }
  if (held.typeId === "watch-glass" && targetVessel) {
    const wm = lab.mixture(held.id);
    const hasContents = wm && (wm.volumeMl > 0.01 || wm.solids.length > 0);
    if (hasContents) return click("tip-watch-glass", "Soat oynasidan idishga solish", target.id);
  }

  const heldLiquid = liquidMl(lab, held);
  if ((held.typeId === "test-tube" || held.typeId === "crucible") && lamp) {
    return lamp.lit ? hold("heat-in-flame", "Alangada qizdirish", target.id) : lampToggle(lab, target);
  }
  if (held.typeId === "crucible" && target.typeId === "gas-jar") return hold("immerse", "Silindrga tushirish", target.id);
  if (heldLiquid > 0.05 && (heldSubstance?.state === "liquid" || isVessel(held.typeId))) {
    if (targetSubstance) return blocked("pour", "Reaktiv shishasiga quyib bo'lmaydi", target.id);
    if (target.typeId === "funnel") {
      const below = target.supportId ? world.get(target.supportId) : null;
      return below && isVessel(below.typeId)
        ? hold("pour", "Filtrlab quyish", target.id, { intoId: below.id, filter: true })
        : blocked("pour", "Voronkani idish ustiga qo'ying", target.id);
    }
    if (targetVessel) return hold("pour", "Quyish", target.id, { intoId: target.id });
  }
  // Nothing else fits: a lamp under the crosshair can always be lit or put out.
  if (lamp) return lampToggle(lab, target);
  return null;
};

const flash = (world, text) => world.flash(text);

// Absorbed share of bubbled gas: reactive solutions soak most of it up, plain water very little.
const absorption = (m, species) => {
  if (m.volumeMl <= EPS) return 0;
  const alkaline = aq(m, "OH-") > EPS || aq(m, "NH3") > EPS;
  if (species === "CO2") return alkaline ? 0.8 : 0.05;
  if (species === "Cl2") return alkaline || aq(m, "I-") > EPS ? 0.9 : 0.3;
  return 0;
};

const moveTongsPiece = (lab, tongsId, targetId) => {
  const from = lab.mixture(tongsId);
  const to = lab.mixture(targetId);
  if (!from || !to) return;
  for (const solid of from.solids) {
    const existing = to.solids.find((s) => s.species === solid.species && s.form === solid.form);
    if (existing) {
      existing.mmol += solid.mmol;
      existing.count += solid.count;
      existing.startMmol = (existing.startMmol ?? 0) + (solid.startMmol ?? solid.mmol);
      existing.state = { ...existing.state, ...solid.state };
    } else {
      to.solids.push({ ...solid, state: solid.state ? { ...solid.state } : null });
    }
  }
  for (const entry of from.history) to.history.push({ ...entry });
  to.tempC = (to.tempC * 4 + from.tempC) / 5;
  clearMixture(from);
  lab.setDevice(tongsId, { piece: null });
};

// One-shot actions (left click).
export const runClick = (action, { lab, world, held }) => {
  const target = world.get(action.targetId);
  if (!target) return;
  const device = lab.device(target.id);
  const targetSubstance = substanceOf(target.typeId);

  switch (action.id) {
    case "lamp-toggle":
      lab.setDevice(target.id, { lit: !device.lit, capOn: device.lit, dousing: 0, boost: 0 });
      pushSound(lab, { type: device.lit ? "click" : "whoosh", position: target.position });
      logJournal(lab, { kind: "device", text: `${displayName(target.typeId)} ${device.lit ? "o'chirildi" : "yoqildi"}` });
      if (!device.lit) checkGoggles(lab, { hazards: ["corrosive"] });
      return;
    case "bunsen-air": {
      const airOpen = !(device.airOpen ?? true);
      lab.setDevice(target.id, { airOpen });
      pushSound(lab, { type: "click", soft: true });
      return;
    }
    case "hotplate-heat": {
      const level = (device.level + 1) % HOT_PLATE_STEPS.length;
      lab.setDevice(target.id, { level });
      pushSound(lab, { type: "click" });
      logJournal(lab, { kind: "device", text: `Isitgich: ${HOT_PLATE_STEPS[level]}` });
      return;
    }
    case "hotplate-stir":
      lab.setDevice(target.id, { stir: !device.stir });
      pushSound(lab, { type: "click" });
      logJournal(lab, { kind: "device", text: `Magnit aralashtirgich ${device.stir ? "o'chirildi" : "yoqildi"}` });
      return;
    case "cover-toggle":
      lab.setDevice(target.id, { coverOn: !device.coverOn });
      pushSound(lab, { type: "click", soft: true });
      return;
    case "scale-tare":
      lab.setDevice(target.id, { tareG: device.grossG ?? 0 });
      pushSound(lab, { type: "click", soft: true });
      return;
    case "dropper-draw": {
      const dropper = lab.device(held.id);
      const mixture = createMixture({ capacityMl: 2, vesselHeatJK: 1 });
      const ml = Math.min(2, liquidMl(lab, target));
      if (targetSubstance) {
        mixIn(mixture, reagentPortion(targetSubstance.id, ml, { label: targetSubstance.formula }));
        lab.setDevice(target.id, { remaining: Math.max(0, device.remaining - ml / targetSubstance.container.fillMl), capOn: false });
      } else {
        mixIn(mixture, takePortion(lab.mixture(target.id), ml));
      }
      lab.setDevice(held.id, { ...dropper, mixture, fillMl: mixture.volumeMl, ...streamLook(lab, target) });
      pushSound(lab, { type: "pour", soft: true });
      return;
    }
    case "dropper-drop":
      dropOnce(lab, held.id, target.id);
      return;
    case "spatula-scoop": {
      if (targetSubstance) {
        lab.setDevice(held.id, {
          load: { sourceId: targetSubstance.id, grams: SPATULA_G, color: targetSubstance.container.color, grain: targetSubstance.container.grain ?? "fine" },
        });
        lab.setDevice(target.id, { remaining: Math.max(0, device.remaining - SPATULA_G / JAR_GRAMS.powder), capOn: false });
        pushSound(lab, { type: "click", soft: true });
      } else {
        const mix = lab.mixture(target.id);
        if (mix && mix.solids.length > 0) {
          const solid = mix.solids[0];
          const sp = SPECIES[solid.species];
          const mw = sp?.mw ?? 58.4;
          const totalG = (solid.mmol * mw) / 1000;
          const takeG = Math.min(SPATULA_G, totalG);
          const takeMmol = (takeG * 1000) / mw;
          solid.mmol = Math.max(0, solid.mmol - takeMmol);
          if (solid.mmol <= EPS) mix.solids.shift();
          lab.setDevice(held.id, {
            load: { sourceId: solid.species.toLowerCase(), grams: takeG, color: sp?.color ?? "#f8f9fa", grain: "fine" },
          });
          pushSound(lab, { type: "click", soft: true });
        }
      }
      return;
    }
    case "spatula-tip": {
      const load = lab.device(held.id).load;
      const sub = SUBSTANCE_BY_ID[load.sourceId];
      const label = sub ? sub.formula : (SPECIES[load.sourceId]?.formula ?? load.sourceId);
      addPowder(lab.mixture(target.id), load.sourceId, load.grams, { label });
      lab.setDevice(held.id, { load: null });
      pushSound(lab, { type: "click", soft: true });
      logJournal(lab, { kind: "add", text: `${load.grams} g ${label} → ${displayName(target.typeId)}` });
      return;
    }
    case "spatula-return": {
      const load = lab.device(held.id).load;
      if (device && !isNaN(device.remaining)) {
        lab.setDevice(target.id, { remaining: Math.min(1, device.remaining + load.grams / JAR_GRAMS.powder) });
      }
      lab.setDevice(held.id, { load: null });
      return;
    }
    case "tip-watch-glass": {
      const fromMix = lab.mixture(held.id);
      const toMix = lab.mixture(target.id);
      if (fromMix && toMix) {
        for (const solid of fromMix.solids) {
          const existing = toMix.solids.find((s) => s.species === solid.species && s.form === solid.form);
          if (existing) {
            existing.mmol += solid.mmol;
            existing.count += solid.count;
            existing.startMmol = (existing.startMmol ?? 0) + (solid.startMmol ?? solid.mmol);
          } else {
            toMix.solids.push({ ...solid });
          }
        }
        fromMix.solids = [];
        if (fromMix.volumeMl > 0.01) {
          const portion = takePortion(fromMix, fromMix.volumeMl);
          mixIn(toMix, portion);
        }
        for (const entry of fromMix.history) toMix.history.push({ ...entry });
        fromMix.history = [];
        pushSound(lab, { type: "clink", soft: true });
        world.flash("Soat oynasidagi modda idishga solindi");
      }
      return;
    }
    case "tongs-pick": {
      const source = SOURCES[targetSubstance.id];
      const entry = lab.ensureContainer(held.id, "crucible-tongs");
      clearMixture(entry.mixture);
      addPiece(entry.mixture, targetSubstance.id, { label: targetSubstance.formula });
      const jarGrams = JAR_GRAMS[targetSubstance.container.pieces] ?? 100;
      lab.setDevice(target.id, { remaining: Math.max(0, device.remaining - source.pieceG / jarGrams), capOn: false });
      lab.setDevice(held.id, {
        piece: { species: source.species, shape: source.form, grams: source.pieceG, color: SPECIES[source.species].color, state: {} },
      });
      return;
    }
    case "tongs-release": {
      const piece = lab.device(held.id)?.piece;
      moveTongsPiece(lab, held.id, target.id);
      if (piece) logJournal(lab, { kind: "add", text: `${SPECIES[piece.species]?.formula ?? piece.species} bo'lagi → ${displayName(target.typeId)}` });
      return;
    }
    case "ph-test": {
      const mixture = lab.mixture(target.id);
      const ph = phOf(mixture) ?? 7;
      let color = phPaperColor(ph);
      if (sulfuricFraction(mixture) > 0.8) color = "#1a1a1a";
      else if (nitricFraction(mixture) > 0.5) color = "#d9c24a";
      lab.setDevice(held.id, { strip: { color, ph } });
      pushFeed(lab, { kind: "ph", ph, word: phWord(ph), color, simId: target.id });
      return;
    }
    case "ignite":
      lab.activity.ignite = { simId: target.id, kind: "lamp", until: lab.now() + 0.6 };
      return;
    default:
      if (!action.valid) flash(world, action.label);
  }
};

const dropOnce = (lab, dropperId, targetId) => {
  const dropper = lab.device(dropperId);
  const target = lab.mixture(targetId);
  if (!dropper?.mixture || !target || dropper.mixture.volumeMl <= EPS) return false;
  lab.queueMix(targetId, mixIn(target, takePortion(dropper.mixture, DROP_ML)));
  lab.setDevice(dropperId, { fillMl: dropper.mixture.volumeMl });
  return true;
};

// Pouring acid or alkali without goggles earns a safety warning (the room keeps running).
const checkGoggles = (lab, substance) => {
  if (lab.prefs?.goggles || !substance) return;
  if (substance.hazards?.includes("corrosive")) warnOnce(lab, "no-goggles", 45);
};

// Fast pours into a narrow neck miss: part of the stream runs down the outside onto the bench.
const SPLASH_START = 0.6;
const SPLASH_SHARE = 0.45;

const SPRAY_NOSE = 0.42;
const SPRAY_DROP = 0.12;

// CO2 jet from the horn: puts out puddle fires and floods whatever it covers with cold carbon dioxide.
const spray = (lab, held, dt) => {
  const device = lab.device(held.id);
  const from = lab.activity.cameraPosition;
  const dir = lab.activity.cameraDirection;
  if (!device || !from || !dir || device.chargeS <= 0) return;
  device.chargeS = Math.max(0, device.chargeS - dt);
  const origin = [from[0] + dir[0] * SPRAY_NOSE, from[1] + dir[1] * SPRAY_NOSE - SPRAY_DROP, from[2] + dir[2] * SPRAY_NOSE];
  lab.hazards.sprayAt(origin, dir);
  lab.activity.spray = { sourceId: held.id, origin, direction: [...dir], chargeS: device.chargeS };
  if (device.chargeS <= 0) pushFeed(lab, { kind: "note", text: "O't o'chirgich bo'shadi" });
};

// Continuous actions while the left button is held; `state` persists for this press.
export const runHold = (action, { lab, world, held }, dt, state) => {
  if (action.id === "spray") {
    spray(lab, held, dt);
    return;
  }
  const target = world.get(action.targetId);
  if (!target) return;
  const activity = lab.activity;
  state.holdS = (state.holdS ?? 0) + dt;

  switch (action.id) {
    case "pour": {
      const into = lab.mixture(action.intoId);
      const heldSubstance = substanceOf(held.typeId);
      const geometry = pourGeometry(lab, held);
      const tilt = pourTilt(geometry, state.holdS);
      const maxRate = pourMaxRate(geometry?.kind ?? "bottle");
      let rate = pourRateAt(geometry, tilt);
      const available = liquidMl(lab, held);
      const free = into ? into.capacityMl - into.volumeMl - 0.3 : 0;
      // A hard pour into a narrow neck overshoots the mouth; that share lands on the bench instead.
      const splash = into?.narrow && rate > maxRate * SPLASH_START ? ((rate / maxRate - SPLASH_START) / (1 - SPLASH_START)) * SPLASH_SHARE : 0;
      const missMl = Math.min(available, rate * dt * splash);
      rate *= 1 - splash;
      const ml = Math.max(0, Math.min(rate * dt, available - missMl, free));
      activity.pour = {
        sourceId: held.id,
        targetId: target.id,
        intoId: action.intoId,
        rate: Math.min(1, (rate + rate * splash) / maxRate),
        tilt,
        splash,
        addedMl: (activity.pour?.addedMl ?? 0) + ml,
        label: heldSubstance ? heldSubstance.formula : displayName(held.typeId),
        ...streamLook(lab, held),
      };
      if (heldSubstance) lab.device(held.id).capOn = false;
      if (!state.goggleChecked && rate > 0) {
        state.goggleChecked = true;
        checkGoggles(lab, heldSubstance);
      }
      if (missMl > EPS) {
        const missed = heldSubstance ? reagentPortion(heldSubstance.id, missMl, { label: heldSubstance.formula }) : takePortion(lab.mixture(held.id), missMl);
        if (heldSubstance) lab.device(held.id).remaining = Math.max(0, lab.device(held.id).remaining - missMl / heldSubstance.container.fillMl);
        spillPortion(lab, missed, target.position);
        if (!state.splashNoted) {
          state.splashNoted = true;
          world.flash("Sekinroq quying: suyuqlik yonidan to'kilmoqda");
        }
      }
      if (ml <= EPS) {
        // A full target means the rest of the pour runs down the outside of the glass.
        if (rate > 0 && free <= 0.05) {
          if (!state.fullNoted) {
            state.fullNoted = true;
            world.flash("Idish to'ldi");
          }
          const overflow = Math.min(rate * dt, available);
          if (overflow > EPS) {
            const spilled = heldSubstance
              ? reagentPortion(heldSubstance.id, overflow, { label: heldSubstance.formula })
              : takePortion(lab.mixture(held.id), overflow);
            if (heldSubstance) {
              const device = lab.device(held.id);
              device.remaining = Math.max(0, device.remaining - overflow / heldSubstance.container.fillMl);
            }
            spillPortion(lab, spilled, target.position);
          }
        }
        return;
      }
      let portion;
      if (heldSubstance) {
        portion = reagentPortion(heldSubstance.id, ml, { label: heldSubstance.formula });
        const device = lab.device(held.id);
        device.remaining = Math.max(0, device.remaining - ml / heldSubstance.container.fillMl);
      } else {
        portion = takePortion(lab.mixture(held.id), ml);
      }
      if (action.filter) filterInto(lab, target.id, portion);
      lab.queueMix(action.intoId, mixIn(into, portion));
      return;
    }
    case "dropper-drop":
      if (!state.initialDropDone) {
        state.initialDropDone = true;
        state.nextDropS = DROP_EVERY_S;
        dropOnce(lab, held.id, target.id);
      } else if (state.holdS >= state.nextDropS) {
        state.nextDropS += DROP_EVERY_S;
        dropOnce(lab, held.id, target.id);
      }
      activity.drop = { dropperId: held.id, targetId: target.id };
      return;
    case "burette-titrate": {
      const below = target.supportId ? world.get(target.supportId) : null;
      const receiver = isVessel(below?.typeId) ? below : world.store.get().objects.find((o) => isVessel(o.typeId) && Math.hypot(o.position[0] - target.position[0], o.position[2] - target.position[2]) < 0.16 && target.position[1] > o.position[1]);
      const buretteMix = lab.mixture(target.id);
      if (buretteMix && buretteMix.volumeMl > 0.02) {
        state.nextDropS = state.nextDropS ?? 0.16;
        if (state.holdS >= state.nextDropS) {
          state.nextDropS += 0.16;
          const portion = takePortion(buretteMix, DROP_ML);
          if (receiver) {
            lab.queueMix(receiver.id, mixIn(lab.mixture(receiver.id), portion));
          } else {
            spillPortion(lab, portion, [target.position[0], 0.9, target.position[2]]);
          }
          pushSound(lab, { type: "pour", soft: true });
        }
        activity.drop = {
          dropperId: target.id,
          targetId: receiver?.id ?? null,
          from: [target.position[0], target.position[1] + 0.02, target.position[2]],
          to: receiver ? [receiver.position[0], receiver.position[1] + 0.1, receiver.position[2]] : [target.position[0], 0.9, target.position[2]],
          burette: true,
        };
      }
      return;
    }
    case "gas-flow": {
      const substance = substanceOf(held.typeId);
      const mixture = lab.mixture(target.id);
      const species = SOURCES[substance.id].species;
      addGasMl(mixture, substance.id, GAS_ML_PER_S * dt, { label: substance.formula, dissolveFraction: absorption(mixture, species) });
      activity.gas = { sourceId: held.id, targetId: target.id, species, bubbling: mixture.volumeMl > 0.5 };
      return;
    }
    case "gas-at-flame": {
      const substance = substanceOf(held.typeId);
      const species = SOURCES[substance.id].species;
      const lamp = lab.device(target.id);
      activity.gas = { sourceId: held.id, targetId: target.id, species, atLamp: true, bubbling: false };
      if (species === "CO2") {
        lamp.dousing = Math.min(1, lamp.dousing + dt * 1.8);
        if (lamp.dousing >= 1 && lamp.lit) {
          lab.setDevice(target.id, { lit: false, dousing: 0 });
          pushFeed(lab, { kind: "note", text: "CO₂ oqimida alanga o'chdi" });
        }
      } else if (species === "O2") {
        lamp.boost = 1.5;
      } else if (species === "H2") {
        activity.gas.burning = true;
      }
      return;
    }
    case "stir":
      activity.stir = target.id;
      if (!state.lastStirSound || state.holdS > state.lastStirSound + 0.45) {
        state.lastStirSound = state.holdS;
        pushSound(lab, { type: "clink", soft: true });
      }
      return;
    case "measure":
      lab.device(held.id).targetId = target.id;
      activity.measure = { thermometerId: held.id, targetId: target.id };
      return;
    case "heat-in-flame":
      activity.heat = { simId: held.id, lampId: target.id };
      return;
    case "immerse":
      activity.immerse = { simId: held.id, jarId: target.id };
      return;
    default:
  }
};

// Solids stay on the filter paper; the clear filtrate continues into the vessel below.
const filterInto = (lab, funnelId, portion) => {
  if (!portion.solids.length) return;
  const funnel = lab.device(funnelId);
  let ml = 0;
  let color = funnel.solidsColor;
  for (const solid of portion.solids) {
    const sp = SPECIES[solid.species];
    const add = sp.bedMl ? solid.mmol * sp.bedMl : (solid.mmol * sp.mw) / 1000 / 1.2;
    ml += add;
    color = sp.color;
  }
  portion.solids = [];
  lab.setDevice(funnelId, { solidsMl: funnel.solidsMl + ml, solidsColor: color, wet: 1 });
};

export const endHold = (action, { lab, world, held }) => {
  const activity = lab.activity;
  if (action.id === "pour") {
    const pour = activity.pour;
    const target = world?.get(action.intoId ?? action.targetId);
    if (pour && pour.addedMl > 0.2 && target) {
      logJournal(lab, { kind: "pour", text: `${Math.round(pour.addedMl * 2) / 2} ml ${pour.label} → ${displayName(target.typeId)}` });
    }
    activity.pour = null;
    if (held && substanceOf(held.typeId)) lab.setDevice(held.id, { capOn: true });
  }
  if (action.id === "dropper-drop" || action.id === "burette-titrate") activity.drop = null;
  if (action.id === "gas-flow" || action.id === "gas-at-flame") activity.gas = null;
  if (action.id === "stir") activity.stir = null;
  if (action.id === "measure") {
    if (held) lab.device(held.id).targetId = null;
    activity.measure = null;
  }
  if (action.id === "spray") activity.spray = null;
  if (action.id === "heat-in-flame") activity.heat = null;
  if (action.id === "immerse") activity.immerse = null;
};

// Publishes this frame's aim and running action for the hand poses, effects and runtime.
export const noteActivity = (lab, running, aim, eye, direction) => {
  const activity = lab.activity;
  activity.action = running;
  activity.aim = aim;
  activity.cameraPosition = [eye.x, eye.y, eye.z];
  activity.cameraDirection = [direction.x, direction.y, direction.z];
  if (activity.ignite && lab.now() > activity.ignite.until) activity.ignite = null;
};

const HOT_TOUCH_C = 60;

// Picking up hot glassware still works, but the student is told to use a holder next time.
export const warnIfHot = (lab, objectId) => {
  const mixture = lab.mixture(objectId);
  if (!mixture || mixture.tempC < HOT_TOUCH_C) return;
  pushFeed(lab, { kind: "warning", id: "hot-glass", simId: objectId });
};
