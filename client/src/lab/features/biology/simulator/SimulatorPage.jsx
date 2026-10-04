import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Expand,
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
  THREE_STAGES,
  defaultLayerOpacity,
} from "./engine/anatomyData";

function formatSeconds(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

const THREE_DURATION = 30.0;

// Calculate explode factor (0..1) from animation time (0..30s)
function calcExplodeFromTime(time) {
  const t = Math.max(0, Math.min(THREE_DURATION, time));
  if (t < 4.0) return 0.0;
  if (t <= 12.0) return (t - 4.0) / 8.0;
  if (t <= 22.0) return 1.0;
  if (t <= 28.0) return 1.0 - (t - 22.0) / 6.0;
  return 0.0;
}

const SimulatorPage = () => {
  // Engine Mode: "threejs" (default primary WebGL) or "sketchfab" (reference model)
  const [engineMode, setEngineMode] = useState("threejs");

  // -------------------------------------------------------------
  // Native Three.js Mode States
  // -------------------------------------------------------------
  const [threeExplode, setThreeExplode] = useState(0.0); // 0 = assembled, 1 = exploded
  const [threeCurrentTime, setThreeCurrentTime] = useState(0.0);
  const [threePaused, setThreePaused] = useState(true);
  const [threeSpeed, setThreeSpeed] = useState(1);
  const [threeTab, setThreeTab] = useState("stages"); // "stages" | "layers" | "organs"
  const [threeOrganMode, setThreeOrganMode] = useState("atlas"); // "atlas" | "dedicated"
  const [threeOrgan, setThreeOrgan] = useState(null);
  const threeControlsRef = useRef(null);

  const [threeLayers, setThreeLayers] = useState({
    skin: true,
    organs: true,
    skeleton: true,
    vessels: true,
    muscles: true,
  });

  const [threeOpacities, setThreeOpacities] = useState({
    skin: 0.45,
    organs: 1.0,
    skeleton: 1.0,
    vessels: 0.95,
    muscles: 0.9,
  });

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

  // Common Detail Card State
  const [selectedDetail, setSelectedDetail] = useState(null);

  // -------------------------------------------------------------
  // Three.js Animation Loop (Playback & Explode Timeline)
  // -------------------------------------------------------------
  useEffect(() => {
    if (engineMode !== "threejs" || threePaused) return;

    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setThreeCurrentTime((prev) => {
        let next = prev + dt * threeSpeed;
        if (next >= THREE_DURATION) next = 0;
        setThreeExplode(calcExplodeFromTime(next));
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engineMode, threePaused, threeSpeed]);

  const handleThreeSeek = (time) => {
    const t = Math.max(0, Math.min(THREE_DURATION, time));
    setThreeCurrentTime(t);
    setThreeExplode(calcExplodeFromTime(t));
  };

  const handleManualExplodeChange = (val) => {
    const num = Math.max(0, Math.min(1, parseFloat(val)));
    setThreeExplode(num);
    setThreePaused(true); // pause auto-play on manual drag
  };

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
    setThreeOrgan(null);
    setThreeOrganMode("atlas");
    if (preset.explode != null) {
      setThreeExplode(preset.explode);
      setThreePaused(true);
    }
    if (preset.layers) {
      setThreeLayers({
        skin: (preset.layers.skin ?? 0) > 0,
        organs: (preset.layers.organs ?? 0) > 0,
        skeleton: (preset.layers.skeleton ?? 0) > 0,
        vessels: (preset.layers.vessels ?? 0) > 0,
        muscles: (preset.layers.muscles ?? 0) > 0,
      });
    }
    if (preset.opacities) {
      setThreeOpacities((prev) => ({ ...prev, ...preset.opacities }));
    }
  };

  const selectThreeOrgan = (organId) => {
    setThreeOrgan(organId);
    setSelectedDetail(ORGAN_INFO[organId] || null);
  };

  const recenterCamera = () => {
    if (engineMode === "threejs") {
      threeControlsRef.current?.reset?.();
    } else {
      sketchfabRef.current?.recenterCamera?.();
    }
  };

  // -------------------------------------------------------------
  // Sketchfab Control Callbacks
  // -------------------------------------------------------------
  const handleSfSeek = (time) => {
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
    handleSfSeek(targetTime);
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
              {engineMode === "threejs"
                ? "Three.js HD 3D Portlatilgan Atlas"
                : "Sketchfab 3D Animatsiyali Model"}
            </p>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold mb-1.5 px-0.5">
            <span>Dvigatel (Engine):</span>
            <span className="text-emerald-400 font-mono">
              {engineMode === "threejs" ? "WebGL Three.js HD" : "Sketchfab 3D"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
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
          </div>
        </div>

        {/* ========================================================= */}
        {/* THREE.JS HD MODE SIDEBAR CONTROLS                         */}
        {/* ========================================================= */}
        {engineMode === "threejs" ? (
          <>
            {/* Subtabs for Three.js */}
            <div className="px-3 pt-3 pb-1 border-b border-zinc-800/80">
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-semibold">
                <button
                  onClick={() => setThreeTab("stages")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    threeTab === "stages"
                      ? "bg-zinc-800 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Bosqichlar
                </button>
                <button
                  onClick={() => setThreeTab("layers")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    threeTab === "layers"
                      ? "bg-zinc-800 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Qatlamlar
                </button>
                <button
                  onClick={() => setThreeTab("organs")}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                    threeTab === "organs"
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
              {threeTab === "stages" && (
                <>
                  {/* Interactive Explode Slider */}
                  <section className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Portlatish (Ajratish)</span>
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-700">
                        {Math.round(threeExplode * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={threeExplode}
                      onChange={(e) => handleManualExplodeChange(e.target.value)}
                      className="w-full accent-emerald-500 h-2 bg-zinc-700 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold mt-1.5">
                      <span>0% Yig'ilgan</span>
                      <span>50% Oraliq</span>
                      <span>100% Portlatilgan</span>
                    </div>
                  </section>

                  {/* Stage Presets */}
                  <section>
                    <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                      <span>Animatsiya Bosqichlari</span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        {formatSeconds(threeCurrentTime)} / 00:30
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {THREE_STAGES.map((stage) => {
                        const isActive =
                          Math.abs(threeCurrentTime - stage.time) < 3.0;
                        return (
                          <button
                            key={stage.id}
                            onClick={() => handleThreeSeek(stage.time)}
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

                  {/* Quick System Presets */}
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
                          className="text-left py-2 px-2.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 hover:border-emerald-500/50 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 transition-all truncate"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {threeTab === "layers" && (
                <section>
                  <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                    <span>5 Ta Anatomik Tizim</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      Shaffoflik & Ko'rinish
                    </span>
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
                                {layer.icon} {layer.name}
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
                                title={
                                  isVisible
                                    ? "Qatlamni yashirish"
                                    : "Qatlamni ko'rsatish"
                                }
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
              )}

              {threeTab === "organs" && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                      Anatomik A'zolar
                    </h2>
                    {/* Organ view mode toggle */}
                    <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                      <button
                        onClick={() => setThreeOrganMode("atlas")}
                        className={`px-2 py-0.5 rounded transition-all ${
                          threeOrganMode === "atlas"
                            ? "bg-zinc-800 text-emerald-400 font-bold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                        title="To'liq atlasda ko'rish"
                      >
                        Atlas
                      </button>
                      <button
                        onClick={() => setThreeOrganMode("dedicated")}
                        className={`px-2 py-0.5 rounded transition-all ${
                          threeOrganMode === "dedicated"
                            ? "bg-zinc-800 text-emerald-400 font-bold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                        title="Alohida 3D a'zo"
                      >
                        Alohida HD
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {organList.map((organ) => (
                      <button
                        key={organ.id}
                        onClick={() => selectThreeOrgan(organ.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 group ${
                          threeOrgan === organ.id
                            ? "bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                            : "bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/60 hover:border-emerald-500/50"
                        }`}
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
          /* SKETCHFAB MODE SIDEBAR CONTROLS                           */
          /* ========================================================= */
          <>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {sfTab === "stages" && (
                <section>
                  <h2 className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center justify-between">
                    <span>Animatsiya Bosqichlari</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {formatSeconds(sfCurrentTime)} / 00:46
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {SKETCHFAB_STAGES.map((stage) => {
                      const isActive =
                        Math.abs(sfCurrentTime - stage.time) < 4.0;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleSfSeek(stage.time)}
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
                    <span className="text-[10px] text-zinc-500 font-normal">
                      Ko'rinish
                    </span>
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
                            title={
                              !isHidden
                                ? "Qatlamni yashirish"
                                : "Qatlamni ko'rsatish"
                            }
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
              {engineMode === "threejs"
                ? threeOrganMode === "dedicated" && threeOrgan
                  ? ORGAN_INFO[threeOrgan]?.name || "3D A'zo"
                  : threeExplode > 0.15
                  ? `⚡ Three.js HD: Portlatilgan Atlas (${Math.round(
                      threeExplode * 100,
                    )}%)`
                  : "⚡ Three.js HD: Yaxlit Inson Tanasi"
                : "Animated Full Human Body Anatomy (AVRcontent)"}
            </span>
          </div>

          {engineMode === "threejs" &&
            threeOrganMode === "dedicated" &&
            threeOrgan && (
              <button
                onClick={() => {
                  setThreeOrganMode("atlas");
                  setThreeOrgan(null);
                }}
                className="bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/70 px-3 py-2 rounded-xl shadow-xl text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>To'liq atlasga qaytish</span>
              </button>
            )}
        </div>

        {/* 3D Canvas Rendering */}
        {engineMode === "threejs" ? (
          <SimulatorCanvas
            selectedOrgan={threeOrgan}
            isDedicated={threeOrganMode === "dedicated"}
            explode={threeExplode}
            speed={threeSpeed}
            paused={threePaused}
            layers={threeLayers}
            opacities={threeOpacities}
            onPick={(detail) => setSelectedDetail(detail)}
            frozen={!!selectedDetail}
            controlsRef={threeControlsRef}
          />
        ) : (
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
        )}

        {/* --------------------------------------------------------- */}
        {/* Floating Bottom Timeline & Playback Controls              */}
        {/* --------------------------------------------------------- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl px-6 py-3 flex items-center gap-5 shadow-2xl max-w-[90vw] w-auto">
          {/* Play / Pause Toggle */}
          <button
            onClick={
              engineMode === "threejs"
                ? () => setThreePaused(!threePaused)
                : toggleSfPause
            }
            className="flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-emerald-400 transition-colors shrink-0"
            title={
              (engineMode === "threejs" ? threePaused : sfPaused)
                ? "Davom ettirish"
                : "To'xtatish"
            }
          >
            {(engineMode === "threejs" ? threePaused : sfPaused) ? (
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            )}
            <span>
              {(engineMode === "threejs" ? threePaused : sfPaused)
                ? "Boshlash"
                : "To'xtatish"}
            </span>
          </button>

          <div className="w-px h-5 bg-zinc-700/80 shrink-0" />

          {/* Interactive Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
              {formatSeconds(
                engineMode === "threejs" ? threeCurrentTime : sfCurrentTime,
              )}
            </span>
            <input
              type="range"
              min="0"
              max={engineMode === "threejs" ? THREE_DURATION : sfDuration || 46.67}
              step="0.1"
              value={
                engineMode === "threejs" ? threeCurrentTime : sfCurrentTime
              }
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (engineMode === "threejs") handleThreeSeek(val);
                else handleSfSeek(val);
              }}
              className="w-44 sm:w-64 accent-emerald-500 h-2 bg-zinc-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-400 shrink-0">
              {formatSeconds(
                engineMode === "threejs" ? THREE_DURATION : sfDuration,
              )}
            </span>
          </div>

          <div className="w-px h-5 bg-zinc-700/80 shrink-0" />

          {/* Speed Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider hidden sm:inline">
              Tezlik
            </span>
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
              {[0.5, 1, 1.5, 2].map((s) => {
                const currentSpeed =
                  engineMode === "threejs" ? threeSpeed : sfSpeed;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (engineMode === "threejs") setThreeSpeed(s);
                      else setSfSpeed(s);
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

          <div className="w-px h-5 bg-zinc-700/80 shrink-0" />

          {/* Recenter Camera */}
          <button
            onClick={recenterCamera}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Kamerani markazga qaytarish"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
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
                  style={{ backgroundColor: selectedDetail.color || "#10b981" }}
                />
                <h3 className="text-sm font-bold text-zinc-100">
                  {selectedDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDetail.system && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full mb-3">
                {selectedDetail.system}
              </span>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {selectedDetail.desc}
            </p>

            {selectedDetail.fact && (
              <div className="p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-xs text-zinc-400">
                <span className="font-semibold text-emerald-400 block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Qiziqarli fakt</span>
                </span>
                {selectedDetail.fact}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulatorPage;
