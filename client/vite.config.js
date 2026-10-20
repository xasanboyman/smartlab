// Path module
import path from "path";

// Vite
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Vendored Zperiod (client/zperiod): its stylesheets are scoped under .zp-root at build time.
import { zperiodCssScope } from "./zperiod/src/scopeCss.js";

// Heavy 3D libraries get their own chunks so the browser fetches them in parallel
// and reuses them across the 3D pages. The function form matches only the library
// itself: the object form also swept every shared dependency of rapier (three-stdlib,
// drei helpers...) into the 2.3 MB rapier chunk, which then loaded on every 3D page.
const VENDOR_CHUNKS = [
  ["rapier", [/\/@react-three\/rapier\//, /\/@dimforge\/rapier3d-compat\//]],
  ["postfx", [/\/@react-three\/postprocessing\//, /\/node_modules\/postprocessing\//, /\/node_modules\/n8ao\//]],
  ["pixi", [/\/node_modules\/pixi\.js\//, /\/node_modules\/pixi-filters\//, /\/node_modules\/@pixi\//]],
  ["stdlib", [/\/node_modules\/three-stdlib\//]],
  // Only the core build: three/build also holds the WebGPU/TSL builds, which must stay page-local.
  ["three", [/\/node_modules\/three\/build\/three\.(module|core)\.js/, /\/@react-three\/fiber\//]],
];

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : (process.env.VITE_BASE || "/oracle/vlab/"),
  plugins: [react(), zperiodCssScope()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@zperiod": path.resolve(__dirname, "./zperiod/src"),
    },
  },
  // maplibre-gl web worker'i Vite pre-bundle'da buzilib, GeoJSON qatlamlari yuklanmaydi.
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // Nested copies (node_modules/<pkg>/node_modules/three, an older r165) must stay with the
          // page that owns them, or every page would evaluate three twice.
          if (id.split("node_modules/").length > 2) return undefined;
          for (const [name, patterns] of VENDOR_CHUNKS) {
            if (patterns.some((re) => re.test(id))) return name;
          }
          return undefined;
        },
      },
    },
  },
}));
