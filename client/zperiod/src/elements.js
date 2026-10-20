// Element data adapter: Zperiod's element database (+ Uzbek names) as the single element source
// for SmartLab. Returns plain objects; consumers that need CPK render colours add them on top.
import { elements, finallyData } from "../js/data/elementsData.js";
import { uz_elements } from "../js/data/locales/uz.js";

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export const ELEMENT_LIST = elements.map((e) => {
  const d = finallyData[e.number] || {};
  return {
    number: e.number,
    symbol: e.symbol,
    name: uz_elements[e.number]?.name || e.name,
    nameEn: e.name,
    category: e.category,
    group: d.level1_basic?.group ?? null,
    period: num(d.level1_basic?.period),
    phase: d.level1_basic?.phaseAtSTP ?? null,
    mass: num(d.level2_atomic?.mass?.highSchool),
    electronegativity: d.level3_properties?.physical?.electronegativity ?? null,
    configuration: d.level3_properties?.electronic?.configuration ?? null,
  };
});

export const ELEMENT_BY_SYMBOL = Object.fromEntries(ELEMENT_LIST.map((e) => [e.symbol, e]));
export const ELEMENT_BY_NUMBER = Object.fromEntries(ELEMENT_LIST.map((e) => [e.number, e]));

export const getElement = (symbolOrNumber) =>
  ELEMENT_BY_SYMBOL[symbolOrNumber] || ELEMENT_BY_NUMBER[Number(symbolOrNumber)] || null;

export const ATOMIC_MASS = Object.fromEntries(ELEMENT_LIST.filter((e) => e.mass).map((e) => [e.symbol, e.mass]));
