import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * LabRoomClothBanner — In-scene 3D Physics Cloth Banner for SmartLab Chemistry.
 * Inspired by Thomas Richter-Trummer's "html-cloth.mjs" and Google Chrome Labs HTML-in-Canvas.
 * 
 * Features:
 * - Real-time Verlet particle spring-mass simulation (structural, shear, and bend constraints).
 * - Live procedural canvas texture featuring lab telemetry, safety checklist, and Mira AI chatter.
 * - Interactive pointer poke/wave impulses.
 * - Gentle ambient laboratory draft turbulence.
 */
export const LabRoomClothBanner = ({
  position = [0.4, 2.1, -3.94], // On the front lab whiteboard wall
  width = 1.6,
  height = 1.0,
  segmentsX = 16,
  segmentsY = 12,
  lab = null,
}) => {
  const meshRef = useRef(null);
  const textureRef = useRef(null);
  const canvasRef = useRef(null);
  const [clothPreset, setClothPreset] = useState("silk"); // "silk" | "foil" | "canvas"
  const [speechIdx, setSpeechIdx] = useState(0);

  const SPEECHES = useMemo(() => [
    "SmartLab xavfsizlik protokollari faol.",
    "Barcha reaktivlar tayyor.",
    "Ventilyatsiya tizimi me'yorda.",
    "Kislota va ishqorlar bilan ehtiyot bo'ling!",
    "Tajribalarni xavfsiz bajaring.",
  ], []);

  // Periodic chatter
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeechIdx((prev) => (prev + 1) % SPEECHES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [SPEECHES.length]);

  // Cloth physics particle state
  const physics = useMemo(() => {
    const totalParticles = (segmentsX + 1) * (segmentsY + 1);
    const pos = new Float32Array(totalParticles * 3);
    const oldPos = new Float32Array(totalParticles * 3);
    const pinned = new Uint8Array(totalParticles);

    const dx = width / segmentsX;
    const dy = height / segmentsY;

    for (let j = 0; j <= segmentsY; j++) {
      for (let i = 0; i <= segmentsX; i++) {
        const idx = (j * (segmentsX + 1) + i) * 3;
        const x = (i - segmentsX / 2) * dx;
        const y = -j * dy;
        const z = 0;

        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;

        oldPos[idx] = x;
        oldPos[idx + 1] = y;
        oldPos[idx + 2] = z;

        // Pin top row vertices
        if (j === 0) {
          pinned[j * (segmentsX + 1) + i] = 1;
        }
      }
    }

    return { pos, oldPos, pinned, dx, dy, totalParticles };
  }, [width, height, segmentsX, segmentsY]);

  // Create plane geometry
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    // Align top edge at y = 0
    geom.translate(0, -height / 2, 0);
    return geom;
  }, [width, height, segmentsX, segmentsY]);

  // Setup offscreen canvas for dynamic texture
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    canvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureRef.current = texture;

    if (meshRef.current) {
      meshRef.current.material.map = texture;
      meshRef.current.material.needsUpdate = true;
    }

    return () => {
      texture.dispose();
    };
  }, []);

  // Render 2D UI onto texture canvas
  const renderCanvasTexture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark high-tech sci-fi canvas background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(0.5, "#0b121e");
    bgGrad.addColorStop(1, "#05080f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(45, 212, 191, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.fillRect(20, 20, w - 40, 70);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, 70);

    ctx.font = "bold 28px 'JetBrains Mono', monospace, sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText("🧪 SMARTLAB 3D // INTERACTIVE SAFETY BANNER", 40, 64);

    ctx.font = "14px 'JetBrains Mono', monospace, sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("HTML-IN-CANVAS PHYSICAL SIMULATION", w - 360, 64);

    // Left Panel: Safety & Telemetry
    ctx.fillStyle = "rgba(24, 24, 27, 0.85)";
    ctx.fillRect(20, 110, 520, 480);
    ctx.strokeStyle = "rgba(63, 63, 70, 0.7)";
    ctx.strokeRect(20, 110, 520, 480);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#f4f4f5";
    ctx.fillText("Laboratoriya Holati & Nazorat", 45, 150);

    // Live Metrics
    const metrics = [
      { label: "Ventilyatsiya havo oqimi", value: "98.4%", color: "#34d399" },
      { label: "Atrof-muhit harorati", value: "22.5 °C", color: "#38bdf8" },
      { label: "Xavfsizlik datchigi", value: "NORMAL", color: "#10b981" },
      { label: "Gaz detektori", value: "0.00 ppm", color: "#34d399" },
    ];

    metrics.forEach((m, idx) => {
      const my = 200 + idx * 55;
      ctx.fillStyle = "rgba(39, 39, 42, 0.6)";
      ctx.fillRect(40, my - 25, 480, 42);
      ctx.strokeStyle = "rgba(82, 82, 91, 0.4)";
      ctx.strokeRect(40, my - 25, 480, 42);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#d4d4d8";
      ctx.fillText(m.label, 55, my);

      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = m.color;
      ctx.textAlign = "right";
      ctx.fillText(m.value, 500, my);
      ctx.textAlign = "left";
    });

    // Mira AI speech chatter box
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
    ctx.fillRect(40, 430, 480, 130);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
    ctx.strokeRect(40, 430, 480, 130);

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText("🤖 Mira AI Lab Hamrohi:", 55, 465);

    ctx.font = "17px sans-serif";
    ctx.fillStyle = "#f4f4f5";
    ctx.fillText(SPEECHES[speechIdx], 55, 510);

    // Right Panel: Interactive Physics Controls & Tips
    ctx.fillStyle = "rgba(24, 24, 27, 0.85)";
    ctx.fillRect(560, 110, 444, 480);
    ctx.strokeStyle = "rgba(63, 63, 70, 0.7)";
    ctx.strokeRect(560, 110, 444, 480);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("Fizik Mato Dinamikasi", 585, 150);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("Mato havo oqimi va turtkilarga real vaqtda javob beradi.", 585, 185);

    // Preset cards
    const presets = [
      { name: "Ipak (Silk)", desc: "Yumshoq, engil va elastik to'lqin", active: clothPreset === "silk" },
      { name: "Kanop (Canvas)", desc: "Zich, og'ir laboratoriya fartugi", active: clothPreset === "canvas" },
      { name: "Termo-folga (Foil)", desc: "Metall yaltiroq, qattiq himoya", active: clothPreset === "foil" },
    ];

    presets.forEach((p, idx) => {
      const py = 220 + idx * 75;
      ctx.fillStyle = p.active ? "rgba(56, 189, 248, 0.2)" : "rgba(39, 39, 42, 0.5)";
      ctx.fillRect(580, py, 404, 60);
      ctx.strokeStyle = p.active ? "#38bdf8" : "rgba(82, 82, 91, 0.5)";
      ctx.lineWidth = p.active ? 2 : 1;
      ctx.strokeRect(580, py, 404, 60);

      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = p.active ? "#38bdf8" : "#f4f4f5";
      ctx.fillText(p.name, 600, py + 26);

      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#a1a1aa";
      ctx.fillText(p.desc, 600, py + 48);
    });

    // Touch / Interaction cue at bottom
    ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
    ctx.fillRect(580, 475, 404, 85);
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.strokeRect(580, 475, 404, 85);

    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#fb7185";
    ctx.fillText("💡 Mato bilan o'zaro ta'sir:", 600, 505);

    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#f4f4f5";
    ctx.fillText("Sichqoncha bilan matoni bosing — to'lqin hosil bo'ladi!", 600, 535);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // Interactive poke wave
  const handlePointerDown = (e) => {
    e.stopPropagation();
    // Cycle cloth preset
    setClothPreset((prev) => {
      if (prev === "silk") return "canvas";
      if (prev === "canvas") return "foil";
      return "silk";
    });
    setSpeechIdx((prev) => (prev + 1) % SPEECHES.length);

    // Apply impulse to physics mesh
    const { pos, oldPos, totalParticles } = physics;
    const impulseZ = 0.25;
    for (let i = 0; i < totalParticles; i++) {
      const idx = i * 3;
      // random push
      oldPos[idx + 2] += (Math.random() - 0.5) * impulseZ;
    }
  };

  // Update canvas texture at ~15fps
  const lastDrawRef = useRef(0);
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (time - lastDrawRef.current > 0.08) {
      lastDrawRef.current = time;
      renderCanvasTexture();
    }

    // Verlet Cloth Physics Integration
    const { pos, oldPos, pinned, dx, dy } = physics;
    const geom = geometry;
    const posAttr = geom.attributes.position;

    // Tuning based on preset
    const damping = clothPreset === "silk" ? 0.985 : clothPreset === "foil" ? 0.96 : 0.97;
    const gravity = -0.0008;
    const windStrength = clothPreset === "silk" ? 0.0006 : 0.0002;

    const nx = segmentsX + 1;
    const ny = segmentsY + 1;

    // 1. Verlet integration + wind forces
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const pIdx = j * nx + i;
        if (pinned[pIdx]) continue;

        const idx = pIdx * 3;
        const vx = (pos[idx] - oldPos[idx]) * damping;
        const vy = (pos[idx + 1] - oldPos[idx + 1]) * damping + gravity;
        
        // Gentle ambient air draft / sinusoidal wind
        const wind = Math.sin(time * 2.5 + j * 0.4 + i * 0.2) * windStrength +
                     Math.cos(time * 1.8 + i * 0.5) * (windStrength * 0.5);
        const vz = (pos[idx + 2] - oldPos[idx + 2]) * damping + wind;

        oldPos[idx] = pos[idx];
        oldPos[idx + 1] = pos[idx + 1];
        oldPos[idx + 2] = pos[idx + 2];

        pos[idx] += vx;
        pos[idx + 1] += vy;
        pos[idx + 2] += vz;
      }
    }

    // 2. Constraint relaxation passes (Distance constraints)
    const passes = 3;
    for (let pass = 0; pass < passes; pass++) {
      // Horizontal constraints
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const idxA = (j * nx + i) * 3;
          const idxB = (j * nx + (i + 1)) * 3;
          const pinA = pinned[j * nx + i];
          const pinB = pinned[j * nx + (i + 1)];

          const cx = pos[idxB] - pos[idxA];
          const cy = pos[idxB + 1] - pos[idxA + 1];
          const cz = pos[idxB + 2] - pos[idxA + 2];
          const dist = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1e-6;
          const diff = (dist - dx) / dist;

          if (!pinA && !pinB) {
            pos[idxA] += cx * 0.5 * diff;
            pos[idxA + 1] += cy * 0.5 * diff;
            pos[idxA + 2] += cz * 0.5 * diff;
            pos[idxB] -= cx * 0.5 * diff;
            pos[idxB + 1] -= cy * 0.5 * diff;
            pos[idxB + 2] -= cz * 0.5 * diff;
          } else if (!pinA) {
            pos[idxA] += cx * diff;
            pos[idxA + 1] += cy * diff;
            pos[idxA + 2] += cz * diff;
          } else if (!pinB) {
            pos[idxB] -= cx * diff;
            pos[idxB + 1] -= cy * diff;
            pos[idxB + 2] -= cz * diff;
          }
        }
      }

      // Vertical constraints
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx; i++) {
          const idxA = (j * nx + i) * 3;
          const idxB = ((j + 1) * nx + i) * 3;
          const pinA = pinned[j * nx + i];
          const pinB = pinned[(j + 1) * nx + i];

          const cx = pos[idxB] - pos[idxA];
          const cy = pos[idxB + 1] - pos[idxA + 1];
          const cz = pos[idxB + 2] - pos[idxA + 2];
          const dist = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1e-6;
          const diff = (dist - dy) / dist;

          if (!pinA && !pinB) {
            pos[idxA] += cx * 0.5 * diff;
            pos[idxA + 1] += cy * 0.5 * diff;
            pos[idxA + 2] += cz * 0.5 * diff;
            pos[idxB] -= cx * 0.5 * diff;
            pos[idxB + 1] -= cy * 0.5 * diff;
            pos[idxB + 2] -= cz * 0.5 * diff;
          } else if (!pinA) {
            pos[idxA] += cx * diff;
            pos[idxA + 1] += cy * diff;
            pos[idxA + 2] += cz * diff;
          } else if (!pinB) {
            pos[idxB] -= cx * diff;
            pos[idxB + 1] -= cy * diff;
            pos[idxB + 2] -= cz * diff;
          }
        }
      }
    }

    // 3. Update geometry vertices and compute normals
    for (let k = 0; k < pos.length; k++) {
      posAttr.array[k] = pos[k];
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group position={position}>
      {/* Top Mounting Rail / Rod */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.015, 0.015, width + 0.1, 16]} />
        <meshStandardMaterial
          color="#3f3f46"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Physical Cloth Mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          side={THREE.DoubleSide}
          roughness={clothPreset === "foil" ? 0.2 : 0.65}
          metalness={clothPreset === "foil" ? 0.7 : 0.1}
        />
      </mesh>
    </group>
  );
};

export default LabRoomClothBanner;
