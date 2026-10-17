import { ACID_BASE_RULES } from "./acidBase.js";
import { PRECIPITATION_RULES } from "./precipitation.js";
import { COMPLEX_RULES } from "./complexes.js";
import { REDOX_RULES } from "./redox.js";
import { GAS_RULES } from "./gases.js";
import { CATALYSIS_RULES } from "./catalysis.js";
import { METAL_RULES } from "./metals.js";
import { ALKALI_RULES } from "./alkali.js";
import { HEATING_RULES } from "./heating.js";
import { COMBUSTION_RULES } from "./combustion.js";
import { DANGER_RULES } from "./danger.js";
import { PHYSICAL_RULES } from "./physical.js";

// Order matters: fast ionic equilibria first so later rules see settled concentrations, slow physical changes last.
export const RULES = [
  ...ACID_BASE_RULES,
  ...PRECIPITATION_RULES,
  ...COMPLEX_RULES,
  ...REDOX_RULES,
  ...GAS_RULES,
  ...CATALYSIS_RULES,
  ...METAL_RULES,
  ...ALKALI_RULES,
  ...HEATING_RULES,
  ...COMBUSTION_RULES,
  ...DANGER_RULES,
  ...PHYSICAL_RULES,
];
