import React from "react";
import { Link } from "react-router-dom";
import { SUBJECTS } from "@/lab/data/subjects";
import Reveal from "./Reveal";
import {
  FlaskConical,
  Dna,
  Atom,
  Cpu,
  Landmark,
  Sparkles,
  ArrowRight,
  Compass,
} from "lucide-react";

const SUBJECT_ICONS = {
  chemistry: FlaskConical,
  biology: Dna,
  physics: Atom,
  electronics: Cpu,
  history: Landmark,
};

// Island centers on a BOARD_W x BOARD_H board (desktop map).
const BOARD_W = 1000;
const BOARD_H = 380;
const SPOTS = [
  { x: 140, y: 260 },
  { x: 320, y: 120 },
  { x: 500, y: 260 },
  { x: 680, y: 120 },
  { x: 860, y: 260 },
];

const pathD = SPOTS.map((p, i, all) => {
  if (i === 0) return `M${p.x} ${p.y}`;
  const prev = all[i - 1];
  const mx = (prev.x + p.x) / 2;
  return `C${mx} ${prev.y} ${mx} ${p.y} ${p.x} ${p.y}`;
}).join(" ");

const DesktopMap = () => (
  <Reveal className="relative mt-12 hidden aspect-[1000/380] w-full lg:block">
    <svg
      viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
      className="absolute inset-0 size-full pointer-events-none"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="25%" stopColor="#06b6d4" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#8b5cf6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Outer blurred glow */}
      <path
        d={pathD}
        stroke="url(#orbitGlow)"
        strokeWidth="12"
        strokeLinecap="round"
        className="opacity-40 blur-sm"
      />
      {/* Sharp animated dashed line */}
      <path
        d={pathD}
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray="8 8"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>

    {SUBJECTS.map((subject, index) => {
      const spot = SPOTS[index];
      const IconComp = SUBJECT_ICONS[subject.slug] || Compass;
      return (
        <Link
          key={subject.slug}
          to={`/${subject.slug}`}
          className="group absolute flex w-48 -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-visible:outline-none transition-transform duration-300 hover:scale-105"
          style={{
            left: `${(spot.x / BOARD_W) * 100}%`,
            top: `${(spot.y / BOARD_H) * 100}%`,
          }}
        >
          {/* Glowing Orb Node */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute -inset-3 rounded-full blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-300"
              style={{ backgroundColor: subject.color }}
            />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-transform duration-300 group-hover:-translate-y-1"
              style={{
                backgroundColor: `${subject.color}25`,
                borderColor: subject.color,
                color: "#ffffff",
              }}
            >
              <IconComp className="w-8 h-8" />
            </div>
            <span
              className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-lg"
              style={{
                backgroundColor: "#090b12",
                borderColor: subject.color,
                color: subject.color,
              }}
            >
              0{index + 1}
            </span>
          </div>

          {/* Info Card */}
          <div className="mt-4 w-full p-3 rounded-2xl bg-zinc-950/85 border border-zinc-800/90 shadow-xl backdrop-blur-md text-center transition-all duration-300 group-hover:border-zinc-700">
            <p
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: subject.color }}
            >
              {subject.title}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {subject.topics.length} ta interaktiv mavzu
            </p>
          </div>
        </Link>
      );
    })}
  </Reveal>
);

const MobileCards = () => (
  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
    {SUBJECTS.map((subject, i) => {
      const IconComp = SUBJECT_ICONS[subject.slug] || Compass;
      return (
        <Reveal key={subject.slug} delay={i * 60}>
          <Link
            to={`/${subject.slug}`}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 shadow-lg backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${subject.color}20`,
                borderColor: `${subject.color}50`,
                color: subject.color,
              }}
            >
              <IconComp className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ color: subject.color }}
                >
                  0{i + 1}-yo'nalish
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {subject.topics.length} ta mavzu
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {subject.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {subject.short}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </Reveal>
      );
    })}
  </div>
);

const WorldMapSection = () => (
  <section id="subjects" className="relative isolate scroll-mt-20 overflow-hidden py-20 md:py-28">
    <div className="container mx-auto px-4">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ilmiy Yo'nalishlar Xaritasi</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Besh Katta Fan, Bitta Laboratoriya
          </h2>
          <p className="mt-3 text-zinc-400 text-sm md:text-base leading-relaxed">
            Har bir soha o'ziga xos 3D simulyatsiyalari va laboratoriya xonalari bilan jihozlangan. O'zingiz xohlagan fanni bosing va virtual olamga kiring.
          </p>
        </div>
      </Reveal>
      <DesktopMap />
      <MobileCards />
    </div>
  </section>
);

export default WorldMapSection;

