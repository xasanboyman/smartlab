import React from "react";
import { Link } from "react-router-dom";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import { SUBJECTS } from "@/lab/data/subjects";
import { Github, Sparkles, Layers, Cpu, Code2 } from "lucide-react";

const LandingFooter = () => (
  <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Mission */}
        <div className="space-y-4 sm:col-span-2">
          <NexusLogo size="md" showSubtitle={true} />
          <p className="max-w-md text-sm leading-relaxed text-zinc-400">
            NexusLab 3D — fanlarni 3D interaktiv simulyatsiya, WebGL PBR, Chrome HTML-in-Canvas va sun'iy intellekt hamrohligida chuqur o'rganish uchun mo'ljallangan universal virtual laboratoriya platformasi.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Chrome HTML-in-Canvas</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Three.js PBR</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>WebGL2 / WebGPU</span>
            </span>
          </div>
        </div>

        {/* Subjects Navigation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-4 font-mono">
            Ilmiy Yo'nalishlar
          </h4>
          <ul className="space-y-2.5 text-sm">
            {SUBJECTS.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/${s.slug}`}
                  className="hover:text-emerald-400 transition-colors inline-block"
                >
                  {s.title} Laboratoriyasi
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Simulators & Author */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-4 font-mono">
            Maxsus Simulyatorlar
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                to="/biology/simulator"
                className="text-emerald-400 font-semibold hover:underline flex items-center gap-1.5"
              >
                <span>3D Inson Anatomiyasi</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                  190MB FBX
                </span>
              </Link>
            </li>
            <li>
              <Link to="/chemistry/lab" className="hover:text-emerald-400 transition-colors">
                Interaktiv Kimyo Xonasi
              </Link>
            </li>
            <li>
              <Link to="/physics/engine" className="hover:text-emerald-400 transition-colors">
                Ichki Yonuv Dvigateli
              </Link>
            </li>
            <li>
              <Link to="/electronics/arduino" className="hover:text-emerald-400 transition-colors">
                Arduino Sxema Quruvchi
              </Link>
            </li>
            <li>
              <Link to="/history/registan" className="hover:text-emerald-400 transition-colors">
                Registon 3D AI Audio-Gid
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div>
          © {new Date().getFullYear()} <span className="text-zinc-200 font-semibold">NexusLab 3D</span>. Barcha huquqlar himoyalangan.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/xasanboyman"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 transition-colors font-medium"
          >
            <Github className="w-4 h-4" />
            <span>Muallif: Abdulkhayev Hasanboy (@xasanboyman)</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default LandingFooter;

