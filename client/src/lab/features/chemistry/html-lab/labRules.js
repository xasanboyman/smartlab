// Offline reaction rules for the HTML lab: whole-reagent pairs first, then element rules,
// then heat-driven changes. Each hit carries a balanced equation for the journal.
import { classifyReaction, detectCombo, effectForStatus } from "../../../data/reactions.js";

const ELEMENT_EQUATIONS = {
  "H,O": "2H₂ + O₂ → 2H₂O",
  "K,O": "4K + O₂ → 2K₂O",
  "Na,O": "4Na + O₂ → 2Na₂O",
  "Na,Cl": "2Na + Cl₂ → 2NaCl",
  "S,O": "S + O₂ → SO₂↑",
  "C,O": "C + O₂ → CO₂↑",
  "Fe,O": "4Fe + 3O₂ → 2Fe₂O₃",
  "Mn,O": "3Mn + 2O₂ → Mn₃O₄",
};

const ELEMENT_RULES = [
  ["H", "O"], ["K", "O"], ["Na", "O"], ["Na", "Cl"], ["S", "O"], ["C", "O"], ["Fe", "O"], ["Mn", "O"],
];

// Pairs of substance ids (any order). First match wins, so the violent ones sit on top.
export const PAIR_RULES = [
  { pair: ["el-K", "cmp-h2o"], status: "portlash", eq: "2K + 2H₂O → 2KOH + H₂↑", title: "Kaliy suvda portladi" },
  { pair: ["el-Na", "cmp-h2o"], status: "yonish", eq: "2Na + 2H₂O → 2NaOH + H₂↑", title: "Natriy suvda yonmoqda" },
  { pair: ["el-Ca", "cmp-h2o"], status: "pufaklanish", eq: "Ca + 2H₂O → Ca(OH)₂ + H₂↑", title: "Kalsiy suv bilan" },
  { pair: ["cmp-h2so4", "cmp-h2o"], status: "issiqlik", eq: "H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻", title: "Kislota suyultirildi" },
  { pair: ["cmp-h2so4", "el-Zn"], status: "pufaklanish", eq: "Zn + H₂SO₄ → ZnSO₄ + H₂↑", title: "Vodorod ajralmoqda" },
  { pair: ["cmp-h2so4", "el-Mg"], status: "pufaklanish", eq: "Mg + H₂SO₄ → MgSO₄ + H₂↑", title: "Vodorod ajralmoqda" },
  { pair: ["cmp-h2so4", "el-Fe"], status: "pufaklanish", eq: "Fe + H₂SO₄ → FeSO₄ + H₂↑", title: "Vodorod ajralmoqda" },
  { pair: ["cmp-h2so4", "cmp-nh3"], status: "issiqlik", eq: "2NH₃ + H₂SO₄ → (NH₄)₂SO₄", title: "Neytrallanish" },
  { pair: ["cmp-c2h4o2", "cmp-nh3"], status: "issiqlik", eq: "CH₃COOH + NH₃ → CH₃COONH₄", title: "Neytrallanish" },
  { pair: ["cmp-c2h4o2", "el-Na"], status: "pufaklanish", eq: "2CH₃COOH + 2Na → 2CH₃COONa + H₂↑", title: "Vodorod ajralmoqda" },
  { pair: ["cmp-c2h4o2", "el-Mg"], status: "pufaklanish", eq: "2CH₃COOH + Mg → (CH₃COO)₂Mg + H₂↑", title: "Vodorod ajralmoqda" },
  { pair: ["cmp-cuso4", "el-Fe"], status: "rang_ozgarishi", eq: "Fe + CuSO₄ → FeSO₄ + Cu↓", title: "Mis qoplama hosil bo'ldi" },
  { pair: ["cmp-cuso4", "el-Zn"], status: "rang_ozgarishi", eq: "Zn + CuSO₄ → ZnSO₄ + Cu↓", title: "Mis qoplama hosil bo'ldi" },
  { pair: ["cmp-cuso4", "cmp-nh3"], status: "rang_ozgarishi", eq: "Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺", title: "To'q ko'k kompleks" },
  { pair: ["cmp-fecl3", "cmp-nh3"], status: "chokma", eq: "FeCl₃ + 3NH₃ + 3H₂O → Fe(OH)₃↓ + 3NH₄Cl", title: "Qo'ng'ir cho'kma" },
  { pair: ["cmp-kmno4", "cmp-h2o2"], status: "gaz_ajralishi", eq: "2KMnO₄ + 3H₂O₂ → 2MnO₂ + 2KOH + 3O₂↑ + 2H₂O", title: "Kislorod ajralmoqda" },
  { pair: ["cmp-h2o2", "el-Mn"], status: "gaz_ajralishi", eq: "2H₂O₂ →(Mn) 2H₂O + O₂↑", title: "Katalitik parchalanish" },
  { pair: ["cmp-kmno4", "cmp-c2h6o"], status: "rang_ozgarishi", eq: "4KMnO₄ + 3C₂H₅OH → 3CH₃COOH + 4MnO₂ + 4KOH + H₂O", title: "Binafsha rang yo'qoldi" },
  { pair: ["cmp-h2o", "cmp-dryice"], status: "tuman", eq: "CO₂(q) → CO₂(g)", title: "Quyuq tuman" },
  { pair: ["cmp-nacl", "cmp-h2o"], status: "neytral", eq: "NaCl → Na⁺ + Cl⁻", title: "Tuz erib ketdi" },
];

