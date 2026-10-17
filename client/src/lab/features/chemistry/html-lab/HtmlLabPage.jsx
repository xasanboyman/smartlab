// Kimyo laboratoriyasi: Three.js xona + html-cloth jurnal (HTML-in-Canvas) + DOM boshqaruv.
// The DOM panels work in every browser; the cloth shows the live journal when the flag is on
// and a rasterized copy when it is off.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Flame,
  RotateCw,
  Undo2,
  Trash2,
  Sparkles,
  BookOpen,
  X,
  Thermometer,
  Droplets,
  Beaker,
  FlaskConical,
} from "lucide-react";
import { SUBSTANCE_GROUPS } from "@/lab/data/substances";
import { HIC_FLAG, hasHtmlInCanvas, markDrawable } from "@/lab/html-canvas/htmlInCanvas";
import { createLabScene } from "./LabScene";
import { createLabCard } from "./labCard";
import { useHtmlLab } from "./useHtmlLab";
import AiReactionDialog from "./AiReactionDialog";
import "./HtmlLabPage.css";

const STATE_LABEL = { suyuq: "Suyuq", qattiq: "Qattiq", gaz: "Gaz" };

const stateLabelOf = (lab) => {
  if (lab.poured.length === 0) return "BO'SH";
  if (lab.boiling) return "QAYNAYAPTI";
  if (lab.heating) return "QIZDIRILMOQDA";
  if (lab.current && lab.current.status !== "neytral") return lab.current.title.toUpperCase();
  return "ARALASHMA";
};

