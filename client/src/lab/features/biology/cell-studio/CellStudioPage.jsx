// "Hujayra studiyasi": 7 cell types in one console - 3D model (lazy chunk), organelle
// list, landmarks tour for the muscle model, microscope strip, comparison and the
// AI-tutor panel. All UI state lives in one object.
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Box, Brain, Camera, ChevronLeft, ChevronRight, ChevronUp,
  CircleDot, Eye, EyeOff, Gauge, Heart, Maximize2, MessageCircle, Microscope,
  Moon, Play, Plus, RotateCcw, Scissors, Sparkles, Square, Star, Sun, Tag, Target, X,
} from "lucide-react";
import useObjectState from "@/shared/hooks/useObjectState";
import { cn } from "@/shared/utils/cn";
import { MUSCLE_ANNOTATIONS } from "./data/muscleAnnotations";
import { cells, getCellById } from "./data/cells";
import { BIO_THEME_VARS, BIO_THEME_VARS_LIGHT } from "../shared/bioTheme";
import { applyThemeToDom, getStoredTheme } from "@/shared/hooks/useAppTheme";
import { assetUrl, preloadWhenIdle } from "../shared/loaders";
import { BioButton, BioLoading, BioPartList, BioSegment, BioStat } from "../shared/BioUi";

// The 3D scene (three + drei + model code) is its own chunk; the console shell paints first.
const CellScene = lazy(() => import("./CellScene"));

const MODES = [
  { id: "mesh", label: "Model", icon: <Box size={13} /> },
  { id: "focus", label: "Fokus", icon: <CircleDot size={13} /> },
];

const initial = getCellById("muscle");
if (initial.modelAsset) preloadWhenIdle(assetUrl(initial.modelAsset.url));

// Small preview thumbnail for a cell (image if available, else a coloured orb).
const MiniCell = ({ cell, size = 40 }) => {
  const src = cell.renderImage?.url || cell.modelAsset?.previewUrl;
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl"
      style={{ width: size, height: size, background: `${cell.accent}22` }}
    >
      {src ? (
        <img src={assetUrl(src)} alt="" aria-hidden loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="h-2/3 w-2/3 rounded-full" style={{ background: cell.accent }} />
      )}
    </span>
  );
};

const Panel = ({ title, icon, action, children, className = "", bodyClass = "p-4" }) => (
  <section className={cn("rounded-xl border border-border bg-card", className)}>
    {title && (
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {icon}
          {title}
        </span>
        {action}
      </div>
    )}
    <div className={bodyClass}>{children}</div>
  </section>
);

const buildTutorPrompts = (cell, organelle) => [
  `${organelle.name} ${cell.name}ning tirik qolishiga qanday yordam berishini tushuntir.`,
  `${cell.name} va ${getCellById(cell.comparison).name} o'rtasidagi vizual farqlar bo'yicha meni sinovdan o'tkaz.`,
  `3D modelda ${organelle.name}ni topishda menga yo'l ko'rsat.`,
  `${cell.name} tuzilishini bitta klinik kuzatuv bilan bog'la (tibbiy maslahat bermay).`,
];

