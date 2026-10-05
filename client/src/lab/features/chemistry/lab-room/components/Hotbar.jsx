import { useSnap } from "@/shared/utils/snapStore";
import { cn } from "@/shared/utils/cn";
import { displayName } from "../world/prompts";

const Slot = ({ index, object, url, active, highlight, onPointerDown }) => (
  <div
    data-slot={index}
    onPointerDown={object && onPointerDown ? (e) => onPointerDown(e, index, object) : undefined}
    className={cn(
      "relative grid size-16 place-items-center rounded-xl border transition-all duration-150 select-none",
      active
        ? "border-emerald-400/90 bg-emerald-500/20 shadow-[0_0_18px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400/40 scale-105 z-10"
        : "border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60",
      highlight && "border-cyan-400 bg-cyan-400/25 ring-2 ring-cyan-400/50",
      object && onPointerDown && "cursor-grab active:cursor-grabbing",
    )}
  >
    <span className={cn(
      "absolute left-1.5 top-1 font-mono text-[10px] font-bold",
      active ? "text-emerald-300" : "text-zinc-500",
    )}>
      {index + 1}
    </span>
    {object && url && (
      <img
        src={url}
        alt=""
        draggable={false}
        className="size-13 object-contain drop-shadow-md transition-transform"
      />
    )}
    {object && !url && (
      <span className="size-6 animate-pulse rounded-full bg-emerald-400/25 border border-emerald-400/40" />
    )}
  </div>
);

const Hotbar = ({ world, thumbs, highlightSlot = null, onSlotPointerDown }) => {
  const { hotbar, activeSlot, objects } = useSnap(world.store);
  const { urls } = useSnap(thumbs.store);
  const byId = new Map(objects.map((o) => [o.id, o]));
  const activeObject = byId.get(hotbar[activeSlot]);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-5 z-30 flex flex-col items-center gap-2 select-none">
      {activeObject && (
        <div className="flex items-center gap-2 rounded-full bg-zinc-950/90 px-3.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 backdrop-blur-xl shadow-xl">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{displayName(activeObject.typeId)}</span>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-2xl bg-zinc-950/80 p-2 backdrop-blur-2xl border border-zinc-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
        {hotbar.map((id, index) => {
          const object = id ? byId.get(id) : null;
          return (
            <Slot
              key={index}
              index={index}
              object={object}
              url={object ? urls[object.typeId] : null}
              active={index === activeSlot}
              highlight={index === highlightSlot}
              onPointerDown={onSlotPointerDown}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Hotbar;
