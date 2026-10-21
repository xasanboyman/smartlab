import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import { SUBJECTS } from "@/lab/data/subjects";
import { useAppTheme } from "@/shared/hooks/useAppTheme";
import {
  FlaskConical,
  Dna,
  Atom,
  Cpu,
  Landmark,
  Glasses,
  Sparkles,
  Layers,
  Menu,
  X,
  Compass,
  Bot,
  Sun,
  Moon,
} from "lucide-react";

const SUBJECT_ICONS = {
  chemistry: FlaskConical,
  biology: Dna,
  physics: Atom,
  electronics: Cpu,
  history: Landmark,
};

const linkClass = (isActive) =>
  `flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
    isActive
      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
      : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 border border-transparent"
  }`;

const LabHeader = () => {
  const [open, setOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useAppTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-2xl border-b border-slate-200 dark:border-zinc-800/80 shadow-lg text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        {/* Brand Logo */}
        <NexusLogo size="sm" showSubtitle={false} />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 lg:flex bg-slate-100/80 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800/70">
          {SUBJECTS.map((s) => {
            const IconComponent = SUBJECT_ICONS[s.slug] || Compass;
            return (
              <NavLink
                key={s.slug}
                to={`/${s.slug}`}
                className={({ isActive }) => linkClass(isActive)}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{s.title}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Launch Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white font-bold text-xs shadow-sm transition-all"
            title={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{isDark ? "Kunduzgi" : "Tungi"}</span>
          </button>

          <Link
            to="/riko"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-bold text-xs shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Riko — 3D AI hamroh (Quantum VRM, Gemini Live)"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Riko AI</span>
          </Link>
          <Link
            to="/biology/simulator"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Anatomiya</span>
          </Link>

          <Link
            to="/chemistry/lab?vr=1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white font-semibold text-xs shadow-sm transition-all"
            title="Cardboard / WebXR VR laboratoriya"
          >
            <Glasses className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>VR Lab</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
          className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white lg:hidden"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav className="container mx-auto px-4 flex flex-col gap-2 py-4 border-t border-slate-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>Mavzu: {isDark ? "Kunduzgi rejim" : "Tungi rejim"}</span>
            </span>
            <span className="text-xs font-mono text-emerald-500">{theme.toUpperCase()}</span>
          </button>
          {SUBJECTS.map((s) => {
            const IconComponent = SUBJECT_ICONS[s.slug] || Compass;
            return (
              <NavLink
                key={s.slug}
                to={`/${s.slug}`}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`
                }
              >
                <IconComponent className="w-4 h-4 text-emerald-400" />
                <span>{s.title}</span>
              </NavLink>
            );
          })}

          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            <Link
              to="/riko"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-xs"
            >
              <Bot className="w-4 h-4" />
              <span>Riko AI hamroh</span>
            </Link>
            <Link
              to="/biology/simulator"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
            >
              <Layers className="w-4 h-4" />
              <span>3D Anatomiya Simulyatori</span>
            </Link>
            <Link
              to="/chemistry/lab?vr=1"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium text-xs"
            >
              <Glasses className="w-4 h-4 text-cyan-400" />
              <span>VR Rejimda Sinash</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default LabHeader;
