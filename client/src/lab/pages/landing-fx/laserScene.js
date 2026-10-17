// PixiJS port of Zyie/pixijs-html-in-canvas: the live landing page is captured as an HTMLSource
// texture, sliced into chunks by a wandering laser that a cat chases, and healed again.
// mode "canvas": page lives inside the canvas and gets sliced; mode "dom": laser + cat only, on a
// transparent overlay above the normal page (browsers without the API).
import { Application, Assets, Container, Graphics, MeshRope, Point, Rectangle, Sprite, Texture } from "pixi.js";
import { HTMLSource } from "pixi.js/html-source";
import { AdvancedBloomFilter, DropShadowFilter, GlowFilter } from "pixi-filters";
import { backdropHtml } from "./backdrop";

const PINK = 0xe72264;
const PINK_HOT = 0xff4a85;
const PINK_SOFT = 0xff6ea3;
const PINK_LIGHT = 0xff9ac2;
const PINK_PALE = 0xffd6e3;
const WHITE = 0xffffff;
const SHADOW = 0x05030d;

const config = { laserRadius: 30, chunkSize: 22, laserSpeed: 0.009, laserChaos: 0.49, laserAngle: 17, laserMouse: false, laserMouseSmoothness: 0.93 };
const START_DELAY = 120;
const IMPACT_THRESHOLD = 0.5;
const IMPACT_DURATION = 28;
const TRAIL_MAX_LIFE = 50;
const HEAL_FADE_TICKS = 18;
const HEAL_HOLD_TICKS = 60;
const LASER_RAMP_IN_FRAMES = 50;
const LASER_MODE_BLEND = 0.99;
const CAT_ENTRY_PROGRESS = 0.38;

const randomBetween = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const nextDoubleFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const smallestAngle = (target, current) => {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
const rotateInto = (out, x, y, rot) => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  out.x = x * c - y * s;
  out.y = x * s + y * c;
};
const weightedColor = (stops) => {
  const roll = Math.random();
  for (const [t, c] of stops) if (roll < t) return c;
  return stops[stops.length - 1][1];
};

/* ── cat ─────────────────────────────────────────────── */

const CAT_PARTS = ["body-1", "body-2", "body-3", "body-4", "head-centre", "head-left-1", "head-left-2", "head-right-1", "head-right-2", "front-paw", "paw-blur-1", "paw-blur-2", "paw-blur-3", "paw-blur-4", "tail", "shadow"];

class CatTail {
  constructor({ joints = 12, length = 90, friction = 0.92, scale = 1, texture }) {
    this.scale = scale;
    this.joints = joints;
    this.link = length / joints;
    this.friction = friction;
    this.px = [];
    this.py = [];
    this.ox = [];
    this.oy = [];
    this.points = [];
    this.first = true;
    for (let i = 0; i <= joints; i++) {
      this.px[i] = 0;
      this.py[i] = i * this.link;
      this.ox[i] = 0;
      this.oy[i] = this.py[i];
      this.points.push(new Point(0, (i * this.link) / scale));
    }
    this.view = new MeshRope({ texture, points: this.points, textureScale: 0 });
    this.view.scale.set(scale);
  }
  reset(x, y) {
    for (let i = 0; i <= this.joints; i++) {
      this.px[i] = x;
      this.py[i] = y + i * this.link;
      this.ox[i] = this.px[i];
      this.oy[i] = this.py[i];
      this.points[i].x = this.px[i] / this.scale;
      this.points[i].y = this.py[i] / this.scale;
    }
    this.first = false;
  }
  update(x, y) {
    if (this.first) return this.reset(x, y);
    for (let i = 0; i <= this.joints; i++) {
      const tx = this.px[i];
      const ty = this.py[i];
      this.px[i] += this.friction * (this.px[i] - this.ox[i]);
      this.py[i] += this.friction * (this.py[i] - this.oy[i]);
      this.ox[i] = tx;
      this.oy[i] = ty;
    }
    for (let it = 0; it < 4; it++) {
      this.px[0] = x;
      this.py[0] = y;
      for (let i = 1; i <= this.joints; i++) {
        const dx = this.px[i] - this.px[i - 1];
        const dy = this.py[i] - this.py[i - 1];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = (dist - this.link) / dist;
        const ox = (diff * dx) / 2;
        const oy = (diff * dy) / 2;
        this.px[i] -= ox;
        this.py[i] -= oy;
        this.px[i - 1] += ox;
        this.py[i - 1] += oy;
      }
    }
    this.px[0] = x;
    this.py[0] = y;
    for (let i = 0; i <= this.joints; i++) {
      this.points[i].x = this.px[i] / this.scale;
      this.points[i].y = this.py[i] / this.scale;
    }
  }
}

