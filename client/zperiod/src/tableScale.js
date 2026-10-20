// Periodic-table auto-scale (from upstream script.js), sized to the host element.
export function initPeriodicTableScale(root) {
  const viewW = () => root.clientWidth || viewW();
  const viewH = () => root.clientHeight || viewH();
  const table = root.querySelector("#periodic-table");
  const container = root.querySelector("#main-container");
  if (!table || !container) return;

  const LOGICAL_WIDTH = 1240;
  const MAX_GAP = 96;
  const MIN_GAP = 24;
  let isScaling = false;
  let lastScaleSignature = "";
  let legendEl = null;

  function computeTvmin(tableW) {
    // Scale tvmin with table width to keep text proportional in cells
    const effectiveH = Math.max(viewH(), 500);
    return Math.min(tableW, effectiveH) / 100;
  }

  function measureHeight(gap) {
    table.style.setProperty("--series-gap", `${gap}px`);
    table.style.transition = "none";
    table.style.transform = "none";
    void table.offsetHeight;
    return table.getBoundingClientRect().height;
  }

  function applyLayout(gap, scale, marginTop) {
    table.style.setProperty("--series-gap", `${gap}px`);
    table.style.transformOrigin = "top center";
    table.style.transform = scale < 0.999 ? `scale(${scale})` : "none";
    table.style.marginTop = `${marginTop}px`;

    const legend = root.querySelector("#table-legend");
    if (legend) {
      legend.style.transform = "translateY(10px)";
      legend.style.transformOrigin = "top center";
    }
  }

  function scaleTable(force = false) {
    if (isScaling) return;
    if (getComputedStyle(container).display === "none") return;
    if (table.children.length === 0) return;

    const scaleSignature = [
      viewW(),
      viewH(),
      container.clientWidth,
      container.clientHeight,
      table.childElementCount,
    ].join(":");

    if (!force && scaleSignature === lastScaleSignature) return;

    isScaling = true;
    try {
      lastScaleSignature = scaleSignature;
      // 1. Measure Environment
      const containerStyle = getComputedStyle(container);
      const padT = parseFloat(containerStyle.paddingTop) || 0;
      const padB = parseFloat(containerStyle.paddingBottom) || 0;
      const availH = Math.max(viewH() - padT - padB, 100);

      const MIN_READABLE_SCALE = 0.65;
      const SCROLL_THRESHOLD = 1150; // Below this, always scroll

      // 2. Smart width decision: try fitting at current window width first
      let tableWidth;
      let useScrollMode = false;

      if (viewW() < SCROLL_THRESHOLD) {
        // Very narrow window: always use scroll mode
        useScrollMode = true;
      } else {
        // Try fitting at current window width
        const tryWidth = viewW() - 40;
        const tryTvmin = computeTvmin(tryWidth);
        table.style.setProperty("--tvmin", `${tryTvmin}px`);
        table.style.width = `${tryWidth}px`;
        const tryH = measureHeight(MIN_GAP);
        const tryScale = availH / tryH;

        if (tryScale >= MIN_READABLE_SCALE) {
          // Table fits at this width with acceptable scaling
          tableWidth = tryWidth;
          // Set container min-width to window width (no scroll)
          container.style.minWidth = `${viewW()}px`;
        } else {
          // Scale too small — table would be unreadable. Use scroll mode.
          useScrollMode = true;
        }
      }

      if (useScrollMode) {
        // Scroll mode: use fullscreen-equivalent width
        const fullscreenRef = Math.max(viewW(), 1280);
        tableWidth = Math.max(fullscreenRef - 40, LOGICAL_WIDTH);
        container.style.minWidth = `${tableWidth + 40}px`;
      }

      // 3. Apply width and tvmin
      const tvmin = computeTvmin(tableWidth);
      table.style.setProperty("--tvmin", `${tvmin}px`);
      table.style.width = `${tableWidth}px`;

      // 4. Measure base height with MIN gap
      const hMin = measureHeight(MIN_GAP);

      // 5. Adaptive Gap: expand gap to fill available height, maximizing the table
      let currentGap;
      let height;
      let scale = 1;

      if (hMin > availH) {
        // Even with min gap, too tall → need to scale
        currentGap = MIN_GAP;
        height = hMin;
        scale = Math.max(availH / height, 0.1);
      } else {
        // Table fits. Expand gap to fill remaining space.
        const extraSpace = availH - hMin;
        currentGap = Math.min(MAX_GAP, MIN_GAP + extraSpace);
        height = measureHeight(currentGap);
        // Fine-tune: if somehow still doesn't fit, clamp
        if (height > availH) {
          currentGap = MIN_GAP;
          height = hMin;
        }
      }

      // 6. Vertical Centering
      const scaledHeight = height * scale;
      let marginTop = 0;
      if (scaledHeight < availH) {
        marginTop = (availH - scaledHeight) / 2;
      }

      // 7. Fix scroll mode margins: match container to visual width
      if (useScrollMode && scale < 0.999) {
        const visualWidth = Math.ceil(tableWidth * scale);
        container.style.minWidth = `${visualWidth + 40}px`;
      }

      // 8. Legend layout: switch between 4-col and 2-col based on VISUAL width
      legendEl = legendEl || root.querySelector("#table-legend");
      const legend = legendEl;
      if (legend) {
        // Legend spans grid-column 3/13 = 10 out of 18 columns
        // Use visual width (accounting for scale) to decide layout
        const legendVisualWidth = (10 / 18) * tableWidth * scale;
        // 4 columns need ~560px visual minimum (4 × 140px)
        if (legendVisualWidth < 560) {
          legend.classList.add("legend-compact");
        } else {
          legend.classList.remove("legend-compact");
        }
      }

      applyLayout(currentGap, scale, marginTop);

    } catch (e) {
      console.error("Scale Error:", e);
    } finally {
      isScaling = false;
    }
  }

  window._scalePeriodicTable = (force = false) => scaleTable(force);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => requestAnimationFrame(() => scaleTable(true)), 50);
  });
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => requestAnimationFrame(() => scaleTable(true))).observe(root);
  }
  // Also run immediately
  requestAnimationFrame(() => scaleTable(true));
}
