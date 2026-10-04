import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Heart,
  Activity,
  Sparkles,
  Maximize2,
  ExternalLink,
  Bone,
  Brain,
  Dumbbell,
  Shield,
  Info,
  CheckCircle2,
} from "lucide-react";

// Anatomical systems definition with Uzbek descriptions
const SYSTEM_DEFINITIONS = {
  skeleton: {
    id: "skeleton",
    name: "Skelet tizimi",
    latin: "Systema skeletale",
    icon: Bone,
    color: "#e2e8f0",
    badge: "206 ta suyak",
    keywords: ["skeleton", "bone", "spine", "skull", "pelvis", "rib", "femur", "tibia", "clavicle", "scapula"],
    description: "Inson skeleti 206 ta suyakdan iborat bo'lib, tanaga tayanch beradi, ichki a'zolarni himoyalaydi va harakatlanish imkonini yaratadi. Qizil suyak ko'migi qon hujayralarini (eritrotsitlar, leykotsitlar) ishlab chiqaradi.",
  },
  muscles: {
    id: "muscles",
    name: "Mushaklar tizimi",
    latin: "Systema musculare",
    icon: Dumbbell,
    color: "#f87171",
    badge: "600+ mushak",
    keywords: ["muscle", "muscular", "biceps", "pectoral", "triceps", "deltoid", "gluteus", "quadriceps", "myo"],
    description: "Mushaklar tizimi tananing barcha harakatlarini, gavda muvozanatini va issiqlik ishlab chiqarishni ta'minlaydi. Skelet mushaklari ixtiyoriy qisqarib, tendonlar orqali suyaklarni harakatga keltiradi.",
  },
  circulatory: {
    id: "circulatory",
    name: "Yurak va Qon-tomir",
    latin: "Systema cardiovasculare",
    icon: Heart,
    color: "#ef4444",
    badge: "Animatsion puls",
    keywords: ["heart", "circulat", "artery", "vein", "vessel", "aorta", "vena"],
    description: "Yurak kuniga taxminan 100 000 marta urib, qonni 100 000 km uzunlikdagi tomirlar tarmog'i bo'ylab haydaydi. Qon kislorod, ozuqa moddalari va gormonlarni barcha to'qimalarga yetkazadi.",
  },
  respiratory: {
    id: "respiratory",
    name: "O'pka va Nafas olish",
    latin: "Systema respiratorium",
    icon: Activity,
    color: "#38bdf8",
    badge: "Nafas harakati",
    keywords: ["lung", "breath", "trachea", "diafragm", "bronch", "pulmon"],
    description: "O'pka va diafragma havoni qabul qilib, alveolalar orqali gazlar almashinuvini (O₂ qon ichiga, CO₂ tashqariga) amalga oshiradi. O'pka maydoni taxminan 70-100 m² ni tashkil qiladi.",
  },
  brain: {
    id: "brain",
    name: "Bosh miya va Nervlar",
    latin: "Systema nervosum",
    icon: Brain,
    color: "#a855f7",
    badge: "86 mlrd neyron",
    keywords: ["brain", "cerebr", "nerve", "eye", "head"],
    description: "Bosh miya inson organizmining boshqaruv markazidir. 86 milliard neyron soniyasiga millionlab elektr signallarini uzatib, fikrlash, xotira, his-tuyg'u va barcha a'zolar funksiyasini tartibga soladi.",
  },
  digestive: {
    id: "digestive",
    name: "Hazm tizimi va Jigari",
    latin: "Systema digestorium",
    icon: Shield,
    color: "#f59e0b",
    badge: "Metabolizm",
    keywords: ["digestive", "stomach", "liver", "intestine", "galblader", "hepar", "colon"],
    description: "Hazm yo'li qizilo'ngach, oshqozon, ingichka va yo'g'on ichak hamda jigarni o'z ichiga oladi. Oziq-ovqatlarni parchalab, oqsillar, yog'lar, uglevodlar va vitaminlarni qonga so'radi.",
  },
  skin: {
    id: "skin",
    name: "Teri qatlami",
    latin: "Integumentum commune",
    icon: Layers,
    color: "#fbbf24",
    badge: "Eng katta a'zo",
    keywords: ["skin", "body", "surface", "derma"],
    description: "Teri inson tanasining eng katta a'zosi bo'lib (1.5 - 2 m²), tanani tashqi mikroblar, ultrabinafsha nurlar va mexanik shikastlardan himoyalaydi, tana haroratini boshqaradi.",
  },
};

