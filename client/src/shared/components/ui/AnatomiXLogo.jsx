import React from "react";

export const AnatomiXLogo = ({ size = "md", showSubtitle = true, className = "" }) => {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const iconDim = isSm ? "w-7 h-7" : isLg ? "w-11 h-11" : "w-9 h-9";
  const titleSize = isSm ? "text-sm" : isLg ? "text-xl" : "text-base";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Holographic Bio-Helix Shield Emblem */}
      <div className={`relative ${iconDim} shrink-0 group`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-blue-600/40 rounded-xl blur-md group-hover:blur-lg transition-all duration-300" />

        {/* Outer Hex/Cyber Container */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-emerald-500/40 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px]" />

          {/* Core SVG Emblem */}
          <svg
            viewBox="0 0 40 40"
            className="w-4/5 h-4/5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-transform duration-300 group-hover:scale-105"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Hexagon */}
            <path
              d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z"
              stroke="url(#anx-grad-1)"
              strokeWidth="1.8"
              strokeLinejoin="round"
              className="opacity-70"
            />
            {/* Inner Double-Helix Core */}
            <path
              d="M14 13C17 17 23 17 26 21C29 25 23 27 20 27"
              stroke="url(#anx-grad-2)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M26 13C23 17 17 17 14 21C11 25 17 27 20 27"
              stroke="url(#anx-grad-3)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Central Energy Nucleus */}
            <circle cx="20" cy="20" r="2.5" fill="#34d399" className="animate-pulse" />

            <defs>
              <linearGradient id="anx-grad-1" x1="5" y1="3" x2="35" y2="37" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" />
                <stop offset="0.5" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="anx-grad-2" x1="14" y1="13" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="anx-grad-3" x1="26" y1="13" x2="14" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06b6d4" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSize} font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent`}
          >
            Anatomi<span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">X</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-black tracking-wider uppercase shadow-sm">
            3D
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[9px] font-mono font-bold tracking-widest uppercase">
            STUDIO
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide truncate">
            Next-Gen Interaktiv Odam Anatomiyasi
          </span>
        )}
      </div>
    </div>
  );
};

export default AnatomiXLogo;
