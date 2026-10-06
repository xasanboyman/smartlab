// Path module
import path from "path";

// Vite
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || "/oracle/vlab/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // maplibre-gl web worker'i Vite pre-bundle'da buzilib, GeoJSON qatlamlari yuklanmaydi.
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    rollupOptions: {
      output: {
        // Rapier ships its physics engine as one big JS blob; keeping the heavy 3D libraries in their
        // own chunks lets the browser fetch them in parallel and reuse them across the 3D pages.
        manualChunks: {
          three: ["three", "@react-three/fiber"],
          rapier: ["@react-three/rapier"],
          postfx: ["@react-three/postprocessing", "postprocessing", "n8ao"],
        },
      },
    },
  },
});