class Cat {
  constructor({ scale = 2, power = 0.9, skid = 0.99, tex }) {
    this.scale = scale;
    this.power = power;
    this.skid = skid;
    this.view = new Container();
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.bodyFrames = ["body-1", "body-2", "body-3", "body-4"].map(tex);
    this.armFrames = ["paw-blur-1", "paw-blur-2", "paw-blur-3", "paw-blur-4"].map(tex);
    this.headFrames = ["head-left-2", "head-left-1", "head-centre", "head-right-1", "head-right-2", "head-right-1", "head-centre", "head-left-1"].map(tex);
    this.body = new Sprite(this.bodyFrames[0]);
    this.body.anchor.set(0.5, 0.2);
    this.head = new Sprite(this.headFrames[2]);
    this.head.anchor.set(0.5, 0.7);
    this.leftPaw = new Sprite(tex("front-paw"));
    this.leftPaw.anchor.set(0.5);
    this.rightPaw = new Sprite(tex("front-paw"));
    this.rightPaw.anchor.set(0.5);
    this.leftArm = new Sprite(this.armFrames[0]);
    this.leftArm.anchor.set(0.5, 0);
    this.rightArm = new Sprite(this.armFrames[0]);
    this.rightArm.anchor.set(0.5, 0);
    this.shadowView = new Sprite(tex("shadow"));
    this.shadowView.anchor.set(0.5);
    this.shadowView.alpha = 0.55;
    this.shadowView.scale.set(0.7 * scale, 0.28 * scale);
    this.tail = new CatTail({ joints: 14, length: 38 * scale, friction: 0.9, scale, texture: tex("tail") });
    this.tailView = this.tail.view;
    this.view.scale.set(scale);
    this.view.addChild(this.rightPaw, this.leftPaw, this.body, this.leftArm, this.rightArm, this.head);
    this.tick = 0;
    this.ease = 0;
    this.hasEase = false;
    this.lastT = null;
    this.wobble = Math.random() * 1000;
    this.lp = { x: 0, y: 0 };
    this.rp = { x: 0, y: 0 };
    this.tp = { x: 0, y: 0 };
  }
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = this.velocity.y = 0;
    this.view.x = x;
    this.view.y = y;
    this.shadowView.x = x;
    this.shadowView.y = y + 14 * this.scale;
    this.tail.reset(x, y);
  }
  update(dt, tx, ty) {
    if (!this.lastT) this.lastT = { x: tx, y: ty };
    const lvx = tx - this.lastT.x;
    const lvy = ty - this.lastT.y;
    this.lastT = { x: tx, y: ty };
    const sp = Math.hypot(this.velocity.x, this.velocity.y);
    const cdx = sp > 0.1 ? this.velocity.x / sp : 0;
    const cdy = sp > 0.1 ? this.velocity.y / sp : 0;
    this.wobble += dt;
    const wx = Math.sin(this.wobble * 0.017) * 110 + Math.sin(this.wobble * 0.073) * 40 + Math.sin(this.wobble * 0.191) * 15;
    const wy = Math.cos(this.wobble * 0.021) * 110 + Math.cos(this.wobble * 0.089) * 40 + Math.cos(this.wobble * 0.211) * 15;
    const leadX = tx + lvx * 22 + cdx * 55 + wx;
    const leadY = ty + lvy * 22 + cdy * 55 + wy;
    let dx = leadX - this.position.x;
    let dy = leadY - this.position.y;
    const len = Math.hypot(dx, dy);
    const maxSpeed = 7 + clamp(len / 500, 0, 1) * 6;
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    this.velocity.x += dx * this.power * dt;
    this.velocity.y += dy * this.power * dt;
    const fr = Math.pow(this.skid, dt);
    this.velocity.x *= fr;
    this.velocity.y *= fr;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > maxSpeed && speed > 0) {
      this.velocity.x = (this.velocity.x / speed) * maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * maxSpeed;
    }
    const fx = Math.sin(this.body.rotation);
    const fy = -Math.cos(this.body.rotation);
    const fdot = this.velocity.x * fx + this.velocity.y * fy;
    if (fdot < 0) {
      this.velocity.x -= fx * fdot * 0.45;
      this.velocity.y -= fy * fdot * 0.45;
    }
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    const rdx = tx - this.position.x;
    const rdy = ty - this.position.y;
    const rlen = Math.hypot(rdx, rdy);
    const raw = rlen > 5 ? -Math.atan2(rdx, rdy) : this.ease;
    if (!this.hasEase) {
      this.ease = raw;
      this.hasEase = true;
    } else this.ease += smallestAngle(raw, this.ease) * 0.22;
    const dir = this.ease;
    this.animate(this.head, this.headFrames, 0.5, 0);
    this.animate(this.body, this.bodyFrames, 1, 0);
    this.animate(this.leftArm, this.armFrames, 0.5, 0);
    this.animate(this.rightArm, this.armFrames, 0.5, 2);
    this.body.rotation += smallestAngle(dir + Math.PI + Math.sin(this.tick * 0.5) * 0.18, this.body.rotation) * 0.3;
    this.head.rotation += smallestAngle(dir + Math.PI + Math.cos(this.tick) * 0.06, this.head.rotation) * 0.45;
    this.tick += 0.12 * Math.min(speed, 2) * dt;
    this.view.x = this.position.x;
    this.view.y = this.position.y;
    this.shadowView.x = this.position.x;
    this.shadowView.y = this.position.y + 14 * this.scale;
    rotateInto(this.leftArm, 9, 0, this.body.rotation);
    rotateInto(this.rightArm, -9, 0, this.body.rotation);
    const lsx = this.position.x + this.leftArm.x * this.scale;
    const lsy = this.position.y + this.leftArm.y * this.scale;
    const dirL = -Math.atan2(tx - lsx, ty - lsy);
    const rsx = this.position.x + this.rightArm.x * this.scale;
    const rsy = this.position.y + this.rightArm.y * this.scale;
    const dirR = -Math.atan2(tx - rsx, ty - rsy);
    rotateInto(this.lp, 0, 18 + Math.sin(this.tick) * 3, dirL + Math.sin(this.tick) * 0.08);
    this.leftPaw.x = this.leftArm.x + this.lp.x;
    this.leftPaw.y = this.leftArm.y + this.lp.y;
    rotateInto(this.rp, 0, 18 + Math.sin(this.tick + Math.PI) * 3, dirR - Math.sin(this.tick) * 0.08);
    this.rightPaw.x = this.rightArm.x + this.rp.x;
    this.rightPaw.y = this.rightArm.y + this.rp.y;
    this.leftArm.height = Math.hypot(this.lp.x, this.lp.y);
    this.leftArm.rotation = -Math.atan2(this.lp.x, this.lp.y);
    this.rightArm.height = Math.hypot(this.rp.x, this.rp.y);
    this.rightArm.rotation = -Math.atan2(this.rp.x, this.rp.y);
    this.body.scale.x = 1 + Math.sin(this.tick) * 0.04;
    this.body.scale.y = 1 / this.body.scale.x;
    this.head.scale.x = 1 + Math.cos(this.tick) * 0.025;
    this.head.scale.y = this.head.scale.x;
    this.head.pivot.y = 1 + Math.cos(this.tick);
    rotateInto(this.tp, 0, 14 * this.head.scale.x, this.body.rotation);
    this.tail.update(this.position.x + this.tp.x * this.scale, this.position.y + this.tp.y * this.scale);
  }
  animate(sprite, frames, speed, offset) {
    const raw = Math.floor((this.tick + offset) * speed);
    sprite.texture = frames[((raw % frames.length) + frames.length) % frames.length];
  }
}

