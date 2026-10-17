import { useSnap } from "@/shared/utils/snapStore";
import { cn } from "@/shared/utils/cn";
import { displayName } from "../world/prompts";
import { SUBSTANCE_BY_ID } from "../substances/catalog";
import { SUBSTANCE_PREFIX } from "../world/objectTypes";
import { ArrowDownToLine, PackageOpen, Sparkles } from "lucide-react";

const substanceOf = (typeId) =>
  typeId?.startsWith(SUBSTANCE_PREFIX) ? SUBSTANCE_BY_ID[typeId.slice(SUBSTANCE_PREFIX.length)] ?? null : null;

const Slot = ({ index, object, url, active, highlight, onPointerDown, onSelect }) => {
  const substance = object ? substanceOf(object.typeId) : null;

  return (
    <button
      type="button"
      data-slot={index}
      onClick={() => onSelect?.(index)}
      onPointerDown={object && onPointerDown ? (e) => onPointerDown(e, index, object) : undefined}
      aria-label={`Slot ${index + 1}: ${object ? displayName(object.typeId) : "bo'sh"}`}
      className={cn(
        "group relative flex h-14 w-14 min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-2xl border transition-all duration-200 select-none cursor-pointer outline-none",
        active
          ? "border-emerald-400/90 bg-emerald-500/20 shadow-[0_0_24px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400/40 scale-105 z-10"
          : "border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/80 hover:scale-102",
        highlight && "border-cyan-400 bg-cyan-400/25 ring-2 ring-cyan-400/50",
        object && onPointerDown && "cursor-grab active:cursor-grabbing",
      )}
    >
      {/* Number Badge */}
      <span
        className={cn(
          "absolute left-2 top-1.5 font-mono text-[10px] font-bold tracking-wider",
          active ? "text-emerald-300" : "text-zinc-500 group-hover:text-zinc-300",
        )}
      >
        {index + 1}
      </span>

      {/* Item Thumbnail */}
      {object && url && (
        <img
          src={url}
          alt=""
          draggable={false}
          className="size-11 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-110"
        />
      )}

      {/* Loading placeholder */}
      {object && !url && (
        <span className="size-5 animate-pulse rounded-full bg-emerald-400/25 border border-emerald-400/40" />
      )}

      {/* Chemical formula badge */}
      {substance?.formula && (
        <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-bold text-cyan-400/90 drop-shadow">
          {substance.formula}
        </span>
      )}

      {/* Empty slot indicator */}
      {!object && (
        <span className="size-1.5 rounded-full bg-zinc-800 transition-colors group-hover:bg-zinc-600" />
      )}
    </button>
  );
};

const Hotbar = ({
  world,
  thumbs,
  highlightSlot = null,
  onSlotPointerDown,
  onDrop,
  onOpenCabinet,
}) => {
  const { hotbar, activeSlot, objects } = useSnap(world.store);
  const { urls } = useSnap(thumbs.store);
  const byId = new Map(objects.map((o) => [o.id, o]));
  const activeObject = byId.get(hotbar[activeSlot]);
  const activeSubstance = activeObject ? substanceOf(activeObject.typeId) : null;

  const handleSelectSlot = (index) => {
    world.selectSlot(index);
  };

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-4 z-30 flex flex-col items-center gap-2 select-none px-4">
      {/* Active Held Object Status Banner */}
      {activeObject ? (
        <div className="flex items-center gap-2.5 rounded-full bg-zinc-950/90 px-4 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-500/30 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-100">{displayName(activeObject.typeId)}</span>
          {activeSubstance?.formula && (
            <span className="font-mono text-xs font-bold text-cyan-400">({activeSubstance.formula})</span>
          )}
          <span className="text-zinc-500">·</span>
          <span className="text-[11px] text-zinc-300">
            [Chap tugma] Ishlatish · [G] Tashlash
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-zinc-950/70 px-3.5 py-1 text-[11px] text-zinc-400 border border-zinc-800/60 backdrop-blur-xl">
          <Sparkles className="size-3 text-zinc-500" />
          <span>Qo'l bo'sh — jihoz yoki reaktiv olish uchun stolni bosing yoki [E] shkafni oching</span>
        </div>
      )}

      {/* Hotbar Workbench Dock */}
      <div className="flex items-center gap-2 rounded-3xl bg-zinc-950/85 p-2 backdrop-blur-2xl border border-zinc-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        {/* Quick Drop Button */}
        {onDrop && (
          <button
            type="button"
            onClick={onDrop}
            disabled={!activeObject}
            title="Qo'ldagi buyumni stolga/yerga tashlash (G)"
            className={cn(
              "flex h-14 w-14 min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border text-[10px] font-semibold transition cursor-pointer",
              activeObject
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50"
                : "border-zinc-800/40 bg-zinc-900/30 text-zinc-600 cursor-not-allowed",
            )}
          >
            <ArrowDownToLine className="size-4" />
            <span>Tashlash</span>
          </button>
        )}

        {/* 5 Slots */}
        <div className="flex items-center gap-1.5">
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
                onSelect={handleSelectSlot}
              />
            );
          })}
        </div>

        {/* Quick Open Cabinet Button */}
        {onOpenCabinet && (
          <button
            type="button"
            onClick={onOpenCabinet}
            title="Reaktivlar va jihozlar shkafini ochish (E)"
            className="flex h-14 w-14 min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-[10px] font-semibold transition cursor-pointer"
          >
            <PackageOpen className="size-4" />
            <span>Shkaf (E)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Hotbar;
