import { pushSound } from "../sound/queue";
import { isVessel } from "../tools/actions";
import { clearMixture, mixIn, reagentPortion } from "../chemistry/mixture";

// Fittings baked into the room that the player uses: the computer screen, fan switches,
// extinguisher, first aid kit, fire blanket, gas shut-off and the sink faucet.
export const PANELS = {
  monitor_screen: { axis: "z", pad: 0, title: "Laboratoriya kompyuteri", subtitle: "Oxirgi reaksiya haqida ma'lumot", label: "O'qish" },
  fumehood_switch: { axis: "x", pad: 0.09, title: "Mo'rili shkaf so'rg'ichi", device: "hoodFan" },
  ventilation_switch: { axis: "x", pad: 0.09, title: "Xona shamollatgichi (Ventilyatsiya)", device: "ventilation" },
  extinguisher: { axis: "z", pad: 0.06, title: "O't o'chirgich", fixture: "extinguisher" },
  sink: { axis: "z", pad: 0.15, title: "Laboratoriya rakovinasi", utility: "sink" },
  fire_blanket: { axis: "z", pad: 0.12, title: "Yong'in adyoli", utility: "fire_blanket" },
  first_aid_box: { axis: "z", pad: 0.12, title: "Tezkor tibbiy yordam qutisi", utility: "first_aid" },
  gas_shutoff: { axis: "z", pad: 0.1, title: "Gaz magistral krani", utility: "gas_shutoff" },
  chem_cabinet: { axis: "z", pad: 0.35, title: "Kimyoviy moddalar shkafi", utility: "chem_cabinet" },
};

const DEFAULT_ANCHORS = {
  gas_shutoff: { position: [-3.8, 1.15, 3.8], size: [0.22, 0.22] },
};

const AXIS = { x: 0, y: 1, z: 2 };

// Distance along the ray to the panel's rectangle, or null when the ray misses it.
export const panelAlong = (anchor, panel, origin, direction, limit) => {
  const axis = AXIS[panel.axis];
  const dir = axis === 0 ? direction.x : direction.z;
  if (!anchor || Math.abs(dir) < 1e-4) return null;
  const from = axis === 0 ? origin.x : origin.z;
  const t = (anchor.position[axis] - from) / dir;
  if (t <= 0 || t > limit) return null;
  // Width runs along the free horizontal axis, height along y.
  const across = axis === 0 ? origin.z + direction.z * t - anchor.position[2] : origin.x + direction.x * t - anchor.position[0];
  const up = origin.y + direction.y * t - anchor.position[1];
  const [width, height] = anchor.size;
  return Math.abs(across) <= width / 2 + panel.pad && Math.abs(up) <= height / 2 + panel.pad ? t : null;
};

// The nearest panel the player is looking at, with the action it offers right now.
export const panelAt = ({ anchors, lab, world, held, origin, direction, limit }) => {
  let best = null;
  for (const [id, panel] of Object.entries(PANELS)) {
    const anchor = anchors?.[id] ?? DEFAULT_ANCHORS[id];
    const t = panelAlong(anchor, panel, origin, direction, limit);
    if (t == null || (best && t >= best.distance)) continue;
    best = { id, panel, distance: t };
  }
  if (!best) return null;
  const { id, panel } = best;
  if (panel.device) {
    const on = lab.hazards.devices[panel.device];
    return { ...best, label: on ? "O'chirish" : "Yoqish", subtitle: on ? "Hozir ishlayapti" : "Hozir o'chiq" };
  }
  if (panel.fixture) {
    const carried = world.store.get().objects.some((o) => o.typeId === panel.fixture);
    if (held?.typeId === panel.fixture) return { ...best, label: "Joyiga qo'yish", subtitle: null };
    if (carried) return null;
    if (held) return { ...best, label: "Avval qo'lingizdagini qo'ying", subtitle: null, disabled: true };
    return { ...best, label: "Olish", subtitle: "Yong'inni o'chirish uchun" };
  }
  if (panel.utility === "sink") {
    if (held && isVessel(held.typeId)) {
      const vol = lab.mixture(held.id)?.volumeMl ?? 0;
      return vol > 0.1
        ? { ...best, label: "Idishni yuvish va to'kish", subtitle: "Rakovinada tozalash" }
        : { ...best, label: "Distillangan suv quyish (100 ml)", subtitle: "Jo'mrakdan toza suv olish" };
    }
    const on = Boolean(lab.utilityState?.faucet);
    return { ...best, label: on ? "Jo'mrakni yopish" : "Jo'mrakni ochish", subtitle: on ? "Oqova suv oqmoqda" : "Laboratoriya jo'mragi" };
  }
  if (panel.utility === "fire_blanket") {
    return { ...best, label: "Yong'in adyolini qo'llash", subtitle: "Stoldagi olovni bostirish" };
  }
  if (panel.utility === "first_aid") {
    return { ...best, label: "Birinchi yordam olish", subtitle: "Kuyish va jarohatlarni davolash" };
  }
  if (panel.utility === "gas_shutoff") {
    const open = lab.utilityState?.gasOpen ?? true;
    return { ...best, label: open ? "Gaz magistralini yopish" : "Gaz magistralini ochish", subtitle: open ? "Magistral ochiq" : "Magistral yopiq (Xavfsiz)" };
  }
  if (panel.utility === "chem_cabinet") {
    return { ...best, label: "Reaktivlar shkafini ochish", subtitle: "Kislota, ishqor va moddalar ombori" };
  }
  if (held) return null;
  return { ...best, label: panel.label, subtitle: panel.subtitle };
};

