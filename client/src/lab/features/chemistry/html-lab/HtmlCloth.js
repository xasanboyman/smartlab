// Three.js port of fimbox/html-in-canvas `plugins/html-cloth.mjs`: a top-pinned cloth whose
// texture is a live HTML element (texElementImage2D on every paint) and whose surface forwards
// pointer input back into that HTML. Bullet soft bodies are replaced by a Verlet grid.
import * as THREE from "three";
import { hasHtmlInCanvas, texElement, onNextPaint } from "@/lab/html-canvas/htmlInCanvas";

const INTERACTIVE = "button, input, a, select, textarea, label, [data-hit]";
const INTERACTIVE_TAGS = new Set(["BUTTON", "INPUT", "A", "SELECT", "TEXTAREA", "LABEL"]);
const TEXT_INPUTS = new Set(["text", "password", "email", "number", "search", "tel", "url", ""]);
const FALLBACK_MIN_MS = 420;

// Chrome taints a canvas that draws an SVG foreignObject, so the no-flag path re-renders the DOM with html2canvas.
let html2canvasLib = null;
const loadHtml2canvas = () => html2canvasLib || (html2canvasLib = import("html2canvas").then((m) => m.default || m));

export class HtmlCloth {
  constructor({
    renderer,
    camera,
    sourceEl,
    width = 2.6,
    height = 2.6,
    segmentsX = 20,
    segmentsY = 20,
    texSize = 1024,
    origin = new THREE.Vector3(0, 3, 0),
    wallZ = null,
    mass = 1.2,
    damping = 0.04,
    stiffness = 0.9,
    gravity = 9.8,
    metalness = 0.5,
    glossiness = 0.5,
    onPoke = null,
    onPet = null,
  }) {
    this.renderer = renderer;
    this.camera = camera;
    this.canvas = renderer.domElement;
    this.sourceEl = sourceEl;
    this.width = width;
    this.height = height;
    this.cols = Math.max(2, segmentsX | 0);
    this.rows = Math.max(2, segmentsY | 0);
    this.texSize = texSize;
    this.origin = origin.clone();
    this.wallZ = wallZ;
    this.mass = mass;
    this.damping = damping;
    this.stiffness = stiffness;
    this.gravity = gravity;
    this.onPoke = onPoke;
    this.onPet = onPet;
    this.native = hasHtmlInCanvas(this.canvas);
    this.time = 0;
    this.accumulator = 0;
    this.lastHitUV = null;
    this.hovered = null;
    this.downTarget = null;
    this.draggedSlider = null;
    this.focusedInput = null;
    this.marks = [];
    this.selAnchor = null;
    this.selecting = false;
    this.selReady = false;
    this.dispatching = false;
    this.paintPending = null;
    this.rasterizing = false;
    this.rasterDirty = false;
    this.lastRaster = 0;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.group = new THREE.Group();

    this._buildPhysics();
    this._buildMesh(metalness, glossiness);
    this._buildTexture();
    this._bindPointer();
    this.refresh();
  }

  /* ── physics ─────────────────────────────────────────── */

