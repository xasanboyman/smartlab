// Lists the topics of one subject (/:subject)
import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { SUBJECTS, getSubject } from "@/lab/data/subjects";
import LevelPath from "@/lab/components/subject/LevelPath";
import Icon from "@/lab/components/Icon";
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
  LayoutGrid,
  Route,
  Search,
  X,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import WobbleRippleButton from "@/shared/components/3d/html-in-canvas/WobbleRippleButton";
import CompizCard from "@/shared/components/3d/html-in-canvas/CompizCard";
import DecryptHeader from "@/shared/components/ui/DecryptHeader";

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

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "path"
  const [searchQuery, setSearchQuery] = useState("");

  const IconComp = SUBJECT_ICONS[subject.slug] || Dna;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return subject.topics;
    const q = searchQuery.toLowerCase().trim();
    return subject.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
    );
  }, [subject.topics, searchQuery]);

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
                  {subject.title} Ta'lim Yo'nalishi
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {subject.topics.length} ta interaktiv mavzu
                </span>
              </div>
              <DecryptHeader
                text={subject.title}
                color={subject.color || "#10b981"}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight"
              />
              <p className="mt-1 text-sm text-zinc-400 max-w-xl">
                {subject.short}
              </p>
            </div>
          </div>

          {/* Quick link button depending on subject */}
          <div className="flex items-center gap-2.5 shrink-0">
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
          </div>
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
                      <span>Asosiy Simulyator • 4K PBR • Chrome HTML-in-Canvas</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      3D Inson Anatomiyasi & Ko'p Qatlamli Kesim Simulyatori
                    </h2>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Teri, mushaklar, qon tomirlari, ichki a'zolar va skelet tizimlarini vertikal lever orqali o'tkazing, 
                      erkin 3D o'qlarda (X/Y/Z) kesim tekisligini suring va o'zbekcha audio gid bilan organlar faoliyatini o'rganing.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                        6 Ta Qatlam
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono">
                        Erkin 3D Kesim (Slice)
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
                      Laboratoriya stolida erkin harakatlaning, probirkalar va reaktivlarni aralashtiring, 
                      pH indikatorlarini tekshiring yoki VR ko'zoynak bilan tajriba qiling.
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

        {/* Educational Topics Section */}
        <div className="mt-12 md:mt-16">
          {/* Controls Bar: Title, Search, View Mode */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Darslik & Mavzular</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                  {filteredTopics.length}
                </span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mavzulardan qidirish..."
                  className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher: Cards vs Path */}
              <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "grid"
                      ? "bg-zinc-800 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Kartalar ko'rinishi"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartalar</span>
                </button>
                <button
                  onClick={() => setViewMode("path")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "path"
                      ? "bg-zinc-800 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Bosqichli o'quv yo'li"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Bosqichlar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode 1: Clean Educational Card Grid */}
          {viewMode === "grid" && (
            filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTopics.map((topic, idx) => (
                  <Link
                    key={topic.slug}
                    to={`/${subject.slug}/${topic.slug}`}
                    className="group p-5 rounded-3xl bg-zinc-950/70 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${subject.color}15`,
                            borderColor: `${subject.color}35`,
                            color: subject.color,
                          }}
                        >
                          <Icon name={topic.icon} size={22} />
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-500">
                          #{String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {topic.title}
                      </h4>
                      <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {topic.short}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-white">
                      <span className="text-[11px] font-mono text-zinc-500">3D Interaktiv</span>
                      <span className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-1 transition-transform">
                        <span>O'rganish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-950/40 rounded-3xl border border-zinc-800/60 p-8">
                <Search className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Mavzu topilmadi</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  "{searchQuery}" so'rovi bo'yicha hech qanday mavzu topilmadi. Qidiruv so'zini tekshiring yoki tozalang.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
                >
                  Qidiruvni tozalash
                </button>
              </div>
            )
          )}

          {/* Mode 2: Level Path */}
          {viewMode === "path" && (
            <div className="p-4 sm:p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
              <LevelPath subject={subject} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;
