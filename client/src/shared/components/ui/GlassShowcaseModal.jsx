import React, { useState } from "react";
import { X, Sparkles, RotateCw, ZoomIn, Eye, Layers } from "lucide-react";
import GlassObject from "@/shared/components/canvas-ui/GlassObject";

/**
 * GlassShowcaseModal — 3D Physical Glass Refraction & Dispersion Modal.
 * Powered by CanvasUI GlassObject (Three.js WebGL/WebGPU shaders).
 * Renders 3D models or SVGs as physical liquid glass with chromatic dispersion,
 * refraction caustics, clearcoat, and interactive orbit controls.
 */
export const GlassShowcaseModal = ({
  isOpen,
  onClose,
  modelSrc = "/models/flask-lab.glb",
  title = "3D Shisha Modeli (Glass Refraction)",
  subtitle = "Haqiqiy optik nur sinishi, xromatik dispersiya va muzlatilgan shisha effekti",
}) => {
  const [tint, setTint] = useState("#2dd4bf");
  const [ior, setIor] = useState(1.52); // Crown glass
  const [dispersion, setDispersion] = useState(0.8);
  const [roughness, setRoughness] = useState(0.08);
  const [autoRotate, setAutoRotate] = useState(true);

  if (!isOpen) return null;

  const GLASS_PRESETS = [
    { label: "Kristall Zangori (Emerald)", tint: "#2dd4bf", ior: 1.54, dispersion: 0.8 },
    { label: "Safir Moviy (Sapphire)", tint: "#38bdf8", ior: 1.77, dispersion: 1.2 },
    { label: "Yoqut Qizil (Ruby)", tint: "#f43f5e", ior: 1.76, dispersion: 0.9 },
    { label: "Oltin Qahrabo (Amber)", tint: "#f59e0b", ior: 1.62, dispersion: 0.6 },
    { label: "Muz Shisha (Frosted)", tint: "#e2e8f0", ior: 1.45, dispersion: 0.2, roughness: 0.35 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-zinc-950/90 border border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  CanvasUI GlassObject
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Glass Object Stage */}
        <div className="relative flex-1 bg-gradient-to-b from-[#030712] via-[#070d1b] to-[#02050c] overflow-hidden">
          {/* Glass Object Canvas Component */}
          <GlassObject
            src={modelSrc}
            ior={ior}
            thickness={1.8}
            roughness={roughness}
            dispersion={dispersion}
            clearcoat={0.9}
            tint={tint}
            tintDensity={0.65}
            scale={2.2}
            orbit={true}
            zoom={true}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            className="w-full h-full"
          />

          {/* Floating Instructions Pill */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md text-[11px] text-zinc-300 flex items-center gap-2 shadow-lg">
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sichqoncha bilan aylantiring va yaqinlashtiring</span>
          </div>

          {/* Quick Glass Material Presets */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Shisha turi:
              </span>
              {GLASS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setTint(preset.tint);
                    setIor(preset.ior);
                    setDispersion(preset.dispersion);
                    if (preset.roughness !== undefined) setRoughness(preset.roughness);
                    else setRoughness(0.08);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    tint === preset.tint
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  autoRotate
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin [animation-duration:8s]" : ""}`} />
                <span>360° Aylanish</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassShowcaseModal;