const PRODUCT_COLORS = {
  "cmp-cuso4+cmp-nh3": "#1a2fb8",
  "cmp-fecl3+cmp-nh3": "#7a4a1e",
  "cmp-cuso4+el-Fe": "#8fb59a",
  "cmp-cuso4+el-Zn": "#b9c7cf",
  "cmp-kmno4+cmp-c2h6o": "#6b4b2a",
};

const pairKey = (a, b) => [a, b].sort().join("+");

const findPair = (ids) => {
  for (const rule of PAIR_RULES) {
    if (rule.pair.every((id) => ids.has(id))) return rule;
  }
  return null;
};

// Everything the journal needs for the current contents. Returns null when nothing reacts.
export const detectReaction = (poured) => {
  if (poured.length === 0) return null;
  const ids = new Set(poured.map((s) => s.id));
  const pair = findPair(ids);
  if (pair) {
    return {
      ...effectForStatus(pair.status),
      title: pair.title || effectForStatus(pair.status).title,
      eq: pair.eq,
      key: pairKey(pair.pair[0], pair.pair[1]),
      color: PRODUCT_COLORS[pairKey(pair.pair[0], pair.pair[1])] || null,
    };
  }
  const combo = detectCombo(poured);
  if (combo) return { ...effectForStatus(combo), eq: "CO₂(q) → CO₂(g)", key: `combo:${combo}` };
  const symbols = new Set(poured.filter((s) => s.kind === "element").map((s) => s.formula));
  const status = classifyReaction(symbols);
  if (!status) return null;
  const rule = ELEMENT_RULES.find((needs) => needs.every((sym) => symbols.has(sym)));
  const key = rule ? rule.join(",") : status;
  return { ...effectForStatus(status), eq: ELEMENT_EQUATIONS[key] || null, key: `el:${key}` };
};

const ACIDS = { "cmp-h2so4": 0.3, "cmp-c2h4o2": 3.2, "cmp-fecl3": 2.4, "cmp-cuso4": 4.2 };
const BASES = { "cmp-nh3": 11.2, "el-Na": 13.5, "el-K": 13.8, "el-Ca": 12.2 };

// Rough pH from what is in the vessel: strongest acid/base dominates, neutralisation drifts to 7.
export const estimatePh = (poured) => {
  if (poured.length === 0) return 7;
  let acid = null;
  let base = null;
  for (const s of poured) {
    if (ACIDS[s.id] !== undefined) acid = acid === null ? ACIDS[s.id] : Math.min(acid, ACIDS[s.id]);
    if (BASES[s.id] !== undefined) base = base === null ? BASES[s.id] : Math.max(base, BASES[s.id]);
  }
  if (acid !== null && base !== null) return 7 + (base - 7 - (7 - acid)) * 0.35;
  if (acid !== null) return acid;
  if (base !== null) return base;
  return 7;
};

const POUR_ML = { suyuq: 40, qattiq: 12, gaz: 6 };

export const estimateVolume = (poured) => Math.min(250, poured.reduce((ml, s) => ml + (POUR_ML[s.state] ?? 15), 0));

// Heat-driven statuses on top of the mixture rules.
export const detectHeatEvent = ({ poured, tempC, heating }) => {
  if (poured.length === 0) return null;
  const ids = new Set(poured.map((s) => s.id));
  if (heating && ids.has("cmp-c2h6o") && tempC > 60) {
    return { ...effectForStatus("yonish"), title: "Etanol alangalandi", eq: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O", key: "heat:ethanol" };
  }
  if (tempC >= 99.5 && estimateVolume(poured) > 0) {
    return { ...effectForStatus("qaynash"), eq: "H₂O(s) → H₂O(g)", key: "heat:boil" };
  }
  return null;
};
