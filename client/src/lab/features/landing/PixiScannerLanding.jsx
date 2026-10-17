import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Beaker,
  Dna,
  Zap,
  Compass,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Flame,
  Layers,
  Terminal,
} from "lucide-react";
import { setupDrawableCanvas } from "../chemistry/canvas-lab/htmlInCanvas";
import { CatSimulation, preloadCatAssets } from "./catPhysics";

/**
 * Laser Scanning & Page Chunk Slicing Engine
 * Inspired by Zyie/pixijs-html-in-canvas (https://github.com/Zyie/pixijs-html-in-canvas)
 *
 * Implements:
 * - Real-time horizontal laser beam scanning across the landing page
 * - Dynamic page chunk slicing with spring recoil displacement
 * - Glowing laser spark particles and smoke trails
 * - Seamless chunk healing behind the scanner
 * - Fully interactive HTML elements captured into Canvas
 */
export default function PixiScannerLanding() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [scannerActive, setScannerActive] = useState(true);
  const [laserSpeed, setLaserSpeed] = useState(1.0);
  const [sliceIntensity, setSliceIntensity] = useState(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupDrawableCanvas(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let laserProgress = 0.1;
    let laserDirection = 1;

    // Sliced chunk particles & sparks
    const sparks = [];
    const trailPoints = [];

    // Interactive Cat simulation from Zyie/pixijs-html-in-canvas
    const cat = new CatSimulation({ scale: 1.25, power: 0.45, skid: 0.91 });
    let mousePos = { x: 300, y: 300, lastMove: 0 };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      mousePos.lastMove = performance.now();
    };
    window.addEventListener("pointermove", onPointerMove);

    // Horizontal slice chunks (dividing the screen into horizontal bars)
    const NUM_CHUNKS = 24;
    const chunks = Array.from({ length: NUM_CHUNKS }, (_, i) => ({
      index: i,
      offset: 0,
      targetOffset: 0,
      velocity: 0,
      tilt: 0,
      health: 1.0, // 1.0 = fully healed, 0.0 = sliced
    }));

    let lastTime = performance.now();

    const render = (now) => {
      if (!running) return;
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      // Handle DPI
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear Canvas
      ctx.clearRect(0, 0, W, H);

      // 1. Advance laser scanner
      if (scannerActive) {
        laserProgress += laserDirection * 0.28 * laserSpeed * dt;
        if (laserProgress >= 1.0) {
          laserProgress = 1.0;
          laserDirection = -1;
        } else if (laserProgress <= 0.0) {
          laserProgress = 0.0;
          laserDirection = 1;
        }
      }

      const laserY = laserProgress * H;

      // Target for Cat: Laser point oscillating across laser beam, or tracking recent pointer
      const isPointerRecent = now - mousePos.lastMove < 2800;
      const autoLaserX = W * (0.5 + 0.36 * Math.sin(now * 0.0016));
      const targetX = isPointerRecent ? mousePos.x : autoLaserX;
      const targetY = isPointerRecent ? mousePos.y : laserY;

      // Add laser trail
      trailPoints.push({ x: targetX, y: laserY, life: 1.0 });
      if (trailPoints.length > 30) trailPoints.shift();

      // Emit sparks from laser
      if (scannerActive && Math.random() < 0.6) {
        for (let s = 0; s < 3; s++) {
          sparks.push({
            x: Math.random() * W,
            y: laserY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: Math.random() > 0.5 ? "#e72264" : "#00f0ff",
          });
        }
      }

      // 2. Update Chunks Physics & Slicing
      const chunkH = H / NUM_CHUNKS;
      for (let i = 0; i < NUM_CHUNKS; i++) {
        const chunk = chunks[i];
        const chunkCenterY = (i + 0.5) * chunkH;
        const distToLaser = Math.abs(chunkCenterY - laserY);

        // When laser touches chunk, slice and displace it!
        if (distToLaser < chunkH * 0.9) {
          chunk.health = 0.0;
          chunk.targetOffset = (i % 2 === 0 ? 1 : -1) * (18 * sliceIntensity);
          chunk.tilt = (Math.random() - 0.5) * 0.02 * sliceIntensity;
        } else {
          // Smooth healing back to rest
          chunk.health = Math.min(1.0, chunk.health + dt * 1.8);
          chunk.targetOffset *= Math.exp(-dt * 4.0);
          chunk.tilt *= Math.exp(-dt * 4.0);
        }

        // Spring recoil integration
        const springK = 25.0;
        const dampingK = 8.0;
        const force = (chunk.targetOffset - chunk.offset) * springK;
        chunk.velocity += force * dt;
        chunk.velocity *= Math.exp(-dampingK * dt);
        chunk.offset += chunk.velocity * dt;
      }

      // 3. Render Sliced Chunks Overlay / Scanlines
      for (let i = 0; i < NUM_CHUNKS; i++) {
        const chunk = chunks[i];
        const y0 = i * chunkH;

        if (Math.abs(chunk.offset) > 0.5) {
          ctx.save();
          ctx.fillStyle = chunk.offset > 0 ? "rgba(231, 34, 100, 0.08)" : "rgba(0, 240, 255, 0.08)";
          ctx.fillRect(chunk.offset, y0, W, chunkH);

          // Sliced border glowing edge
          ctx.strokeStyle = chunk.health < 0.5 ? "#e72264" : "rgba(0, 240, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(chunk.offset, y0);
          ctx.lineTo(chunk.offset + W, y0);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Render Laser Beam & Glowing Sparks
      if (scannerActive) {
        ctx.save();
        // Laser core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(W, laserY);
        ctx.stroke();

        // Laser hot glow
        ctx.strokeStyle = "#e72264";
        ctx.lineWidth = 7.0;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(W, laserY);
        ctx.stroke();

        // Outer neon aura
        ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
        ctx.lineWidth = 16.0;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(W, laserY);
        ctx.stroke();
        ctx.restore();
      }

      // Render sparks
      ctx.save();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= dt * 2.2;

        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.5 * Math.max(0, sp.life), 0, Math.PI * 2);
        ctx.fill();

        if (sp.life <= 0) sparks.splice(i, 1);
      }
      ctx.restore();

      // 5. Update & Render Interactive Cat chasing the laser beam
      cat.update(dt, targetX, targetY);
      cat.render(ctx, targetX, targetY);

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      window.removeEventListener("pointermove", onPointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scannerActive, laserSpeed, sliceIntensity]);

  return (
    <div className="relative min-h-screen w-full bg-[#080511] text-white overflow-hidden font-sans select-none">
      {/* Background Interactive Canvas Scanner */}
      <canvas
        ref={canvasRef}
        content="drawable"
        className="pointer-events-none absolute inset-0 h-full w-full z-10"
      />

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#150d24_1px,transparent_1px),linear-gradient(to_bottom,#150d24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Main Interactive HTML Landing Content */}
      <div
        ref={containerRef}
        drawable=""
        className="relative z-20 flex min-h-screen flex-col justify-between px-6 py-8 md:px-16"
      >
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e72264] bg-[#e72264]/10 shadow-[0_0_15px_rgba(231,34,100,0.5)]">
              <Sparkles className="h-5 w-5 text-[#e72264]" />
            </div>
            <div>
              <h1 className="font-mono text-base font-black tracking-wider text-white">
                SMARTLAB <span className="text-[#00f0ff]">3D STUDIO</span>
              </h1>
              <p className="text-[10px] font-mono text-zinc-400">
                HTML-IN-CANVAS ARCHITECTURE · WICG COMPLIANT
              </p>
            </div>
          </div>

          {/* Scanner Control Bar */}
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 backdrop-blur text-xs font-mono">
            <span className="text-[10px] text-zinc-400">LAZER SKANER:</span>
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className={`rounded px-2.5 py-0.5 text-[10px] font-bold transition ${
                scannerActive
                  ? "bg-[#e72264] text-white shadow-[0_0_10px_rgba(231,34,100,0.6)]"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {scannerActive ? "AKTIV" : "TO'XTATILGAN"}
            </button>
            <button
              onClick={() => setSliceIntensity((prev) => (prev >= 2 ? 0.5 : prev + 0.5))}
              className="text-[10px] text-cyan-300 hover:text-white"
            >
              Kesish: {sliceIntensity.toFixed(1)}x
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 border-l border-white/10 pl-2">
              🐱 Mushuk ta'qibda
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e72264]/40 bg-[#e72264]/10 px-3.5 py-1 text-xs font-mono font-bold text-[#e72264] mb-6">
            <span className="h-2 w-2 rounded-full bg-[#e72264] animate-ping" />
            YANGI AVLOD HTML CANVAS LABORATORIYASI
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 font-mono leading-tight">
            INTERAKTIV ILMIY <br />
            <span className="bg-gradient-to-r from-[#e72264] via-[#00f0ff] to-[#ffd700] bg-clip-text text-transparent">
              SIMULATSIYA MATRITSASI
            </span>
          </h2>

          <p className="max-w-2xl text-base md:text-lg text-zinc-300 leading-relaxed font-sans mb-8">
            Brauzeringizda to'liq HTML-in-Canvas texnologiyasi bilan ishlovchi yengil, tezkor va
            real fizikaga ega virtual laboratoriyalar. Kimyo reaksiyalari, ko'p silindrli dvigatellar
            va 3D biologik tuzilmalar bir joyda!
          </p>

          {/* Quick Subject Launch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {/* Chemistry Card */}
            <Link
              to="/chemistry/lab"
              className="group relative flex flex-col justify-between rounded-xl border border-cyan-500/30 bg-[#0d1222]/80 p-5 backdrop-blur hover:border-cyan-400 hover:bg-cyan-950/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 mb-3">
                  <Beaker className="h-5 w-5 text-cyan-400 group-hover:rotate-12 transition" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white group-hover:text-cyan-300">
                  Kimyo Laboratoriyasi
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  HTML-Canvas reaksiyalar, Bunzen gorelkasi, byuretka titrlash va shiddatli portlashlar.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                Laboratoriyaga kirish <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Biology Card */}
            <Link
              to="/biology/cell-studio"
              className="group relative flex flex-col justify-between rounded-xl border border-purple-500/30 bg-[#140e24]/80 p-5 backdrop-blur hover:border-purple-400 hover:bg-purple-950/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-950/60 mb-3">
                  <Dna className="h-5 w-5 text-purple-400 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white group-hover:text-purple-300">
                  Hujayra & Biologiya
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Eukariot hujayra va organellalarning 3D ichki anatomik tuzilishi.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400">
                O'rganish <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Physics Engine Card */}
            <Link
              to="/physics/engine"
              className="group relative flex flex-col justify-between rounded-xl border border-amber-500/30 bg-[#1d1408]/80 p-5 backdrop-blur hover:border-amber-400 hover:bg-amber-950/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-950/60 mb-3">
                  <Zap className="h-5 w-5 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white group-hover:text-amber-300">
                  Fizika Dvigatel (I4/V6/V8)
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  4 taktli ichki yonuv dvigateli, porshenlar, klapanlar va portlatish simulyatsiyasi.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                Ishga tushirish <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* History Atlas Card */}
            <Link
              to="/history/registan"
              className="group relative flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-[#091811]/80 p-5 backdrop-blur hover:border-emerald-400 hover:bg-emerald-950/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-950/60 mb-3">
                  <Compass className="h-5 w-5 text-emerald-400 group-hover:rotate-45 transition" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white group-hover:text-emerald-300">
                  Registon Tarixiy Atlas
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Samarqand Registon maydoni va madrasalarning virtual 3D ekskursiyasi.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                Sayohat qilish <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </section>

        {/* Bottom Status / Footer */}
        <footer className="flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>SmartLab 3D Platform · Xasanboy Abdulxayev tomonidan ishlab chiqilgan</span>
          </div>
          <div className="mt-2 md:mt-0 flex gap-4 text-[11px]">
            <span>Chrome Draw-Element Flag: qo'llab-quvvatlanadi</span>
            <span>Verlet Cloth: 14x14 Mesh</span>
            <span>FPS: 60</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
