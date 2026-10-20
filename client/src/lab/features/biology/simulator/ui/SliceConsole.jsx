// 3D slicing console (lazy chunk): quick presets, region, plane/direction, depth,
// layer X-ray, rotation and the advanced tilt/offset controls. Reads one `slice`
// object and writes back through onChange(patch).
import { ChevronDown, Crosshair, Eye, Maximize2, Minimize2, PanelBottom, PanelLeft, PanelRight, RotateCcw, Scan, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { anatomyAudio } from "../engine/AnatomyAudio";
import { ACTIVE_AMBER, ACTIVE_AMBER_SOFT, ACTIVE_SKY, AXES, BTN, BTN_SM, CAMERA_REGIONS, DIRECTIONS, MONO_LABEL, SLICE_PRESETS } from "./constants";

const Chip = ({ active, activeClass = ACTIVE_AMBER, className, children, ...rest }) => (
  <button type="button" className={cn(BTN_SM, active && activeClass, className)} {...rest}>
    {children}
  </button>
);

const Section = ({ icon, title, right, children, boxed }) => (
  <div className={cn("space-y-1.5", boxed && "rounded-xl border border-border bg-secondary/40 p-2.5")}>
    <div className={cn("flex items-center justify-between", MONO_LABEL)}>
      <span className="flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      {right}
    </div>
    {children}
  </div>
);

export const SliceBody = ({ slice, onChange, layer, onLayer, onApplyPreset, onFocusRegion }) => {
  const click = () => anatomyAudio.playClick();
  const set = (patch) => {
    click();
    onChange(patch);
  };
  const regionLabel = CAMERA_REGIONS.find((r) => r.id === slice.region)?.label;

  return (
    <div className="space-y-3">
      <Section icon={<Sparkles className="size-3.5 text-amber-500" />} title="Tezkor kesimlar">
        <div className="grid grid-cols-2 gap-1.5">
          {SLICE_PRESETS.map((p) => (
            <Chip
              key={p.key}
              active={slice.region === p.match.region && slice.axis === p.match.axis}
              onClick={() => onApplyPreset(p.key)}
              title={p.title}
              className="justify-start text-left"
            >
              <span className="truncate">{p.label}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section icon={<Crosshair className="size-3.5 text-sky-400" />} title="1. Anatomik hudud" right={<span className="font-mono text-[10px] normal-case tracking-normal">{regionLabel}</span>}>
        <div className="grid grid-cols-3 gap-1.5">
          {CAMERA_REGIONS.map((reg) => {
            const Icon = reg.icon;
            return (
              <Chip
                key={reg.id}
                active={slice.region === reg.id}
                activeClass={ACTIVE_AMBER_SOFT}
                onClick={() => {
                  set({ region: reg.id });
                  onFocusRegion(reg.id);
                }}
                className="justify-center"
              >
                <Icon className="mr-1 size-3.5 shrink-0" />
                <span className="truncate">{reg.label}</span>
              </Chip>
            );
          })}
        </div>
      </Section>

      <Section icon={<Scan className="size-3.5 text-amber-400" />} title="2. Kesim tekisligi & yo'nalish">
        <div className="grid grid-cols-3 gap-1">
          {AXES.map((ax) => (
            <Chip key={ax.id} active={slice.axis === ax.id} activeClass={ACTIVE_AMBER_SOFT} onClick={() => set({ axis: ax.id, direction: ax.defaultDir })} className="justify-center">
              {ax.label}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(DIRECTIONS[slice.axis] || DIRECTIONS.vertical_z).map((d) => (
            <Chip key={d.id} active={slice.direction === d.id} activeClass={ACTIVE_SKY} onClick={() => set({ direction: d.id })} className="flex-1 justify-center">
              {d.label}
            </Chip>
          ))}
          <Chip active={slice.flipped} onClick={() => set({ flipped: !slice.flipped })} title="Kesim tomonini 180° ag'darish" className="shrink-0">
            <RotateCcw className={cn("size-3.5", slice.flipped && "rotate-180")} />
            <span className="ml-1">Flip</span>
          </Chip>
        </div>
      </Section>

      <Section
        boxed
        title="3. Kesim chuqurligi"
        right={<span className="font-mono text-sm font-bold normal-case tracking-normal text-amber-500">{slice.position}%</span>}
      >
        <div className="flex items-center justify-end gap-1">
          {[-5, -1, 1, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ position: Math.min(100, Math.max(0, slice.position + d)) })}
              className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-secondary/70"
            >
              {d > 0 ? `+${d}` : d}%
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={slice.position}
          onChange={(e) => onChange({ position: parseInt(e.target.value, 10) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-amber-500"
        />
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {[0, 25, 40, 50, 75, 100].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => set({ position: v })}
              className={cn("rounded-lg px-2 py-0.5 font-mono text-[10px] font-medium transition-all", slice.position === v ? "bg-amber-500 font-bold text-zinc-950" : "bg-secondary text-muted-foreground hover:text-foreground")}
            >
              {v}%
            </button>
          ))}
        </div>
      </Section>

      <Section boxed icon={<Eye className="size-3.5 text-sky-500" />} title="Qatlamlar rentgen (shaffoflik)">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold">Tashqi teri</span>
            <span className="font-mono text-[10px] font-bold text-amber-500">
              {layer.skinXRay ? "Shaffof (35%)" : layer.progress < 75 ? "Yashirilgan" : "100%"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Chip active={!layer.skinXRay && layer.progress >= 75} onClick={() => onLayer({ skinXRay: false, progress: 100 })} className="justify-center text-[10px]">To'liq teri</Chip>
            <Chip active={layer.skinXRay} activeClass="border-sky-400 bg-sky-500 text-zinc-950 font-bold" onClick={() => onLayer({ skinXRay: true })} className="justify-center text-[10px]">Shaffof</Chip>
            <Chip active={!layer.skinXRay && layer.progress < 75} onClick={() => onLayer({ skinXRay: false, progress: 70 })} className="justify-center text-[10px]">Terisiz</Chip>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold">Mushaklar</span>
            <span className="font-mono text-[10px] font-bold text-sky-500">
              {layer.musclesXRay ? "Shaffof (35%)" : layer.progress < 45 ? "Yashirilgan" : "100%"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Chip active={!layer.musclesXRay && layer.progress >= 45} onClick={() => onLayer({ musclesXRay: false, progress: layer.progress < 50 ? 75 : layer.progress })} className="justify-center text-[10px]">To'liq mushak</Chip>
            <Chip active={layer.musclesXRay} activeClass="border-sky-400 bg-sky-500 text-zinc-950 font-bold" onClick={() => onLayer({ musclesXRay: true })} className="justify-center text-[10px]">Shaffof</Chip>
            <Chip active={!layer.musclesXRay && layer.progress < 45} onClick={() => onLayer({ musclesXRay: false, progress: 40 })} className="justify-center text-[10px]">Mushaksiz</Chip>
          </div>
        </div>
      </Section>

      <Section
        boxed
        title="4. 360° aylanish"
        right={<span className="font-mono text-sm font-bold normal-case tracking-normal text-sky-500">{slice.angle}°</span>}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {[0, 45, 90, 180, 270, 360].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => set({ angle: deg })}
              className={cn("rounded-lg px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-all", slice.angle === deg ? "bg-sky-500 font-bold text-zinc-950" : "bg-secondary text-muted-foreground hover:text-foreground")}
            >
              {deg}°
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={slice.angle}
          onChange={(e) => onChange({ angle: parseInt(e.target.value, 10) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-sky-400"
        />
      </Section>

      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => set({ showAdvanced: !slice.showAdvanced })}
          className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all", slice.showAdvanced ? ACTIVE_AMBER_SOFT : BTN)}
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            Kengaytirilgan: X-Y & qiyalik
          </span>
          <ChevronDown className={cn("size-3.5 transition-transform", slice.showAdvanced && "rotate-180")} />
        </button>
        {slice.showAdvanced && (
          <div className="animate-in fade-in mt-2 space-y-2.5 rounded-xl border border-border bg-card p-3 duration-200">
            {[
              { key: "tilt", label: "Qiyalik (tilt)", min: -45, max: 45, unit: "°", accent: "accent-amber-400" },
              { key: "offsetX", label: "X o'qi (chap ⟵ ⟶ o'ng)", min: -100, max: 100, unit: "%", accent: "accent-sky-400" },
              { key: "offsetY", label: "Y o'qi (past ⟵ ⟶ yuqori)", min: -100, max: 100, unit: "%", accent: "accent-emerald-400" },
            ].map((r) => (
              <div key={r.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono">{slice[r.key] > 0 ? `+${slice[r.key]}` : slice[r.key]}{r.unit}</span>
                </div>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  value={slice[r.key]}
                  onChange={(e) => onChange({ [r.key]: parseInt(e.target.value, 10) })}
                  className={cn("h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary", r.accent)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SliceHeader = ({ slice, onChange, onClose }) => {
  const regionLabel = CAMERA_REGIONS.find((r) => r.id === slice.region)?.label || "To'liq";
  const axisLabel = AXES.find((a) => a.id === slice.axis)?.label || "Koronal";
  const dockBtn = (dock, Icon, title) => (
    <button
      type="button"
      onClick={() => {
        anatomyAudio.playClick();
        onChange({ dock });
      }}
      className={cn("rounded p-1 transition-all", slice.dock === dock ? "bg-amber-500 text-zinc-950" : "text-muted-foreground hover:text-foreground")}
      title={title}
    >
      <Icon className="size-3.5" />
    </button>
  );
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary/40 p-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-amber-500/30 bg-amber-500/15">
          <Scan className="size-4 text-amber-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">3D kesim</span>
            <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-500">{slice.position}%</span>
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {regionLabel} • {axisLabel}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/70 p-0.5" title="Joylashuv">
          {dockBtn("left", PanelLeft, "Chap tomonga joylashtirish")}
          {dockBtn("bottom", PanelBottom, "Pastga joylashtirish")}
          {dockBtn("right", PanelRight, "O'ng tomonga joylashtirish")}
        </div>
        <button
          type="button"
          onClick={() => {
            anatomyAudio.playClick();
            onChange({ position: 40, angle: 0, tilt: 0, offsetX: 0, offsetY: 0, flipped: false });
          }}
          className={cn(BTN, "p-1.5 text-muted-foreground")}
          title="Parametrlarni tiklash"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            anatomyAudio.playClick();
            onChange({ minimized: true });
          }}
          className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          title="Kichraytirish"
        >
          <Minimize2 className="size-3.5" />
        </button>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-500/15 hover:text-red-400" title="Kesimni yopish">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

export const SliceMinimizedPill = ({ slice, onOpen, className }) => (
  <div className={cn("pointer-events-auto absolute z-20", className)}>
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-2.5 rounded-full border border-amber-500/60 bg-card/95 px-4 py-2 text-xs font-semibold tracking-wide text-amber-500 shadow-2xl backdrop-blur transition-all hover:scale-105 active:scale-95"
    >
      <span className="size-2 animate-ping rounded-full bg-amber-400" />
      <Scan className="size-4 transition-transform group-hover:rotate-90" />
      <span>
        3D kesim: <strong className="text-foreground">{slice.position}%</strong> • {CAMERA_REGIONS.find((r) => r.id === slice.region)?.label || "To'liq"}
      </span>
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium">
        <Maximize2 className="size-3" /> Ochish
      </span>
    </button>
  </div>
);

// Default export = the docked panel (header + scrollable body).
const SliceConsole = ({ slice, onChange, onClose, layer, onLayer, onApplyPreset, onFocusRegion, className }) => (
  <aside className={cn("flex h-full w-full flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-card/95 shadow-2xl backdrop-blur", className)}>
    <SliceHeader slice={slice} onChange={onChange} onClose={onClose} />
    <div className="hidden-scrollbar flex-1 overflow-y-auto p-3.5">
      <SliceBody slice={slice} onChange={onChange} layer={layer} onLayer={onLayer} onApplyPreset={onApplyPreset} onFocusRegion={onFocusRegion} />
    </div>
  </aside>
);

export default SliceConsole;
