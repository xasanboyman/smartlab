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
        style={{ pointerEvents: onClick ? "auto" : "none", transition: "opacity 160ms", opacity: hidden ? 0.25 : muted ? 0.7 : 1 }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider shadow-xl backdrop-blur-md transition-all ${
            active ? "border-emerald-400 bg-emerald-500/30 text-emerald-200 ring-2 ring-emerald-400/40 scale-105" : "border-white/30 bg-slate-950/90 text-white hover:border-emerald-400/60"
          }`}
        >
          <span className="size-2 rounded-full ring-1 ring-white/60" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          {text}
        </button>
      </Html>
    </group>
  );
};

export default BioLabel;
