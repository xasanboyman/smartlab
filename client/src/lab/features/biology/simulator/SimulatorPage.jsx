import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Scissors,
  Layers,
  Sparkles,
  Info,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Search,
  Eye,
  EyeOff,
  Bone,
  Dumbbell,
  HeartPulse,
  Heart,
  Wind,
  Brain,
  Activity,
  UtensilsCrossed,
  Droplets,
  Flame,
  User,
  SlidersHorizontal,
  Plus,
  GripVertical,
  Trash2,
  Volume2,
  VolumeX,
  Sun,
  Zap,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import NativeAnatomyCanvas from "./NativeAnatomyCanvas";
import HtmlInCanvasOverlay from "./HtmlInCanvasOverlay";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import {
  ANATOMY_TOPICS,
  ANATOMY_CATEGORIES,
  getAnatomyTopic,
  DISCLAIMER,
} from "./engine/anatomyData";
import {
  AnatomyNarrator,
  LIGHTING_PRESETS,
  ANATOMICAL_PINS,
} from "./engine/HtmlCanvasManager";

const ICON_MAP = {
  Bone,
  Dumbbell,
  HeartPulse,
  Layers,
  User,
  Heart,
  Wind,
  Brain,
  Activity,
  UtensilsCrossed,
  Droplets,
  Flame,
  Eye,
};

const LEVER_LAYERS = [
  { p: 100, label: "Tashqi Teri", icon: User },
  { p: 75, label: "Mushaklar", icon: Dumbbell },
  { p: 50, label: "Qon-tomir", icon: HeartPulse },
  { p: 25, label: "Ichki A'zolar", icon: Activity },
  { p: 0, label: "Skelet", icon: Bone },
];

