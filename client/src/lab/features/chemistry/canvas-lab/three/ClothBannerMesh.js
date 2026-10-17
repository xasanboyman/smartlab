import * as THREE from "three";

/**
 * 3D Interactive Cloth Banner with Verlet Physics
 * Based directly on fimbox/html-in-canvas (plugins/html-cloth.mjs)
 *
 * Implements:
 * - Real-time 3D Verlet spring-mass particle grid (20x24 segments)
 * - Structural, shear, and diagonal relaxation constraints
 * - Pinned top brass eyelets and hanging brass rod
 * - Dynamic 3D raycast click & poke impulses
 * - Curtis AI speech bubble and reactive sound/text
 * - Live HTML-in-Canvas texture mapping
 */
export class ClothBannerMesh {
  constructor(options = {}) {
    this.width = options.width || 2.4;
    this.height = options.height || 2.8;
    this.segmentsX = options.segmentsX || 18;
    this.segmentsY = options.segmentsY || 22;

    this.mass = 1.2;
    this.damping = 0.985;
    this.stiffness = 0.92;
    this.gravity = -9.8;
    this.wind = 0.15;

    this.lastSpeakTime = 0;
    this.curtisSpeech = "Hello! Click or poke this 3D cloth.";
    this.likes = 248;
    this.liked = false;

    // Curtis Quotes database from fimbox/html-cloth.mjs
    this.quotes = {
      idle: [
        "Still here.",
        "HTML in Canvas is alive.",
        "Try poking the cloth!",
        "Synthesizing reactions...",
        "Looking sharp today.",
        "Chemistry in 3D!",
      ],
      poke: [
        "Ow! That tickles.",
        "Hey, careful with the cloth!",
        "Verlet physics wave propagating!",
        "Direct hit! Ripple initiated.",
        "Fascinating impulse response.",
      ],
      pet: [
        "Aww, smooth texture.",
        "Silk-like damping applied.",
        "Purring along nicely.",
        "Thanks, lab partner!",
      ],
      talk: [
        "Did you know sodium explodes in water?",
        "Try titrating with phenolphthalein!",
        "Hypergolic reactions generate instant fire.",
        "All physics simulated at 60 FPS.",
      ],
    };

    this.initCanvasTexture();
    this.initGeometry();
    this.initHanger();
  }

  initCanvasTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext("2d");
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.renderBannerTexture();
  }

  renderBannerTexture() {
    const ctx = this.ctx;
    const w = 1024;
    const h = 1024;

    // Background: Rich retro parchment/linen look
    ctx.fillStyle = "#f6f0e6";
    ctx.fillRect(0, 0, w, h);

    // Subtle fabric weave texture
    ctx.fillStyle = "rgba(40, 25, 10, 0.02)";
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }
    for (let x = 0; x < w; x += 4) {
      ctx.fillRect(x, 0, 2, h);
    }

    // Outer double border
    ctx.strokeStyle = "#38291a";
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // Brass corner ornaments
    const drawCorner = (cx, cy) => {
      ctx.fillStyle = "#c59b27";
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a350a";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(36, 36);
    drawCorner(w - 36, 36);
    drawCorner(36, h - 36);
    drawCorner(w - 36, h - 36);

    // Title: "HTML in Canvas"
    ctx.fillStyle = "#d44a2b";
    ctx.font = "900 68px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("◆ HTML in Canvas ◆", w / 2, 120);

    ctx.fillStyle = "#5a4532";
    ctx.font = "italic 600 28px serif";
    ctx.fillText("Interactive 3D Verlet Cloth Simulation", w / 2, 165);

    // Subject Portrait Box
    const boxX = 140;
    const boxY = 205;
    const boxW = 320;
    const boxH = 400;

    ctx.fillStyle = "#eae0cf";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#8d7054";
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Stylized scientist/Curtis portrait
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX + 10, boxY + 10, boxW - 20, boxH - 20);
    ctx.clip();
    const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    grad.addColorStop(0, "#4a6984");
    grad.addColorStop(1, "#1c2e3d");
    ctx.fillStyle = grad;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Scientist silhouette with safety goggles
    ctx.fillStyle = "#ffd5b8";
    ctx.beginPath();
    ctx.arc(boxX + boxW / 2, boxY + 150, 75, 0, Math.PI * 2);
    ctx.fill();

    // Lab coat collar
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(boxX + boxW / 2 - 80, boxY + boxH);
    ctx.lineTo(boxX + boxW / 2 - 25, boxY + 230);
    ctx.lineTo(boxX + boxW / 2, boxY + 260);
    ctx.lineTo(boxX + boxW / 2 + 25, boxY + 230);
    ctx.lineTo(boxX + boxW / 2 + 80, boxY + boxH);
    ctx.fill();

    // Safety goggles
    ctx.fillStyle = "#00f0ff";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boxX + boxW / 2 - 32, boxY + 140, 26, 0, Math.PI * 2);
    ctx.arc(boxX + boxW / 2 + 32, boxY + 140, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Label under portrait
    ctx.fillStyle = "#2d2015";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SUBJECT: CURTIS AI", boxX + boxW / 2, boxY + boxH + 34);

    // Right Column: Telemetry & Controls
    const rx = 520;
    ctx.textAlign = "left";

    // Telemetry stats
    const drawParam = (label, val, y) => {
      ctx.fillStyle = "#38291a";
      ctx.font = "bold 26px system-ui";
      ctx.fillText(label, rx, y);
      ctx.fillStyle = "#943b18";
      ctx.font = "bold 26px monospace";
      ctx.fillText(val, rx + 160, y);

      // Slider bar
      ctx.fillStyle = "#d8c7b0";
      ctx.fillRect(rx + 280, y - 20, 160, 16);
      ctx.fillStyle = "#c59b27";
      ctx.fillRect(rx + 280, y - 20, 110, 16);
    };

    drawParam("MASS:", `${this.mass} kg`, 260);
    drawParam("STIFF:", "92 %", 330);
    drawParam("DAMP:", "98 %", 400);
    drawParam("WIND:", "Active", 470);
    drawParam("THEME:", "Canvas 3D", 540);

    // Curtis Speech Bubble
    const bubbleY = 670;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#38291a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(80, bubbleY, w - 160, 120, [18]);
    ctx.fill();
    ctx.stroke();

    // Speech bubble tail
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(240, bubbleY);
    ctx.lineTo(260, bubbleY - 20);
    ctx.lineTo(280, bubbleY);
    ctx.fill();

    ctx.fillStyle = "#1e130c";
    ctx.font = "bold 30px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`“${this.curtisSpeech}”`, w / 2, bubbleY + 65);

    // Bottom Action Buttons: PET, POKE, TALK
    const btnW = 240;
    const btnH = 75;
    const btnY = 830;

    const drawBtn = (x, text, bg) => {
      ctx.fillStyle = bg;
      ctx.strokeStyle = "#2a1c12";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(x, btnY, btnW, btnH, [14]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 32px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(text, x + btnW / 2, btnY + 48);
    };

    drawBtn(100, "👋 PET", "#3277a8");
    drawBtn(390, "👉 POKE", "#cf4d2b");
    drawBtn(680, "💬 TALK", "#2b9e63");

    // Footer: likes and status
    ctx.fillStyle = "#5a4532";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `❤️ ${this.likes} LIKES  ·  WICG HTML-IN-CANVAS  ·  3D VERLET ACTIVE`,
      w / 2,
      960
    );

    this.texture.needsUpdate = true;
  }

  setSpeech(text) {
    this.curtisSpeech = text;
    this.renderBannerTexture();
  }

  interact(actionType) {
    const list = this.quotes[actionType] || this.quotes.poke;
    const quote = list[Math.floor(Math.random() * list.length)];
    this.setSpeech(quote);

    if (actionType === "pet") {
      this.likes++;
      this.renderBannerTexture();
    }
  }

  initGeometry() {
    this.particles = [];
    this.constraints = [];

    const numX = this.segmentsX + 1;
    const numY = this.segmentsY + 1;
    const dx = this.width / this.segmentsX;
    const dy = this.height / this.segmentsY;

    // Create particles
    for (let j = 0; j < numY; j++) {
      this.particles[j] = [];
      for (let i = 0; i < numX; i++) {
        const x = (i - this.segmentsX / 2) * dx;
        const y = -j * dy;
        const z = 0;

        const isPinned = j === 0; // Top edge pinned to the brass rod
        this.particles[j][i] = {
          pos: new THREE.Vector3(x, y, z),
          oldPos: new THREE.Vector3(x, y, z),
          acc: new THREE.Vector3(0, 0, 0),
          pinned: isPinned,
          u: i / this.segmentsX,
          v: 1.0 - j / this.segmentsY,
        };
      }
    }

    // Create distance constraints
    for (let j = 0; j < numY; j++) {
      for (let i = 0; i < numX; i++) {
        const p = this.particles[j][i];
        // Horizontal structural
        if (i < this.segmentsX) {
          const pRight = this.particles[j][i + 1];
          this.constraints.push({
            p1: p,
            p2: pRight,
            dist: p.pos.distanceTo(pRight.pos),
          });
        }
        // Vertical structural
        if (j < this.segmentsY) {
          const pDown = this.particles[j + 1][i];
          this.constraints.push({
            p1: p,
            p2: pDown,
            dist: p.pos.distanceTo(pDown.pos),
          });
        }
        // Shear diagonal
        if (i < this.segmentsX && j < this.segmentsY) {
          const pDiag = this.particles[j + 1][i + 1];
          this.constraints.push({
            p1: p,
            p2: pDiag,
            dist: p.pos.distanceTo(pDiag.pos),
          });
        }
      }
    }

    // Build Three.js BufferGeometry
    this.geometry = new THREE.PlaneGeometry(
      this.width,
      this.height,
      this.segmentsX,
      this.segmentsY
    );
    this.geometry.translate(0, -this.height / 2, 0);

    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  initHanger() {
    this.hangerGroup = new THREE.Group();

    // Top brass rod
    const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, this.width + 0.35, 16);
    rodGeo.rotateZ(Math.PI / 2);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
    });
    const rod = new THREE.Mesh(rodGeo, brassMat);
    rod.position.set(0, 0.04, 0);
    this.hangerGroup.add(rod);

    // End caps
    const capGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const capL = new THREE.Mesh(capGeo, brassMat);
    capL.position.set(-(this.width + 0.35) / 2, 0.04, 0);
    const capR = new THREE.Mesh(capGeo, brassMat);
    capR.position.set((this.width + 0.35) / 2, 0.04, 0);
    this.hangerGroup.add(capL, capR);

    // Hanging rings along top edge
    const ringGeo = new THREE.TorusGeometry(0.04, 0.009, 8, 16);
    const numRings = 7;
    for (let r = 0; r < numRings; r++) {
      const rx = (r / (numRings - 1) - 0.5) * (this.width * 0.9);
      const ring = new THREE.Mesh(ringGeo, brassMat);
      ring.position.set(rx, 0.02, 0);
      this.hangerGroup.add(ring);
    }

    this.mesh.add(this.hangerGroup);
  }

  /**
   * Apply 3D poke impulse at raycast hit point
   */
  pokeAtPoint(hitPoint, impulseForce = 0.45) {
    // Find closest particle
    let closest = null;
    let minD = Infinity;

    const numX = this.segmentsX + 1;
    const numY = this.segmentsY + 1;

    for (let j = 0; j < numY; j++) {
      for (let i = 0; i < numX; i++) {
        const p = this.particles[j][i];
        const worldPos = p.pos.clone().applyMatrix4(this.mesh.matrixWorld);
        const d = worldPos.distanceTo(hitPoint);
        if (d < minD) {
          minD = d;
          closest = { i, j, p };
        }
      }
    }

    if (closest) {
      // Apply radial wave to surrounding particles
      for (let j = 0; j < numY; j++) {
        for (let i = 0; i < numX; i++) {
          const p = this.particles[j][i];
          if (p.pinned) continue;
          const di = Math.abs(i - closest.i);
          const dj = Math.abs(j - closest.j);
          const distGrid = Math.hypot(di, dj);
          if (distGrid < 6) {
            const factor = Math.exp(-distGrid * 0.75);
            p.pos.z -= impulseForce * factor;
          }
        }
      }

      this.interact("poke");
    }
  }

  update(dt, time) {
    const clampedDt = Math.min(dt, 0.033);
    const numX = this.segmentsX + 1;
    const numY = this.segmentsY + 1;

    // 1. Verlet Integration + Wind
    for (let j = 0; j < numY; j++) {
      for (let i = 0; i < numX; i++) {
        const p = this.particles[j][i];
        if (p.pinned) continue;

        // Ambient gentle wind flutter
        const windZ = Math.sin(time * 2.2 + j * 0.4 + i * 0.3) * this.wind;

        const temp = p.pos.clone();
        const vel = p.pos.clone().sub(p.oldPos).multiplyScalar(this.damping);

        p.pos.add(vel);
        p.pos.y += this.gravity * clampedDt * clampedDt * 0.4;
        p.pos.z += windZ * clampedDt * 0.05;
        p.oldPos.copy(temp);
      }
    }

    // 2. Constraint relaxation (5 iterations)
    for (let iter = 0; iter < 5; iter++) {
      for (let c = 0; c < this.constraints.length; c++) {
        const { p1, p2, dist } = this.constraints[c];
        const delta = p2.pos.clone().sub(p1.pos);
        const currentDist = delta.length() || 0.0001;
        const diff = (currentDist - dist) / currentDist;
        const half = delta.multiplyScalar(0.5 * diff * this.stiffness);

        if (!p1.pinned && !p2.pinned) {
          p1.pos.add(half);
          p2.pos.sub(half);
        } else if (!p1.pinned) {
          p1.pos.add(half.multiplyScalar(2));
        } else if (!p2.pinned) {
          p2.pos.sub(half.multiplyScalar(2));
        }
      }
    }

    // 3. Update BufferGeometry vertex positions
    const posAttr = this.geometry.attributes.position;
    let idx = 0;
    for (let j = 0; j < numY; j++) {
      for (let i = 0; i < numX; i++) {
        const p = this.particles[j][i];
        posAttr.setXYZ(idx, p.pos.x, p.pos.y, p.pos.z);
        idx++;
      }
    }
    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();

    // Curtis idle chatter check
    if (time - this.lastSpeakTime > 12) {
      this.lastSpeakTime = time;
      const idles = this.quotes.idle;
      this.setSpeech(idles[Math.floor(Math.random() * idles.length)]);
    }
  }
}
