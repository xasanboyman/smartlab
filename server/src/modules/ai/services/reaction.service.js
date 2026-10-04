// Gemini orqali ikki moddaning (miqdori bilan) reaksiyasini aniqlaydi va
// frontend biladigan "status" kalitini qaytaradi. API kalit bo'lmasa, deterministik qoidalar ishlaydi.
import env from "../../../config/env.js";
import ApiError from "../../../utils/ApiError.js";

export const isConfigured = () => Boolean(env.GEMINI_API_KEY);

// Frontend'dagi reactions.js STATUS_INFO bilan bir xil status lug'ati.
export const STATUS_KEYS = [
  "portlash",
  "yonish",
  "tutun",
  "qaynash",
  "pufaklanish",
  "rang_ozgarishi",
  "chokma",
  "gaz_ajralishi",
  "issiqlik",
  "tuman",
  "neytral",
];

const SYSTEM_INSTRUCTION = `Sen kimyo laboratoriyasi reaksiya simulyatorisisan.
Senga ikkita modda va ularning miqdori beriladi. Ular aralashganda nima
sodir bo'lishini aniqla. Molyar nisbat (stoikiometriya)ni hisobga ol - masalan
katta bo'lak natriyga bir tomchi suv portlash, ozgina natriyga bir chelak suv
esa kuchsiz reaksiya beradi.
Faqat quyidagi status'lardan BIRINI tanla (boshqasini o'ylab topma):
portlash, yonish, tutun, qaynash, pufaklanish, rang_ozgarishi, chokma,
gaz_ajralishi, issiqlik, tuman, neytral.
Agar sezilarli reaksiya bo'lmasa - "neytral".
description: bitta qisqa o'zbekcha jumla.
equation: bitta qatorli kimyoviy tenglama (masalan "2H2 + O2 -> 2H2O") -
bo'sh joy yoki belgini takrorlama.
intensity: 1..10 (reaksiya kuchi).`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    status: { type: "STRING", enum: STATUS_KEYS },
    intensity: { type: "INTEGER" },
    description: { type: "STRING" },
    equation: { type: "STRING" },
  },
  required: ["status", "intensity", "description"],
  propertyOrdering: ["status", "intensity", "description", "equation"],
};

const reagentLine = (r) =>
  `${r.quantity} ${r.unit || "g"} ${r.name}${r.formula ? ` (${r.formula})` : ""}`;

const buildPrompt = ({ a, b }) =>
  `A modda: ${reagentLine(a)}\nB modda: ${reagentLine(b)}\nBu ikkalasini aralashtirsak nima bo'ladi?`;

