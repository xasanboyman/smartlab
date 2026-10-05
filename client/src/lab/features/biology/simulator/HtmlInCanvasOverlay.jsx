import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Brain,
  Heart,
  Wind,
  Activity,
  UtensilsCrossed,
  Droplets,
  Bone,
  Dumbbell,
  Sparkles,
  ChevronRight,
  Info,
  Volume2,
  Crosshair,
} from "lucide-react";
import {
  checkHtmlCanvasSupport,
  setupCanvasDrawable,
  ANATOMICAL_PINS,
  projectToScreen,
} from "./engine/HtmlCanvasManager";
import { anatomyAudio } from "./engine/AnatomyAudio";

const PIN_ICONS = {
  Brain,
  Heart,
  Wind,
  Activity,
  UtensilsCrossed,
  Droplets,
  Bone,
  Dumbbell,
};

export const HtmlInCanvasOverlay = ({
  camera,
  containerRef,
  enabled = true,
  onSelectPin,
  activePinId,
}) => {
  const canvasRef = useRef(null);
  const [pinPositions, setPinPositions] = useState([]);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [supportInfo, setSupportInfo] = useState(null);

  useEffect(() => {
    setSupportInfo(checkHtmlCanvasSupport());
  }, []);

  // Set up Chrome HTML-in-Canvas standard attributes (Chrome 150/155 Origin Trial)
  useEffect(() => {
    if (canvasRef.current) {
      setupCanvasDrawable(canvasRef.current);
    }
  }, []);

  // Update pin projections on animation frame
  useEffect(() => {
    if (!enabled || !camera) return;

    let animId;
    const updateProjections = () => {
      animId = requestAnimationFrame(updateProjections);
      const container = containerRef?.current;
      if (!container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      const projected = ANATOMICAL_PINS.map((pin) => {
        const { x, y, visible } = projectToScreen(pin.pos, camera, w, h);

        const isLeft = pin.side === "left";
        const len = pin.lineLen || 110;
        const yOff = pin.yOffset || 0;

        // Leader line endpoints:
        // (x, y) = Landmark point on the body
        // (midX, midY) = Angle elbow bend
        // (tagX, tagY) = Floating glass tag anchor
        const tagX = isLeft ? Math.max(16, x - len) : Math.min(w - 16, x + len);
        const tagY = Math.max(70, Math.min(h - 60, y + yOff));
        const midX = isLeft ? x - 28 : x + 28;
        const midY = tagY;

        return {
          ...pin,
          screenX: x,
          screenY: y,
          tagX,
          tagY,
          midX,
          midY,
          visible,
        };
      });

      setPinPositions(projected);
    };

    updateProjections();

    return () => cancelAnimationFrame(animId);
  }, [enabled, camera, containerRef]);

  const handleHoverPin = useCallback((pinId) => {
    setHoveredPin(pinId);
    if (pinId) {
      anatomyAudio.playPinHover();
    }
  }, []);

  const handlePinClick = useCallback(
    (pin) => {
      anatomyAudio.playCameraSnap();
      onSelectPin?.(pin);
    },
    [onSelectPin]
  );

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden select-none">
      {/* HTML-in-Canvas Context Bridge Element (Standardized Chrome 155+ / 150) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        aria-hidden="true"
      />

      {/* SVG Holographic Laser Leader Lines Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          {/* Active Emerald Gradient */}
          <linearGradient id="laser-grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
          </linearGradient>

          {/* Idle Subdued Gradient */}
          <linearGradient id="laser-grad-idle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {pinPositions.map((pin) => {
          if (!pin.visible) return null;
          const isHovered = hoveredPin === pin.id;
          const isActive = activePinId === pin.id;
          const isHighlight = isHovered || isActive;

          // Path: Landmark -> Elbow Bend -> Tag Anchor
          const pathD = `M ${pin.screenX} ${pin.screenY} L ${pin.midX} ${pin.midY} L ${pin.tagX} ${pin.tagY}`;

          return (
            <g key={`svg-${pin.id}`} className="transition-opacity duration-200">
              {/* Landmark Micro Beacon Dot (on the body) */}
              <circle
                cx={pin.screenX}
                cy={pin.screenY}
                r={isHighlight ? 4 : 2.5}
                fill={isHighlight ? "#34d399" : "#10b981"}
                filter={isHighlight ? "url(#laser-glow)" : undefined}
              />

              {/* Pulsing Ripple Halo around landmark */}
              <circle
                cx={pin.screenX}
                cy={pin.screenY}
                r={isHighlight ? 9 : 6}
                stroke={isHighlight ? "#34d399" : "#10b981"}
                strokeWidth={isHighlight ? 1.5 : 1}
                fill="none"
                opacity={isHighlight ? 0.8 : 0.35}
              />

              {/* Connecting Laser Leader Line */}
              <path
                d={pathD}
                fill="none"
                stroke={isHighlight ? "url(#laser-grad-active)" : "url(#laser-grad-idle)"}
                strokeWidth={isHighlight ? 1.8 : 1.2}
                strokeDasharray={isHighlight ? "none" : "3 3"}
                filter={isHighlight ? "url(#laser-glow)" : undefined}
                className="transition-all duration-150"
              />

              {/* Terminal Anchor Dot (at the tag) */}
              <circle
                cx={pin.tagX}
                cy={pin.tagY}
                r={isHighlight ? 3 : 2}
                fill={isHighlight ? "#06b6d4" : "#10b981"}
                opacity={0.8}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Holographic Glass Tags (Positioned away from torso) */}
      {pinPositions.map((pin) => {
        if (!pin.visible) return null;
        const IconComponent = PIN_ICONS[pin.icon] || Info;
        const isHovered = hoveredPin === pin.id;
        const isActive = activePinId === pin.id;
        const isLeft = pin.side === "left";

        return (
          <div
            key={pin.id}
            className={`absolute pointer-events-auto transition-transform duration-150 ease-out select-none ${
              isLeft ? "-translate-x-full" : ""
            } -translate-y-1/2`}
            style={{
              left: `${pin.tagX}px`,
              top: `${pin.tagY}px`,
            }}
            onMouseEnter={() => handleHoverPin(pin.id)}
            onMouseLeave={() => handleHoverPin(null)}
          >
            {/* Interactive Holographic Pill Tag */}
            <button
              onClick={() => handlePinClick(pin)}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-200 cursor-pointer shadow-lg ${
                isActive
                  ? "bg-emerald-500/20 text-white border-emerald-400 shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/30"
                  : isHovered
                  ? "bg-zinc-900/90 text-white border-cyan-400/80 shadow-cyan-500/25 scale-105"
                  : "bg-zinc-950/70 text-zinc-300 border-zinc-800/80 hover:border-emerald-500/60 hover:bg-zinc-900/80"
              }`}
              title={`${pin.label} (${pin.latin}) — 3D Fokus`}
            >
              {/* Icon Container */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? "bg-emerald-400 text-zinc-950 font-bold"
                    : isHovered
                    ? "bg-cyan-500/25 text-cyan-300"
                    : "bg-zinc-800/80 text-emerald-400"
                }`}
              >
                <IconComponent className="w-3 h-3" />
              </div>

              {/* Label & Latin name */}
              <div className="flex flex-col text-left pr-1 leading-tight">
                <span className="text-[11px] font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  {pin.label}
                </span>
                <span className="text-[9px] text-zinc-400 italic">
                  {pin.latin}
                </span>
              </div>

              {/* Focus Arrow Icon */}
              <Crosshair
                className={`w-3 h-3 transition-transform ${
                  isHovered || isActive
                    ? "text-emerald-400 rotate-90 scale-110"
                    : "text-zinc-600 group-hover:text-zinc-400"
                }`}
              />
            </button>

            {/* Expanded Detailed Tooltip Card on Hover */}
            {(isHovered || isActive) && (
              <div
                onClick={() => handlePinClick(pin)}
                className={`absolute ${
                  isLeft ? "right-0 mr-1" : "left-0 ml-1"
                } top-full mt-2 w-64 p-3 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-emerald-500/50 shadow-2xl shadow-emerald-950/60 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 z-40 cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="truncate">{pin.label}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 italic truncate">
                      {pin.latin}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold shrink-0 border border-emerald-500/30">
                    {pin.system}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-snug mb-2.5">
                  {pin.desc}
                </p>

                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold pt-2 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    <span>3D markazlash</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HtmlInCanvasOverlay;
