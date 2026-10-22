// Small UI kit for the biology lab console: mono section labels, part lists with
// search, selected-part cards, sliders, toggles and the loading/empty states.
import { useMemo, useState } from "react";
import { Search, X, Focus, ChevronRight, Activity, AlertTriangle } from "lucide-react";
import { useProgress } from "@react-three/drei";
import { cn } from "@/shared/utils/cn";

export const BioSection = ({ label, right, children, className }) => (
  <section className={cn("space-y-2", className)}>
    {(label || right) && (
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const BioStat = ({ label, value, accent }) => (
  <div className="rounded-lg border border-border bg-secondary/70 px-2.5 py-2 shadow-sm">
    <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={cn("mt-0.5 truncate text-sm font-bold tabular-nums text-foreground", accent && "text-emerald-600 dark:text-emerald-400 font-extrabold")}>{value}</div>
  </div>
);

export const BioButton = ({ active, icon, children, className, size = "sm", ...rest }) => (
  <button
    type="button"
    className={cn(
      "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors",
      size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
      active
        ? "border-primary/60 bg-primary/15 text-primary"
        : "border-border bg-background/60 text-foreground hover:border-primary/40 hover:bg-secondary",
      rest.disabled && "pointer-events-none opacity-40",
      className,
    )}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

// Segmented control: options = [{ id, label, icon? }]
export const BioSegment = ({ options, value, onChange, className }) => (
  <div className={cn("flex rounded-lg border border-border bg-background/60 p-0.5", className)}>
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        title={o.title}
        data-id={o.id}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          value === o.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {o.icon}
        <span className="truncate">{o.label}</span>
      </button>
    ))}
  </div>
);

export const BioRange = ({ label, value, min = 0, max = 100, step = 1, onChange, format = (v) => `${v}%`, color, disabled }) => (
  <label className={cn("block space-y-1", disabled && "pointer-events-none opacity-40")}>
    <span className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5">
        {color && <span className="size-2 rounded-full ring-1 ring-white/10" style={{ background: color }} />}
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{format(value)}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
    />
  </label>
);

export const BioToggle = ({ label, checked, onChange, hint }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
    <span>
      {label}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </span>
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
        checked ? "border-primary bg-primary/80" : "border-border bg-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  </label>
);

export const BioSearch = ({ value, onChange, placeholder = "Qidirish…", autoFocus }) => (
  <div className="relative">
    <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      aria-label={placeholder}
      className="h-9 w-full rounded-lg border border-border bg-background/70 pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Tozalash"
        className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
      >
        <X size={13} />
      </button>
    )}
  </div>
);

/**
 * Searchable part list. items = [{ id, name, sub?, color?, count? }]
 */
export const BioPartList = ({ items, activeId, onSelect, searchable = true, placeholder = "Qismni qidiring…", maxHeight = "max-h-64", emptyText = "Hech narsa topilmadi." }) => {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => `${it.name} ${it.sub || ""}`.toLowerCase().includes(term));
  }, [items, q]);
  return (
    <div className="space-y-2">
      {searchable && items.length > 6 && <BioSearch value={q} onChange={setQ} placeholder={placeholder} />}
      <ul className={cn("hidden-scrollbar space-y-0.5 overflow-y-auto rounded-lg border border-border bg-background/40 p-1", maxHeight)}>
        {list.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyText}</li>}
        {list.map((it) => {
          const on = it.id === activeId;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  on ? "bg-primary/15 text-primary font-semibold" : "text-foreground hover:bg-secondary",
                )}
              >
                <span
                  className="size-2 shrink-0 rounded-full ring-1 ring-white/10"
                  style={{ background: it.color || "hsl(var(--primary))" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{it.name}</span>
                  {it.sub && <span className="block truncate text-[11px] text-muted-foreground">{it.sub}</span>}
                </span>
                {it.count != null && <span className="font-mono text-[10px] text-muted-foreground">{it.count}</span>}
                <ChevronRight size={12} className={cn("shrink-0", on ? "text-primary" : "text-muted-foreground/60")} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Floating card for the selected part (top-right of the scene).
 */
export const BioDetailCard = ({ title, subtitle, eyebrow, color, description, stats, actions, onClose, onFocus, children, className }) => (
  <div className={cn("pointer-events-none absolute right-3 top-3 z-30 w-80 max-w-[calc(100%-1.5rem)]", className)}>
    <div className="pointer-events-auto animate-in fade-in slide-in-from-right-4 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur duration-200 text-card-foreground">
      <div className="flex items-start gap-2.5">
        {color && <span className="mt-1 size-3 shrink-0 rounded-full ring-2 ring-foreground/20" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />}
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</div>}
          <h3 className="text-base font-bold leading-tight text-foreground">{title}</h3>
          {subtitle && <div className="text-xs text-muted-foreground font-medium">{subtitle}</div>}
        </div>
        {onFocus && (
          <button type="button" onClick={onFocus} aria-label="Fokus" title="Kameraga olish" className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors">
            <Focus size={15} />
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Yopish" className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        )}
      </div>
      {description && <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 font-normal">{description}</p>}
      {stats && stats.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <BioStat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}
      {children}
      {actions && <div className="mt-3 flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  </div>
);

/**
 * Loading overlay for a 3D scene. Reads drei's loader progress by default;
 * pass `progress` (0-100) for custom loaders. Hides itself when done.
 */
export const BioLoading = ({ title = "3D model yuklanmoqda", subtitle, progress, error, onRetry }) => {
  const { active, progress: driveProgress } = useProgress();
  const custom = progress != null;
  const pct = Math.round(custom ? progress : driveProgress);
  const show = error || (custom ? pct < 100 : active);
  if (!show) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-background/70 p-6 backdrop-blur-sm">
      <div className="pointer-events-auto w-full max-w-xs rounded-xl border border-border bg-card/95 p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          {error ? (
            <AlertTriangle size={18} className="shrink-0 text-destructive" />
          ) : (
            <Activity size={18} className="shrink-0 animate-pulse text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{error ? "Yuklashda xatolik" : title}</div>
            <div className="truncate text-xs text-muted-foreground">{error || subtitle || "Birinchi ochilishda biroz vaqt oladi, keyin keshdan ochiladi."}</div>
          </div>
          <span className="font-mono text-xs tabular-nums text-primary">{error ? "" : `${pct}%`}</span>
        </div>
        {!error && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
            <i className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
        )}
        {error && onRetry && (
          <button type="button" onClick={onRetry} className="mt-3 w-full rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70">
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  );
};

export const BioEmpty = ({ icon, title, text }) => (
  <div className="grid h-full w-full place-items-center p-6 text-center">
    <div>
      <div className="mx-auto grid size-12 place-items-center rounded-xl border border-border bg-secondary text-primary">{icon}</div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      {text && <div className="mt-1 text-xs text-muted-foreground">{text}</div>}
    </div>
  </div>
);

// Small hint pill at the bottom-left of a scene.
export const BioSceneTag = ({ children, className }) => (
  <div className={cn("pointer-events-none absolute bottom-5 left-4 z-20 hidden lg:block", className)}>
    <span className="rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
      {children}
    </span>
  </div>
);
