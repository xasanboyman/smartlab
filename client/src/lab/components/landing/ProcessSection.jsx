import React from "react";
import { Compass, Layers, Bot, ArrowRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import CompizCard from "@/shared/components/3d/html-in-canvas/CompizCard";

const STEPS = [
  {
    step: "01",
    icon: Compass,
    title: "Fanni tanlang",
    text: "Kimyo, Biologiya, Fizika, Elektronika yoki Tarix: o'zingizni qiziqtirgan ilmiy yo'nalishni bitta bosishda oching.",
    color: "#10b981",
  },
  {
    step: "02",
    icon: Layers,
    title: "Mavzuni 3D da sinab ko'ring",
    text: "3D sahnada modelni 360° aylantiring, qatlamlarni ajrating, 3D kesim qiling va parametrlarni o'zgartirib natijani kuzating.",
    color: "#06b6d4",
  },
  {
    step: "03",
    icon: Bot,
    title: "AI ilmiy hamrohdan so'rang",
    text: "Tushunmagan joyingizni o'sha sahnaning o'zida Mira AI o'qituvchidan o'zbek tilida so'rang va testlar bilan bilimlarni mustahkamlang.",
    color: "#8b5cf6",
  },
];

const ProcessSection = () => (
  <section className="container mx-auto px-4 py-20 md:py-28 relative">
    <Reveal>
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tez & Oson Jarayon • Compiz Fluid Interfeys</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Uch Qadamda Tajribaga
        </h2>
        <p className="mt-3 text-zinc-400 text-sm md:text-base leading-relaxed">
          Ro'yxatdan o'tish, dastur o'rnatish yoki qo'shimcha maxsus jihoz shart emas.
        </p>
      </div>
    </Reveal>

    <div className="relative grid gap-8 md:grid-cols-3">
      {STEPS.map(({ step, icon: IconComp, title, text, color }, i) => (
        <Reveal key={title} delay={i * 120} className="relative">
          <CompizCard wobbleIntensity={1.2} glowColor={`${color}33`} className="h-full">
            <div className="group h-full p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
              {/* Ambient hover glow */}
              <div
                className="absolute -right-12 -top-12 w-36 h-36 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: color }}
              />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${color}15`,
                      borderColor: `${color}35`,
                      color: color,
                    }}
                  >
                    <IconComp className="w-7 h-7" />
                  </div>
                  <span
                    className="text-2xl font-black font-mono tracking-tight"
                    style={{ color: `${color}` }}
                  >
                    {step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {title}
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {text}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center text-xs font-semibold text-zinc-500 group-hover:text-emerald-400 transition-colors">
                <span>Tajribani boshlash</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </CompizCard>
        </Reveal>
      ))}
    </div>
  </section>
);

export default ProcessSection;

