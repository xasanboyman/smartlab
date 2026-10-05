import React, { useRef, useState } from "react";
import Bend from "@/shared/components/canvas-ui/Bend";

/**
 * BendCard — 3D Curved Surface Card.
 * Powered by CanvasUI Bend (WebGL 3D surface fold) with interactive 3D perspective fallback.
 */
export const BendCard = ({
  children,
  className = "",
  zone = 60,
  angle = 35,
  perspective = 900,
  tilt = 0.5,
  direction = "out",
  style = {},
}) => {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -8;
    const rotY = ((x - centerX) / centerX) * 8;

    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...transformStyle, willChange: "transform" }}
      className="relative"
    >
      <Bend
        zone={zone}
        angle={angle}
        perspective={perspective}
        tilt={tilt}
        direction={direction}
        className={className}
        style={style}
      >
        {children}
      </Bend>
    </div>
  );
};

export default BendCard;
