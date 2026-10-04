import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

const SKETCHFAB_API_SCRIPT_URL = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const MODEL_UID = "9b0b079953b840bc9a13f524b60041e4";

const SketchfabCanvas = forwardRef(function SketchfabCanvas(
  {
    modelUid = MODEL_UID,
    speed = 1,
    paused = false,
    onTimeUpdate = () => {},
    onDurationChange = () => {},
    onNodeMapLoaded = () => {},
    hiddenCategories = new Set(),
    onPick = () => {},
  },
  ref
) {
  const iframeRef = useRef(null);
  const apiRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [nodesByCategory, setNodesByCategory] = useState(null);
  const isSeekingRef = useRef(false);

  // 1. Load Sketchfab API Script if not already present
  useEffect(() => {
    if (window.Sketchfab) return;

    const existingScript = document.querySelector(`script[src="${SKETCHFAB_API_SCRIPT_URL}"]`);
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = SKETCHFAB_API_SCRIPT_URL;
    script.async = true;
    script.onerror = () => {
      setLoadingError("Sketchfab Viewer kutubxonasini yuklab bo'lmadi. Internet aloqasini tekshiring.");
    };
    document.head.appendChild(script);
  }, []);

  const callbacksRef = useRef({
    onTimeUpdate,
    onDurationChange,
    onNodeMapLoaded,
    onPick,
  });
  useEffect(() => {
    callbacksRef.current = {
      onTimeUpdate,
      onDurationChange,
      onNodeMapLoaded,
      onPick,
    };
  });

  // 2. Initialize Sketchfab Viewer Client (Runs once per modelUid)
  const initViewer = useCallback(() => {
    if (!iframeRef.current) return;
    if (!window.Sketchfab) {
      const t = setTimeout(initViewer, 200);
      return () => clearTimeout(t);
    }

    setLoaded(false);
    setLoadingError(null);

    const safetyTimer = setTimeout(() => {
      setLoaded(true);
    }, 4500);

    try {
      const client = new window.Sketchfab(iframeRef.current);
      client.init(modelUid, {
        autostart: 1,
        ui_controls: 0,
        ui_infos: 0,
        ui_watermark: 0,
        ui_stop: 0,
        ui_animations: 0,
        ui_inspector: 0,
        ui_help: 0,
        ui_settings: 0,
        ui_vr: 0,
        ui_fullscreen: 0,
        ui_annotations: 0,
        transparent: 0,
        dnt: 1,
        camera: 0,
        preload: 1,
        success: (api) => {
          apiRef.current = api;
          api.start();

          api.addEventListener("viewerready", () => {
            clearTimeout(safetyTimer);
            setLoaded(true);

            // Get Animation details safely
            api.getAnimations((a, b) => {
              const animList = Array.isArray(a) ? a : Array.isArray(b) ? b : [];
              if (animList.length > 0 && animList[0]) {
                const first = animList[0];
                const dur =
                  typeof first === "object"
                    ? first.duration ?? first[2] ?? 46.667
                    : 46.667;
                callbacksRef.current.onDurationChange?.(dur);
              } else {
                callbacksRef.current.onDurationChange?.(46.667);
              }
            });

            // Get 3D Nodes safely
            api.getNodeMap((a, b) => {
              const nodes =
                a && typeof a === "object" && !a.message ? a : b;
              if (nodes && typeof nodes === "object") {
                const categorized = categorizeNodes(nodes);
                setNodesByCategory(categorized);
                callbacksRef.current.onNodeMapLoaded?.(categorized);
              }
            });

            // Listen to timeline progress
            api.addEventListener("timeoffset", (time) => {
              if (!isSeekingRef.current) {
                callbacksRef.current.onTimeUpdate?.(time);
              }
            });

            // Click picking
            api.addEventListener("click", (info) => {
              if (info && info.instanceID != null) {
                callbacksRef.current.onPick?.(info);
              }
            });
          });
        },
        error: (err) => {
          console.error("Sketchfab client error:", err);
          setLoadingError("3D modelni yuklashda xatolik yuz berdi.");
        },
      });
    } catch (e) {
      console.error("Sketchfab init error:", e);
      setLoadingError("Sketchfab mijozini ishga tushirishda xatolik.");
    }
  }, [modelUid]);

  useEffect(() => {
    const cleanup = initViewer();
    return () => {
      cleanup?.();
      apiRef.current = null;
    };
  }, [initViewer]);

  // 3. Play / Pause Control
  useEffect(() => {
    if (!apiRef.current || !loaded) return;
    try {
      if (paused) {
        apiRef.current.pause();
      } else {
        apiRef.current.play();
      }
    } catch (e) {
      console.warn("Error toggling play/pause:", e);
    }
  }, [paused, loaded]);

  // 4. Speed Control
  useEffect(() => {
    if (!apiRef.current || !loaded) return;
    try {
      apiRef.current.setSpeed(speed);
    } catch (e) {
      console.warn("Error setting speed:", e);
    }
  }, [speed, loaded]);

  // 5. External Seek Trigger
  const seekToTime = useCallback((time) => {
    if (!apiRef.current || !loaded) return;
    try {
      isSeekingRef.current = true;
      apiRef.current.seekTo(time, () => {
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 150);
      });
    } catch (e) {
      isSeekingRef.current = false;
      console.warn("Error seeking:", e);
    }
  }, [loaded]);

  useImperativeHandle(
    ref,
    () => ({
      seekToTime,
      play: () => apiRef.current?.play(),
      pause: () => apiRef.current?.pause(),
      recenterCamera: () => apiRef.current?.recenterCamera?.(),
      api: apiRef.current,
    }),
    [seekToTime]
  );

  // 6. Node Visibility Toggling
  useEffect(() => {
    if (!apiRef.current || !loaded || !nodesByCategory) return;
    const api = apiRef.current;

    Object.entries(nodesByCategory).forEach(([category, instanceIds]) => {
      const isHidden = hiddenCategories.has(category);
      instanceIds.forEach((id) => {
        try {
          if (isHidden) {
            api.hide(id);
          } else {
            api.show(id);
          }
        } catch (e) {}
      });
    });
  }, [hiddenCategories, nodesByCategory, loaded]);

  return (
    <div className="w-full h-full relative bg-[#0a0a0a] overflow-hidden">
      {/* Loading Overlay */}
      {!loaded && !loadingError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-10 text-white pointer-events-none">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-emerald-400 font-bold text-sm tracking-wide">
            Sketchfab 3D Anatomiya modeli yuklanmoqda...
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Model ID: 9b0b079953b840bc9a13f524b60041e4
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {loadingError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20 text-white p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-red-400 mb-1">
            Modelni yuklab bo'lmadi
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-4">{loadingError}</p>
          <button
            onClick={initViewer}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Qayta urinish</span>
          </button>
        </div>
      )}

      {/* The Sketchfab API Iframe */}
      <iframe
        ref={iframeRef}
        id="sketchfab-api-frame"
        title="Animated Full Human Body Anatomy"
        src={`https://sketchfab.com/models/${modelUid}/embed?autostart=1&ui_controls=0&ui_infos=0&ui_watermark=0&ui_animations=0&ui_stop=0&preload=1`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className="w-full h-full border-0 block"
        onLoad={() => {
          setTimeout(() => setLoaded(true), 2000);
        }}
      />
    </div>
  );
});

