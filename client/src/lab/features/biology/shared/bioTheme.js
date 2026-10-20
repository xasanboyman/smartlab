// Biology "lab console" look: neutral dark panels + emerald accent, scoped to the
// biology workspaces via CSS variables so the rest of the app keeps its palette.
import { ACESFilmicToneMapping } from "three";

export const BIO_ACCENT = "#059669";
export const BIO_ACCENT_LIGHT = "#34d399";

export const BIO_THEME_VARS = {
  "--background": "222 28% 6%",
  "--foreground": "210 20% 96%",
  "--card": "222 24% 9%",
  "--card-foreground": "210 20% 96%",
  "--popover": "222 24% 9%",
  "--popover-foreground": "210 20% 96%",
  "--primary": "160 84% 39%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "220 18% 15%",
  "--secondary-foreground": "210 20% 96%",
  "--muted": "220 18% 15%",
  "--muted-foreground": "215 14% 66%",
  "--accent": "160 60% 14%",
  "--accent-foreground": "152 76% 80%",
  "--border": "220 16% 17%",
  "--input": "220 16% 17%",
  "--ring": "160 84% 39%",
};

// Day variant for pages with a light/dark studio toggle (anatomy simulator).
export const BIO_THEME_VARS_LIGHT = {
  "--background": "210 24% 97%",
  "--foreground": "222 30% 12%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 30% 12%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 30% 12%",
  "--primary": "160 84% 32%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "214 22% 93%",
  "--secondary-foreground": "222 30% 12%",
  "--muted": "214 22% 93%",
  "--muted-foreground": "215 14% 42%",
  "--accent": "152 60% 92%",
  "--accent-foreground": "160 84% 22%",
  "--border": "214 20% 86%",
  "--input": "214 20% 86%",
  "--ring": "160 84% 32%",
};

// Spread into <LabWorkspace {...BIO_WORKSPACE} />.
export const BIO_WORKSPACE = {
  backTo: "/biology",
  backLabel: "Biologiya",
  rootClassName: "bio-console dark",
  rootStyle: BIO_THEME_VARS,
};

// Renderer settings shared by every biology <Scene>: filmic tone mapping + sRGB output.
export const BIO_GL = {
  toneMapping: ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  antialias: true,
  powerPreference: "high-performance",
};

export const BIO_SCENE_BG = "#0b1018";
