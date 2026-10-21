// Riko (Quantum VRM) — the hosted Vue/Three.js avatar assistant framed inside SimuLink with its own
// navbar. The app lives at vmrchat.vercel.app; an interactive loader covers it until it is ready.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Bot, ExternalLink, Maximize2, Minimize2, RefreshCw, Mic, Camera, Sparkles } from "lucide-react";
import "./RikoPage.css";

export const RIKO_URL = "https://vmrchat.vercel.app/";
const GRACE_MS = 16000; // Peaceful duration so 3D VRM model, shaders, speech2motion can load 100% peacefully
const SKIP_AFTER_MS = 5000;
const TIMEOUT_MS = 45000;
// The embed keeps a request open, so its load event can lag far behind the visible app; reveal anyway after this.
const REVEAL_FALLBACK_MS = 22000;

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

// Cursor-reactive orb: a soft core with orbiting motes that drift toward the pointer,
// and minimalist dot eyes that smoothly follow the mouse position.
const OrbLoader = ({ progress }) => {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const ctx = cv.getContext("2d");
    const host = cv.parentElement;
    let w = 0;
    let h = 0;
    let raf = 0;

    // Track mouse coordinates in window pixels
    const mouse = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.44,
      active: false,
      lastMove: 0,
    };

    // Smooth eye offset (relative to socket center)
    let eyeX = 0;
    let eyeY = 0;

    // Blinking engine
    let isBlinking = false;
    let blinkProg = 0;
    let blinkDuration = 0.16;
    let nextBlink = 2.0 + Math.random() * 2.5;
    let willDoubleBlink = false;

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
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      mouse.lastMove = performance.now();
    };

    const onLeave = () => {
      mouse.active = false;
    };

    let t = 0;
    let lastTime = performance.now();
    const cx0 = () => w * 0.5;
    const cy0 = () => h * 0.46;

    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      t += dt;

      ctx.clearRect(0, 0, w, h);

      const mouseRecentlyMoved = mouse.active && now - mouse.lastMove < 4000;
      const hostRect = host.getBoundingClientRect();
      const normalizedMouseX = (mouse.x - (hostRect?.left || 0)) / (w || 1);
      const normalizedMouseY = (mouse.y - (hostRect?.top || 0)) / (h || 1);

      // Gentle living orb body float and subtle tilt
      const bodySwayX = mouse.active ? (normalizedMouseX - 0.5) * 36 : Math.sin(t * 0.6) * 14;
      const bodySwayY = mouse.active ? (normalizedMouseY - 0.46) * 24 : Math.cos(t * 0.8) * 10;
      const cx = cx0() + bodySwayX;
      const cy = cy0() + bodySwayY;
      const R = Math.min(w, h) * 0.13;

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 3.2);
      halo.addColorStop(0, "rgba(56,224,200,0.28)");
      halo.addColorStop(0.5, "rgba(91,140,255,0.12)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // Orbit ring that fills with progress
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

      // Motes
      for (const m of motes) {
        m.a += 0.004 * m.s + (mouseRecentlyMoved ? 0.006 : 0);
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

      // Glowing core orb
      const core = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      core.addColorStop(0, "#f2fffd");
      core.addColorStop(0.35, "#7df5e6");
      core.addColorStop(0.75, "#3b8cff");
      core.addColorStop(1, "rgba(59,140,255,0.15)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1 + Math.sin(t * 2.2) * 0.04), 0, Math.PI * 2);
      ctx.fill();

      // Dot eyes position based on mouse position
      let targetEyeX = 0;
      let targetEyeY = 0;
      if (mouse.active) {
        const screenCx = hostRect.left + cx;
        const screenCy = hostRect.top + cy;
        const dx = mouse.x - screenCx;
        const dy = mouse.y - screenCy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const maxTravel = R * 0.28;
        const travel = Math.min(dist / 220, 1) * maxTravel;
        targetEyeX = Math.cos(angle) * travel;
        targetEyeY = Math.sin(angle) * travel;
      } else {
        targetEyeX = Math.sin(t * 0.8) * R * 0.12;
        targetEyeY = Math.cos(t * 0.5) * R * 0.06;
      }

      // Smooth eye movement
      eyeX += (targetEyeX - eyeX) * 0.22;
      eyeY += (targetEyeY - eyeY) * 0.22;

      // Natural cute blinking
      let blink = R * 0.17;
      if (!isBlinking) {
        nextBlink -= dt;
        if (nextBlink <= 0) {
          isBlinking = true;
          blinkProg = 0;
          blinkDuration = 0.15;
          willDoubleBlink = Math.random() < 0.25;
        }
      } else {
        blinkProg += dt / blinkDuration;
        if (blinkProg >= 1) {
          if (willDoubleBlink) {
            willDoubleBlink = false;
            blinkProg = 0;
            blinkDuration = 0.12;
          } else {
            isBlinking = false;
            nextBlink = 2.2 + Math.random() * 3.2;
          }
        } else {
          const factor = Math.max(0.12, 1 - Math.sin(blinkProg * Math.PI) * 0.92);
          blink = factor * R * 0.17;
        }
      }

      // Render the original dot eyes moving based on mouse position
      ctx.fillStyle = "#0b1226";
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(
          cx + sx * R * 0.32 + eyeX,
          cy - R * 0.05 + eyeY,
          R * 0.09,
          blink,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    size();
    frame();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [progress]);

  return <canvas ref={ref} className="rk-orb" aria-hidden="true" />;
};

const RikoPage = () => {
  const frameRef = useRef(null);
  const progress = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [step, setStep] = useState(0);
  const [tip, setTip] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [full, setFull] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Smooth peaceful progress pacing giving plenty of time for vmrchat.vercel.app to load peacefully
  useEffect(() => {
    if (ready) return undefined;
    const start = performance.now();
    const id = setInterval(() => {
      const el = performance.now() - start;
      const target = loaded
        ? 0.35 + 0.65 * Math.min(1, el / (GRACE_MS + 500))
        : Math.min(0.38, el / 8000);
      progress.current += (target - progress.current) * 0.06;
      const p = progress.current;
      setStep(p < 0.28 ? 0 : p < 0.58 ? 1 : p < 0.88 ? 2 : 3);
    }, 50);
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
    const id = setTimeout(() => {
      progress.current = 1;
      setDissolving(true);
      setTimeout(() => setReady(true), 650); // Peaceful smooth reveal
    }, GRACE_MS);
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

  const skipToReady = useCallback(() => {
    progress.current = 1;
    setDissolving(true);
    setTimeout(() => setReady(true), 350);
  }, []);

  const reload = useCallback(() => {
    setLoaded(false);
    setReady(false);
    setDissolving(false);
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
          <span>Simu<b>Link</b> 3D</span>
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
          <div className={`rk-loader ${dissolving ? "dissolving" : ""}`}>
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
                  <button type="button" className="rk-btn ghost" onClick={skipToReady}>
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