/* ── laser + effects ─────────────────────────────────── */

const createLaser = () => ({ t: 0, x: 0, y: 0, prevX: 0, prevY: 0, emitterX: 0, emitterY: 0, resetCooldown: 0, startDelay: START_DELAY, rampIn: 0, angleSign: 1, impactFired: false, impactProgress: 0, shake: 0, prevMouse: false, transitionX: 0, transitionY: 0 });

const computeEmitter = (laser, tx, ty, time) => {
  const a = (config.laserAngle * laser.angleSign * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const len = Math.max(1400, Math.hypot(window.innerWidth, window.innerHeight) * 1.6);
  const wander = Math.sin(time * 0.5) * 40;
  laser.emitterX = tx - dx * len + -dy * wander;
  laser.emitterY = ty - dy * len + dx * wander;
};

const seedLaser = (laser, cx, cy) => {
  laser.t = 0;
  laser.x = laser.prevX = cx;
  laser.y = laser.prevY = cy;
  laser.angleSign = Math.random() < 0.5 ? -1 : 1;
  computeEmitter(laser, cx, cy, 0);
  laser.startDelay = START_DELAY;
  laser.rampIn = 0;
};

const emitSparks = (sparks, x, y, vx, vy, count) => {
  const speed = Math.hypot(vx, vy);
  for (let i = 0; i < count; i++) {
    const a = Math.atan2(vy, vx) + randomBetween(-1.1, 1.1);
    const burst = randomBetween(1.4, 4.2) + speed * 0.12;
    sparks.push({ x, y, vx: Math.cos(a) * burst, vy: Math.sin(a) * burst - randomBetween(0.2, 1.6), life: randomBetween(16, 34), maxLife: 34, size: Math.round(randomBetween(2, 4)), color: weightedColor([[0.55, PINK], [0.85, PINK_SOFT], [1, PINK_PALE]]) });
  }
};

const emitRadialBurst = (sparks, x, y, count, power) => {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + randomBetween(-0.18, 0.18);
    const burst = power * randomBetween(0.55, 1.4);
    sparks.push({ x, y, vx: Math.cos(a) * burst, vy: Math.sin(a) * burst, life: randomBetween(22, 46), maxLife: 46, size: Math.round(randomBetween(2, 5)), color: weightedColor([[0.45, PINK], [0.8, PINK_SOFT], [0.95, PINK_PALE], [1, WHITE]]) });
  }
};

const triggerImpact = (laser, sparks, x, y) => {
  laser.impactFired = true;
  laser.impactProgress = 0;
  laser.shake = 8;
  emitRadialBurst(sparks, x, y, 22, 6);
  emitRadialBurst(sparks, x, y, 14, 12);
};

