// The HTML that is painted onto the cloth: a paper lab journal with a live beaker, readouts,
// the assistant's one-liners and the cloth controls (mass / stiffness / shine / colour).
// Styled with system fonts only so the no-flag rasterizer draws it the same way.

export const SPEECH = {
  idle: ["…", "…jiddiymi?", "salom.", "nima.", "xo'p.", "…va?", "hali shu yerdaman.", "zo'r.", "hmm."],
  pet: ["…iltimos.", "qilmang.", "g'alati.", "mayli.", "ajoyib.", "voy.", "xo'p bo'ldi.", "…"],
  poke: ["oy.", "ha.", "zo'r.", "ajoyib.", "qiziq.", "to'xtang.", "…jiddiymi?"],
  talk: ["voy.", "qiziq.", "…va?", "aha.", "yaxshi ekan.", "xo'p.", "…mayli.", "mm-hm."],
  mass: ["massam {v}mi? zo'r.", "{v}? mayli.", "endi {v} manmi?", "{v} yaxshiroqmi?", "bo'pti, {v} bo'lsin."],
  stiff: ["qattiqlik {v}. zo'r.", "{v}? mayli.", "buni his qilyapman.", "xo'p.", "{v}. voy."],
  shine: ["endi metalmanmi?", "yaltiroq.", "nega.", "{v} yaltirash. zo'r.", "menga qarang-da.", "voy."],
  color: ["qiziq.", "yoqmadi.", "dadil tanlov.", "…mayli.", "voy.", "rostdanmi?", "bu ham rang."],
  pour: ["{n} quyildi. xo'p.", "{n}? mayli.", "yana {n}. ehtiyot bo'ling.", "{n}. ko'ramiz."],
  react: ["{t} …zo'r.", "{t} buni kutgandim.", "{t} ko'zoynak taqdingizmi?", "{t} jurnalga yozdim."],
  heatOn: ["gorelka yoqildi. issiq.", "qizdiryapmiz. xo'p.", "olov. ajoyib."],
  heatOff: ["o'chdi. nihoyat.", "soviyapti.", "xo'p, bas."],
  clear: ["toza idish. yangi boshlanish.", "hammasi to'kildi. mayli.", "bo'sh. yana?"],
  boil: ["qaynayapti. qarang.", "bug'. ehtiyot bo'ling.", "100°C. xo'p."],
};

export const pickSpeech = (key, vars = {}) => {
  const pool = SPEECH[key] || SPEECH.idle;
  let line = pool[Math.floor(Math.random() * pool.length)];
  for (const [k, v] of Object.entries(vars)) line = line.replace(`{${k}}`, v);
  return line;
};