const HtmlLabPage = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const stateRef = useRef(null);
  const lab = useHtmlLab();
  const [mode, setMode] = useState(null);
  const [tab, setTab] = useState(SUBSTANCE_GROUPS[0].key);
  const [journalOpen, setJournalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const lastPour = useRef(0);
  const lastReaction = useRef(0);
  const prevHeating = useRef(false);
  const boilSaid = useRef(false);

  // Build the scene once; the card either lives inside the canvas (native) or in a hidden host.
  useEffect(() => {
    const canvas = canvasRef.current;
    const native = hasHtmlInCanvas(canvas);
    if (native) markDrawable(canvas);
    const card = createLabCard(1024);
    let host = null;
    if (native) canvas.appendChild(card.el);
    else {
      host = document.createElement("div");
      host.style.cssText = "position:fixed;left:0;top:0;width:1024px;height:1024px;overflow:hidden;pointer-events:none;z-index:0;";
      host.appendChild(card.el);
      document.body.appendChild(host);
    }
    const scene = createLabScene({ canvas, sourceEl: card.el });
    card.wire({ cloth: scene.cloth });
    sceneRef.current = { scene, card };
    window.__hlCloth = scene.cloth;
    setMode(native ? "native" : "fallback");

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      card.tickIdle(dt);
      const s = stateRef.current;
      // Animated beaker only re-paints while something is actually moving (saves the rasterizer).
      const animated = s && (s.heating || s.bubbling || s.smoking || s.fogging);
      if (s && animated && now - lastDraw > (native ? 70 : 160)) {
        card.drawBeaker(s);
        scene.cloth.refresh();
        lastDraw = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      scene.dispose();
      card.el.remove();
      host?.remove();
      sceneRef.current = null;
    };
  }, []);

  // Mirror the hook state into the 3D beaker and the journal card.
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    const snapshot = {
      liquidColor: lab.liquidColor,
      fill: lab.fill,
      heating: lab.heating,
      bubbling: lab.bubbling,
      smoking: lab.smoking,
      fogging: lab.fogging,
      tempC: lab.tempC,
    };
    stateRef.current = snapshot;
    ref.scene.setLab(snapshot);
    const latest = lab.poured[lab.poured.length - 1];
    const eq = lab.current?.eq || (lab.product ? `${lab.product.formula} — ${lab.product.name}` : null);
    ref.card.setReadout({
      tempC: lab.tempC,
      ph: lab.ph,
      volumeMl: lab.volumeMl,
      substance: lab.product ? lab.product.formula : latest ? latest.formula : "",
      equation: eq,
      equationLabel: lab.current ? lab.current.title.toUpperCase() : "REAKSIYA",
      stateLabel: stateLabelOf(lab),
    });
    ref.card.drawBeaker(snapshot);
    ref.scene.cloth.refresh();
  }, [lab]);

  // Journal chatter: pours, reactions, burner, boiling.
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    if (lab.pourSeq !== lastPour.current) {
      lastPour.current = lab.pourSeq;
      const latest = lab.poured[lab.poured.length - 1];
      if (latest) ref.card.react("pour", { n: latest.name });
    }
    if (lab.reactionSeq !== lastReaction.current && lab.reactionEffect) {
      lastReaction.current = lab.reactionSeq;
      const fx = lab.reactionEffect;
      ref.card.react("react", { t: fx.title });
      if (fx.kind) ref.scene.flash(fx.kind);
      setToast({ ...fx, seq: lab.reactionSeq });
    }
    if (lab.heating !== prevHeating.current) {
      prevHeating.current = lab.heating;
      ref.card.react(lab.heating ? "heatOn" : "heatOff");
    }
    if (lab.boiling && !boilSaid.current) {
      boilSaid.current = true;
      ref.card.react("boil");
    } else if (!lab.boiling) boilSaid.current = false;
  }, [lab.pourSeq, lab.reactionSeq, lab.heating, lab.boiling, lab.poured, lab.reactionEffect]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  const onClear = useCallback(() => {
    lab.clear();
    sceneRef.current?.card.react("clear");
  }, [lab]);

  const onStir = useCallback(() => {
    lab.stir();
    sceneRef.current?.scene.stir();
  }, [lab]);

  const group = SUBSTANCE_GROUPS.find((g) => g.key === tab) || SUBSTANCE_GROUPS[0];
  const historyDesc = [...lab.history].reverse();

  return (
    <div className="hl">
      <canvas ref={canvasRef} className="hl-canvas" />

      <header className="hl-top">
        <Link to="/chemistry" className="hl-back">
          <ArrowLeft size={16} /> Kimyo
        </Link>
        <div className="hl-title">
          <b>Kimyo laboratoriyasi</b>
          <span>html-cloth · HTML-in-Canvas</span>
        </div>
        <div className="hl-top-actions">
          <button type="button" className={`hl-chip ${mode || ""}`} onClick={() => setInfoOpen((v) => !v)}>
            <span className="dot" />
            <span className="txt">{mode === "native" ? "HTML-in-Canvas: faol" : mode === "fallback" ? "HTML-in-Canvas: o'chiq" : "…"}</span>
            <span className="short">{mode === "native" ? "HiC: faol" : mode === "fallback" ? "HiC: o'chiq" : "…"}</span>
          </button>
          <button type="button" className="hl-icon hl-journal-toggle" onClick={() => setJournalOpen((v) => !v)} aria-label="Jurnal">
            <BookOpen size={18} />
          </button>
        </div>
      </header>

      {infoOpen && (
        <div className="hl-info">
          <button type="button" className="hl-info-close" onClick={() => setInfoOpen(false)} aria-label="Yopish">
            <X size={16} />
          </button>
          <b>Devordagi mato — jonli HTML sahifa.</b>
          {mode === "native" ? (
            <p>Brauzeringiz WICG HTML-in-Canvas API'ni qo'llab-quvvatlaydi: jurnal har kadrda <code>texElementImage2D</code> orqali to'g'ridan-to'g'ri matoga chiziladi. Matoni bosing, slayderlarni torting, matn yozing.</p>
          ) : (
            <p>Brauzeringizda API o'chiq, shuning uchun jurnal rasm sifatida chiziladi. Jonli rejim uchun Chrome'da <code>{HIC_FLAG}</code> bayrog'ini yoqing.</p>
          )}
        </div>
      )}

      <aside className="hl-shelf">
        <div className="hl-tabs">
          {SUBSTANCE_GROUPS.map((g) => (
            <button key={g.key} type="button" className={g.key === tab ? "on" : ""} onClick={() => setTab(g.key)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="hl-tiles">
          {group.items.map((s) => (
            <button key={s.id} type="button" className="hl-tile" onClick={() => lab.add(s)} title={`${s.name} (${s.formula})`}>
              <span className="sw" style={{ background: s.color }} />
              <span className="f">{s.formula}</span>
              <span className="n">{s.name}</span>
              <span className="st">{STATE_LABEL[s.state] || s.state}</span>
            </button>
          ))}
        </div>
      </aside>

      <aside className={`hl-journal ${journalOpen ? "open" : ""}`}>
        <div className="hl-ro">
          <div><Thermometer size={14} /><b>{lab.tempC.toFixed(1)}°C</b><span>Harorat</span></div>
          <div><Droplets size={14} /><b>{lab.ph.toFixed(1)}</b><span>pH</span></div>
          <div><Beaker size={14} /><b>{Math.round(lab.volumeMl)} ml</b><span>Hajm</span></div>
          <div><FlaskConical size={14} /><b>{lab.poured.length}</b><span>Quyilgan</span></div>
        </div>
        <div className={`hl-now ${lab.current?.kind || ""}`}>
          {lab.current ? (
            <>
              <b>{lab.current.title}</b>
              <p>{lab.current.detail}</p>
              {lab.current.eq && <code>{lab.current.eq}</code>}
            </>
          ) : lab.product ? (
            <>
              <b>{lab.product.name}</b>
              <code>{lab.product.formula}</code>
            </>
          ) : (
            <p className="muted">{lab.poured.length ? "Hozircha sezilarli reaksiya yo'q." : "Shkafdan reaktiv tanlang — idishga quyiladi."}</p>
          )}
        </div>
        <ol className="hl-hist">
          {historyDesc.map((h) => (
            <li key={h.index}>
              <span className="sw" style={{ background: h.color }} />
              <span className="t">
                <b>{h.name}</b> <small>{h.formula}</small>
                {h.reaction && <em>{h.reaction}</em>}
              </span>
              <span className="i">#{h.index}</span>
            </li>
          ))}
          {historyDesc.length === 0 && <li className="empty">Jurnal bo'sh.</li>}
        </ol>
      </aside>

      <div className="hl-dock">
        <button type="button" className={lab.heating ? "on hot" : ""} onClick={lab.toggleHeat}>
          <Flame size={18} /><span>{lab.heating ? "Gorelka: yoniq" : "Gorelka"}</span>
        </button>
        <button type="button" onClick={onStir} disabled={!lab.poured.length}>
          <RotateCw size={18} /><span>Aralashtirish</span>
        </button>
        <button type="button" onClick={lab.undo} disabled={!lab.poured.length}>
          <Undo2 size={18} /><span>Orqaga</span>
        </button>
        <button type="button" onClick={onClear} disabled={!lab.poured.length}>
          <Trash2 size={18} /><span>Tozalash</span>
        </button>
        <button type="button" className="ai" onClick={() => setAiOpen(true)}>
          <Sparkles size={18} /><span>AI reaksiya</span>
        </button>
      </div>

      {toast && (
        <div key={toast.seq} className={`hl-toast ${toast.kind || "none"}`}>
          <b>{toast.title}</b>
          <span>{toast.detail}</span>
          {toast.eq && <code>{toast.eq}</code>}
        </div>
      )}

      {aiOpen && (
        <AiReactionDialog
          onClose={() => setAiOpen(false)}
          onPlay={(a, b, result) => {
            lab.playAiReaction(a, b, result);
            setAiOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default HtmlLabPage;
