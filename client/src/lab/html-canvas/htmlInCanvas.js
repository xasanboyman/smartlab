// WICG HTML-in-Canvas helpers (https://github.com/WICG/html-in-canvas).
// Chrome ships the API behind chrome://flags/#canvas-draw-element; everything here
// feature-detects so pages keep working (with a fallback) when it is off.

export const HIC_FLAG = "chrome://flags/#canvas-draw-element";

export const hasHtmlInCanvas = (canvas) => typeof canvas?.requestPaint === "function";

// Canvas children are only laid out (and so capturable) with these attributes.
export const markDrawable = (canvas) => {
  canvas.setAttribute("layoutsubtree", "");
  canvas.setAttribute("content", "drawable");
};

export const unmarkDrawable = (canvas) => {
  canvas.removeAttribute("layoutsubtree");
  canvas.removeAttribute("content");
};

// Uploads the element's last paint snapshot into the bound TEXTURE_2D (old 3-arg and new 6-arg forms).
export const texElement = (gl, el) => {
  const fn = gl.texElementImage2D;
  if (typeof fn !== "function") return false;
  if (fn.length === 3) fn.call(gl, gl.TEXTURE_2D, gl.RGBA, el);
  else fn.call(gl, gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
  return true;
};

// Runs `fn` once after the next paint snapshot; returns a canceller.
export const onNextPaint = (canvas, fn) => {
  const handler = () => fn();
  canvas.addEventListener("paint", handler, { once: true });
  canvas.requestPaint();
  return () => canvas.removeEventListener("paint", handler);
};