const updateLaser = (deps, dt) => {
  const { laser, pageBounds, trail, sparks, mouseTarget } = deps;
  const cx = pageBounds.x + pageBounds.width / 2;
  const cy = pageBounds.y + pageBounds.height / 2;
  if (laser.resetCooldown > 0) {
    laser.resetCooldown -= dt;
    if (laser.resetCooldown <= 0) deps.resetDamage();
    laser.prevX = laser.x;
    laser.prevY = laser.y;
    return;
  }
  if (laser.shake > 0) laser.shake = Math.max(0, laser.shake - dt * 0.5);
  if (laser.impactFired) laser.impactProgress = Math.min(IMPACT_DURATION, laser.impactProgress + dt);
  if (laser.startDelay > 0) {
    laser.startDelay -= dt;
    laser.prevX = laser.x = cx;
    laser.prevY = laser.y = cy;
    laser.rampIn = 0;
    computeEmitter(laser, cx, cy, laser.t);
    if (!laser.impactFired && 1 - laser.startDelay / START_DELAY >= IMPACT_THRESHOLD) triggerImpact(laser, sparks, cx, cy);
    return;
  }
  laser.t += config.laserSpeed * dt;
  laser.rampIn = Math.min(1, laser.rampIn + dt / LASER_RAMP_IN_FRAMES);
  const ramp = smoothstep(0, 1, laser.rampIn);
  laser.prevX = laser.x;
  laser.prevY = laser.y;
  let tx;
  let ty;
  if (config.laserMouse) {
    tx = cx + (mouseTarget.x - cx) * ramp;
    ty = cy + (mouseTarget.y - cy) * ramp;
  } else {
    const rx = pageBounds.width * 0.44;
    const ry = pageBounds.height * 0.42;
    const t = laser.t;
    const chaos = config.laserChaos;
    let ox = Math.sin(t * 1.12) * rx + Math.sin(t * 0.41) * rx * 0.16;
    let oy = Math.sin(t * 0.83) * ry + Math.sin(t * 0.27) * ry * 0.22;
    ox += Math.sin(t * 3.73 + 0.7) * rx * 0.22 * chaos + Math.sin(t * 8.17 + 1.9) * rx * 0.12 * chaos;
    oy += Math.cos(t * 4.21 + 2.3) * ry * 0.22 * chaos + Math.cos(t * 9.31 + 0.5) * ry * 0.12 * chaos;
    tx = cx + ox * ramp;
    ty = cy + oy * ramp;
  }
  if (config.laserMouse !== laser.prevMouse) {
    laser.transitionX = laser.x - tx;
    laser.transitionY = laser.y - ty;
    laser.prevMouse = config.laserMouse;
  }
  const decay = Math.pow(LASER_MODE_BLEND, dt);
  laser.transitionX *= decay;
  laser.transitionY *= decay;
  if (config.laserMouse) {
    const f = 1 - Math.pow(config.laserMouseSmoothness, dt);
    laser.x += (tx + laser.transitionX - laser.x) * f;
    laser.y += (ty + laser.transitionY - laser.y) * f;
  } else {
    laser.x = tx + laser.transitionX;
    laser.y = ty + laser.transitionY;
  }
  computeEmitter(laser, laser.x, laser.y, laser.t);
  trail.push({ x: laser.x, y: laser.y, life: TRAIL_MAX_LIFE, size: randomBetween(3, 5) });
  if (trail.length > 180) trail.splice(0, trail.length - 180);
  const total = deps.totalChunkCount();
  if (total > 0 && deps.detachedChunkCount() / total > 0.9) laser.resetCooldown = 160;
};

const pixelRect = (g, x, y, size, color, alpha) => {
  const s = Math.max(1, Math.round(size));
  const half = Math.floor(s / 2);
  g.rect(Math.round(x) - half, Math.round(y) - half, s, s).fill({ color, alpha });
};

const drawImpact = (g, laser, x, y) => {
  const t = laser.impactProgress / IMPACT_DURATION;
  if (t >= 1) return;
  const rx = Math.round(x);
  const ry = Math.round(y);
  const r1 = t * 130;
  const a1 = Math.pow(1 - t, 1.4) * 0.9;
  if (a1 > 0.03) {
    g.rect(rx - Math.round(r1), ry - Math.round(r1), Math.round(r1 * 2), Math.round(r1 * 2)).stroke({ width: 3, color: PINK_PALE, alpha: a1 });
    g.rect(rx - Math.round(r1) - 4, ry - Math.round(r1) - 4, Math.round(r1 * 2) + 8, Math.round(r1 * 2) + 8).stroke({ width: 2, color: PINK, alpha: a1 * 0.6 });
  }
  const t2 = Math.min(1, t * 1.6);
  const r2 = t2 * 80;
  const a2 = Math.pow(1 - t2, 1.6) * 0.75;
  if (a2 > 0.03) g.rect(rx - Math.round(r2), ry - Math.round(r2), Math.round(r2 * 2), Math.round(r2 * 2)).stroke({ width: 2, color: PINK_HOT, alpha: a2 });
  const ft = Math.min(1, t * 4);
  const fa = Math.pow(1 - ft, 2.2);
  if (fa > 0.02) {
    pixelRect(g, x, y, 90, PINK_PALE, 0.3 * fa);
    pixelRect(g, x, y, 60, PINK_HOT, 0.55 * fa);
    pixelRect(g, x, y, 30, WHITE, 0.9 * fa);
  }
};

const drawTargetGlow = (g, x, y, intensity, pulse) => {
  const s = intensity * (0.88 + pulse * 0.22);
  pixelRect(g, x, y, 56 * s, PINK, 0.22 * intensity);
  pixelRect(g, x, y, 36 * s, PINK_HOT, 0.45 * intensity);
  pixelRect(g, x, y, 20 * s, PINK_LIGHT, 0.72 * intensity);
  pixelRect(g, x, y, 10 * s, PINK_PALE, intensity);
  pixelRect(g, x, y, 4, WHITE, intensity);
};

const TRAIL_LAYERS = [
  { cutoff: 0.03, taperPow: 0.8, alphaPow: 1.5, alphaMul: 0.4, shimmer: true, minAlpha: 0.02, width: 16, color: PINK },
  { cutoff: 0.04, taperPow: 0.9, alphaPow: 1.2, alphaMul: 0.72, shimmer: false, minAlpha: 0, width: 7, color: PINK_HOT },
  { cutoff: 0.08, taperPow: 1.1, alphaPow: 0.9, alphaMul: 1, shimmer: false, minAlpha: 0, width: 3, color: PINK_PALE },
];

