import React, { useState, useRef } from "react";
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
  Maximize2,
  Info,
} from "lucide-react";
import SimulatorCanvas from "./SimulatorCanvas";
import {
  BODY_LAYERS,
  BODY_PRESETS,
  ORGAN_INFO,
  defaultLayerOpacity,
} from "./engine/anatomyData";

const SimulatorPage = () => {
  // Navigation mode: "body" (Full Multi-Layer Body) or "organ" (Dedicated Organ Inspector)
  const [mode, setMode] = useState("body");
  const [selectedOrgan, setSelectedOrgan] = useState(null);

  // Layers state for Full Body mode
  const [layers, setLayers] = useState({
    skin: true,
    muscles: true,
    organs: true,
    vessels: true,
  });

  const [opacities, setOpacities] = useState({
    skin: defaultLayerOpacity("skin"),
    muscles: defaultLayerOpacity("muscles"),
    organs: defaultLayerOpacity("organs"),
    vessels: defaultLayerOpacity("vessels"),
  });

  // Animation Controls
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  // Detail Modal / Info state
  const [selectedDetail, setSelectedDetail] = useState(null);
  const controlsRef = useRef(null);

  const toggleLayer = (layerId) => {
    setLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleOpacityChange = (layerId, val) => {
    const num = parseFloat(val);
    setOpacities((prev) => ({ ...prev, [layerId]: num }));
    if (num > 0 && !layers[layerId]) {
      setLayers((prev) => ({ ...prev, [layerId]: true }));
    }
  };

  const applyPreset = (preset) => {
    setMode("body");
    setSelectedOrgan(null);
    setOpacities(preset.layers);
    setLayers({
      skin: preset.layers.skin > 0,
      muscles: preset.layers.muscles > 0,
      organs: preset.layers.organs > 0,
      vessels: preset.layers.vessels > 0,
    });
  };

  const selectOrganItem = (organId) => {
    setMode("organ");
    setSelectedOrgan(organId);
    setSelectedDetail(ORGAN_INFO[organId] || null);
  };

  const switchToFullBody = () => {
    setMode("body");
    setSelectedOrgan(null);
    setSelectedDetail(null);
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const organList = Object.entries(ORGAN_INFO).map(([id, info]) => ({
    id,
    ...info,
  }));

  const activeTitle =
    mode === "organ" && selectedOrgan && ORGAN_INFO[selectedOrgan]
      ? ORGAN_INFO[selectedOrgan].name
      : "To'liq Inson Tanasi (Multi-qatlamli 3D Atlas)";

  return (
    <div className="flex w-full h-[100vh] bg-[#0a0a0a] text-white overflow-hidden relative font-sans">
      {/* ----------------------------------------------------------- */}
      {/* Sidebar                                                     */}
      {/* ----------------------------------------------------------- */}
      <div className="w-84 bg-zinc-900/95 border-r border-zinc-800 flex flex-col z-20 shrink-0 backdrop-blur-md">
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
              Interaktiv Yuqori Aniqlikdagi 3D Atlas
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={switchToFullBody}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "body"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>To'liq tana</span>
            </button>
            <button
              onClick={() => {
                setMode("organ");
                if (!selectedOrgan) selectOrganItem("heart");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "organ"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>A'zolar (3D)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* ======================================================== */}
          {/* TAB 1: FULL BODY LAYERS                                  */}
          {/* ======================================================== */}
          {mode === "body" ? (
            <>
              {/* Presets */}
              <section>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tezkor Ko'rinishlar</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {BODY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
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
                    const isVisible = layers[layer.id];
                    const opacityVal = opacities[layer.id];
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
                              onClick={() => toggleLayer(layer.id)}
                              className={`p-1 rounded-md transition-colors ${
                                isVisible
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-400"
                              }`}
                              title={isVisible ? "Qatlamni yashirish" : "Qatlamni ko'rsatish"}
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
                          onChange={(e) => handleOpacityChange(layer.id, e.target.value)}
                          className="w-full accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Quick links to dedicated 3D organs */}
              <section className="pt-2 border-t border-zinc-800/80">
                <h2 className="text-xs uppercase font-bold text-zinc-400 mb-2.5 tracking-wider">
                  Batafsil A'zoni Ko'rish
                </h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {organList.slice(0, 6).map((organ) => (
                    <button
                      key={organ.id}
                      onClick={() => selectOrganItem(organ.id)}
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
            </>
          ) : (
            /* ======================================================== */
            /* TAB 2: DEDICATED 3D ORGANS & STRUCTURES                  */
            /* ======================================================== */
            <>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                    3D Anatomik A'zolar
                  </h2>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                    12 ta model
                  </span>
                </div>

                <div className="space-y-2">
                  {organList.map((organ) => {
                    const isSelected = selectedOrgan === organ.id;
                    return (
                      <button
                        key={organ.id}
                        onClick={() => selectOrganItem(organ.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                            : "bg-zinc-800/60 border-zinc-700/70 hover:bg-zinc-800 hover:border-zinc-500"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 shadow-sm"
                          style={{ backgroundColor: organ.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold leading-snug ${
                                isSelected ? "text-emerald-300" : "text-zinc-200"
                              }`}
                            >
                              {organ.name}
                            </span>
                            {organ.hasAnimation && (
                              <span className="text-[9px] bg-red-500/20 text-red-300 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 shrink-0 animate-pulse">
                                Jonli
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                            {organ.system}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                onClick={switchToFullBody}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>To'liq tanaga qaytish</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3D Canvas Viewport                                          */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 relative h-full">
        {/* Top Floating Header Indicator */}
        <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/70 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-zinc-200">{activeTitle}</span>
          </div>

          {mode === "organ" && (
            <button
              onClick={switchToFullBody}
              className="bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/70 px-3 py-2 rounded-xl shadow-xl text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>To'liq tana</span>
            </button>
          )}
        </div>

        {/* 3D Canvas */}
        <SimulatorCanvas
          selectedOrgan={mode === "organ" ? selectedOrgan : null}
          speed={speed}
          paused={paused}
          layers={layers}
          opacities={opacities}
          onPick={(detail) => setSelectedDetail(detail)}
          frozen={!!selectedDetail}
          controlsRef={controlsRef}
        />

        {/* --------------------------------------------------------- */}
        {/* Floating Bottom Animation & Camera Controls               */}
        {/* --------------------------------------------------------- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl px-5 py-2.5 flex items-center gap-5 shadow-2xl">
          {/* Play / Pause */}
          <button
            onClick={() => setPaused(!paused)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-emerald-400 transition-colors"
            title={paused ? "Davom ettirish" : "To'xtatish"}
          >
            {paused ? (
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            )}
            <span>{paused ? "Harakatni boshlash" : "Harakatni to'xtatish"}</span>
          </button>

          <div className="w-px h-5 bg-zinc-700/80" />

          {/* Speed Slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
              Tezlik
            </span>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-md border border-zinc-700">
              {speed}x
            </span>
          </div>

          <div className="w-px h-5 bg-zinc-700/80" />

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            title="Kamerani dastlabki holatga qaytarish"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kamera</span>
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
