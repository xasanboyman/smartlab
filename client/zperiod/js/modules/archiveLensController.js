// =============================================================================
// Archive Lens Controller — Interactive photographic sample constellation
// with Apple liquid-glass "goo" SVG filter, active orb focus, and zoom stages
// =============================================================================

import { elementArchives } from "../data/elementArchives.js";
import { getLang } from "./langController.js";

let currentElement = null;
let currentEntries = [];
let activeEntryIndex = 0;
let isDetailOpen = false;

export function resolveArchiveImageUrl(rawPath, width = 640) {
  if (!rawPath || typeof rawPath !== "string") return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) return rawPath;
  const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const prefix = "images/elements/";
  if (rawPath.startsWith(prefix)) {
    const rel = rawPath.slice(prefix.length);
    return `${cleanBase}images/archive/${width}/${rel}.webp`;
  }
  return rawPath;
}

function localizeKind(kind, lang) {
  const isUz = lang === "uz";
  switch (kind) {
    case "Portrait":
    case "Sample":
      return isUz ? "Namuna" : "Sample";
    case "Origin":
      return isUz ? "Tabiiy manbasi" : "Origin";
    case "Science":
      return isUz ? "Spektr & Fan" : "Science";
    case "History":
      return isUz ? "Kashfiyot tarixi" : "History";
    case "Uses":
      return isUz ? "Qoʻllanilishi" : "Uses";
    case "Safety":
      return isUz ? "Xavfsizlik" : "Hazards";
    default:
      return kind || (isUz ? "Arxiv" : "Archive");
  }
}

function setImageWithFallback(imgEl, fallbackEl, entry, width = 640) {
  if (!imgEl) return;
  const localUrl = resolveArchiveImageUrl(entry?.image, width);
  if (localUrl) {
    imgEl.src = localUrl;
    imgEl.alt = entry.title || entry.kind || "";
    imgEl.decoding = "async";
    imgEl.style.display = "";
    if (fallbackEl) {
      fallbackEl.textContent = "";
      fallbackEl.style.display = "none";
    }
    imgEl.onerror = () => {
      // Try remote zperiod.app CDN if local failed
      if (!imgEl.dataset.triedRemote && entry?.image?.startsWith("images/elements/")) {
        imgEl.dataset.triedRemote = "true";
        const rel = entry.image.slice("images/elements/".length);
        imgEl.src = `https://zperiod.app/images/archive/${width}/${rel}.webp`;
        return;
      }
      imgEl.removeAttribute("src");
      imgEl.style.display = "none";
      if (fallbackEl) {
        fallbackEl.textContent = entry.fallback || currentElement?.symbol || String(currentElement?.number || "");
        fallbackEl.style.display = "flex";
      }
    };
  } else {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    imgEl.style.display = "none";
    if (fallbackEl) {
      fallbackEl.textContent = entry?.fallback || currentElement?.symbol || String(currentElement?.number || "");
      fallbackEl.style.display = "flex";
    }
  }
}

export function closeArchiveDetail() {
  const lens = document.getElementById("archive-lens");
  const modalContent = document.getElementById("modal-content-primary");
  const focusCard = document.getElementById("archive-focus-card");
  const portraitStage = document.getElementById("archive-portrait-stage");
  const mainOrb = document.getElementById("archive-main-orb");

  if (lens) {
    lens.classList.remove(
      "is-detail-open",
      "is-fullscreen-detail",
      "is-list-detail",
      "is-portrait-detail",
      "is-compact-history",
      "is-compact-no-subtitle"
    );
  }
  if (modalContent) modalContent.classList.remove("archive-fullscreen-mode");
  if (focusCard) focusCard.setAttribute("aria-hidden", "true");
  if (portraitStage) portraitStage.setAttribute("aria-hidden", "true");
  isDetailOpen = false;
  if (mainOrb) mainOrb.focus({ preventScroll: true });
}

