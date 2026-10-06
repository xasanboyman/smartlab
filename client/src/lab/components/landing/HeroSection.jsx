import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  FlaskConical,
  Glasses,
  Layers,
  ArrowRight,
  Atom,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Palette,
} from "lucide-react";
import Liquid from "@/shared/components/canvas-ui/Liquid";
import DecryptHeader from "@/shared/components/ui/DecryptHeader";

export const HeroSection = () => {
  const navigate = useNavigate();
  const [fluidTheme, setFluidTheme] = useState("emerald");

  const FLUID_CONFIGS = {
    emerald: { color: [0.08, 0.75, 0.55], rainbow: false, label: "Biologik Zumrad" },
    cyan: { color: [0.12, 0.65, 0.95], rainbow: false, label: "Kvant Moviy" },
    amber: { color: [0.95, 0.6, 0.1], rainbow: false, label: "Kimyoviy Oltin" },
  };

  const activeFluid = FLUID_CONFIGS[fluidTheme] || FLUID_CONFIGS.emerald;

  const cycleFluidTheme = () => {
    const keys = Object.keys(FLUID_CONFIGS);
    const nextIdx = (keys.indexOf(fluidTheme) + 1) % keys.length;
    setFluidTheme(keys[nextIdx]);
  };

  const SUBJECT_SHOWCASES = [
    {
      title: "Biologiya & 3D Anatomiya",
      desc: "206 ta suyak, 600+ mushak tolalari, ichki a'zolar va qon tomirlar. 360° CT/MRI kesim va o'zbekcha audio sharh.",
      icon: Layers,
      color: "#10b981",
      badge: "6 Qatlam • 3D Kesim",
      link: "/biology/simulator",
      tagText: "O'rganish",
    },
    {
      title: "Kimyo & Reaksiyalar",
      desc: "3D virtual laboratoriya xonasida erkin yuring, probirka va reaktivlarni aralashtiring, 118 ta elementni kashf qiling.",
      icon: FlaskConical,
      color: "#06b6d4",
      badge: "Probirkalar • VR Rejim",
      link: "/chemistry/lab",
      tagText: "Tajriba qilish",
    },
    {
      title: "Fizika & Sxemotexnika",
      desc: "Kuchlar muvozanati, gaz qonunlari, to'lqinlar interferensiyasi va Arduino asosidagi elektr sxemalari.",
      icon: Atom,
      color: "#f59e0b",
      badge: "Mexanika • Sxemalar",
      link: "/physics/engine",
      tagText: "Sinash",
    },
    {
      title: "Tarixiy Obidalar 3D",
      desc: "Samarqand Registon ansambli me'morchiligi, madrasalar devoriy bezaklari va qadimiy osori-atiqalar 3D modeli.",
      icon: Landmark,
      color: "#8b5cf6",
      badge: "3D Arxitektura • Tarix",
      link: "/history/registan",
      tagText: "Kashf qilish",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-[#050811] min-h-[92vh] flex flex-col justify-center">
      {/* 1. Subtle GPU Fluid Simulation Backdrop */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
        <Liquid
          color={activeFluid.color}
          rainbow={activeFluid.rainbow}
          intensity={0.45}
          distortion={3}
          blend={0.3}
          curl={20}
          radius={0.075}
          force={3.2}
          densityDissipation={0.96}
          velocityDissipation={0.98}
          className="w-full h-full"
        >
          <div className="w-full h-full" />
        </Liquid>
      </div>

      {/* 2. Soft Radial Atmospheric Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-emerald-500/12 via-cyan-500/12 to-indigo-500/8 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Subtle Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* 3. Hero Content */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <DecryptHeader
              text="Interaktiv 3D Ilmiy Ta'lim Platformasi • O'zbekiston"
              color="#34d399"
              className="text-xs text-emerald-400 font-mono tracking-wider font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={cycleFluidTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-md"
            title="Suyuqlik rangi va oqim rejimini almashtirish"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mavzu: <span className="font-semibold text-white">{activeFluid.label}</span></span>
          </button>
        </div>

        {/* Hero Title */}
        <h1 className="font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-white max-w-4xl leading-[1.12]">
          Fanlarni statik emas,{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            3D Interaktiv
          </span>{" "}
          kashf eting
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 max-w-2xl text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
          Inson anatomiyasini qatlamma-qatlam kesing, kimyoviy reaksiyalarni xavfsiz probirkalarda aralashtiring,
          fizika qonunlarini sinab ko'ring. Barchasi bepul, brauzeringizda va o'zbek tilida.
        </p>

        {/* Educational Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 z-10">
          <Link
            to="/biology/simulator"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Layers className="w-4 h-4" />
            <span>3D Anatomiya Simulyatori</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/chemistry/lab"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/50 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>3D Kimyo Xonasi</span>
          </Link>

          <Link
            to="/chemistry/lab?vr=1"
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm transition-all shadow-md"
            title="Mobil Cardboard yoki VR ko'zoynak"
          >
            <Glasses className="w-4 h-4 text-purple-400" />
            <span>VR Rejim</span>
          </Link>
        </div>

        {/* Educational Highlights Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Maktab va OTM dasturiga mos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>100% Bepul & O'rnatishsiz</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>O'zbekcha Ovozli Tushuntirish</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Xavfsiz Virtual Tajribalar</span>
          </div>
        </div>

        {/* 4 Core Subject Interactive Showcase Cards */}
        <div className="mt-12 w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {SUBJECT_SHOWCASES.map((card) => {
            const IconComp = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group p-5 rounded-3xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Accent glow line on top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all opacity-80 group-hover:h-1.5"
                  style={{ backgroundColor: card.color }}
                />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${card.color}15`,
                        borderColor: `${card.color}35`,
                        color: card.color,
                      }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${card.color}10`,
                        borderColor: `${card.color}30`,
                        color: card.color,
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-white">
                  <span>{card.tagText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
