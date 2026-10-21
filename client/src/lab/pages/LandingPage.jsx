import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  Dna,
  Gauge,
  CircuitBoard,
  Landmark,
  ArrowRight,
  Bot,
  Mic,
  Eye,
  Brain,
  Sparkles,
  RotateCcw,
  MousePointer2,
  Glasses,
  Layers,
  Boxes,
  Play,
} from "lucide-react";
import { SUBJECTS } from "@/lab/data/subjects";
import LandingFx from "./landing-fx/LandingFx";
import "./LandingPage.css";

// Lab-console landing: a playable mini-lab in the hero, tilting subject stations, a plain-words Riko
// section with a live chat preview. Wrapped in the HTML-in-Canvas laser scene when the flag is on.
const ICONS = { chemistry: FlaskConical, biology: Dna, physics: Gauge, electronics: CircuitBoard, history: Landmark };
const CODES = { chemistry: "CHEM", biology: "BIO", physics: "PHYS", electronics: "ELEC", history: "HIST" };
const TOTAL_TOPICS = SUBJECTS.reduce((n, s) => n + s.topics.length, 0);
const WORDS = ["Kimyo", "Biologiya", "Fizika", "Elektronika", "Tarix"];

const STATS = [
  { n: SUBJECTS.length, l: "Fan yo'nalishi" },
  { n: TOTAL_TOPICS, l: "Interaktiv mavzu" },
  { n: 118, l: "Kimyoviy element" },
  { n: 2234, l: "Anatomik qism" },
];

