import React, { useState, useEffect, useRef, useCallback } from "react";
import { Crosshair, Trophy, RotateCcw, X, Sparkles, Volume2, VolumeX, ShieldAlert, Award } from "lucide-react";

/**
 * LabShooterGame — Inspired by Wes Bos's "Duck Hunt Todo" (HTML-in-Canvas Shatter Shooter).
 * An interactive laboratory shooting practice mini-game where learners shoot floating
 * science targets (Molecules, Cells, Acid Flasks, Ducks) to test lab reflexes and knowledge!
 */
export const LabShooterGame = ({ isOpen, onClose }) => {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  const [targets, setTargets] = useState([]);
  const [particles, setParticles] = useState([]);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [isFiring, setIsFiring] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  const TARGET_TYPES = [
    { type: "flask", label: "🧪 Kislota Kolbasi", points: 15, color: "#34d399", speed: 2.2 },
    { type: "dna", label: "🧬 DNK Spiral", points: 20, color: "#38bdf8", speed: 2.8 },
    { type: "atom", label: "⚛️ Kvant Atomi", points: 25, color: "#a855f7", speed: 3.4 },
    { type: "bacteria", label: "🧫 Bakteriya", points: 10, color: "#f59e0b", speed: 1.8 },
    { type: "duck", label: "🦆 Smart O'rdak (Wes Bos)", points: 50, color: "#fb7185", speed: 4.2 },
  ];

  // Play synthetic laser / shatter sound via Web Audio API
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === "shatter") {
        osc.type = "square";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (_) {}
  }, [soundEnabled]);

  // Spawn targets periodically
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTargets((prev) => {
        if (prev.length >= 6) return prev;
        const kind = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
        const fromLeft = Math.random() > 0.5;
        const newTarget = {
          id: Math.random().toString(36).substring(2, 9),
          ...kind,
          x: fromLeft ? -40 : 840,
          y: 80 + Math.random() * 320,
          vx: (fromLeft ? 1 : -1) * (kind.speed + Math.random() * 1.2),
          vy: (Math.random() - 0.5) * 1.5,
          scale: 0.8 + Math.random() * 0.4,
        };
        return [...prev, newTarget];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Animation physics loop
  useEffect(() => {
    if (!isOpen) return;

    const updatePhysics = () => {
      // 1. Move targets
      setTargets((prev) =>
        prev
          .map((t) => ({
            ...t,
            x: t.x + t.vx,
            y: t.y + t.vy,
          }))
          .filter((t) => t.x > -80 && t.x < 920 && t.y > 40 && t.y < 480)
      );

      // 2. Move particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.35, // Gravity
            alpha: p.alpha - 0.025,
            rot: p.rot + p.vRot,
          }))
          .filter((p) => p.alpha > 0)
      );

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen]);

  // Handle laser fire
  const handleShoot = (e) => {
    if (!isOpen) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setShots((prev) => prev + 1);
    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 90);
    playSound("laser");

    // Check hit
    let hitSomething = false;
    setTargets((prev) => {
      const remaining = [];
      for (const t of prev) {
        const dx = clickX - t.x;
        const dy = clickY - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 42 && !hitSomething) {
          // HIT!
          hitSomething = true;
          setHits((h) => h + 1);
          setScore((s) => s + t.points);
          playSound("shatter");

          // Spawn shatter fragments
          const fragmentCount = 14;
          const newParticles = [];
          for (let i = 0; i < fragmentCount; i++) {
            const angle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.4;
            const spd = 3 + Math.random() * 6;
            newParticles.push({
              id: Math.random(),
              x: t.x,
              y: t.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 3,
              color: t.color,
              size: 4 + Math.random() * 8,
              alpha: 1.0,
              rot: Math.random() * 360,
              vRot: (Math.random() - 0.5) * 20,
            });
          }
          setParticles((p) => [...p, ...newParticles]);
        } else {
          remaining.push(t);
        }
      }
      return remaining;
    });
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCrosshairPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const resetGame = () => {
    setScore(0);
    setShots(0);
    setHits(0);
    setTargets([]);
    setParticles([]);
  };

  if (!isOpen) return null;

  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl h-[78vh] rounded-3xl bg-zinc-950 border-2 border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Duck Hunt TODO • Ilmiy Nishon Mashqi
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Wes Bos HTML-in-Canvas
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Uchayotgan kimyoviy va biologik nishonlarni lazer bilan urib ball to'plang!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={resetGame}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Qayta boshlash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats HUD Bar */}
        <div className="px-6 py-2.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-400">Ball:</span>
              <span className="text-amber-300 font-bold text-sm tabular-nums">{score}</span>
            </div>
            <div>
              <span className="text-zinc-400">Nishonga tegish:</span>{" "}
              <span className="text-emerald-400 font-bold tabular-nums">{hits} / {shots}</span>
            </div>
            <div>
              <span className="text-zinc-400">Aniqlik:</span>{" "}
              <span className="text-cyan-400 font-bold tabular-nums">{accuracy}%</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500">
            Sichqonchani bosing — Lazer otiladi!
          </div>
        </div>

        {/* Game Shooting Canvas Arena */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleShoot}
          className="relative flex-1 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,#091322_0%,#040810_100%)] overflow-hidden cursor-none"
        >
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

          {/* Flash on Fire */}
          {isFiring && (
            <div className="absolute inset-0 bg-emerald-500/15 pointer-events-none transition-opacity" />
          )}

          {/* Floating Targets */}
          {targets.map((t) => (
            <div
              key={t.id}
              style={{
                left: `${t.x}px`,
                top: `${t.y}px`,
                transform: `translate(-50%, -50%) scale(${t.scale})`,
                borderColor: t.color,
                color: t.color,
              }}
              className="absolute px-3 py-1.5 rounded-2xl bg-zinc-950/80 border-2 shadow-lg backdrop-blur-md text-xs font-bold font-mono transition-transform duration-75 flex items-center gap-1.5 pointer-events-none"
            >
              <span>{t.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white">
                +{t.points}
              </span>
            </div>
          ))}

          {/* Shatter Particle Fragments */}
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.alpha,
                transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
                boxShadow: `0 0 8px ${p.color}`,
              }}
              className="absolute rounded-sm pointer-events-none"
            />
          ))}

          {/* Futuristic Laser Crosshair Reticle */}
          <div
            style={{
              left: `${crosshairPos.x}px`,
              top: `${crosshairPos.y}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className={`relative flex items-center justify-center transition-transform ${isFiring ? "scale-125" : "scale-100"}`}>
              {/* Outer Ring */}
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              {/* Center Dot */}
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {/* Crosshair Spikes */}
              <div className="absolute w-14 h-[2px] bg-emerald-400/60" />
              <div className="absolute h-14 w-[2px] bg-emerald-400/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabShooterGame;
