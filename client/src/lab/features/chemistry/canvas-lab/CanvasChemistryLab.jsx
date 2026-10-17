import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Droplet,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Beaker,
  Thermometer,
  Shield,
  Layers,
  Activity,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { HtmlClothPhysics } from "./physics/HtmlClothPhysics";
import { setupDrawableCanvas, makeDrawable, dispatchCanvasPointerEvent } from "./htmlInCanvas";

// Sound effects generator via Web Audio API (zero external assets needed, ultra reliable)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }
  playPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    // White noise explosion
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  playSizzle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  playDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
}

const sfx = new SoundFX();

export default function CanvasChemistryLab() {
  const canvasRef = useRef(null);
  const clothRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const bannerContainerRef = useRef(null);

  // Bench and reaction state
  const [vesselType, setVesselType] = useState("beaker"); // beaker, flask, tube
  const [burnerActive, setBurnerActive] = useState(false);
  const [burnerFlameType, setBurnerFlameType] = useState("blue"); // blue (1300C) or yellow (750C)
  const [buretteDripping, setBuretteDripping] = useState(false);
  const [buretteLiquid, setBuretteLiquid] = useState("NaOH");
  const [temperature, setTemperature] = useState(22.0); // deg C
  const [phValue, setPhValue] = useState(7.0);
  const [activeTab, setActiveTab] = useState("acids");
  const [isExploded, setIsExploded] = useState(false);
  const [explosionType, setExplosionType] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeScenario, setActiveScenario] = useState("");

  // Fluid & mixture contents inside the active vessel
  const [contents, setContents] = useState({
    volume: 80, // ml
    color: "rgba(235, 245, 255, 0.45)", // transparent water
    precipitate: null, // null, "blue", "white", "brown"
    precipitateAmount: 0,
    solutes: { H2O: 80 },
    hasPhenolphthalein: false,
    hasUniversalIndicator: false,
    bubbles: [], // particle array
    sparks: [],
    smoke: [],
  });

  // Reaction rule telemetry
  const [reactionLog, setReactionLog] = useState([
    "Laboratoriya xonasi tayyor. Xavfsizlik qoidalariga rioya qiling.",
    "Idish: 80 ml toza distillangan suv (H₂O) bilan to'ldirilgan.",
  ]);

  const addLog = (msg) => {
    setReactionLog((prev) => [msg, ...prev.slice(0, 7)]);
  };

  // Reagent Catalog
  const REAGENTS = {
    acids: [
      { id: "HCl", name: "Xlorid kislota (HCl, 1M)", formula: "HCl", type: "acid", ph: 1.0, color: "rgba(220, 240, 255, 0.5)" },
      { id: "H2SO4", name: "Sulfat kislota (H₂SO₄, 18M)", formula: "H₂SO₄", type: "acid_conc", ph: 0.2, color: "rgba(240, 245, 230, 0.6)" },
      { id: "HNO3", name: "Nitrat kislota (HNO₃, 2M)", formula: "HNO₃", type: "acid", ph: 1.2, color: "rgba(255, 250, 220, 0.5)" },
      { id: "CH3COOH", name: "Sirka kislotasi (CH₃COOH)", formula: "CH₃COOH", type: "acid_weak", ph: 3.2, color: "rgba(245, 250, 255, 0.4)" },
    ],
    bases: [
      { id: "NaOH", name: "O'yuvchi natriy (NaOH, 1M)", formula: "NaOH", type: "base", ph: 13.5, color: "rgba(230, 240, 255, 0.5)" },
      { id: "KOH", name: "Kaliy gidroksid (KOH, 1M)", formula: "KOH", type: "base", ph: 13.6, color: "rgba(230, 240, 255, 0.5)" },
      { id: "NH3", name: "Ammiakli suv (NH₃·H₂O, 10%)", formula: "NH₃", type: "base_weak", ph: 11.2, color: "rgba(240, 245, 255, 0.4)" },
    ],
    salts: [
      { id: "CuSO4", name: "Mis kuporosi (CuSO₄ eritmasi)", formula: "CuSO₄", type: "salt_cu", ph: 5.5, color: "rgba(30, 144, 255, 0.75)" },
      { id: "AgNO3", name: "Kumush nitrat (AgNO₃)", formula: "AgNO₃", type: "salt_ag", ph: 6.0, color: "rgba(240, 245, 255, 0.5)" },
      { id: "KMnO4", name: "Margantsovka (KMnO₄ kristallari)", formula: "KMnO₄", type: "salt_kmno4", ph: 7.0, color: "rgba(148, 0, 211, 0.85)" },
      { id: "MnO2", name: "Marganes dioksid (MnO₂ kukuni)", formula: "MnO₂", type: "catalyst", ph: 7.0, color: "rgba(35, 30, 30, 0.9)" },
      { id: "NaHCO3", name: "Natriy gidrokarbonat (Osh sodasi)", formula: "NaHCO₃", type: "bicarb", ph: 8.4, color: "rgba(255, 255, 255, 0.7)" },
      { id: "NaCl", name: "Osh tuzi (NaCl eritmasi)", formula: "NaCl", type: "salt", ph: 7.0, color: "rgba(240, 245, 255, 0.4)" },
    ],
    metals: [
      { id: "Na", name: "Natriy bo'lagi (Na metall)", formula: "Na", type: "metal_na", ph: 7.0, solid: true },
      { id: "Mg", name: "Magniy lentasi (Mg)", formula: "Mg", type: "metal_mg", ph: 7.0, solid: true },
      { id: "Zn", name: "Rux granulalari (Zn)", formula: "Zn", type: "metal_zn", ph: 7.0, solid: true },
    ],
    indicators: [
      { id: "phenolphthalein", name: "Fenolftalein (spirtli eritma)", formula: "PhPh", type: "ind_phph" },
      { id: "universal", name: "Universal Indikator", formula: "UnivInd", type: "ind_univ" },
      { id: "litmus", name: "Lakmus eritmasi", formula: "Litmus", type: "ind_litmus" },
    ],
    solvents: [
      { id: "H2O", name: "Distillangan suv (H₂O)", formula: "H₂O", type: "water", ph: 7.0, color: "rgba(235, 245, 255, 0.45)" },
      { id: "H2O2", name: "Konsentrlangan Peroksid (30% H₂O₂)", formula: "H₂O₂", type: "peroxide_conc", ph: 5.5, color: "rgba(240, 250, 255, 0.5)" },
      { id: "glycerin", name: "Glitserin (C₃H₈O₃)", formula: "C₃H₈O₃", type: "glycerin", ph: 7.0, color: "rgba(250, 248, 235, 0.65)" },
      { id: "ethanol", name: "Tibbiy Etil spirti (C₂H₅OH)", formula: "C₂H₅OH", type: "ethanol", ph: 7.0, color: "rgba(240, 245, 255, 0.35)" },
    ],
  };

  // Initialize Cloth Simulation
  useEffect(() => {
    clothRef.current = new HtmlClothPhysics({
      width: 290,
      height: 320,
      cols: 14,
      rows: 14,
      mass: 1.1,
      damping: 0.045,
      stiffness: 0.88,
      gravity: 9.8,
    });

    if (canvasRef.current) {
      setupDrawableCanvas(canvasRef.current);
    }
  }, []);

  // Update sound mute state
  useEffect(() => {
    sfx.muted = soundMuted;
  }, [soundMuted]);

  // Handle adding chemicals and calculating reactions
  const addReagent = useCallback((item) => {
    if (isExploded) {
      addLog("⚠️ Idish shikastlangan! Avval 'Tozalash' tugmasini bosing.");
      return;
    }

    sfx.playDrop();
    clothRef.current?.reactSpeech("idle", `${item.name} qo'shildi.`);

    setContents((prev) => {
      const nextSolutes = { ...prev.solutes, [item.id]: (prev.solutes[item.id] || 0) + 15 };
      let newVolume = Math.min(240, prev.volume + (item.solid ? 2 : 20));
      let newColor = prev.color;
      let newPrecipitate = prev.precipitate;
      let newPrecipAmount = prev.precipitateAmount;
      let newPh = phValue;
      let newTemp = temperature;

      // 1. Indicator additions
      let hasPhPh = prev.hasPhenolphthalein || item.id === "phenolphthalein";
      let hasUniv = prev.hasUniversalIndicator || item.id === "universal";

      if (item.id === "phenolphthalein") {
        addLog("🧪 Fenolftalein indikatori qo'shildi (kislotada rangsiz, asosda malina rang).");
      }
      if (item.id === "universal") {
        addLog("🌈 Universal indikator qo'shildi (pH shkalasiga mos rang beradi).");
      }

      // 2. Acid or Base pH updates
      if (item.type?.startsWith("acid")) {
        newPh = Math.max(0.5, newPh - (item.type === "acid_conc" ? 4.5 : 2.5));
        newTemp += (item.type === "acid_conc" ? 18 : 3);
        addLog(`🧪 ${item.formula} qo'shildi. pH pasaydi: ${newPh.toFixed(1)}`);
      } else if (item.type?.startsWith("base")) {
        newPh = Math.min(14.0, newPh + (item.type === "base" ? 3.5 : 1.8));
        newTemp += 2.5;
        addLog(`🧪 ${item.formula} qo'shildi. pH ko'tarildi: ${newPh.toFixed(1)}`);
      }

      // 3. EXPLOSIVE COMBINATIONS & ENERGETIC REACTIONS!
      // A) Sodium + Water detonation: 2Na + 2H2O -> 2NaOH + H2 (Ignition & Pop!)
      if (item.id === "Na" && nextSolutes["H2O"]) {
        sfx.playExplosion();
        clothRef.current?.reactSpeech("explosion", "BOOM! Natriy suv bilan shiddatli portladi! 💥");
        addLog("💥 SHIDDATLI REAKSIYA: 2Na + 2H₂O → 2NaOH + H₂↑ (Olov va portlash!)");
        setIsExploded(true);
        setExplosionType("sodium");
        newPh = 13.8;
        newTemp = 110;
        return {
          ...prev,
          volume: Math.max(20, newVolume - 30),
          color: "rgba(255, 140, 0, 0.8)",
          sparks: Array.from({ length: 45 }, () => ({
            x: 0, y: 0, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 2, life: 1.0, color: "#ff8800"
          })),
          smoke: Array.from({ length: 25 }, () => ({
            x: 0, y: -20, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3 - 2, size: 10, life: 1.0
          })),
        };
      }

      // B) Catalytic decomposition: 30% H2O2 + MnO2 -> 2H2O + O2 (Boiling Oxygen Geyser!)
      if ((item.id === "MnO2" && nextSolutes["H2O2"]) || (item.id === "H2O2" && nextSolutes["MnO2"])) {
        sfx.playSizzle();
        clothRef.current?.reactSpeech("heat", "Katalitik portlash! Qaynoq kislorod geyzeri! 🌋");
        addLog("🌋 KATALITIK GEYZER: 2H₂O₂ (MnO₂) → 2H₂O + O₂↑ (Katta miqdorda issiqlik va ko'pik!)");
        newTemp = 98;
        return {
          ...prev,
          volume: Math.min(220, newVolume + 30),
          color: "rgba(100, 100, 100, 0.7)",
          bubbles: Array.from({ length: 50 }, () => ({
            x: (Math.random() - 0.5) * 60, y: Math.random() * 60, r: Math.random() * 6 + 2, vy: Math.random() * 4 + 3
          })),
          smoke: Array.from({ length: 30 }, () => ({
            x: 0, y: -40, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5 - 4, size: 15, life: 1.2
          })),
        };
      }

      // C) Hypergolic delay: KMnO4 + Glycerin -> violent purple fire!
      if ((item.id === "KMnO4" && nextSolutes["glycerin"]) || (item.id === "glycerin" && nextSolutes["KMnO4"])) {
        sfx.playExplosion();
        clothRef.current?.reactSpeech("explosion", "KMnO₄ va glitserin o'z-o'zidan alangalandi! 🔥");
        addLog("🔥 O'Z-O'ZIDAN ALANGALANISH: 14KMnO₄ + 4C₃H₈O₃ → binafsha olov va tutun!");
        newTemp = 180;
        return {
          ...prev,
          color: "rgba(128, 0, 128, 0.9)",
          sparks: Array.from({ length: 40 }, () => ({
            x: 0, y: 0, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 3, life: 1.0, color: "#bf00ff"
          })),
        };
      }

      // D) Acid + Carbonate effervescent foaming: HCl + NaHCO3 -> NaCl + H2O + CO2
      if ((item.id === "HCl" && nextSolutes["NaHCO3"]) || (item.id === "NaHCO3" && nextSolutes["HCl"])) {
        sfx.playSizzle();
        clothRef.current?.reactSpeech("idle", "Shiddatli ko'piklanish! CO₂ ajralyapti.");
        addLog("🫧 KO'PIKLANISH: NaHCO₃ + HCl → NaCl + H₂O + CO₂↑");
        return {
          ...prev,
          volume: Math.min(230, newVolume + 20),
          bubbles: Array.from({ length: 40 }, () => ({
            x: (Math.random() - 0.5) * 70, y: Math.random() * 80, r: Math.random() * 4 + 1.5, vy: Math.random() * 3 + 2
          })),
        };
      }

      // E) Copper Sulfate + NaOH precipitate: CuSO4 + 2NaOH -> Cu(OH)2 (Royal Blue Precipitate)
      if ((item.id === "NaOH" && nextSolutes["CuSO4"]) || (item.id === "CuSO4" && nextSolutes["NaOH"])) {
        addLog("🔵 CHO'KMA HOSIL BO'LDI: CuSO₄ + 2NaOH → Cu(OH)₂↓ (To'q ko'k rangli jele cho'kma)");
        newPrecipitate = "blue";
        newPrecipAmount = 45;
        newColor = "rgba(0, 100, 220, 0.85)";
      }

      // F) Silver Nitrate + HCl / NaCl: AgNO3 + Cl- -> AgCl (Curdy White Precipitate)
      if ((item.id === "AgNO3" && (nextSolutes["HCl"] || nextSolutes["NaCl"])) ||
          ((item.id === "HCl" || item.id === "NaCl") && nextSolutes["AgNO3"])) {
        addLog("⚪ CHO'KMA: AgNO₃ + NaCl → AgCl↓ + NaNO₃ (Oq suzmasimon cho'kma)");
        newPrecipitate = "white";
        newPrecipAmount = 50;
        newColor = "rgba(240, 245, 255, 0.9)";
      }

      // 4. Indicator Color Logic
      if (hasPhPh) {
        if (newPh >= 8.3) {
          newColor = "rgba(255, 20, 147, 0.75)"; // Vibrant Fuchsia / Pink
        } else if (!newPrecipitate) {
          newColor = "rgba(235, 245, 255, 0.4)"; // Colorless in acid
        }
      } else if (hasUniv) {
        if (newPh < 3) newColor = "rgba(255, 50, 50, 0.8)"; // Red
        else if (newPh < 6) newColor = "rgba(255, 165, 0, 0.8)"; // Orange
        else if (newPh < 8) newColor = "rgba(50, 205, 50, 0.8)"; // Green
        else if (newPh < 11) newColor = "rgba(30, 144, 255, 0.8)"; // Blue
        else newColor = "rgba(138, 43, 226, 0.8)"; // Violet
      } else if (item.color && !newPrecipitate) {
        newColor = item.color;
      }

      setTemperature(newTemp);
      setPhValue(newPh);

      return {
        ...prev,
        volume: newVolume,
        color: newColor,
        precipitate: newPrecipitate,
        precipitateAmount: newPrecipAmount,
        solutes: nextSolutes,
        hasPhenolphthalein: hasPhPh,
        hasUniversalIndicator: hasUniv,
      };
    });
  }, [isExploded, phValue, temperature]);

  // Reset / Clean Laboratory Bench
  const resetBench = () => {
    setIsExploded(false);
    setExplosionType(null);
    setBurnerActive(false);
    setBuretteDripping(false);
    setTemperature(22.0);
    setPhValue(7.0);
    setContents({
      volume: 80,
      color: "rgba(235, 245, 255, 0.45)",
      precipitate: null,
      precipitateAmount: 0,
      solutes: { H2O: 80 },
      hasPhenolphthalein: false,
      hasUniversalIndicator: false,
      bubbles: [],
      sparks: [],
      smoke: [],
    });
    addLog("🧹 Idish tozalab yuvildi va yangi distillangan suv quyildi.");
    clothRef.current?.reactSpeech("idle", "Toza idish o'rnatildi. Boshlashimiz mumkin!");
  };

  // Run Pre-defined Curated Scenarios
  const runScenario = (key) => {
    resetBench();
    setActiveScenario(key);

    if (key === "titration") {
      setTimeout(() => {
        addReagent(REAGENTS.acids[0]); // HCl
        addReagent(REAGENTS.indicators[0]); // Phenolphthalein
        setBuretteLiquid("NaOH");
        setBuretteDripping(true);
        addLog("🎯 TITRLASH MASHG'ULOTI: HCl + Fenolftalein tayyorlandi. Byuretka ochildi.");
      }, 300);
    } else if (key === "sodium") {
      setTimeout(() => {
        addReagent(REAGENTS.metals[0]); // Na
      }, 400);
    } else if (key === "geyser") {
      setTimeout(() => {
        addReagent(REAGENTS.solvents[1]); // 30% H2O2
        setTimeout(() => {
          addReagent(REAGENTS.salts[3]); // MnO2
        }, 800);
      }, 300);
    } else if (key === "hypergolic") {
      setTimeout(() => {
        addReagent(REAGENTS.salts[2]); // KMnO4
        setTimeout(() => {
          addReagent(REAGENTS.solvents[2]); // Glycerin
        }, 800);
      }, 300);
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const render = (time) => {
      if (!running) return;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      // Handle High DPI
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const W = displayWidth;
      const H = displayHeight;

      // 1. Draw Lab Room Background (Polished Phenolic Lab Countertop + Tiled Wall)
      const gradBg = ctx.createLinearGradient(0, 0, 0, H);
      gradBg.addColorStop(0, "#0b0f19");
      gradBg.addColorStop(0.65, "#141b2d");
      gradBg.addColorStop(0.66, "#080c14");
      gradBg.addColorStop(1, "#03060a");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, W, H);

      // Subtle tiled grid on back wall
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H * 0.65);
        ctx.stroke();
      }
      for (let y = 0; y < H * 0.65; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Benchtop surface sheen
      const benchTopY = H * 0.66;
      ctx.fillStyle = "#1e2433";
      ctx.fillRect(0, benchTopY, W, 8);
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      ctx.fillRect(0, benchTopY, W, 2);

      // 2. Draw Interactive Cloth Banner on Right Side (fimbox/html-cloth.mjs implementation)
      if (clothRef.current) {
        clothRef.current.update(dt);
        const clothX = Math.max(W - 220, W * 0.78);
        const clothY = 50;
        clothRef.current.render(ctx, clothX, clothY, 0.85);
      }

      // 3. Draw Center Reaction Station Benchware
      const benchCenterX = Math.min(W * 0.45, 420);
      const benchBaseY = benchTopY;

      // Draw Bunsen Burner underneath vessel
      const burnerX = benchCenterX;
      const burnerY = benchBaseY - 12;

      // Burner metal base & barrel
      ctx.fillStyle = "#2c3340";
      ctx.beginPath();
      ctx.roundRect(burnerX - 35, burnerY - 10, 70, 10, 3);
      ctx.fill();
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(burnerX - 8, burnerY - 70, 16, 60);

      // Air collar ring
      ctx.fillStyle = burnerFlameType === "blue" ? "#3182ce" : "#d69e2e";
      ctx.fillRect(burnerX - 10, burnerY - 35, 20, 10);

      // Burner Flame Animation
      if (burnerActive && !isExploded) {
        ctx.save();
        const flicker = Math.sin(time * 0.03) * 4 + (Math.random() - 0.5) * 3;
        const flameHeight = burnerFlameType === "blue" ? 55 + flicker : 75 + flicker * 1.5;

        // Outer Flame glow
        const flameGrad = ctx.createRadialGradient(
          burnerX, burnerY - 70 - flameHeight * 0.5, 5,
          burnerX, burnerY - 70 - flameHeight * 0.5, flameHeight * 0.8
        );

        if (burnerFlameType === "blue") {
          flameGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          flameGrad.addColorStop(0.3, "rgba(0, 180, 255, 0.8)");
          flameGrad.addColorStop(0.7, "rgba(0, 80, 255, 0.4)");
          flameGrad.addColorStop(1, "rgba(0, 40, 200, 0)");
        } else {
          flameGrad.addColorStop(0, "rgba(255, 255, 200, 0.95)");
          flameGrad.addColorStop(0.4, "rgba(255, 170, 0, 0.85)");
          flameGrad.addColorStop(0.8, "rgba(255, 60, 0, 0.5)");
          flameGrad.addColorStop(1, "rgba(200, 20, 0, 0)");
        }

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(burnerX - 14, burnerY - 70);
        ctx.quadraticCurveTo(burnerX - 18, burnerY - 70 - flameHeight * 0.6, burnerX, burnerY - 70 - flameHeight);
        ctx.quadraticCurveTo(burnerX + 18, burnerY - 70 - flameHeight * 0.6, burnerX + 14, burnerY - 70);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Tripod / Wire Gauze Stand
      ctx.strokeStyle = "#718096";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(burnerX - 60, burnerY);
      ctx.lineTo(burnerX - 55, burnerY - 80);
      ctx.lineTo(burnerX + 55, burnerY - 80);
      ctx.lineTo(burnerX + 60, burnerY);
      ctx.stroke();

      // Ceramic center on wire gauze
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(burnerX - 35, burnerY - 82, 70, 4);

      // Glass Vessel Positioning
      const vesselX = burnerX;
      const vesselBottomY = burnerY - 84;
      const vesselW = vesselType === "beaker" ? 110 : vesselType === "flask" ? 120 : 45;
      const vesselH = vesselType === "tube" ? 160 : 130;

      // Draw Fluid Inside Vessel
      if (!isExploded) {
        ctx.save();
        const fillFraction = Math.min(1.0, contents.volume / 220);
        const liquidH = Math.max(10, vesselH * 0.75 * fillFraction);
        const liquidTopY = vesselBottomY - liquidH;

        // Slosh wave
        const slosh = Math.sin(time * 0.005) * 2;

        ctx.beginPath();
        ctx.fillStyle = contents.color;

        if (vesselType === "flask") {
          const bottomHalfW = vesselW * 0.45;
          const topHalfW = bottomHalfW * (1 - fillFraction * 0.55);
          ctx.moveTo(vesselX - bottomHalfW, vesselBottomY);
          ctx.lineTo(vesselX - topHalfW, liquidTopY);
          ctx.quadraticCurveTo(vesselX, liquidTopY + slosh, vesselX + topHalfW, liquidTopY);
          ctx.lineTo(vesselX + bottomHalfW, vesselBottomY);
        } else {
          ctx.rect(vesselX - vesselW / 2 + 5, liquidTopY, vesselW - 10, liquidH);
        }
        ctx.closePath();
        ctx.fill();

        // Precipitate layer at bottom
        if (contents.precipitate) {
          ctx.fillStyle = contents.precipitate === "blue" ? "#0055d4" :
                          contents.precipitate === "white" ? "#f7fafc" : "#805ad5";
          ctx.beginPath();
          ctx.roundRect(vesselX - vesselW / 2 + 7, vesselBottomY - 14, vesselW - 14, 12, 4);
          ctx.fill();
        }

        // Bubbles inside liquid
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (const b of contents.bubbles) {
          ctx.beginPath();
          ctx.arc(vesselX + b.x, vesselBottomY - b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Meniscus surface curve
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(vesselX, liquidTopY, (vesselW - 14) / 2, 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // Draw Glass Vessel Outline & Reflections
      ctx.save();
      ctx.strokeStyle = "rgba(200, 235, 255, 0.85)";
      ctx.lineWidth = 2.5;

      if (isExploded) {
        // Shattered glass shards
        ctx.strokeStyle = "#ff4444";
        ctx.beginPath();
        ctx.moveTo(vesselX - 45, vesselBottomY);
        ctx.lineTo(vesselX - 25, vesselBottomY - 30);
        ctx.lineTo(vesselX - 10, vesselBottomY);
        ctx.moveTo(vesselX + 15, vesselBottomY);
        ctx.lineTo(vesselX + 35, vesselBottomY - 25);
        ctx.lineTo(vesselX + 50, vesselBottomY);
        ctx.stroke();
      } else if (vesselType === "beaker") {
        // Beaker rim and spout
        ctx.beginPath();
        ctx.moveTo(vesselX - vesselW / 2 - 8, vesselBottomY - vesselH); // spout
        ctx.lineTo(vesselX - vesselW / 2, vesselBottomY - vesselH + 4);
        ctx.lineTo(vesselX - vesselW / 2, vesselBottomY - 4);
        ctx.quadraticCurveTo(vesselX - vesselW / 2, vesselBottomY, vesselX - vesselW / 2 + 6, vesselBottomY);
        ctx.lineTo(vesselX + vesselW / 2 - 6, vesselBottomY);
        ctx.quadraticCurveTo(vesselX + vesselW / 2, vesselBottomY, vesselX + vesselW / 2, vesselBottomY - 4);
        ctx.lineTo(vesselX + vesselW / 2, vesselBottomY - vesselH);
        ctx.stroke();

        // Measurement ticks
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        for (let t = 1; t <= 4; t++) {
          const ty = vesselBottomY - (vesselH * 0.7 * (t / 4));
          ctx.beginPath();
          ctx.moveTo(vesselX - vesselW / 2 + 4, ty);
          ctx.lineTo(vesselX - vesselW / 2 + 16, ty);
          ctx.stroke();
        }
      } else if (vesselType === "flask") {
        // Erlenmeyer Flask
        ctx.beginPath();
        ctx.moveTo(vesselX - 18, vesselBottomY - vesselH);
        ctx.lineTo(vesselX - 18, vesselBottomY - vesselH + 40);
        ctx.lineTo(vesselX - vesselW / 2, vesselBottomY - 6);
        ctx.quadraticCurveTo(vesselX - vesselW / 2, vesselBottomY, vesselX - vesselW / 2 + 8, vesselBottomY);
        ctx.lineTo(vesselX + vesselW / 2 - 8, vesselBottomY);
        ctx.quadraticCurveTo(vesselX + vesselW / 2, vesselBottomY, vesselX + vesselW / 2, vesselBottomY - 6);
        ctx.lineTo(vesselX + 18, vesselBottomY - vesselH + 40);
        ctx.lineTo(vesselX + 18, vesselBottomY - vesselH);
        ctx.stroke();
      } else {
        // Test Tube
        ctx.beginPath();
        ctx.moveTo(vesselX - vesselW / 2, vesselBottomY - vesselH);
        ctx.lineTo(vesselX - vesselW / 2, vesselBottomY - vesselW / 2);
        ctx.arc(vesselX, vesselBottomY - vesselW / 2, vesselW / 2, Math.PI, 0, true);
        ctx.lineTo(vesselX + vesselW / 2, vesselBottomY - vesselH);
        ctx.stroke();
      }

      // Specular Glass Highlight Sheen
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vesselX - vesselW / 2 + 7, vesselBottomY - vesselH + 15);
      ctx.lineTo(vesselX - vesselW / 2 + 7, vesselBottomY - 15);
      ctx.stroke();

      ctx.restore();

      // 4. Draw Burette Titration Stand above
      const buretteX = vesselX + 35;
      const buretteTipY = vesselBottomY - vesselH - 15;

      // Vertical burette tube
      ctx.fillStyle = "rgba(220, 240, 255, 0.25)";
      ctx.fillRect(buretteX - 6, buretteTipY - 140, 12, 130);
      ctx.strokeStyle = "rgba(200, 235, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(buretteX - 6, buretteTipY - 140, 12, 130);

      // Titrant level inside burette
      ctx.fillStyle = "rgba(0, 210, 255, 0.5)";
      ctx.fillRect(buretteX - 5, buretteTipY - 110, 10, 100);

      // Stopcock valve knob
      ctx.fillStyle = buretteDripping ? "#38a169" : "#e53e3e";
      ctx.beginPath();
      ctx.arc(buretteX, buretteTipY - 8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Dripping animation from burette
      if (buretteDripping && !isExploded) {
        const dropProgress = (time * 0.003) % 1.0;
        const dropY = buretteTipY + dropProgress * (vesselBottomY - vesselH * 0.7 - buretteTipY);
        ctx.fillStyle = "#00d2ff";
        ctx.beginPath();
        ctx.arc(buretteX - 15 * dropProgress, dropY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Draw Digital Sensor HUD Readouts
      // Thermometer Stem
      const thermoX = vesselX - vesselW / 2 - 35;
      ctx.fillStyle = "#1a202c";
      ctx.beginPath();
      ctx.roundRect(thermoX - 12, vesselBottomY - 130, 24, 130, 8);
      ctx.fill();
      ctx.strokeStyle = "#4a5568";
      ctx.stroke();

      // Temperature liquid rise
      const tempNormalized = Math.min(1.0, Math.max(0, (temperature - 0) / 150));
      const mercuryH = 100 * tempNormalized;
      ctx.fillStyle = temperature > 60 ? "#e53e3e" : "#3182ce";
      ctx.beginPath();
      ctx.roundRect(thermoX - 4, vesselBottomY - 15 - mercuryH, 8, mercuryH, 3);
      ctx.fill();
      ctx.arc(thermoX, vesselBottomY - 12, 8, 0, Math.PI * 2);
      ctx.fill();

      // 6. Explosive Sparks & Smoke Particle Integration
      if (contents.sparks.length > 0) {
        ctx.save();
        for (let i = contents.sparks.length - 1; i >= 0; i--) {
          const sp = contents.sparks[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.4; // gravity
          sp.life -= 0.02;

          ctx.fillStyle = sp.color || "#ff8800";
          ctx.beginPath();
          ctx.arc(vesselX + sp.x, vesselBottomY - 50 + sp.y, 3 * sp.life, 0, Math.PI * 2);
          ctx.fill();

          if (sp.life <= 0) contents.sparks.splice(i, 1);
        }
        ctx.restore();
      }

      if (contents.smoke.length > 0) {
        ctx.save();
        for (let i = contents.smoke.length - 1; i >= 0; i--) {
          const sm = contents.smoke[i];
          sm.x += sm.vx;
          sm.y += sm.vy;
          sm.size += 0.4;
          sm.life -= 0.015;

          ctx.fillStyle = `rgba(180, 180, 190, ${sm.life * 0.4})`;
          ctx.beginPath();
          ctx.arc(vesselX + sm.x, vesselBottomY - 80 + sm.y, sm.size, 0, Math.PI * 2);
          ctx.fill();

          if (sm.life <= 0) contents.smoke.splice(i, 1);
        }
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [vesselType, burnerActive, burnerFlameType, buretteDripping, temperature, contents, isExploded]);

  // Handle pointer interactions on cloth (poking / dragging)
  const handleCanvasPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !clothRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clothX = Math.max(canvas.clientWidth - 220, canvas.clientWidth * 0.78);
    const clothY = 50;
    const clothW = 290 * 0.85;
    const clothH = 320 * 0.85;

    // Check if clicked inside cloth
    if (x >= clothX - 10 && x <= clothX + clothW + 10 && y >= clothY - 10 && y <= clothY + clothH + 20) {
      const u = Math.max(0, Math.min(1, (x - clothX) / clothW));
      const v = Math.max(0, Math.min(1, (y - clothY) / clothH));
      clothRef.current.poke(u, v, 80);
      sfx.playPop();

      // Dispatch to interactive HTML in canvas elements
      if (bannerContainerRef.current) {
        dispatchCanvasPointerEvent(bannerContainerRef.current, u, v, "click", e);
      }
    }
  };

  // Continuous burette titration loop
  useEffect(() => {
    if (!buretteDripping) return;
    const interval = setInterval(() => {
      if (buretteLiquid === "NaOH") {
        addReagent(REAGENTS.bases[0]); // NaOH drops
      } else {
        addReagent(REAGENTS.acids[0]); // HCl drops
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [buretteDripping, buretteLiquid, addReagent]);

  // Thermal burner heating loop
  useEffect(() => {
    if (!burnerActive || isExploded) return;
    const interval = setInterval(() => {
      setTemperature((prev) => {
        const targetTemp = burnerFlameType === "blue" ? 140 : 85;
        if (prev < targetTemp) {
          const next = prev + (burnerFlameType === "blue" ? 3.5 : 1.8);
          if (next >= 100 && prev < 100) {
            addLog("♨️ QAYNASH: Suyuqlik 100°C ga yetdi va qaynay boshladi!");
            clothRef.current?.reactSpeech("heat");
          }
          return Math.min(targetTemp, next);
        }
        return prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [burnerActive, burnerFlameType, isExploded]);

  return (
    <div className="flex h-screen w-full flex-col bg-[#070a12] text-white select-none overflow-hidden font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="flex h-14 items-center justify-between border-b border-cyan-500/20 bg-[#0c101d]/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/60 transition"
          >
            ← BOSH SAHIFA
          </Link>
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-cyan-400" />
            <span className="font-mono text-sm font-bold tracking-wide text-white">
              SMARTLAB 3D <span className="text-cyan-400">CHEM-CANVAS</span>
            </span>
          </div>
          <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/20">
            HTML-IN-CANVAS (WICG SPEC)
          </span>
        </div>

        {/* Benchtop Instrument Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 rounded bg-black/40 px-2.5 py-1 border border-white/10">
            <Thermometer className="h-4 w-4 text-orange-400" />
            <span>HARORAT:</span>
            <span className={temperature > 80 ? "font-bold text-red-400" : "font-bold text-cyan-300"}>
              {temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded bg-black/40 px-2.5 py-1 border border-white/10">
            <Activity className="h-4 w-4 text-purple-400" />
            <span>pH:</span>
            <span
              className="font-bold px-1.5 py-0.2 rounded"
              style={{
                backgroundColor: phValue < 4 ? "rgba(239, 68, 68, 0.3)" :
                                 phValue > 9 ? "rgba(147, 51, 234, 0.3)" : "rgba(34, 197, 94, 0.3)",
                color: phValue < 4 ? "#f87171" : phValue > 9 ? "#c084fc" : "#4ade80",
              }}
            >
              {phValue.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded bg-black/40 px-2.5 py-1 border border-white/10">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>HAJM:</span>
            <span className="font-bold text-blue-300">{contents.volume} ml</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="flex items-center gap-1 rounded border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:text-white hover:bg-white/10"
            title={soundMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Workspace: Left Controls + Center Canvas + Right Cloth Banner */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Side: Apparatus Controls & Scenarios */}
        <aside className="flex w-64 flex-col border-r border-cyan-500/20 bg-[#090d18] p-3 text-xs font-mono">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Laboratoriya Asboblari
          </div>

          {/* Vessel Selection */}
          <div className="mb-4">
            <label className="text-[10px] text-zinc-400 block mb-1.5">REAKSIYA IDISHI:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "beaker", label: "Stakan (250ml)" },
                { id: "flask", label: "Kolba (250ml)" },
                { id: "tube", label: "Probirka" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVesselType(v.id)}
                  className={`rounded border p-1.5 text-center text-[10px] transition ${
                    vesselType === v.id
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bunsen Burner Flame Control */}
          <div className="mb-4 rounded border border-white/10 bg-black/30 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> Bunzen Gorelkasi
              </span>
              <button
                onClick={() => setBurnerActive(!burnerActive)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                  burnerActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                    : "bg-white/10 text-zinc-400 hover:bg-white/20"
                }`}
              >
                {burnerActive ? "O'CHIRISH" : "YONDIRISH"}
              </button>
            </div>

            {burnerActive && (
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => setBurnerFlameType("blue")}
                  className={`flex-1 rounded p-1 text-[9px] ${
                    burnerFlameType === "blue" ? "bg-cyan-600 text-white font-bold" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Ko'k Olov (1300°C)
                </button>
                <button
                  onClick={() => setBurnerFlameType("yellow")}
                  className={`flex-1 rounded p-1 text-[9px] ${
                    burnerFlameType === "yellow" ? "bg-amber-600 text-white font-bold" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Sariq Olov (750°C)
                </button>
              </div>
            )}
          </div>

          {/* Burette Titration Stand */}
          <div className="mb-4 rounded border border-white/10 bg-black/30 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                <Droplet className="h-3.5 w-3.5" /> Byuretka (Titrlash)
              </span>
              <button
                onClick={() => setBuretteDripping(!buretteDripping)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                  buretteDripping
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-white/10 text-zinc-400 hover:bg-white/20"
                }`}
              >
                {buretteDripping ? "TO'XTATISH" : "TOMIZISH"}
              </button>
            </div>
            <div className="text-[10px] text-zinc-400">Titrant: 0.1 M NaOH (Ishqor)</div>
          </div>

          {/* Preset Reactions & Scenarios */}
          <div className="mb-3">
            <label className="text-[10px] text-zinc-400 block mb-1.5">TAYYOR AMALIYOTLAR:</label>
            <div className="flex flex-col gap-1">
              {[
                { id: "titration", label: "🎯 Titrlash (HCl + NaOH)" },
                { id: "sodium", label: "💥 Natriy va Suv Portlashi" },
                { id: "geyser", label: "🌋 Kislorod Geyzeri (H₂O₂)" },
                { id: "hypergolic", label: "🔥 O'z-o'zidan Yonish (KMnO₄)" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => runScenario(s.id)}
                  className="rounded border border-white/5 bg-white/5 p-1.5 text-left text-[10px] text-zinc-300 hover:border-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Clean Bench */}
          <div className="mt-auto pt-2">
            <button
              onClick={resetBench}
              className="flex w-full items-center justify-center gap-2 rounded border border-cyan-500/40 bg-cyan-950/50 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition"
            >
              <RotateCcw className="h-4 w-4" /> IDISHNI TOZALASH
            </button>
          </div>
        </aside>

        {/* Center: Interactive HTML Canvas */}
        <main className="relative flex-1 overflow-hidden">
          <canvas
            ref={canvasRef}
            content="drawable"
            onPointerDown={handleCanvasPointerDown}
            className="h-full w-full cursor-crosshair"
          />

          {/* Live Hidden HTML Elements for WICG HTML-in-Canvas standard */}
          <div
            ref={bannerContainerRef}
            drawable=""
            className="pointer-events-none absolute bottom-4 right-4 z-10 w-72 rounded-lg border border-cyan-500/30 bg-[#0e1424]/90 p-3 shadow-2xl backdrop-blur font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> FIZIKA & MATO MATRITSASI
              </span>
              <span className="text-[10px] text-zinc-400">fimbox-cloth</span>
            </div>
            <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
              O'ng tarafdagi matoga bosing yoki suring — real vaqt rejimida to'lqin tarqaladi!
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Tortishish: 9.8 m/s²</span>
              <span>Elastiklik: 0.88</span>
            </div>
          </div>

          {/* Explosion / Hazard Alert Overlay */}
          {isExploded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="max-w-md rounded-xl border border-red-500 bg-[#160a0a] p-6 text-center shadow-2xl shadow-red-500/20">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 animate-pulse mb-3" />
                <h3 className="font-mono text-lg font-bold text-red-400 mb-2">
                  SHIDDATLI REAKSIYA SODIR BO'LDI!
                </h3>
                <p className="text-xs text-zinc-300 mb-4 leading-relaxed font-mono">
                  {explosionType === "sodium"
                    ? "Natriy metalli suv bilan reaksiyaga kirishib, ajralgan vodorod gazini alangalantirdi va idishni portlatdi."
                    : "Idishdagi harorat va bosim ruxsat etilgan me'yordan oshib ketdi."}
                </p>
                <button
                  onClick={resetBench}
                  className="rounded-lg bg-red-600 px-5 py-2 font-mono text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/40"
                >
                  YANGI IDISH O'RNATISH (TOZALASH)
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Shelf: Chemical Stockroom Tabs & Reagents */}
      <footer className="flex h-36 flex-col border-t border-cyan-500/20 bg-[#090d18]">
        {/* Category Tabs */}
        <div className="flex border-b border-white/10 px-4">
          {[
            { id: "acids", label: "Kislotalar" },
            { id: "bases", label: "Ishqorlar" },
            { id: "salts", label: "Tuzlar & Reaktivlar" },
            { id: "metals", label: "Aktiv Metallar" },
            { id: "indicators", label: "Indikatorlar" },
            { id: "solvents", label: "Erituvchilar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2 font-mono text-xs font-bold transition ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reagent Bottles / Jars Grid */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto px-4 py-2">
          {REAGENTS[activeTab]?.map((item) => (
            <button
              key={item.id}
              onClick={() => addReagent(item)}
              className="group flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#121829] p-2 hover:border-cyan-400 hover:bg-cyan-950/40 hover:scale-105 transition min-w-[120px] text-center"
            >
              <div
                className="mb-1.5 h-6 w-6 rounded-full border border-white/20 flex items-center justify-center shadow"
                style={{
                  backgroundColor: item.color || "#4a5568",
                }}
              >
                <span className="text-[10px] font-bold text-black/80 font-mono">
                  {item.formula.slice(0, 2)}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">
                {item.formula}
              </span>
              <span className="text-[9px] text-zinc-400 line-clamp-1 max-w-[110px]">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