const CSS = `
#htc-root {
  --bg: #f4ead9; --bg-panel: #ede1c6; --ink: #2a1f18; --ink-dim: rgba(42,31,24,0.55);
  --accent: #d4654e; --line: rgba(42,31,24,0.2);
  position: relative; width: 100%; height: 100%; padding: 50px 56px; box-sizing: border-box;
  background: var(--bg); color: var(--ink);
  font-family: "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace; overflow: hidden;
}
#htc-root *, #htc-root *::before, #htc-root *::after { box-sizing: border-box; }
#htc-root::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: radial-gradient(circle at 30% 20%, rgba(0,0,0,.04) 2px, transparent 3px),
    radial-gradient(circle at 70% 60%, rgba(0,0,0,.035) 2px, transparent 3px),
    radial-gradient(circle at 45% 85%, rgba(0,0,0,.03) 2px, transparent 3px);
  background-size: 320px 320px, 420px 420px, 380px 380px;
}
.topbar { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 3px solid var(--ink); padding-bottom: 18px; margin-bottom: 28px; }
.topbar .name { font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; font-weight: 800; font-size: 78px; line-height: .9; letter-spacing: -.03em; }
.topbar .name .diamond { color: var(--accent); margin-right: 10px; }
.topbar .est { font-size: 17px; letter-spacing: .25em; font-weight: 500; color: var(--ink-dim); text-transform: uppercase; }
.main { display: grid; grid-template-columns: 330px 1fr; gap: 42px; margin-bottom: 30px; }
.face-col { display: flex; flex-direction: column; gap: 20px; }
.face-frame { position: relative; border: 3px solid var(--ink); border-radius: 6px; padding: 12px; background: var(--bg-panel); }
.face-frame::before { content: 'IDISH'; position: absolute; top: -13px; left: 20px; background: var(--bg); padding: 0 10px; font-size: 15px; font-weight: 700; letter-spacing: .3em; color: var(--accent); }
#htc-beaker { display: block; width: 100%; height: auto; aspect-ratio: 1 / 1.12; border-radius: 4px; }
.id-strip { display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--line); font-size: 14px; letter-spacing: .1em; color: var(--ink-dim); font-weight: 500; }
.mood { display: flex; align-items: center; gap: 12px; font-size: 15px; letter-spacing: .2em; font-weight: 700; color: var(--ink-dim); text-transform: uppercase; }
.mood-dot { width: 18px; height: 18px; border-radius: 50%; background: #6a8f65; box-shadow: 0 0 0 5px rgba(106,143,101,.2); }
.ctrl-col { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.speech { font-family: Georgia, "DejaVu Serif", serif; font-style: italic; font-size: 54px; line-height: 1.1; padding-bottom: 16px; border-bottom: 1px solid var(--line); min-height: 78px; overflow: hidden; }
.readouts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ro { border: 2px solid var(--ink); border-radius: 8px; padding: 10px 12px; background: var(--bg-panel); }
.ro .k { font-size: 13px; letter-spacing: .22em; color: var(--ink-dim); font-weight: 700; }
.ro .v { font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; font-weight: 800; font-size: 26px; line-height: 1.15; margin-top: 4px; white-space: nowrap; }
.eq { font-size: 22px; font-weight: 700; padding: 12px 14px; border-left: 6px solid var(--accent); background: rgba(212,101,78,.08); min-height: 56px; white-space: nowrap; }
.eq small { display: block; font-size: 14px; letter-spacing: .2em; color: var(--ink-dim); margin-bottom: 4px; }
.sliders { display: flex; flex-direction: column; gap: 18px; }
.slider-row { display: grid; grid-template-columns: 150px 1fr 80px; align-items: center; gap: 18px; }
.slider-label { font-weight: 700; font-size: 18px; letter-spacing: .2em; }
.slider-value { font-weight: 700; font-size: 18px; color: var(--accent); text-align: right; }
input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; background: rgba(42,31,24,.18); outline: none; padding: 0; margin: 0; border-radius: 3px; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); border: 3px solid var(--ink); cursor: pointer; }
input[type="range"]::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); border: 3px solid var(--ink); cursor: pointer; }
input[type="range"].hover::-webkit-slider-thumb { transform: scale(1.25); }
.theme-row { display: flex; align-items: center; gap: 18px; }
.theme-row label { font-weight: 700; font-size: 18px; letter-spacing: .2em; }
#htc-bg { width: 56px; height: 56px; border: 3px solid var(--ink); border-radius: 10px; padding: 0; background: transparent; cursor: pointer; overflow: hidden; }
#htc-bg.hover { transform: scale(1.08); }
.actions { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 20px; border-top: 3px solid var(--ink); padding-top: 26px; }
.btn { font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; font-weight: 800; font-size: 30px; letter-spacing: .04em; padding: 22px 12px; background: transparent; color: var(--ink); border: 3px solid var(--ink); border-radius: 12px; cursor: pointer; text-transform: uppercase; }
.btn.hover { background: var(--ink); color: var(--bg); transform: translate(-3px,-3px); box-shadow: 6px 6px 0 var(--accent); }
.btn.active { background: var(--accent); color: var(--bg); }
.talk-input { grid-column: 1 / -1; font-family: Arial, sans-serif; font-weight: 700; font-size: 30px; padding: 14px 20px; border: 3px solid var(--ink); border-radius: 8px; background: #fff; color: var(--ink); outline: none; width: 100%; display: none; margin-top: 2px; }
.talk-input.active { display: block; }
.talk-input::placeholder { color: var(--ink-dim); font-style: italic; }
`;

