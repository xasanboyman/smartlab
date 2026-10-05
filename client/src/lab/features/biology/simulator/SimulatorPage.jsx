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

const SimulatorPage = () => {
  const [activeTopicId, setActiveTopicId] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slicing Plane Tool States (matching user's screenshot + angle & X-Y sliding)
  const [isSliceOpen, setIsSliceOpen] = useState(true);
  const [sliceAxis, setSliceAxis] = useState("vertical_x"); // "horizontal" | "vertical_x" | "vertical_z" | "custom"
  const [sliceCutOn, setSliceCutOn] = useState(false);
  const [slicePosition, setSlicePosition] = useState(50);
  const [sliceAngle, setSliceAngle] = useState(0); // -90 to +90 degrees
  const [sliceTilt, setSliceTilt] = useState(0); // -45 to +45 degrees
  const [sliceOffsetX, setSliceOffsetX] = useState(0); // -100 to +100 %
  const [sliceOffsetY, setSliceOffsetY] = useState(0); // -100 to +100 %
  const [sliceFlipped, setSliceFlipped] = useState(false);
  const [showAdvancedSlice, setShowAdvancedSlice] = useState(false);

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
            <button
              onClick={() => setIsSliceOpen((prev) => !prev)}
              className={`px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-semibold shadow-xl pointer-events-auto transition-all flex items-center gap-1.5 ${
                isSliceOpen
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-zinc-900/90 border-zinc-800/90 text-zinc-300 hover:text-white"
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Kesish (Slice)</span>
            </button>
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

        {/* ---------------- BOTTOM FLOATING TOOLBARS ---------------- */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2.5 pointer-events-none">
          {/* SLICE CONTROL POPUP (Matches eler.ai from user screenshot) */}
          {activeTopicId === "all" && isSliceOpen && (
            <div className="w-full max-w-xl bg-[#12141c]/95 backdrop-blur-xl border border-zinc-800/95 rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3.5">
              {/* Row 1: Cut Directions & Remove Plane */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                    KESISH:
                  </span>
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
                        setSliceCutOn(true);
                        if (ax.id === "custom") {
                          setShowAdvancedSlice(true);
                          if (sliceAngle === 0) setSliceAngle(30);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        sliceAxis === ax.id && sliceCutOn
                          ? "bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm"
                          : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {ax.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSliceCutOn(false)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                >
                  O'chirish
                </button>
              </div>

              {/* Row 2: Options (Cut on, Flip side, Advanced toggle, Reset) */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSliceCutOn((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                      sliceCutOn
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-zinc-900 text-zinc-500 border-zinc-800"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Kesish {sliceCutOn ? "Faol" : "O'chiq"}</span>
                  </button>

                  <button
                    onClick={() => setSliceFlipped((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      sliceFlipped
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tomonni almashtirish (Flip)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAdvancedSlice((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      showAdvancedSlice || sliceAxis === "custom"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                    title="Burchak va X-Y sozlamalari"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Burchak & X-Y</span>
                  </button>

                  {(sliceAngle !== 0 || sliceTilt !== 0 || sliceOffsetX !== 0 || sliceOffsetY !== 0) && (
                    <button
                      onClick={() => {
                        setSliceAngle(0);
                        setSliceTilt(0);
                        setSliceOffsetX(0);
                        setSliceOffsetY(0);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-all"
                      title="Burchak va siljishlarni tiklash"
                    >
                      Tiklash (0°)
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Primary Position Slider */}
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
                  onChange={(e) => {
                    setSlicePosition(parseInt(e.target.value, 10));
                    setSliceCutOn(true);
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Row 4: Angle / Rotation Slider */}
              <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-medium">Burchak (Angle / Rotation):</span>
                    <span className="font-mono font-bold text-amber-400">
                      {sliceAngle > 0 ? `+${sliceAngle}` : sliceAngle}°
                    </span>
                  </div>

                  {/* Quick Angle Chips */}
                  <div className="flex items-center gap-1">
                    {[
                      { deg: -45, label: "-45°" },
                      { deg: 0, label: "0° (Tik)" },
                      { deg: 45, label: "+45°" },
                      { deg: 90, label: "90°" },
                    ].map((chip) => (
                      <button
                        key={chip.deg}
                        onClick={() => {
                          setSliceAngle(chip.deg);
                          setSliceCutOn(true);
                        }}
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
                  onChange={(e) => {
                    setSliceAngle(parseInt(e.target.value, 10));
                    setSliceCutOn(true);
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Row 5: Advanced X-Y Multi-Axis & Tilt Controls */}
              {(showAdvancedSlice || sliceAxis === "custom") && (
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2.5 animate-in fade-in duration-200">
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
                      onChange={(e) => {
                        setSliceOffsetX(parseInt(e.target.value, 10));
                        setSliceCutOn(true);
                      }}
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
                      onChange={(e) => {
                        setSliceOffsetY(parseInt(e.target.value, 10));
                        setSliceCutOn(true);
                      }}
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
                      onChange={(e) => {
                        setSliceTilt(parseInt(e.target.value, 10));
                        setSliceCutOn(true);
                      }}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MASTER LAYER SLIDER ("from bones to skin 0 to 100") */}
          {activeTopicId === "all" && (
            <div className="w-full max-w-xl bg-[#12141c]/95 backdrop-blur-xl border border-zinc-800/95 rounded-2xl px-4 py-3 shadow-2xl pointer-events-auto space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">
                    Suyaklardan Terigacha (0 — 100%):
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {layerProgress}%
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={layerProgress}
                onChange={(e) => setLayerProgress(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gradient-to-r from-zinc-700 via-amber-600 via-blue-600 via-red-600 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />

              {/* Presets */}
              <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                {[
                  { label: "💀 Suyaklar", p: 0 },
                  { label: "🫁 A'zolar", p: 30 },
                  { label: "🩸 Qon-tomir", p: 50 },
                  { label: "💪 Mushaklar", p: 75 },
                  { label: "🧍 To'liq Tana", p: 100 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setLayerProgress(preset.p)}
                    className={`px-2 py-1 rounded-lg border transition-all ${
                      layerProgress === preset.p
                        ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-md"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
