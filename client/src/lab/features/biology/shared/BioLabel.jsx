// In-scene part label: a small pill anchored to a 3D point, occluded by geometry
// so labels behind the model fade instead of floating on top of it.
import { useState } from "react";
import { Html } from "@react-three/drei";

const BioLabel = ({ position, text, color = "#34d399", active = false, muted = false, onClick, occlude = true, offset = [0, 0, 0] }) => {
  const [hidden, setHidden] = useState(false);
  return (
    <group position={position}>
      <Html
        position={offset}
        center
        occlude={occlude}
        onOcclude={setHidden}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: onClick ? "auto" : "none", transition: "opacity 160ms", opacity: hidden ? 0.15 : muted ? 0.45 : 1 }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider shadow-lg backdrop-blur-sm ${
            active ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100" : "border-white/15 bg-slate-950/80 text-slate-100"
          }`}
        >
          <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          {text}
        </button>
      </Html>
    </group>
  );
};

export default BioLabel;
