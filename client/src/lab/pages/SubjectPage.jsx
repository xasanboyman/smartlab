// Lists the topics of one subject (/:subject)
import React from "react";
import { Link, useParams } from "react-router-dom";
import { SUBJECTS, getSubject } from "@/lab/data/subjects";
import LevelPath from "@/lab/components/subject/LevelPath";
import NotFoundPage from "./NotFoundPage";
import {
  FlaskConical,
  Dna,
  Atom,
  Cpu,
  Landmark,
  ArrowLeft,
  Sparkles,
  Layers,
  ArrowRight,
  Glasses,
  Play,
  Scissors,
} from "lucide-react";
import WobbleRippleButton from "@/shared/components/3d/html-in-canvas/WobbleRippleButton";
import CompizCard from "@/shared/components/3d/html-in-canvas/CompizCard";

const SUBJECT_ICONS = {
  chemistry: FlaskConical,
  biology: Dna,
  physics: Atom,
  electronics: Cpu,
  history: Landmark,
};

const SubjectPage = () => {
  const { subject: slug } = useParams();
  const subject = getSubject(slug);
  if (!subject) return <NotFoundPage />;

  const IconComp = SUBJECT_ICONS[subject.slug] || Dna;

  return (
    <div className="relative isolate min-h-screen pb-20 bg-[#090b12] text-zinc-100">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: subject.color }}
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Bosh sahifaga qaytish</span>
        </Link>

        {/* Subject Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-2xl"
              style={{
                backgroundColor: `${subject.color}20`,
                borderColor: subject.color,
                color: subject.color,
              }}
            >
              <IconComp className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase"
                  style={{
                    backgroundColor: `${subject.color}15`,
                    borderColor: `${subject.color}40`,
                    color: subject.color,
                  }}
                >
                  {subject.title} Laboratoriyasi
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {subject.topics.length} ta interaktiv mavzu
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {subject.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-xl">
                {subject.short}
              </p>
            </div>
          </div>

          {/* Quick link button depending on subject */}
          {subject.slug === "biology" && (
            <Link
              to="/biology/simulator"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Layers className="w-4 h-4" />
              <span>3D Anatomiya Simulyatori</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {subject.slug === "chemistry" && (
            <Link
              to="/chemistry/lab"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FlaskConical className="w-4 h-4" />
              <span>3D Kimyo Xonasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </header>

        {/* Featured Card specifically for Biology */}
        {subject.slug === "biology" && (
          <div className="mt-8">
            <CompizCard wobbleIntensity={0.8} glowColor="rgba(16, 185, 129, 0.35)">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/50 via-zinc-950 to-zinc-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Asosiy Simulyator • 190MB FBX • Chrome HTML-in-Canvas</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      3D Inson Anatomiyasi & Ko'p Qatlamli Kesim Simulyatori
                    </h2>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Teri, mushaklar, qon tomirlari, ichki a'zolar va skelet tizimlarini uzluksiz lever orqali o'tkazing, 
                      erkin 3D o'qlarda (X/Y/Z) kesim tekisligini suring va Chrome HTML-in-Canvas fazoviy a'zolar xaritasi va o'zbekcha audio gid bilan o'rganing.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                        6 Ta Anatomik Qatlam
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                        Erkin 3D Kesish (Slice)
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                        O'zbek Ovozli Gid
                      </span>
                    </div>
                  </div>

                  <WobbleRippleButton
                    to="/biology/simulator"
                    variant="emerald"
                    size="lg"
                    icon={Play}
                    className="shrink-0 font-bold"
                  >
                    <span>Simulyatorni Ochish</span>
                  </WobbleRippleButton>
                </div>
              </div>
            </CompizCard>
          </div>
        )}

        {/* Featured Card specifically for Chemistry */}
        {subject.slug === "chemistry" && (
          <div className="mt-8">
            <CompizCard wobbleIntensity={0.8} glowColor="rgba(59, 130, 246, 0.35)">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/50 via-zinc-950 to-zinc-900 border border-blue-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/10 blur-3xl pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interaktiv 3D Laboratoriya Xonasi & VR</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      3D Kimyo Laboratoriyasi & Reaksiyalar
                    </h2>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Laboratoriya stolida erkin yuring, reaktivlar bilan probirkalarda aralashmalar hosil qiling, 
                      pH darajalarini o'zgartiring yoki VR ko'zoynagi bilan kiring.
                    </p>
                  </div>

                  <WobbleRippleButton
                    to="/chemistry/lab"
                    variant="cyan"
                    size="lg"
                    icon={Play}
                    className="shrink-0 font-bold"
                  >
                    <span>Laboratoriyaga Kirish</span>
                  </WobbleRippleButton>
                </div>
              </div>
            </CompizCard>
          </div>
        )}

        {/* Topics List / Level Path */}
        <div className="mt-12 md:mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Barcha Mavzular</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {subject.topics.length}
              </span>
            </h3>
          </div>
          <LevelPath subject={subject} />
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;

