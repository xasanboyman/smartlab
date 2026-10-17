// Riko (Quantum VRM) — the hosted Vue/Three.js avatar assistant framed inside SmartLab with its own
// navbar. The app lives at vmrchat.vercel.app; an interactive loader covers it until it is ready.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Bot, ExternalLink, Maximize2, Minimize2, RefreshCw, Mic, Camera, Sparkles } from "lucide-react";
import "./RikoPage.css";

export const RIKO_URL = "https://vmrchat.vercel.app/";
const GRACE_MS = 4500;
const SKIP_AFTER_MS = 6000;
const TIMEOUT_MS = 40000;
// The embed keeps a request open, so its load event can lag far behind the visible app; reveal anyway after this.
const REVEAL_FALLBACK_MS = 14000;

const STEPS = [
  "Vue ilovasi yuklanmoqda…",
  "3D avatar (VRM) va animatsiyalar yuklanmoqda…",
  "Gemini Live ovoz kanali tayyorlanmoqda…",
  "Riko uyg'onmoqda…",
];

const TIPS = [
  "Riko bilan ovozli gaplashish uchun mikrofonga ruxsat bering.",
  "Kamerani yoqsangiz, Riko sizni ko'ra oladi (look_at_user).",
  "Ekranni ulashsangiz, Riko ekraningizni tahlil qiladi.",
  "Riko aytgan gaplaringizni xotirada saqlaydi — keyingi safar eslaydi.",
  "Kunlik bepul limit: ma'lumot ulashishni yoqsangiz cheksiz.",
];