const drawLaser = (g, laser, trail, sparks) => {
  g.clear();
  const now = performance.now();
  if (trail.length > 1) {
    const shimmer = 0.85 + Math.sin(now * 0.02) * 0.15;
    for (const spec of TRAIL_LAYERS) {
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const life = ((a.life + b.life) * 0.5) / TRAIL_MAX_LIFE;
        if (life < spec.cutoff) continue;
        const alpha = Math.pow(life, spec.alphaPow) * spec.alphaMul * (spec.shimmer ? shimmer : 1);
        if (alpha <= spec.minAlpha) continue;
        g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: spec.width * Math.pow(life, spec.taperPow), color: spec.color, alpha });
      }
    }
  }
  for (const p of trail) {
    const lr = p.life / TRAIL_MAX_LIFE;
    if (lr < 0.2) continue;
    pixelRect(g, p.x, p.y, Math.max(2, p.size * (0.55 + lr * 0.5)), WHITE, lr * (0.75 + Math.sin(p.x * 0.3 + p.y * 0.2) * 0.25) * 0.85);
  }
  for (const s of sparks) pixelRect(g, s.x, s.y, s.size, s.color, clamp(s.life / s.maxLife, 0, 1));
  if (laser.resetCooldown > 0) return;
  const topY = laser.emitterY;
  const sx = laser.shake > 0 ? (Math.random() - 0.5) * laser.shake * 2 : 0;
  const sy = laser.shake > 0 ? (Math.random() - 0.5) * laser.shake * 2 : 0;

  if (laser.startDelay > 0) {
    const p = 1 - laser.startDelay / START_DELAY;
    const emitterIn = smoothstep(0, 0.14, p);
    const chargeIn = smoothstep(0.05, IMPACT_THRESHOLD, p);
    const reticleAlpha = smoothstep(0.1, 0.4, p) * (1 - smoothstep(0.45, 0.68, p));
    const reticleIn = smoothstep(0.1, 0.4, p);
    const beamIn = Math.pow(smoothstep(0.3, IMPACT_THRESHOLD, p), 0.55);
    const focusIn = smoothstep(IMPACT_THRESHOLD - 0.02, 0.78, p);
    const pulse = 0.78 + Math.sin(now * 0.009) * 0.22;
    const fast = 0.7 + Math.sin(now * 0.03) * 0.3;
    if (emitterIn > 0.01) {
      const ep = chargeIn > 0 ? 1 + Math.sin(now * 0.025) * 0.25 : 1;
      pixelRect(g, laser.emitterX, topY, (22 + chargeIn * 10) * emitterIn * ep, PINK, 0.28 * emitterIn);
      pixelRect(g, laser.emitterX, topY, (12 + chargeIn * 6) * emitterIn * ep, PINK_HOT, 0.85 * emitterIn);
      pixelRect(g, laser.emitterX, topY, (5 + chargeIn * 3) * emitterIn, PINK_PALE, emitterIn);
    }
    if (chargeIn > 0.01) {
      for (let i = 0; i < 3; i++) {
        const rt = (((chargeIn * 2.2 + i * 0.33) % 1) + 1) % 1;
        const rr = 6 + rt * 44;
        const ra = (1 - rt) * 0.8 * chargeIn;
        if (ra < 0.02) continue;
        g.rect(Math.round(laser.emitterX - rr), Math.round(topY - rr), Math.round(rr * 2), Math.round(rr * 2)).stroke({ width: 2, color: PINK_HOT, alpha: ra });
      }
      if (Math.random() < 0.35 * chargeIn) {
        const ca = Math.random() * Math.PI * 2;
        const cd = randomBetween(8, 18);
        sparks.push({ x: laser.emitterX + Math.cos(ca) * cd, y: topY + Math.sin(ca) * cd, vx: Math.cos(ca) * randomBetween(0.4, 1.2), vy: Math.sin(ca) * randomBetween(0.4, 1.2), life: randomBetween(8, 16), maxLife: 16, size: 2, color: weightedColor([[0.5, PINK_LIGHT], [1, PINK_PALE]]) });
      }
    }
    if (reticleAlpha > 0.01) {
      const size = 10 + (1 - reticleIn) * 60;
      const outer = size + 16;
      const inner = size + 4;
      const ra = reticleAlpha * fast;
      const rx = Math.round(laser.x);
      const ry = Math.round(laser.y);
      const hs = Math.round(size);
      g.rect(rx - hs, ry - hs, hs * 2, hs * 2).stroke({ width: 2, color: PINK, alpha: 0.8 * ra });
      const ih = Math.round(size * 0.55);
      g.rect(rx - ih, ry - ih, ih * 2, ih * 2).stroke({ width: 2, color: PINK_LIGHT, alpha: 0.6 * ra });
      g.rect(rx - outer, ry - 1, outer - inner, 2).fill({ color: PINK, alpha: 0.85 * ra });
      g.rect(rx + inner, ry - 1, outer - inner, 2).fill({ color: PINK, alpha: 0.85 * ra });
      g.rect(rx - 1, ry - outer, 2, outer - inner).fill({ color: PINK, alpha: 0.85 * ra });
      g.rect(rx - 1, ry + inner, 2, outer - inner).fill({ color: PINK, alpha: 0.85 * ra });
    }
    if (beamIn > 0.01) {
      const ex = laser.emitterX + (laser.x - laser.emitterX) * beamIn;
      const ey = topY + (laser.y - topY) * beamIn;
      g.moveTo(laser.emitterX, topY).lineTo(ex, ey).stroke({ width: 18, color: PINK, alpha: 0.2 * beamIn });
      g.moveTo(laser.emitterX, topY).lineTo(ex, ey).stroke({ width: 10, color: PINK_HOT, alpha: 0.5 * beamIn });
      g.moveTo(laser.emitterX, topY).lineTo(ex, ey).stroke({ width: 5, color: PINK_PALE, alpha: 0.95 * beamIn });
      g.moveTo(laser.emitterX, topY).lineTo(ex, ey).stroke({ width: 2, color: WHITE, alpha: beamIn });
      if (beamIn < 1) {
        pixelRect(g, ex, ey, 20, PINK_HOT, 0.45);
        pixelRect(g, ex, ey, 10, PINK_PALE, 1);
        pixelRect(g, ex, ey, 4, WHITE, 1);
      }
    }
    if (laser.impactFired) drawImpact(g, laser, laser.x + sx, laser.y + sy);
    if (focusIn > 0.01) drawTargetGlow(g, laser.x + sx, laser.y + sy, focusIn, pulse);
    return;
  }

  const tx = laser.x + sx;
  const ty = laser.y + sy;
  g.moveTo(laser.emitterX, topY).lineTo(tx, ty).stroke({ width: 16, color: PINK, alpha: 0.18 });
  g.moveTo(laser.emitterX, topY).lineTo(tx, ty).stroke({ width: 9, color: PINK_HOT, alpha: 0.48 });
  g.moveTo(laser.emitterX, topY).lineTo(tx, ty).stroke({ width: 4, color: PINK_PALE, alpha: 0.95 });
  g.moveTo(laser.emitterX, topY).lineTo(tx, ty).stroke({ width: 2, color: WHITE, alpha: 1 });
  if (laser.impactFired && laser.impactProgress < IMPACT_DURATION) drawImpact(g, laser, tx, ty);
  drawTargetGlow(g, tx, ty, 1, 0.82 + Math.sin(now * 0.014) * 0.18);
  pixelRect(g, laser.emitterX, topY, 10, PINK, 0.9);
  pixelRect(g, laser.emitterX, topY, 5, PINK_PALE, 1);
};