/* ── mini lab: pick reagents, watch the flask react ───── */
const REAGENTS = [
  { id: "h2o", label: "Suv", f: "H₂O", color: "#9fd9ff" },
  { id: "na", label: "Natriy", f: "Na", color: "#c4b5fd" },
  { id: "cuso4", label: "Mis sulfat", f: "CuSO₄", color: "#2f7fe0" },
  { id: "nh3", label: "Ammiak", f: "NH₃", color: "#b7f0c8" },
  { id: "h2so4", label: "Sulfat kislota", f: "H₂SO₄", color: "#ffe9a8" },
  { id: "co2", label: "Quruq muz", f: "CO₂", color: "#e8f4ff" },
];
const COMBOS = [
  { pair: ["na", "h2o"], fx: "flash", color: "#d9c7ff", text: "Natriy suvda portladi! Vodorod gazi ajraldi.", eq: "2Na + 2H₂O → 2NaOH + H₂↑" },
  { pair: ["cuso4", "nh3"], fx: "deep", color: "#1b2fd0", text: "Rang to'q ko'kka o'zgardi — yangi birikma hosil bo'ldi.", eq: "Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺" },
  { pair: ["h2so4", "h2o"], fx: "steam", color: "#e6ead8", text: "Kislota suvga quyildi — eritma qizib ketdi, bug' chiqdi.", eq: "H₂SO₄ + H₂O → issiqlik" },
  { pair: ["co2", "h2o"], fx: "fog", color: "#d8ecff", text: "Quruq muz suvda qaynadi — quyuq oq tuman!", eq: "CO₂(qattiq) → CO₂(gaz)" },
  { pair: ["h2so4", "nh3"], fx: "steam", color: "#fff3c4", text: "Kislota va ishqor bir-birini neytralladi, idish ilidi.", eq: "2NH₃ + H₂SO₄ → (NH₄)₂SO₄" },
  { pair: ["na", "h2so4"], fx: "flash", color: "#ffd6a0", text: "Juda shiddatli reaksiya! Laboratoriyada bunday qilmang.", eq: "2Na + H₂SO₄ → Na₂SO₄ + H₂↑" },
];
const mix = (colors) => {
  if (!colors.length) return "#9fd9ff";
  const c = colors.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const avg = [0, 1, 2].map((k) => Math.round(c.reduce((s, v) => s + v[k], 0) / c.length));
  return `#${avg.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

function MiniLab() {
  const [poured, setPoured] = useState([]);
  const [event, setEvent] = useState(null);
  const [fx, setFx] = useState(null);
  const timer = useRef(0);

  const add = (r) => {
    if (poured.length >= 5) return;
    const next = [...poured, r];
    setPoured(next);
    const ids = new Set(next.map((p) => p.id));
    const hit = COMBOS.find((c) => c.pair.every((id) => ids.has(id)));
    const already = event && hit && event.eq === hit.eq;
    if (hit && !already) {
      setEvent(hit);
      setFx(hit.fx);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFx(null), 2600);
    } else if (!hit) {
      setEvent(null);
    }
  };
  const reset = () => {
    setPoured([]);
    setEvent(null);
    setFx(null);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const fill = Math.min(1, poured.length / 5);
  const color = event?.color || mix(poured.map((p) => p.color));
  const level = 150 - fill * 92;

  return (
    <div className={`mini ${fx ? `fx-${fx}` : ""}`} data-hit="">
      <div className="mini-head">
        <span className="mini-tag"><Sparkles size={13} /> Mini laboratoriya</span>
        <span className="mini-hint">Reaktivni bosing — kolbaga quyiladi</span>
      </div>
      <div className="mini-body">
        <div className="flask-wrap">
          <svg className="flask" viewBox="0 0 160 170" aria-hidden="true">
            <defs>
              <clipPath id="flaskClip">
                <path d="M62 12h36v48l40 78c6 12-2 24-14 24H36c-12 0-20-12-14-24l40-78z" />
              </clipPath>
              <linearGradient id="glass" x1="0" x2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <g clipPath="url(#flaskClip)">
              <rect className="liquid" x="0" y={level} width="160" height="170" fill={color} />
              <path className="wave" d={`M-20 ${level} q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 v30 h-200z`} fill={color} opacity="0.8" />
              {fx === "flash" && <rect className="flashfill" x="0" y="0" width="160" height="170" fill="#fff" />}
              {(fx === "flash" || fx === "fog") && [...Array(10)].map((_, i) => (
                <circle key={i} className="bub" cx={40 + ((i * 37) % 80)} cy="150" r={2 + (i % 3)} style={{ animationDelay: `${(i * 0.17) % 1.2}s` }} />
              ))}
            </g>
            <path className="glassline" d="M62 12h36v48l40 78c6 12-2 24-14 24H36c-12 0-20-12-14-24l40-78z" fill="url(#glass)" />
            <rect x="56" y="6" width="48" height="10" rx="3" className="lip" />
            <path className="mark" d="M118 118h10M112 100h10M106 82h10" />
          </svg>
          {(fx === "steam" || fx === "fog") && (
            <div className={`vapour ${fx}`}>
              {[...Array(6)].map((_, i) => <span key={i} style={{ "--i": i }} />)}
            </div>
          )}
          <div className="flask-caption" key={event ? event.eq : poured.length}>
            {event ? (
              <>
                <b>{event.text}</b>
                <code>{event.eq}</code>
              </>
            ) : poured.length ? (
              <span>{poured.map((p) => p.label).join(" + ")} — hozircha tinch.</span>
            ) : (
              <span>Kolba bo'sh. Ikkita reaktivni tanlab ko'ring.</span>
            )}
          </div>
        </div>
        <div className="reagents">
          {REAGENTS.map((r) => (
            <button key={r.id} type="button" onClick={() => add(r)} disabled={poured.length >= 5} style={{ "--c": r.color }}>
              <span className="sw" />
              <span className="rl">{r.label}</span>
              <span className="rf">{r.f}</span>
            </button>
          ))}
          <button type="button" className="reset" onClick={reset} disabled={!poured.length}>
            <RotateCcw size={14} /> Tozalash
          </button>
        </div>
      </div>
      <div className="mini-foot">
        <span className="slots">
          {[...Array(5)].map((_, i) => <i key={i} className={i < poured.length ? "on" : ""} style={{ background: poured[i]?.color }} />)}
        </span>
        <Link to="/chemistry/lab" className="mini-cta">Haqiqiy laboratoriyaga o'tish <ArrowRight size={14} /></Link>
      </div>
    </div>
  );
}

/* ── small interactive helpers ────────────────────────── */
function CountUp({ to }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { threshold: 0.1 });
    io.observe(el);
    // Whatever the observer does, never leave a zero on screen.
    const fallback = setTimeout(() => {
      start();
      setTimeout(() => setV(to), 1500);
    }, 2500);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [to]);
  return <span ref={ref}>{v.toLocaleString("uz-UZ").replace(/,/g, " ")}</span>;
}

function TiltCard({ children, className = "", style, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <Link ref={ref} className={`tilt ${className}`} style={style} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      {children}
    </Link>
  );
}

function CycleWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="cycle" aria-live="polite">
      <span key={i} className="cycle-word">{WORDS[i]}</span>
    </span>
  );
}

const RIKO_CHAT = [
  { who: "you", t: "Salom Riko! Fotosintez nima?" },
  { who: "riko", t: "Salom! O'simlik quyosh nurini oziqqa aylantiradi — shuni fotosintez deyishadi. Xohlasang, hujayra ichini ko'rsataman." },
  { who: "you", t: "Ha, ko'rsat!" },
  { who: "riko", t: "Mana, Biologiya bo'limini ochdim. Yashil doirachalar — xloroplastlar, ish o'sha yerda bo'ladi 🌱" },
];

function RikoPreview() {
  const [n, setN] = useState(1);
  const [talking, setTalking] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setN((v) => (v >= RIKO_CHAT.length ? 1 : v + 1));
    }, 2600);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setTalking(RIKO_CHAT[n - 1]?.who === "riko");
  }, [n]);
  return (
    <div className="riko-demo">
      <div className={`riko-avatar ${talking ? "talking" : ""}`} aria-hidden="true">
        <div className="orb">
          <span className="eye l" />
          <span className="eye r" />
          <span className="mouth" />
        </div>
        <div className="ring" />
        <div className="bars">{[...Array(7)].map((_, i) => <i key={i} style={{ "--i": i }} />)}</div>
      </div>
      <div className="riko-chat">
        {RIKO_CHAT.slice(0, n).map((m, i) => (
          <div key={i} className={`msg ${m.who}`}>{m.t}</div>
        ))}
        {n < RIKO_CHAT.length && <div className="msg riko typing"><i /><i /><i /></div>}
      </div>
    </div>
  );
}

const MODE_LABEL = { canvas: "HTML-in-Canvas: jonli", dom: "Online", off: "Online" };

const LandingPage = () => {
  const [mode, setMode] = useState("dom");
  const onMode = useCallback((m) => setMode(m), []);
  const featured = useMemo(() => SUBJECTS, []);
  return (
    <LandingFx onMode={onMode}>
      <div className={`sl-landing mode-${mode}`} id="top">
        <header className="rail">
          <div className="wrap rail-in">
            <a className="brand" href="#top">
              <span className="mark" aria-hidden="true"><FlaskConical size={18} /></span>
              <span className="name">Simu<b>Link</b> 3D</span>
            </a>
            <nav>
              <a href="#stations">Fanlar</a>
              <a href="#riko">Riko AI</a>
              <a href="#how">Qanday ishlaydi</a>
              <Link to="/chemistry/lab">Laboratoriya</Link>
            </nav>
            <span className={`status ${mode}`}><span className="dot" />{MODE_LABEL[mode]}</span>
          </div>
        </header>

        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <span className="blob b1" /><span className="blob b2" /><span className="grid" />
          </div>
          <div className="wrap hero-in">
            <div className="hero-text">
              <p className="eyebrow"><MousePointer2 size={13} /> Virtual fan laboratoriyasi</p>
              <h1>
                <CycleWord />
                <br />
                qo'lingizda, <span className="hl">3D</span> da.
              </h1>
              <p className="lede">
                Reaksiyalarni o'zingiz aralashtiring, odam tanasini qatlamma-qatlam oching, dvigatel ichiga
                kiring. Hammasi brauzerda — o'rnatish shart emas. Savolingiz bo'lsa, Riko yonida.
              </p>
              <div className="cta">
                <a className="btn btn-primary" href="#stations">Boshlash <ArrowRight size={18} /></a>
                <Link className="btn btn-ghost" to="/riko"><Bot size={18} /> Riko bilan gaplashish</Link>
              </div>
              <div className="stats">
                {STATS.map((s) => (
                  <div className="stat" key={s.l}>
                    <div className="n"><CountUp to={s.n} /></div>
                    <div className="l">{s.l}</div>
                  </div>
                ))}
                <div className="stat">
                  <div className="n">VR</div>
                  <div className="l">Cardboard bilan</div>
                </div>
              </div>
            </div>
            <MiniLab />
          </div>
        </section>

        <section className="labs wrap" id="stations">
          <div className="sec-head">
            <span className="sec-tag">// Stansiyalar</span>
            <h2>Fanni tanlang, ichiga kiring</h2>
            <p>Har bir fan — alohida 3D muhit. Kartani sichqoncha bilan silang: u siz tomon egiladi.</p>
          </div>
          <div className="grid">
            {featured.map((s) => {
              const Icon = ICONS[s.slug] || FlaskConical;
              const shown = s.topics.slice(0, 4);
              const extra = s.topics.length - shown.length;
              return (
                <TiltCard className="card" key={s.slug} to={`/${s.slug}`} style={{ "--ac": s.color }}>
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
                </TiltCard>
              );
            })}
          </div>
        </section>

        <section className="riko" id="riko">
          <div className="wrap riko-in">
            <div className="riko-text">
              <span className="sec-tag">// Riko AI</span>
              <h2>Riko — sizning 3D yordamchingiz</h2>
              <p className="riko-lede">
                Riko — ekrandagi jonli qiz. U bilan oddiy gaplashasiz: mikrofonni yoqasiz, savol berasiz, u ovoz
                bilan javob qaytaradi. Kamerani yoqsangiz — sizni ko'radi, ekranni ulashsangiz — darsingizni
                ko'rib, yordam beradi.
              </p>
              <ul className="riko-points">
                <li><Mic size={18} /><div><b>Gaplashing</b><span>Yozish shart emas. Aytasiz — u eshitadi va javob beradi.</span></div></li>
                <li><Eye size={18} /><div><b>Ko'radi</b><span>Kamera yoki ekranni ulashing, u nimani nazarda tutganingizni tushunadi.</span></div></li>
                <li><Brain size={18} /><div><b>Eslab qoladi</b><span>Ismingiz, qiziqishlaringiz — keyingi safar o'zi eslaydi.</span></div></li>
                <li><Sparkles size={18} /><div><b>Hissiyotli</b><span>Kuladi, hayron qoladi, xafa bo'ladi — yuz ifodasi va lablari gapiga mos.</span></div></li>
              </ul>
              <p className="riko-note">Bepul: har kuni 10 daqiqa. Ma'lumot ulashishga rozi bo'lsangiz — cheksiz.</p>
              <div className="cta">
                <Link className="btn btn-riko" to="/riko"><Play size={18} /> Riko bilan gaplashish</Link>
              </div>
            </div>
            <RikoPreview />
          </div>
        </section>

        <section className="how wrap" id="how">
          <div className="sec-head">
            <span className="sec-tag">// Qanday ishlaydi</span>
            <h2>Uch qadam — va siz laboratoriyadasiz</h2>
          </div>
          <ol className="steps">
            <li><span className="num">1</span><Boxes size={20} /><b>Fanni tanlang</b><span>Kimyo, biologiya, fizika, elektronika yoki tarix.</span></li>
            <li><span className="num">2</span><Layers size={20} /><b>Qo'lingiz bilan sinang</b><span>Ushlang, torting, quying, kesib oching — hamma narsa javob beradi.</span></li>
            <li><span className="num">3</span><Glasses size={20} /><b>Xohlasangiz, VR</b><span>Telefon va Cardboard ko'zoynak bilan sahnaga kiring.</span></li>
          </ol>
        </section>

        <footer>
          <div className="wrap foot-in">
            <span>SimuLink 3D — o'quvchilar uchun interaktiv virtual laboratoriya.</span>
            <span className="mono">ABDULKHAYEV HASANBOY · xn--dr8haa.uz</span>
          </div>
        </footer>
      </div>
    </LandingFx>
  );
};

export default LandingPage;
