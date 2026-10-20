// Asset helpers shared by the biology pages: base-prefixed URLs, the local Draco
// decoder (no CDN round-trip) and warm-up preloads.
import { useGLTF } from "@react-three/drei";

const BASE = import.meta.env.BASE_URL || "/";

// "models/x.glb" -> "/oracle/vlab/models/x.glb" (prod base) without doubling slashes.
export const assetUrl = (path) => `${BASE}${String(path).replace(/^\//, "")}`.replace(/\/{2,}/g, "/");

export const DRACO_PATH = assetUrl("draco/");

export const useBioGLTF = (url) => useGLTF(url, DRACO_PATH);

export const preloadGLTF = (url) => useGLTF.preload(url, DRACO_PATH);

// Warm the Draco decoder + a model while the user still reads the page intro.
export const preloadWhenIdle = (url) => {
  const run = () => preloadGLTF(url);
  if (typeof window === "undefined") return;
  if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 1500 });
  else setTimeout(run, 300);
};
