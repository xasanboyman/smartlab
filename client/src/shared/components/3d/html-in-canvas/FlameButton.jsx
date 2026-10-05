import React, { useState } from "react";
import FlameWrap from "@/shared/components/canvas-ui/FlameWrap";

/**
 * FlameButton — Button with CanvasUI Procedural Flame Wrap.
 * Renders real-time procedural flame distortion, ember sparks, and heat shimmer.
 */
export const FlameButton = ({
  children,
  onClick,
  className = "",
  flameColor = [0.15, 0.85, 0.65], // Emerald flame by default
  intensity = 0.65,
  height = 90,
  spread = 10,
  sparks = 1.5,
  disabled = false,
  type = "button",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <FlameWrap
      color={flameColor}
      intensity={isHovered ? intensity * 1.5 : intensity * 0.7}
      height={height}
      spread={spread}
      sparks={sparks}
      sparkDensity={1.2}
      turbulence={0.6}
      speed={0.35}
      className="inline-block"
    >
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={className}
      >
        {children}
      </button>
    </FlameWrap>
  );
};

export default FlameButton;