/* ── chunks ──────────────────────────────────────────── */

const chunkHitsCircle = (c, x, y, r) => {
  const nx = clamp(x, c.localX, c.localX + c.width);
  const ny = clamp(y, c.localY, c.localY + c.height);
  return (x - nx) ** 2 + (y - ny) ** 2 <= r * r;
};

const resetMotion = (c) => Object.assign(c, { vx: 0, vy: 0, vr: 0, gravity: 0, drag: 1, age: 0, exploded: false });

const createChunkSystem = (frontLayer, particles) => {
  const sys = { chunks: [], active: [], healing: [], total: 0, detached: 0, cols: 0, rows: 0 };
  const clear = () => {
    for (const c of sys.chunks) {
      c.sprite.parent?.removeChild(c.sprite);
      c.sprite.destroy();
      c.texture.destroy(false);
    }
    sys.chunks.length = sys.active.length = sys.healing.length = 0;
    sys.total = sys.detached = 0;
  };
  const build = (bounds, source) => {
    clear();
    const size = config.chunkSize;
    sys.cols = Math.ceil(bounds.width / size);
    sys.rows = Math.ceil(bounds.height / size);
    for (let row = 0; row < sys.rows; row++) {
      const y = row * size;
      const fh = Math.min(size, bounds.height - y);
      for (let col = 0; col < sys.cols; col++) {
        const x = col * size;
        const fw = Math.min(size, bounds.width - x);
        const texture = new Texture({ source, frame: new Rectangle(x, y, fw, fh) });
        const sprite = new Sprite(texture);
        const homeX = bounds.x + x + fw / 2;
        const homeY = bounds.y + y + fh / 2;
        sprite.anchor.set(0.5);
        sprite.position.set(homeX, homeY);
        sprite.roundPixels = true;
        frontLayer.addChild(sprite);
        sys.chunks.push({ sprite, texture, localX: x, localY: y, width: fw, height: fh, homeX, homeY, vx: 0, vy: 0, vr: 0, gravity: 0, drag: 1, age: 0, exploded: false, healing: false, healProgress: 0 });
      }
    }
    sys.total = sys.chunks.length;
    sys.detached = 0;
  };
  const reset = () => {
    for (const c of sys.chunks) {
      c.sprite.parent?.removeChild(c.sprite);
      c.sprite.position.set(c.homeX, c.homeY);
      c.sprite.rotation = 0;
      c.sprite.alpha = 1;
      c.sprite.visible = true;
      c.sprite.scale.set(1);
      resetMotion(c);
      c.healing = false;
      c.healProgress = 0;
      frontLayer.addChild(c.sprite);
    }
    sys.active.length = sys.healing.length = 0;
    sys.detached = 0;
  };
  const slice = (bounds, laser, sparks) => {
    const steps = 4;
    const radius = config.laserRadius;
    const size = config.chunkSize;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const px = laser.prevX + (laser.x - laser.prevX) * t;
      const py = laser.prevY + (laser.y - laser.prevY) * t;
      const lx = px - bounds.x;
      const ly = py - bounds.y;
      if (lx < -radius || lx > bounds.width + radius || ly < -radius || ly > bounds.height + radius) continue;
      const vx = laser.x - laser.prevX;
      const vy = laser.y - laser.prevY;
      const minCol = Math.max(0, Math.floor((lx - radius) / size));
      const maxCol = Math.min(sys.cols - 1, Math.floor((lx + radius) / size));
      const minRow = Math.max(0, Math.floor((ly - radius) / size));
      const maxRow = Math.min(sys.rows - 1, Math.floor((ly + radius) / size));
      let hits = 0;
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const c = sys.chunks[row * sys.cols + col];
          if (!c || c.exploded || !chunkHitsCircle(c, lx, ly, radius)) continue;
          c.exploded = true;
          if (c.healing) {
            const i = sys.healing.indexOf(c);
            if (i !== -1) sys.healing.splice(i, 1);
            c.healing = false;
            c.healProgress = 0;
            c.sprite.alpha = 1;
          } else sys.detached++;
          hits++;
          const dx = c.homeX - px;
          const dy = c.homeY - py;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const pressure = 1 - clamp(dist / radius, 0, 1);
          const angle = Math.atan2(dy, dx) + randomBetween(-0.32, 0.32);
          const force = randomBetween(1.8, 4.2) + pressure * 3.4;
          c.vx = Math.cos(angle) * force + vx * 0.45;
          c.vy = Math.sin(angle) * force + vy * 0.45 - randomBetween(1.2, 4.2);
          c.vr = randomBetween(-0.25, 0.25);
          c.gravity = randomBetween(0.32, 0.58);
          c.drag = randomBetween(0.984, 0.994);
          c.age = 0;
          c.sprite.alpha = 1;
          c.sprite.parent?.removeChild(c.sprite);
          particles.addChild(c.sprite);
          sys.active.push(c);
        }
      }
      if (hits > 0 && Math.random() < 0.6) emitSparks(sparks, px, py, vx, vy, Math.min(8, 2 + Math.floor(hits / 3)));
    }
  };
  const integrate = (step, screenHeight) => {
    for (let i = sys.active.length - 1; i >= 0; i--) {
      const c = sys.active[i];
      c.age += step;
      c.vy += c.gravity * step;
      c.vx *= c.drag;
      c.vy *= c.drag;
      c.sprite.x += c.vx * step;
      c.sprite.y += c.vy * step;
      c.sprite.rotation += c.vr * step;
      if (c.sprite.y > screenHeight + 180 || c.age > 90) {
        sys.active.splice(i, 1);
        c.sprite.parent?.removeChild(c.sprite);
        frontLayer.addChild(c.sprite);
        c.sprite.position.set(c.homeX, c.homeY);
        c.sprite.rotation = 0;
        c.sprite.visible = true;
        resetMotion(c);
        c.sprite.alpha = 0;
        c.healing = true;
        c.healProgress = 0;
        sys.healing.push(c);
      }
    }
    for (let i = sys.healing.length - 1; i >= 0; i--) {
      const c = sys.healing[i];
      c.healProgress += step;
      c.sprite.alpha = c.healProgress < HEAL_HOLD_TICKS ? 0 : Math.min((c.healProgress - HEAL_HOLD_TICKS) / HEAL_FADE_TICKS, 1);
      if (c.healProgress >= HEAL_HOLD_TICKS + HEAL_FADE_TICKS) {
        c.sprite.alpha = 1;
        c.healing = false;
        c.healProgress = 0;
        sys.healing.splice(i, 1);
        sys.detached = Math.max(0, sys.detached - 1);
      }
    }
  };
  return { sys, clear, build, reset, slice, integrate };
};

