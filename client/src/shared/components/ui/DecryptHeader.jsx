import React, { useState, useEffect, useRef } from "react";
import DecryptReveal from "@/shared/components/canvas-ui/DecryptReveal";

/**
 * DecryptHeader — Cyberpunk/Sci-Fi Decrypting Heading.
 * Uses CanvasUI DecryptReveal (WebGL glyph matrix) with hybrid dynamic text scrambler fallback.
 */
export const DecryptHeader = ({
  text,
  className = "",
  color = "#34d399",
  as: Component = "h1",
  charset = "0123456789ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>/?",
  speed = 35,
  triggerOnHover = true,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const timerRef = useRef(null);

  const startScramble = () => {
    let iteration = 0;
    clearInterval(timerRef.current);
    setIsScrambling(true);

    timerRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " " || index < iteration) {
              return text[index];
            }
            return charset[Math.floor(Math.random() * charset.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(timerRef.current);
        setIsScrambling(false);
      }
      iteration += 1 / 2;
    }, speed);
  };

  useEffect(() => {
    startScramble();
    return () => clearInterval(timerRef.current);
  }, [text]);

  return (
    <DecryptReveal
      color={color}
      brightness={1.6}
      edgeGlow={2.0}
      edgeTint={0.8}
      aberration={2}
      className="inline-block"
    >
      <Component
        onMouseEnter={triggerOnHover ? startScramble : undefined}
        className={className}
        style={{
          fontFamily: "'JetBrains Mono', monospace, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {displayText}
      </Component>
    </DecryptReveal>
  );
};

export default DecryptHeader;