export default SketchfabCanvas;

// -------------------------------------------------------------
// Categorize 3D nodes by anatomical structure
// -------------------------------------------------------------
function categorizeNodes(nodes) {
  const categories = {
    skeleton: [],
    brain: [],
    lungs: [],
    heart: [],
    liver: [],
    digestive: [],
    diaphragm: [],
    eyes: [],
    circulatory: [],
    muscles: [],
    skin: [],
  };

  Object.values(nodes || {}).forEach((node) => {
    if (!node.name || (node.type !== "MatrixTransform" && node.type !== "Geometry" && node.type !== "Group")) return;
    const name = node.name.toLowerCase();
    const id = node.instanceID;

    if (
      name.includes("ribcage") ||
      name.includes("spine") ||
      name.includes("pelvis") ||
      name.includes("legs") ||
      name.includes("hands") ||
      name.includes("skel") ||
      name.includes("bone")
    ) {
      categories.skeleton.push(id);
    } else if (name.includes("brain")) {
      categories.brain.push(id);
    } else if (name.includes("lung")) {
      categories.lungs.push(id);
    } else if (name.includes("heart")) {
      categories.heart.push(id);
    } else if (name.includes("liver") || name.includes("gallbladder")) {
      categories.liver.push(id);
    } else if (name.includes("digest") || name.includes("stomach") || name.includes("intestin")) {
      categories.digestive.push(id);
    } else if (name.includes("diafrag")) {
      categories.diaphragm.push(id);
    } else if (name.includes("eye")) {
      categories.eyes.push(id);
    } else if (
      name.includes("circulat") ||
      name.includes("vessel") ||
      name.includes("artery") ||
      name.includes("vein")
    ) {
      categories.circulatory.push(id);
    } else if (name.includes("muscle") || name.includes("muscul")) {
      categories.muscles.push(id);
    } else if (name.includes("skin") || name.includes("body")) {
      categories.skin.push(id);
    }
  });

  return categories;
}
