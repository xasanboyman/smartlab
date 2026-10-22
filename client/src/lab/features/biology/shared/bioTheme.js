// Biology "lab console" look: neutral dark panels + emerald accent, scoped to the
// biology workspaces via CSS variables so the rest of the app keeps its palette.
import { ACESFilmicToneMapping } from "three";

export const BIO_ACCENT = "#059669";
export const BIO_ACCENT_LIGHT = "#34d399";

export const BIO_THEME_VARS = {
  "--background": "222 28% 6%",
  "--foreground": "210 40% 98%",
  "--card": "222 24% 10%",
  "--card-foreground": "210 40% 98%",
  "--popover": "222 24% 10%",
  "--popover-foreground": "210 40% 98%",
  "--primary": "160 84% 39%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "220 18% 16%",
  "--secondary-foreground": "210 40% 98%",
  "--muted": "220 18% 16%",
  "--muted-foreground": "215 22% 82%",
  "--accent": "160 60% 16%",
  "--accent-foreground": "152 85% 88%",
  "--border": "220 18% 22%",
  "--input": "220 18% 22%",
  "--ring": "160 84% 45%",
};

// Day variant for pages with a light/dark studio toggle (anatomy simulator).
export const BIO_THEME_VARS_LIGHT = {
  "--background": "210 24% 97%",
  "--foreground": "222 40% 10%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 40% 10%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 40% 10%",
  "--primary": "160 84% 32%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "214 22% 92%",
  "--secondary-foreground": "222 40% 10%",
  "--muted": "214 22% 92%",
  "--muted-foreground": "220 25% 28%",
  "--accent": "152 60% 92%",
  "--accent-foreground": "160 84% 22%",
  "--border": "214 20% 80%",
  "--input": "214 20% 80%",
  "--ring": "160 84% 32%",
};

// Spread into <LabWorkspace {...BIO_WORKSPACE} />.
export const BIO_WORKSPACE = {
  backTo: "/biology",
  backLabel: "Biologiya",
  rootClassName: "bio-console",
};

// Renderer settings shared by every biology <Scene>: filmic tone mapping + sRGB output.
export const BIO_GL = {
  toneMapping: ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  antialias: true,
  powerPreference: "high-performance",
};

export const BIO_SCENE_BG = "#0b1018";
