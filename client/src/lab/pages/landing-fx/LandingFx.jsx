// Wraps the landing page in the Zyie-style HTML-in-Canvas scene: the page keeps rendering as
// normal DOM (so it works everywhere), and once the Pixi scene loads it is moved into the canvas
// when the browser supports capturing it; otherwise the laser and cat just play on an overlay.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { hasHtmlInCanvas, markDrawable } from "@/lab/html-canvas/htmlInCanvas";

const BASE = import.meta.env.BASE_URL || "/";

const LandingFx = ({ children, onMode, catEnabled = false }) => {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const [page, setPage] = useState(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const el = document.createElement("div");
    el.className = "lf-page";
    host.appendChild(el);
    setPage(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    if (sceneRef.current?.setCatEnabled) {
      sceneRef.current.setCatEnabled(catEnabled);
    }
  }, [catEnabled]);

  useEffect(() => {
    if (!page) return undefined;
    const host = hostRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    if (reduced || narrow) {
      onMode?.("off");
      return undefined;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "lf-canvas";
    host.appendChild(canvas);
    const supported = hasHtmlInCanvas(canvas);
    let cancelled = false;

    const leaveCanvasMode = () => {
      host.classList.remove("lf-canvas-mode");
      if (page.parentElement === canvas) host.insertBefore(page, canvas);
      onMode?.("dom");
    };

    import("./laserScene")
      .then(async (m) => {
        if (cancelled) return;
        if (supported) {
          const scrollY = window.scrollY;
          markDrawable(canvas);
          host.classList.add("lf-canvas-mode");
          canvas.appendChild(page);
          page.scrollTop = scrollY;
          onMode?.("canvas");
        } else onMode?.("dom");
        try {
          const scene = await m.mountLaserScene({
            canvas,
            host,
            page,
            mode: supported ? "canvas" : "dom",
            assetBase: BASE,
            catEnabled,
          });
          if (cancelled) {
            scene?.destroy();
          } else {
            sceneRef.current = scene;
          }
        } catch (err) {
          console.warn("[LandingFx] scene failed, falling back to DOM", err);
          if (supported) leaveCanvasMode();
        }
      })
      .catch(() => leaveCanvasMode());

    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
      if (page.parentElement === canvas) host.insertBefore(page, canvas);
      host.classList.remove("lf-canvas-mode");
      canvas.remove();
    };
  }, [page, onMode]);

  return (
    <div ref={hostRef} className="lf-host">
      {page && createPortal(children, page)}
    </div>
  );
};

export default LandingFx;