const CAMERA_PRESETS = [
  { id: "full", label: "Butun tana", eye: [0, -3.5, 0.5], target: [0, 0, 0] },
  { id: "head", label: "Bosh & Miya", eye: [0, -1.2, 1.4], target: [0, 0, 1.4] },
  { id: "chest", label: "Ko'krak qafasi & Yurak", eye: [0, -1.8, 0.6], target: [0, 0, 0.6] },
  { id: "abdomen", label: "Qorin bo'shlig'i", eye: [0, -1.6, 0.1], target: [0, 0, 0.1] },
];

export const SketchfabHumanViewer = ({ uid = "9b0b079953b840bc9a13f524b60041e4", className = "" }) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activePreset, setActivePreset] = useState("full");
  const [selectedSystem, setSelectedSystem] = useState("skeleton");
  const [fullscreen, setFullscreen] = useState(false);

  // Layer visibility state
  const [layers, setLayers] = useState({
    skeleton: true,
    muscles: true,
    circulatory: true,
    respiratory: true,
    brain: true,
    digestive: true,
    skin: false, // Hidden by default to show internal muscles and skeleton
  });

  // Node map categorized by system
  const systemNodesRef = useRef({
    skeleton: [],
    muscles: [],
    circulatory: [],
    respiratory: [],
    brain: [],
    digestive: [],
    skin: [],
  });

  // Load Sketchfab Viewer API Script and initialize
  useEffect(() => {
    let isCancelled = false;

    const initSketchfab = () => {
      if (!window.Sketchfab || !iframeRef.current) return;

      const client = new window.Sketchfab("1.12.1", iframeRef.current);
      client.init(uid, {
        autostart: 1,
        preload: 1,
        ui_theme: "dark",
        ui_watermark: 0,
        ui_infos: 0,
        ui_controls: 1,
        ui_annotations: 1,
        ui_animations: 1,
        ui_hint: 0,
        transparent: 0,
        success: (api) => {
          if (isCancelled) return;
          apiRef.current = api;
          api.start();

          api.addEventListener("viewerready", () => {
            if (isCancelled) return;
            setIsLoading(false);
            setIsApiReady(true);

            // Fetch all nodes in the 3D model
            api.getNodeMap((err, nodes) => {
              if (err || !nodes) return;

              const categorized = {
                skeleton: [],
                muscles: [],
                circulatory: [],
                respiratory: [],
                brain: [],
                digestive: [],
                skin: [],
              };

              Object.values(nodes).forEach((node) => {
                if (!node || node.instanceID == null) return;
                const nodeName = String(node.name || "").toLowerCase();

                // Categorize nodes by matching keywords
                Object.entries(SYSTEM_DEFINITIONS).forEach(([sysKey, sysDef]) => {
                  if (sysDef.keywords.some((kw) => nodeName.includes(kw))) {
                    categorized[sysKey].push(node.instanceID);
                  }
                });
              });

              systemNodesRef.current = categorized;

              // Hide skin by default if skin nodes exist
              if (categorized.skin && categorized.skin.length > 0) {
                categorized.skin.forEach((id) => api.hide(id));
              }
            });
          });
        },
        error: () => {
          if (isCancelled) return;
          setIsLoading(false);
        },
      });
    };

    // Check if script already loaded
    if (window.Sketchfab) {
      initSketchfab();
    } else {
      const script = document.createElement("script");
      script.src = "/vendor/sketchfab-viewer-1.12.1.js";
      script.async = true;
      script.onload = () => initSketchfab();
      script.onerror = () => {
        // Fallback to CDN if local fails
        const fallbackScript = document.createElement("script");
        fallbackScript.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
        fallbackScript.async = true;
        fallbackScript.onload = () => initSketchfab();
        fallbackScript.onerror = () => setIsLoading(false);
        document.body.appendChild(fallbackScript);
      };
      document.body.appendChild(script);
    }

    return () => {
      isCancelled = true;
    };
  }, [uid]);

  // Toggle individual system layer visibility
  const toggleSystemLayer = useCallback(
    (systemKey) => {
      const willBeVisible = !layers[systemKey];
      setLayers((prev) => ({ ...prev, [systemKey]: willBeVisible }));
      setSelectedSystem(systemKey);

      const api = apiRef.current;
      if (!api) return;

      const nodeIds = systemNodesRef.current[systemKey] || [];
      nodeIds.forEach((id) => {
        if (willBeVisible) {
          api.show(id);
        } else {
          api.hide(id);
        }
      });
    },
    [layers]
  );

  // Play / Pause animation
  const toggleAnimation = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    if (isPlaying) {
      api.pause();
      setIsPlaying(false);
    } else {
      api.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Reset view to default camera position
  const resetCamera = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    api.recenterCamera();
    setActivePreset("full");
  }, []);

  // Set camera preset viewpoint
  const setCameraPreset = useCallback((preset) => {
    setActivePreset(preset.id);
    const api = apiRef.current;
    if (!api) return;

    api.setCameraLookAt(preset.eye, preset.target, 1.2, (err) => {
      if (err) api.recenterCamera();
    });
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  const currentSystemInfo = SYSTEM_DEFINITIONS[selectedSystem] || SYSTEM_DEFINITIONS.skeleton;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#0a0c14] overflow-hidden select-none flex flex-col ${className}`}
    >
      {/* 3D Sketchfab Iframe Viewport */}
      <div className="relative flex-1 w-full h-full">
        <iframe
          ref={iframeRef}
          title="Animated Full Human Body Anatomy 3D"
          src={`https://sketchfab.com/models/${uid}/embed?autostart=1&preload=1&ui_theme=dark&ui_watermark=0&ui_infos=0&ui_controls=1&ui_annotations=1&ui_animations=1&transparent=1`}
          className="w-full h-full border-0 absolute inset-0 z-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#070913]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-pulse">
              <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Inson Tanasi 3D Modeli Yuklanmoqda</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Skelet, mushaklar tizimi, yurak, o'pka va ichki a'zolar to'qimalari tayyorlanmoqda...
            </p>
          </div>
        )}

        {/* Top Floating Header & Model Badge */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center gap-2 pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">Inson Tanasi (To'liq 3D Animatsiya)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              PBR • AR/VR
            </span>
          </div>

          <a
            href="https://sketchfab.com/3d-models/animated-full-human-body-anatomy-9b0b079953b840bc9a13f524b60041e4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors flex items-center gap-1.5 pointer-events-auto"
            title="Model muallifi: AVRcontent (Sketchfab)"
          >
            <span>Model: AVRcontent</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Top Right Fullscreen & Reset Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={resetCamera}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-xl transition-all"
            title="Kamerani boshlang'ich holatga qaytarish"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-xl transition-all"
            title="To'liq ekranga o'tish"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Left Side: System & Layer Toggles Bar */}
        <div className="absolute left-4 top-16 bottom-20 z-20 flex flex-col justify-center pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl space-y-1.5 max-h-[75vh] overflow-y-auto pointer-events-auto">
            <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tizimlar</span>
              <span className="text-[10px] text-emerald-400 font-mono">3D Qatlam</span>
            </div>

            {Object.values(SYSTEM_DEFINITIONS).map((sys) => {
              const Icon = sys.icon;
              const isVisible = layers[sys.id];
              const isSelected = selectedSystem === sys.id;

              return (
                <button
                  key={sys.id}
                  onClick={() => toggleSystemLayer(sys.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all group ${
                    isSelected
                      ? "bg-slate-800 border border-slate-700 text-white"
                      : "hover:bg-slate-900/80 text-slate-300 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${sys.color}15`,
                        color: sys.color,
                        border: `1px solid ${sys.color}30`,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate leading-tight">{sys.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{sys.badge}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 group-hover:text-white transition-colors">
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Educational Detail Card for Selected System */}
        {selectedSystem && currentSystemInfo && (
          <div className="absolute right-4 top-16 z-20 w-80 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${currentSystemInfo.color}20`,
                    color: currentSystemInfo.color,
                    border: `1px solid ${currentSystemInfo.color}40`,
                  }}
                >
                  {React.createElement(currentSystemInfo.icon, { className: "w-4 h-4" })}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{currentSystemInfo.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400 italic">{currentSystemInfo.latin}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                {currentSystemInfo.badge}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              {currentSystemInfo.description}
            </p>

            {/* Quick action buttons */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Interaktiv 3D fazo
              </span>
              <button
                onClick={() => toggleSystemLayer(selectedSystem)}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                {layers[selectedSystem] ? "Qatlamni yashirish" : "Qatlamni ko'rsatish"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Floating Toolbar: Animation & Camera Focus */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xl">
          {/* Animation Play/Pause */}
          <button
            onClick={toggleAnimation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-semibold transition-all"
            title={isPlaying ? "Animatsiyani to'xtatish" : "Animatsiyani davom ettirish"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? "Pauza" : "Harakat"}</span>
          </button>

          <div className="w-px h-5 bg-slate-800 hidden sm:block" />

          {/* Camera Viewpoints */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mr-1 hidden sm:inline">
              Fokus:
            </span>
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setCameraPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activePreset === preset.id
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
                    : "bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-800 hidden sm:block" />

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Qaytarish</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SketchfabHumanViewer;
