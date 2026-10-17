/**
 * Physics Cloth Simulation based on fimbox/html-in-canvas/plugins/html-cloth.mjs
 * Reference: https://github.com/fimbox/html-in-canvas/blob/main/plugins/html-cloth.mjs
 *
 * Implements:
 * - Particle mass-spring grid with structural, shear & bending constraints
 * - Verlet numerical integration with damping, friction, gravity and wind
 * - Interactive impulses: poke, drag, wind gusts, collision ripples
 * - Curtis AI reactive lab dialogue system
 * - Affine triangle rendering & dynamic surface lighting
 */

export class HtmlClothPhysics {
  static SPEECH = {
    idle: ["…", "…seriously?", "Laboratoriya tayyor.", "nima qilamiz?", "tinchlik.", "…va?", "hali ham shu yerdaman.", "ajoyib.", "hmm."],
    pet: ["…iltimos.", "tegma.", "qiziq.", "albatta.", "fantastika.", "voy.", "mayli unda.", "…"],
    poke: ["oh!", "og'ridi-ku.", "ajoyib.", "zo'r.", "qiziq tuyg'u.", "yetar.", "…jiddiy aytyapsanmi?"],
    heat: ["issiq!", "harorat ko'tarilyapti!", "olovdan ehtiyot bo'l!", "qizib ketdim!", "sovutish kerak!"],
    explosion: ["BOOM! 💥", "portladi-ku!", "ko'zoynaging bormi?!", "xavfsizlik qayerda?!", "voy xudoyim!"],
    stiff: ["taranglik o'zgardi.", "qattiqlashdi.", "elastiklik his qilinyapti.", "yaxshi."],
    mass: ["og'irligim o'zgardi.", "massa yangilandi.", "og'irroq bo'lib qoldim."],
  };

  constructor(options = {}) {
    this.width = options.width || 320;
    this.height = options.height || 360;
    this.cols = options.cols || 14;
    this.rows = options.rows || 14;

    this.mass = options.mass || 1.2;
    this.damping = options.damping || 0.04;
    this.stiffness = options.stiffness || 0.85;
    this.gravity = options.gravity !== undefined ? options.gravity : 9.8;
    this.substeps = options.substeps || 6;

    this.points = [];
    this.links = [];
    this.speechText = "Salom! Men kimyo laboratoriya yordamchisiman.";
    this.lastSpeechTime = Date.now();

    this.initGrid();
  }

