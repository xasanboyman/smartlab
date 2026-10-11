import { useEffect, useRef } from "react";

// Clamp single-frame spikes (e.g. pointer lock transition or large trackpad fling)
// so the camera never jerks wildly, but NEVER discard the movement completely!
const MAX_MOUSE_STEP = 180;
// In drag/touchpad mode, movement under this threshold is considered an in-place click/interaction.
const CLICK_SLOP = 8;
// In drag/touchpad mode, holding down longer than this starts a continuous action (pouring, stirring).
const HOLD_AFTER_MS = 200;
const SLOT_KEYS = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4 };

/**
 * High-performance, freeze-proof FPS input listener.
 * Seamlessly supports:
 * 1. Pointer Lock mode (desktop mouse)
 * 2. Touchpad drag & two-finger swipe look (laptop trackpads)
 * 3. Mobile touch drag & tap-to-interact
 */
export const useFpsInput = (modeRef) => {
  const inputRef = useRef({
    keys: new Set(),
    lookX: 0,
    lookY: 0,
    events: [],
    primaryDown: false,
  });

  useEffect(() => {
    const input = inputRef.current;
    let press = null;
    let lastPointer = null;
    let isPointerDragging = false;

    const clear = () => {
      input.keys.clear();
      input.lookX = 0;
      input.lookY = 0;
      input.events.length = 0;
      input.primaryDown = false;
      if (press) clearTimeout(press.timer);
      press = null;
      lastPointer = null;
      isPointerDragging = false;
    };

    const onKeyDown = (e) => {
      input.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyG") input.events.push({ type: "drop" });
      if (e.code in SLOT_KEYS) input.events.push({ type: "slot", slot: SLOT_KEYS[e.code] });
    };

    const onKeyUp = (e) => {
      input.keys.delete(e.code);
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const onCanvas = e.target instanceof HTMLCanvasElement || e.target?.closest?.("canvas");

      lastPointer = { x: e.clientX, y: e.clientY };

      if (document.pointerLockElement) {
        input.events.push({ type: "primary" });
        input.primaryDown = true;
        return;
      }

      if (onCanvas) {
        isPointerDragging = true;
        press = {
          x: e.clientX,
          y: e.clientY,
          moved: false,
          held: false,
          target: e.target,
        };

        press.timer = setTimeout(() => {
          if (!press || press.moved) return;
          press.held = true;
          input.events.push({ type: "primary" });
          input.primaryDown = true;
        }, HOLD_AFTER_MS);
      }
    };

    const onPointerMove = (e) => {
      const isLocked = Boolean(document.pointerLockElement);
      const isDragMode = modeRef.current === "drag" || !isLocked;

      let dx = 0;
      let dy = 0;

      if (isLocked) {
        // Locked pointer mode: browser provides movementX / movementY
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      } else if (isPointerDragging || (e.buttons & 1) === 1) {
        // Unlocked / touchpad drag: compute delta from last known position or movement
        if (lastPointer) {
          dx = e.movementX !== undefined && Math.abs(e.movementX) > 0 ? e.movementX : e.clientX - lastPointer.x;
          dy = e.movementY !== undefined && Math.abs(e.movementY) > 0 ? e.movementY : e.clientY - lastPointer.y;
        } else if (e.movementX !== undefined) {
          dx = e.movementX;
          dy = e.movementY;
        }

        if (press && !press.held) {
          const dist = Math.hypot(e.clientX - press.x, e.clientY - press.y);
          if (dist >= CLICK_SLOP) {
            press.moved = true;
          }
        }
      }

      lastPointer = { x: e.clientX, y: e.clientY };

      if (!isLocked && !isPointerDragging && (e.buttons & 1) !== 1) {
        return;
      }

      // CLAMP instead of discarding so rapid touchpad gestures never freeze!
      const clampedX = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, dx));
      const clampedY = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, dy));

      input.lookX += clampedX;
      input.lookY += clampedY;
    };

    const onPointerUp = (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      input.primaryDown = false;
      isPointerDragging = false;
      lastPointer = null;

      if (!press) return;
      clearTimeout(press.timer);

      const still = Math.hypot(e.clientX - press.x, e.clientY - press.y) < CLICK_SLOP;
      const onCanvas = press.target instanceof HTMLCanvasElement || press.target?.closest?.("canvas");

      if (!press.held && still && onCanvas) {
        input.events.push({ type: "primary" });
      }
      press = null;
    };

    const onPointerCancel = () => {
      input.primaryDown = false;
      isPointerDragging = false;
      if (press) clearTimeout(press.timer);
      press = null;
      lastPointer = null;
    };

    // Touchpad two-finger swipe or mouse wheel
    const onWheel = (e) => {
      // If hovering over a scrollable menu or input, allow standard scrolling
      if (e.target?.closest?.("[data-cabinet-scroll], [data-no-look-scroll]")) return;

      const isTouchpadSwipe = Math.abs(e.deltaX) > 0 || (Math.abs(e.deltaY) % 1 !== 0 && Math.abs(e.deltaY) < 60);

      if (isTouchpadSwipe && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // Trackpad two-finger swipe look-around!
        const clampedX = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, e.deltaX * 0.85));
        const clampedY = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, e.deltaY * 0.85));
        input.lookX += clampedX;
        input.lookY += clampedY;
      } else {
        // Discrete mouse wheel notch: cycle active equipment hotbar slot
        if (Math.abs(e.deltaY) < 1) return;
        input.events.push({ type: "wheel", direction: Math.sign(e.deltaY) });
      }
    };

    const onLockChange = () => {
      if (!document.pointerLockElement && modeRef.current !== "drag") {
        // Do not violently wipe all inputs so touchpad transition stays seamless
        input.lookX = 0;
        input.lookY = 0;
        input.primaryDown = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("blur", clear);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", clear);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [modeRef]);

  return inputRef;
};
