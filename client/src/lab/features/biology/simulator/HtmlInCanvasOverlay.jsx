import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import {
  checkHtmlCanvasSupport,
  setupCanvasDrawable,
  ANATOMICAL_PINS,
  projectToScreen,
} from "./engine/HtmlCanvasManager";

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

  // Set up Chrome HTML-in-Canvas standard attributes
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
        return {
          ...pin,
          screenX: x,
          screenY: y,
          visible,
        };
      });

      setPinPositions(projected);
    };

    updateProjections();

    return () => cancelAnimationFrame(animId);
  }, [enabled, camera, containerRef]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {/* HTML-in-Canvas Context Bridge Element (Standardized Chrome 155+ / 150) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        aria-hidden="true"
      />

      {/* Floating 3D Holographic Anatomical Pins */}
      {pinPositions.map((pin) => {
        if (!pin.visible) return null;
        const IconComponent = PIN_ICONS[pin.icon] || Info;
        const isHovered = hoveredPin === pin.id;
        const isActive = activePinId === pin.id;

        return (
          <div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-100 ease-out select-none"
            style={{
              left: `${pin.screenX}px`,
              top: `${pin.screenY}px`,
            }}
            onMouseEnter={() => setHoveredPin(pin.id)}
            onMouseLeave={() => setHoveredPin(null)}
          >
            {/* The Pulse Anchor */}
            <button
              onClick={() => onSelectPin?.(pin)}
              className={`relative group flex items-center justify-center transition-all ${
                isHovered || isActive ? "scale-125 z-30" : "scale-100 z-10"
              }`}
              title={`${pin.label} (${pin.latin})`}
            >
              {/* Animated Ripple Wave */}
              <span className="absolute -inset-2 rounded-full bg-emerald-400/25 animate-ping opacity-60 pointer-events-none" />

              {/* Glowing Aura Ring */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all ${
                  isActive
                    ? "bg-emerald-500 text-zinc-950 border-white shadow-emerald-500/60 ring-4 ring-emerald-400/30"
                    : isHovered
                    ? "bg-zinc-900/90 text-emerald-300 border-emerald-400 shadow-emerald-500/40"
                    : "bg-zinc-950/80 text-zinc-300 border-zinc-700/80 shadow-black/60 hover:border-emerald-500"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Expanded Holographic Tooltip Card on Hover */}
            {(isHovered || isActive) && (
              <div
                onClick={() => onSelectPin?.(pin)}
                className="absolute left-8 -top-3 w-56 p-2.5 rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-emerald-500/50 shadow-2xl shadow-emerald-950/50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 z-40 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{pin.label}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 italic">
                      {pin.latin}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                    {pin.system}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-300 leading-tight mb-2">
                  {pin.desc}
                </p>

                <div className="flex items-center justify-between text-[9px] text-emerald-400 font-semibold pt-1 border-t border-zinc-800">
                  <span>Tafsilotlarni ko'rish</span>
                  <ChevronRight className="w-3 h-3" />
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
