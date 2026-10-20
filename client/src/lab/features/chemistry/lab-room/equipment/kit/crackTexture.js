import { CanvasTexture, SRGBColorSpace } from "three";

let cached = null;

const branch = (ctx, x, y, angle, length, depth, random) => {
  if (depth <= 0 || length < 4) return;
  const steps = 3 + Math.floor(random() * 3);
  let cx = x;
  let cy = y;
  let a = angle;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (let i = 0; i < steps; i += 1) {
    a += (random() - 0.5) * 0.9;
    const seg = length / steps;
    cx += Math.cos(a) * seg;
    cy += Math.sin(a) * seg;
    ctx.lineTo(cx, cy);
    if (random() < 0.45) branch(ctx, cx, cy, a + (random() < 0.5 ? 1 : -1) * (0.5 + random() * 0.8), length * 0.45, depth - 1, random);
  }
  ctx.stroke();
};

// Star-shaped crack: bright chipped edges with a dark hairline, on a transparent canvas.
export const crackTexture = () => {
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const arms = 6;
  for (const [width, color] of [[5, "rgba(255,255,255,0.35)"], [2.2, "rgba(40,48,52,0.9)"], [0.9, "rgba(255,255,255,0.8)"]]) {
    seed = 7;
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    for (let i = 0; i < arms; i += 1) {
      const angle = (i / arms) * Math.PI * 2 + random() * 0.6;
      branch(ctx, size / 2, size / 2, angle, 60 + random() * 50, 3, random);
    }
  }
  // Impact centre: a small crushed spot.
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, 14);
  g.addColorStop(0, "rgba(255,255,255,0.75)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(size / 2 - 14, size / 2 - 14, 28, 28);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  cached = texture;
  return texture;
};
