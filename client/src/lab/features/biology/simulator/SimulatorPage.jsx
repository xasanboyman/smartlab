// "Inson anatomiyasi 3D": native three.js body (23 textured organs) with a layer
// lever, slicing console, spatial pins, physiology engine and narration.
// UI state is grouped in three objects (ui / slice / bio); heavy panels load lazily.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/shared/utils/cn";
import useObjectState from "@/shared/hooks/useObjectState";
import BendCard from "@/shared/components/3d/html-in-canvas/BendCard";
import NativeAnatomyCanvas from "./NativeAnatomyCanvas";
import { ANATOMY_TOPICS, getAnatomyTopic } from "./engine/anatomyData";
import { AnatomyNarrator } from "./engine/HtmlCanvasManager";
import { anatomyAudio } from "./engine/AnatomyAudio";
import { BIO_THEME_VARS, BIO_THEME_VARS_LIGHT } from "../shared/bioTheme";
import TopBar from "./ui/TopBar";
import LayerLever from "./ui/LayerLever";
import DetailsPanel from "./ui/DetailsPanel";
import { CAMERA_REGIONS, SLICE_PRESET_VALUES } from "./ui/constants";

const SliceConsole = lazy(() => import("./ui/SliceConsole"));
const SliceMinimizedPill = lazy(() => import("./ui/SliceConsole").then((m) => ({ default: m.SliceMinimizedPill })));
const HtmlInCanvasOverlay = lazy(() => import("./HtmlInCanvasOverlay").then((m) => ({ default: m.HtmlInCanvasOverlay })));

const readTheme = () => {
  try {
    return localStorage.getItem("smartlab_anatomy_theme") || "night";
  } catch (_) {
    return "night";
  }
};

const UI_INITIAL = {
  viewMode: "explore", // "explore" | "slice" | "pins"
  topicId: "all",
  query: "",
  detailOpen: typeof window !== "undefined" && window.innerWidth >= 1200,
  detailTab: "tuzilish", // "tuzilish" | "azolar" | "asboblar"
  fullscreen: false,
  activeRegion: "all",
  themeMode: readTheme(), // "day" | "night"
  skinXRay: false,
  musclesXRay: false,
  layerProgress: 100, // 0 = skeleton only, 100 = full skin
  leverCollapsed: false,
  autoRotate: false,
  lightingPreset: "medical",
  lightingOpen: false,
  pinsEnabled: false,
  activePinId: null,
  bioOpen: false,
  speaking: false,
  muted: anatomyAudio.isMuted,
  rightTab: "slice", // "slice" | "details" (when the slice console is docked right)
  camera: null,
};

const SLICE_INITIAL = {
  enabled: false,
  axis: "vertical_z",
  direction: "front_to_back",
  region: "all",
  position: 40, // 40% exposes ribcage, heart and lungs right away
  angle: 0,
  tilt: 0,
  offsetX: 0,
  offsetY: 0,
  flipped: false,
  showAdvanced: false,
  minimized: false,
  dock: "right", // "right" | "bottom" | "left"
};

const BIO_INITIAL = { active: true, bpm: 72, heart: true, breathing: true, acoustic: false };

// Layer opacities from the lever position (0-100), with optional X-ray caps.
const layerOpacitiesFor = (p, skinXRay, musclesXRay) => {
  const o = { skeleton: 1, organs: 1, vessels: 1, muscles: 1, skin: 1 };
  if (p <= 25) Object.assign(o, { organs: p / 25, vessels: 0, muscles: 0, skin: 0 });
  else if (p <= 50) Object.assign(o, { vessels: (p - 25) / 25, muscles: 0, skin: 0 });
  else if (p <= 75) Object.assign(o, { muscles: (p - 50) / 25, skin: 0 });
  else o.skin = (p - 75) / 25;
  if (skinXRay && o.skin > 0.35) o.skin = 0.35;
  if (musclesXRay && o.muscles > 0.35) o.muscles = 0.35;
  return o;
};

