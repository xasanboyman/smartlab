import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Scissors,
  Layers,
  Sparkles,
  Info,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Search,
  Eye,
  EyeOff,
  Bone,
  Dumbbell,
  HeartPulse,
  Heart,
  Wind,
  Brain,
  Activity,
  UtensilsCrossed,
  Droplets,
  Flame,
  User,
  SlidersHorizontal,
  Plus,
  GripVertical,
  Trash2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Zap,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Keyboard,
  ShieldCheck,
  Crosshair,
  Compass,
  Scan,
  Check,
  PanelRight,
  PanelBottom,
  PanelLeft,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import NativeAnatomyCanvas from "./NativeAnatomyCanvas";
import HtmlInCanvasOverlay from "./HtmlInCanvasOverlay";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import {
  ANATOMY_TOPICS,
  ANATOMY_CATEGORIES,
  getAnatomyTopic,
  DISCLAIMER,
} from "./engine/anatomyData";
import {
  AnatomyNarrator,
  LIGHTING_PRESETS,
  ANATOMICAL_PINS,
  ANATOMICAL_REGIONS,
} from "./engine/HtmlCanvasManager";
import { anatomyAudio } from "./engine/AnatomyAudio";
import DecryptHeader from "@/shared/components/ui/DecryptHeader";
import BendCard from "@/shared/components/3d/html-in-canvas/BendCard";

const ICON_MAP = {
  Bone,
  Dumbbell,
  HeartPulse,
  Layers,
  User,
  Heart,
  Wind,
  Brain,
  Activity,
  UtensilsCrossed,
  Droplets,
  Flame,
  Eye,
};

const LEVER_TIERS = [
  { p: 100, label: "Teri", sub: "Tashqi qoplama", icon: User },
  { p: 75, label: "Mushaklar", sub: "600+ faol tola", icon: Dumbbell },
  { p: 50, label: "Qon-tomir", sub: "Arteriya & vena", icon: HeartPulse },
  { p: 25, label: "A'zolar", sub: "Ichki organlar", icon: Activity },
  { p: 0, label: "Skelet", sub: "206 ta suyak", icon: Bone },
];

const CAMERA_REGIONS = [
  { id: "all", label: "To'liq", icon: User },
  { id: "head", label: "Bosh", icon: Brain },
  { id: "chest", label: "Ko'krak", icon: Wind },
  { id: "abdomen", label: "Qorin", icon: Activity },
  { id: "pelvis", label: "Tos", icon: Bone },
  { id: "legs", label: "Oyoqlar", icon: Dumbbell },
];

