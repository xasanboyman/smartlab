import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  FlaskConical,
  Glasses,
  Layers,
  ArrowRight,
  Crosshair,
  Atom,
  Dna,
  Zap,
} from "lucide-react";
import Liquid from "@/shared/components/canvas-ui/Liquid";
import HtmlClothCanvas from "@/shared/components/3d/HtmlClothCanvas";
import WobbleRippleButton from "@/shared/components/3d/html-in-canvas/WobbleRippleButton";
import DecryptHeader from "@/shared/components/ui/DecryptHeader";
import LabShooterGame from "@/shared/components/ui/LabShooterGame";

/**
 * HeroSection — SmartLab 3D Futuristic Landing Hero.
 * Powered by CanvasUI GPU Liquid simulation (pointer-driven Navier-Stokes fluid dye),
 * Chrome HTML-in-Canvas physical cloth banner, Wobble ripple buttons, and Duck Hunt target practice.
 */
export const HeroSection = () => {
  const navigate = useNavigate();
  const enterLabVR = () => navigate("/chemistry/lab?vr=1");
  const [isDuckHuntOpen, setIsDuckHuntOpen] = useState(false);

  return (
    <Liquid
      color={[0.12, 0.85, 0.65]}
      intensity={0.4}
      distortion={5}
      blend={0.35}
      curl={20}
      radius={0.06}
      force={3.5}
      densityDissipation={0.97}
      velocityDissipation={0.98}
      className="relative isolate overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24"
    >
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-500/15 via-cyan-500/15 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative flex flex-col items-center text-center">
        {/* Top Feature Pill with Decrypt Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm backdrop-blur-md mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <DecryptHeader
            text="4K PBR 3D • Chrome HTML-in-Canvas • GPU Liquid • VR & AI"
            color="#34d399"
            className="text-xs text-emerald-400 font-mono tracking-wider font-semibold"
          />
        </div>

        {/* Hero Title */}
        <h1 className="font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-white max-w-4xl leading-[1.08]">
          Fanni o'qib emas,{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            3D Tajribada
          </span>{" "}
          his eting
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 max-w-2xl text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
          Inson anatomiyasi, molekulalar, gaz qonunlari va kimyoviy reaksiyalarni brauzerning o'zida 
          aylantirib, qatlamlarga ajratib va 3D kesib o'rganing. Yoningizda AI o'qituvchi, xohlasangiz VR.
        </p>

        {/* Action Buttons with HTML-in-Canvas Wobble Ripples & Easter Eggs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 z-10">
          <WobbleRippleButton
            to="/biology/simulator"
            variant="emerald"
            size="lg"
            icon={Layers}
            className="shadow-xl"
          >
            <span>3D Inson Anatomiyasi</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </WobbleRippleButton>

          <WobbleRippleButton
            to="/chemistry/lab"
            variant="cyan"
            size="lg"
            icon={FlaskConical}
          >
            <span>Kimyo Laboratoriyasi</span>
          </WobbleRippleButton>

          <WobbleRippleButton
            onClick={enterLabVR}
            variant="glass"
            size="lg"
            icon={Glasses}
          >
            <span>VR Rejim</span>
          </WobbleRippleButton>

          {/* Wes Bos Duck Hunt Shooter Button */}
          <button
            type="button"
            onClick={() => setIsDuckHuntOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-lg hover:scale-105 cursor-pointer"
            title="Duck Hunt TODO ilmiy nishon mashqini ochish"
          >
            <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Duck Hunt O'yin</span>
          </button>
        </div>

        {/* Centerpiece: 3D HTML-in-Canvas Physical Cloth Simulation */}
        <div className="relative mt-10 w-full max-w-5xl rounded-3xl bg-zinc-950/50 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2 sm:p-4 backdrop-blur-xl">
          <HtmlClothCanvas />
        </div>
      </div>

      {/* Wes Bos Duck Hunt Shooter Game Modal */}
      <LabShooterGame
        isOpen={isDuckHuntOpen}
        onClose={() => setIsDuckHuntOpen(false)}
      />
    </Liquid>
  );
};

export default HeroSection;
