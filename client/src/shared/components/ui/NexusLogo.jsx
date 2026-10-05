import React from "react";
import { Link } from "react-router-dom";

export const NexusLogo = ({
  to = "/",
  size = "md",
  showSubtitle = true,
  className = "",
}) => {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const iconDim = isSm ? "w-8 h-8" : isLg ? "w-12 h-12" : "w-10 h-10";
  const titleSize = isSm ? "text-base" : isLg ? "text-2xl" : "text-lg";

  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 select-none focus:outline-none ${className}`}
    >
      {/* 3D Quantum Nexus Core Emblem */}
      <div className={`relative ${iconDim} shrink-0`}>
        {/* Holographic Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/40 to-blue-600/40 rounded-2xl blur-md group-hover:blur-xl transition-all duration-300" />

        {/* Outer Cyber Enclosure */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-emerald-500/50 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px]" />

          {/* SVG Nexus Geometry */}
          <svg
            viewBox="0 0 44 44"
            className="w-4/5 h-4/5 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Hex Ring */}
            <path
              d="M22 3L39 12.8V32.2L22 41L5 32.2V12.8L22 3Z"
              stroke="url(#nexus-grad-1)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              className="opacity-80"
            />
            {/* Inner Tri-Nexus Nodes */}
            <circle cx="22" cy="13" r="3" fill="#06b6d4" />
            <circle cx="14" cy="28" r="3" fill="#10b981" />
            <circle cx="30" cy="28" r="3" fill="#8b5cf6" />

            {/* Connecting Quantum Lines */}
            <path
              d="M22 13L14 28H30L22 13Z"
              stroke="url(#nexus-grad-2)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Pulsing Central Singularity */}
            <circle cx="22" cy="23" r="3.5" fill="#34d399" className="animate-pulse" />

            <defs>
              <linearGradient id="nexus-grad-1" x1="5" y1="3" x2="39" y2="41" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" />
                <stop offset="0.5" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="nexus-grad-2" x1="14" y1="13" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="0.5" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSize} font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent`}
          >
            Nexus<span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">Lab</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-black tracking-wider uppercase shadow-sm">
            3D
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide truncate">
            Universal Virtual Science & Simulation Studio
          </span>
        )}
      </div>
    </Link>
  );
};

export default NexusLogo;
