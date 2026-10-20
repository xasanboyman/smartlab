// Simulator header: back link, mode switcher and the studio tool buttons.
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, HeartPulse, MapPin, Maximize2, Minimize2, Moon, RotateCcw, RotateCw, Scissors, Sparkles, Sun, User, Volume2, VolumeX, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import { LIGHTING_PRESETS } from "../engine/HtmlCanvasManager";
import { anatomyAudio } from "../engine/AnatomyAudio";
import { BTN } from "./constants";

const BioEngineModal = lazy(() => import("./BioEngineModal"));

const MODES = [
  { id: "explore", label: "3D anatomiya", icon: User },
  { id: "slice", label: "Virtual skalpel", icon: Scissors },
  { id: "pins", label: "Anatomik xarita", icon: MapPin },
];

const Tool = ({ active, activeClass = "border-primary/60 bg-primary/15 text-primary", title, onClick, children, className }) => (
  <button
    type="button"
    onClick={() => {
      anatomyAudio.playClick();
      onClick?.();
    }}
    className={cn(BTN, "flex shrink-0 items-center gap-1.5 p-2 text-xs font-semibold shadow-sm", active && activeClass, className)}
    title={title}
  >
    {children}
  </button>
);

const TopBar = ({ ui, setUi, slice, bio, setBio, canvas, onMode, onToggleTheme, onToggleSlice, onToggleTurntable, onToggleMute, onFullscreen }) => {
  const isDay = ui.themeMode === "day";
  return (
    <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 shadow-lg backdrop-blur-2xl transition-colors duration-300">
      <div className="flex items-center gap-3">
        <Link
          to="/biology"
          onClick={() => anatomyAudio.playClick()}
          className={cn(BTN, "group p-2 text-muted-foreground hover:text-foreground")}
          title="Biologiya laboratoriyasiga qaytish"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>
        <NexusLogo size="sm" showSubtitle={false} />
        <div className="hidden items-center gap-1.5 border-l border-border pl-3 text-xs text-muted-foreground lg:flex">
          <span>Biologiya</span>
          <span className="opacity-50">/</span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Inson anatomiyasi 3D</span>
        </div>
      </div>

      <div className="hidden items-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1 shadow-inner md:flex">
        {MODES.map((m) => {
          const Icon = m.icon;
          const on = ui.viewMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                anatomyAudio.playModeSwitch();
                onMode(m.id);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                on ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto">
        <Tool onClick={onToggleTheme} active={isDay} activeClass="border-amber-300 bg-amber-100/80 text-amber-900" title={isDay ? "Tungi studiya (T)" : "Kunduzgi studiya (T)"} className="px-3 py-1.5 font-bold">
          {isDay ? <Sun className="size-3.5 text-amber-600" /> : <Moon className="size-3.5 text-amber-400" />}
          <span className="hidden sm:inline">{isDay ? "Kunduzgi" : "Tungi"}</span>
        </Tool>

        <Tool onClick={onToggleSlice} active={slice.enabled} activeClass="border-amber-400 bg-amber-500 text-zinc-950 shadow-amber-500/30" title="3D kesim tekisligini qo'shish (C)" className="px-3 py-1.5 font-bold">
          <Scissors className="size-3.5" />
          <span className="hidden sm:inline">{slice.enabled ? "Kesim faol" : "Kesim qo'shish"}</span>
        </Tool>

        <Tool onClick={onToggleTurntable} active={ui.autoRotate} activeClass="border-cyan-500/60 bg-cyan-500/20 text-cyan-500 ring-2 ring-cyan-500/20" title="360° avto-aylantirish (Space)">
          <RotateCw className={cn("size-4", ui.autoRotate && "animate-spin")} />
          <span className="hidden text-xs xl:inline">360°</span>
        </Tool>

        <div className="relative">
          <Tool onClick={() => setUi({ bioOpen: !ui.bioOpen })} active={bio.active} activeClass="border-rose-500/40 bg-rose-500/15 text-rose-500" title="Biologik jarayonlar (B)" className="px-2.5 py-1.5">
            <HeartPulse className={cn("size-4", bio.active && bio.heart ? "animate-pulse text-rose-500" : "text-muted-foreground")} />
            <span className="font-mono text-xs font-bold">{bio.active ? `${bio.bpm} BPM` : "O'chiq"}</span>
          </Tool>
          {ui.bioOpen && (
            <Suspense fallback={null}>
              <BioEngineModal bio={bio} onChange={setBio} onClose={() => setUi({ bioOpen: false })} />
            </Suspense>
          )}
        </div>

        <Tool onClick={() => setUi({ pinsEnabled: !ui.pinsEnabled })} active={ui.pinsEnabled} title="3D anatomik xaritani ko'rsatish/yashirish (P)">
          <MapPin className="size-4" />
        </Tool>

        <div className="relative">
          <Tool
            onClick={() => setUi({ lightingOpen: !ui.lightingOpen })}
            active={ui.lightingPreset !== "medical"}
            activeClass={ui.lightingPreset === "cyber" ? "border-indigo-500/60 bg-indigo-500/25 text-indigo-400" : "border-sky-500/60 bg-sky-500/25 text-sky-400"}
            title="Studiya yoritish rejimlari"
          >
            {ui.lightingPreset === "cyber" ? <Zap className="size-4 text-cyan-400" /> : ui.lightingPreset === "xray" ? <Eye className="size-4 text-sky-400" /> : <Sun className="size-4 text-amber-500" />}
          </Tool>
          {ui.lightingOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute right-0 top-12 z-50 w-48 space-y-1 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur duration-150">
              <div className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Yoritish rejimi</div>
              {Object.values(LIGHTING_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    anatomyAudio.playClick();
                    setUi({ lightingPreset: preset.id, lightingOpen: false });
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    ui.lightingPreset === preset.id ? "border border-primary/40 bg-primary/15 text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span>{preset.name}</span>
                  {ui.lightingPreset === preset.id && <span className="size-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <Tool onClick={onToggleMute} active={!ui.muted} title={ui.muted ? "Ovozni yoqish (M)" : "Ovozni o'chirish (M)"}>
          {ui.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Tool>

        <Tool onClick={() => canvas.current?.zoomIn?.(0.8)} title="Yaqinlashtirish (+)" className="hidden sm:flex">
          <ZoomIn className="size-4" />
        </Tool>
        <Tool onClick={() => canvas.current?.zoomOut?.(1.25)} title="Uzoqlashtirish (-)" className="hidden sm:flex">
          <ZoomOut className="size-4" />
        </Tool>
        <Tool
          onClick={() => {
            anatomyAudio.playCameraSnap();
            canvas.current?.recenter();
            setUi({ activeRegion: "all" });
          }}
          title="Kamerani markazlash (R)"
        >
          <RotateCcw className="size-4" />
        </Tool>
        <Tool onClick={onFullscreen} title="To'liq ekran (F)">
          {ui.fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Tool>
        <Tool onClick={() => setUi({ detailOpen: !ui.detailOpen })} active={ui.detailOpen} title="Anatomik ma'lumotlar panelini ochish / yopish">
          <Sparkles className="size-4" />
        </Tool>
      </div>
    </header>
  );
};

export default TopBar;
