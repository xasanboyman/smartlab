import React, { useRef, useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";

/**
 * WobbleRippleButton — Chrome HTML-in-Canvas Interactive Ripple / Wobble Button
 * Inspired by Wes Bos's "Wobble Buttons" (awesome-html-in-canvas.md) & Chrome Origin Trial.
 * Renders dynamic liquid ripple waves on canvas with <canvas layoutsubtree> integration.
 */
export const WobbleRippleButton = ({
  children,
  to,
  onClick,
  variant = "emerald", // "emerald" | "cyan" | "violet" | "amber" | "glass"
  size = "md", // "sm" | "md" | "lg"
  className = "",
  icon: Icon,
  disabled = false,
  title,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]);
  const animFrameRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Variant styles
  const VARIANT_CONFIGS = {
    emerald: {
      bg: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
      text: "text-zinc-950 font-bold",
      shadow: "shadow-lg shadow-emerald-500/25",
      border: "border border-emerald-400/50",
      waveColor: "rgba(255, 255, 255, 0.45)",
      ringColor: "rgba(52, 211, 153, 0.8)",
    },
    cyan: {
      bg: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400",
      text: "text-zinc-950 font-bold",
      shadow: "shadow-lg shadow-cyan-500/25",
      border: "border border-cyan-400/50",
      waveColor: "rgba(255, 255, 255, 0.5)",
      ringColor: "rgba(34, 211, 238, 0.8)",
    },
    violet: {
      bg: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
      text: "text-white font-bold",
      shadow: "shadow-lg shadow-violet-500/25",
      border: "border border-violet-400/40",
      waveColor: "rgba(255, 255, 255, 0.4)",
      ringColor: "rgba(167, 139, 250, 0.8)",
    },
    amber: {
      bg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
      text: "text-zinc-950 font-bold",
      shadow: "shadow-lg shadow-amber-500/25",
      border: "border border-amber-400/50",
      waveColor: "rgba(255, 255, 255, 0.45)",
      ringColor: "rgba(251, 191, 36, 0.8)",
    },
    glass: {
      bg: "bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-xl",
      text: "text-zinc-200 hover:text-white font-semibold",
      shadow: "shadow-md shadow-black/40",
      border: "border border-zinc-700/80 hover:border-zinc-500/80",
      waveColor: "rgba(16, 185, 129, 0.35)",
      ringColor: "rgba(255, 255, 255, 0.6)",
    },
  };

  const currentVariant = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.emerald;

  // Sizing
  const SIZE_CLASSES = {
    sm: "px-3 py-1.5 text-xs gap-1.5 rounded-xl",
    md: "px-5 py-2.5 text-sm gap-2 rounded-2xl",
    lg: "px-7 py-3.5 text-base gap-2.5 rounded-2xl",
  };

  // Canvas ripple animator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Chrome HTML-in-Canvas layoutsubtree attribute setup
    if ("content" in HTMLCanvasElement.prototype) {
      canvas.setAttribute("content", "drawable");
    } else if ("layoutsubtree" in HTMLCanvasElement.prototype) {
      canvas.setAttribute("layoutsubtree", "");
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    // Resize observer with devicePixelContentBoxSize as specified in Chrome docs
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    updateSize();

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    }

    const renderRipples = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Render active liquid ripple waves
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.opacity -= r.decay;

        if (r.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        // Concentric wave pulses
        for (let ring = 0; ring < 2; ring++) {
          const ringRad = Math.max(0, r.radius - ring * 12);
          const ringOpacity = Math.max(0, r.opacity * (1 - ring * 0.4));

          const grad = ctx.createRadialGradient(
            r.x,
            r.y,
            Math.max(0, ringRad - 8),
            r.x,
            r.y,
            ringRad
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 0)");
          grad.addColorStop(0.7, currentVariant.waveColor);
          grad.addColorStop(1, currentVariant.ringColor);

          ctx.save();
          ctx.globalAlpha = ringOpacity;
          ctx.beginPath();
          ctx.arc(r.x, r.y, ringRad, 0, Math.PI * 2);
          ctx.lineWidth = 3 - ring;
          ctx.strokeStyle = currentVariant.ringColor;
          ctx.stroke();

          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
        }
      }

      // If Chrome onpaint is used
      if (typeof canvas.onpaint === "function") {
        canvas.onpaint();
      }

      animFrameRef.current = requestAnimationFrame(renderRipples);
    };

    animFrameRef.current = requestAnimationFrame(renderRipples);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [currentVariant]);

  // Spawn ripple on click or hover
  const triggerRipple = useCallback((e, isClick = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const clientX = e.clientX || rect.left + rect.width / 2;
    const clientY = e.clientY || rect.top + rect.height / 2;

    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    ripplesRef.current.push({
      x,
      y,
      radius: 4,
      speed: isClick ? 5.5 : 3.0,
      opacity: isClick ? 0.85 : 0.45,
      decay: isClick ? 0.018 : 0.025,
    });
  }, []);

  const handleClick = (e) => {
    if (disabled) return;
    triggerRipple(e, true);
    if (onClick) onClick(e);
  };

  const handlePointerEnter = (e) => {
    setIsHovered(true);
    triggerRipple(e, false);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
  };

  const sharedClasses = `relative inline-flex items-center justify-center select-none overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.97] ${currentVariant.bg} ${currentVariant.text} ${currentVariant.shadow} ${currentVariant.border} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`;

  const innerContent = (
    <>
      {/* HTML-in-Canvas Liquid Ripple Layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full mix-blend-screen"
        aria-hidden="true"
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />}
        <span>{children}</span>
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        ref={containerRef}
        to={to}
        title={title}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className={`group ${sharedClasses}`}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      ref={containerRef}
      type="button"
      title={title}
      disabled={disabled}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`group ${sharedClasses}`}
    >
      {innerContent}
    </button>
  );
};

export default WobbleRippleButton;