const HTML = `
<div id="htc-root">
  <header class="topbar">
    <span class="name"><span class="diamond">◆</span>SimuLink</span>
    <span class="est">KIMYO JURNALI · 2026</span>
  </header>
  <div class="main">
    <div class="face-col">
      <div class="face-frame"><canvas id="htc-beaker" width="300" height="336"></canvas></div>
      <div class="id-strip"><span>IDISH / 250 ml</span><span id="htc-state">HOLAT / BO'SH</span></div>
      <div class="mood"><span>KAYFIYAT</span><span class="mood-dot" id="htc-mood"></span><span id="htc-mood-text">TINCH</span></div>
    </div>
    <div class="ctrl-col">
      <div class="speech" id="htc-speech">"…jiddiymi?"</div>
      <div class="readouts">
        <div class="ro"><div class="k">HARORAT</div><div class="v" id="htc-temp">22.0°C</div></div>
        <div class="ro"><div class="k">pH</div><div class="v" id="htc-ph">7.0</div></div>
        <div class="ro"><div class="k">HAJM</div><div class="v" id="htc-vol">0 ml</div></div>
        <div class="ro"><div class="k">MODDA</div><div class="v" id="htc-sub">—</div></div>
      </div>
      <div class="eq"><small id="htc-eq-k">REAKSIYA</small><span id="htc-eq">Idish bo'sh. Reaktiv tanlang.</span></div>
      <div class="sliders">
        <div class="slider-row"><span class="slider-label">MASSA</span><input type="range" id="htc-mass" min="0.3" max="5" step="0.1" value="1.2"><span class="slider-value" id="htc-mass-val">1.2</span></div>
        <div class="slider-row"><span class="slider-label">QATTIQLIK</span><input type="range" id="htc-stiff" min="0.1" max="1" step="0.05" value="0.9"><span class="slider-value" id="htc-stiff-val">0.90</span></div>
        <div class="slider-row"><span class="slider-label">YALTIRASH</span><input type="range" id="htc-shine" min="0" max="1" step="0.05" value="0.5"><span class="slider-value" id="htc-shine-val">0.50</span></div>
      </div>
      <div class="theme-row"><label for="htc-bg">RANG</label><input type="color" id="htc-bg" value="#d4654e"></div>
    </div>
  </div>
  <div class="actions">
    <button class="btn" id="htc-pet">Silang</button>
    <button class="btn" id="htc-poke">Turting</button>
    <button class="btn" id="htc-talk">Gapiring</button>
    <input class="talk-input" id="htc-talk-input" type="text" placeholder="biror narsa yozing...">
  </div>
</div>`;

const MOODS = [
  [3, "TINCH", "#6a8f65"],
  [8, "CHARCHAGAN", "#c59c3e"],
  [16, "ASABIY", "#d4654e"],
  [Infinity, "TAMOM", "#8e3a2e"],
];

