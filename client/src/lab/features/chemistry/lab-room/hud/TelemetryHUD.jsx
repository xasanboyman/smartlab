import { useMemo } from "react";
import { useSnap } from "@/shared/utils/snapStore";
import { cn } from "@/shared/utils/cn";
import { phOf, phPaperColor, phWord } from "../chemistry/acidity";
import { CONTAINERS } from "../sim/containers";
import { SUBSTANCE_BY_ID } from "../substances/catalog";
import { SUBSTANCE_PREFIX } from "../world/objectTypes";
import { displayName } from "../world/prompts";
import { formatNumber } from "../tools/describe";
import { Flame, Droplets, Thermometer, TestTube, Scale, Activity } from "lucide-react";

const substanceOf = (typeId) =>
  typeId?.startsWith(SUBSTANCE_PREFIX) ? SUBSTANCE_BY_ID[typeId.slice(SUBSTANCE_PREFIX.length)] ?? null : null;

/**
 * Floating real-time chemical & device telemetry HUD.
 * Renders live temperature, pH, volume, boiling/bubbling status, and mass readings
 * for the currently held item or inspected workbench equipment.
 */
const TelemetryHUD = ({ world, lab }) => {
  const { hotbar, activeSlot, objects } = useSnap(world.store);
  const { prompt } = useSnap(world.hud);

  const byId = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  // Target object is either the held item or the object currently under the crosshair
  const heldId = hotbar[activeSlot];
  const held = heldId ? byId.get(heldId) : null;
  const targetId = prompt?.targetId ?? held?.id;
  const target = targetId ? byId.get(targetId) : held;

  if (!target) return null;

  const mixture = lab.mixture(target.id);
  const visual = lab.visual(target.id);
  const device = lab.device(target.id);
  const substance = substanceOf(target.typeId);
  const container = CONTAINERS[target.typeId];

  const hasMixture = Boolean(mixture && (mixture.volumeMl > 0.05 || mixture.solids.length > 0));
  const hasDevice = Boolean(device && (device.readingC !== undefined || device.readingG !== undefined || device.plateC !== undefined || device.lit !== undefined));

  if (!hasMixture && !hasDevice && !substance) return null;

  const ph = mixture ? phOf(mixture) : null;
  const phColor = ph !== null ? phPaperColor(ph) : null;
  const phLabel = ph !== null ? phWord(ph) : null;

  const tempC = visual?.tempC ?? mixture?.tempC ?? device?.readingC ?? device?.plateC ?? null;
  const volumeMl = mixture?.volumeMl ?? (substance?.state === "liquid" ? (substance.container?.fillMl ?? 100) * (device?.remaining ?? 1) : null);
  const capacityMl = container?.capacityMl ?? substance?.container?.fillMl ?? null;

  const fx = visual?.fx ?? {};
  const isBoiling = (fx.boiling ?? 0) > 0.2;
  const isBubbling = (fx.bubbles?.rate ?? 0) > 0.02;
  const hasPrecipitate = (visual?.bed?.ml ?? 0) > 0.05 || (visual?.liquid?.turbidity ?? 0) > 0.4;
  const isFlaming = Boolean(fx.flame || device?.lit);

  // Temperature gradient styling
  const tempHue = tempC !== null ? Math.min(100, Math.max(0, (tempC - 20) / 1.2)) : 0;

  return (
    <aside
      aria-label="Kimyoviy telemetriya"
      className="pointer-events-none absolute right-4 top-16 z-20 flex w-72 flex-col gap-2.5 rounded-2xl border border-white/10 bg-zinc-950/80 p-3.5 text-white backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header: Title & Chemical Formula */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
            {target.typeId === "digital-scale" ? (
              <Scale className="size-4" />
            ) : target.typeId === "hot-plate" || isFlaming ? (
              <Flame className="size-4 text-amber-400 animate-pulse" />
            ) : (
              <TestTube className="size-4" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100">{displayName(target.typeId)}</h3>
            {substance?.formula && (
              <span className="font-mono text-[11px] font-semibold text-cyan-400">{substance.formula}</span>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-800">
          <Activity className="size-2.5 text-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Temperature */}
        {tempC !== null && (
          <div className="flex flex-col gap-1 rounded-xl bg-white/[0.04] p-2 border border-white/5">
            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <Thermometer className="size-3 text-amber-400" />
              Harorat
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-base font-bold tracking-tight"
                style={{
                  color: tempC > 60 ? "#f87171" : tempC > 35 ? "#fbbf24" : "#38bdf8",
                }}
              >
                {Math.round(tempC)}
              </span>
              <span className="text-[10px] text-zinc-400">°C</span>
            </div>
            {/* Heat Progress bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(8, tempHue))}%`,
                  backgroundColor: tempC > 70 ? "#ef4444" : tempC > 40 ? "#f59e0b" : "#3b82f6",
                }}
              />
            </div>
          </div>
        )}

        {/* pH Acidity Meter */}
        {ph !== null && (
          <div className="flex flex-col gap-1 rounded-xl bg-white/[0.04] p-2 border border-white/5">
            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <Droplets className="size-3 text-cyan-400" />
              Muhit (pH)
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full border border-white/30 shadow-sm"
                style={{ backgroundColor: phColor }}
              />
              <span className="text-base font-bold tracking-tight text-zinc-100">{formatNumber(ph, 1)}</span>
              <span className="truncate text-[9px] text-zinc-400">({phLabel})</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (ph / 14) * 100)}%`,
                  backgroundColor: phColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Volume */}
        {volumeMl !== null && (
          <div className="flex flex-col gap-0.5 rounded-xl bg-white/[0.04] p-2 border border-white/5">
            <span className="text-[10px] font-medium text-zinc-400">Hajm</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-zinc-100">{formatNumber(Math.round(volumeMl * 10) / 10)}</span>
              {capacityMl && <span className="text-[10px] text-zinc-400">/ {capacityMl} ml</span>}
            </div>
          </div>
        )}

        {/* Digital Scale Mass */}
        {device?.readingG !== undefined && (
          <div className="flex flex-col gap-0.5 rounded-xl bg-white/[0.04] p-2 border border-white/5">
            <span className="text-[10px] font-medium text-zinc-400">Massa</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm font-bold text-emerald-400">{formatNumber(device.readingG, 2)}</span>
              <span className="text-[10px] text-zinc-400">g</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Physical Reaction Status Badges */}
      {(isBoiling || isBubbling || hasPrecipitate || isFlaming) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
          {isBoiling && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30 animate-pulse">
              🔥 Qaynash jarayoni
            </span>
          )}
          {isBubbling && (
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-400/30 animate-pulse">
              🫧 Gaz ajralmoqda
            </span>
          )}
          {hasPrecipitate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-400/30">
              ⚗️ Cho'kma tushdi
            </span>
          )}
          {isFlaming && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-400/30">
              🔥 Olov faol
            </span>
          )}
        </div>
      )}
    </aside>
  );
};

export default TelemetryHUD;
