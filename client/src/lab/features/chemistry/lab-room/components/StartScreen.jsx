import { useProgress } from "@react-three/drei";
import { Link } from "react-router-dom";
import { ArrowLeft, Box, Check, Glasses, Play, Sparkles } from "lucide-react";
import Button from "@/shared/components/ui/button/Button";
import { cn } from "@/shared/utils/cn";
import { BACK_LABEL, BACK_TO, SUBTITLE, TEXT, TITLE } from "../data/labRoomContent";
import KeyCap from "./KeyCap";
import QualityPicker from "./QualityPicker";

const COMPACT_CONTROLS = [
  { keys: ["W", "A", "S", "D"], label: "Yurish" },
  { keys: ["Shift"], label: "Tez yugurish" },
  { keys: ["Sichqoncha"], label: "Atrofga qarash" },
  { keys: ["1–5"], label: "Slot tanlash" },
  { keys: ["Chap tugma"], label: "Olish / qo'yish" },
  { keys: ["Bosib turing"], label: "Quyish / qizdirish" },
  { keys: ["G"], label: "Qo'ldagini tashlash" },
  { keys: ["E"], label: "Moddalar shkafi" },
];

const LoadingProgress = ({ ready }) => {
  const { progress } = useProgress();
  const percent = ready ? 100 : Math.min(99, Math.round(progress));
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex justify-between text-xs font-medium text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", ready ? "bg-emerald-400 animate-none" : "bg-cyan-400 animate-pulse")} />
          {ready ? "Xona va barcha moddalar tayyor" : `${TEXT.loading}...`}
        </span>
        <span className="tabular-nums font-mono text-zinc-300">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80 p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-[width] duration-300 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const StartScreen = ({
  ready,
  tier,
  recommended,
  placeholder,
  lockHint,
  vrMode = false,
  onToggleVr,
  onQuality,
  onEnter,
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-[#06080e]/90 via-[#070a12]/80 to-[#04060a]/95 backdrop-blur-md text-white select-none">
    <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-6 sm:p-7 flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/60 pb-3">
        <Link
          to={BACK_TO}
          className="group inline-flex items-center gap-2 rounded-full bg-zinc-900/90 px-3.5 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 transition hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
          {BACK_LABEL}
        </Link>

        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            SmartLab 3D
          </span>
        </div>

        {onToggleVr && (
          <button
            type="button"
            onClick={onToggleVr}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
              vrMode
                ? "bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800",
            )}
          >
            <Glasses className="size-3.5" />
            <span>{vrMode ? "VR Cardboard: Faol" : "VR Cardboard"}</span>
          </button>
        )}
      </div>

      {/* Hero Title & Description */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {TITLE}
          </h1>
          {vrMode && (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 tracking-wider uppercase">
              VR Stereo
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
          {SUBTITLE}
        </p>
      </div>

      {/* Controls Grid (2 columns, 4 rows = compact & clean) */}
      <section className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
          <span>{TEXT.controls}</span>
          <span className="text-[10px] lowercase text-zinc-400 font-normal">Esc — menyu</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {COMPACT_CONTROLS.map((control) => (
            <div key={control.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex flex-wrap gap-1 shrink-0">
                {control.keys.map((key) => (
                  <KeyCap key={key}>{key}</KeyCap>
                ))}
              </span>
              <span className="text-zinc-300 text-right truncate">{control.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quality & Mode Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QualityPicker tier={tier} recommended={recommended} onChange={onQuality} />

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            Ko'rish rejimi
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleVr ? () => vrMode && onToggleVr() : undefined}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3.5 py-2.5 text-left transition-all",
                !vrMode
                  ? "border-emerald-400 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                  : "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Box className="size-3.5" />
                Monitor 3D
              </span>
              <span className="text-[10px] text-zinc-400">Kompyuter ekrani</span>
            </button>

            <button
              type="button"
              onClick={onToggleVr ? () => !vrMode && onToggleVr() : undefined}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3.5 py-2.5 text-left transition-all",
                vrMode
                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                  : "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <Glasses className="size-3.5" />
                VR Cardboard
              </span>
              <span className="text-[10px] text-zinc-400">Stereo 3D split</span>
            </button>
          </div>
        </section>
      </div>

      {/* Action Footer */}
      <div className="space-y-3 pt-1">
        <LoadingProgress ready={ready} />
        {placeholder && ready && <p className="text-xs text-amber-300/90">{TEXT.placeholder}</p>}
        {lockHint && <p className="text-xs text-amber-300 text-center">{TEXT.lockHint}</p>}
        
        <button
          type="button"
          disabled={!ready}
          onClick={onEnter}
          className={cn(
            "group relative flex h-12 w-full items-center justify-center gap-2.5 rounded-xl font-semibold text-sm transition-all shadow-xl cursor-pointer",
            ready
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:brightness-110 active:scale-[0.99] shadow-emerald-500/25"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
          )}
        >
          {ready ? (
            <>
              <Sparkles className="size-4 transition-transform group-hover:scale-110" />
              <span>{vrMode ? "VR Laboratoriyasiga kirish" : "Laboratoriyaga kirish"}</span>
              <Play className="size-3.5 fill-current ml-1" />
            </>
          ) : (
            <span>{TEXT.loading}...</span>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default StartScreen;
