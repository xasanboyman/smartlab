import React, { useState, useRef, useMemo, useCallback } from "react";
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
  Focus,
  RotateCcw,
  Sliders,
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
} from "lucide-react";
import NativeAnatomyCanvas from "./NativeAnatomyCanvas";
import {
  SKETCHFAB_TOPICS,
  SKETCHFAB_CATEGORIES,
  getSketchfabTopic,
} from "./engine/anatomyData";

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

  // Slicing Plane Tool States (matching user's screenshot + angle & X-Y sliding)
  const [isSliceOpen, setIsSliceOpen] = useState(false);
  const [sliceAxis, setSliceAxis] = useState("vertical_x"); // "horizontal" | "vertical_x" | "vertical_z" | "custom"
  const [sliceCutOn, setSliceCutOn] = useState(false);
  const [slicePosition, setSlicePosition] = useState(50);
  const [sliceAngle, setSliceAngle] = useState(0); // -90 to +90 degrees
  const [sliceTilt, setSliceTilt] = useState(0); // -45 to +45 degrees
  const [sliceOffsetX, setSliceOffsetX] = useState(0); // -100 to +100 %
  const [sliceOffsetY, setSliceOffsetY] = useState(0); // -100 to +100 %
  const [sliceFlipped, setSliceFlipped] = useState(false);
  const [showAdvancedSlice, setShowAdvancedSlice] = useState(false);

  // Vertical Lever Ref and Drag State
  const leverTrackRef = useRef(null);
  const [isDraggingLever, setIsDraggingLever] = useState(false);

  // Layer Slider ("from bones to skin 0 to 100")
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

  // Active layer info for the vertical lever
  const activeLayerInfo = useMemo(() => {
    if (layerProgress >= 86) return { label: "Tashqi Teri", sub: "100% Teri qoplami", icon: User };
    if (layerProgress >= 62) return { label: "Mushaklar tizimi", sub: "600+ faol mushak", icon: Dumbbell };
    if (layerProgress >= 38) return { label: "Qon-tomir tizimi", sub: "Arteriya & venalar", icon: HeartPulse };
    if (layerProgress >= 12) return { label: "Ichki a'zolar", sub: "Hayotiy organlar", icon: Activity };
    return { label: "Skelet tizimi", sub: "206 ta asosiy suyak", icon: Bone };
  }, [layerProgress]);

  // Pointer drag handler for vertical lever (Zygote Body style)
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
    // 0%: Skeleton only
    // 25%: Organs fade in
    // 50%: Vessels fade in
    // 75%: Muscles fade in
    // 100%: Skin fades in
    const p = layerProgress;
    const skeleton = 1.0;
    const organs = Math.min(1, Math.max(0, (p - 10) / 20));
    const vessels = Math.min(1, Math.max(0, (p - 30) / 20));
    const muscles = Math.min(1, Math.max(0, (p - 50) / 25));
    const skin = Math.min(1, Math.max(0, (p - 72) / 28));

    return { skeleton, organs, vessels, muscles, skin };
  }, [layerProgress]);

  // Active topic object
  const activeTopic = useMemo(
    () => getSketchfabTopic(activeTopicId),
    [activeTopicId]
  );

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return SKETCHFAB_TOPICS.filter((topic) => {
      const matchesCategory =
        activeCategory === "all" || topic.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.latin && topic.latin.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Slicing config to pass to Three.js canvas
  const sliceConfig = useMemo(() => {
    return {
      enabled: sliceCutOn && activeTopicId === "all",
      axis: sliceAxis,
      position: slicePosition,
      angle: sliceAngle,
      tilt: sliceTilt,
      offsetX: sliceOffsetX,
      offsetY: sliceOffsetY,
      flipped: sliceFlipped,
    };
  }, [
    sliceCutOn,
    activeTopicId,
    sliceAxis,
    slicePosition,
    sliceAngle,
    sliceTilt,
    sliceOffsetX,
    sliceOffsetY,
    sliceFlipped,
  ]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const ActiveIcon = ICON_MAP[activeTopic.icon] || Layers;

  const handlePick = useCallback((meshName) => {
    const matchedTopic = SKETCHFAB_TOPICS.find((t) =>
      t.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()))
    );
    if (matchedTopic) {
      setActiveTopicId(matchedTopic.id);
      setIsDetailOpen(true);
      canvasRef.current?.focusTopic(matchedTopic);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen overflow-hidden bg-[#08090d] text-white font-sans select-none"
    >
      {/* ---------------- LEFT SIDEBAR: TOPICS & CATEGORIES ---------------- */}
      <aside className="w-80 md:w-96 h-full flex flex-col bg-[#0c0e15] border-r border-zinc-800/80 z-20 shrink-0">
        {/* Top Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/biology"
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
              title="Biologiyaga qaytish"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Odam Anatomiyasi</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  WebGL 3D
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400 truncate max-w-[190px]">
                3D Kesish va Qatlamlar simulyatori
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80">
            {SKETCHFAB_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="A'zo yoki tizimni qidirish..."
              className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Topic List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredTopics.map((topic) => {
            const isSelected = activeTopicId === topic.id;
            const Icon = ICON_MAP[topic.icon] || Layers;

            return (
              <button
                key={topic.id}
                onClick={() => {
                  setActiveTopicId(topic.id);
                  setIsDetailOpen(true);
                  if (topic.id === "all") {
                    canvasRef.current?.recenter();
                  } else {
                    canvasRef.current?.focusTopic(topic);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-950/30 text-white"
                    : "bg-zinc-900/40 hover:bg-zinc-850 border-zinc-800/60 text-zinc-300 hover:text-white hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/60"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {topic.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 italic truncate">
                      {topic.latin}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected
                      ? "text-emerald-400 translate-x-0.5"
                      : "text-zinc-600"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Hint */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Sichqoncha bilan 360° aylantiring va yaqinlashtiring.</span>
        </div>
      </aside>

      {/* ---------------- MAIN 3D VIEWPORT ---------------- */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#08090d]">
        {/* Top Active Bar Overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 shadow-xl pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <ActiveIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                {activeTopic.title}
              </span>
            </div>
          </div>

          {activeTopicId === "all" && (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {!sliceCutOn ? (
                <button
                  onClick={() => {
                    setSliceCutOn(true);
                    setIsSliceOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                  title="3D Kesim tekisligini qo'shish"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Kesim qo'shish</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSliceOpen((prev) => !prev)}
                    className={`px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-bold shadow-xl transition-all flex items-center gap-1.5 ${
                      isSliceOpen
                        ? "bg-amber-500/25 text-amber-300 border-amber-500/60"
                        : "bg-zinc-900/90 border-zinc-800/90 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kesim faol {isSliceOpen ? "▼" : "▲"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSliceCutOn(false);
                      setIsSliceOpen(false);
                    }}
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 shadow-xl transition-all"
                    title="Kesimni olib tashlash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {!isDetailOpen && (
            <button
              onClick={() => setIsDetailOpen(true)}
              className="px-3 py-2 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-emerald-500 text-xs text-zinc-300 hover:text-white font-medium shadow-xl pointer-events-auto transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tafsilotlar</span>
            </button>
          )}
        </div>

        {/* Top Right Quick Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => canvasRef.current?.recenter()}
            className="p-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-emerald-500 text-zinc-300 hover:text-white shadow-xl transition-all"
            title="Kamerani markazlash"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-emerald-500 text-zinc-300 hover:text-white shadow-xl transition-all"
            title="To'liq ekran"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 3D Model Canvas (Native Three.js with Draco & Clipping) */}
        <div className="flex-1 w-full h-full relative">
          <NativeAnatomyCanvas
            ref={canvasRef}
            layerOpacities={layerOpacities}
            layerVisibilities={layerVisibilities}
            activeTopic={activeTopic}
            sliceConfig={sliceConfig}
            onPick={handlePick}
          />
        </div>

        {/* ---------------- ZYGOTE BODY VERTICAL ANATOMY LEVER ---------------- */}
        {activeTopicId === "all" && (
          <div className="absolute left-4 top-20 z-20 flex flex-col items-center pointer-events-auto select-none">
            {/* Glassmorphic Panel */}
            <div className="bg-[#0e111a]/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-3 w-48">
              {/* Header: Active Layer badge */}
              <div className="w-full flex items-center justify-between px-1 pb-1.5 border-b border-zinc-800/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  {React.createElement(activeLayerInfo.icon, {
                    className: "w-3.5 h-3.5 text-emerald-400 shrink-0",
                  })}
                  <span className="text-[11px] font-bold text-white truncate">
                    {activeLayerInfo.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 ml-1">
                  {layerProgress}%
                </span>
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
          </div>
        )}

        {/* ---------------- 3D SLICE CONTROL FLOATING HUD ---------------- */}
        {activeTopicId === "all" && sliceCutOn && isSliceOpen && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-xl px-4">
            <div className="bg-[#0e111a]/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Row 1: Header + Axis Selector + Close/Delete */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 mr-1">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Kesish:
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
      </main>

      {/* ---------------- RIGHT SCIENTIFIC DETAIL PANEL ---------------- */}
      {isDetailOpen && (
        <aside className="w-80 md:w-96 h-full bg-[#0c0e15] border-l border-zinc-800/80 z-20 shrink-0 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">
                Anatomik Tafsilotlar
              </h2>
            </div>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Title & Badge */}
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/70">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {activeTopic.title}
                  </h3>
                  <p className="text-xs text-zinc-400 italic">
                    {activeTopic.latin}
                  </p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium border border-zinc-700">
                    {activeTopic.category === "systems"
                      ? "Asosiy Tizim"
                      : activeTopic.category === "all"
                      ? "To'liq Yaxlit Tana"
                      : "Ichki A'zo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Scientific Description */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Ilmiy Tuzilishi va Vazifasi
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/60">
                {activeTopic.desc}
              </p>
            </div>

            {/* Statistics */}
            {activeTopic.stats && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Asosiy Ko'rsatkichlar
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {activeTopic.stats.map((st, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900/60 px-3 py-2 rounded-xl border border-zinc-800/70 flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-400">{st.label}:</span>
                      <span className="font-bold text-emerald-400">
                        {st.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fun Fact Callout */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Qiziqarli Fakt
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {activeTopic.funFact}
              </p>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px] text-zinc-400 text-center">
            SmartLab 3D Biologiya Virtual Laboratoriyasi
          </div>
        </aside>
      )}
    </div>
  );
};

export default SimulatorPage;
