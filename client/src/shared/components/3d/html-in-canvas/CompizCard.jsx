import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * CompizCard — Gelatinous Spring/Wobble 3D Card
 * Inspired by Max Leiter's "compiz-web" (awesome-html-in-canvas.md).
 * Simulates spring-mass corner deformation on hover and pointer move.
 */
export const CompizCard = ({
  children,
  className = "",
  wobbleIntensity = 1.0,
  glowColor = "rgba(16, 185, 129, 0.4)",
  onClick,
}) => {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState("");
  const stateRef = useRef({
    rx: 0,
    ry: 0,
    vx: 0,
    vy: 0,
    targetRx: 0,
    targetRy: 0,
    isHovered: false,
  });

  useEffect(() => {
    let animId;
    const k = 0.12 * wobbleIntensity; // spring stiffness
    const damping = 0.82; // friction

    const loop = () => {
      const s = stateRef.current;

      // Spring physics
      const ax = (s.targetRx - s.rx) * k;
      const ay = (s.targetRy - s.ry) * k;

      s.vx = (s.vx + ax) * damping;
      s.vy = (s.vy + ay) * damping;

      s.rx += s.vx;
      s.ry += s.vy;

      // Update 3D matrix
      if (Math.abs(s.vx) > 0.001 || Math.abs(s.vy) > 0.001 || Math.abs(s.rx) > 0.01 || Math.abs(s.ry) > 0.01) {
        setTransformStyle(
          `perspective(800px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) scale3d(${
            s.isHovered ? 1.02 : 1
          }, ${s.isHovered ? 1.02 : 1}, 1)`
        );
      } else if (!s.isHovered && transformStyle !== "") {
        setTransformStyle("");
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [wobbleIntensity, transformStyle]);

  const handlePointerMove = useCallback(
    (e) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles with spring excitation
      const maxAngle = 12 * wobbleIntensity;
      const targetRy = ((x - centerX) / centerX) * maxAngle;
      const targetRx = -((y - centerY) / centerY) * maxAngle;

      stateRef.current.targetRx = targetRx;
      stateRef.current.targetRy = targetRy;
      stateRef.current.isHovered = true;
    },
    [wobbleIntensity]
  );

  const handlePointerLeave = useCallback(() => {
    stateRef.current.targetRx = 0;
    stateRef.current.targetRy = 0;
    stateRef.current.isHovered = false;
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: transformStyle,
        transformStyle: "preserve-3d",
        transition: "transform 0.08s ease-out, box-shadow 0.2s ease",
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Ambient reactive glow */}
      <div
        className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-300 blur-md"
        style={{ background: glowColor }}
      />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
};

export default CompizCard;
