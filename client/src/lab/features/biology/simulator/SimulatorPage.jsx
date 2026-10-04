import React, { useState, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Focus,
  Search,
  Sparkles,
  Info,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  Layers,
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
  Eye,
  User,
} from "lucide-react";
import SketchfabCanvas from "./SketchfabCanvas";
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

function formatSeconds(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

const SimulatorPage = () => {
  const [activeTopicId, setActiveTopicId] = useState("skeleton");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Playback states
  const sketchfabRef = useRef(null);
  const [sfDuration, setSfDuration] = useState(46.67);
  const [sfCurrentTime, setSfCurrentTime] = useState(0);
  const [sfPaused, setSfPaused] = useState(false);
  const [sfSpeed, setSfSpeed] = useState(1);

  const containerRef = useRef(null);

  // Active topic object
  const activeTopic = useMemo(
    () => getSketchfabTopic(activeTopicId),
    [activeTopicId]
  );

  // Filtered topics by category and search
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

  // Video / Animation controls
  const handleTogglePlay = useCallback(() => {
    setSfPaused((prev) => !prev);
  }, []);

  const handleSeek = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setSfCurrentTime(val);
    sketchfabRef.current?.seekToTime(val);
  }, []);

  const handleRecenter = useCallback(() => {
    sketchfabRef.current?.recenterCamera();
  }, []);

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

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen overflow-hidden bg-[#090a0f] text-white font-sans select-none"
    >
      {/* ---------------- LEFT SIDEBAR: TOPICS & CATEGORIES ---------------- */}
      <aside className="w-80 md:w-96 h-full flex flex-col bg-[#0d0f17] border-r border-zinc-800/80 z-20 shrink-0">
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
                  3D HD
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400 truncate max-w-[190px]">
                Alohida a'zo va tizimlar ko'rinishi
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

          {filteredTopics.length === 0 && (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Mavzular topilmadi
            </div>
          )}
        </div>

        {/* Sidebar Footer Hint */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Faqat tanlangan a'zo ko'rinadi va markazlashadi.</span>
        </div>
      </aside>

      {/* ---------------- MAIN 3D VIEWPORT ---------------- */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#090a0f]">
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

          {!isDetailOpen && (
            <button
              onClick={() => setIsDetailOpen(true)}
              className="px-3 py-2 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-emerald-500 text-xs text-zinc-300 hover:text-white font-medium shadow-xl pointer-events-auto transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tafsilotlar</span>
            </button>
          )}
        </div>

        {/* Top Right Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-emerald-500 text-zinc-300 hover:text-white shadow-xl transition-all"
            title="Kamerani markazlash"
          >
            <Focus className="w-4 h-4" />
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

        {/* 3D Model Canvas (Sketchfab with Node Isolation) */}
        <div className="flex-1 w-full h-full relative">
          <SketchfabCanvas
            ref={sketchfabRef}
            activeKeywords={activeTopic.keywords}
            speed={sfSpeed}
            paused={sfPaused}
            onTimeUpdate={setSfCurrentTime}
            onDurationChange={setSfDuration}
          />
        </div>

        {/* Bottom Playback Bar (Video & Animation Controls) */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="max-w-3xl mx-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3.5">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
            >
              {sfPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Boshlash</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>To'xtatish</span>
                </>
              )}
            </button>

            {/* Time Stamp */}
            <span className="text-xs font-mono font-medium text-zinc-400 shrink-0">
              {formatSeconds(sfCurrentTime)} / {formatSeconds(sfDuration)}
            </span>

            {/* Scrubber Timeline */}
            <div className="flex-1 flex items-center relative">
              <input
                type="range"
                min="0"
                max={sfDuration || 46.67}
                step="0.05"
                value={sfCurrentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 shrink-0 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80">
              {[0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSfSpeed(s)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg transition-all ${
                    sfSpeed === s
                      ? "bg-emerald-500 text-zinc-950 font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Recenter Button */}
            <button
              onClick={handleRecenter}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shrink-0"
              title="Kamerani tiklash"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* ---------------- RIGHT SCIENTIFIC DETAIL PANEL ---------------- */}
      {isDetailOpen && (
        <aside className="w-80 md:w-96 h-full bg-[#0d0f17] border-l border-zinc-800/80 z-20 shrink-0 flex flex-col">
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
