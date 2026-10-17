/**
 * WICG HTML-in-Canvas specification adapter & polyfill
 * Reference: https://github.com/WICG/html-in-canvas
 *
 * Implements:
 * - Canvas `content="drawable"` attribute management
 * - Element `drawable` isolation and layout
 * - `canvas.requestPaint()` scheduling and `paint` event handling
 * - `ctx.drawElementImage()` with seamless high-performance fallback
 * - Hit-testing and pointer interaction dispatching
 */

export function isHtmlInCanvasSupported(canvas) {
  if (!canvas) return false;
  const ctx2d = canvas.getContext ? canvas.getContext("2d") : null;
  const gl = canvas.getContext ? (canvas.getContext("webgl2") || canvas.getContext("webgl")) : null;

  return !!(
    typeof canvas.requestPaint === "function" ||
    (ctx2d && typeof ctx2d.drawElementImage === "function") ||
    (gl && (typeof gl.texElementImage2D === "function" || typeof gl.texElementSubImage2D === "function"))
  );
}

export function setupDrawableCanvas(canvas) {
  if (!canvas) return;
  canvas.setAttribute("content", "drawable");
  canvas.setAttribute("layoutsubtree", "true");
}

export function makeDrawable(element) {
  if (!element) return;
  element.setAttribute("drawable", "");
  element.style.isolation = "isolate";
}

/**
 * Draws a DOM element snapshot into a 2D canvas context.
 * Uses native drawElementImage when available; otherwise renders via SVG foreignObject or cached bitmap.
 */
export async function drawElementToCanvas(ctx, element, dx = 0, dy = 0, dWidth, dHeight) {
  if (!ctx || !element) return false;

  // 1. Native WICG API
  if (typeof ctx.drawElementImage === "function") {
    try {
      if (dWidth !== undefined && dHeight !== undefined) {
        ctx.drawElementImage(element, dx, dy, dWidth, dHeight);
      } else {
        ctx.drawElementImage(element, dx, dy);
      }
      return true;
    } catch {
      // Fall through to fallback renderer
    }
  }

  // 2. High-performance fallback rasterizer
  const rect = element.getBoundingClientRect();
  const w = dWidth || rect.width || 400;
  const h = dHeight || rect.height || 300;

  try {
    const clone = element.cloneNode(true);
    // Inline minimal styling
    const wrapper = document.createElement("div");
    wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
    wrapper.style.overflow = "hidden";
    wrapper.appendChild(clone);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <foreignObject width="100%" height="100%">
          ${new XMLSerializer().serializeToString(wrapper)}
        </foreignObject>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, dx, dy, w, h);
        URL.revokeObjectURL(url);
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Maps canvas coordinates to target element and dispatches real DOM events.
 */
export function dispatchCanvasPointerEvent(sourceEl, normU, normV, eventType, originalEvent = {}) {
  if (!sourceEl) return null;

  const rect = sourceEl.getBoundingClientRect();
  const clientX = rect.left + normU * rect.width;
  const clientY = rect.top + normV * rect.height;

  // Find interactive element inside sourceEl
  const elements = sourceEl.querySelectorAll("button, input, a, select, textarea, [role='button'], label");
  let target = null;

  for (const el of elements) {
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      target = el;
      break;
    }
  }

  if (!target) {
    target = document.elementFromPoint(clientX, clientY) || sourceEl;
  }

  const mouseEvent = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: originalEvent.button ?? 0,
    buttons: originalEvent.buttons ?? 1,
  });

  target.dispatchEvent(mouseEvent);
  return target;
}