// Cursor-reactive orb: a soft core with orbiting motes that drift toward the pointer.
const OrbLoader = ({ progress }) => {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    const host = cv.parentElement;
    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: 0.5, y: 0.5, active: false };
    const motes = Array.from({ length: 70 }, (_, i) => ({
      a: (i / 70) * Math.PI * 2,
      r: 0.18 + Math.random() * 0.28,
      s: 0.2 + Math.random() * 0.6,
      z: Math.random(),
      hue: 170 + Math.random() * 80,
    }));
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    let t = 0;
    const cx0 = () => w * 0.5;
    const cy0 = () => h * 0.46;
    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const px = mouse.active ? (mouse.x - 0.5) * w * 0.22 : Math.sin(t * 0.6) * 18;
      const py = mouse.active ? (mouse.y - 0.46) * h * 0.18 : Math.cos(t * 0.8) * 12;
      const cx = cx0() + px;
      const cy = cy0() + py;
      const R = Math.min(w, h) * 0.13;
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 3.2);
      halo.addColorStop(0, "rgba(56,224,200,0.28)");
      halo.addColorStop(0.5, "rgba(91,140,255,0.12)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      // Orbit ring that fills with progress.
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#38e0c8";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, progress.current));
      ctx.stroke();
      for (const m of motes) {
        m.a += 0.004 * m.s + (mouse.active ? 0.006 : 0);
        const wob = Math.sin(t * 1.3 + m.z * 9) * 0.03;
        const rr = (m.r + wob) * Math.min(w, h);
        const mx = cx + Math.cos(m.a) * rr * (1 + m.z * 0.3);
        const my = cy + Math.sin(m.a) * rr * (0.55 + m.z * 0.4);
        const alpha = 0.25 + m.z * 0.6;
        ctx.fillStyle = `hsla(${m.hue},90%,70%,${alpha})`;
        ctx.beginPath();
        ctx.arc(mx, my, 1 + m.z * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      const core = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      core.addColorStop(0, "#f2fffd");
      core.addColorStop(0.35, "#7df5e6");
      core.addColorStop(0.75, "#3b8cff");
      core.addColorStop(1, "rgba(59,140,255,0.15)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1 + Math.sin(t * 2.2) * 0.04), 0, Math.PI * 2);
      ctx.fill();
      // Two "eyes" that glance at the pointer.
      const ex = mouse.active ? (mouse.x - 0.5) * R * 0.5 : Math.sin(t) * R * 0.15;
      const ey = mouse.active ? (mouse.y - 0.46) * R * 0.4 : 0;
      const blink = (Math.sin(t * 1.7) > 0.97 ? 0.15 : 1) * R * 0.17;
      ctx.fillStyle = "#0b1226";
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + sx * R * 0.32 + ex, cy - R * 0.05 + ey, R * 0.09, blink, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    size();
    frame();
    window.addEventListener("resize", size);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [progress]);
  return <canvas ref={ref} className="rk-orb" aria-hidden="true" />;
};

const RikoPage = () => {
  const frameRef = useRef(null);
  const progress = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [tip, setTip] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [full, setFull] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Progress is a smoothed guess: the frame load lands it at 70 %, the grace period walks it to 100 %.
  useEffect(() => {
    if (ready) return undefined;
    const start = performance.now();
    const id = setInterval(() => {
      const el = performance.now() - start;
      const target = loaded ? 0.7 + 0.3 * Math.min(1, el / (GRACE_MS + 1500)) : Math.min(0.66, el / 14000);
      progress.current += (target - progress.current) * 0.08;
      setStep(progress.current < 0.3 ? 0 : progress.current < 0.7 ? 1 : progress.current < 0.9 ? 2 : 3);
    }, 100);
    return () => clearInterval(id);
  }, [loaded, ready, nonce]);

  useEffect(() => {
    const id = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const a = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    const b = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    const c = setTimeout(() => setLoaded(true), REVEAL_FALLBACK_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [nonce]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setTimeout(() => setReady(true), GRACE_MS);
    return () => clearTimeout(id);
  }, [loaded]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }, []);

  const reload = useCallback(() => {
    setLoaded(false);
    setReady(false);
    setTimedOut(false);
    setCanSkip(false);
    progress.current = 0;
    setNonce((n) => n + 1);
  }, []);

  return (
    <div className={`rk ${ready ? "ready" : ""}`}>
      <header className="rk-nav">
        <Link to="/" className="rk-brand">
          <span className="mark"><FlaskConical size={16} /></span>
          <span>Smart<b>Lab</b> 3D</span>
        </Link>
        <nav className="rk-links">
          <Link to="/">Bosh sahifa</Link>
          <Link to="/chemistry">Kimyo</Link>
          <Link to="/biology">Biologiya</Link>
          <Link to="/physics">Fizika</Link>
        </nav>
        <div className="rk-title">
          <Bot size={16} />
          <b>Riko</b>
          <span>Quantum VRM · Gemini Live</span>
        </div>
        <div className="rk-actions">
          <span className={`rk-status ${ready ? "on" : ""}`}>
            <span className="dot" />
            {ready ? "Jonli" : loaded ? "Avatar tayyorlanmoqda" : "Yuklanmoqda"}
          </span>
          <button type="button" className="rk-ic" onClick={reload} title="Qayta yuklash" aria-label="Qayta yuklash">
            <RefreshCw size={16} />
          </button>
          <button type="button" className="rk-ic" onClick={toggleFull} title="To'liq ekran" aria-label="To'liq ekran">
            {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <a className="rk-ic" href={RIKO_URL} target="_blank" rel="noopener noreferrer" title="Yangi oynada ochish" aria-label="Yangi oynada ochish">
            <ExternalLink size={16} />
          </a>
        </div>
      </header>

      <main className="rk-stage">
        <iframe
          key={nonce}
          ref={frameRef}
          className="rk-frame"
          src={RIKO_URL}
          title="Riko — Quantum VRM"
          allow="microphone; camera; display-capture; autoplay; clipboard-write; fullscreen; speaker-selection"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />

        {!ready && (
          <div className="rk-loader">
            <OrbLoader progress={progress} />
            <div className="rk-loader-ui">
              <p className="rk-eyebrow"><Sparkles size={14} /> 3D AI hamroh</p>
              <h1>Riko uyg'onmoqda</h1>
              <p className="rk-step" key={step}>{STEPS[step]}</p>
              <p className="rk-tip" key={`t${tip}`}>{TIPS[tip]}</p>
              <div className="rk-perms">
                <span><Mic size={13} /> Mikrofon</span>
                <span><Camera size={13} /> Kamera (ixtiyoriy)</span>
              </div>
              <div className="rk-loader-actions">
                {canSkip && !timedOut && (
                  <button type="button" className="rk-btn ghost" onClick={() => setReady(true)}>
                    Hoziroq ochish
                  </button>
                )}
                {timedOut && (
                  <>
                    <span className="rk-warn">Yuklash cho'zilib ketdi. Internetni tekshiring yoki alohida oynada oching.</span>
                    <button type="button" className="rk-btn ghost" onClick={reload}>Qayta urinish</button>
                    <a className="rk-btn" href={RIKO_URL} target="_blank" rel="noopener noreferrer">Yangi oynada ochish</a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RikoPage;
