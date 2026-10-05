/**
 * NexusLab 3D — HTML-in-Canvas & Interactive Spatial Bridge
 * Implements Chrome 150/155 HTML-in-Canvas standards, 3D anatomical spatial pins,
 * audio narration, and multi-preset lighting engine.
 */
import * as THREE from "three";

// 1. Feature detection for Chrome HTML-in-Canvas API
export const checkHtmlCanvasSupport = () => {
  if (typeof window === "undefined") return { supported: false, version: null };

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  const ctx2d = canvas.getContext("2d");

  const hasSubImage = gl && typeof gl.texElementSubImage2D === "function";
  const hasImage = gl && typeof gl.texElementImage2D === "function";
  const has2DDraw = ctx2d && typeof ctx2d.drawElementImage === "function";

  if (hasSubImage) {
    return { supported: true, version: "chrome-155+", mode: "texElementSubImage2D" };
  }
  if (hasImage) {
    return { supported: true, version: "chrome-150", mode: "texElementImage2D" };
  }
  if (has2DDraw) {
    return { supported: true, version: "2d-context", mode: "drawElementImage" };
  }

  return { supported: false, version: "standard-webgl", mode: "dom-projection-fallback" };
};

// 2. Prepare canvas element with modern HTML-in-Canvas attributes (Chrome 155+ vs legacy)
export const setupCanvasDrawable = (canvasElement) => {
  if (!canvasElement) return;

  if ("content" in HTMLCanvasElement.prototype) {
    // Chrome 155+ standardized attribute
    canvasElement.setAttribute("content", "drawable");
  } else if ("layoutsubtree" in HTMLCanvasElement.prototype) {
    // Chrome 148-154 legacy attribute
    canvasElement.setAttribute("layoutsubtree", "");
  }
};

// 3. Key 3D anatomical landmarks for spatial pins (coordinates in model space)
export const ANATOMICAL_PINS = [
  {
    id: "brain",
    label: "Bosh miya",
    latin: "Encephalon",
    system: "Asab markazi",
    pos: [0, 68, 2],
    side: "right",
    lineLen: 120,
    yOffset: -20,
    desc: "100 milliard neyron va tafakkur markazi",
    icon: "Brain",
  },
  {
    id: "lungs",
    label: "O'pka",
    latin: "Pulmones",
    system: "Nafas olish",
    pos: [-8, 42, 4],
    side: "left",
    lineLen: 130,
    yOffset: -15,
    desc: "Qonni kislorod bilan to'yintiradi",
    icon: "Wind",
  },
  {
    id: "heart",
    label: "Yurak",
    latin: "Cor",
    system: "Qon aylanish",
    pos: [2.5, 41, 6],
    side: "right",
    lineLen: 135,
    yOffset: -10,
    desc: "Kuniga 100 000 marta uruvchi nasos",
    icon: "Heart",
  },
  {
    id: "liver",
    label: "Jigar",
    latin: "Hepar",
    system: "Hazm & Filtr",
    pos: [-5, 29, 7],
    side: "left",
    lineLen: 140,
    yOffset: 0,
    desc: "500 dan ortiq kimyoviy jarayon fabrikasi",
    icon: "Activity",
  },
  {
    id: "stomach",
    label: "Oshqozon",
    latin: "Ventriculus",
    system: "Hazm qilish",
    pos: [5, 27, 6],
    side: "right",
    lineLen: 145,
    yOffset: 5,
    desc: "Oziq moddalarni parchalash rezervuari",
    icon: "UtensilsCrossed",
  },
  {
    id: "kidneys",
    label: "Buyraklar",
    latin: "Renes",
    system: "Ayirish tizimi",
    pos: [7, 21, -2],
    side: "right",
    lineLen: 155,
    yOffset: 25,
    desc: "Kuniga 180 litr qonni tozalovchi filtr",
    icon: "Droplets",
  },
  {
    id: "pelvis",
    label: "Tos suyagi",
    latin: "Pelvis",
    system: "Tayanch-harakat",
    pos: [0, 6, 1],
    side: "left",
    lineLen: 130,
    yOffset: 15,
    desc: "Tananing og'irligini oyoqlarga uzatuvchi markaz",
    icon: "Bone",
  },
  {
    id: "muscles",
    label: "Mushaklar",
    latin: "Musculi",
    system: "Harakat tizimi",
    pos: [-7, -26, 4],
    side: "left",
    lineLen: 125,
    yOffset: 20,
    desc: "Tanani harakatga keltiruvchi 600+ mushaklar",
    icon: "Dumbbell",
  },
];