  _buildPhysics() {
    const { cols, rows } = this;
    const n = (cols + 1) * (rows + 1);
    this.count = n;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.pinned = new Uint8Array(n);
    this.anchors = new Float32Array((cols + 1) * 3);

    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const k = (j * (cols + 1) + i) * 3;
        const x = this.origin.x + (i / cols - 0.5) * this.width;
        const y = this.origin.y - (j / rows) * this.height;
        // A hair of noise so the sheet never starts perfectly flat.
        const z = this.origin.z + (Math.random() - 0.5) * 0.01;
        this.pos[k] = this.prev[k] = x;
        this.pos[k + 1] = this.prev[k + 1] = y;
        this.pos[k + 2] = this.prev[k + 2] = z;
        if (j === 0) {
          this.pinned[k / 3] = 1;
          this.anchors[i * 3] = x;
          this.anchors[i * 3 + 1] = y;
          this.anchors[i * 3 + 2] = this.origin.z;
        }
      }
    }

    const a = [];
    const b = [];
    const rest = [];
    const kind = [];
    const idx = (i, j) => j * (cols + 1) + i;
    const link = (p, q, type) => {
      const dx = this.pos[p * 3] - this.pos[q * 3];
      const dy = this.pos[p * 3 + 1] - this.pos[q * 3 + 1];
      const dz = this.pos[p * 3 + 2] - this.pos[q * 3 + 2];
      a.push(p);
      b.push(q);
      rest.push(Math.hypot(dx, dy, dz));
      kind.push(type);
    };
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        if (i < cols) link(idx(i, j), idx(i + 1, j), 0);
        if (j < rows) link(idx(i, j), idx(i, j + 1), 0);
        if (i < cols && j < rows) {
          link(idx(i, j), idx(i + 1, j + 1), 1);
          link(idx(i + 1, j), idx(i, j + 1), 1);
        }
        if (i + 2 <= cols) link(idx(i, j), idx(i + 2, j), 2);
        if (j + 2 <= rows) link(idx(i, j), idx(i, j + 2), 2);
      }
    }
    this.cA = Uint32Array.from(a);
    this.cB = Uint32Array.from(b);
    this.cRest = Float32Array.from(rest);
    this.cKind = Uint8Array.from(kind);
  }

  // Top row follows the rod; call when the banner is moved.
  setOrigin(v) {
    this.origin.copy(v);
    for (let i = 0; i <= this.cols; i++) {
      this.anchors[i * 3] = v.x + (i / this.cols - 0.5) * this.width;
      this.anchors[i * 3 + 1] = v.y;
      this.anchors[i * 3 + 2] = v.z;
    }
  }

  _substep(dt) {
    const { pos, prev, pinned, count } = this;
    const keep = Math.pow(1 - this.damping, dt * 60);
    const t = this.time;
    const g = -this.gravity * dt * dt;
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      if (pinned[i]) {
        const ai = (i % (this.cols + 1)) * 3;
        pos[k] = prev[k] = this.anchors[ai];
        pos[k + 1] = prev[k + 1] = this.anchors[ai + 1];
        pos[k + 2] = prev[k + 2] = this.anchors[ai + 2];
        continue;
      }
      const x = pos[k];
      const y = pos[k + 1];
      const z = pos[k + 2];
      // Soft draft so the banner breathes instead of hanging dead.
      const wind =
        (Math.sin(t * 0.9 + x * 1.3 + y * 0.7) * 0.5 + Math.sin(t * 2.1 + y * 2.3) * 0.25) * 0.55;
      const wx = Math.sin(t * 0.6 + y * 1.1) * 0.12;
      pos[k] = x + (x - prev[k]) * keep + wx * dt * dt;
      pos[k + 1] = y + (y - prev[k + 1]) * keep + g;
      pos[k + 2] = z + (z - prev[k + 2]) * keep + wind * dt * dt;
      prev[k] = x;
      prev[k + 1] = y;
      prev[k + 2] = z;
    }

    const { cA, cB, cRest, cKind } = this;
    const kStruct = this.stiffness;
    const kBend = this.stiffness * 0.45;
    for (let iter = 0; iter < 6; iter++) {
      for (let c = 0; c < cA.length; c++) {
        const p = cA[c] * 3;
        const q = cB[c] * 3;
        const dx = pos[q] - pos[p];
        const dy = pos[q + 1] - pos[p + 1];
        const dz = pos[q + 2] - pos[p + 2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = ((d - cRest[c]) / d) * (cKind[c] === 2 ? kBend : kStruct);
        const pp = pinned[cA[c]];
        const pq = pinned[cB[c]];
        if (pp && pq) continue;
        const wp = pp ? 0 : pq ? 1 : 0.5;
        const wq = pq ? 0 : pp ? 1 : 0.5;
        pos[p] += dx * diff * wp;
        pos[p + 1] += dy * diff * wp;
        pos[p + 2] += dz * diff * wp;
        pos[q] -= dx * diff * wq;
        pos[q + 1] -= dy * diff * wq;
        pos[q + 2] -= dz * diff * wq;
      }
      if (this.wallZ !== null) {
        const minZ = this.wallZ + 0.03;
        for (let i = 0; i < count; i++) {
          const k = i * 3 + 2;
          if (pos[k] < minZ) pos[k] = minZ;
        }
      }
    }
  }

  update(dt) {
    if (!dt) return;
    const step = 1 / 120;
    this.accumulator = Math.min(this.accumulator + dt, step * 8);
    while (this.accumulator >= step) {
      this.time += step;
      this._substep(step);
      this.accumulator -= step;
    }
    this._syncMesh();
    if (this.focusedInput && document.activeElement !== this.focusedInput) this.focusedInput.focus();
  }

  // Push a node (plus a ring of neighbours) along `dir`; strength scales with 1/mass like the original.
  poke(u, v, dir, strength = 1) {
    const { cols, rows } = this;
    const nx = Math.max(0, Math.min(cols, Math.round(u * cols)));
    const ny = Math.max(0, Math.min(rows, Math.round(v * rows)));
    const mag = (0.055 * strength) / Math.max(0.2, this.mass);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = nx + dx;
        const py = ny + dy;
        if (px < 0 || px > cols || py < 0 || py > rows) continue;
        const i = py * (cols + 1) + px;
        if (this.pinned[i]) continue;
        const f = dx === 0 && dy === 0 ? 1 : 0.4;
        this.prev[i * 3] -= dir.x * mag * f;
        this.prev[i * 3 + 1] -= dir.y * mag * f;
        this.prev[i * 3 + 2] -= dir.z * mag * f;
      }
    }
  }

  // Whole-sheet stroke: a downward and backward brush.
  pet() {
    const mag = 0.012 / Math.max(0.2, this.mass);
    for (let i = 0; i < this.count; i++) {
      if (this.pinned[i]) continue;
      this.prev[i * 3 + 1] += 2.6 * mag;
      this.prev[i * 3 + 2] += 1.0 * mag;
    }
  }

  setMass(v) {
    this.mass = v;
  }

  setStiffness(v) {
    this.stiffness = v;
  }

  setShine(v) {
    this.material.metalness = v;
    this.material.roughness = 1 - v * 0.85;
    this.material.needsUpdate = false;
  }

  /* ── mesh ────────────────────────────────────────────── */

  _buildMesh(metalness, glossiness) {
    const { cols, rows, count } = this;
    const geo = new THREE.BufferGeometry();
    const uv = new Float32Array(count * 2);
    const index = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const k = j * (cols + 1) + i;
        uv[k * 2] = i / cols;
        uv[k * 2 + 1] = j / rows;
        if (i < cols && j < rows) {
          const i0 = k;
          const i1 = k + 1;
          const i2 = k + cols + 1;
          const i3 = i2 + 1;
          index.push(i0, i2, i1, i1, i2, i3);
        }
      }
    }
    this.posAttr = new THREE.BufferAttribute(this.pos, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", this.posAttr);
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(index);
    geo.computeVertexNormals();
    this.geometry = geo;
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      metalness,
      roughness: 1 - glossiness * 0.85,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  _syncMesh() {
    this.posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /* ── texture ─────────────────────────────────────────── */

  _buildTexture() {
    const size = this.texSize;
    if (this.native) {
      const gl = this.renderer.getContext();
      const tex = gl.createTexture();
      this.renderer.state.bindTexture(gl.TEXTURE_2D, tex);
      const srgb = gl.SRGB8_ALPHA8 ?? gl.RGBA;
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, srgb, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.internalFormat = srgb;
      } catch {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.internalFormat = gl.RGBA;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // The sheet is viewed at a third of its texture size; mipmaps + anisotropy keep the small text legible.
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.generateMipmap(gl.TEXTURE_2D);
      this.anisoExt = aniso;
      this.renderer.state.unbindTexture();
      this.glTexture = tex;
      this.texture = new THREE.ExternalTexture(tex);
    } else {
      this.fallbackCanvas = document.createElement("canvas");
      this.fallbackCanvas.width = size;
      this.fallbackCanvas.height = size;
      const ctx = this.fallbackCanvas.getContext("2d");
      ctx.fillStyle = "#f4ead9";
      ctx.fillRect(0, 0, size, size);
      this.texture = new THREE.CanvasTexture(this.fallbackCanvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.flipY = false;
      this.texture.generateMipmaps = true;
      this.texture.minFilter = THREE.LinearMipmapLinearFilter;
      this.texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    }
    this.material.map = this.texture;
    this.material.needsUpdate = true;
  }

  _uploadNative() {
    const gl = this.renderer.getContext();
    if (!this.glTexture) return;
    this.renderer.state.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    try {
      const fn = gl.texElementImage2D;
      if (fn.length === 3) fn.call(gl, gl.TEXTURE_2D, this.internalFormat, this.sourceEl);
      else fn.call(gl, gl.TEXTURE_2D, 0, this.internalFormat, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceEl);
    } catch (err) {
      // First paint can race the layout pass; the next refresh retries.
      if (!this.warned) console.warn("[HtmlCloth] texElementImage2D failed", err);
      this.warned = true;
      texElement(gl, this.sourceEl);
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    this.renderer.state.unbindTexture();
  }

  // Re-capture the HTML into the texture after the browser's next paint (or a throttled rasterize).
  refresh() {
    if (this.native) {
      if (this.paintPending) return;
      this.paintPending = onNextPaint(this.canvas, () => {
        this.paintPending = null;
        this._uploadNative();
      });
      return;
    }
    this.rasterDirty = true;
    this._drainRaster();
  }

  _drainRaster() {
    if (this.rasterizing || !this.rasterDirty) return;
    const wait = FALLBACK_MIN_MS - (performance.now() - this.lastRaster);
    if (wait > 0) {
      if (!this.rasterTimer) {
        this.rasterTimer = setTimeout(() => {
          this.rasterTimer = null;
          this._drainRaster();
        }, wait);
      }
      return;
    }
    this.rasterizing = true;
    this.rasterDirty = false;
    const size = this.texSize;
    loadHtml2canvas()
      .then((html2canvas) => html2canvas(this.sourceEl, { backgroundColor: "#f4ead9", scale: 1, width: size, height: size, logging: false, useCORS: true }))
      .then((cv) => {
        if (!this.fallbackCanvas) return;
        const ctx = this.fallbackCanvas.getContext("2d");
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(cv, 0, 0, size, size);
        if (this.texture) this.texture.needsUpdate = true;
      })
      .catch((err) => {
        if (!this.warnedRaster) console.warn("[HtmlCloth] html2canvas failed", err);
        this.warnedRaster = true;
      })
      .finally(() => {
        this.lastRaster = performance.now();
        this.rasterizing = false;
        this._drainRaster();
      });
  }

  /* ── pointer → HTML ──────────────────────────────────── */

  _bindPointer() {
    this.onDown = (e) => this._pointer(e, "mousedown");
    this.onMove = (e) => this._pointer(e, "mousemove");
    this.onUp = (e) => this._pointer(e, "mouseup");
    window.addEventListener("pointerdown", this.onDown, true);
    window.addEventListener("pointermove", this.onMove, true);
    window.addEventListener("pointerup", this.onUp, true);
  }

  _raycastUV(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.mesh, false)[0];
    if (!hit?.uv) return null;
    return { u: hit.uv.x, v: hit.uv.y, point: hit.point, dir: this.raycaster.ray.direction.clone() };
  }

  _findInteractiveAt(x, y) {
    for (const el of this.sourceEl.querySelectorAll(INTERACTIVE)) {
      const r = el.getBoundingClientRect();
      const pad = el.tagName === "INPUT" && el.type === "range" ? 16 : 0;
      if (x >= r.left - pad && x < r.right + pad && y >= r.top - pad && y < r.bottom + pad) return el;
    }
    return null;
  }

  _leaveHover() {
    if (!this.hovered) return;
    this.hovered.classList?.remove("hover");
    this.hovered.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    this.hovered = null;
    this.canvas.style.cursor = "";
    this.refresh();
  }

  _pointer(e, type) {
    if (!this.sourceEl || this.dispatching) return;
    const overCanvas = e.target === this.canvas;
    const uv = overCanvas ? this._raycastUV(e.clientX, e.clientY) : null;
    if (uv) this.lastHitUV = uv;

    if (!uv) {
      this._leaveHover();
      if (type === "mouseup") {
        this.selecting = false;
        this.draggedSlider = null;
        this.downTarget = null;
      }
      if (type === "mousedown" && this.focusedInput && overCanvas) this._blurInput();
      return;
    }

    const rect = this.sourceEl.getBoundingClientRect();
    const clientX = rect.left + uv.u * rect.width;
    const clientY = rect.top + uv.v * rect.height;

    this.sourceEl.style.pointerEvents = "auto";
    const target =
      this._findInteractiveAt(clientX, clientY) || document.elementFromPoint(clientX, clientY) || this.sourceEl;
    const inSource = this.sourceEl.contains(target) ? target : this.sourceEl;
    this.lastPointer = { type, u: uv.u, v: uv.v, clientX, clientY, rect: [rect.left, rect.top, rect.width, rect.height], target: inSource.id || inSource.tagName };

    if (inSource !== this.hovered) {
      if (this.hovered) {
        this.hovered.classList?.remove("hover");
        this.hovered.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
      }
      inSource.classList?.add("hover");
      inSource.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
      this.hovered = inSource;
    }

    const tag = inSource.tagName;
    const inputType = tag === "INPUT" ? (inSource.type || "").toLowerCase() : "";
    const clickable = tag === "BUTTON" || tag === "A" || tag === "LABEL" || (tag === "INPUT" && !TEXT_INPUTS.has(inputType));
    this.canvas.style.cursor = clickable ? "pointer" : tag === "INPUT" || tag === "TEXTAREA" ? "text" : "crosshair";

    this.dispatching = true;
    inSource.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY, button: e.button, buttons: e.buttons }),
    );
    this.dispatching = false;

    if (type === "mousedown") {
      this.downTarget = inSource;
      this._clearHighlight();
      this.selReady = false;
      this.selecting = false;
      if (tag === "INPUT" && TEXT_INPUTS.has(inputType)) this._focusInput(inSource);
      else if (this.focusedInput) this._blurInput();
      if (tag === "INPUT" && inputType === "range") {
        this.draggedSlider = inSource;
        this._slideTo(inSource, clientX);
      } else if (!INTERACTIVE_TAGS.has(tag)) {
        const range = document.caretRangeFromPoint?.(clientX, clientY);
        if (range && this.sourceEl.contains(range.startContainer)) {
          this.selAnchor = { node: range.startContainer, offset: range.startOffset };
          this.selReady = true;
        }
      }
    } else if (type === "mousemove" && this.draggedSlider) {
      this._slideTo(this.draggedSlider, clientX);
    } else if (type === "mousemove" && (this.selecting || this.selReady)) {
      this.selecting = true;
      this.selReady = false;
      this._selectTo(clientX, clientY);
    } else if (type === "mouseup") {
      if (this.downTarget && !this.selecting && !this.draggedSlider) {
        this.dispatching = true;
        inSource.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX, clientY, button: e.button }));
        this.dispatching = false;
        if (!INTERACTIVE_TAGS.has(tag) && !inSource.closest?.(INTERACTIVE)) {
          this.poke(uv.u, uv.v, uv.dir, 1);
          this.onPoke?.(uv);
        }
      }
      this.downTarget = null;
      this.draggedSlider = null;
      this.selecting = false;
      this.selReady = false;
    }

    this.sourceEl.style.pointerEvents = "none";
    this.refresh();
  }

  _slideTo(slider, clientX) {
    const r = slider.getBoundingClientRect();
    if (!r.width) return;
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const step = Number(slider.step) || 1;
    let v = min + Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (max - min);
    v = Math.max(min, Math.min(max, Math.round(v / step) * step));
    if (String(slider.value) === String(v)) return;
    slider.value = v;
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }

  _focusInput(el) {
    this.focusedInput = el;
    el.focus();
  }

  _blurInput() {
    this.focusedInput?.blur();
    this.focusedInput = null;
  }

  _selectTo(clientX, clientY) {
    this._clearHighlight();
    const range = document.caretRangeFromPoint?.(clientX, clientY);
    const anchor = this.selAnchor;
    if (!range || !anchor || !this.sourceEl.contains(range.startContainer)) return;
    const r = document.createRange();
    try {
      const cmp = anchor.node.compareDocumentPosition(range.startContainer);
      const anchorFirst =
        cmp & Node.DOCUMENT_POSITION_FOLLOWING ||
        (anchor.node === range.startContainer && anchor.offset <= range.startOffset);
      if (anchorFirst) {
        r.setStart(anchor.node, anchor.offset);
        r.setEnd(range.startContainer, range.startOffset);
      } else {
        r.setStart(range.startContainer, range.startOffset);
        r.setEnd(anchor.node, anchor.offset);
      }
      if (!r.collapsed) this._highlight(r);
    } catch {
      /* caret landed outside a text node */
    }
  }

  _highlight(range) {
    const root =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) if (range.intersectsNode(n)) nodes.push(n);
    for (const node of nodes) {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.length;
      if (start >= end) continue;
      const part = node.splitText(start);
      part.splitText(end - start);
      const mark = document.createElement("mark");
      mark.style.cssText = "background:#338fff;color:#fff;";
      part.parentNode.insertBefore(mark, part);
      mark.appendChild(part);
      this.marks.push(mark);
    }
  }

  _clearHighlight() {
    for (const mark of this.marks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
    this.marks = [];
  }

  /* ── teardown ────────────────────────────────────────── */

  dispose() {
    window.removeEventListener("pointerdown", this.onDown, true);
    window.removeEventListener("pointermove", this.onMove, true);
    window.removeEventListener("pointerup", this.onUp, true);
    this.paintPending?.();
    if (this.rasterTimer) clearTimeout(this.rasterTimer);
    this._clearHighlight();
    this.geometry.dispose();
    this.material.dispose();
    this.texture?.dispose();
    if (this.glTexture) this.renderer.getContext().deleteTexture(this.glTexture);
    this.group.removeFromParent();
  }
}