/* ── scene ───────────────────────────────────────────── */

export const mountLaserScene = async ({ canvas, host, page, mode, assetBase }) => {
  const app = new Application();
  await app.init({
    canvas,
    resizeTo: window,
    preference: "webgl",
    backgroundAlpha: mode === "canvas" ? 1 : 0,
    background: SHADOW,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    textureGCActive: false,
    autoDensity: true,
    roundPixels: true,
  });
  Object.assign(canvas.style, { position: "fixed", inset: "0", display: "block", touchAction: "auto" });
  // Software GL (SwiftShader, llvmpipe) cannot afford full-screen bloom/glow passes every frame.
  const gl = app.renderer.gl;
  const dbg = gl?.getExtension?.("WEBGL_debug_renderer_info");
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
  const lowPower = /swiftshader|llvmpipe|software/i.test(gpu);
  if (lowPower) config.chunkSize = 32;

  const tex = (name) => Texture.from(`${assetBase}assets/cat/${name}.png`);
  await Promise.all(CAT_PARTS.map((n) => Assets.load(`${assetBase}assets/cat/${n}.png`)));

  const pageBounds = { x: 0, y: 0, width: app.screen.width, height: app.screen.height };
  const backSprite = new Sprite();
  const frontLayer = new Container();
  const particles = new Container();
  const laserLayer = new Graphics();
  const vignette = new Graphics();
  const cat = new Cat({ scale: 2, power: 0.9, skid: 0.99, tex });
  cat.view.filters = [new DropShadowFilter({ offset: { x: 6, y: 10 }, blur: 2, quality: 4, alpha: 0.55, color: SHADOW })];
  cat.setPosition(-160, app.screen.height * 0.82);
  laserLayer.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
  if (!lowPower) {
    laserLayer.filters = [
      new AdvancedBloomFilter({ threshold: 0.2, bloomScale: 1.1, brightness: 1.0, blur: 6, quality: 4 }),
      new GlowFilter({ distance: 20, outerStrength: 2.4, innerStrength: 0.4, color: PINK_HOT, quality: 0.35, alpha: 0.95 }),
    ];
  }

  const sliceable = mode === "canvas";
  let backdrop = null;
  let frontSource = null;
  let backSource = null;
  let backTexture = null;
  const chunksApi = createChunkSystem(frontLayer, particles);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const makeSource = (resource, live) => {
    // The browser snapshots elements at CSS pixels, so on 2x screens the texture is upscaled; nearest
    // sampling keeps text edges crisp instead of smearing them.
    const source = new HTMLSource({ resource, width: pageBounds.width, height: pageBounds.height, autoUpdate: live });
    source.scaleMode = dpr > 1.5 ? "nearest" : "linear";
    source.requestPaint();
    return source;
  };

  if (sliceable) {
    backdrop = document.createElement("div");
    backdrop.className = "lf-backdrop";
    backdrop.innerHTML = backdropHtml;
    backdrop.inert = true;
    canvas.insertBefore(backdrop, page);
    if (!lowPower) frontLayer.filters = [new DropShadowFilter({ offset: { x: 8, y: 12 }, blur: 3, quality: 4, alpha: 0.55, color: SHADOW })];
    frontLayer.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
    await nextDoubleFrame();
    backSource = makeSource(backdrop, false);
    frontSource = makeSource(page, true);
    backTexture = new Texture({ source: backSource });
    backSprite.texture = backTexture;
    backSprite.roundPixels = true;
    app.stage.addChild(backSprite, frontLayer, particles, cat.shadowView, cat.tailView, laserLayer, cat.view, vignette);
  } else {
    app.stage.addChild(particles, cat.shadowView, cat.tailView, laserLayer, cat.view);
  }
  // Pixi must not swallow pointer input over the live page.
  app.stage.eventMode = "none";

  const sparks = [];
  const trail = [];
  const laser = createLaser();
  const mouseTarget = { x: app.screen.width / 2, y: app.screen.height / 2 };
  let lastPointer = -Infinity;
  const onPointer = (e) => {
    mouseTarget.x = e.clientX;
    mouseTarget.y = e.clientY;
    lastPointer = performance.now();
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const syncBack = () => {
    backSprite.position.set(pageBounds.x, pageBounds.y);
    backSprite.width = pageBounds.width;
    backSprite.height = pageBounds.height;
  };
  const redrawVignette = () => {
    vignette.clear().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 0.0001 });
  };
  const resetDamage = () => {
    chunksApi.reset();
    sparks.length = 0;
    trail.length = 0;
    seedLaser(laser, pageBounds.x + pageBounds.width / 2, pageBounds.y + pageBounds.height / 2);
    laser.impactFired = false;
    laser.impactProgress = 0;
    laser.shake = 0;
    laser.prevMouse = config.laserMouse;
    laser.transitionX = laser.transitionY = 0;
    cat.setPosition(-160, app.screen.height * 0.82);
  };
  const rebuild = () => {
    if (!sliceable) return;
    chunksApi.clear();
    backTexture.destroy(false);
    backSource.destroy();
    frontSource.destroy();
    backSource = makeSource(backdrop, false);
    frontSource = makeSource(page, true);
    backTexture = new Texture({ source: backSource });
    backSprite.texture = backTexture;
    chunksApi.build(pageBounds, frontSource);
    resetDamage();
  };

  if (sliceable) {
    syncBack();
    chunksApi.build(pageBounds, frontSource);
    redrawVignette();
  }
  seedLaser(laser, pageBounds.x + pageBounds.width / 2, pageBounds.y + pageBounds.height / 2);

  let relayoutTimer = 0;
  const relayout = async () => {
    pageBounds.width = Math.max(1, app.screen.width);
    pageBounds.height = Math.max(1, app.screen.height);
    frontLayer.filterArea = new Rectangle(0, 0, pageBounds.width, pageBounds.height);
    laserLayer.filterArea = new Rectangle(0, 0, pageBounds.width, pageBounds.height);
    await nextDoubleFrame();
    if (sliceable) {
      syncBack();
      rebuild();
      redrawVignette();
    }
  };
  const scheduleRelayout = () => {
    window.clearTimeout(relayoutTimer);
    relayoutTimer = window.setTimeout(() => void relayout(), 180);
  };
  app.renderer.on("resize", scheduleRelayout);
  window.addEventListener("orientationchange", scheduleRelayout);

  const laserDeps = { laser, pageBounds, trail, sparks, mouseTarget, totalChunkCount: () => chunksApi.sys.total, detachedChunkCount: () => chunksApi.sys.detached, resetDamage };

  app.render();
  await nextDoubleFrame();

  app.ticker.add((ticker) => {
    const step = ticker.deltaTime;
    // Overlay mode: the laser follows the cursor and wanders when it goes idle.
    if (!sliceable) config.laserMouse = performance.now() - lastPointer < 2600;
    frontSource?.requestPaint();
    updateLaser(laserDeps, step);
    if (sliceable && laser.resetCooldown <= 0 && (laser.startDelay <= 0 || laser.impactFired)) chunksApi.slice(pageBounds, laser, sparks);
    for (let i = trail.length - 1; i >= 0; i--) if ((trail[i].life -= step) <= 0) trail.splice(i, 1);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= 0.96;
      s.vy += 0.18 * step;
      s.x += s.vx * step;
      s.y += s.vy * step;
      if ((s.life -= step) <= 0) sparks.splice(i, 1);
    }
    chunksApi.integrate(step, app.screen.height);
    const intro = START_DELAY > 0 ? 1 - laser.startDelay / START_DELAY : 1;
    if (intro >= CAT_ENTRY_PROGRESS) cat.update(step, laser.x, laser.y);
    drawLaser(laserLayer, laser, trail, sparks);
  });

  return {
    app,
    destroy() {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("orientationchange", scheduleRelayout);
      window.clearTimeout(relayoutTimer);
      chunksApi.clear();
      backTexture?.destroy(false);
      backSource?.destroy();
      frontSource?.destroy();
      backdrop?.remove();
      app.destroy(false, { children: true, texture: true });
    },
  };
};
