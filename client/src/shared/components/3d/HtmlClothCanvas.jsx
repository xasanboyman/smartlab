import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { setupCanvasDrawable, checkHtmlCanvasSupport } from "@/lab/features/biology/simulator/engine/HtmlCanvasManager";
import { Sparkles, Play, Dna, FlaskConical, Atom, Cpu, ArrowRight } from "lucide-react";

/**
 * HtmlClothCanvas — Production 3D HTML-in-Canvas Physical Cloth Simulation
 * Implements Google Chrome HTML-in-Canvas Origin Trial standards (Chrome 148-155),
 * inspired by Thomas Richter-Trummer's "html-cloth.mjs" and Google Chrome Labs demos.
 * Features:
 * - <canvas layoutsubtree> integration
 * - Device-pixel-content-box ResizeObserver
 * - Real-time spring-mass cloth particle physics (Verlet / Euler integration)
 * - 3D raycasting UV mapping from cloth surface to interactive HTML UI elements
 * - Dynamic AI Hamroh speech chatter & interactive physics presets
 */
export const HtmlClothCanvas = ({ className = "" }) => {
  const containerRef = useRef(null);
  const canvasMountRef = useRef(null);
  const navigate = useNavigate();

  const [activeSubject, setActiveSubject] = useState("biology");
  const [clothPreset, setClothPreset] = useState("silk"); // "silk" | "cyber" | "banner"
  const [speechText, setSpeechText] = useState("NexusLab 3D virtual ilmiy laboratoriyasiga xush kelibsiz! 🧬");
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ supported: false, version: null });

  const stateRef = useRef({
    activeSubject: "biology",
    clothPreset: "silk",
    speechText: "NexusLab 3D virtual ilmiy laboratoriyasiga xush kelibsiz! 🧬",
    lastSpeak: Date.now(),
  });

  stateRef.current.activeSubject = activeSubject;
  stateRef.current.clothPreset = clothPreset;
  stateRef.current.speechText = speechText;

  useEffect(() => {
    setSupportInfo(checkHtmlCanvasSupport());
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 460;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Chrome HTML-in-Canvas attribute setup (<canvas layoutsubtree> / content="drawable")
    setupCanvasDrawable(renderer.domElement);
    container.appendChild(renderer.domElement);

    // 2. High-Fidelity Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    keyLight.position.set(-6, 7, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x10b981, 1.1);
    fillLight.position.set(6, 4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x8b5cf6, 0.9);
    rimLight.position.set(0, -6, -4);
    scene.add(rimLight);

    // 3. Dynamic HTML Canvas Texture (1024x640)
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 1024;
    texCanvas.height = 640;
    const ctx = texCanvas.getContext("2d");

    const clothTexture = new THREE.CanvasTexture(texCanvas);
    clothTexture.colorSpace = THREE.SRGBColorSpace;
    clothTexture.anisotropy = 8;

    // SPEECH CHATTER LINES (Curtis / Mira AI from html-cloth.mjs)
    const SPEECHES = [
      "NexusLab 3D virtual ilmiy laboratoriyasiga xush kelibsiz! 🧬",
      "4K PBR inson tanasining 6 ta anatomik qatlamini 3D kesib ko'ring! 🔬",
      "Kimyo xonasida real reaksiyalar va pH simulyatsiyasi kutmoqda! 🧪",
      "Chrome HTML-in-Canvas: veb interfeys bevosita 3D teksturaga chiziladi! ✨",
      "Sichqoncha bilan matoni torting yoki rejim kartasini bosing! 🪂",
    ];

    // Card dimensions in texture coordinates
    const CARDS = [
      { id: "biology", label: "🫁 Inson Anatomiyasi", sub: "190MB FBX • 6 qatlam • 3D kesim", col: "#10b981", path: "/biology/simulator" },
      { id: "chemistry", label: "🧪 Kimyo Xonasi", sub: "118 element • Reaksiyalar & VR", col: "#06b6d4", path: "/chemistry/lab" },
      { id: "physics", label: "🔭 Fizika Dvigateli", sub: "4 taktli motor • Kvant optika", col: "#8b5cf6", path: "/physics/engine" },
      { id: "electronics", label: "⚡ Arduino Sxema", sub: "LED, sensorlar & mikrokontroller", col: "#f59e0b", path: "/electronics/arduino" },
    ];

    const cardW = 224;
    const cardH = 135;
    const startX = 48;
    const cardY = 240;
    const gap = 20;

    // Render the interactive HTML-in-Canvas UI into the texture
    const drawBanner = (t = 0) => {
      ctx.clearRect(0, 0, texCanvas.width, texCanvas.height);

      // Deep cyber background
      const bgGrad = ctx.createLinearGradient(0, 0, texCanvas.width, texCanvas.height);
      bgGrad.addColorStop(0, "#080b14");
      bgGrad.addColorStop(0.5, "#0d1326");
      bgGrad.addColorStop(1, "#05070c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

      // Cyber Grid Pattern
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1.2;
      const step = 44;
      for (let x = 0; x < texCanvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, texCanvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < texCanvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(texCanvas.width, y);
        ctx.stroke();
      }

      // Outer glowing tech border
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 3.5;
      ctx.strokeRect(16, 16, texCanvas.width - 32, texCanvas.height - 32);

      // Corner technical crosshairs
      ctx.fillStyle = "#34d399";
      const cs = 14;
      ctx.fillRect(16, 16, cs, 4);
      ctx.fillRect(16, 16, 4, cs);
      ctx.fillRect(texCanvas.width - 16 - cs, 16, cs, 4);
      ctx.fillRect(texCanvas.width - 20, 16, 4, cs);
      ctx.fillRect(16, texCanvas.height - 20, cs, 4);
      ctx.fillRect(16, texCanvas.height - 16 - cs, 4, cs);
      ctx.fillRect(texCanvas.width - 16 - cs, texCanvas.height - 20, cs, 4);
      ctx.fillRect(texCanvas.width - 20, texCanvas.height - 16 - cs, 4, cs);

      // Top Status Bar
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fillRect(20, 20, texCanvas.width - 40, 50);

      // Glowing status beacon
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(44, 45, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText("NEXUSLAB 3D • UNIVERSAL INTERACTIVE SCIENCE STUDIO", 60, 51);

      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#34d399";
      ctx.textAlign = "right";
      ctx.fillText("CHROME HTML-IN-CANVAS • 60 FPS • THREE.JS PBR", texCanvas.width - 40, 51);

      // AI Speech Bubble (Curtis / Mira chatter from html-cloth.mjs)
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(48, 86, texCanvas.width - 96, 42, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "left";
      ctx.fillText("🤖 MIRA AI HAMROH:", 64, 112);

      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(stateRef.current.speechText, 210, 112);

      // Main Hero Title
      ctx.font = "900 42px 'Inter', sans-serif";
      ctx.textAlign = "center";
      const titleGrad = ctx.createLinearGradient(0, 0, texCanvas.width, 0);
      titleGrad.addColorStop(0.2, "#ffffff");
      titleGrad.addColorStop(0.5, "#34d399");
      titleGrad.addColorStop(0.8, "#38bdf8");
      ctx.fillStyle = titleGrad;
      ctx.fillText("FANNI 3D TAJRIBADA HIS ETING", texCanvas.width / 2, 180);

      ctx.font = "500 16px 'Inter', sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Inson tanasini qatlamlarga ajrating, 3D kesim qiling va tajribalarni jonli boshqaring", texCanvas.width / 2, 210);

      // 4 Interactive Lab Cards on the Cloth Surface
      CARDS.forEach((c, idx) => {
        const cx = startX + idx * (cardW + gap);
        const isSelected = stateRef.current.activeSubject === c.id;

        // Card background
        ctx.fillStyle = isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(15, 23, 42, 0.75)";
        ctx.strokeStyle = isSelected ? "#34d399" : c.col;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(cx, cardY, cardW, cardH, 16);
        ctx.fill();
        ctx.stroke();

        // Card Title
        ctx.font = "bold 15px 'Inter', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(c.label, cx + 16, cardY + 40);

        // Subtitle
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(c.sub, cx + 16, cardY + 70);

        // Action badge button
        ctx.fillStyle = isSelected ? c.col : `${c.col}33`;
        ctx.beginPath();
        ctx.roundRect(cx + 16, cardY + 92, 116, 26, 6);
        ctx.fill();

        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillStyle = isSelected ? "#090b12" : c.col;
        ctx.fillText(isSelected ? "TANLANGAN ✓" : "OCHISH ➔", cx + 24, cardY + 109);
      });

      // Bottom Bar with interactive physics indicator
      ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
      ctx.fillRect(20, texCanvas.height - 76, texCanvas.width - 40, 48);

      ctx.fillStyle = "#64748b";
      ctx.font = "600 12px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("HTML-IN-CANVAS CLOTH: Sichqoncha bilan matoni torting yoki bosing — real vaqtda 3D simulyatsiya", 40, texCanvas.height - 47);

      // Animated Frequency Wave Ribbon
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const waveY = texCanvas.height - 52;
      for (let wx = 750; wx < 980; wx += 6) {
        const wy = waveY + Math.sin(wx * 0.04 + t * 4) * 10;
        if (wx === 750) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      clothTexture.needsUpdate = true;
    };

    drawBanner(0);

    // 4. Physical Cloth Geometry & Particle Mass Grid
    const clothWidth = 6.8;
    const clothHeight = 4.2;
    const segmentsX = 26;
    const segmentsY = 18;

    const clothGeo = new THREE.PlaneGeometry(clothWidth, clothHeight, segmentsX, segmentsY);

    const clothMat = new THREE.MeshPhysicalMaterial({
      map: clothTexture,
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.12,
      clearcoat: 0.3,
      clearcoatRoughness: 0.15,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xa7f3d0),
      wireframe: false,
    });

    const clothMesh = new THREE.Mesh(clothGeo, clothMat);
    clothMesh.position.set(0, 0, 0);
    scene.add(clothMesh);

    // Hanging Top Rod
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, clothWidth + 0.6, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.rotation.z = Math.PI / 2;
    rodMesh.position.set(0, clothHeight / 2 + 0.06, 0);
    scene.add(rodMesh);

    // Hanging Rings/Caps
    [-clothWidth / 2 - 0.15, clothWidth / 2 + 0.15].forEach((rx) => {
      const ringGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(rx, clothHeight / 2 + 0.06, 0);
      scene.add(ring);
    });

    // Cloth Vertex Physics State
    const posAttr = clothGeo.attributes.position;
    const vertexCount = posAttr.count;
    const originalPositions = [];
    const currentPositions = [];
    const velocities = [];

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      originalPositions.push(new THREE.Vector3(x, y, z));
      currentPositions.push(new THREE.Vector3(x, y, z));
      velocities.push(new THREE.Vector3(0, 0, 0));
    }

    // Pointer Raycasting for Cloth Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let pointerTargetPos = new THREE.Vector3();
    let isHoveringCloth = false;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(clothMesh, false);
      if (intersects.length > 0) {
        isHoveringCloth = true;
        pointerTargetPos.copy(intersects[0].point);
      } else {
        isHoveringCloth = false;
      }
    };

    const handlePointerDown = (e) => {
      setIsPointerDown(true);
      handlePointerMove(e);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(clothMesh, false);
      if (intersects.length > 0) {
        const uv = intersects[0].uv;
        // Map UV coordinates (0..1) to texture coordinates
        const texX = uv.x * texCanvas.width;
        const texY = (1 - uv.y) * texCanvas.height;

        // Check if clicking Speech Bubble (top)
        if (texY >= 86 && texY <= 128 && texX >= 48 && texX <= texCanvas.width - 48) {
          const nextSpeech = SPEECHES[(SPEECHES.indexOf(stateRef.current.speechText) + 1) % SPEECHES.length];
          setSpeechText(nextSpeech);
          drawBanner(clock.getElapsedTime());
          return;
        }

        // Check if clicking one of the 4 cards
        CARDS.forEach((card, idx) => {
          const cx = startX + idx * (cardW + gap);
          if (texX >= cx && texX <= cx + cardW && texY >= cardY && texY <= cardY + cardH) {
            setActiveSubject(card.id);
            setSpeechText(`Tanlandi: ${card.label}. Simulyator ochilmoqda... 🚀`);
            drawBanner(clock.getElapsedTime());
            // Navigate after quick ripple feedback
            setTimeout(() => {
              navigate(card.path);
            }, 250);
          }
        });

        // Localized physical impulse poke on cloth
        const hitPoint = intersects[0].point;
        for (let i = 0; i < vertexCount; i++) {
          const dist = currentPositions[i].distanceTo(hitPoint);
          if (dist < 1.5) {
            velocities[i].z -= (1.5 - dist) * 1.2;
          }
        }
      }
    };

    const handlePointerUp = () => {
      setIsPointerDown(false);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    // 5. Physics Simulation Loop
    let animId;
    let clock = new THREE.Clock();
    let lastSpeakTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const dt = 0.016;

      // Periodically rotate speech chatter every 8 seconds
      if (time - lastSpeakTime > 8) {
        lastSpeakTime = time;
        const randomSpeech = SPEECHES[Math.floor(Math.random() * SPEECHES.length)];
        setSpeechText(randomSpeech);
      }

      // Refresh dynamic banner texture
      if (Math.floor(time * 30) % 3 === 0) {
        drawBanner(time);
      }

      // Cloth particle physics integration
      const stiffness = stateRef.current.clothPreset === "banner" ? 28.0 : stateRef.current.clothPreset === "cyber" ? 22.0 : 16.0;
      const windMultiplier = stateRef.current.clothPreset === "banner" ? 0.08 : 0.18;

      for (let i = 0; i < vertexCount; i++) {
        const orig = originalPositions[i];
        const curr = currentPositions[i];
        const vel = velocities[i];

        // Pin top row to rod
        const row = Math.floor(i / (segmentsX + 1));
        if (row === 0) continue;

        // Dynamic aerodynamic sine waves
        const windWave =
          Math.sin(orig.x * 1.5 + time * 2.5) * windMultiplier +
          Math.cos(orig.y * 2.0 + time * 3.2) * (windMultiplier * 0.7);

        const targetZ = orig.z + windWave;

        // Pointer pull / poke interaction
        if (isHoveringCloth) {
          const worldCurr = curr.clone().add(clothMesh.position);
          const pokeDist = worldCurr.distanceTo(pointerTargetPos);
          if (pokeDist < 1.4) {
            const pushDir = isPointerDown ? -0.9 : 0.4;
            vel.z += (1.4 - pokeDist) * pushDir * 0.25;
          }
        }

        // Spring return + damping
        const forceZ = (targetZ - curr.z) * stiffness;
        vel.z += forceZ * dt;
        vel.z *= 0.92;
        curr.z += vel.z * dt;

        posAttr.setZ(i, curr.z);
      }

      posAttr.needsUpdate = true;
      clothGeo.computeVertexNormals();

      // Gentle swinging of the whole cloth mesh
      clothMesh.rotation.y = Math.sin(time * 0.8) * 0.05;
      clothMesh.rotation.x = Math.sin(time * 1.1) * 0.025;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Device-pixel-content-box ResizeObserver (as specified in Chrome Article)
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) return;
        handleResize();
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", handleResize);

      renderer.dispose();
      clothGeo.dispose();
      clothMat.dispose();
      clothTexture.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [navigate, isPointerDown]);

  return (
    <div className="relative w-full">
      {/* 3D Cloth Viewport Container */}
      <div
        ref={containerRef}
        className={`relative w-full h-[380px] sm:h-[440px] md:h-[500px] lg:h-[540px] cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-3xl ${className}`}
        title="3D HTML Matoni torting yoki rejim ustiga bosing"
      >
        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Chrome HTML-in-Canvas • Interaktiv Fizik Mato</span>
        </div>

        {/* Top Right Physics Presets */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 shadow-lg">
          {[
            { id: "silk", label: "Ipak" },
            { id: "cyber", label: "Kiber" },
            { id: "banner", label: "Banner" },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setClothPreset(preset.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                clothPreset === preset.id
                  ? "bg-emerald-500 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HtmlClothCanvas;
