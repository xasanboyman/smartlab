import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  FlaskConical,
  Glasses,
  Layers,
  ArrowRight,
  ChevronDown,
  Atom,
  Dna,
} from "lucide-react";
import { SUBJECTS } from "@/lab/data/subjects";
import HtmlClothCanvas from "@/shared/components/3d/HtmlClothCanvas";
import WobbleRippleButton from "@/shared/components/3d/html-in-canvas/WobbleRippleButton";

export const HeroSection = () => {
  const navigate = useNavigate();
  const enterLabVR = () => navigate("/chemistry/lab?vr=1");

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-500/15 via-cyan-500/15 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm backdrop-blur-md mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>4K PBR 3D • Chrome HTML-in-Canvas • VR & AI Studio</span>
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
          Inson anatomiyasi, molekulalar, gaz qonunlari va kvant fizikani brauzerning o'zida 
          aylantirib, qatlamlarga ajratib va 3D kesib o'rganing. Yoningizda AI o'qituvchi, xohlasangiz VR.
        </p>

        {/* Action Buttons with HTML-in-Canvas Wobble Ripples */}
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
        </div>

        {/* Centerpiece: 3D HTML-in-Canvas Physical Cloth Simulation */}
        <div className="relative mt-10 w-full max-w-5xl rounded-3xl bg-zinc-950/40 border border-zinc-800/80 shadow-2xl p-2 sm:p-4 backdrop-blur-xl">
          <HtmlClothCanvas />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
