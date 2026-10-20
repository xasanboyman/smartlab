// =============================================================================
// Zperiod embed — mounts the vendored app natively inside a host element.
//   mountZperiod(container, { page, lang, searchSlot, onPageChange })
//   showPage(page) · unmountZperiod() · openElement(symbolOrNumber)
// The DOM is created once and kept alive between mounts (controllers bind
// document/window listeners that must not be duplicated), so navigating away
// and back is a cheap re-attach.
// =============================================================================
import appHtml from "./app.html?raw";
import "../css/base.css";
import "../css/grid.css";
import "../css/modal.css";
import "../css/tools.css";
import "../css/ions.css";
import "../css/worksheet-styles.css";
import "../css/ion-animations.css";
import "../css/tool-modals/shared.css";
import "../css/embed.css";
import "./theme.css";

import { getChemToolContent } from "../js/modules/chemToolContent.js";
import { attachToolEventListeners } from "../js/modules/chemToolInteractions.js";
import { buildPeriodicTable, initModalUI, setGlobalUnit, l3UnitState, showModal } from "../js/modules/uiController.js";
import { initPageController } from "../js/modules/pageController.js";
import { createToolsModalController } from "../js/modules/toolsModalController.js";
import { getSavedAnimationState, initSettingsController } from "../js/modules/settingsController.js";
import { initElementSearch } from "../js/modules/elementSearchController.js";
import { initLangController, registerCacheCleanup, getLang } from "../js/modules/langController.js";
import { initWorksheetGenerator } from "../js/worksheetGenerator.js";
import { initPeriodicTableScale } from "./tableScale.js";
import { elements } from "../js/data/elementsData.js";

export const PAGES = ["table", "ions", "tools", "worksheet", "settings"];
const PAGE_TO_INTERNAL = { table: "table", ions: "ions", tools: "blank1", worksheet: "blank2", settings: "settings" };
// Body classes the upstream controllers toggle; mirrored onto the scoped root.
const MIRRORED_BODY_CLASSES = ["hide-nav", "lang-menu-blur", "tutorial-active", "reduce-motion"];

let root = null;
let pageCtrl = null;
let searchWrapper = null;
let ionsReady = false;
let modalOnly = false;
let listeners = { onPageChange: null };

function initGlobalDragTracking() {
  if (window._zperiodDragTracking) return;
  window._zperiodDragTracking = true;
  window._zperiodIsDragging = false;
  let pointerDown = false;
  let startX = 0;
  let startY = 0;
  document.addEventListener("pointerdown", (e) => { pointerDown = true; startX = e.clientX; startY = e.clientY; }, true);
  document.addEventListener("pointermove", (e) => {
    if (!pointerDown) return;
    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) window._zperiodIsDragging = true;
  }, true);
  const up = () => { pointerDown = false; setTimeout(() => { window._zperiodIsDragging = false; }, 80); };
  document.addEventListener("pointerup", up, true);
  document.addEventListener("pointercancel", up, true);
}

function mirrorBodyClasses() {
  const sync = () => {
    for (const cls of MIRRORED_BODY_CLASSES) root.classList.toggle(cls, document.body.classList.contains(cls));
  };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  sync();
}

function watchElementModal() {
  const modal = root.querySelector("#element-modal");
  if (!modal) return;
  new MutationObserver(() => {
    // In modal-only mode (opened from another page) the root leaves the DOM once the card closes.
    if (modalOnly && !modal.classList.contains("active")) {
      modalOnly = false;
      root.classList.remove("zp-modal-only");
      root.remove();
    }
  }).observe(modal, { attributes: true, attributeFilter: ["class"] });
}

function bootstrap(options) {
  root = document.createElement("div");
  root.className = "zp-root embed is-desktop";
  root.innerHTML = appHtml;
  (options.container || document.body).appendChild(root);

  initGlobalDragTracking();
  const anim = getSavedAnimationState();
  window._zperiodAnimPaused = anim.paused;
  window._zperiodAnimSpeed = anim.speed;

  window.__zperiodDefaultLang = options.lang || "uz";
  initLangController();
  root.setAttribute("lang", getLang());

  initPeriodicTableScale(root);
  buildPeriodicTable(root.querySelector("#periodic-table"));
  initModalUI();

  const toolsModalController = createToolsModalController({ getToolContent: getChemToolContent, attachToolEventListeners });
  toolsModalController.init();
  registerCacheCleanup(() => toolsModalController.clearToolContentCache());

  pageCtrl = initPageController({
    onTablePageShown: () => window._scalePeriodicTable?.(true),
    onIonsPageShown: () => {
      if (ionsReady) return;
      ionsReady = true;
      import("../js/modules/ionsController.js")
        .then((m) => m.initIonsTable())
        .catch((e) => { ionsReady = false; console.error("Ions init error:", e); });
    },
    onToolsPageShown: () => setTimeout(() => toolsModalController.initChemToolCards(), 100),
    onSettingsPageShown: () => requestAnimationFrame(() => window._syncGlobalUnitButtons?.(true)),
  });
  initElementSearch(pageCtrl);
  initWorksheetGenerator();
  initSettingsController({ onOpenWelcome: () => {}, l3UnitState, setGlobalUnit });

  root.querySelectorAll(".nav-pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => listeners.onPageChange?.(btn.dataset.page));
  });

  searchWrapper = root.querySelector("#element-search-wrapper");
  mirrorBodyClasses();
  watchElementModal();
}

function ensureRoot(options = {}) {
  if (!root) bootstrap(options);
  return root;
}

export function showPage(page) {
  if (!root || !PAGES.includes(page)) return;
  if (pageCtrl?.getCurrentPage() === PAGE_TO_INTERNAL[page]) return;
  // The (hidden) pill button is upstream's single entry point for page switches.
  root.querySelector(`.nav-pill-btn[data-page="${page}"]`)?.click();
}

export function mountZperiod(container, options = {}) {
  listeners.onPageChange = options.onPageChange || null;
  if (modalOnly) {
    modalOnly = false;
    root.classList.remove("zp-modal-only");
  }
  ensureRoot({ ...options, container });
  if (root.parentElement !== container) container.appendChild(root);
  if (options.searchSlot && searchWrapper && searchWrapper.parentElement !== options.searchSlot) {
    options.searchSlot.appendChild(searchWrapper);
  }
  showPage(options.page || "table");
  requestAnimationFrame(() => window._scalePeriodicTable?.(true));
  return { showPage, unmount: unmountZperiod };
}

export function unmountZperiod() {
  if (!root) return;
  listeners.onPageChange = null;
  root.querySelector("#element-modal")?.classList.remove("active");
  root.querySelector("#ion-modal")?.classList.remove("active");
  document.body.classList.remove("hide-nav");
  root.remove();
}

// Opens the element card (with the 3D atom) from anywhere, e.g. the Molecules page.
export function openElement(symbolOrNumber) {
  const element = elements.find((e) => e.symbol === symbolOrNumber || e.number === Number(symbolOrNumber));
  if (!element) return false;
  ensureRoot();
  if (!root.isConnected) {
    modalOnly = true;
    root.classList.add("zp-modal-only");
    document.body.appendChild(root);
  }
  showModal(element);
  return true;
}
