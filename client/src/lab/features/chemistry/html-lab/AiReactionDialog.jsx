// AI reaksiya: ikki modda + miqdor -> backend (Gemini) -> status, so'ng idishda ijro etiladi.
import { useState } from "react";
import { Sparkles, X, Loader2, ArrowRight } from "lucide-react";
import { SUBSTANCES } from "@/lab/data/substances";
import { useAiReaction } from "./useAiReaction";

const BY_ID = Object.fromEntries(SUBSTANCES.map((s) => [s.id, s]));
const UNITS = ["g", "ml", "dona"];
const unitFor = (s) => (s?.state === "suyuq" ? "ml" : "g");

const Picker = ({ label, value, onChange }) => {
  const s = BY_ID[value.id];
  return (
    <div className="hl-pick">
      <label>
        <span className="sw" style={{ background: s?.color || "#dfe9f2" }} />
        {label}
      </label>
      <select
        value={value.id}
        onChange={(e) => onChange({ ...value, id: e.target.value, unit: unitFor(BY_ID[e.target.value]) })}
      >
        {SUBSTANCES.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.name} ({sub.formula})
          </option>
        ))}
      </select>
      <div className="row">
        <input type="number" min="0" step="any" value={value.qty} placeholder="Miqdor" onChange={(e) => onChange({ ...value, qty: e.target.value })} />
        <select value={value.unit} onChange={(e) => onChange({ ...value, unit: e.target.value })}>
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const AiReactionDialog = ({ onClose, onPlay }) => {
  const [a, setA] = useState({ id: "cmp-h2o", qty: "100", unit: "ml" });
  const [b, setB] = useState({ id: "el-Na", qty: "2", unit: "g" });
  const { loading, error, result, run } = useAiReaction();

  const submit = async () => {
    const sa = BY_ID[a.id];
    const sb = BY_ID[b.id];
    const data = await run({
      a: { name: sa.name, formula: sa.formula, qty: Number(a.qty) || 0, unit: a.unit },
      b: { name: sb.name, formula: sb.formula, qty: Number(b.qty) || 0, unit: b.unit },
    });
    if (data) onPlay(sa, sb, data);
  };

  return (
    <div className="hl-dlg-bg" onClick={onClose}>
      <div className="hl-dlg" onClick={(e) => e.stopPropagation()}>
        <div className="hl-dlg-head">
          <Sparkles size={18} color="#c7b2ff" />
          <div>
            <b>AI reaksiya</b>
            <p>Ikki moddani tanlang — Mira AI reaksiyani aniqlab, idishda ijro etadi.</p>
          </div>
          <button type="button" className="hl-icon x" onClick={onClose} aria-label="Yopish"><X size={16} /></button>
        </div>
        <div className="hl-dlg-grid">
          <Picker label="1-modda" value={a} onChange={setA} />
          <ArrowRight className="arrow" size={18} />
          <Picker label="2-modda" value={b} onChange={setB} />
        </div>
        <div className="hl-dlg-foot">
          {error && <span className="err">{error}</span>}
          {result && (
            <span className="res">
              <b>{result.status}</b> {result.description}
              {result.equation && <code>{result.equation}</code>}
            </span>
          )}
          <button type="button" className="hl-btn" onClick={submit} disabled={loading || !a.qty || !b.qty}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Aniqlanmoqda…" : "Reaksiyani aniqlash"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiReactionDialog;