// 4. Project 3D coordinates to Screen 2D pixel coordinates
const _projVec = new THREE.Vector3();
export const projectToScreen = (coords3D, camera, canvasWidth, canvasHeight) => {
  if (!camera || !coords3D) return { x: 0, y: 0, visible: false };

  _projVec.set(coords3D[0], coords3D[1], coords3D[2]);
  _projVec.project(camera);

  // Check if behind camera
  if (_projVec.z > 1.0) {
    return { x: 0, y: 0, visible: false };
  }

  const x = (_projVec.x * 0.5 + 0.5) * canvasWidth;
  const y = (-(_projVec.y * 0.5) + 0.5) * canvasHeight;

  return {
    x: Math.round(x),
    y: Math.round(y),
    visible: x >= 20 && x <= canvasWidth - 20 && y >= 20 && y <= canvasHeight - 20,
  };
};

// 5. Speech Synthesis Narration (Uzbek or natural voice)
export class AnatomyNarrator {
  constructor() {
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
  }

  speak(text, onEnd) {
    if (!this.synth) return;
    this.stop();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best available voice (prefer Uzbek, Russian, or Turkish if available, fallback to default)
    const voices = this.synth.getVoices();
    const uzVoice = voices.find((v) => v.lang.startsWith("uz") || v.lang.startsWith("tr"));
    if (uzVoice) utterance.voice = uzVoice;

    utterance.onend = () => {
      this.isPlaying = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      this.isPlaying = false;
      onEnd?.();
    };

    this.isPlaying = true;
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
    }
  }
}

// 6. Lighting presets configuration
export const LIGHTING_PRESETS = {
  medical: {
    id: "medical",
    name: "Klinik Studiya",
    icon: "Sun",
    keyColor: 0xfff8f0,
    keyIntensity: 0.85,
    fillColor: 0xe0f2fe,
    fillIntensity: 0.4,
    rimColor: 0xc7d2fe,
    rimIntensity: 0.45,
    hemiSky: 0xf8fafc,
    hemiGround: 0x27272a,
    hemiIntensity: 0.45,
    envIntensity: 0.75,
    exposure: 1.0,
  },
  cyber: {
    id: "cyber",
    name: "Kiber Hologramma",
    icon: "Zap",
    keyColor: 0x06b6d4, // Cyan
    keyIntensity: 1.1,
    fillColor: 0x8b5cf6, // Violet
    fillIntensity: 0.55,
    rimColor: 0x10b981, // Emerald rim
    rimIntensity: 0.9,
    hemiSky: 0x0f172a,
    hemiGround: 0x020617,
    hemiIntensity: 0.35,
    envIntensity: 0.45,
    exposure: 1.15,
  },
  xray: {
    id: "xray",
    name: "Rentgen (X-Ray)",
    icon: "Eye",
    keyColor: 0xe2e8f0,
    keyIntensity: 0.95,
    fillColor: 0x38bdf8,
    fillIntensity: 0.3,
    rimColor: 0xffffff,
    rimIntensity: 0.7,
    hemiSky: 0x1e293b,
    hemiGround: 0x090d16,
    hemiIntensity: 0.3,
    envIntensity: 0.3,
    exposure: 0.9,
  },
};