const SimulatorPage = () => {
  const [activeTopicId, setActiveTopicId] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("tuzilish"); // "tuzilish" | "azolar" | "asboblar"

  // 360° Turntable Auto-rotation
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.2);

  // Lighting Studio Preset
  const [lightingPreset, setLightingPreset] = useState("medical"); // "medical" | "cyber" | "xray"
  const [isLightingOpen, setIsLightingOpen] = useState(false);

  // 3D Spatial Pins (HTML-in-Canvas)
  const [pinsEnabled, setPinsEnabled] = useState(true);
  const [activePinId, setActivePinId] = useState(null);

  // Audio Speech Narration
  const narratorRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    narratorRef.current = new AnatomyNarrator();
    return () => narratorRef.current?.stop();
  }, []);

  // Slicing Plane Tool States
  const [isSliceOpen, setIsSliceOpen] = useState(false);
  const [sliceAxis, setSliceAxis] = useState("vertical_x");
  const [sliceCutOn, setSliceCutOn] = useState(false);
  const [slicePosition, setSlicePosition] = useState(50);
  const [sliceAngle, setSliceAngle] = useState(0);
  const [sliceTilt, setSliceTilt] = useState(0);
  const [sliceOffsetX, setSliceOffsetX] = useState(0);
  const [sliceOffsetY, setSliceOffsetY] = useState(0);
  const [sliceFlipped, setSliceFlipped] = useState(false);
  const [showAdvancedSlice, setShowAdvancedSlice] = useState(false);

  // Vertical Lever Ref and Drag State
  const leverTrackRef = useRef(null);
  const [isDraggingLever, setIsDraggingLever] = useState(false);
  const [isLeverCollapsed, setIsLeverCollapsed] = useState(false);

  // Layer Progress (0: Skeleton only, 100: Full skin)
  const [layerProgress, setLayerProgress] = useState(100);
  const [layerVisibilities, setLayerVisibilities] = useState({
    skeleton: true,
    organs: true,
    vessels: true,
    muscles: true,
    skin: true,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [cameraInstance, setCameraInstance] = useState(null);

  // Capture camera instance once canvas is mounted
  useEffect(() => {
    const checkCamera = () => {
      const cam = canvasRef.current?.getCamera?.();
      if (cam) setCameraInstance(cam);
      else setTimeout(checkCamera, 200);
    };
    checkCamera();
  }, []);

  // Active layer info for the vertical lever
  const activeLayerInfo = useMemo(() => {
    if (layerProgress >= 86) return { label: "Tashqi Teri", sub: "100% Teri qoplami", icon: User };
    if (layerProgress >= 62) return { label: "Mushaklar tizimi", sub: "600+ faol mushak", icon: Dumbbell };
    if (layerProgress >= 38) return { label: "Qon-tomir tizimi", sub: "Arteriya & venalar", icon: HeartPulse };
    if (layerProgress >= 12) return { label: "Ichki a'zolar", sub: "Hayotiy organlar", icon: Activity };
    return { label: "Skelet tizimi", sub: "206 ta asosiy suyak", icon: Bone };
  }, [layerProgress]);

  // Pointer drag handler for vertical lever
  const handleLeverPointerDown = useCallback((e) => {
    const track = leverTrackRef.current;
    if (!track) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDraggingLever(true);

    const updateFromY = (clientY) => {
      const rect = track.getBoundingClientRect();
      const clampedY = Math.max(rect.top, Math.min(rect.bottom, clientY));
      const p = Math.round(((rect.bottom - clampedY) / rect.height) * 100);
      setLayerProgress(Math.min(100, Math.max(0, p)));
    };

    updateFromY(e.clientY);

    const handlePointerMove = (moveEvt) => {
      updateFromY(moveEvt.clientY);
    };

    const handlePointerUp = (upEvt) => {
      setIsDraggingLever(false);
      try {
        e.currentTarget.releasePointerCapture(upEvt.pointerId);
      } catch (_) {}
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, []);

  // Calculate layer opacities from layerProgress (0 to 100)
  const layerOpacities = useMemo(() => {
    const p = layerProgress;
    let skeleton = 1.0;
    let organs = 1.0;
    let vessels = 1.0;
    let muscles = 1.0;
    let skin = 1.0;

    if (p <= 20) {
      skeleton = 1.0;
      organs = p / 20;
      vessels = 0;
      muscles = 0;
      skin = 0;
    } else if (p <= 45) {
      skeleton = 1.0;
      organs = 1.0;
      vessels = (p - 20) / 25;
      muscles = 0;
      skin = 0;
    } else if (p <= 70) {
      skeleton = 1.0;
      organs = 1.0;
      vessels = 1.0;
      muscles = (p - 45) / 25;
      skin = 0;
    } else {
      skeleton = 1.0;
      organs = 1.0;
      vessels = 1.0;
      muscles = 1.0;
      skin = (p - 70) / 30;
    }

    return { skeleton, organs, vessels, muscles, skin };
  }, [layerProgress]);

  // Current active topic data
  const activeTopic = useMemo(
    () => getAnatomyTopic(activeTopicId),
    [activeTopicId]
  );

  // Filtered topics for exploration
  const filteredTopics = useMemo(() => {
    return ANATOMY_TOPICS.filter((topic) => {
      const matchCat =
        activeCategory === "all" || topic.category === activeCategory;
      const matchQuery =
        !searchQuery ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.latin.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  // Toggle narration playback
  const toggleNarration = useCallback(() => {
    if (isSpeaking) {
      narratorRef.current?.stop();
      setIsSpeaking(false);
    } else {
      const text = `${activeTopic.title}. ${activeTopic.desc}. Qiziqarli fakt: ${activeTopic.funFact}`;
      narratorRef.current?.speak(text, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  }, [isSpeaking, activeTopic]);

  // Stop narration when topic changes
  useEffect(() => {
    narratorRef.current?.stop();
    setIsSpeaking(false);
  }, [activeTopicId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      } else if (e.code === "KeyC") {
        setSliceCutOn((prev) => !prev);
        setIsSliceOpen((prev) => !prev);
      } else if (e.code === "KeyR") {
        canvasRef.current?.recenter();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "Digit1") {
        setLayerProgress(0); // Bones
      } else if (e.code === "Digit2") {
        setLayerProgress(25); // Organs
      } else if (e.code === "Digit3") {
        setLayerProgress(50); // Vessels
      } else if (e.code === "Digit4") {
        setLayerProgress(75); // Muscles
      } else if (e.code === "Digit5") {
        setLayerProgress(100); // Skin
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle 3D mesh click
  const handlePick = (meshName) => {
    const matchedTopic = ANATOMY_TOPICS.find((t) =>
      t.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()))
    );
    if (matchedTopic) {
      setActiveTopicId(matchedTopic.id);
      setIsDetailOpen(true);
      canvasRef.current?.focusMesh(meshName);
    }
  };

  // Handle 3D Pin Click
  const handleSelectPin = (pin) => {
    setActivePinId(pin.id);
    canvasRef.current?.focusPosition(pin.pos, 35);
    const matchedTopic = ANATOMY_TOPICS.find((t) =>
      t.keywords?.some((kw) => pin.id.includes(kw) || pin.label.toLowerCase().includes(kw))
    );
    if (matchedTopic) {
      setActiveTopicId(matchedTopic.id);
      setIsDetailOpen(true);
    }
  };

  const sliceConfig = useMemo(
    () => ({
      enabled: sliceCutOn,
      axis: sliceAxis,
      position: slicePosition,
      angle: sliceAngle,
      tilt: sliceTilt,
      offsetX: sliceOffsetX,
      offsetY: sliceOffsetY,
      flipped: sliceFlipped,
    }),
    [sliceCutOn, sliceAxis, slicePosition, sliceAngle, sliceTilt, sliceOffsetX, sliceOffsetY, sliceFlipped]
  );

  const ActiveIcon = ICON_MAP[activeTopic.icon] || Sparkles;

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#08090d] text-white flex flex-col overflow-hidden font-sans select-none relative"
    >
      {/* ---------------- TOP FLOATING GLASS NAVIGATION DOCK ---------------- */}
      <header className="h-16 px-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl z-30 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Brand Logo & Back */}
        <div className="flex items-center gap-3">
          <Link
            to="/biology"
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all shadow-sm group"
            title="Biologiya bo'limiga qaytish"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          <NexusLogo size="sm" showSubtitle={false} />
        </div>

        {/* Center: System Pills Filter (Modern Ergonomic Selector) */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl shadow-inner">
          {[
            { id: "all", label: "To'liq Inson", p: 100, icon: User },
            { id: "muscles", label: "Mushaklar", p: 75, icon: Dumbbell },
            { id: "circulatory", label: "Qon-tomir", p: 50, icon: HeartPulse },
            { id: "splanchnology", label: "A'zolar", p: 25, icon: Activity },
            { id: "skeleton", label: "Skelet", p: 0, icon: Bone },
          ].map((item) => {
            const ItemIcon = item.icon;
            const isSelected = activeTopicId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTopicId(item.id);
                  setLayerProgress(item.p);
                  canvasRef.current?.recenter();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-black scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <ItemIcon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Palette */}
        <div className="flex items-center gap-2">
          {/* Slicing Button */}
          {!sliceCutOn ? (
            <button
              onClick={() => {
                setSliceCutOn(true);
                setIsSliceOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
              title="3D Kesim tekisligini qo'shish (C)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Kesim qo'shish</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 rounded-xl p-0.5">
              <button
                onClick={() => setIsSliceOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSliceOpen
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "text-amber-300 hover:text-white"
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Kesim faol {isSliceOpen ? "▼" : "▲"}</span>
              </button>
              <button
                onClick={() => {
                  setSliceCutOn(false);
                  setIsSliceOpen(false);
                }}
                className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-all"
                title="Kesimni bekor qilish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 360° Turntable Auto-rotate */}
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
              autoRotate
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="360° Avto-Aylantirish (Space)"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline text-xs">360°</span>
          </button>

          {/* 3D Pins Toggle */}
          <button
            onClick={() => setPinsEnabled((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
              pinsEnabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="3D Anatomik belgilarni ko'rsatish / yashirish"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Studio Lighting Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLightingOpen((prev) => !prev)}
              className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all flex items-center gap-1 ${
                lightingPreset === "cyber"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                  : lightingPreset === "xray"
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
              title="Studiya Yoritish Rejimlari"
            >
              {lightingPreset === "cyber" ? (
                <Zap className="w-4 h-4 text-cyan-400" />
              ) : lightingPreset === "xray" ? (
                <Eye className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {isLightingOpen && (
              <div className="absolute right-0 top-12 w-48 p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 tracking-wider">
                  Yoritish Rejimi
                </div>
                {Object.values(LIGHTING_PRESETS).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setLightingPreset(preset.id);
                      setIsLightingOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      lightingPreset === preset.id
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>{preset.name}</span>
                    {lightingPreset === preset.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Camera */}
          <button
            onClick={() => canvasRef.current?.recenter()}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white shadow-sm transition-all"
            title="Kamerani markazlash (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white shadow-sm transition-all"
            title="To'liq ekran (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Details Toggle */}
          <button
            onClick={() => setIsDetailOpen((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
              isDetailOpen
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title="Anatomik tafsilotlar panelini ochish / yopish"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ---------------- MAIN 3D INTERACTIVE VIEWPORT ---------------- */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#08090d]">
        {/* 3D Model Native Canvas */}
        <div className="w-full h-full relative">
          <NativeAnatomyCanvas
            ref={canvasRef}
            layerOpacities={layerOpacities}
            layerVisibilities={layerVisibilities}
            activeTopic={activeTopic}
            sliceConfig={sliceConfig}
            lightingPreset={lightingPreset}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            onPick={handlePick}
          />

          {/* Chrome HTML-in-Canvas Spatial Overlay */}
          <HtmlInCanvasOverlay
            camera={cameraInstance}
            containerRef={containerRef}
            enabled={pinsEnabled}
            onSelectPin={handleSelectPin}
            activePinId={activePinId}
          />
        </div>

        {/* ---------------- LEFT FLOATING VERTICAL LEVER (ZYGOTE PRO) ---------------- */}
        <div className="absolute left-4 top-4 z-20 flex flex-col items-start pointer-events-auto select-none">
          {!isLeverCollapsed ? (
            <div className="bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-3 w-48 animate-in fade-in slide-in-from-left-2 duration-200">
              {/* Header: Active Layer badge + collapse */}
              <div className="w-full flex items-center justify-between px-1 pb-1.5 border-b border-zinc-800/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  {React.createElement(activeLayerInfo.icon, {
                    className: "w-3.5 h-3.5 text-emerald-400 shrink-0",
                  })}
                  <span className="text-[11px] font-bold text-white truncate">
                    {activeLayerInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {layerProgress}%
                  </span>
                  <button
                    onClick={() => setIsLeverCollapsed(true)}
                    className="p-1 rounded text-zinc-500 hover:text-white transition-all ml-1"
                    title="Tutqichni yig'ish"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Lever Body: Rail & Notches */}
              <div className="flex items-stretch justify-between w-full h-64 py-1 relative">
                {/* Layer Clickable Notches */}
                <div className="flex flex-col justify-between h-full py-0.5 text-right pr-2 flex-1">
                  {LEVER_LAYERS.map((layer) => {
                    const LayerIcon = layer.icon;
                    const isActive =
                      (layer.p === 100 && layerProgress >= 86) ||
                      (layer.p === 75 && layerProgress >= 62 && layerProgress < 86) ||
                      (layer.p === 50 && layerProgress >= 38 && layerProgress < 62) ||
                      (layer.p === 25 && layerProgress >= 12 && layerProgress < 38) ||
                      (layer.p === 0 && layerProgress < 12);

                    return (
                      <button
                        key={layer.p}
                        onClick={() => setLayerProgress(layer.p)}
                        className={`group flex items-center justify-end gap-1.5 text-[11px] font-semibold transition-all py-1 px-1.5 rounded-lg ${
                          isActive
                            ? "text-emerald-300 font-bold bg-emerald-500/15"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                        }`}
                        title={`${layer.label} (${layer.p}%)`}
                      >
                        <span className="truncate">{layer.label}</span>
                        <LayerIcon
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isActive
                              ? "text-emerald-400 scale-110"
                              : "text-zinc-500 group-hover:text-zinc-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Vertical Rail + Knob */}
                <div
                  ref={leverTrackRef}
                  onPointerDown={handleLeverPointerDown}
                  className="relative w-8 flex justify-center h-full cursor-pointer touch-none py-1 group/track"
                  title="Qatlamlar darajasini surish (Drag)"
                >
                  {/* Track Background */}
                  <div className="w-2 h-full bg-zinc-800/90 group-hover/track:bg-zinc-700/80 rounded-full relative overflow-hidden border border-zinc-700/50">
                    {/* Active Fill Gradient */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-amber-500 to-sky-400 transition-all duration-75"
                      style={{ height: `${layerProgress}%` }}
                    />
                  </div>

                  {/* Notches lines on rail */}
                  {[0, 25, 50, 75, 100].map((notchP) => (
                    <div
                      key={notchP}
                      className="absolute left-1/2 -translate-x-1/2 w-3.5 h-[1.5px] bg-zinc-600/70 pointer-events-none"
                      style={{ bottom: `${notchP}%` }}
                    />
                  ))}

                  {/* Draggable Knob */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-b from-white to-zinc-200 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-[transform,shadow] cursor-grab active:cursor-grabbing ${
                      isDraggingLever ? "scale-125 shadow-emerald-500/60 ring-4 ring-emerald-400/20" : "hover:scale-110"
                    }`}
                    style={{
                      bottom: `calc(${layerProgress}% - 12px)`,
                    }}
                  >
                    <GripVertical className="w-3 h-3 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Presets */}
              <div className="w-full flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-800/60 text-[10px]">
                <button
                  onClick={() => setLayerProgress(0)}
                  className={`flex-1 py-1 rounded-md text-center font-medium transition-all ${
                    layerProgress === 0
                      ? "bg-zinc-800 text-emerald-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  💀 Skelet
                </button>
                <button
                  onClick={() => setLayerProgress(100)}
                  className={`flex-1 py-1 rounded-md text-center font-medium transition-all ${
                    layerProgress === 100
                      ? "bg-zinc-800 text-emerald-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  🧍 Teri
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLeverCollapsed(false)}
              className="p-3 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 text-emerald-400 shadow-xl flex items-center gap-2 transition-all group"
              title="Qatlamlar tutqichini ochish"
            >
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                {layerProgress}%
              </span>
            </button>
          )}
        </div>

        {/* ---------------- 3D SLICE CONTROL FLOATING HUD ---------------- */}
        {sliceCutOn && isSliceOpen && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-xl px-4 select-none">
            <div className="bg-[#0e111a]/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Row 1: Header + Axis Selector + Close/Delete */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 mr-1">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Kesish Tekisligi:
                    </span>
                  </div>
                  {[
                    { id: "horizontal", label: "Horizontal (Y)" },
                    { id: "vertical_x", label: "Vertical X" },
                    { id: "vertical_z", label: "Vertical Z" },
                    { id: "custom", label: "Burchakli (X-Y)" },
                  ].map((ax) => (
                    <button
                      key={ax.id}
                      onClick={() => {
                        setSliceAxis(ax.id);
                        if (ax.id === "custom") {
                          setShowAdvancedSlice(true);
                          if (sliceAngle === 0) setSliceAngle(30);
                        }
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        sliceAxis === ax.id
                          ? "bg-amber-500/25 text-amber-300 border-amber-500 shadow-sm font-bold"
                          : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {ax.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setSliceCutOn(false);
                      setIsSliceOpen(false);
                    }}
                    className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Kesimni bekor qilish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsSliceOpen(false)}
                    className="p-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    title="Panelni yashirish (kesim qoladi)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Primary Position Slider */}
              <div className="space-y-1 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Asosiy Joylashuv (Position):</span>
                  <span className="font-mono font-bold text-amber-400">{slicePosition}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slicePosition}
                  onChange={(e) => setSlicePosition(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Row 3: Angle / Rotation */}
              <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-medium">Burchak (Angle):</span>
                    <span className="font-mono font-bold text-amber-400">
                      {sliceAngle > 0 ? `+${sliceAngle}` : sliceAngle}°
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[
                      { deg: -45, label: "-45°" },
                      { deg: 0, label: "0° (Tik)" },
                      { deg: 45, label: "+45°" },
                      { deg: 90, label: "90°" },
                    ].map((chip) => (
                      <button
                        key={chip.deg}
                        onClick={() => setSliceAngle(chip.deg)}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-all ${
                          sliceAngle === chip.deg
                            ? "bg-amber-500 text-zinc-950 font-bold"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={sliceAngle}
                  onChange={(e) => setSliceAngle(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Row 4: Controls Toggle (Flip & Advanced) */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => setSliceFlipped((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    sliceFlipped
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tomonni almashtirish (Flip)</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAdvancedSlice((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      showAdvancedSlice || sliceAxis === "custom"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Erkin X-Y & Tilt</span>
                  </button>

                  {(sliceAngle !== 0 || sliceTilt !== 0 || sliceOffsetX !== 0 || sliceOffsetY !== 0) && (
                    <button
                      onClick={() => {
                        setSliceAngle(0);
                        setSliceTilt(0);
                        setSliceOffsetX(0);
                        setSliceOffsetY(0);
                      }}
                      className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-all"
                    >
                      Tiklash
                    </button>
                  )}
                </div>
              </div>

              {/* Row 5: Advanced X-Y Multi-Axis & Tilt Controls */}
              {(showAdvancedSlice || sliceAxis === "custom") && (
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 animate-in fade-in duration-200">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>X va Y o'qlari bo'yicha siljish:</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Erkin 3D joylashuv</span>
                  </div>

                  {/* X Offset */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">X o'qi (Chap ⟵ ⟶ O'ng):</span>
                      <span className="font-mono text-zinc-300">
                        {sliceOffsetX > 0 ? `+${sliceOffsetX}` : sliceOffsetX}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={sliceOffsetX}
                      onChange={(e) => setSliceOffsetX(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>

                  {/* Y Offset */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Y o'qi (Past ⟵ ⟶ Yuqori):</span>
                      <span className="font-mono text-zinc-300">
                        {sliceOffsetY > 0 ? `+${sliceOffsetY}` : sliceOffsetY}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={sliceOffsetY}
                      onChange={(e) => setSliceOffsetY(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  {/* Tilt */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Qiyalik (Tilt / Old-Orqa):</span>
                      <span className="font-mono text-zinc-300">
                        {sliceTilt > 0 ? `+${sliceTilt}` : sliceTilt}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={sliceTilt}
                      onChange={(e) => setSliceTilt(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- RIGHT FLOATING SCIENTIFIC HUD PANEL ---------------- */}
        {isDetailOpen && (
          <aside className="absolute right-4 top-4 bottom-4 w-80 md:w-96 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            {/* HUD Header */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-white truncate">
                    {activeTopic.title}
                  </h2>
                  <div className="text-[10px] text-zinc-400 italic truncate">
                    {activeTopic.latin}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Audio Voice Narration */}
                <button
                  onClick={toggleNarration}
                  className={`p-2 rounded-xl border transition-all ${
                    isSpeaking
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 animate-pulse shadow-md"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                  title={isSpeaking ? "Ovozni to'xtatish" : "Tushuntirishni eshitish (Audio)"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                  title="Panelni yopish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Segmented Tabs */}
            <div className="flex items-center border-b border-zinc-800/80 px-4 pt-2 gap-2 text-xs">
              {[
                { id: "tuzilish", label: "Tuzilishi" },
                { id: "azolar", label: "A'zolar" },
                { id: "asboblar", label: "Klaviatura" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`pb-2 font-semibold transition-all relative ${
                    activeDetailTab === tab.id
                      ? "text-emerald-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeDetailTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab 1: Tuzilishi & Ma'lumot */}
            {activeDetailTab === "tuzilish" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Ilmiy Tavsif va Vazifasi
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/60">
                    {activeTopic.desc}
                  </p>
                </div>

                {/* Vitals / Stats */}
                {activeTopic.stats && activeTopic.stats.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Asosiy Ko'rsatkichlar
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeTopic.stats.map((st, i) => (
                        <div
                          key={i}
                          className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60"
                        >
                          <div className="text-[10px] text-zinc-400 truncate">{st.label}</div>
                          <div className="text-xs font-bold text-emerald-400 truncate mt-0.5">
                            {st.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Did You Know? (Qiziqarli Fakt) */}
                {activeTopic.funFact && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>QIZIQARLI TIBBIY FAKT</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      {activeTopic.funFact}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: A'zolar ro'yxati va tezkor qidiruv */}
            {activeDetailTab === "azolar" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="A'zoni qidirish..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Topics list */}
                <div className="space-y-1">
                  {filteredTopics.map((topic) => {
                    const TopicIcon = ICON_MAP[topic.icon] || Sparkles;
                    const isSelected = activeTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setActiveTopicId(topic.id);
                          canvasRef.current?.focusTopic(topic);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/40 text-white font-bold"
                            : "bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TopicIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                          <div className="min-w-0">
                            <div className="text-xs truncate">{topic.title}</div>
                            <div className="text-[10px] text-zinc-500 italic truncate">{topic.latin}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Klaviatura & Tezkor tugmalar */}
            {activeDetailTab === "asboblar" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Tezkor Klaviatura Tugmalari
                </div>
                <div className="space-y-2">
                  {[
                    { key: "Space", desc: "360° Avto-Aylantirish (Turntable)" },
                    { key: "C", desc: "Kesim tekisligini qo'shish / yopish" },
                    { key: "R", desc: "Kamerani boshlang'ich holatga keltirish" },
                    { key: "F", desc: "To'liq ekran rejimiga o'tish" },
                    { key: "1 - 5", desc: "1: Skelet, 2: A'zolar, 3: Qon-tomir, 4: Mushaklar, 5: Teri" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60"
                    >
                      <span className="text-zinc-300">{item.desc}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-emerald-400 rounded-md shadow-sm shrink-0 ml-2">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-800/60">
                  <div className="text-[10px] text-zinc-500 leading-normal">
                    {DISCLAIMER}
                  </div>
                </div>
              </div>
            )}

            {/* HUD Footer Branding */}
            <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[10px] text-zinc-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NexusLab 3D WebGL Engine</span>
              </div>
              <span className="font-mono text-zinc-400">v2.5 Pro</span>
            </div>
          </aside>
        )}

        {/* ---------------- WATERMARK & DEVELOPER CREDITS ---------------- */}
        <div className="absolute bottom-3 right-4 z-10 text-[10px] text-zinc-500 font-mono tracking-wider pointer-events-none select-none flex items-center gap-2">
          <span>NexusLab 3D Studio</span>
          <span>•</span>
          <span>Muallif: Abdulkhayev Hasanboy (@xasanboyman)</span>
        </div>
      </main>
    </div>
  );
};

export default SimulatorPage;
