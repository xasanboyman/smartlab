import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layers, FlaskConical, Glasses, Sparkles, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import WobbleRippleButton from "@/shared/components/3d/html-in-canvas/WobbleRippleButton";

const CtaSection = () => {
  const navigate = useNavigate();
  const enterLabVR = () => navigate("/chemistry/lab?vr=1");

  return (
    <section className="container mx-auto px-4 pb-20 md:pb-28">
      <Reveal className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 px-6 py-14 sm:py-20 text-center shadow-2xl backdrop-blur-2xl">
        {/* Ambient radial lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-60"
        />

        {/* Feature badge */}
        <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Barcha Simulyatsiyalar Ochiq & Bepul</span>
        </div>

        <h2 className="relative mx-auto max-w-3xl text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Birinchi tajribangizni{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            hoziroq boshlang
          </span>
        </h2>

        <p className="relative mx-auto mt-4 max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
          Laboratoriya ochiq: ro'yxatdan o'tish ham, ilova o'rnatish ham talab etilmaydi.
          Bitta bosishda 3D sahnaga kiring va fanni yangi bosqichda kashf eting.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3.5 z-10">
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
      </Reveal>
    </section>
  );
};

export default CtaSection;

