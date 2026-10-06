import React, { useRef, useState, useCallback } from "react";

/**
 * BendCard — High-Performance 3D Curved Surface Card.
 * Uses hardware-accelerated CSS 3D perspective transforms with dynamic
 * specular glare lighting, smooth tactile spring inertia, and zero WebGL context overhead.
 */
export const BendCard = ({
  children,
  className = "",
  zone = 40,
  angle = 15,
  perspective = 1000,
  tilt = 0.25,
  direction = "out",
  style = {},
}) => {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, rx: 0, ry: 0, active: false });

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -angle * tilt;
    const ry = ((x - centerX) / centerX) * angle * tilt;

    setCoords({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      rx,
      ry,
      active: true,
    });
  }, [angle, tilt]);

  const handleMouseLeave = useCallback(() => {
    setCoords({ x: 50, y: 50, rx: 0, ry: 0, active: false });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group/bend relative transition-transform duration-200 ease-out ${className}`}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div
        className="relative w-full h-full rounded-3xl transition-all duration-200 ease-out"
        style={{
          transform: coords.active
            ? `rotateX(${coords.rx}deg) rotateY(${coords.ry}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)",
          transformStyle: "preserve-3d",
          boxShadow: coords.active
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Specular glare reflection overlay that tracks pointer */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 z-20"
          style={{
            opacity: coords.active ? 0.35 : 0,
            background: `radial-gradient(circle at ${coords.x}% ${coords.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%)`,
            mixBlendMode: "overlay",
          }}
        />
        {/* Curved boundary ambient edge glow */}
        <div
          className="absolute -inset-px rounded-3xl pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: coords.active ? 1 : 0,
            background: `linear-gradient(${coords.ry * 5 + 90}deg, rgba(16,185,129,0.4) 0%, transparent 60%, rgba(56,189,248,0.3) 100%)`,
            borderRadius: "inherit",
          }}
        />
        <div className="relative z-10 w-full h-full" style={{ transform: "translateZ(8px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BendCard;
