// Vessel state for the HTML lab: pours, colour blending, reactions with equations,
// burner-driven temperature, pH and volume estimates. Pure React state, no services.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addComposition, findProduct } from "@/lab/data/molecules";
import { blendColors } from "@/lab/data/chemColor";
import { PRODUCT_COLORS, effectForStatus } from "@/lab/data/reactions";
import { detectHeatEvent, detectReaction, estimatePh, estimateVolume } from "./labRules";

const ROOM_C = 22;
const EMPTY_COLOR = "#dfe9f2";
const CAPACITY = 6;
const EXOTHERMIC = { portlash: 48, yonish: 36, issiqlik: 22, qaynash: 0 };

const compositionOf = (list) => {
  const comp = {};
  for (const s of list) addComposition(comp, s.composition);
  return comp;
};

export const useHtmlLab = () => {
  const [poured, setPoured] = useState([]);
  const [history, setHistory] = useState([]);
  const [pour, setPour] = useState({ seq: 0, color: EMPTY_COLOR, state: "suyuq" });
  const [reaction, setReaction] = useState({ seq: 0, effect: null });
  const [heating, setHeating] = useState(false);
  const [stirSeq, setStirSeq] = useState(0);
  const [tempC, setTempC] = useState(ROOM_C);
  const heatingRef = useRef(false);
  const pouredRef = useRef([]);
  const tempRef = useRef(ROOM_C);
  const spikeRef = useRef(0);
  const firedHeatRef = useRef(null);

  const fire = useCallback((effect) => {
    setReaction((r) => ({ seq: r.seq + 1, effect }));
    spikeRef.current += EXOTHERMIC[effect.status] ?? 0;
  }, []);

  // Burner eases the vessel toward a hot plate; reactions add a spike; everything cools back to room temperature.
  useEffect(() => {
    const id = window.setInterval(() => {
      const target = heatingRef.current ? 112 : ROOM_C;
      let t = tempRef.current;
      t += (target - t) * (heatingRef.current ? 0.028 : 0.02);
      if (spikeRef.current > 0) {
        const give = Math.min(spikeRef.current, 6);
        t += give;
        spikeRef.current -= give;
      }
      tempRef.current = t;
      setTempC(t);
      const heatEvent = detectHeatEvent({ poured: pouredRef.current, tempC: t, heating: heatingRef.current });
      if (heatEvent && firedHeatRef.current !== heatEvent.key) {
        firedHeatRef.current = heatEvent.key;
        fire(heatEvent);
      } else if (!heatEvent && t < 90) {
        firedHeatRef.current = null;
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [fire]);

  const toggleHeat = useCallback(() => {
    setHeating((on) => {
      heatingRef.current = !on;
      return !on;
    });
  }, []);

  const add = useCallback(
    (substance) => {
      setPoured((prev) => {
        const next = [...prev, substance];
        pouredRef.current = next;
        const before = detectReaction(prev);
        const after = detectReaction(next);
        const fired = after && after.key !== before?.key && after.status !== "neytral";
        if (fired) fire(after);
        const product = findProduct(compositionOf(next));
        setPour((p) => ({ seq: p.seq + 1, color: substance.color, state: substance.state }));
        setHistory((h) => [
          ...h,
          {
            index: next.length,
            name: substance.name,
            formula: substance.formula,
            color: substance.color,
            reaction: fired ? after.title : null,
            eq: fired ? after.eq : null,
            product: product ? product.name : null,
          },
        ]);
        return next;
      });
    },
    [fire],
  );

  // Plays a reaction the AI service described for two reagents.
  const playAiReaction = useCallback(
    (subA, subB, aiResult) => {
      const base = effectForStatus(aiResult?.status || "neytral");
      const effect = {
        ...base,
        detail: aiResult?.description || base.detail,
        eq: aiResult?.equation || null,
        key: `ai:${Date.now()}`,
      };
      setPoured((prev) => {
        const next = [...prev, subA, subB];
        pouredRef.current = next;
        return next;
      });
      setPour((p) => ({ seq: p.seq + 1, color: subB.color, state: subB.state }));
      fire(effect);
      setHistory((h) => [
        ...h,
        { index: h.length + 1, name: subA.name, formula: subA.formula, color: subA.color, reaction: null, product: null },
        { index: h.length + 2, name: subB.name, formula: subB.formula, color: subB.color, reaction: effect.title, eq: effect.eq, product: null },
      ]);
    },
    [fire],
  );

  const undo = useCallback(() => {
    setPoured((prev) => {
      const next = prev.slice(0, -1);
      pouredRef.current = next;
      return next;
    });
    setHistory((h) => h.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    pouredRef.current = [];
    setPoured([]);
    setHistory([]);
    setReaction((r) => ({ ...r, effect: null }));
    firedHeatRef.current = null;
  }, []);

  const stir = useCallback(() => setStirSeq((s) => s + 1), []);

  const current = useMemo(() => detectReaction(poured), [poured]);
  const composition = useMemo(() => compositionOf(poured), [poured]);
  const product = useMemo(() => findProduct(composition), [composition]);
  const ph = useMemo(() => estimatePh(poured), [poured]);
  const volumeMl = useMemo(() => estimateVolume(poured), [poured]);

  const liquidColor = useMemo(() => {
    if (poured.length === 0) return EMPTY_COLOR;
    if (current?.color) return current.color;
    if (product && PRODUCT_COLORS[product.id]) return PRODUCT_COLORS[product.id];
    return blendColors(poured.map((s) => ({ color: s.color, weight: 1 })));
  }, [poured, product, current]);

  const boiling = tempC >= 99.5 && volumeMl > 0;
  const kind = reaction.effect?.kind || null;

  return {
    poured,
    history,
    product,
    current,
    liquidColor,
    fill: Math.min(poured.length / CAPACITY, 1),
    overfilled: poured.length > CAPACITY,
    ph,
    volumeMl,
    tempC,
    boiling,
    heating,
    stirSeq,
    pourSeq: pour.seq,
    pourColor: pour.color,
    pourState: pour.state,
    reactionSeq: reaction.seq,
    reactionEffect: reaction.effect,
    bubbling: boiling || kind === "fizz" || current?.status === "pufaklanish" || current?.status === "gaz_ajralishi",
    smoking: kind === "smoke" || current?.status === "tutun" || current?.status === "gaz_ajralishi",
    fogging: current?.status === "tuman",
    add,
    playAiReaction,
    undo,
    clear,
    stir,
    toggleHeat,
  };
};
