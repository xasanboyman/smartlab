/**
 * Cat Simulation & Canvas 2D Renderer
 * Based on Zyie/pixijs-html-in-canvas (https://github.com/Zyie/pixijs-html-in-canvas)
 *
 * Implements:
 * - Physics-driven cat chasing the laser scanner / cursor
 * - Verlet tail physics (14 joints with tension & inertia)
 * - Animated paws reaching forward to bat at the laser beam
 * - Body bobbing, head tracking, skid drift & pounce physics
 * - High-speed 60 FPS HTML Canvas 2D rendering
 */

const CAT_ASSETS = {
  body: [
    "/assets/cat/body-1.png",
    "/assets/cat/body-2.png",
    "/assets/cat/body-3.png",
    "/assets/cat/body-4.png",
  ],
  headCentre: "/assets/cat/head-centre.png",
  headLeft: ["/assets/cat/head-left-1.png", "/assets/cat/head-left-2.png"],
  headRight: ["/assets/cat/head-right-1.png", "/assets/cat/head-right-2.png"],
  paw: "/assets/cat/front-paw.png",
  pawBlur: [
    "/assets/cat/paw-blur-1.png",
    "/assets/cat/paw-blur-2.png",
    "/assets/cat/paw-blur-3.png",
    "/assets/cat/paw-blur-4.png",
  ],
  shadow: "/assets/cat/shadow.png",
  tail: "/assets/cat/tail.png",
  laserDot: "/assets/cat/laser-dot.png",
};

// Global image cache
const imageCache = {};

export function preloadCatAssets() {
  const allUrls = [
    ...CAT_ASSETS.body,
    CAT_ASSETS.headCentre,
    ...CAT_ASSETS.headLeft,
    ...CAT_ASSETS.headRight,
    CAT_ASSETS.paw,
    ...CAT_ASSETS.pawBlur,
    CAT_ASSETS.shadow,
    CAT_ASSETS.tail,
    CAT_ASSETS.laserDot,
  ];

  allUrls.forEach((url) => {
    if (!imageCache[url]) {
      const img = new Image();
      img.src = url;
      imageCache[url] = img;
    }
  });
}

