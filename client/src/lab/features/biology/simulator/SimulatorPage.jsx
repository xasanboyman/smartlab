import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Heart,
  Activity,
  X,
  Clock,
  Box,
  Sliders,
} from "lucide-react";
import SketchfabCanvas from "./SketchfabCanvas";
import SimulatorCanvas from "./SimulatorCanvas";
import {
  SKETCHFAB_STAGES,
  SKETCHFAB_LAYERS,
  ORGAN_TIMESTAMPS,
  ORGAN_INFO,
  BODY_LAYERS,
  BODY_PRESETS,
  defaultLayerOpacity,
} from "./engine/anatomyData";

function formatSeconds(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

const SimulatorPage = () => {
  // Engine Mode: "sketchfab" (default requested model) or "threejs" (local native WebGL)
  const [engineMode, setEngineMode] = useState("sketchfab");

  // -------------------------------------------------------------
  // Sketchfab Mode States
  // -------------------------------------------------------------
  const sketchfabRef = useRef(null);
  const [sfDuration, setSfDuration] = useState(46.67);
  const [sfCurrentTime, setSfCurrentTime] = useState(0);
  const [sfPaused, setSfPaused] = useState(false);
  const [sfSpeed, setSfSpeed] = useState(1);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [sfTab, setSfTab] = useState("stages"); // "stages" | "layers" | "organs"

  // -------------------------------------------------------------
  // Native Three.js Mode States
  // -------------------------------------------------------------
  const [threeMode, setThreeMode] = useState("body"); // "body" | "organ"
  const [threeOrgan, setThreeOrgan] = useState(null);
  const [threeLayers, setThreeLayers] = useState({
    skin: true,
    muscles: true,
    organs: true,
    vessels: true,
  });
  const [threeOpacities, setThreeOpacities] = useState({
    skin: defaultLayerOpacity("skin"),
    muscles: defaultLayerOpacity("muscles"),
    organs: defaultLayerOpacity("organs"),
    vessels: defaultLayerOpacity("vessels"),
  });
  const [threeSpeed, setThreeSpeed] = useState(1);
  const [threePaused, setThreePaused] = useState(false);
  const threeControlsRef = useRef(null);

  // Common Detail Card State
  const [selectedDetail, setSelectedDetail] = useState(null);

  // -------------------------------------------------------------
  // Sketchfab Control Callbacks
  // -------------------------------------------------------------
  const handleSeek = (time) => {
    setSfCurrentTime(time);
    sketchfabRef.current?.seekToTime(time);
  };

  const toggleSfPause = () => {
    const next = !sfPaused;
    setSfPaused(next);
    if (next) {
      sketchfabRef.current?.pause();
    } else {
      sketchfabRef.current?.play();
    }
  };

  const toggleSfCategory = (catId) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectSketchfabOrgan = (organId) => {
    const targetTime = ORGAN_TIMESTAMPS[organId] ?? 22.0;
    handleSeek(targetTime);
    setSelectedDetail(ORGAN_INFO[organId] || null);
  };

  // -------------------------------------------------------------
  // Three.js Control Callbacks
  // -------------------------------------------------------------
  const toggleThreeLayer = (layerId) => {
    setThreeLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleThreeOpacityChange = (layerId, val) => {
    const num = parseFloat(val);
    setThreeOpacities((prev) => ({ ...prev, [layerId]: num }));
    if (num > 0 && !threeLayers[layerId]) {
      setThreeLayers((prev) => ({ ...prev, [layerId]: true }));
    }
  };

  const applyThreePreset = (preset) => {
    setThreeMode("body");
    setThreeOrgan(null);
    setThreeOpacities(preset.layers);
    setThreeLayers({
      skin: preset.layers.skin > 0,
      muscles: preset.layers.muscles > 0,
      organs: preset.layers.organs > 0,
      vessels: preset.layers.vessels > 0,
    });
  };

  const selectThreeOrgan = (organId) => {
    setThreeMode("organ");
    setThreeOrgan(organId);
    setSelectedDetail(ORGAN_INFO[organId] || null);
  };

  const organList = Object.entries(ORGAN_INFO).map(([id, info]) => ({
    id,
    ...info,
  }));

  return (
    <div className="flex w-full h-[100vh] bg-[#0a0a0a] text-white overflow-hidden relative font-sans select-none">
      {/* ----------------------------------------------------------- */}
      {/* Sidebar                                                     */}
      {/* ----------------------------------------------------------- */}
      <div className="w-80 md:w-96 bg-zinc-900/95 border-r border-zinc-800 flex flex-col z-20 shrink-0 backdrop-blur-md h-full">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Link
            to="/biology"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 hover:text-white"
            title="Biologiyaga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-emerald-400 leading-tight truncate">
              Odam Tanasi Simulyatori
            </h1>
            <p className="text-[11px] text-zinc-400 truncate">
              {engineMode === "sketchfab"
                ? "Sketchfab 3D Animatsiyali Model (9b0b079)"
                : "Three.js Mahalliy 3D WebGL"}
            </p>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold mb-1.5 px-0.5">
            <span>Dvigatel (Engine):</span>
            <span className="text-emerald-400 font-mono">
              {engineMode === "sketchfab" ? "Sketchfab 3D" : "WebGL Three.js"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setEngineMode("sketchfab");
                setSelectedDetail(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                engineMode === "sketchfab"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sketchfab 3D</span>
            </button>
            <button
              onClick={() => {
                setEngineMode("threejs");
                setSelectedDetail(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                engineMode === "threejs"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Three.js HD</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SKETCHFAB MODE SIDEBAR CONTROLS                           */}
        {/* ========================================================= */}
        {engineMode === "sketchfab" ? (
          <>
            {/* Sketchfab Subtabs */}
            <div className="px-3 pt-3 pb-1 border-b border-zinc-800/80">
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-semibold">
                <button
                  onClick={() => setSfTab("stages")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    sfTab === "stages"
                      ? "bg-zinc-800 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Bosqichlar
                </button>
                <button
                  onClick={() => setSfTab("layers")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    sfTab === "layers"
                      ? "bg-zinc-800 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Qatlamlar
                </button>
                <button
                  onClick={() => setSfTab("organs")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    sfTab === "organs"
                      ? "bg-zinc-800 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  A'zolar
                </button>
              </div>
            </div>

            {/* Scrollable Subtab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {sfTab === "stages" && (
                <section>
                  <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Animatsiya Bosqichlari</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatSeconds(sfCurrentTime)} / {formatSeconds(sfDuration)}
                    </span>
                  </h2>

                  <div className="space-y-2">
                    {SKETCHFAB_STAGES.map((stage) => {
                      const isActive =
                        Math.abs(sfCurrentTime - stage.time) < 4.0;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleSeek(stage.time)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isActive
                              ? "bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                              : "bg-zinc-800/50 border-zinc-700/60 hover:bg-zinc-800 hover:border-zinc-500"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-bold ${
                                isActive ? "text-emerald-300" : "text-zinc-200"
                              }`}
                            >
                              {stage.label}
                            </span>
                            <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                              {stage.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-snug">
                            {stage.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {sfTab === "layers" && (
                <section>
                  <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                    <span>3D Qatlamlarni Boshqarish</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Ko'rinish</span>
                  </h2>

                  <div className="space-y-2">
                    {SKETCHFAB_LAYERS.map((layer) => {
                      const isHidden = hiddenCategories.has(layer.id);
                      return (
                        <div
                          key={layer.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/60 hover:border-zinc-600 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-xs font-medium text-zinc-200">
                              {layer.name}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleSfCategory(layer.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              !isHidden
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : "bg-zinc-800 text-zinc-500 hover:text-zinc-400"
                            }`}
                            title={!isHidden ? "Qatlamni yashirish" : "Qatlamni ko'rsatish"}
                          >
                            {!isHidden ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {sfTab === "organs" && (
                <section>
                  <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider">
                    Anatomik A'zolar
                  </h2>
                  <div className="space-y-2">
                    {organList.map((organ) => (
                      <button
                        key={organ.id}
                        onClick={() => selectSketchfabOrgan(organ.id)}
                        className="w-full text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-emerald-500/50 transition-all flex items-start gap-2.5 group"
                      >
                        <span
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: organ.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 block truncate">
                            {organ.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                            {organ.system}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* THREE.JS MODE SIDEBAR CONTROLS                            */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Presets */}
            <section>
              <h2 className="text-xs uppercase font-bold text-zinc-400 mb-2.5 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tezkor Ko'rinishlar</span>
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                {BODY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyThreePreset(preset)}
                    className="text-left py-1.5 px-2.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 hover:border-emerald-500/50 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 transition-all truncate"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Individual Layers & Opacities */}
            <section>
              <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                <span>Anatomik Qatlamlar</span>
                <span className="text-[10px] text-zinc-500 font-normal">Shaffoflik</span>
              </h2>
              <div className="space-y-2.5">
                {BODY_LAYERS.map((layer) => {
                  const isVisible = threeLayers[layer.id];
                  const opacityVal = threeOpacities[layer.id];
                  const percent = Math.round(opacityVal * 100);

                  return (
                    <div
                      key={layer.id}
                      className={`rounded-xl p-3 border transition-all ${
                        isVisible && opacityVal > 0
                          ? "bg-zinc-800/60 border-zinc-700/80"
                          : "bg-zinc-900/40 border-zinc-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="text-xs font-semibold text-zinc-200">
                            {layer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400">
                            {percent}%
                          </span>
                          <button
                            onClick={() => toggleThreeLayer(layer.id)}
                            className={`p-1 rounded-md transition-colors ${
                              isVisible
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : "bg-zinc-800 text-zinc-500 hover:text-zinc-400"
                            }`}
                          >
                            {isVisible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacityVal}
                        onChange={(e) =>
                          handleThreeOpacityChange(layer.id, e.target.value)
                        }
                        className="w-full accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Organ list */}
            <section className="pt-2 border-t border-zinc-800/80">
              <h2 className="text-xs uppercase font-bold text-zinc-400 mb-2.5 tracking-wider">
                A'zolarni Ko'rish
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                {organList.map((organ) => (
                  <button
                    key={organ.id}
                    onClick={() => selectThreeOrgan(organ.id)}
                    className="text-left p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-emerald-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: organ.color }}
                      />
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-emerald-300 truncate">
                        {organ.shortName || organ.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3D Viewport                                                 */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 relative h-full">
        {/* Top Floating Badge */}
        <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/70 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-zinc-200">
              {engineMode === "sketchfab"
                ? "Animated Full Human Body Anatomy (AVRcontent)"
                : threeMode === "organ" && threeOrgan
                ? ORGAN_INFO[threeOrgan]?.name || "3D A'zo"
                : "To'liq Inson Tanasi (Multi-qatlamli 3D Atlas)"}
            </span>
          </div>

          {engineMode === "threejs" && threeMode === "organ" && (
            <button
              onClick={() => {
                setThreeMode("body");
                setThreeOrgan(null);
              }}
              className="bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/70 px-3 py-2 rounded-xl shadow-xl text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>To'liq tana</span>
            </button>
          )}
        </div>

        {/* 3D Canvas Rendering */}
        {engineMode === "sketchfab" ? (
          <SketchfabCanvas
            ref={sketchfabRef}
            speed={sfSpeed}
            paused={sfPaused}
            currentTime={sfCurrentTime}
            onTimeUpdate={(t) => setSfCurrentTime(t)}
            onDurationChange={(d) => setSfDuration(d)}
            hiddenCategories={hiddenCategories}
            onPick={() => {}}
          />
        ) : (
          <SimulatorCanvas
            selectedOrgan={threeMode === "organ" ? threeOrgan : null}
            speed={threeSpeed}
            paused={threePaused}
            layers={threeLayers}
            opacities={threeOpacities}
            onPick={(detail) => setSelectedDetail(detail)}
            frozen={!!selectedDetail}
            controlsRef={threeControlsRef}
          />
        )}

        {/* --------------------------------------------------------- */}
        {/* Floating Bottom Timeline & Playback Controls              */}
        {/* --------------------------------------------------------- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl px-6 py-3 flex items-center gap-5 shadow-2xl max-w-[90vw] w-auto">
          {/* Play / Pause */}
          <button
            onClick={engineMode === "sketchfab" ? toggleSfPause : () => setThreePaused(!threePaused)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-emerald-400 transition-colors shrink-0"
            title={(engineMode === "sketchfab" ? sfPaused : threePaused) ? "Davom ettirish" : "To'xtatish"}
          >
            {(engineMode === "sketchfab" ? sfPaused : threePaused) ? (
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            )}
            <span>
              {(engineMode === "sketchfab" ? sfPaused : threePaused)
                ? "Boshlash"
                : "To'xtatish"}
            </span>
          </button>

          <div className="w-px h-5 bg-zinc-700/80 shrink-0" />

          {/* Timeline Scrubber (in Sketchfab mode) */}
          {engineMode === "sketchfab" ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                {formatSeconds(sfCurrentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={sfDuration || 46.67}
                step="0.2"
                value={sfCurrentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-48 sm:w-64 accent-emerald-500 h-2 bg-zinc-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-zinc-400 shrink-0">
                {formatSeconds(sfDuration)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Jonli 3D WebGL</span>
            </div>
          )}

          <div className="w-px h-5 bg-zinc-700/80 shrink-0" />

          {/* Speed Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider hidden sm:inline">
              Tezlik
            </span>
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
              {[0.5, 1, 1.5, 2].map((s) => {
                const currentSpeed =
                  engineMode === "sketchfab" ? sfSpeed : threeSpeed;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (engineMode === "sketchfab") setSfSpeed(s);
                      else setThreeSpeed(s);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                      currentSpeed === s
                        ? "bg-emerald-500 text-zinc-950 font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* Selected Part Detail Panel                                */}
        {/* --------------------------------------------------------- */}
        {selectedDetail && (
          <div className="absolute top-6 right-6 w-80 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-5 shadow-2xl z-20 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
                  style={{
                    backgroundColor: selectedDetail.color || "#38bdf8",
                  }}
                />
                <h3 className="text-sm font-bold text-white leading-tight">
                  {selectedDetail.name || selectedDetail.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedDetail.system && (
              <span className="inline-block text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md mb-3">
                {selectedDetail.system}
              </span>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {selectedDetail.desc ||
                "Ushbu anatomik qism inson tanasining hayotiy faoliyatida muhim vazifani bajaradi."}
            </p>

            {(selectedDetail.fact || selectedDetail.funFact) && (
              <div className="border-t border-zinc-800 pt-3 bg-zinc-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Qiziqarli fakt</span>
                </div>
                <p className="text-xs text-zinc-400 leading-normal italic">
                  {selectedDetail.fact || selectedDetail.funFact}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulatorPage;
