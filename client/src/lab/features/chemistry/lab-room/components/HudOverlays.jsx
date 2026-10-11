import { useSnap } from "@/shared/utils/snapStore";
import { TEXT } from "../data/labRoomContent";

export const Crosshair = () => (
  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-6 -translate-x-1/2 -translate-y-1/2 select-none">
    {/* Precision reticle ring */}
    <div className="absolute inset-0 rounded-full border border-white/40 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
    {/* Center dot */}
    <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
  </div>
);

export const DragHint = () => (
  <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4 select-none animate-in fade-in duration-300">
    <span className="rounded-full bg-zinc-950/80 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl border border-zinc-800 shadow-xl">
      {TEXT.dragHint}
    </span>
  </div>
);

export const FpsBadge = ({ store }) => {
  const fps = useSnap(store);
  return (
    <div className="pointer-events-none absolute left-4 bottom-4 z-40 rounded-full bg-zinc-950/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-300 border border-zinc-800 backdrop-blur-xl shadow-lg select-none">
      <span className="text-emerald-400 font-bold">{fps}</span> {TEXT.fpsUnit}
    </div>
  );
};