export function openArchiveEntry(index, isFullscreen = false) {
  const lens = document.getElementById("archive-lens");
  const modalContent = document.getElementById("modal-content-primary");
  const focusCard = document.getElementById("archive-focus-card");
  const focusImage = document.getElementById("archive-focus-image");
  const focusFallback = document.getElementById("archive-focus-fallback");
  const portraitStage = document.getElementById("archive-portrait-stage");
  const portraitImage = document.getElementById("archive-portrait-image");
  const portraitKicker = document.getElementById("archive-portrait-kicker");
  const portraitTitle = document.getElementById("archive-portrait-title");
  const portraitText = document.getElementById("archive-portrait-text");
  const portraitSource = document.getElementById("archive-portrait-source");
  const detailKicker = document.getElementById("archive-detail-kicker");
  const elementTitle = document.getElementById("archive-element-title");
  const contextText = document.getElementById("archive-context-text");
  const discBy = document.getElementById("archive-discovered-by");
  const discYr = document.getElementById("archive-discovery-year");
  const namedBy = document.getElementById("archive-named-by");
  const detailTags = document.getElementById("archive-detail-tags");

  if (!lens || !currentEntries[index]) return;
  activeEntryIndex = index;
  isDetailOpen = true;

  const entry = currentEntries[index];
  const lang = getLang();
  const isPortraitMode = isFullscreen || (entry.kind === "Portrait" && !!entry.image);

  lens.classList.add("is-detail-open");
  lens.classList.toggle("is-portrait-detail", isPortraitMode);
  lens.classList.toggle("is-fullscreen-detail", isPortraitMode);
  if (modalContent) modalContent.classList.toggle("archive-fullscreen-mode", isPortraitMode);

  if (focusCard) focusCard.setAttribute("aria-hidden", isPortraitMode ? "true" : "false");
  if (portraitStage) portraitStage.setAttribute("aria-hidden", isPortraitMode ? "false" : "true");

  // Highlight active orb
  document.querySelectorAll(".archive-orb").forEach((orb) => {
    const orbIdx = Number(orb.dataset.archiveIndex);
    orb.classList.toggle("is-active", orbIdx === index);
  });

  setImageWithFallback(focusImage, focusFallback, entry, 640);

  if (isPortraitMode) {
    setImageWithFallback(portraitImage, null, entry, 1600);
    if (portraitKicker) portraitKicker.textContent = `${localizeKind(entry.kind, lang)} · ${entry.credit ? "Verified" : "Archive"}`;
    if (portraitTitle) portraitTitle.textContent = entry.title || currentElement?.name || "";
    if (portraitText) portraitText.textContent = entry.text || "";
    if (portraitSource) {
      const srcUrl = entry.sources?.[0]?.url;
      portraitSource.hidden = !srcUrl;
      portraitSource.href = srcUrl || "#";
      portraitSource.textContent = lang === "uz" ? "Manbani ko'rish" : "View source";
    }
  }

  if (detailKicker) detailKicker.textContent = localizeKind(entry.kind, lang);
  if (elementTitle) elementTitle.textContent = entry.title || currentElement?.name || "";
  if (contextText) contextText.textContent = entry.text || "—";

  if (discBy) discBy.textContent = currentElement?.discovery?.discoveredBy || currentElement?.discoveredBy || "—";
  if (discYr) discYr.textContent = currentElement?.discovery?.year || currentElement?.discoveryYear || "—";
  if (namedBy) namedBy.textContent = currentElement?.etymology || currentElement?.namedBy || "—";

  if (detailTags) {
    detailTags.innerHTML = "";
    const tags = [entry.kind, ...(entry.tags || [])].filter(Boolean).slice(0, 5);
    tags.forEach((t) => {
      const span = document.createElement("span");
      span.textContent = t;
      detailTags.appendChild(span);
    });
  }
}