// Returns "monitor" or "cabinet" when the player opened a modal screen.
export const runPanel = (hit, { lab, world, held }) => {
  if (!hit || hit.disabled) return null;
  const { panel } = hit;
  if (panel.device) {
    const next = !lab.hazards.devices[panel.device];
    lab.hazards.setDevice(panel.device, next);
    pushSound(lab, { type: "click" });
    world.flash(`${panel.title}: ${next ? "yoqildi" : "o'chirildi"}`);
    return null;
  }
  if (panel.fixture) {
    if (held?.typeId === panel.fixture) {
      world.removeHeld(held.id);
      return null;
    }
    const result = world.addToSlot(panel.fixture);
    if (!result.ok) world.flash("Barcha 5 joy band: avval biror narsani qo'ying");
    return null;
  }
  if (panel.utility === "sink") {
    lab.utilityState = lab.utilityState || {};
    if (held && isVessel(held.typeId)) {
      const vol = lab.mixture(held.id)?.volumeMl ?? 0;
      if (vol > 0.1) {
        clearMixture(lab.mixture(held.id));
        pushSound(lab, { type: "pour" });
        world.flash("Idish yuvildi va toza holatga keltirildi");
      } else {
        mixIn(lab.mixture(held.id), reagentPortion("water", 100));
        pushSound(lab, { type: "pour" });
        world.flash("Idishga 100 ml toza distillangan suv quyildi");
      }
      return null;
    }
    lab.utilityState.faucet = !lab.utilityState.faucet;
    pushSound(lab, { type: "click" });
    world.flash(lab.utilityState.faucet ? "Jo'mrak ochildi: oqova suv oqmoqda" : "Jo'mrak yopildi");
    return null;
  }
  if (panel.utility === "fire_blanket") {
    for (const p of lab.hazards.puddles) {
      if (p.burning) {
        p.burning = false;
        p.heat = 0;
      }
    }
    pushSound(lab, { type: "click", soft: true });
    world.flash("Yong'in adyoli yopildi: stoldagi barcha olovlar bostirildi!");
    return null;
  }
  if (panel.utility === "first_aid") {
    lab.hazards.state.exposure.heat = 0;
    lab.hazards.state.exposure.irritant = 0;
    lab.hazards.state.exposure.flash = 0;
    lab.hazards.state.exposure.ringing = 0;
    pushSound(lab, { type: "click", soft: true });
    world.flash("Birinchi tibbiy yordam ko'rsatildi: jarohatlar davolandi!");
    return null;
  }
  if (panel.utility === "gas_shutoff") {
    lab.utilityState = lab.utilityState || {};
    lab.utilityState.gasOpen = !(lab.utilityState.gasOpen ?? true);
    pushSound(lab, { type: "click" });
    world.flash(lab.utilityState.gasOpen ? "Gaz magistral krani ochildi" : "Gaz magistral krani yopildi (Tizim xavfsiz holatda)");
    return null;
  }
  if (panel.utility === "chem_cabinet") {
    return "cabinet";
  }
  return hit.id === "monitor_screen" ? "monitor" : null;
};