const clean = (v, max) =>
  String(v || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const normalize = (raw) => {
  const status = STATUS_KEYS.includes(raw?.status) ? raw.status : "neytral";
  let intensity = Number(raw?.intensity);
  if (!Number.isFinite(intensity)) intensity = status === "neytral" ? 1 : 5;
  intensity = Math.min(10, Math.max(1, Math.round(intensity)));
  const equation = clean(raw?.equation, 120);
  return {
    status,
    intensity,
    description: clean(raw?.description, 400),
    equation: equation || null,
  };
};

export const fallbackReaction = ({ a, b }) => {
  const norm = (s) => String(s || "").toLowerCase().trim();

  const matchSubstance = (item, { formulas = [], names = [], excludes = [] }) => {
    if (!item) return false;
    const f = norm(item.formula);
    const n = norm(item.name);

    for (const ex of excludes) {
      if (f === ex || n === ex) return false;
      if (ex.length > 2 && (n.includes(ex) || f.includes(ex))) return false;
    }

    for (const form of formulas) {
      if (f === form || n === form) return true;
    }

    for (const name of names) {
      if (n === name) return true;
      const regex = new RegExp(
        "(^|\\s|[_-])" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "($|\\s|[_-])",
        "i",
      );
      if (regex.test(n)) return true;
    }

    return false;
  };

  const SUBSTANCES = {
    SODIUM: {
      formulas: ["na"],
      names: ["natriy", "sodium"],
      excludes: [
        "nacl", "naoh", "nahco3", "na2co3", "na2so4",
        "xlorid", "gidroksid", "bikarbonat", "karbonat", "sulfat", "tuz",
      ],
    },
    POTASSIUM: {
      formulas: ["k"],
      names: ["kaliy", "potassium"],
      excludes: [
        "kcl", "koh", "kmno4", "k2so4",
        "xlorid", "gidroksid", "permanganat", "sulfat",
      ],
    },
    WATER: {
      formulas: ["h2o"],
      names: ["suv", "water"],
      excludes: ["h2o2", "peroksid"],
    },
    HYDROGEN: {
      formulas: ["h2"],
      names: ["vodorod", "hydrogen"],
      excludes: ["h2o", "h2so4", "h2o2", "suv", "kislota", "peroksid"],
    },
    OXYGEN: {
      formulas: ["o2"],
      names: ["kislorod", "oxygen"],
      excludes: ["co2", "so2", "no2", "sio2", "h2o", "h2o2", "karbonat", "suv"],
    },
    HCL: {
      formulas: ["hcl"],
      names: [
        "xlorid kislota", "xlorid kislotasi", "sol kislota",
        "tuz kislotasi", "tuz kislota", "kislota", "hydrochloric acid",
      ],
      excludes: ["nacl", "cacl2", "bacl2", "kcl"],
    },
    NAOH: {
      formulas: ["naoh"],
      names: [
        "natriy gidroksid", "o'yuvchi natriy", "sodium hydroxide", "kaustik soda",
      ],
      excludes: ["nacl", "na2so4", "nahco3"],
    },
    CACO3: {
      formulas: ["caco3"],
      names: [
        "kalsiy karbonat", "bo'r", "bor", "ohaktosh", "marmar",
        "calcium carbonate", "chalk",
      ],
      excludes: [],
    },
    METHANE: {
      formulas: ["ch4"],
      names: ["metan", "methane"],
      excludes: [],
    },
    ZINC: {
      formulas: ["zn"],
      names: ["rux", "zinc"],
      excludes: ["znso4", "zncl2"],
    },
    H2SO4: {
      formulas: ["h2so4"],
      names: [
        "sulfat kislota", "sulfat kislotasi", "sulfat", "sulfuric acid",
      ],
      excludes: [
        "caso4", "baso4", "na2so4", "k2so4", "znso4", "bariy sulfat", "kalsiy sulfat",
      ],
    },
    BARIUM: {
      formulas: ["bacl2", "ba"],
      names: ["bariy xlorid", "bariy", "barium chloride", "barium"],
      excludes: ["baso4", "bariy sulfat"],
    },
    IRON: {
      formulas: ["fe"],
      names: ["temir", "iron"],
      excludes: ["fes", "fe2o3", "fe3o4", "fecl3", "fecl2"],
    },
    SULFUR: {
      formulas: ["s"],
      names: ["oltingugurt", "sulfur"],
      excludes: ["suv", "spirt", "so2", "so3", "h2s", "h2so4", "fes"],
    },
  };

  const is = (item, substanceDef) => matchSubstance(item, substanceDef);
  const isPair = (subA, subB) =>
    (is(a, subA) && is(b, subB)) || (is(b, subA) && is(a, subB));

  // Natriy + Suv
  if (isPair(SUBSTANCES.SODIUM, SUBSTANCES.WATER)) {
    return {
      status: "portlash",
      intensity: 9,
      description:
        "Natriy suv bilan shiddatli reaksiyaga kirishib, vodorod gazini ajratadi va kuchli portlaydi!",
      equation: "2Na + 2H2O -> 2NaOH + H2",
    };
  }

  // Kaliy + Suv
  if (isPair(SUBSTANCES.POTASSIUM, SUBSTANCES.WATER)) {
    return {
      status: "portlash",
      intensity: 10,
      description:
        "Kaliy suv bilan shiddatli reaksiyaga kirishib, binafsha rangli alanga va portlash bilan yonadi!",
      equation: "2K + 2H2O -> 2KOH + H2",
    };
  }

  // Vodorod + Kislorod
  if (isPair(SUBSTANCES.HYDROGEN, SUBSTANCES.OXYGEN)) {
    return {
      status: "portlash",
      intensity: 10,
      description:
        "Vodorod va kislorod aralashmasi (guldurlovchi gaz) chaqnash bilan portlaydi va suv hosil bo'ladi!",
      equation: "2H2 + O2 -> 2H2O",
    };
  }

  // Kislota + Ishqor (HCl + NaOH)
  if (isPair(SUBSTANCES.HCL, SUBSTANCES.NAOH)) {
    return {
      status: "issiqlik",
      intensity: 6,
      description:
        "Neytrallanish reaksiyasi natijasida osh tuzi va suv hosil bo'lib, issiqlik ajraladi.",
      equation: "HCl + NaOH -> NaCl + H2O",
    };
  }

  // Karbonat + Kislota (CaCO3 + HCl)
  if (isPair(SUBSTANCES.CACO3, SUBSTANCES.HCL)) {
    return {
      status: "pufaklanish",
      intensity: 7,
      description:
        "Kalsiy karbonat kislota bilan reaksiyaga kirishib, shiddatli ko'piklanish bilan karbonat angidrid gazi ajraladi.",
      equation: "CaCO3 + 2HCl -> CaCl2 + H2O + CO2",
    };
  }

  // Metan + Kislorod (CH4 + O2)
  if (isPair(SUBSTANCES.METHANE, SUBSTANCES.OXYGEN)) {
    return {
      status: "yonish",
      intensity: 8,
      description:
        "Metan gazi kislorodda moviy alanga bilan yonib, karbonat angidrid va suv hosil qiladi.",
      equation: "CH4 + 2O2 -> CO2 + 2H2O",
    };
  }

  // Rux + Sulfat kislota (Zn + H2SO4)
  if (isPair(SUBSTANCES.ZINC, SUBSTANCES.H2SO4)) {
    return {
      status: "gaz_ajralishi",
      intensity: 6,
      description:
        "Rux kislota bilan reaksiyaga kirishib, vodorod gazi ajratadi.",
      equation: "Zn + H2SO4 -> ZnSO4 + H2",
    };
  }

  // Bariy + Sulfat (BaCl2 + H2SO4)
  if (isPair(SUBSTANCES.BARIUM, SUBSTANCES.H2SO4)) {
    return {
      status: "chokma",
      intensity: 7,
      description:
        "Eritmada erimaydigan sutsimon oq rangli bariy sulfat (BaSO4) cho'kmasi tushadi.",
      equation: "BaCl2 + H2SO4 -> BaSO4 + 2HCl",
    };
  }

  // Temir + Oltingugurt (Fe + S)
  if (isPair(SUBSTANCES.IRON, SUBSTANCES.SULFUR)) {
    return {
      status: "yonish",
      intensity: 5,
      description:
        "Temir va oltingugurt qizdirilganda birikib, qora tusli temir sulfidini hosil qiladi.",
      equation: "Fe + S -> FeS",
    };
  }

  const name1 = a?.name || "Birinchi modda";
  const name2 = b?.name || "Ikkinchi modda";
  if (norm(name1) === norm(name2)) {
    return {
      status: "neytral",
      intensity: 1,
      description:
        "Bir xil moddalar aralashtirildi, hech qanday kimyoviy reaksiya sodir bo'lmadi.",
      equation: null,
    };
  }

  return {
    status: "neytral",
    intensity: 2,
    description: `${name1} va ${name2} xona sharoitida sezilarli reaksiyaga kirishmadi yoki neytral aralashma hosil bo'ldi.`,
    equation: null,
  };
};

export const analyzeReaction = async ({ a, b }, { signal } = {}) => {
  if (!isConfigured()) {
    return fallbackReaction({ a, b });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: buildPrompt({ a, b }) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal,
    });

    if (res.status === 429) {
      return fallbackReaction({ a, b });
    }
    if (!res.ok) {
      return fallbackReaction({ a, b });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallbackReaction({ a, b });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fallbackReaction({ a, b });
    }
    return normalize(parsed);
  } catch (err) {
    return fallbackReaction({ a, b });
  }
};