const LAYER_VISIBILITIES = { skeleton: true, organs: true, vessels: true, muscles: true, skin: true };

const SimulatorPage = () => {
  const uiState = useObjectState(UI_INITIAL);
  const sliceState = useObjectState(SLICE_INITIAL);
  const bioState = useObjectState(BIO_INITIAL);
  const ui = uiState.state;
  const slice = sliceState.state;
  const bio = bioState.state;
  const setUi = uiState.setFields;
  const setSlice = sliceState.setFields;
  const setBio = bioState.setFields;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const narratorRef = useRef(null);
  const latest = useRef({ ui, slice });
  latest.current = { ui, slice };

  useEffect(() => {
    narratorRef.current = new AnatomyNarrator();
    return () => narratorRef.current?.stop();
  }, []);

  // Capture the camera instance once the canvas is mounted (pins overlay projects through it).
  useEffect(() => {
    let timer;
    const check = () => {
      const cam = canvasRef.current?.getCamera?.();
      if (cam) setUi({ camera: cam });
      else timer = setTimeout(check, 150);
    };
    check();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layerOpacities = useMemo(() => layerOpacitiesFor(ui.layerProgress, ui.skinXRay, ui.musclesXRay), [ui.layerProgress, ui.skinXRay, ui.musclesXRay]);
  const activeTopic = useMemo(() => getAnatomyTopic(ui.topicId), [ui.topicId]);
  const sliceConfig = useMemo(
    () => ({
      enabled: slice.enabled,
      axis: slice.axis,
      direction: slice.direction,
      region: slice.region,
      position: slice.position,
      angle: slice.angle,
      tilt: slice.tilt,
      offsetX: slice.offsetX,
      offsetY: slice.offsetY,
      flipped: slice.flipped,
    }),
    [slice.enabled, slice.axis, slice.direction, slice.region, slice.position, slice.angle, slice.tilt, slice.offsetX, slice.offsetY, slice.flipped],
  );

  // ---- handlers (stable: read live state through `latest`) ----
  const setLayer = useCallback((p) => {
    setUi({ layerProgress: p, topicId: "all" });
  }, [setUi]);

  const toggleNarration = useCallback(() => {
    const { ui: u } = latest.current;
    if (u.speaking) {
      narratorRef.current?.stop();
      setUi({ speaking: false });
    } else {
      anatomyAudio.playClick();
      const t = getAnatomyTopic(u.topicId);
      narratorRef.current?.speak(`${t.title}. ${t.desc}. Qiziqarli fakt: ${t.funFact}`, () => setUi({ speaking: false }));
      setUi({ speaking: true });
    }
  }, [setUi]);

  // Stop narration when the topic changes.
  useEffect(() => {
    narratorRef.current?.stop();
    setUi({ speaking: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.topicId]);

  const toggleMute = useCallback(() => {
    const muted = anatomyAudio.toggleMute();
    setUi({ muted });
    if (!muted) anatomyAudio.playClick();
  }, [setUi]);

  const toggleTurntable = useCallback(() => {
    const next = !latest.current.ui.autoRotate;
    if (next) anatomyAudio.startTurntableHum();
    else anatomyAudio.stopTurntableHum();
    anatomyAudio.playClick();
    setUi({ autoRotate: next });
  }, [setUi]);

  const toggleFullscreen = useCallback(() => {
    anatomyAudio.playClick();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setUi({ fullscreen: true });
    } else {
      document.exitFullscreen?.();
      setUi({ fullscreen: false });
    }
  }, [setUi]);

  const toggleTheme = useCallback(() => {
    anatomyAudio.playClick();
    const next = latest.current.ui.themeMode === "day" ? "night" : "day";
    try {
      localStorage.setItem("smartlab_anatomy_theme", next);
    } catch (_) {}
    setUi({ themeMode: next });
  }, [setUi]);

  const focusRegion = useCallback((regionId) => {
    setUi({ activeRegion: regionId, topicId: "all" });
    setSlice({ region: regionId, position: regionId === "all" ? 40 : 50 });
    anatomyAudio.playCameraSnap();
    canvasRef.current?.focusRegion(regionId);
  }, [setUi, setSlice]);

  const openSlice = useCallback(() => {
    const { ui: u } = latest.current;
    setSlice({ enabled: true, minimized: false });
    setUi({ viewMode: "slice", topicId: "all", skinXRay: false, rightTab: "slice", layerProgress: u.layerProgress < 85 ? 100 : u.layerProgress });
  }, [setSlice, setUi]);

  const toggleSlice = useCallback(() => {
    anatomyAudio.playSliceWhoosh();
    if (latest.current.slice.enabled) setSlice({ enabled: false });
    else openSlice();
  }, [openSlice, setSlice]);

  const applySlicePreset = useCallback((key) => {
    anatomyAudio.playSliceWhoosh();
    const values = SLICE_PRESET_VALUES[key];
    if (!values) return;
    openSlice();
    setSlice(values);
    focusRegion(values.region);
  }, [openSlice, setSlice, focusRegion]);

  const setMode = useCallback((mode) => {
    const { ui: u } = latest.current;
    const resetLayer = u.layerProgress < 85 ? 100 : u.layerProgress;
    if (mode === "explore") setUi({ viewMode: mode, topicId: "all", skinXRay: false, layerProgress: resetLayer });
    else if (mode === "slice") openSlice();
    else setUi({ viewMode: mode, topicId: "all", pinsEnabled: true });
  }, [setUi, openSlice]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const { ui: u } = latest.current;
      switch (e.code) {
        case "Space": e.preventDefault(); toggleTurntable(); break;
        case "KeyC": toggleSlice(); break;
        case "KeyR": anatomyAudio.playCameraSnap(); canvasRef.current?.recenter(); setUi({ activeRegion: "all" }); break;
        case "Equal": case "NumpadAdd": anatomyAudio.playClick(); canvasRef.current?.zoomIn?.(0.8); break;
        case "Minus": case "NumpadSubtract": anatomyAudio.playClick(); canvasRef.current?.zoomOut?.(1.25); break;
        case "KeyT": toggleTheme(); break;
        case "KeyX": anatomyAudio.playClick(); setUi({ skinXRay: !u.skinXRay }); break;
        case "KeyF": toggleFullscreen(); break;
        case "KeyM": toggleMute(); break;
        case "KeyP": anatomyAudio.playClick(); setUi({ pinsEnabled: !u.pinsEnabled }); break;
        case "KeyB": anatomyAudio.playClick(); setUi({ bioOpen: !u.bioOpen }); break;
        case "Digit1": setLayer(0); break;
        case "Digit2": setLayer(25); break;
        case "Digit3": setLayer(50); break;
        case "Digit4": setLayer(75); break;
        case "Digit5": setLayer(100); break;
        default: return;
      }
      anatomyAudio.playSliderTick?.(500);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTurntable, toggleSlice, toggleTheme, toggleFullscreen, toggleMute, setLayer, setUi]);

  // 3D mesh click: fly to the hit point and open the matching topic.
  const handlePick = useCallback((meshName, hitPoint) => {
    anatomyAudio.playClick();
    if (hitPoint) canvasRef.current?.focusPoint?.(hitPoint, 38);
    else canvasRef.current?.focusMesh?.(meshName);

    const name = meshName.toLowerCase();
    const specific = ANATOMY_TOPICS.filter((t) => !["all", "muscles", "skin", "organs"].includes(t.id)).find((t) =>
      t.keywords?.some((kw) => name.includes(kw.toLowerCase())),
    );
    let topic = specific;
    if (!topic && hitPoint) {
      const y = hitPoint.y;
      const pick = (...ids) => ANATOMY_TOPICS.find((t) => ids.includes(t.id));
      topic = y > 62 ? pick("brain", "skull") : y > 30 ? pick("heart", "lungs") : y > 10 ? pick("liver", "digestive") : y > -15 ? pick("pelvis", "muscles") : pick("skeleton", "muscles");
    }
    if (!topic) topic = ANATOMY_TOPICS.find((t) => t.keywords?.some((kw) => name.includes(kw.toLowerCase())));
    if (topic) setUi({ topicId: topic.id, detailOpen: true });
  }, [setUi]);

  const handleSelectPin = useCallback((pin) => {
    setUi({ activePinId: pin.id });
    canvasRef.current?.focusPosition(pin.pos, 38);
    const topic = ANATOMY_TOPICS.find((t) => t.keywords?.some((kw) => pin.id.includes(kw) || pin.label.toLowerCase().includes(kw)));
    if (topic) setUi({ topicId: topic.id, detailOpen: true });
  }, [setUi]);

  const isDay = ui.themeMode === "day";
  const rightSliceDocked = slice.enabled && !slice.minimized && slice.dock === "right";
  const showRightPanel = rightSliceDocked || ui.detailOpen;
  const layerForSlice = { progress: ui.layerProgress, skinXRay: ui.skinXRay, musclesXRay: ui.musclesXRay };
  const onLayerPatch = (patch) => {
    anatomyAudio.playClick();
    setUi({ ...("progress" in patch ? { layerProgress: patch.progress, topicId: "all" } : {}), ...("skinXRay" in patch ? { skinXRay: patch.skinXRay } : {}), ...("musclesXRay" in patch ? { musclesXRay: patch.musclesXRay } : {}) });
  };
  const closeSlice = () => {
    anatomyAudio.playClick();
    setSlice({ enabled: false });
  };
  const sliceProps = { slice, onChange: setSlice, onClose: closeSlice, layer: layerForSlice, onLayer: onLayerPatch, onApplyPreset: applySlicePreset, onFocusRegion: focusRegion };
  const pillPos = slice.dock === "right" ? "bottom-5 right-4" : slice.dock === "left" ? "bottom-5 left-4" : "bottom-5 left-1/2 -translate-x-1/2";

  return (
    <div
      ref={containerRef}
      className={cn("bio-console relative flex h-screen w-full select-none flex-col overflow-hidden bg-background font-sans text-foreground transition-colors duration-300", !isDay && "dark")}
      style={isDay ? BIO_THEME_VARS_LIGHT : BIO_THEME_VARS}
    >
      <TopBar
        ui={ui}
        setUi={setUi}
        slice={slice}
        bio={bio}
        setBio={setBio}
        canvas={canvasRef}
        onMode={setMode}
        onToggleTheme={toggleTheme}
        onToggleSlice={toggleSlice}
        onToggleTurntable={toggleTurntable}
        onToggleMute={toggleMute}
        onFullscreen={toggleFullscreen}
      />

      <main className="relative h-full w-full flex-1 overflow-hidden">
        <div className="relative h-full w-full">
          <NativeAnatomyCanvas
            ref={canvasRef}
            themeMode={ui.themeMode}
            layerOpacities={layerOpacities}
            layerVisibilities={LAYER_VISIBILITIES}
            activeTopic={activeTopic}
            sliceConfig={sliceConfig}
            lightingPreset={ui.lightingPreset}
            autoRotate={ui.autoRotate}
            autoRotateSpeed={1}
            onPick={handlePick}
            isPhysiologicalActive={bio.active}
            heartBpm={bio.bpm}
            isHeartBeating={bio.heart}
            isBreathing={bio.breathing}
            isAcousticHeart={bio.acoustic}
          />
          {ui.pinsEnabled && !slice.enabled && ui.camera && (
            <Suspense fallback={null}>
              <HtmlInCanvasOverlay camera={ui.camera} containerRef={containerRef} enabled onSelectPin={handleSelectPin} activePinId={ui.activePinId} themeMode={ui.themeMode} />
            </Suspense>
          )}
        </div>

        {/* Camera focus regions (top centre) */}
        <div className="pointer-events-auto absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/85 p-1 shadow-xl backdrop-blur-2xl">
            {CAMERA_REGIONS.map((reg) => {
              const Icon = reg.icon;
              const on = ui.activeRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => focusRegion(reg.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                    on ? "border border-primary/50 bg-primary/20 font-bold text-primary shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  title={`${reg.label} sohasiga kamerani yaqinlashtirish`}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{reg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layer lever (top-left) */}
        <div className="pointer-events-auto absolute left-4 top-4 z-20 hidden sm:block">
          <LayerLever progress={ui.layerProgress} onProgress={setLayer} collapsed={ui.leverCollapsed} onCollapse={(v) => setUi({ leverCollapsed: v })} />
        </div>

        {/* Slicing console: minimized pill, bottom or left dock (right dock lives in the right panel) */}
        {slice.enabled && (
          <Suspense fallback={null}>
            {slice.minimized ? (
              <SliceMinimizedPill
                slice={slice}
                className={pillPos}
                onOpen={() => {
                  anatomyAudio.playClick();
                  setSlice({ minimized: false });
                  if (slice.dock === "right") setUi({ rightTab: "slice" });
                }}
              />
            ) : slice.dock === "bottom" ? (
              <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-full max-w-2xl -translate-x-1/2 px-3 sm:px-4">
                <BendCard zone={30} angle={8} perspective={1400} tilt={0.1} className="w-full">
                  <SliceConsole {...sliceProps} className="max-h-[70vh]" />
                </BendCard>
              </div>
            ) : slice.dock === "left" ? (
              <div className="pointer-events-auto absolute bottom-4 left-4 top-4 z-20 w-80 md:w-96">
                <BendCard zone={40} angle={12} perspective={1200} tilt={0.25} className="h-full">
                  <SliceConsole {...sliceProps} />
                </BendCard>
              </div>
            ) : null}
          </Suspense>
        )}

        {/* Right panel: slice console (docked right) and/or anatomy details */}
        {showRightPanel && (
          <div className="pointer-events-auto absolute bottom-4 right-4 top-4 z-20 w-80 md:w-96">
            <BendCard zone={40} angle={12} perspective={1200} tilt={0.25} className="h-full">
              <aside className="animate-in fade-in slide-in-from-right-4 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur duration-200">
                {rightSliceDocked && (
                  <div className="mx-3 mt-3 flex shrink-0 items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1">
                    {[
                      { id: "slice", label: "3D kesim", on: "bg-amber-500 text-zinc-950" },
                      { id: "details", label: "Anatomiya", on: "bg-primary text-primary-foreground" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          anatomyAudio.playClick();
                          setUi({ rightTab: t.id, ...(t.id === "details" ? { detailOpen: true } : {}) });
                        }}
                        className={cn("flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all", ui.rightTab === t.id ? `${t.on} shadow-md` : "text-muted-foreground hover:text-foreground")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
                {rightSliceDocked && ui.rightTab === "slice" ? (
                  <Suspense fallback={null}>
                    <SliceConsole {...sliceProps} className="rounded-none border-0 bg-transparent shadow-none backdrop-blur-none" />
                  </Suspense>
                ) : (
                  <DetailsPanel
                    topic={activeTopic}
                    topicId={ui.topicId}
                    tab={ui.detailTab}
                    onTab={(t) => setUi({ detailTab: t })}
                    query={ui.query}
                    onQuery={(q) => setUi({ query: q })}
                    onSelectTopic={(t) => {
                      anatomyAudio.playCameraSnap();
                      setUi({ topicId: t.id });
                      canvasRef.current?.focusTopic(t);
                    }}
                    onFullBody={() => {
                      anatomyAudio.playClick();
                      setUi({ topicId: "all" });
                      canvasRef.current?.recenter();
                    }}
                    onClose={() => {
                      anatomyAudio.playClick();
                      setUi({ detailOpen: false, topicId: "all" });
                    }}
                    speaking={ui.speaking}
                    onNarrate={toggleNarration}
                  />
                )}
              </aside>
            </BendCard>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimulatorPage;
