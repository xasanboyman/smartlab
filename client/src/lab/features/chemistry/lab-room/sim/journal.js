import { createSnapStore } from "@/shared/utils/snapStore";

const LIMIT = 80;

export const createJournal = () => createSnapStore({ entries: [], seq: 0 });

// One line of the experiment log; `kind` picks the icon and colour in the notebook (pour, add, reaction, warning, break, device, measure, note).
export const logJournal = (lab, { kind = "note", text, detail = null, equation = null }) => {
  if (!text) return;
  const current = lab.journal.get();
  const seq = current.seq + 1;
  const entries = [...current.entries, { id: seq, kind, text, detail, equation, at: lab.now() }].slice(-LIMIT);
  lab.journal.set({ entries, seq });
};

export const formatLabTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
