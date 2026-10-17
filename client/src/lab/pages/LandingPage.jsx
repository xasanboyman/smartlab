import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  Dna,
  Gauge,
  CircuitBoard,
  Landmark,
  ArrowRight,
  Boxes,
  Layers,
  Bot,
  Glasses,
} from "lucide-react";
import { SUBJECTS } from "@/lab/data/subjects";
import LandingFx from "./landing-fx/LandingFx";
import "./LandingPage.css";

// Lab-console landing wrapped in the Zyie-style HTML-in-Canvas scene: a laser scanner slices the
// live page into chunks while a cat chases it. Without the browser flag it's laser + cat only.
const ICONS = {
  chemistry: FlaskConical,
  biology: Dna,
  physics: Gauge,
  electronics: CircuitBoard,
  history: Landmark,
};
const CODES = {
  chemistry: "CHEM",
  biology: "BIO",
  physics: "PHYS",
  electronics: "ELEC",
  history: "HIST",
};

const TOTAL_TOPICS = SUBJECTS.reduce((n, s) => n + s.topics.length, 0);

const STATS = [
  { n: String(SUBJECTS.length), l: "Fan yo'nalishi" },
  { n: String(TOTAL_TOPICS), l: "Interaktiv mavzu" },
  { n: "118", l: "Kimyoviy element" },
  { n: "2 234", l: "Anatomik qism" },
  { n: "VR", l: "Cardboard qo'llab-quvvatlash" },
];

const FEATURES = [
  { Icon: Boxes, t: "Real 3D fizika", d: "Three.js xonasi, Verlet mato va jonli reaksiya effektlari — hammasi brauzerda." },
  { Icon: Layers, t: "HTML-in-Canvas", d: "WICG spetsifikatsiyasi: haqiqiy HTML sahifa WebGL teksturasiga aylanadi, lazer uni kesadi, mato uni hilpiratadi." },
  { Icon: Bot, t: "AI yordamchi", d: "Mira AI gid har bir sahnada savolingizga javob beradi va tajribani boshqaradi." },
  { Icon: Glasses, t: "O'rnatishsiz, VR bilan", d: "Telefon va Cardboard ko'zoynak bilan sahnaga kirib boring." },
];

function Constellation() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const host = cv.parentElement;
    const COLORS = ["#38e0c8", "#5b8cff", "#3b82f6"];
    let w = 0, h = 0, pts = [], raf = 0, resizeTimer = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(26, Math.min(64, Math.round((w * h) / 22000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6, c: COLORS[(Math.random() * COLORS.length) | 0],
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 118) {
            ctx.globalAlpha = (1 - d / 118) * 0.28;
            ctx.strokeStyle = "#3a5a8f"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.globalAlpha = 0.85; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(size, 150); };
    size(); frame();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return <canvas id="sl-fx" ref={ref} aria-hidden="true" />;
}

const MODE_LABEL = { canvas: "HTML-in-Canvas: jonli", dom: "Online", off: "Online" };

const LandingPage = () => {
  const [mode, setMode] = useState("dom");
  return (
    <LandingFx onMode={setMode}>
      <div className={`sl-landing mode-${mode}`} id="top">
        <header className="rail">
          <div className="wrap rail-in">
            <a className="brand" href="#top">
              <span className="mark" aria-hidden="true">
                <FlaskConical size={18} />
              </span>
              <span className="name">Smart<b>Lab</b> 3D</span>
            </a>
            <nav>
              <a href="#stations">Fanlar</a>
              <a href="#features">Imkoniyatlar</a>
              <Link to="/chemistry">Kimyo</Link>
              <Link to="/biology">Biologiya</Link>
              <Link to="/riko" className="riko">Riko AI</Link>
            </nav>
            <span className={`status ${mode}`}><span className="dot" />{MODE_LABEL[mode]}</span>
          </div>
        </header>

        <section className="hero">
          <Constellation />
          <div className="wrap hero-in">
            <p className="eyebrow">Virtual fan laboratoriyasi</p>
            <h1>Fanni <span className="hl">3D</span> da qo'lingizga oling.</h1>
            <p className="lede">
              Kimyo, biologiya, fizika, elektronika va tarix — brauzeringizda ishlaydigan interaktiv 3D
              laboratoriya. Reaksiyalarni aralashtiring, anatomiyani kesib ko'ring, dvigatel ichini
              kuzating. O'rnatishsiz, VR bilan.
            </p>
            <div className="cta">
              <a className="btn btn-primary" href="#stations">
                Laboratoriyaga kirish <ArrowRight size={18} />
              </a>
              <Link className="btn btn-ghost" to="/chemistry/lab">Kimyo laboratoriyasi</Link>
            </div>
            <div className="stats">
              {STATS.map((s) => (
                <div className="stat" key={s.l}>
                  <div className="n">{s.n}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
            {mode === "dom" && (
              <p className="flag-hint">
                Sahifa lazer bilan kesilishi uchun Chrome'da <code>chrome://flags/#canvas-draw-element</code> bayrog'ini yoqing.
              </p>
            )}
          </div>
        </section>

        <section className="labs wrap" id="stations">
          <div className="sec-head">
            <span className="sec-tag">// Stansiyalar</span>
            <h2>Fan stansiyalarini tanlang</h2>
            <p>Har bir fan — alohida 3D muhit. Kirib, aylantiring, bosing va o'zingiz sinab ko'ring.</p>
          </div>
          <div className="grid">
            {SUBJECTS.map((s) => {
              const Icon = ICONS[s.slug] || FlaskConical;
              const shown = s.topics.slice(0, 4);
              const extra = s.topics.length - shown.length;
              return (
                <Link className="card" key={s.slug} to={`/${s.slug}`} style={{ "--ac": s.color }}>
                  <div className="card-top">
                    <span className="ic"><Icon size={24} /></span>
                    <div>
                      <div className="code">{CODES[s.slug] || s.slug}</div>
                      <h3>{s.title}</h3>
                    </div>
                  </div>
                  <p className="desc">{s.short}</p>
                  <div className="chips">
                    {shown.map((t) => <span className="chip" key={t.slug}>{t.title}</span>)}
                    {extra > 0 && <span className="chip more">+{extra}</span>}
                  </div>
                  <div className="card-foot">
                    <span className="count">{s.topics.length} mavzu</span>
                    <span className="enter">Ochish <ArrowRight size={16} /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="band" id="features">
          <div className="wrap band-in">
            {FEATURES.map(({ Icon, t, d }) => (
              <div className="feat" key={t}>
                <h4><Icon size={20} />{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <div className="wrap foot-in">
            <span>SmartLab 3D — o'quvchilar uchun interaktiv virtual laboratoriya.</span>
            <span className="mono">ABDULKHAYEV HASANBOY · xn--dr8haa.uz</span>
          </div>
        </footer>
      </div>
    </LandingFx>
  );
};

export default LandingPage;