const SimulatorPage = () => {
  // Navigation & View Mode: "explore" | "slice" | "pins"
  const [viewMode, setViewMode] = useState("explore");
  const [activeTopicId, setActiveTopicId] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1200);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("tuzilish"); // "tuzilish" | "azolar" | "asboblar"
  const [activeRegion, setActiveRegion] = useState("all");

  // Day & Night Studio Theme ("day" | "night")
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("smartlab_anatomy_theme") || "night";
    } catch (_) {
      return "night";
    }
  });

  // Layer X-Ray & Transparency overrides (allows internal skeleton/organs to show through skin/muscles)
  const [skinXRay, setSkinXRay] = useState(false);
  const [musclesXRay, setMusclesXRay] = useState(false);

  // Slicing Plane Tool States (0-100%, 360° arbitrary rotation, multi-region)
  const [sliceCutOn, setSliceCutOn] = useState(false);
  const [sliceAxis, setSliceAxis] = useState("vertical_z"); // Start with "vertical_z" (Koronal Front-to-Back)
  const [sliceDirection, setSliceDirection] = useState("front_to_back"); // Default to front-to-back so interior is exposed
  const [sliceRegion, setSliceRegion] = useState("all"); // "all" | "head" | "chest" | "abdomen" | "pelvis" | "legs"
  const [slicePosition, setSlicePosition] = useState(40); // 40% immediately exposes ribcage, heart, lungs, and internal anatomy!
  const [sliceAngle, setSliceAngle] = useState(0); // 0 to 360 degrees
  const [sliceTilt, setSliceTilt] = useState(0);
  const [sliceOffsetX, setSliceOffsetX] = useState(0);
  const [sliceOffsetY, setSliceOffsetY] = useState(0);
  const [sliceFlipped, setSliceFlipped] = useState(false);
  const [showAdvancedSlice, setShowAdvancedSlice] = useState(false);
  const [isSliceMinimized, setIsSliceMinimized] = useState(false);
  const [sliceDockPosition, setSliceDockPosition] = useState("right"); // "right" | "bottom" | "left"
  const [rightPanelTab, setRightPanelTab] = useState("slice"); // "slice" | "details"

  // 360° Turntable Auto-rotation
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.0);

  // Lighting Studio Preset
  const [lightingPreset, setLightingPreset] = useState("medical"); // "medical" | "cyber" | "xray" | "day_clinical"
  const [isLightingOpen, setIsLightingOpen] = useState(false);

  // Physiological Live Engine (Heartbeat, Lungs Breathing, Arterial Pulse)
  const [isPhysiologicalActive, setIsPhysiologicalActive] = useState(true);
  const [heartBpm, setHeartBpm] = useState(72);
  const [isHeartBeating, setIsHeartBeating] = useState(true);
  const [isBreathing, setIsBreathing] = useState(true);
  const [isAcousticHeart, setIsAcousticHeart] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);

  // 3D Spatial Pins (HTML-in-Canvas)
  const [pinsEnabled, setPinsEnabled] = useState(false);
  const [activePinId, setActivePinId] = useState(null);

  // Audio Speech Narration & Sound FX
  const narratorRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => anatomyAudio.isMuted);

  useEffect(() => {
    narratorRef.current = new AnatomyNarrator();
    return () => narratorRef.current?.stop();
  }, []);

  // Vertical Lever Ref and Drag State
  const leverTrackRef = useRef(null);
  const [isDraggingLever, setIsDraggingLever] = useState(false);
  const [isLeverCollapsed, setIsLeverCollapsed] = useState(false);

  // Layer Progress (0: Skeleton only, 100: Full skin)
  const [layerProgress, setLayerProgress] = useState(100);
  const [layerVisibilities, setLayerVisibilities] = useState({
    skeleton: true,
    organs: true,
    vessels: true,
    muscles: true,
    skin: true,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [cameraInstance, setCameraInstance] = useState(null);

  // Capture camera instance once canvas is mounted
  useEffect(() => {
    const checkCamera = () => {
      const cam = canvasRef.current?.getCamera?.();
      if (cam) setCameraInstance(cam);
      else setTimeout(checkCamera, 150);
    };
    checkCamera();
  }, []);

  // Active layer info for the vertical lever
  const activeLayerInfo = useMemo(() => {
    if (layerProgress >= 86) return { label: "Tashqi Teri", sub: "100% Teri qoplami", icon: User };
    if (layerProgress >= 62) return { label: "Mushaklar", sub: "600+ faol tola", icon: Dumbbell };
    if (layerProgress >= 38) return { label: "Qon-tomir", sub: "Arteriya & venalar", icon: HeartPulse };
    if (layerProgress >= 12) return { label: "Ichki a'zolar", sub: "Hayotiy organlar", icon: Activity };
    return { label: "Skelet tizimi", sub: "206 ta asosiy suyak", icon: Bone };
  }, [layerProgress]);

  // Pointer drag handler for vertical lever
  const handleLeverPointerDown = useCallback((e) => {
    const track = leverTrackRef.current;
    if (!track) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDraggingLever(true);
    setActiveTopicId("all");
    anatomyAudio.playClick();

    const updateFromY = (clientY) => {
      const rect = track.getBoundingClientRect();
      const clampedY = Math.max(rect.top, Math.min(rect.bottom, clientY));
      const p = Math.round(((rect.bottom - clampedY) / rect.height) * 100);
      const clampedP = Math.min(100, Math.max(0, p));
      setLayerProgress(clampedP);
      anatomyAudio.playSliderTick(350 + clampedP * 4);
    };

    updateFromY(e.clientY);

    const handlePointerMove = (moveEvt) => {
      updateFromY(moveEvt.clientY);
    };

    const handlePointerUp = (upEvt) => {
      setIsDraggingLever(false);
      try {
        e.currentTarget.releasePointerCapture(upEvt.pointerId);
      } catch (_) {}
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, []);

  // Set layer progress with sound
  const handleSetLayer = useCallback((targetP) => {
    setLayerProgress(targetP);
    setActiveTopicId("all");
    anatomyAudio.playSliderTick(400 + targetP * 3);
  }, []);

  // Calculate layer opacities from layerProgress (0 to 100)
  const layerOpacities = useMemo(() => {
    const p = layerProgress;
    let skeleton = 1.0;
    let organs = 1.0;
    let vessels = 1.0;
    let muscles = 1.0;
    let skin = 1.0;

    if (p <= 25) {
      skeleton = 1.0;
      organs = p / 25;
      vessels = 0;
      muscles = 0;
      skin = 0;
    } else if (p <= 50) {
      skeleton = 1.0;
      organs = 1.0;
      vessels = (p - 25) / 25;
      muscles = 0;
      skin = 0;
    } else if (p <= 75) {
      skeleton = 1.0;
      organs = 1.0;
      vessels = 1.0;
      muscles = (p - 50) / 25;
      skin = 0;
    } else {
      skeleton = 1.0;
      organs = 1.0;
      vessels = 1.0;
      muscles = 1.0;
      skin = (p - 75) / 25;
    }

    if (skinXRay && skin > 0.35) skin = 0.35;
    if (musclesXRay && muscles > 0.35) muscles = 0.35;

    return { skeleton, organs, vessels, muscles, skin };
  }, [layerProgress, skinXRay, musclesXRay]);

  // Current active topic data
  const activeTopic = useMemo(
    () => getAnatomyTopic(activeTopicId),
    [activeTopicId]
  );

  // Filtered topics for exploration
  const filteredTopics = useMemo(() => {
    return ANATOMY_TOPICS.filter((topic) => {
      const matchCat =
        activeCategory === "all" || topic.category === activeCategory;
      const matchQuery =
        !searchQuery ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.latin.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  // Toggle narration playback
  const toggleNarration = useCallback(() => {
    if (isSpeaking) {
      narratorRef.current?.stop();
      setIsSpeaking(false);
    } else {
      anatomyAudio.playClick();
      const text = `${activeTopic.title}. ${activeTopic.desc}. Qiziqarli fakt: ${activeTopic.funFact}`;
      narratorRef.current?.speak(text, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  }, [isSpeaking, activeTopic]);

  // Stop narration when topic changes
  useEffect(() => {
    narratorRef.current?.stop();
    setIsSpeaking(false);
  }, [activeTopicId]);

  // Toggle Mute Audio
  const handleToggleMute = useCallback(() => {
    const muted = anatomyAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) anatomyAudio.playClick();
  }, []);

  // Turntable Toggle with Sound
  const handleToggleTurntable = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      if (next) {
        anatomyAudio.startTurntableHum();
      } else {
        anatomyAudio.stopTurntableHum();
      }
      return next;
    });
    anatomyAudio.playClick();
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    anatomyAudio.playClick();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Day / Night Theme Toggle Handler
  const handleToggleTheme = useCallback(() => {
    anatomyAudio.playClick();
    setThemeMode((prev) => {
      const next = prev === "day" ? "night" : "day";
      try {
        localStorage.setItem("smartlab_anatomy_theme", next);
      } catch (_) {}
      return next;
    });
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        handleToggleTurntable();
      } else if (e.code === "KeyC") {
        anatomyAudio.playSliceWhoosh();
        setSliceCutOn((prev) => !prev);
      } else if (e.code === "KeyR") {
        anatomyAudio.playCameraSnap();
        canvasRef.current?.recenter();
        setActiveRegion("all");
      } else if (e.code === "Equal" || e.code === "NumpadAdd") {
        anatomyAudio.playClick();
        canvasRef.current?.zoomIn?.(0.8);
      } else if (e.code === "Minus" || e.code === "NumpadSubtract") {
        anatomyAudio.playClick();
        canvasRef.current?.zoomOut?.(1.25);
      } else if (e.code === "KeyT") {
        handleToggleTheme();
      } else if (e.code === "KeyX") {
        anatomyAudio.playClick();
        setSkinXRay((prev) => !prev);
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyM") {
        handleToggleMute();
      } else if (e.code === "KeyP") {
        setPinsEnabled((prev) => !prev);
        anatomyAudio.playClick();
      } else if (e.code === "KeyB") {
        anatomyAudio.playClick();
        setIsBioModalOpen((prev) => !prev);
      } else if (e.code === "Digit1") {
        handleSetLayer(0);
      } else if (e.code === "Digit2") {
        handleSetLayer(25);
      } else if (e.code === "Digit3") {
        handleSetLayer(50);
      } else if (e.code === "Digit4") {
        handleSetLayer(75);
      } else if (e.code === "Digit5") {
        handleSetLayer(100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleTurntable, handleToggleMute, handleSetLayer, handleToggleTheme]);

  // Handle 3D mesh click
  const handlePick = (meshName, hitPoint) => {
    anatomyAudio.playClick();

    // 1. Zoom smoothly into the exact location clicked on the body
    if (hitPoint) {
      canvasRef.current?.focusPoint?.(hitPoint, 38);
    } else {
      canvasRef.current?.focusMesh?.(meshName);
    }

    // 2. Determine topic: check if it's a specific organ or bone
    const specificTopics = ANATOMY_TOPICS.filter(
      (t) => t.id !== "all" && t.id !== "muscles" && t.id !== "skin" && t.id !== "organs"
    );
    const matchedSpecific = specificTopics.find((t) =>
      t.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()))
    );

    if (matchedSpecific) {
      setActiveTopicId(matchedSpecific.id);
      setIsDetailOpen(true);
    } else {
      // General body hit (muscles, skin, vessels) — match by vertical height region if hitPoint exists
      let matchedTopic = null;
      if (hitPoint) {
        const y = hitPoint.y;
        if (y > 62) {
          matchedTopic = ANATOMY_TOPICS.find((t) => t.id === "brain" || t.id === "skull");
        } else if (y > 30) {
          matchedTopic = ANATOMY_TOPICS.find((t) => t.id === "heart" || t.id === "lungs");
        } else if (y > 10) {
          matchedTopic = ANATOMY_TOPICS.find((t) => t.id === "liver" || t.id === "digestive");
        } else if (y > -15) {
          matchedTopic = ANATOMY_TOPICS.find((t) => t.id === "pelvis" || t.id === "muscles");
        } else {
          matchedTopic = ANATOMY_TOPICS.find((t) => t.id === "skeleton" || t.id === "muscles");
        }
      }

      const fallbackTopic = ANATOMY_TOPICS.find((t) =>
        t.keywords?.some((kw) => meshName.toLowerCase().includes(kw.toLowerCase()))
      );

      const topicToSelect = matchedTopic || fallbackTopic;
      if (topicToSelect) {
        setActiveTopicId(topicToSelect.id);
        setIsDetailOpen(true);
      }
    }
  };

  // Handle 3D Pin Click
  const handleSelectPin = (pin) => {
    setActivePinId(pin.id);
    canvasRef.current?.focusPosition(pin.pos, 38);
    const matchedTopic = ANATOMY_TOPICS.find((t) =>
      t.keywords?.some((kw) => pin.id.includes(kw) || pin.label.toLowerCase().includes(kw))
    );
    if (matchedTopic) {
      setActiveTopicId(matchedTopic.id);
      setIsDetailOpen(true);
    }
  };

  // Camera Focus Region Jump & Slice Sync
  const handleFocusRegion = useCallback((regionId) => {
    setActiveRegion(regionId);
    setSliceRegion(regionId);
    setSlicePosition(regionId === "all" ? 40 : 50);
    setActiveTopicId("all");
    anatomyAudio.playCameraSnap();
    canvasRef.current?.focusRegion(regionId);
  }, []);

  // Quick Anatomical Slicing Preset Applier
  const handleApplySlicePreset = useCallback(
    (presetKey) => {
      anatomyAudio.playSliceWhoosh();
      setSliceCutOn(true);
      setActiveTopicId("all");
      setSkinXRay(false);
      setLayerProgress((prev) => (prev < 80 ? 100 : prev));
      setIsSliceMinimized(false);
      if (sliceDockPosition === "right") setRightPanelTab("slice");

      if (presetKey === "chest_coronal") {
        setSliceRegion("chest");
        setSliceAxis("vertical_z");
        setSliceDirection("front_to_back");
        setSlicePosition(38);
        setSliceAngle(0);
        setSliceTilt(0);
        handleFocusRegion("chest");
      } else if (presetKey === "head_sagittal") {
        setSliceRegion("head");
        setSliceAxis("vertical_x");
        setSliceDirection("left_to_right");
        setSlicePosition(50);
        setSliceAngle(0);
        setSliceTilt(0);
        handleFocusRegion("head");
      } else if (presetKey === "chest_transverse") {
        setSliceRegion("chest");
        setSliceAxis("horizontal");
        setSliceDirection("top_to_below");
        setSlicePosition(50);
        setSliceAngle(0);
        setSliceTilt(0);
        handleFocusRegion("chest");
      } else if (presetKey === "all_coronal") {
        setSliceRegion("all");
        setSliceAxis("vertical_z");
        setSliceDirection("front_to_back");
        setSlicePosition(38);
        setSliceAngle(0);
        setSliceTilt(0);
        handleFocusRegion("all");
      } else if (presetKey === "all_sagittal") {
        setSliceRegion("all");
        setSliceAxis("vertical_x");
        setSliceDirection("left_to_right");
        setSlicePosition(50);
        setSliceAngle(0);
        setSliceTilt(0);
        handleFocusRegion("all");
      }
    },
    [handleFocusRegion, sliceDockPosition]
  );

  const sliceConfig = useMemo(
    () => ({
      enabled: sliceCutOn,
      axis: sliceAxis,
      direction: sliceDirection,
      region: sliceRegion,
      position: slicePosition,
      angle: sliceAngle,
      tilt: sliceTilt,
      offsetX: sliceOffsetX,
      offsetY: sliceOffsetY,
      flipped: sliceFlipped,
    }),
    [
      sliceCutOn,
      sliceAxis,
      sliceDirection,
      sliceRegion,
      slicePosition,
      sliceAngle,
      sliceTilt,
      sliceOffsetX,
      sliceOffsetY,
      sliceFlipped,
    ]
  );

  const ActiveIcon = ICON_MAP[activeTopic.icon] || Sparkles;
  const isRightSliceDocked = sliceCutOn && !isSliceMinimized && sliceDockPosition === "right";
  const showRightPanel = isRightSliceDocked || isDetailOpen;

  const isDay = themeMode === "day";

  // Reusable Slicing Console Body
  const renderSliceBody = () => (
    <div className="space-y-3">
      {/* Quick Slicing Presets */}
      <div className="space-y-1.5">
        <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Tezkor Kesimlar (Presets):
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleApplySlicePreset("chest_coronal")}
            className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border text-left flex items-center gap-1.5 transition-all ${
              sliceRegion === "chest" && sliceAxis === "vertical_z"
                ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-[1.02]"
                : isDay
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white"
            }`}
            title="Ko'krak qafasini old tomondan ochib, yurak va o'pkani ko'rsatish"
          >
            <span>🫀</span>
            <span className="truncate">Ko'krak & Yurak</span>
          </button>
          <button
            onClick={() => handleApplySlicePreset("head_sagittal")}
            className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border text-left flex items-center gap-1.5 transition-all ${
              sliceRegion === "head" && sliceAxis === "vertical_x"
                ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-[1.02]"
                : isDay
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white"
            }`}
            title="Kalla suyagini sagittal kesib, bosh miyani ko'rsatish"
          >
            <span>🧠</span>
            <span className="truncate">Bosh & Miya</span>
          </button>
          <button
            onClick={() => handleApplySlicePreset("chest_transverse")}
            className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border text-left flex items-center gap-1.5 transition-all ${
              sliceRegion === "chest" && sliceAxis === "horizontal"
                ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-[1.02]"
                : isDay
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white"
            }`}
            title="Ko'krak qafasini ko'ndalang kesimda tekshirish (KT / MRT)"
          >
            <span>🫁</span>
            <span className="truncate">Ko'ndalang (KT)</span>
          </button>
          <button
            onClick={() => handleApplySlicePreset("all_coronal")}
            className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border text-left flex items-center gap-1.5 transition-all ${
              sliceRegion === "all" && sliceAxis === "vertical_z"
                ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-[1.02]"
                : isDay
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white"
            }`}
            title="To'liq tana bo'ylab oldindan orqaga qarab kesish (Skelet & A'zolar)"
          >
            <span>🦴</span>
            <span className="truncate">To'liq Koronal</span>
          </button>
        </div>
      </div>

      {/* Section 1: Region Selection */}
      <div className="space-y-1.5">
        <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            1. Anatomik Hudud:
          </span>
          <span className={`text-[10px] font-mono ${isDay ? "text-slate-500" : "text-zinc-500"}`}>
            {CAMERA_REGIONS.find((r) => r.id === sliceRegion)?.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {CAMERA_REGIONS.map((reg) => {
            const Icon = reg.icon;
            const isSelected = sliceRegion === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => {
                  anatomyAudio.playClick();
                  setSliceRegion(reg.id);
                  handleFocusRegion(reg.id);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                  isSelected
                    ? "bg-amber-500/25 text-amber-500 dark:text-amber-300 border-amber-500 shadow-md font-bold scale-[1.02]"
                    : isDay
                    ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{reg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Cutting Plane & Direction */}
      <div className="space-y-1.5">
        <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
          <span className="flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 text-amber-400" />
            2. Kesim Tekisligi & Yo'nalish:
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "horizontal", label: "↕ Gorizontal", defaultDir: "top_to_below" },
              { id: "vertical_x", label: "↔ Sagittal", defaultDir: "left_to_right" },
              { id: "vertical_z", label: "↗ Koronal", defaultDir: "front_to_back" },
            ].map((ax) => (
              <button
                key={ax.id}
                onClick={() => {
                  anatomyAudio.playClick();
                  setSliceAxis(ax.id);
                  setSliceDirection(ax.defaultDir);
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                  sliceAxis === ax.id
                    ? "bg-amber-500/25 text-amber-500 dark:text-amber-300 border-amber-500 shadow-md font-bold"
                    : isDay
                    ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {ax.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {sliceAxis === "horizontal" && (
              <>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("top_to_below");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "top_to_below"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="Tepadan pastga qarab kesish"
                >
                  Yuqoridan ↓
                </button>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("below_to_top");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "below_to_top"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="Pastdan yuqoriga qarab kesish"
                >
                  Pastdan ↑
                </button>
              </>
            )}

            {sliceAxis === "vertical_x" && (
              <>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("left_to_right");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "left_to_right"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="Chapdan o'ngga qarab kesish"
                >
                  Chapdan →
                </button>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("right_to_left");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "right_to_left"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="O'ngdan chapga qarab kesish"
                >
                  O'ngdan ←
                </button>
              </>
            )}

            {sliceAxis === "vertical_z" && (
              <>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("front_to_back");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "front_to_back"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="Oldindan orqaga qarab kesish"
                >
                  Oldindan →
                </button>
                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setSliceDirection("back_to_front");
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center truncate ${
                    sliceDirection === "back_to_front"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500 font-semibold"
                      : isDay
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                  title="Orqadan oldinga qarab kesish"
                >
                  Orqadan ←
                </button>
              </>
            )}

            <button
              onClick={() => {
                anatomyAudio.playClick();
                setSliceFlipped((prev) => !prev);
              }}
              className={`p-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
                sliceFlipped
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : isDay
                  ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
              title="Kesim tomonini 180° ag'darish (Flip)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${sliceFlipped ? "rotate-180" : ""}`} />
              <span className="text-[11px]">Flip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Depth Slider 0% to 100% */}
      <div className={`space-y-1.5 p-2.5 sm:p-3 rounded-2xl border ${
        isDay ? "bg-slate-50 border-slate-200" : "bg-zinc-900/60 border-zinc-800/80"
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
              3. Kesim Chuqurligi:
            </span>
            <span className="font-mono font-bold text-amber-500 dark:text-amber-400 text-sm">
              {slicePosition}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSlicePosition((prev) => Math.max(0, prev - 5))}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDay ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="-5%"
            >
              -5%
            </button>
            <button
              onClick={() => setSlicePosition((prev) => Math.max(0, prev - 1))}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDay ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="-1%"
            >
              -1%
            </button>
            <button
              onClick={() => setSlicePosition((prev) => Math.min(100, prev + 1))}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDay ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="+1%"
            >
              +1%
            </button>
            <button
              onClick={() => setSlicePosition((prev) => Math.min(100, prev + 5))}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDay ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="+5%"
            >
              +5%
            </button>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={slicePosition}
          onChange={(e) => setSlicePosition(parseInt(e.target.value, 10))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-zinc-700 dark:bg-zinc-800"
        />

        <div className="flex items-center justify-between gap-1 pt-0.5">
          {[
            { val: 0, label: "0%" },
            { val: 25, label: "25%" },
            { val: 40, label: "40%" },
            { val: 50, label: "50%" },
            { val: 75, label: "75%" },
            { val: 100, label: "100%" },
          ].map((chip) => (
            <button
              key={chip.val}
              onClick={() => {
                anatomyAudio.playClick();
                setSlicePosition(chip.val);
              }}
              className={`px-2 py-0.5 text-[10px] rounded-lg font-medium transition-all ${
                slicePosition === chip.val
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : isDay
                  ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Transparency & X-Ray in Slice Console */}
      <div className={`space-y-2 p-2.5 sm:p-3 rounded-2xl border ${
        isDay ? "bg-slate-50 border-slate-200" : "bg-zinc-900/60 border-zinc-800/80"
      }`}>
        <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
          isDay ? "text-slate-600" : "text-zinc-400"
        }`}>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-500" />
            Qatlamlar Rentgen (X-Ray) Shaffofligi:
          </span>
        </div>

        {/* Skin Transparency Buttons */}
        <div className="space-y-1">
          <div className={`flex items-center justify-between text-[11px] ${isDay ? "text-slate-500" : "text-zinc-400"}`}>
            <span className="font-semibold">Tashqi Teri (Skin):</span>
            <span className="font-mono text-[10px] text-amber-500 font-bold">
              {skinXRay ? "Shaffof (35%)" : layerProgress < 75 ? "Yashirilgan" : "100% Oqim"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setSkinXRay(false);
                setLayerProgress(100);
                setActiveTopicId("all");
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                !skinXRay && layerProgress >= 75
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              To'liq Teri
            </button>
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setSkinXRay(true);
                setActiveTopicId("all");
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                skinXRay
                  ? "bg-sky-500 text-zinc-950 border-sky-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Shaffof (Rentgen)
            </button>
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setSkinXRay(false);
                setLayerProgress(70);
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                !skinXRay && layerProgress < 75
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Terisiz
            </button>
          </div>
        </div>

        {/* Muscles Transparency Buttons */}
        <div className="space-y-1">
          <div className={`flex items-center justify-between text-[11px] ${isDay ? "text-slate-500" : "text-zinc-400"}`}>
            <span className="font-semibold">Mushaklar (Muscles):</span>
            <span className="font-mono text-[10px] text-sky-500 font-bold">
              {musclesXRay ? "Shaffof (35%)" : layerProgress < 45 ? "Yashirilgan" : "100% Oqim"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setMusclesXRay(false);
                if (layerProgress < 50) setLayerProgress(75);
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                !musclesXRay && layerProgress >= 45
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              To'liq Mushak
            </button>
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setMusclesXRay(true);
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                musclesXRay
                  ? "bg-sky-500 text-zinc-950 border-sky-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Shaffof (Rentgen)
            </button>
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setMusclesXRay(false);
                setLayerProgress(40);
              }}
              className={`py-1 px-1.5 text-[10px] rounded-lg font-semibold border transition-all text-center ${
                !musclesXRay && layerProgress < 45
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : isDay ? "bg-white text-slate-700 border-slate-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Mushaksiz
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: 360° Arbitrary Rotation Angle */}
      <div className={`space-y-1.5 p-2.5 sm:p-3 rounded-2xl border ${
        isDay ? "bg-slate-50 border-slate-200" : "bg-zinc-900/60 border-zinc-800/80"
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDay ? "text-slate-600" : "text-zinc-400"}`}>
              4. 360° Aylanish:
            </span>
            <span className="font-mono font-bold text-sky-500 dark:text-sky-400 text-sm">
              {sliceAngle}°
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { deg: 0, label: "0°" },
              { deg: 45, label: "45°" },
              { deg: 90, label: "90°" },
              { deg: 180, label: "180°" },
              { deg: 270, label: "270°" },
              { deg: 360, label: "360°" },
            ].map((chip) => (
              <button
                key={chip.deg}
                onClick={() => {
                  anatomyAudio.playClick();
                  setSliceAngle(chip.deg);
                }}
                className={`px-1.5 py-0.5 text-[10px] rounded-lg font-semibold transition-all ${
                  sliceAngle === chip.deg
                    ? "bg-sky-500 text-zinc-950 font-bold"
                    : isDay
                    ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          value={sliceAngle}
          onChange={(e) => setSliceAngle(parseInt(e.target.value, 10))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-400 bg-zinc-700 dark:bg-zinc-800"
        />
      </div>

      {/* Section 5: Advanced Controls Collapsible */}
      <div className="pt-0.5">
        <button
          onClick={() => {
            anatomyAudio.playClick();
            setShowAdvancedSlice((prev) => !prev);
          }}
          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
            showAdvancedSlice
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40"
              : isDay
              ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Kengaytirilgan: X-Y & Qiyalik</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedSlice ? "rotate-180" : ""}`} />
        </button>

        {showAdvancedSlice && (
          <div className={`mt-2 p-3 rounded-2xl border space-y-2.5 animate-in fade-in duration-200 ${
            isDay ? "bg-white border-slate-200" : "bg-zinc-900/90 border-zinc-800"
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDay ? "text-slate-500" : "text-zinc-400"}>Qiyalik (Tilt):</span>
                <span className={`font-mono ${isDay ? "text-slate-700" : "text-zinc-300"}`}>
                  {sliceTilt > 0 ? `+${sliceTilt}` : sliceTilt}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={sliceTilt}
                onChange={(e) => setSliceTilt(parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-400 bg-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDay ? "text-slate-500" : "text-zinc-400"}>X o'qi (Chap ⟵ ⟶ O'ng):</span>
                <span className={`font-mono ${isDay ? "text-slate-700" : "text-zinc-300"}`}>
                  {sliceOffsetX > 0 ? `+${sliceOffsetX}` : sliceOffsetX}%
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={sliceOffsetX}
                onChange={(e) => setSliceOffsetX(parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-400 bg-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDay ? "text-slate-500" : "text-zinc-400"}>Y o'qi (Past ⟵ ⟶ Yuqori):</span>
                <span className={`font-mono ${isDay ? "text-slate-700" : "text-zinc-300"}`}>
                  {sliceOffsetY > 0 ? `+${sliceOffsetY}` : sliceOffsetY}%
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={sliceOffsetY}
                onChange={(e) => setSliceOffsetY(parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 bg-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Reusable Slicing Console Header
  const renderSliceHeader = () => (
    <div className={`flex items-center justify-between gap-2 border-b p-3.5 shrink-0 ${
      isDay ? "border-slate-200 bg-slate-50/80" : "border-zinc-800/80 bg-zinc-900/40"
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Scan className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 tracking-wide uppercase truncate">
              3D Kesim
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0 font-mono">
              {slicePosition}%
            </span>
          </div>
          <div className={`text-[10px] truncate ${isDay ? "text-slate-500" : "text-zinc-400"}`}>
            {CAMERA_REGIONS.find((r) => r.id === sliceRegion)?.label || "To'liq"} •{" "}
            {sliceAxis === "horizontal"
              ? "Gorizontal"
              : sliceAxis === "vertical_z"
              ? "Koronal"
              : "Sagittal"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Dock position switcher */}
        <div className={`flex items-center gap-0.5 border rounded-lg p-0.5 ${
          isDay ? "bg-slate-100 border-slate-200" : "bg-zinc-900 border-zinc-800"
        }`} title="Joylashuv">
          <button
            onClick={() => {
              anatomyAudio.playClick();
              setSliceDockPosition("left");
            }}
            className={`p-1 rounded transition-all ${
              sliceDockPosition === "left"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : isDay
                ? "text-slate-500 hover:text-slate-900"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Chap tomonga joylashtirish"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              anatomyAudio.playClick();
              setSliceDockPosition("bottom");
            }}
            className={`p-1 rounded transition-all ${
              sliceDockPosition === "bottom"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : isDay
                ? "text-slate-500 hover:text-slate-900"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Pastga joylashtirish"
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              anatomyAudio.playClick();
              setSliceDockPosition("right");
            }}
            className={`p-1 rounded transition-all ${
              sliceDockPosition === "right"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : isDay
                ? "text-slate-500 hover:text-slate-900"
                : "text-zinc-400 hover:text-white"
            }`}
            title="O'ng tomonga joylashtirish (Tavsiya)"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            anatomyAudio.playClick();
            setSlicePosition(40);
            setSliceAngle(0);
            setSliceTilt(0);
            setSliceOffsetX(0);
            setSliceOffsetY(0);
            setSliceFlipped(false);
          }}
          className={`p-1.5 rounded-lg border transition-all ${
            isDay
              ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800"
          }`}
          title="Parametrlarni tiklash"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Minimize */}
        <button
          onClick={() => {
            anatomyAudio.playClick();
            setIsSliceMinimized(true);
          }}
          className={`p-1.5 rounded-lg transition-all ${
            isDay
              ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          title="Kichraytirish"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={() => {
            anatomyAudio.playClick();
            setSliceCutOn(false);
          }}
          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/15 rounded-lg transition-all"
          title="Kesimni yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Minimized Pill Helper
  const renderMinimizedSlicePill = (posClass) => (
    <div className={`absolute ${posClass} z-20 pointer-events-auto`}>
      <button
        onClick={() => {
          anatomyAudio.playClick();
          setIsSliceMinimized(false);
          if (sliceDockPosition === "right") {
            setRightPanelTab("slice");
          }
        }}
        className={`flex items-center gap-2.5 px-4 py-2 rounded-full ${
          isDay
            ? "bg-white/95 hover:bg-slate-100 border border-amber-500/60 text-amber-700"
            : "bg-zinc-950/90 hover:bg-zinc-900 border border-amber-500/60 text-amber-300"
        } shadow-2xl backdrop-blur-xl text-xs font-semibold tracking-wide transition-all group hover:scale-105 active:scale-95`}
      >
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <Scan className="w-4 h-4 text-amber-500 group-hover:rotate-90 transition-transform" />
        <span>
          3D Kesim: <strong className={isDay ? "text-slate-900" : "text-white"}>{slicePosition}%</strong> •{" "}
          {CAMERA_REGIONS.find((r) => r.id === sliceRegion)?.label || "To'liq"}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-500/20 px-2 py-0.5 rounded-full font-medium">
          <Maximize2 className="w-3 h-3" /> Ochish
        </span>
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen ${
        isDay ? "bg-slate-100 text-slate-900" : "bg-[#03060c] text-white"
      } flex flex-col overflow-hidden font-sans select-none relative transition-colors duration-300`}
    >
      {/* ---------------- TOP SCI-FI / CLINICAL GLASS NAVIGATION BAR ---------------- */}
      <header
        className={`h-16 px-4 border-b ${
          isDay
            ? "border-slate-200/90 bg-white/85 text-slate-800 shadow-md"
            : "border-zinc-800/80 bg-zinc-950/80 text-white shadow-2xl"
        } backdrop-blur-2xl z-30 flex items-center justify-between gap-3 shrink-0 transition-colors duration-300`}
      >
        {/* Brand Logo & Back to Subject */}
        <div className="flex items-center gap-3">
          <Link
            to="/biology"
            onClick={() => anatomyAudio.playClick()}
            className={`p-2 rounded-xl ${
              isDay
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
            } border transition-all shadow-sm group`}
            title="Biologiya laboratoriyasiga qaytish"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          <NexusLogo size="sm" showSubtitle={false} />

          {/* Breadcrumb tag */}
          <div
            className={`hidden lg:flex items-center gap-1.5 text-xs ${
              isDay ? "text-slate-500 border-slate-200" : "text-zinc-400 border-zinc-800"
            } border-l pl-3`}
          >
            <span>Biologiya</span>
            <span className={isDay ? "text-slate-400" : "text-zinc-600"}>/</span>
            <span className="text-emerald-500 font-semibold">Inson Anatomiyasi 3D</span>
          </div>
        </div>

        {/* Center: Interactive Mode Switcher */}
        <div
          className={`hidden md:flex items-center gap-1 p-1 ${
            isDay ? "bg-slate-100 border-slate-200" : "bg-zinc-900/90 border-zinc-800/90"
          } border rounded-2xl shadow-inner`}
        >
          {[
            { id: "explore", label: "3D Anatomiya", icon: User },
            { id: "slice", label: "Virtual Skalpel (Kesim)", icon: Scissors },
            { id: "pins", label: "Anatomik Xarita", icon: MapPin },
          ].map((mode) => {
            const ModeIcon = mode.icon;
            const isSelected = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  anatomyAudio.playModeSwitch();
                  setViewMode(mode.id);
                  setActiveTopicId("all");
                  if (mode.id === "explore") {
                    setSkinXRay(false);
                    if (layerProgress < 85) setLayerProgress(100);
                  } else if (mode.id === "slice") {
                    setSliceCutOn(true);
                    setIsSliceMinimized(false);
                    setRightPanelTab("slice");
                    setSkinXRay(false);
                    if (layerProgress < 85) setLayerProgress(100);
                  } else if (mode.id === "pins") {
                    setPinsEnabled(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/25 font-black scale-[1.02]"
                    : isDay
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <ModeIcon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Studio Actions & Tools */}
        <div className="flex items-center gap-2">
          {/* Day / Night Clinical Studio Mode Switcher */}
          <button
            onClick={handleToggleTheme}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
              isDay
                ? "bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-200/80 shadow-amber-500/10"
                : "bg-zinc-900/90 border-zinc-800 text-amber-300 hover:text-white hover:border-zinc-700"
            }`}
            title={isDay ? "Tungi kiber-studiya rejimiga o'tish (T)" : "Kunduzgi klinik-studiya rejimiga o'tish (T)"}
          >
            {isDay ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">
              {isDay ? "Kunduzgi" : "Tungi"}
            </span>
          </button>

          {/* Slicing Quick Toggle */}
          <button
            onClick={() => {
              anatomyAudio.playSliceWhoosh();
              const next = !sliceCutOn;
              setSliceCutOn(next);
              if (next) {
                setViewMode("slice");
                setActiveTopicId("all");
                setSkinXRay(false);
                if (layerProgress < 85) setLayerProgress(100);
                setIsSliceMinimized(false);
                setRightPanelTab("slice");
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 border ${
              sliceCutOn
                ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-amber-500/30 scale-[1.02]"
                : isDay
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-amber-500/50 hover:text-amber-600"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-amber-500/50 hover:text-amber-300"
            }`}
            title="3D Kesim tekisligini qo'shish (C)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {sliceCutOn ? "Kesim Faol" : "Kesim qo'shish"}
            </span>
          </button>

          {/* 360° Turntable Auto-rotate */}
          <button
            onClick={handleToggleTurntable}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
              autoRotate
                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/60 shadow-cyan-500/30 ring-2 ring-cyan-500/20"
                : isDay
                ? "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="360° Avto-Aylantirish (Space)"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline text-xs">360°</span>
          </button>

          {/* Biological Pulse & Breathing Controls */}
          <div className="relative">
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setIsBioModalOpen((prev) => !prev);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                isPhysiologicalActive
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-rose-500/20"
                  : isDay
                  ? "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  : "bg-zinc-900/90 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
              title="Biologik Jarayonlar (Yurak urishi & Nafas olish) (B)"
            >
              <HeartPulse className={`w-4 h-4 ${isPhysiologicalActive && isHeartBeating ? "animate-pulse text-rose-500" : "text-zinc-500"}`} />
              <span className="font-mono text-xs font-bold">{isPhysiologicalActive ? `${heartBpm} BPM` : "O'chiq"}</span>
            </button>

            {/* Physiological Engine Popup Panel */}
            {isBioModalOpen && (
              <div
                className={`absolute right-0 top-12 w-80 p-4 rounded-3xl ${
                  isDay
                    ? "bg-white/95 border-slate-200 text-slate-800 shadow-2xl"
                    : "bg-zinc-950/95 border-zinc-800 text-white shadow-2xl"
                } backdrop-blur-2xl border z-50 space-y-3.5 animate-in fade-in zoom-in-95 duration-150`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">Biologik Hayot Simulyatsiyasi</h4>
                      <p className={`text-[10px] ${isDay ? "text-slate-500" : "text-zinc-400"}`}>
                        Fiziologik yurak sikli va o'pka nafas olishi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBioModalOpen(false)}
                    className={`p-1 rounded-lg ${isDay ? "hover:bg-slate-100 text-slate-400" : "hover:bg-zinc-800 text-zinc-500"}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Master Animation Toggle */}
                <div
                  className={`p-2.5 rounded-2xl flex items-center justify-between ${
                    isDay ? "bg-slate-50 border border-slate-200/80" : "bg-zinc-900/60 border border-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold">Tirik tana simulyatsiyasi</div>
                      <div className={`text-[10px] ${isDay ? "text-slate-500" : "text-zinc-500"}`}>
                        Barcha fiziologik harakatlar
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      anatomyAudio.playClick();
                      setIsPhysiologicalActive((prev) => !prev);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isPhysiologicalActive
                        ? "bg-emerald-500 text-white shadow-sm"
                        : isDay
                        ? "bg-slate-200 text-slate-600"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isPhysiologicalActive ? "Faol" : "To'xtatilgan"}
                  </button>
                </div>

                {/* Heartbeat Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Yurak urishi (Lub-Dub)</span>
                    </div>
                    <button
                      onClick={() => {
                        anatomyAudio.playClick();
                        setIsHeartBeating((prev) => !prev);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                        isHeartBeating
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-zinc-500 bg-zinc-800/40"
                      }`}
                    >
                      {isHeartBeating ? "ON" : "OFF"}
                    </button>
                  </div>

                  {/* Heart Rate BPM Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isDay ? "text-slate-500" : "text-zinc-400"}>Puls tezligi:</span>
                      <span className="font-mono font-bold text-rose-500">{heartBpm} BPM</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="140"
                      step="1"
                      value={heartBpm}
                      onChange={(e) => {
                        setHeartBpm(Number(e.target.value));
                      }}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 rounded-lg bg-zinc-800"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                      <span>50 (Tinch)</span>
                      <span>72 (Normal)</span>
                      <span>140 (Sport)</span>
                    </div>
                  </div>

                  {/* Quick BPM Presets */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { label: "Tinch", bpm: 60, icon: "🧘" },
                      { label: "Normal", bpm: 72, icon: "❤️" },
                      { label: "Yuklama", bpm: 110, icon: "🏃" },
                    ].map((p) => (
                      <button
                        key={p.bpm}
                        onClick={() => {
                          anatomyAudio.playClick();
                          setHeartBpm(p.bpm);
                        }}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold border flex items-center justify-center gap-1 transition-all ${
                          heartBpm === p.bpm
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-400 font-bold"
                            : isDay
                            ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                            : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lungs & Respiration Controls */}
                <div className="space-y-2 pt-1 border-t border-zinc-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                      <span>O'pka & Nafas (Respiratsiya)</span>
                    </div>
                    <button
                      onClick={() => {
                        anatomyAudio.playClick();
                        setIsBreathing((prev) => !prev);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                        isBreathing
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-zinc-500 bg-zinc-800/40"
                      }`}
                    >
                      {isBreathing ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className={`text-[10px] ${isDay ? "text-slate-500" : "text-zinc-500"}`}>
                    O'pka to'qimasi, diafragma va ko'krak qafasi nafas ritmida kengayadi va qisqaradi.
                  </p>
                </div>

                {/* Stethoscope Audio Toggle */}
                <div
                  className={`p-2.5 rounded-2xl flex items-center justify-between ${
                    isDay ? "bg-slate-50 border border-slate-200/80" : "bg-zinc-900/60 border border-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                    <div>
                      <div className="text-xs font-semibold">Stetoskop ovozi</div>
                      <div className={`text-[10px] ${isDay ? "text-slate-500" : "text-zinc-500"}`}>
                        Akustik yurak urishi (Lub-Dub)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      anatomyAudio.playClick();
                      setIsAcousticHeart((prev) => !prev);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      isAcousticHeart
                        ? "bg-rose-500 text-white shadow-sm"
                        : isDay
                        ? "bg-slate-200 text-slate-600"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isAcousticHeart ? "Yoqilgan" : "O'chirilgan"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hotspot Pins Toggle */}
          <button
            onClick={() => {
              anatomyAudio.playClick();
              setPinsEnabled((prev) => !prev);
            }}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
              pinsEnabled
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/60 shadow-emerald-500/30"
                : isDay
                ? "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="3D Anatomik xaritani ko'rsatish/yashirish (P)"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Studio Lighting Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setIsLightingOpen((prev) => !prev);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all flex items-center gap-1 ${
                lightingPreset === "cyber"
                  ? "bg-indigo-500/25 text-indigo-400 border-indigo-500/60 shadow-indigo-500/30"
                  : lightingPreset === "xray"
                  ? "bg-sky-500/25 text-sky-400 border-sky-500/60 shadow-sky-500/30"
                  : isDay
                  ? "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
              title="Studiya Yoritish Rejimlari"
            >
              {lightingPreset === "cyber" ? (
                <Zap className="w-4 h-4 text-cyan-400" />
              ) : lightingPreset === "xray" ? (
                <Eye className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {isLightingOpen && (
              <div
                className={`absolute right-0 top-12 w-48 p-2 rounded-2xl ${
                  isDay ? "bg-white/95 border-slate-200 text-slate-800" : "bg-zinc-950/95 border-zinc-800 text-white"
                } backdrop-blur-2xl border shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150`}
              >
                <div className={`text-[10px] font-bold uppercase px-2 py-1 tracking-wider ${isDay ? "text-slate-500" : "text-zinc-500"}`}>
                  Yoritish Rejimi
                </div>
                {Object.values(LIGHTING_PRESETS).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      anatomyAudio.playClick();
                      setLightingPreset(preset.id);
                      setIsLightingOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      lightingPreset === preset.id
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-bold"
                        : isDay
                        ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>{preset.name}</span>
                    {lightingPreset === preset.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
              isMuted
                ? isDay
                  ? "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  : "bg-zinc-900/90 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
            }`}
            title={isMuted ? "Ovozni yoqish (M)" : "Ovozni o'chirish (M)"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Zoom In */}
          <button
            onClick={() => {
              anatomyAudio.playClick();
              canvasRef.current?.zoomIn?.(0.8);
            }}
            className={`p-2 rounded-xl ${
              isDay
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
            } border shadow-sm transition-all`}
            title="Yaqinlashtirish (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              anatomyAudio.playClick();
              canvasRef.current?.zoomOut?.(1.25);
            }}
            className={`p-2 rounded-xl ${
              isDay
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
            } border shadow-sm transition-all`}
            title="Uzoqlashtirish (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={() => {
              anatomyAudio.playCameraSnap();
              canvasRef.current?.recenter();
              setActiveRegion("all");
            }}
            className={`p-2 rounded-xl ${
              isDay
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
            } border shadow-sm transition-all`}
            title="Kamerani markazlash (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl ${
              isDay
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
            } border shadow-sm transition-all`}
            title="To'liq ekran (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Details Toggle */}
          <button
            onClick={() => {
              anatomyAudio.playClick();
              setIsDetailOpen((prev) => !prev);
            }}
            className={`p-2 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
              isDetailOpen
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50 shadow-emerald-500/20"
                : isDay
                ? "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title="Anatomik ma'lumotlar panelini ochish / yopish"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ---------------- MAIN 3D HOLODECK / CLINICAL VIEWPORT ---------------- */}
      <main
        className={`flex-1 w-full h-full relative overflow-hidden transition-colors duration-300 ${
          isDay
            ? "bg-[radial-gradient(ellipse_90%_80%_at_50%_35%,#f8fafc_0%,#e2e8f0_50%,#cbd5e1_100%)]"
            : "bg-[radial-gradient(ellipse_90%_80%_at_50%_35%,#131d33_0%,#090e1b_50%,#03050a_100%)]"
        }`}
      >
        {/* 3D Native Three.js WebGL High-Definition Canvas */}
        <div className="w-full h-full relative">
          <NativeAnatomyCanvas
            ref={canvasRef}
            themeMode={themeMode}
            layerOpacities={layerOpacities}
            layerVisibilities={layerVisibilities}
            activeTopic={activeTopic}
            sliceConfig={sliceConfig}
            lightingPreset={lightingPreset}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            onPick={handlePick}
            isPhysiologicalActive={isPhysiologicalActive}
            heartBpm={heartBpm}
            isHeartBeating={isHeartBeating}
            isBreathing={isBreathing}
            isAcousticHeart={isAcousticHeart}
          />

          <HtmlInCanvasOverlay
            camera={cameraInstance}
            containerRef={containerRef}
            enabled={pinsEnabled && !sliceCutOn}
            onSelectPin={handleSelectPin}
            activePinId={activePinId}
            themeMode={themeMode}
          />
        </div>

        {/* ---------------- FLOATING CAMERA FOCUS REGION BAR (TOP CENTER) ---------------- */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div
            className={`flex items-center gap-1 p-1 ${
              isDay
                ? "bg-white/85 border-slate-200/90 text-slate-800 shadow-xl"
                : "bg-zinc-950/80 border-zinc-800/80 text-white shadow-2xl"
            } backdrop-blur-2xl border rounded-2xl`}
          >
            {CAMERA_REGIONS.map((reg) => {
              const RegIcon = reg.icon;
              const isActive = activeRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => handleFocusRegion(reg.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shadow-md font-bold scale-[1.02]"
                      : isDay
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                  title={`${reg.label} sohasiga kamerani yaqinlashtirish`}
                >
                  <RegIcon className="w-3.5 h-3.5" />
                  <span>{reg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- LEFT VERTICAL ANATOMICAL LAYER LEVER (ZYGOTE PRO) ---------------- */}
        <div className="absolute left-4 top-4 z-20 flex flex-col items-start pointer-events-auto select-none">
          {!isLeverCollapsed ? (
            <div className="bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-3.5 shadow-2xl flex flex-col items-center gap-3 w-52 animate-in fade-in slide-in-from-left-2 duration-200">
              {/* Header: Layer Badge & Collapse Button */}
              <div className="w-full flex items-center justify-between px-1 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    {React.createElement(activeLayerInfo.icon, {
                      className: "w-3.5 h-3.5 text-emerald-400",
                    })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {activeLayerInfo.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {activeLayerInfo.sub}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-black text-emerald-400">
                    {layerProgress}%
                  </span>
                  <button
                    onClick={() => {
                      anatomyAudio.playClick();
                      setIsLeverCollapsed(true);
                    }}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white transition-all ml-1"
                    title="Tutqichni yig'ish"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lever Body: Rail & Layer Snap Tiers */}
              <div className="flex items-stretch justify-between w-full h-64 py-1 relative">
                {/* Layer Clickable Tiers on the left */}
                <div className="flex flex-col justify-between h-full py-0.5 text-right pr-2 flex-1">
                  {LEVER_TIERS.map((tier) => {
                    const TierIcon = tier.icon;
                    const isActive =
                      (tier.p === 100 && layerProgress >= 86) ||
                      (tier.p === 75 && layerProgress >= 62 && layerProgress < 86) ||
                      (tier.p === 50 && layerProgress >= 38 && layerProgress < 62) ||
                      (tier.p === 25 && layerProgress >= 12 && layerProgress < 38) ||
                      (tier.p === 0 && layerProgress < 12);

                    return (
                      <button
                        key={tier.p}
                        onClick={() => handleSetLayer(tier.p)}
                        className={`group flex items-center justify-end gap-1.5 text-xs font-medium transition-all py-1 px-2 rounded-xl ${
                          isActive
                            ? "text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                        }`}
                        title={`${tier.label} (${tier.p}%)`}
                      >
                        <span className="truncate">{tier.label}</span>
                        <TierIcon
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isActive
                              ? "text-emerald-400 scale-110"
                              : "text-zinc-500 group-hover:text-zinc-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Vertical Tactile Rail & Metallic Knob */}
                <div
                  ref={leverTrackRef}
                  onPointerDown={handleLeverPointerDown}
                  className="relative w-8 flex justify-center h-full cursor-pointer touch-none py-1 group/track"
                  title="Qatlamlar darajasini surish (Drag)"
                >
                  {/* Track Background */}
                  <div className="w-2.5 h-full bg-zinc-900 rounded-full relative overflow-hidden border border-zinc-700/60 shadow-inner">
                    {/* Active Fill Gradient */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75"
                      style={{ height: `${layerProgress}%` }}
                    />
                  </div>

                  {/* Tick Marks on Rail */}
                  {[0, 25, 50, 75, 100].map((notchP) => (
                    <div
                      key={notchP}
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-[1.5px] bg-zinc-600/80 pointer-events-none"
                      style={{ bottom: `${notchP}%` }}
                    />
                  ))}

                  {/* Ergonomic Knurled Metallic Knob */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-white via-zinc-100 to-zinc-300 border-2 border-emerald-400 shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-[transform,shadow] cursor-grab active:cursor-grabbing ${
                      isDraggingLever
                        ? "scale-125 shadow-emerald-500/70 ring-4 ring-emerald-400/30"
                        : "hover:scale-110"
                    }`}
                    style={{
                      bottom: `calc(${layerProgress}% - 14px)`,
                    }}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Presets (Suyak / To'liq) */}
              <div className="w-full flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-800/60 text-xs">
                <button
                  onClick={() => handleSetLayer(0)}
                  className={`flex-1 py-1.5 rounded-xl text-center font-semibold transition-all ${
                    layerProgress === 0
                      ? "bg-zinc-800 text-emerald-400 font-bold border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  💀 Skelet
                </button>
                <button
                  onClick={() => handleSetLayer(100)}
                  className={`flex-1 py-1.5 rounded-xl text-center font-semibold transition-all ${
                    layerProgress === 100
                      ? "bg-zinc-800 text-emerald-400 font-bold border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  🧍 To'liq Teri
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                anatomyAudio.playClick();
                setIsLeverCollapsed(false);
              }}
              className="p-3 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 hover:border-emerald-500/50 text-emerald-400 shadow-2xl flex items-center gap-2 transition-all group"
              title="Qatlamlar boshqaruvini ochish"
            >
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                {layerProgress}%
              </span>
            </button>
          )}
        </div>

        {/* ---------------- 3D SLICING & SCAN CONSOLE (LEFT DOCKED OR BOTTOM DOCKED) ---------------- */}
        {sliceCutOn && (
          isSliceMinimized ? (
            /* Minimized Floating Pill */
            sliceDockPosition === "right"
              ? renderMinimizedSlicePill("bottom-5 right-4")
              : sliceDockPosition === "left"
              ? renderMinimizedSlicePill("bottom-5 left-4")
              : renderMinimizedSlicePill("bottom-5 left-1/2 -translate-x-1/2")
          ) : (
            <>
              {/* Bottom Docked */}
              {sliceDockPosition === "bottom" && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-full max-w-2xl px-3 sm:px-4 select-none">
                  <BendCard zone={30} angle={8} perspective={1400} tilt={0.1} className="w-full">
                    <div className="bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
                      {renderSliceHeader()}
                      <div className="p-3.5 sm:p-4 max-h-[70vh] overflow-y-auto">
                        {renderSliceBody()}
                      </div>
                    </div>
                  </BendCard>
                </div>
              )}

              {/* Left Docked */}
              {sliceDockPosition === "left" && (
                <div className="absolute left-4 top-4 bottom-4 w-80 md:w-96 z-20 pointer-events-auto select-none">
                  <BendCard zone={40} angle={12} perspective={1200} tilt={0.25} className="h-full">
                    <aside className="w-full h-full bg-zinc-950/90 backdrop-blur-2xl border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
                      {renderSliceHeader()}
                      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                        {renderSliceBody()}
                      </div>
                    </aside>
                  </BendCard>
                </div>
              )}
            </>
          )
        )}

        {/* ---------------- RIGHT FLOATING PANEL (DOCK FOR SLICING OR HUD) ---------------- */}
        {showRightPanel && (
          <div className="absolute right-4 top-4 bottom-4 w-80 md:w-96 z-20 pointer-events-auto select-none">
            <BendCard zone={40} angle={12} perspective={1200} tilt={0.25} className="h-full">
              <aside className="w-full h-full bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
                {/* Switcher Tabs when Slicing is docked on right */}
                {isRightSliceDocked && (
                  <div className="flex items-center border-b border-zinc-800 bg-zinc-900/60 p-1 rounded-2xl mx-3 mt-3 gap-1 shrink-0">
                    <button
                      onClick={() => {
                        anatomyAudio.playClick();
                        setRightPanelTab("slice");
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        rightPanelTab === "slice"
                          ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>3D Kesim</span>
                    </button>
                    <button
                      onClick={() => {
                        anatomyAudio.playClick();
                        setRightPanelTab("details");
                        setIsDetailOpen(true);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        rightPanelTab === "details"
                          ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Anatomiya</span>
                    </button>
                  </div>
                )}

                {/* Slicing View */}
                {isRightSliceDocked && rightPanelTab === "slice" ? (
                  <>
                    {renderSliceHeader()}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                      {renderSliceBody()}
                    </div>
                  </>
                ) : (
                  /* Anatomical Details View */
                  <>
                    {/* HUD Header */}
                <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <ActiveIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        className={`text-sm font-bold truncate ${
                          isDay ? "text-slate-900" : "text-white"
                        }`}
                        title={activeTopic.title}
                      >
                        {activeTopic.title}
                      </h2>
                      <div className="text-[11px] text-zinc-400 italic truncate">
                        {activeTopic.latin}
                      </div>
                    </div>
                  </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeTopicId !== "all" && (
                  <button
                    onClick={() => {
                      anatomyAudio.playClick();
                      setActiveTopicId("all");
                      canvasRef.current?.recenter();
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                    title="To'liq inson tanasini ko'rsatish"
                  >
                    <span>To'liq tana</span>
                  </button>
                )}

                {/* Audio Voice Narration with Visualizer Equalizer */}
                <button
                  onClick={toggleNarration}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                    isSpeaking
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/40"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                  title={isSpeaking ? "Ovozni to'xtatish" : "Tushuntirishni eshitish (Audio)"}
                >
                  {isSpeaking ? (
                    <div className="flex items-center gap-0.5 h-3.5 px-0.5">
                      <span className="w-1 h-3 bg-zinc-950 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-3.5 bg-zinc-950 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-2 bg-zinc-950 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => {
                    anatomyAudio.playClick();
                    setIsDetailOpen(false);
                    setActiveTopicId("all");
                  }}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                  title="Panelni yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segmented Tabs */}
            <div className="flex items-center border-b border-zinc-800/80 px-4 pt-2 gap-2 text-xs">
              {[
                { id: "tuzilish", label: "Tuzilishi" },
                { id: "azolar", label: "23 ta A'zo" },
                { id: "asboblar", label: "Klaviatura" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    anatomyAudio.playClick();
                    setActiveDetailTab(tab.id);
                  }}
                  className={`pb-2.5 font-semibold transition-all relative ${
                    activeDetailTab === tab.id
                      ? "text-emerald-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeDetailTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab 1: Tuzilishi & Ma'lumot */}
            {activeDetailTab === "tuzilish" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Ilmiy Tavsif va Vazifasi
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/60">
                    {activeTopic.desc}
                  </p>
                </div>

                {/* Vitals / Stats */}
                {activeTopic.stats && activeTopic.stats.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Asosiy Ko'rsatkichlar
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeTopic.stats.map((st, i) => (
                        <div
                          key={i}
                          className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60"
                        >
                          <div className="text-[10px] text-zinc-400 truncate">{st.label}</div>
                          <div className="text-xs font-bold text-emerald-400 truncate mt-0.5">
                            {st.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Did You Know? (Qiziqarli Fakt) */}
                {activeTopic.funFact && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>QIZIQARLI TIBBIY FAKT</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      {activeTopic.funFact}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: A'zolar ro'yxati va tezkor qidiruv */}
            {activeDetailTab === "azolar" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="A'zoni qidirish (o'pka, jigar, yurak)..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Topics list */}
                <div className="space-y-1.5">
                  {filteredTopics.map((topic) => {
                    const TopicIcon = ICON_MAP[topic.icon] || Sparkles;
                    const isSelected = activeTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => {
                          anatomyAudio.playCameraSnap();
                          setActiveTopicId(topic.id);
                          canvasRef.current?.focusTopic(topic);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/40 text-white font-bold"
                            : "bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TopicIcon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-emerald-400" : "text-zinc-500"
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs truncate">{topic.title}</div>
                            <div className="text-[10px] text-zinc-500 italic truncate">
                              {topic.latin}
                            </div>
                          </div>
                        </div>
                        <Crosshair className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Klaviatura & Tezkor tugmalar */}
            {activeDetailTab === "asboblar" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Tezkor Klaviatura Tugmalari
                </div>
                <div className="space-y-2">
                  {[
                    { key: "Space", desc: "360° Avto-Aylantirish (Turntable)" },
                    { key: "C", desc: "Kesim tekisligini qo'shish / yopish" },
                    { key: "P", desc: "Anatomik xarita belgilarini ko'rsatish" },
                    { key: "M", desc: "Ovoz effektlarini yoqish / o'chirish" },
                    { key: "R", desc: "Kamerani boshlang'ich holatga keltirish" },
                    { key: "F", desc: "To'liq ekran rejimiga o'tish" },
                    { key: "1 - 5", desc: "1: Skelet, 2: A'zolar, 3: Qon-tomir, 4: Mushaklar, 5: Teri" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60"
                    >
                      <span className="text-zinc-300">{item.desc}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-emerald-400 rounded-md shadow-sm shrink-0 ml-2">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-800/60">
                  <div className="text-[10px] text-zinc-500 leading-normal">
                    {DISCLAIMER}
                  </div>
                </div>
              </div>
            )}

            {/* HUD Footer Branding */}
                    <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[10px] text-zinc-500 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SmartLab 3D WebGL Engine</span>
                      </div>
                      <span className="font-mono text-zinc-400">v3.0 Pro</span>
                    </div>
                  </>
                )}
              </aside>
            </BendCard>
          </div>
        )}

        {/* ---------------- WATERMARK & DEVELOPER CREDITS ---------------- */}
        <div className="absolute bottom-3 right-4 z-10 text-[10px] text-zinc-500 font-mono tracking-wider pointer-events-none select-none flex items-center gap-2">
          <span>SmartLab 3D Studio</span>
          <span>•</span>
          <span>Muallif: Abdulkhayev Hasanboy (@xasanboyman)</span>
        </div>
      </main>

    </div>
  );
};

export default SimulatorPage;