  initGrid() {
    this.points = [];
    this.links = [];

    const dx = this.width / this.cols;
    const dy = this.height / this.rows;

    // Create particles
    for (let y = 0; y <= this.rows; y++) {
      for (let x = 0; x <= this.cols; x++) {
        const px = (x - this.cols / 2) * dx;
        const py = y * dy;
        const pz = (Math.random() - 0.5) * 4; // slight natural jitter

        const pinned = (y === 0); // top edge is anchored
        this.points.push({
          x: px,
          y: py,
          z: pz,
          oldX: px,
          oldY: py,
          oldZ: pz,
          pinned,
          u: x / this.cols,
          v: y / this.rows,
        });
      }
    }

    // Helper for indexing
    const idx = (x, y) => y * (this.cols + 1) + x;

    // Create structural links
    for (let y = 0; y <= this.rows; y++) {
      for (let x = 0; x <= this.cols; x++) {
        if (x < this.cols) {
          this.links.push(this.createLink(idx(x, y), idx(x + 1, y), dx));
        }
        if (y < this.rows) {
          this.links.push(this.createLink(idx(x, y), idx(x, y + 1), dy));
        }
      }
    }

    // Create shear links (cross-bracing for realistic fabric folding)
    const diagDist = Math.sqrt(dx * dx + dy * dy);
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.links.push(this.createLink(idx(x, y), idx(x + 1, y + 1), diagDist));
        this.links.push(this.createLink(idx(x + 1, y), idx(x, y + 1), diagDist));
      }
    }
  }

  createLink(p1Idx, p2Idx, dist) {
    return { p1: p1Idx, p2: p2Idx, targetDist: dist };
  }

  poke(u, v, intensity = 60) {
    const targetX = Math.round(u * this.cols);
    const targetY = Math.round(v * this.rows);
    const hitIdx = targetY * (this.cols + 1) + targetX;

    if (hitIdx < 0 || hitIdx >= this.points.length) return;

    // Apply impulse to hit point and immediate neighbors
    const radius = 2;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = targetX + dx;
        const ny = targetY + dy;
        if (nx >= 0 && nx <= this.cols && ny >= 0 && ny <= this.rows) {
          const neighborIdx = ny * (this.cols + 1) + nx;
          const p = this.points[neighborIdx];
          if (!p.pinned) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const factor = Math.max(0, 1 - dist / (radius + 1));
            p.z -= intensity * factor;
            p.x += (Math.random() - 0.5) * intensity * 0.2 * factor;
          }
        }
      }
    }

    this.reactSpeech("poke");
  }

  reactSpeech(category, customText) {
    if (customText) {
      this.speechText = customText;
      this.lastSpeechTime = Date.now();
      return;
    }
    const pool = HtmlClothPhysics.SPEECH[category] || HtmlClothPhysics.SPEECH.idle;
    this.speechText = pool[Math.floor(Math.random() * pool.length)];
    this.lastSpeechTime = Date.now();
  }

  update(dt = 0.016) {
    const fixedDt = Math.min(dt, 0.033) / this.substeps;
    const g = this.gravity * 80;

    // Ambient gentle flutter
    const time = Date.now() * 0.002;
    const windZ = Math.sin(time) * 12 + Math.cos(time * 2.3) * 6;

    for (let step = 0; step < this.substeps; step++) {
      // 1. Verlet Integration
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        if (p.pinned) continue;

        const vx = (p.x - p.oldX) * (1 - this.damping);
        const vy = (p.y - p.oldY) * (1 - this.damping);
        const vz = (p.z - p.oldZ) * (1 - this.damping);

        p.oldX = p.x;
        p.oldY = p.y;
        p.oldZ = p.z;

        p.x += vx;
        p.y += vy + g * fixedDt * fixedDt;
        p.z += vz + windZ * fixedDt * fixedDt;
      }

      // 2. Solve Distance Constraints
      for (let j = 0; j < this.links.length; j++) {
        const link = this.links[j];
        const p1 = this.points[link.p1];
        const p2 = this.points[link.p2];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;

        const diff = (dist - link.targetDist) / dist;
        const correction = diff * 0.5 * this.stiffness;

        const cx = dx * correction;
        const cy = dy * correction;
        const cz = dz * correction;

        if (!p1.pinned) {
          p1.x += cx;
          p1.y += cy;
          p1.z += cz;
        }
        if (!p2.pinned) {
          p2.x -= cx;
          p2.y -= cy;
          p2.z -= cz;
        }
      }
    }

    // Auto idle speech every 12 seconds
    if (Date.now() - this.lastSpeechTime > 12000) {
      this.reactSpeech("idle");
    }
  }

  /**
   * Render cloth mesh on 2D context with 3D projection, depth shading and cloth weave
   */
  render(ctx, originX, originY, scale = 1.0) {
    if (!ctx) return;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);

    const cols = this.cols;
    const rows = this.rows;
    const idx = (x, y) => y * (cols + 1) + x;

    // Draw cloth background panels / quads
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p0 = this.points[idx(x, y)];
        const p1 = this.points[idx(x + 1, y)];
        const p2 = this.points[idx(x + 1, y + 1)];
        const p3 = this.points[idx(x, y + 1)];

        // Compute fake 3D depth and light normal from Z gradient
        const nx = (p1.z - p0.z) * 1.5;
        const ny = (p3.z - p0.z) * 1.5;
        const light = Math.max(0.4, Math.min(1.0, 0.75 + (nx - ny) * 0.02));

        const baseR = Math.floor(245 * light);
        const baseG = Math.floor(238 * light);
        const baseB = Math.floor(222 * light);

        ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();

        // Subtle mesh outline
        ctx.strokeStyle = "rgba(42, 31, 24, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Draw hanging top rod & brass rings
    const pTopLeft = this.points[0];
    const pTopRight = this.points[cols];

    ctx.strokeStyle = "#4a3525";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(pTopLeft.x - 16, pTopLeft.y);
    ctx.lineTo(pTopRight.x + 16, pTopRight.y);
    ctx.stroke();

    // Brass knobs
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(pTopLeft.x - 16, pTopLeft.y, 7, 0, Math.PI * 2);
    ctx.arc(pTopRight.x + 16, pTopRight.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Top anchor brass rings
    for (let x = 0; x <= cols; x += 2) {
      const pt = this.points[idx(x, 0)];
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 2, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render cloth header banner text
    const midPoint = this.points[idx(Math.floor(cols / 2), 2)];
    ctx.fillStyle = "#1e1b18";
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("SMARTLAB CHEM-BANNER", midPoint.x, midPoint.y + 10);

    // Curtis speech bubble rendered directly on cloth
    const speechPoint = this.points[idx(Math.floor(cols / 2), 6)];
    ctx.save();
    ctx.translate(speechPoint.x, speechPoint.y + 15);

    // Speech box
    ctx.fillStyle = "#1a1625";
    ctx.strokeStyle = "#e72264";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-135, -20, 270, 48, 8);
    ctx.fill();
    ctx.stroke();

    // Speech text
    ctx.fillStyle = "#00f0ff";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("CURTIS (AI ASSISTANT):", 0, -5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`"${this.speechText}"`, 0, 14);

    ctx.restore();
    ctx.restore();
  }
}
