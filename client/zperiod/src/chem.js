// Chemistry helpers exported as plain ES functions for the rest of SmartLab.
// The balancer is Zperiod's (dependency-free); molar mass uses Zperiod's element masses.
export {
  balanceEquation,
  formatBalancedEquation,
  normalizeText as normalizeEquationText,
} from "../js/modules/equationBalancer.js";

import { ATOMIC_MASS } from "./elements.js";

// Parses "Ca(OH)2", "CuSO4·5H2O", "CuSO4.5H2O" → { Ca: 1, O: 2, H: 2 }.
export function parseFormula(formula) {
  const counts = {};
  const add = (sym, n) => { counts[sym] = (counts[sym] || 0) + n; };
  const parsePart = (text) => {
    const stack = [{}];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "(" || ch === "[") {
        stack.push({});
        i++;
      } else if (ch === ")" || ch === "]") {
        const group = stack.pop();
        i++;
        const m = /^\d+/.exec(text.slice(i));
        const mult = m ? parseInt(m[0], 10) : 1;
        if (m) i += m[0].length;
        const top = stack[stack.length - 1];
        for (const [s, n] of Object.entries(group)) top[s] = (top[s] || 0) + n * mult;
      } else {
        const m = /^([A-Z][a-z]?)(\d*)/.exec(text.slice(i));
        if (!m) throw new Error(`Noto'g'ri formula: ${formula}`);
        const top = stack[stack.length - 1];
        top[m[1]] = (top[m[1]] || 0) + (m[2] ? parseInt(m[2], 10) : 1);
        i += m[0].length;
      }
    }
    if (stack.length !== 1) throw new Error(`Qavslar mos emas: ${formula}`);
    return stack[0];
  };
  for (const part of String(formula).replace(/\s+/g, "").split(/[·.*]/)) {
    if (!part) continue;
    const m = /^(\d+)(.*)$/.exec(part);
    const mult = m ? parseInt(m[1], 10) : 1;
    const body = m ? m[2] : part;
    for (const [s, n] of Object.entries(parsePart(body))) add(s, n * mult);
  }
  return counts;
}

// Molar mass in g/mol (null when the formula contains an unknown symbol).
export function molarMass(formula) {
  try {
    let total = 0;
    for (const [sym, n] of Object.entries(parseFormula(formula))) {
      const m = ATOMIC_MASS[sym];
      if (!m) return null;
      total += m * n;
    }
    return Math.round(total * 1000) / 1000;
  } catch {
    return null;
  }
}
