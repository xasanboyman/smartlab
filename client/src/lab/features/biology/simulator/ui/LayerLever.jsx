// Vertical layer lever (top-left): drag the knob or click a tier to peel the body
// from skin (100%) down to the skeleton (0%).
import { useCallback, useRef, useState } from "react";
import { ChevronLeft, GripVertical, Layers } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { anatomyAudio } from "../engine/AnatomyAudio";
import { LEVER_TIERS } from "./constants";

export const activeTier = (p) =>
  p >= 86 ? LEVER_TIERS[0] : p >= 62 ? LEVER_TIERS[1] : p >= 38 ? LEVER_TIERS[2] : p >= 12 ? LEVER_TIERS[3] : LEVER_TIERS[4];

const LayerLever = ({ progress, onProgress, collapsed, onCollapse }) => {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const tier = activeTier(progress);
  const TierIcon = tier.icon;

  const onPointerDown = useCallback(
    (e) => {
      const track = trackRef.current;
      if (!track) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setDragging(true);
      anatomyAudio.playClick();
      const update = (clientY) => {
        const rect = track.getBoundingClientRect();
        const y = Math.max(rect.top, Math.min(rect.bottom, clientY));
        const p = Math.min(100, Math.max(0, Math.round(((rect.bottom - y) / rect.height) * 100)));
        onProgress(p);
        anatomyAudio.playSliderTick(350 + p * 4);
      };
      update(e.clientY);
      const move = (ev) => update(ev.clientY);
      const up = (ev) => {
        setDragging(false);
        try {
          e.currentTarget?.releasePointerCapture?.(ev.pointerId);
        } catch (_) {}
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [onProgress],
  );

  const setTier = (p) => {
    onProgress(p);
    anatomyAudio.playSliderTick(400 + p * 3);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          anatomyAudio.playClick();
          onCollapse(false);
        }}
        className="group flex items-center gap-2 rounded-2xl border border-border bg-card/90 p-3 text-primary shadow-2xl backdrop-blur transition-all hover:border-primary/50"
        title="Qatlamlar boshqaruvini ochish"
      >
        <Layers className="size-4" />
        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">{progress}%</span>
      </button>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-2 flex w-52 flex-col items-center gap-3 rounded-2xl border border-border bg-card/90 p-3.5 shadow-2xl backdrop-blur duration-200">
      <div className="flex w-full items-center justify-between border-b border-border px-1 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15">
            <TierIcon className="size-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold">{tier.label}</div>
            <div className="truncate text-[10px] text-muted-foreground">{tier.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs font-black text-primary">{progress}%</span>
          <button
            type="button"
            onClick={() => {
              anatomyAudio.playClick();
              onCollapse(true);
            }}
            className="ml-1 rounded-lg p-1 text-muted-foreground transition-all hover:text-foreground"
            title="Tutqichni yig'ish"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative flex h-64 w-full items-stretch justify-between py-1">
        <div className="flex h-full flex-1 flex-col justify-between py-0.5 pr-2 text-right">
          {LEVER_TIERS.map((t) => {
            const Icon = t.icon;
            const on = t === tier;
            return (
              <button
                key={t.p}
                type="button"
                onClick={() => setTier(t.p)}
                className={cn(
                  "group flex items-center justify-end gap-1.5 rounded-xl px-2 py-1 text-xs font-medium transition-all",
                  on ? "border border-primary/30 bg-primary/15 font-bold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                title={`${t.label} (${t.p}%)`}
              >
                <span className="truncate">{t.label}</span>
                <Icon className={cn("size-3.5 shrink-0 transition-transform", on ? "scale-110 text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              </button>
            );
          })}
        </div>

        <div ref={trackRef} onPointerDown={onPointerDown} className="relative flex h-full w-8 cursor-pointer touch-none justify-center py-1" title="Qatlamlar darajasini surish">
          <div className="relative h-full w-2.5 overflow-hidden rounded-full border border-border bg-secondary shadow-inner">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75" style={{ height: `${progress}%` }} />
          </div>
          {[0, 25, 50, 75, 100].map((n) => (
            <div key={n} className="pointer-events-none absolute left-1/2 h-[1.5px] w-4 -translate-x-1/2 bg-border" style={{ bottom: `${n}%` }} />
          ))}
          <div
            className={cn(
              "absolute left-1/2 flex size-7 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-emerald-400 bg-gradient-to-b from-white via-zinc-100 to-zinc-300 shadow-xl shadow-emerald-500/40 transition-[transform,box-shadow] active:cursor-grabbing",
              dragging ? "scale-125 ring-4 ring-emerald-400/30" : "hover:scale-110",
            )}
            style={{ bottom: `calc(${progress}% - 14px)` }}
          >
            <GripVertical className="size-3.5 text-zinc-700" />
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-1.5 border-t border-border pt-2 text-xs">
        {[
          { p: 0, label: "Skelet" },
          { p: 100, label: "To'liq teri" },
        ].map((q) => (
          <button
            key={q.p}
            type="button"
            onClick={() => setTier(q.p)}
            className={cn("flex-1 rounded-xl py-1.5 text-center font-semibold transition-all", progress === q.p ? "border border-primary/30 bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerLever;