export function renderArchiveLens(element) {
  currentElement = element;
  const z = element.number;
  const lang = getLang();

  const constellation = document.getElementById("archive-lens-constellation");
  const mainOrb = document.getElementById("archive-main-orb");
  const mainImg = document.getElementById("atom-image-element");
  const mainCaption = document.getElementById("archive-main-caption");
  const orbitItems = document.getElementById("archive-orbit-items");
  const lens = document.getElementById("archive-lens");

  if (!constellation || !mainOrb || !mainImg || !orbitItems || !lens) return;

  closeArchiveDetail();

  // Load entries for this element from elementArchives data
  const rawList = elementArchives[String(z)] || [];
  let entries = rawList.map((item) => ({
    ...item,
    fallback: element.symbol || String(z),
  }));

  // Ensure default entry if empty
  if (entries.length === 0) {
    entries = [
      {
        kind: "Sample",
        title: `${element.name} (${element.symbol})`,
        image: "",
        text: `${element.name} archive entry.`,
        tags: [element.symbol, String(z)],
        fallback: element.symbol,
      },
    ];
  }

  currentEntries = entries;
  activeEntryIndex = 0;

  // Set main central orb (Portrait / Sample)
  const mainEntry = entries[0];
  setImageWithFallback(mainImg, null, mainEntry, 640);
  if (mainCaption) mainCaption.textContent = localizeKind(mainEntry.kind || "Sample", lang);
  mainOrb.dataset.archiveIndex = "0";
  mainOrb.onclick = (e) => {
    e.stopPropagation();
    openArchiveEntry(0, true);
  };

  // Build satellite orbit items (Origin, Science, History, Uses, etc.)
  orbitItems.innerHTML = "";
  const satelliteEntries = entries.slice(1, 6);
  const count = satelliteEntries.length;

  satelliteEntries.forEach((entry, idx) => {
    const entryIndex = idx + 1;
    let baseAngle = -90;
    if (count === 1) baseAngle = -135;
    else if (count === 2) baseAngle = -135;
    else if (count === 3) baseAngle = -120;
    else if (count === 4) baseAngle = -135;
    else if (count === 5) baseAngle = -108;

    const angle = baseAngle + (idx * 360) / Math.max(1, count);
    const rad = (angle * Math.PI) / 180;
    const dist = 160;
    const x = Math.round(Math.cos(rad) * dist);
    const y = Math.round(Math.sin(rad) * dist);

    const orbBtn = document.createElement("button");
    orbBtn.type = "button";
    orbBtn.className = "archive-orb archive-orb-small";
    orbBtn.dataset.archiveIndex = String(entryIndex);
    orbBtn.style.setProperty("--orbit-angle", `${angle}deg`);
    orbBtn.style.setProperty("--orbit-x", `${x}px`);
    orbBtn.style.setProperty("--orbit-y", `${y}px`);
    orbBtn.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    const mediaSpan = document.createElement("span");
    mediaSpan.className = "archive-orb-media";

    const img = document.createElement("img");
    img.loading = "lazy";
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "archive-focus-fallback";
    fallbackDiv.style.position = "absolute";
    fallbackDiv.style.inset = "0";
    fallbackDiv.style.display = "none";
    fallbackDiv.style.alignItems = "center";
    fallbackDiv.style.justifyContent = "center";
    fallbackDiv.style.fontWeight = "700";

    setImageWithFallback(img, fallbackDiv, entry, 640);
    mediaSpan.append(img, fallbackDiv);

    const captionSpan = document.createElement("span");
    captionSpan.className = "archive-orb-caption";
    captionSpan.textContent = localizeKind(entry.kind, lang);

    orbBtn.append(mediaSpan, captionSpan);
    orbBtn.onclick = (e) => {
      e.stopPropagation();
      openArchiveEntry(entryIndex, false);
    };

    orbitItems.appendChild(orbBtn);
  });
}

export function initArchiveLensController() {
  const detailClose = document.getElementById("archive-detail-close");
  if (detailClose) {
    detailClose.onclick = (e) => {
      e.stopPropagation();
      closeArchiveDetail();
    };
  }

  const portraitBack = document.getElementById("archive-portrait-back");
  if (portraitBack) {
    portraitBack.onclick = (e) => {
      e.stopPropagation();
      closeArchiveDetail();
    };
  }

  const suggestLaunch = document.getElementById("archive-overview-suggest-source");
  const suggestDialog = document.getElementById("archive-image-suggestion-dialog");
  const suggestCancel = document.getElementById("archive-image-suggestion-cancel");

  if (suggestLaunch && suggestDialog) {
    suggestLaunch.onclick = () => {
      try {
        suggestDialog.showModal();
      } catch (_) {
        suggestDialog.setAttribute("open", "true");
      }
    };
  }
  if (suggestCancel && suggestDialog) {
    suggestCancel.onclick = () => {
      try {
        suggestDialog.close();
      } catch (_) {
        suggestDialog.removeAttribute("open");
      }
    };
  }
}