export const createLabCard = (size = 1024) => {
  const el = document.createElement("div");
  el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;position:relative;`;
  el.innerHTML = `<style>${CSS}</style>${HTML}`;
  const $ = (id) => el.querySelector(`#${id}`);
  const refs = {
    root: $("htc-root"),
    beaker: $("htc-beaker"),
    state: $("htc-state"),
    mood: $("htc-mood"),
    moodText: $("htc-mood-text"),
    speech: $("htc-speech"),
    temp: $("htc-temp"),
    ph: $("htc-ph"),
    vol: $("htc-vol"),
    sub: $("htc-sub"),
    eqK: $("htc-eq-k"),
    eq: $("htc-eq"),
    mass: $("htc-mass"),
    massVal: $("htc-mass-val"),
    stiff: $("htc-stiff"),
    stiffVal: $("htc-stiff-val"),
    shine: $("htc-shine"),
    shineVal: $("htc-shine-val"),
    bg: $("htc-bg"),
    pet: $("htc-pet"),
    poke: $("htc-poke"),
    talk: $("htc-talk"),
    talkInput: $("htc-talk-input"),
  };
  let interactions = 0;
  let lastSpeak = -999;
  let elapsed = 0;
  let tick = 0;

  const setSpeech = (text) => {
    refs.speech.textContent = `"${text}"`;
    lastSpeak = elapsed;
  };
  const react = (key, vars) => {
    setSpeech(pickSpeech(key, vars));
    interactions += 1;
    const [, label, color] = MOODS.find(([limit]) => interactions < limit);
    refs.moodText.textContent = label;
    refs.mood.style.background = color;
    refs.mood.style.boxShadow = `0 0 0 5px ${color}30`;
  };

  // Idle chatter every ~9 s of silence, like the original Curtis.
  const tickIdle = (dt) => {
    elapsed += dt;
    if (elapsed - lastSpeak > 9) setSpeech(pickSpeech("idle"));
  };

  const setReadout = ({ tempC, ph, volumeMl, substance, equation, equationLabel, stateLabel }) => {
    refs.temp.textContent = `${tempC.toFixed(1)}°C`;
    refs.ph.textContent = ph.toFixed(1);
    refs.vol.textContent = `${Math.round(volumeMl)} ml`;
    refs.sub.textContent = substance || "—";
    refs.eqK.textContent = equationLabel || "REAKSIYA";
    refs.eq.textContent = equation || "Idish bo'sh. Reaktiv tanlang.";
    refs.state.textContent = `HOLAT / ${stateLabel || "BO'SH"}`;
  };

  // Mini beaker drawn in 2D; the canvas size is nudged each frame so the paint snapshot refreshes.
  const drawBeaker = ({ liquidColor, fill, heating, bubbling, smoke, tempC }) => {
    const cv = refs.beaker;
    tick += 1;
    cv.width = 300 + (tick & 1);
    cv.height = 336;
    const ctx = cv.getContext("2d");
    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#4a6984");
    grad.addColorStop(1, "#1c2e3d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const bx = 60;
    const by = 44;
    const bw = w - 120;
    const bh = h - 92;
    const level = by + bh - bh * 0.92 * fill;
    if (fill > 0) {
      ctx.fillStyle = liquidColor;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(bx + 6, level, bw - 12, by + bh - level - 6);
      ctx.globalAlpha = 1;
      if (bubbling) {
        ctx.fillStyle = "rgba(255,255,255,.75)";
        for (let i = 0; i < 14; i++) {
          const px = bx + 14 + ((i * 37 + tick * 2) % (bw - 28));
          const py = by + bh - 10 - ((i * 53 + tick * 3) % Math.max(10, by + bh - level - 10));
          ctx.beginPath();
          ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.lineTo(bx, by + 8);
    ctx.lineTo(bx, by + bh);
    ctx.quadraticCurveTo(bx, by + bh + 12, bx + 12, by + bh + 12);
    ctx.lineTo(bx + bw - 12, by + bh + 12);
    ctx.quadraticCurveTo(bx + bw, by + bh + 12, bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + 8);
    ctx.lineTo(bx + bw + 10, by);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      const y = by + bh - (bh * 0.92 * i) / 5;
      ctx.beginPath();
      ctx.moveTo(bx + bw - 34, y);
      ctx.lineTo(bx + bw - 8, y);
      ctx.stroke();
    }
    if (smoke) {
      ctx.fillStyle = "rgba(230,230,230,.35)";
      for (let i = 0; i < 6; i++) {
        const r = 16 + ((tick * 2 + i * 31) % 40);
        ctx.beginPath();
        ctx.arc(bx + bw / 2 + Math.sin((tick + i * 20) * 0.05) * 30, by - 10 - ((tick * 1.5 + i * 23) % 60), r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (heating) {
      const flick = 0.85 + Math.sin(tick * 0.6) * 0.15;
      const fg = ctx.createRadialGradient(w / 2, h - 6, 4, w / 2, h - 6, 60 * flick);
      fg.addColorStop(0, "rgba(255,240,180,.95)");
      fg.addColorStop(0.4, "rgba(255,140,40,.8)");
      fg.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, h - 90, w, 90);
    }
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${tempC.toFixed(0)}°C`, 14, 26);
  };

  // Hooks the cloth controls + talk box; returns an unwire function.
  const wire = ({ cloth, onTalk }) => {
    let talkActive = false;
    const closeTalk = (submit) => {
      const text = refs.talkInput.value.trim();
      refs.talkInput.value = "";
      refs.talkInput.classList.remove("active");
      refs.talk.classList.remove("active");
      talkActive = false;
      refs.talkInput.blur();
      cloth.focusedInput = null;
      if (submit && text) {
        react("talk");
        onTalk?.(text);
      }
    };
    refs.pet.addEventListener("click", () => {
      cloth.pet();
      react("pet");
    });
    refs.poke.addEventListener("click", () => {
      const uv = cloth.lastHitUV || { u: 0.5, v: 0.85 };
      cloth.poke(uv.u, uv.v, uv.dir || { x: 0, y: 0, z: -1 }, 1.6);
      react("poke");
    });
    refs.talk.addEventListener("click", () => {
      if (talkActive) return closeTalk(false);
      talkActive = true;
      refs.talkInput.classList.add("active");
      refs.talk.classList.add("active");
      cloth.focusedInput = refs.talkInput;
      refs.talkInput.focus();
    });
    refs.talkInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") closeTalk(true);
      else if (e.key === "Escape") closeTalk(false);
      cloth.refresh();
    });
    refs.talkInput.addEventListener("input", () => cloth.refresh());
    refs.mass.addEventListener("input", () => {
      refs.massVal.textContent = Number(refs.mass.value).toFixed(1);
      cloth.setMass(Number(refs.mass.value));
      react("mass", { v: refs.massVal.textContent });
    });
    refs.stiff.addEventListener("input", () => {
      refs.stiffVal.textContent = Number(refs.stiff.value).toFixed(2);
      cloth.setStiffness(Number(refs.stiff.value));
      react("stiff", { v: refs.stiffVal.textContent });
    });
    refs.shine.addEventListener("input", () => {
      refs.shineVal.textContent = Number(refs.shine.value).toFixed(2);
      cloth.setShine(Number(refs.shine.value));
      react("shine", { v: refs.shineVal.textContent });
    });
    refs.bg.addEventListener("input", () => {
      refs.root.style.setProperty("--accent", refs.bg.value);
      react("color");
    });
    cloth.onPoke = () => react("poke");
  };

  return { el, refs, setSpeech, react, tickIdle, setReadout, drawBeaker, wire };
};