const LandmarkBar = ({ landmarks, activeNum, isOverview, onSelect, showLabels, onToggleLabels, autopilot, onToggleAutopilot, onOverview, menuOpen, setMenuOpen }) => {
  const current = landmarks.find((l) => l.num === activeNum) || landmarks[0];
  const step = (dir) => (e) => {
    e.stopPropagation();
    const n = isOverview ? (dir > 0 ? 1 : landmarks.length) : ((activeNum - 1 + dir + landmarks.length) % landmarks.length) + 1;
    const lm = landmarks.find((l) => l.num === n);
    if (lm) onSelect(lm.num, lm.id);
  };
  const item = "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-secondary";

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 -translate-x-1/2 select-none">
      <div className="relative flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-2xl backdrop-blur">
        <button type="button" onClick={step(-1)} title="Oldingi belgi" className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ChevronLeft size={16} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-secondary"
          >
            {isOverview ? (
              <>
                <RotateCcw size={12} className="text-primary" />
                <span className="max-w-[130px] truncate sm:max-w-[200px]">Umumiy ko'rinish</span>
              </>
            ) : (
              <>
                <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-[11px] font-black text-primary-foreground">{current.num}</span>
                <span className="max-w-[130px] truncate sm:max-w-[200px]">{current.nameUz || current.name}</span>
              </>
            )}
            <ChevronUp size={13} className={cn("text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in zoom-in-95 absolute bottom-full left-1/2 mb-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-card p-2 text-xs shadow-2xl duration-150">
              <div className="space-y-0.5">
                <button type="button" onClick={() => { onToggleLabels(); setMenuOpen(false); }} className={item}>
                  {showLabels ? <EyeOff size={14} className="text-primary" /> : <Eye size={14} className="text-primary" />}
                  <span>{showLabels ? "Belgilarni yashirish" : "Belgilarni ko'rsatish"}</span>
                </button>
                <button type="button" onClick={() => { onToggleAutopilot(); setMenuOpen(false); }} className={item}>
                  {autopilot ? <Square size={14} className="fill-red-400 text-red-400" /> : <Play size={14} className="fill-primary text-primary" />}
                  <span>{autopilot ? "Avtopilotni to'xtatish" : "Avtopilot sayohatini boshlash"}</span>
                </button>
                <button type="button" onClick={() => { onOverview?.(); setMenuOpen(false); }} className={item}>
                  <RotateCcw size={14} className="text-primary" />
                  <span>Umumiy ko'rinish</span>
                </button>
              </div>
              <div className="my-1.5 border-t border-border" />
              <div className="hidden-scrollbar max-h-56 space-y-0.5 overflow-y-auto">
                {landmarks.map((lm) => {
                  const on = lm.num === current.num && !isOverview;
                  return (
                    <button key={lm.num} type="button" onClick={() => { onSelect(lm.num, lm.id); setMenuOpen(false); }} className={cn(item, on && "bg-primary/15 text-primary")}>
                      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold", on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>{lm.num}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate leading-tight">{lm.nameUz || lm.name}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">{lm.descUz || lm.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={step(1)} title="Keyingi belgi" className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const CellStudioPage = () => {
  const canvasContainerRef = useRef(null);
  const s = useObjectState({
    selectedCellId: initial.id,
    activeOrganelle: initial.defaultOrganelle,
    activeLandmarkNum: 0,
    autopilot: false,
    studioTheme: getStoredTheme(),
    isOverview: true,
    menuOpen: false,
    viewMode: "mesh",
    crossSection: false,
    autoRotate: false,
    showLabels: true,
    resetKey: 0,
    favorites: new Set([initial.id]),
    viewedCells: new Set([initial.id]),
    viewedOrganelleKeys: new Set([`${initial.id}:${initial.defaultOrganelle}`]),
    comparisonOpen: false,
    tutorPrompt: `3D modelda ${initial.organelles[0].name}ni topishda menga yo'l ko'rsat.`,
    toast: null,
  });
  const toastTimer = useRef(null);

  const cell = useMemo(() => getCellById(s.selectedCellId), [s.selectedCellId]);
  const organelle = cell.organelles.find((o) => o.id === s.activeOrganelle) ?? cell.organelles[0];
  const compared = getCellById(cell.comparison);
  const totalOrganelles = useMemo(() => cells.reduce((t, c) => t + c.organelles.length, 0), []);
  const mastery = useMemo(() => {
    const cc = s.viewedCells.size / cells.length;
    const oc = s.viewedOrganelleKeys.size / totalOrganelles;
    return Math.round((cc * 0.42 + oc * 0.58) * 100);
  }, [s.viewedCells, s.viewedOrganelleKeys, totalOrganelles]);
  const isMuscle = cell.id === "muscle";

  // Reset organelle + close comparison when the cell changes.
  useEffect(() => {
    s.setFields({
      activeOrganelle: cell.defaultOrganelle,
      activeLandmarkNum: 0,
      autopilot: false,
      isOverview: true,
      menuOpen: false,
      comparisonOpen: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell.id]);

  // Autopilot loop for the skeletal-muscle guided tour (reads the live landmark via a ref).
  const landmarkRef = useRef(s.activeLandmarkNum);
  landmarkRef.current = s.activeLandmarkNum;
  useEffect(() => {
    if (!s.autopilot || !isMuscle) return;
    const timer = window.setInterval(() => {
      const nextNum = (landmarkRef.current % MUSCLE_ANNOTATIONS.length) + 1;
      const lm = MUSCLE_ANNOTATIONS.find((a) => a.num === nextNum);
      s.setFields({ activeLandmarkNum: nextNum, activeOrganelle: lm?.id || s.activeOrganelle, isOverview: false });
    }, 4500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.autopilot, isMuscle]);

  // Track coverage for the mastery meter.
  useEffect(() => {
    s.setFields({
      viewedCells: new Set(s.viewedCells).add(cell.id),
      viewedOrganelleKeys: new Set(s.viewedOrganelleKeys).add(`${cell.id}:${s.activeOrganelle}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell.id, s.activeOrganelle]);

  const showToast = (message) => {
    s.setField("toast", message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => s.setField("toast", null), 2600);
  };

  const toggleFavorite = (id) => {
    const next = new Set(s.favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    s.setField("favorites", next);
  };

  const selectOrganelle = (id) => {
    const lm = isMuscle ? MUSCLE_ANNOTATIONS.find((a) => a.id === id) : null;
    s.setFields({ activeOrganelle: id, activeLandmarkNum: lm ? lm.num : s.activeLandmarkNum, isOverview: false });
  };
  const selectLandmark = (num, id) => s.setFields({ activeLandmarkNum: num, activeOrganelle: id, isOverview: false });

  const organelleItems = useMemo(() => cell.organelles.map((o) => ({ id: o.id, name: o.name, sub: o.subtitle, color: o.color })), [cell]);

  const stageClass = s.studioTheme === "light"
    ? "border-slate-300 bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#e2e8f0_55%,#cbd5e1_100%)]"
    : "border-border bg-[radial-gradient(ellipse_at_50%_45%,#16202d_0%,#0b1018_60%,#06090f_100%)]";

  return (
    <div
      className={cn(
        "bio-console flex h-dvh flex-col overflow-hidden bg-background text-foreground transition-colors duration-300",
        s.studioTheme !== "light" && "dark",
      )}
      style={s.studioTheme === "light" ? BIO_THEME_VARS_LIGHT : BIO_THEME_VARS}
    >
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Link to="/biology" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Biologiya
        </Link>
        <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
          <Microscope size={15} />
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Biologiya · Sitologiya</div>
          <h1 className="truncate text-sm font-semibold leading-tight">Hujayra studiyasi</h1>
        </div>
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
          {cells.length} hujayra · {totalOrganelles} organoid
        </span>
      </header>

      {/* body */}
      <div className="grid flex-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        {/* left rail */}
        <aside className="space-y-3">
          <Panel title="Hujayra turlari" icon={<Star size={12} />} bodyClass="p-2">
            <div className="space-y-1">
              {cells.map((c) => {
                const selected = c.id === cell.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => s.setField("selectedCellId", c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition",
                      selected ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary/60",
                    )}
                  >
                    <MiniCell cell={c} />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-semibold">{c.name}</strong>
                      <span className="block truncate text-[11px] text-muted-foreground">{c.type}</span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`${c.name} sevimli`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(c.id);
                      }}
                      className={s.favorites.has(c.id) ? "text-amber-400" : "text-muted-foreground/30 hover:text-muted-foreground"}
                    >
                      <Star size={15} fill="currentColor" />
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Organoidlar" icon={<Sparkles size={12} />} action={<span className="font-mono text-[10px] text-muted-foreground">{cell.organelles.length} ta</span>} bodyClass="p-2">
            <BioPartList items={organelleItems} activeId={s.activeOrganelle} onSelect={selectOrganelle} maxHeight="max-h-72" placeholder="Organoidni qidiring…" />
          </Panel>
        </aside>

        {/* center */}
        <main className="space-y-3">
          <Panel className="overflow-hidden" bodyClass="p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-tight">{cell.name}</h2>
                <p className="text-xs text-muted-foreground">{cell.type}{cell.modelAsset?.sourceLabel ? ` · ${cell.modelAsset.sourceLabel}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <BioSegment options={MODES} value={s.viewMode} onChange={(v) => s.setField("viewMode", v)} className="w-44" />
                <BioButton active={s.crossSection} icon={<Scissors size={13} />} onClick={() => s.setField("crossSection", !s.crossSection)}>
                  Kesim
                </BioButton>
              </div>
            </div>

            <div
              ref={canvasContainerRef}
              onClick={() => s.menuOpen && s.setField("menuOpen", false)}
              className={cn("relative h-[56vh] min-h-[420px] overflow-hidden rounded-xl border transition-colors", stageClass)}
            >
              <Suspense fallback={null}>
                <CellScene
                  cell={cell}
                  activeOrganelle={s.activeOrganelle}
                  activeLandmarkNum={s.activeLandmarkNum}
                  viewMode={s.viewMode}
                  crossSection={s.crossSection}
                  autoRotate={s.autoRotate}
                  showLabels={s.showLabels}
                  isOverview={s.isOverview}
                  studioTheme={s.studioTheme}
                  onSelectOrganelle={selectOrganelle}
                  onSelectLandmark={selectLandmark}
                  resetKey={s.resetKey}
                />
              </Suspense>
              <BioLoading title={`${cell.name} modeli yuklanmoqda`} subtitle={cell.modelAsset?.sourceLabel || "Protsedural model"} />

              {/* Floating corner quick actions */}
              <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = s.studioTheme === "light" ? "dark" : "light";
                    s.setField("studioTheme", next);
                    applyThemeToDom(next);
                  }}
                  title={s.studioTheme === "light" ? "Qorong'i studiya" : "Yorug' studiya"}
                  className="grid size-8 place-items-center rounded-lg border border-border bg-background/80 text-foreground shadow backdrop-blur hover:text-primary transition-colors"
                >
                  {s.studioTheme === "light" ? <Moon size={15} /> : <Sun size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!document.fullscreenElement) canvasContainerRef.current?.requestFullscreen?.();
                    else document.exitFullscreen?.();
                  }}
                  title="To'liq ekran"
                  className="grid size-8 place-items-center rounded-lg border border-border bg-background/80 text-foreground shadow backdrop-blur hover:text-primary"
                >
                  <Maximize2 size={15} />
                </button>
              </div>

              <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2">
                <span className="rounded-full border border-border bg-background/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                  {organelle.name}
                </span>
              </div>

              {isMuscle && (
                <LandmarkBar
                  landmarks={MUSCLE_ANNOTATIONS}
                  activeNum={s.activeLandmarkNum}
                  isOverview={s.isOverview}
                  showLabels={s.showLabels}
                  onToggleLabels={() => s.setField("showLabels", !s.showLabels)}
                  autopilot={s.autopilot}
                  onToggleAutopilot={() => s.setField("autopilot", !s.autopilot)}
                  onOverview={() => s.setFields({ isOverview: true, activeLandmarkNum: 0 })}
                  menuOpen={s.menuOpen}
                  setMenuOpen={(val) => s.setField("menuOpen", val)}
                  onSelect={selectLandmark}
                />
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <BioButton active={s.showLabels} icon={<Tag size={13} />} onClick={() => s.setField("showLabels", !s.showLabels)}>
                Yorliqlar
              </BioButton>
              <BioButton active={s.autoRotate} icon={<RotateCcw size={13} className={s.autoRotate ? "animate-spin" : ""} />} onClick={() => s.setField("autoRotate", !s.autoRotate)} disabled={isMuscle}>
                Aylantirish
              </BioButton>
              {isMuscle && (
                <BioButton
                  active={s.autopilot}
                  icon={s.autopilot ? <Square size={13} className="fill-current text-red-400" /> : <Play size={13} className="fill-current text-primary" />}
                  onClick={() => s.setField("autopilot", !s.autopilot)}
                >
                  {s.autopilot ? "Avtopilotni to'xtatish" : "Avtopilot sayohati"}
                </BioButton>
              )}
              <BioButton active={s.viewMode === "focus"} icon={<EyeOff size={13} />} onClick={() => s.setField("viewMode", s.viewMode === "focus" ? "mesh" : "focus")}>
                Boshqasini yashirish
              </BioButton>
              <BioButton
                icon={<RotateCcw size={13} />}
                onClick={() => {
                  s.setFields({ resetKey: s.resetKey + 1, isOverview: true, activeLandmarkNum: 0 });
                  showToast("Ko'rinish tiklandi.");
                }}
              >
                Ko'rinishni tiklash
              </BioButton>
              <BioButton icon={<Camera size={13} />} onClick={() => showToast("Skrinshot funksiyasi keyinroq qo'shiladi.")}>
                Skrinshot
              </BioButton>
            </div>
          </Panel>

          {/* bottom: microscope + compare */}
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Mikroskop ko'rinishi" icon={<Microscope size={12} />}>
              <div className="flex flex-wrap gap-2">
                {cell.microscope.map((image) => (
                  <button
                    key={image.label}
                    type="button"
                    onClick={() => showToast(`${image.label} tanlandi.`)}
                    className="flex min-w-[92px] flex-1 flex-col items-center gap-2 rounded-lg border border-border p-2 transition hover:border-primary/40"
                  >
                    <span className="h-10 w-full rounded-md" style={{ background: `radial-gradient(circle at 40% 40%, ${image.tone}, ${image.tone}88)` }} />
                    <strong className="text-center text-[11px] font-medium leading-tight">{image.label}</strong>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => showToast("Rasm yuklash rejalashtirilgan qadam.")}
                  className="flex min-w-[92px] flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-2 text-muted-foreground hover:border-primary/40"
                >
                  <Plus size={20} />
                  <strong className="text-[11px] font-medium">Rasm qo'shish</strong>
                </button>
              </div>
            </Panel>

            <Panel title="Hujayralarni solishtirish" icon={<ArrowRight size={12} />}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MiniCell cell={cell} size={36} />
                  <span className="text-xs">
                    <strong className="block font-semibold">{cell.name}</strong>
                    <em className="not-italic text-muted-foreground">Siz shu yerdasiz</em>
                  </span>
                </div>
                <b className="font-mono text-[10px] text-muted-foreground">VS</b>
                <div className="flex items-center gap-2">
                  <span className="text-right text-xs">
                    <strong className="block font-semibold">{compared.name}</strong>
                    <em className="not-italic text-muted-foreground">{compared.type}</em>
                  </span>
                  <MiniCell cell={compared} size={36} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => s.setField("comparisonOpen", true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Solishtirish oynasini ochish <ArrowRight size={16} />
              </button>
            </Panel>
          </div>
        </main>

        {/* right rail */}
        <aside className="space-y-3">
          <Panel
            title="Organoid tafsilotlari"
            action={
              <button type="button" onClick={() => toggleFavorite(cell.id)} aria-label="Sevimli">
                <Heart size={16} fill={s.favorites.has(cell.id) ? "currentColor" : "none"} className="text-rose-500" />
              </button>
            }
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="size-9 rounded-lg" style={{ background: organelle.color, boxShadow: `0 0 18px ${organelle.color}55` }} />
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{organelle.name}</h3>
                <p className="text-xs text-muted-foreground">{organelle.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {organelle.attributes.map((a) => (
                <BioStat key={a.label} label={a.label} value={a.value} />
              ))}
            </div>
          </Panel>

          <Panel title="Biologik izohlar">
            <p className="text-sm text-muted-foreground">{organelle.note}</p>
            <div className="mt-3 rounded-lg bg-secondary/60 p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Klinik kontekst</span>
              <p className="mt-1 text-sm">{cell.clinicalContext}</p>
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>Qiziqarli fakt: {organelle.fact}</span>
            </div>
          </Panel>

          <Panel title="AI o'qituvchi" icon={<Brain size={12} />}>
            <div className="rounded-lg bg-secondary/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gauge size={16} className="text-primary" /> O'zlashtirish <strong className="ml-auto font-mono">{mastery}%</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${mastery}%` }} />
              </div>
              <small className="mt-2 block text-[11px] text-muted-foreground">
                {s.viewedCells.size}/{cells.length} hujayra ko'rildi · {s.viewedOrganelleKeys.size}/{totalOrganelles} organoid tekshirildi
              </small>
            </div>

            <div className="mt-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><Target size={12} /> Joriy dars maqsadi</span>
              <p className="mt-1 text-sm">
                <strong>{organelle.name}</strong>ni toping, vazifasini tushuntiring, so'ng {compared.name}dagi mos tuzilma bilan solishtiring.
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-border p-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><MessageCircle size={12} /> AI uchun so'rov</span>
              <p className="mt-1 text-sm">{s.tutorPrompt}</p>
            </div>

            <div className="mt-3 space-y-1.5">
              {buildTutorPrompts(cell, organelle).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    s.setField("tutorPrompt", prompt);
                    showToast("AI so'rovi tayyorlandi.");
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs transition hover:border-primary/40 hover:bg-secondary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Qayerda uchraydi">
            <div className="mb-2 h-14 rounded-lg" style={{ background: `linear-gradient(135deg, ${cell.accent}33, ${cell.accent})` }} />
            <h4 className="font-semibold">{cell.occurrence.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{cell.occurrence.body}</p>
          </Panel>
        </aside>
      </div>

      {/* comparison modal */}
      {s.comparisonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && s.setField("comparisonOpen", false)}
        >
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Solishtirish</div>
                <h3 className="text-lg font-semibold">{cell.name} — {compared.name}</h3>
              </div>
              <button type="button" onClick={() => s.setField("comparisonOpen", false)} className="rounded-lg border border-border p-1.5 hover:bg-secondary">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[cell, compared].map((item) => {
                const org = item.organelles.find((o) => o.id === item.defaultOrganelle) ?? item.organelles[0];
                return (
                  <section key={item.id} className="rounded-lg border border-border p-4 text-center">
                    <div className="flex justify-center"><MiniCell cell={item} size={56} /></div>
                    <h4 className="mt-2 font-semibold">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                    <dl className="mt-3 space-y-1.5 text-left text-sm">
                      <Row label="Asosiy fokus" value={org.name} />
                      <Row label="Asosiy izoh" value={org.subtitle} />
                      <Row label="Uchraydi" value={item.occurrence.title} />
                      <Row label="Organoidlar" value={`${item.organelles.length} ta`} />
                    </dl>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {s.toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg">
          {s.toast}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium">{value}</dd>
  </div>
);

export default CellStudioPage;
