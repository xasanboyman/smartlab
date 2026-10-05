import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import { SUBJECTS } from "@/lab/data/subjects";
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
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
  }`;

const LabHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-2xl border-b border-zinc-800/80 shadow-lg">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        {/* Brand Logo */}
        <NexusLogo size="sm" showSubtitle={false} />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 lg:flex bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/70">
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
          <Link
            to="/biology/simulator"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Anatomiya</span>
          </Link>

          <Link
            to="/chemistry/lab?vr=1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs shadow-sm transition-all"
            title="Cardboard / WebXR VR laboratoriya"
          >
            <Glasses className="w-3.5 h-3.5 text-cyan-400" />
            <span>VR Lab</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white lg:hidden"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav className="container mx-auto px-4 flex flex-col gap-2 py-4 border-t border-zinc-800/80 bg-zinc-950/95 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
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
