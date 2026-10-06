import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * DecryptHeader — Cyberpunk/Sci-Fi Decrypting Heading.
 * Uses dynamic character matrix scrambler with cyber glow and instant hover re-scramble.
 */
export const DecryptHeader = ({
  text = "",
  className = "",
  color = "#34d399",
  as: Component = "h1",
  charset = "0123456789ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>/?",
  speed = 30,
  triggerOnHover = true,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const timerRef = useRef(null);

  const startScramble = useCallback(() => {
    if (!text) return;
    let iteration = 0;
    clearInterval(timerRef.current);
    setIsScrambling(true);

    timerRef.current = setInterval(() => {
      setDisplayText(
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
  }, [text, charset, speed]);

  useEffect(() => {
    startScramble();
    return () => clearInterval(timerRef.current);
  }, [startScramble]);

  return (
    <Component
      onMouseEnter={triggerOnHover ? startScramble : undefined}
      className={`inline-block font-mono tracking-tight select-none transition-colors duration-200 cursor-default ${className}`}
      style={{
        textShadow: isScrambling ? `0 0 12px ${color}80, 0 0 24px ${color}40` : undefined,
      }}
    >
      <span className="relative">
        {displayText}
        {isScrambling && (
          <span
            className="inline-block w-2 h-3.5 ml-1 align-middle bg-emerald-400 animate-pulse"
            style={{ backgroundColor: color }}
          />
        )}
      </span>
    </Component>
  );
};

export default DecryptHeader;