function smallestAngle(target, current) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class CatSimulation {
  constructor(options = {}) {
    this.scale = options.scale || 1.15;
    this.power = options.power || 0.42;
    this.skid = options.skid || 0.91;

    this.x = 200;
    this.y = 200;
    this.vx = 0;
    this.vy = 0;

    this.bodyAngle = 0;
    this.headAngle = 0;
    this.easeDirection = 0;
    this.hasEaseDirection = false;

    this.tick = 0;
    this.wobbleTime = 0;

    this.lastTargetX = 0;
    this.lastTargetY = 0;
    this.hasLastTarget = false;

    // Tail Verlet chain (14 joints)
    this.numTailJoints = 14;
    this.tailLinkLen = (36 * this.scale) / this.numTailJoints;
    this.tailFriction = 0.88;
    this.tailX = new Float32Array(this.numTailJoints + 1);
    this.tailY = new Float32Array(this.numTailJoints + 1);
    this.tailOldX = new Float32Array(this.numTailJoints + 1);
    this.tailOldY = new Float32Array(this.numTailJoints + 1);
    this.tailInitialized = false;

    preloadCatAssets();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    for (let i = 0; i <= this.numTailJoints; i++) {
      this.tailX[i] = x;
      this.tailY[i] = y + i * this.tailLinkLen;
      this.tailOldX[i] = this.tailX[i];
      this.tailOldY[i] = this.tailY[i];
    }
    this.tailInitialized = true;
  }

  update(dt, targetX, targetY) {
    if (!this.tailInitialized) {
      this.setPosition(targetX + 120, targetY + 80);
    }

    if (!this.hasLastTarget) {
      this.lastTargetX = targetX;
      this.lastTargetY = targetY;
      this.hasLastTarget = true;
    }

    const laserVX = targetX - this.lastTargetX;
    const laserVY = targetY - this.lastTargetY;
    this.lastTargetX = targetX;
    this.lastTargetY = targetY;

    const catSpeed = Math.hypot(this.vx, this.vy);
    const catDirX = catSpeed > 0.1 ? this.vx / catSpeed : 0;
    const catDirY = catSpeed > 0.1 ? this.vy / catSpeed : 0;

    this.wobbleTime += dt;
    const wobbleX =
      Math.sin(this.wobbleTime * 0.017) * 90 +
      Math.sin(this.wobbleTime * 0.073) * 35;
    const wobbleY =
      Math.cos(this.wobbleTime * 0.021) * 90 +
      Math.cos(this.wobbleTime * 0.089) * 35;

    const leadX = targetX + laserVX * 18 + catDirX * 45 + wobbleX;
    const leadY = targetY + laserVY * 18 + catDirY * 45 + wobbleY;

    let dx = leadX - this.x;
    let dy = leadY - this.y;
    const len = Math.hypot(dx, dy);
    const maxSpeed = 7 + clamp(len / 400, 0, 1) * 6;

    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    // Accelerate toward lead point
    this.vx += dx * this.power * dt * 60;
    this.vy += dy * this.power * dt * 60;

    // Apply skid friction
    const friction = Math.pow(this.skid, dt * 60);
    this.vx *= friction;
    this.vy *= friction;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed && speed > 0) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Forward damping when reversing
    const forwardX = Math.sin(this.bodyAngle);
    const forwardY = -Math.cos(this.bodyAngle);
    const forwardDot = this.vx * forwardX + this.vy * forwardY;
    if (forwardDot < 0) {
      this.vx -= forwardX * forwardDot * 0.45;
      this.vy -= forwardY * forwardDot * 0.45;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Head and body orientation
    const realDX = targetX - this.x;
    const realDY = targetY - this.y;
    const realLen = Math.hypot(realDX, realDY);
    const rawDirection = realLen > 5 ? -Math.atan2(realDX, realDY) : this.easeDirection;

    if (!this.hasEaseDirection) {
      this.easeDirection = rawDirection;
      this.hasEaseDirection = true;
    } else {
      this.easeDirection += smallestAngle(rawDirection, this.easeDirection) * 0.22;
    }

    const direction = this.easeDirection;
    const newBodyAngle = direction + Math.PI + Math.sin(this.tick * 0.5) * 0.18;
    this.bodyAngle += smallestAngle(newBodyAngle, this.bodyAngle) * 0.3;

    const newHeadAngle = direction + Math.PI + Math.cos(this.tick) * 0.06;
    this.headAngle += smallestAngle(newHeadAngle, this.headAngle) * 0.45;

    this.tick += 0.14 * Math.min(speed, 2.5) * dt * 60;

    // Update tail Verlet physics
    this.updateTail(dt);
  }

  updateTail(dt) {
    const cosB = Math.cos(this.bodyAngle);
    const sinB = Math.sin(this.bodyAngle);
    const tailRootX = this.x - sinB * (14 * this.scale);
    const tailRootY = this.y + cosB * (14 * this.scale);

    for (let i = 0; i <= this.numTailJoints; i++) {
      const tempX = this.tailX[i];
      const tempY = this.tailY[i];

      this.tailX[i] += this.tailFriction * (this.tailX[i] - this.tailOldX[i]);
      this.tailY[i] += this.tailFriction * (this.tailY[i] - this.tailOldY[i]);
      this.tailOldX[i] = tempX;
      this.tailOldY[i] = tempY;
    }

    for (let iter = 0; iter < 4; iter++) {
      this.tailX[0] = tailRootX;
      this.tailY[0] = tailRootY;

      for (let i = 1; i <= this.numTailJoints; i++) {
        const dx = this.tailX[i] - this.tailX[i - 1];
        const dy = this.tailY[i] - this.tailY[i - 1];
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - this.tailLinkLen) / dist;
        const offsetX = (diff * dx) * 0.5;
        const offsetY = (diff * dy) * 0.5;

        this.tailX[i] -= offsetX;
        this.tailY[i] -= offsetY;
        this.tailX[i - 1] += offsetX;
        this.tailY[i - 1] += offsetY;
      }
    }
    this.tailX[0] = tailRootX;
    this.tailY[0] = tailRootY;
  }

  render(ctx, targetX, targetY) {
    const S = this.scale;
    const sImg = imageCache[CAT_ASSETS.shadow];
    const bImgs = CAT_ASSETS.body.map((u) => imageCache[u]);
    const pawImg = imageCache[CAT_ASSETS.paw];
    const laserImg = imageCache[CAT_ASSETS.laserDot];

    // Pick animated body frame
    const bodyIdx = Math.floor(Math.abs(this.tick) % CAT_ASSETS.body.length);
    const bodyImg = bImgs[bodyIdx] || bImgs[0];

    // Pick head image based on relative angle to target
    const angleDiff = smallestAngle(this.headAngle - Math.PI, this.bodyAngle - Math.PI);
    let headImg = imageCache[CAT_ASSETS.headCentre];
    if (angleDiff > 0.25) {
      headImg = imageCache[CAT_ASSETS.headRight[1]] || imageCache[CAT_ASSETS.headRight[0]] || headImg;
    } else if (angleDiff < -0.25) {
      headImg = imageCache[CAT_ASSETS.headLeft[1]] || imageCache[CAT_ASSETS.headLeft[0]] || headImg;
    }

    ctx.save();

    // 1. Draw Cat Shadow
    if (sImg && sImg.complete) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.translate(this.x, this.y + 14 * S);
      const sw = sImg.width * 0.7 * S;
      const sh = sImg.height * 0.28 * S;
      ctx.drawImage(sImg, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    }

    // 2. Draw Cat Tail
    ctx.save();
    ctx.strokeStyle = "#de8735";
    ctx.lineWidth = 7 * S;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.tailX[0], this.tailY[0]);
    for (let i = 1; i <= this.numTailJoints; i++) {
      ctx.lineTo(this.tailX[i], this.tailY[i]);
    }
    ctx.stroke();

    // Tail darker tip
    ctx.strokeStyle = "#4d2814";
    ctx.lineWidth = 5 * S;
    ctx.beginPath();
    const tipIdx = Math.max(0, this.numTailJoints - 3);
    ctx.moveTo(this.tailX[tipIdx], this.tailY[tipIdx]);
    for (let i = tipIdx + 1; i <= this.numTailJoints; i++) {
      ctx.lineTo(this.tailX[i], this.tailY[i]);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Draw Cat Body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.bodyAngle);

    // Body squash/stretch breathing
    const stretch = 1 + Math.sin(this.tick) * 0.04;
    ctx.scale(S * stretch, S * (1 / stretch));

    if (bodyImg && bodyImg.complete) {
      ctx.drawImage(bodyImg, -bodyImg.width / 2, -bodyImg.height / 2);
    }
    ctx.restore();

    // 4. Draw Reaching Paws
    const cosB = Math.cos(this.bodyAngle);
    const sinB = Math.sin(this.bodyAngle);

    const leftShoulderX = this.x + (-sinB * 9) * S;
    const leftShoulderY = this.y + (cosB * 9) * S;
    const rightShoulderX = this.x + (sinB * 9) * S;
    const rightShoulderY = this.y + (-cosB * 9) * S;

    const reachL = 18 * S + Math.sin(this.tick) * 4 * S;
    const reachR = 18 * S + Math.sin(this.tick + Math.PI) * 4 * S;

    const dirL = Math.atan2(targetY - leftShoulderY, targetX - leftShoulderX);
    const dirR = Math.atan2(targetY - rightShoulderY, targetX - rightShoulderX);

    const leftPawX = leftShoulderX + Math.cos(dirL) * reachL;
    const leftPawY = leftShoulderY + Math.sin(dirL) * reachL;
    const rightPawX = rightShoulderX + Math.cos(dirR) * reachR;
    const rightPawY = rightShoulderY + Math.sin(dirR) * reachR;

    // Draw arm lines & paws
    ctx.save();
    ctx.strokeStyle = "#de8735";
    ctx.lineWidth = 6 * S;
    ctx.lineCap = "round";

    // Left arm
    ctx.beginPath();
    ctx.moveTo(leftShoulderX, leftShoulderY);
    ctx.lineTo(leftPawX, leftPawY);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(rightShoulderX, rightShoulderY);
    ctx.lineTo(rightPawX, rightPawY);
    ctx.stroke();

    // Paws
    if (pawImg && pawImg.complete) {
      const pw = pawImg.width * 0.8 * S;
      const ph = pawImg.height * 0.8 * S;
      ctx.drawImage(pawImg, leftPawX - pw / 2, leftPawY - ph / 2, pw, ph);
      ctx.drawImage(pawImg, rightPawX - pw / 2, rightPawY - ph / 2, pw, ph);
    }
    ctx.restore();

    // 5. Draw Cat Head
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.headAngle);
    ctx.scale(S, S);

    if (headImg && headImg.complete) {
      // Anchor near neck (0.5, 0.7)
      ctx.drawImage(headImg, -headImg.width / 2, -headImg.height * 0.7);
    }
    ctx.restore();

    // 6. Draw Glowing Laser Dot where the cat is chasing
    if (laserImg && laserImg.complete) {
      ctx.save();
      ctx.translate(targetX, targetY);
      const dotSize = (laserImg.width || 24) * (1.1 + Math.sin(this.wobbleTime * 0.2) * 0.15);

      // Neon radial glow
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, dotSize * 1.5);
      grad.addColorStop(0, "rgba(255, 30, 80, 0.9)");
      grad.addColorStop(0.4, "rgba(231, 34, 100, 0.5)");
      grad.addColorStop(1, "rgba(231, 34, 100, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, dotSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(laserImg, -dotSize / 2, -dotSize / 2, dotSize, dotSize);
      ctx.restore();
    }

    ctx.restore();
  }
}
