import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * LabRoomClothBanner — Interactive Laboratory Smart Board & Chemical Reference Kiosk.
 * 
 * Features:
 * - Solid freestanding industrial laboratory kiosk frame (base, support columns, bezel casing).
 * - Soft-touch interactive OLED screen with constrained Verlet spring-elastic physics.
 * - Multi-tab educational guide:
 *     1. Balanced Chemical Formulas & Equations (Acid-base, displacement, precipitates, gases).
 *     2. Laboratory Safety Rules & Protocols.
 *     3. Live Laboratory Telemetry & Real-time Reaction Monitor.
 * - Strictly clamped Z displacement so it never penetrates the backing plate or disappears.
 * - Touch-interactive: clicking cycles tabs and propagates an elastic haptic ripple.
 */
export const LabRoomClothBanner = ({
  position = [-3.0, 0, -1.0],
  rotation = [0, 1.15, 0],
  width = 1.3,
  height = 0.85,
  segmentsX = 16,
  segmentsY = 12,
  lab = null,
}) => {
  const meshRef = useRef(null);
  const textureRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Formulalar, 1: Xavfsizlik, 2: Telemetriya
  const [lastReactionTitle, setLastReactionTitle] = useState("Tayyor — reaktivlarni aralashtiring");

  // Track latest reaction if lab context is available
  useEffect(() => {
    if (!lab) return;
    const checkReaction = () => {
      try {
        const history = lab.history ?? [];
        if (history.length > 0) {
          const last = history[history.length - 1];
          if (last?.title) setLastReactionTitle(last.title);
        }
      } catch {
        // Safe fallback
      }
    };
    const interval = setInterval(checkReaction, 1500);
    return () => clearInterval(interval);
  }, [lab]);

  // Spring mesh physics (pinned along all outer borders so it cannot fly away)
  const physics = useMemo(() => {
    const nx = segmentsX + 1;
    const ny = segmentsY + 1;
    const totalParticles = nx * ny;
    const pos = new Float32Array(totalParticles * 3);
    const oldPos = new Float32Array(totalParticles * 3);
    const pinned = new Uint8Array(totalParticles);

    const dx = width / segmentsX;
    const dy = height / segmentsY;

    for (let j = 0; j <= segmentsY; j++) {
      for (let i = 0; i <= segmentsX; i++) {
        const idx = (j * nx + i) * 3;
        const x = (i - segmentsX / 2) * dx;
        const y = (segmentsY / 2 - j) * dy;
        const z = 0.02; // Positioned 2cm in front of solid frame

        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;

        oldPos[idx] = x;
        oldPos[idx + 1] = y;
        oldPos[idx + 2] = z;

        // Pin all border vertices to frame
        if (i === 0 || i === segmentsX || j === 0 || j === segmentsY) {
          pinned[j * nx + i] = 1;
        }
      }
    }

    return { pos, oldPos, pinned, dx, dy, totalParticles, nx, ny };
  }, [width, height, segmentsX, segmentsY]);

  // Screen plane geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
  }, [width, height, segmentsX, segmentsY]);

  // Setup offscreen canvas texture
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 680;
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

    // Background gradient (Deep Dark Slate Cyber-Glass)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(0.5, "#0d1322");
    bgGrad.addColorStop(1, "#070a12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle decorative grid
    ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(16, 16, w - 32, 60);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, w - 32, 60);

    ctx.font = "bold 22px 'JetBrains Mono', 'Segoe UI', monospace, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("🧪 SMARTLAB 3D // KIMYO YO'RIQNOMA VA FORMULALAR KIOSKI", 35, 53);

    ctx.font = "13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText("SMARTLAB ENGINE v2.4", w - 35, 53);
    ctx.textAlign = "left";

    // Navigation Tabs
    const tabs = [
      { id: 0, title: "🧪 Formulalar & Reaksiyalar" },
      { id: 1, title: "⚠️ Xavfsizlik Qoidalari" },
      { id: 2, title: "📊 Jonli Holat & Telemetriya" },
    ];

    const tabWidth = (w - 32 - 20) / 3;
    tabs.forEach((tab, i) => {
      const tx = 16 + i * (tabWidth + 10);
      const ty = 86;
      const th = 42;
      const isActive = activeTab === tab.id;

      ctx.fillStyle = isActive ? "rgba(16, 185, 129, 0.25)" : "rgba(30, 41, 59, 0.6)";
      ctx.fillRect(tx, ty, tabWidth, th);
      ctx.strokeStyle = isActive ? "#10b981" : "rgba(71, 85, 105, 0.5)";
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(tx, ty, tabWidth, th);

      ctx.font = isActive ? "bold 15px sans-serif" : "14px sans-serif";
      ctx.fillStyle = isActive ? "#34d399" : "#cbd5e1";
      ctx.textAlign = "center";
      ctx.fillText(tab.title, tx + tabWidth / 2, ty + 26);
      ctx.textAlign = "left";
    });

    // Main Content Area
    const cy = 138;
    const cw = w - 32;
    const ch = h - cy - 50;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(16, cy, cw, ch);
    ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, cy, cw, ch);

    if (activeTab === 0) {
      // TAB 0: CHEMICAL FORMULAS & EQUATIONS
      const formulas = [
        {
          title: "1. Neytrallanish (Kislota + Ishqor):",
          eq: "NaOH + HCl → NaCl + H₂O",
          note: "H⁺ + OH⁻ → H₂O  (Issiqlik ajraladi, ekzotermik)",
          tag: "Neytral",
          tagColor: "#34d399",
        },
        {
          title: "2. Cho'kma hosil bo'lishi (Mis gidroksid):",
          eq: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
          note: "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓  (Havorang iviqsimon cho'kma)",
          tag: "Cho'kma",
          tagColor: "#38bdf8",
        },
        {
          title: "3. Gaz ajralishi (Rux kislotada):",
          eq: "Zn + 2HCl → ZnCl₂ + H₂↑",
          note: "Zn + 2H⁺ → Zn²⁺ + H₂↑  (Vodorod pufakchalari ajraladi)",
          tag: "Gaz",
          tagColor: "#f59e0b",
        },
        {
          title: "4. O'rin olish (Temir misni siqib chiqaradi):",
          eq: "Fe + CuSO₄ → FeSO₄ + Cu↓",
          note: "Temir qipig'i ustida qizil mis qatlami cho'kadi",
          tag: "Redoks",
          tagColor: "#ec4899",
        },
        {
          title: "5. Bariy sulfat testi (Sulfat ioni aniqlash):",
          eq: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
          note: "Ba²⁺ + SO₄²⁻ → BaSO₄↓  (Kislotada erimaydigan zich oq cho'kma)",
          tag: "Sifat test",
          tagColor: "#a855f7",
        },
        {
          title: "6. Ammiak gazi ajralishi (Ammoniy tuzi):",
          eq: "NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O",
          note: "O'tkir hidli ammiak gazi; fenolftaleinni pushti qiladi",
          tag: "Ishqoriy gaz",
          tagColor: "#14b8a6",
        },
        {
          title: "7. Katalitik kislorod ajralishi:",
          eq: "2H₂O₂ →(MnO₂) 2H₂O + O₂↑",
          note: "Marganes(IV) oksid katalizatorligida shiddatli parchalanish",
          tag: "Kataliz",
          tagColor: "#eab308",
        },
        {
          title: "8. Karbonatlar kislotada ko'pirishi:",
          eq: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑",
          note: "Ko'pirib uglerod(IV) oksid gazi ajraladi",
          tag: "Gaz",
          tagColor: "#f97316",
        },
      ];

      // Draw two-column grid of formulas
      const colW = (cw - 30) / 2;
      formulas.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const ix = 26 + col * (colW + 10);
        const iy = cy + 12 + row * 98;

        ctx.fillStyle = "rgba(30, 41, 59, 0.5)";
        ctx.fillRect(ix, iy, colW, 90);
        ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
        ctx.strokeRect(ix, iy, colW, 90);

        // Tag badge
        ctx.fillStyle = item.tagColor;
        ctx.fillRect(ix + colW - 75, iy + 8, 65, 20);
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText(item.tag, ix + colW - 42, iy + 22);
        ctx.textAlign = "left";

        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = "#93c5fd";
        ctx.fillText(item.title, ix + 10, iy + 22);

        ctx.font = "bold 15px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(item.eq, ix + 10, iy + 48);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(item.note, ix + 10, iy + 74);
      });
    } else if (activeTab === 1) {
      // TAB 1: SAFETY RULES
      const rules = [
        {
          icon: "⚠️",
          title: "Kislota va Suv Qoidasi (ENG MUHIM):",
          text: "Har doim kislotani nozik oqim bilan suvga quying! Hech qachon kislotaga suv quymang — qaynash va portlash sodir bo'ladi!",
          color: "#ef4444",
        },
        {
          icon: "👃",
          title: "Gazlar va Bug'larni Hidlash:",
          text: "Idish og'ziga yuzni yaqinlashtirmang. Idishdan chiqayotgan bug'ni kaft bilan o'zingizga qarab yelping.",
          color: "#f59e0b",
        },
        {
          icon: "🔥",
          title: "Qizdirish va Probirka Holati:",
          text: "Qizdirilayotgan probirka og'zini hech qachon o'zingizga yoki yon-atrofdagilarga qaratmang. Bir nuqtadan emas, tebratib qizdiring.",
          color: "#f97316",
        },
        {
          icon: "🧤",
          title: "Shaxsiy Himoya Vositalari:",
          text: "Laboratoriya xalati, himoya ko'zoynagi va rezina qo'lqop kiyish majburiy. Reaktivlarni qo'l bilan ushlamang.",
          color: "#3b82f6",
        },
        {
          icon: "🧯",
          title: "Favqulodda Vaziyatlarda:",
          text: "Kislota to'kilsa — soda eritmasi bilan yuviladi. Ishqor to'kilsa — suyultirilgan sirka yoki borat kislota bilan neytrallanadi.",
          color: "#10b981",
        },
      ];

      rules.forEach((r, idx) => {
        const ry = cy + 18 + idx * 78;
        ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
        ctx.fillRect(30, ry, cw - 28, 70);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(30, ry, cw - 28, 70);

        ctx.font = "24px sans-serif";
        ctx.fillText(r.icon, 45, ry + 42);

        ctx.font = "bold 15px sans-serif";
        ctx.fillStyle = r.color;
        ctx.fillText(r.title, 85, ry + 26);

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#f1f5f9";
        ctx.fillText(r.text, 85, ry + 52);
      });
    } else {
      // TAB 2: LIVE TELEMETRY & LAB STATUS
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("Laboratoriya Xonasi Datchiklari va Nazorat Holati", 35, cy + 35);

      const stats = [
        { label: "Ventilyatsiya havo aylanishi", val: "98.6 %", status: "ME'YORDA", col: "#10b981" },
        { label: "Atrof-muhit xona harorati", val: "22.4 °C", status: "OPTIMAL", col: "#38bdf8" },
        { label: "Atmosfera bosimi", val: "101.3 kPa", status: "BARQAROR", col: "#a855f7" },
        { label: "Zaharli gazlar konsentratsiyasi", val: "0.00 ppm", status: "XAVFSIZ", col: "#10b981" },
      ];

      stats.forEach((st, i) => {
        const sy = cy + 55 + i * 65;
        ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
        ctx.fillRect(35, sy, cw - 38, 54);
        ctx.strokeStyle = "rgba(71, 85, 105, 0.5)";
        ctx.strokeRect(35, sy, cw - 38, 54);

        ctx.font = "15px sans-serif";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(st.label, 50, sy + 33);

        ctx.font = "bold 18px 'JetBrains Mono', monospace";
        ctx.fillStyle = st.col;
        ctx.textAlign = "right";
        ctx.fillText(st.val, cw - 160, sy + 34);

        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(cw - 140, sy + 15, 110, 24);
        ctx.fillStyle = st.col;
        ctx.textAlign = "center";
        ctx.fillText(st.status, cw - 85, sy + 32);
        ctx.textAlign = "left";
      });

      // Active Reaction Box
      const ry = cy + 330;
      ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
      ctx.fillRect(35, ry, cw - 38, 80);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(35, ry, cw - 38, 80);

      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText("🧪 SO'NGGI QAYD ETILGAN TAJRIBA REAKSIYASI:", 50, ry + 28);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(lastReactionTitle, 50, ry + 58);
    }

    // Bottom Navigation Hint Footer
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(16, h - 42, w - 32, 34);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, h - 42, w - 32, 34);

    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("💡 Ekranni bosing — bo'limlar almashadi (Formulalar / Xavfsizlik / Telemetriya) va sensor to'lqini paydo bo'ladi.", 30, h - 20);

    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";
    ctx.fillText("SmartLab Interactive Display", w - 30, h - 20);
    ctx.textAlign = "left";

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // Pointer interaction: cycle tabs & apply smooth spring flex
  const handlePointerDown = (e) => {
    e.stopPropagation();
    setActiveTab((prev) => (prev + 1) % 3);

    // Apply inward impulse to center particles
    const { pos, oldPos, pinned, totalParticles } = physics;
    const impulseZ = 0.035;
    for (let i = 0; i < totalParticles; i++) {
      if (pinned[i]) continue;
      const idx = i * 3;
      oldPos[idx + 2] += (Math.random() * 0.5 + 0.5) * impulseZ;
    }
  };

  // Canvas texture refresh at ~12fps
  const lastDrawRef = useRef(0);
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (time - lastDrawRef.current > 0.08) {
      lastDrawRef.current = time;
      renderCanvasTexture();
    }

    // Spring-mass cloth physics for the screen
    const { pos, oldPos, pinned, dx, dy, nx, ny } = physics;
    const geom = geometry;
    const posAttr = geom.attributes.position;
    const damping = 0.94;
    const targetZ = 0.018;

    // 1. Integration & elastic restoration to flat frame
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const pIdx = j * nx + i;
        if (pinned[pIdx]) continue;

        const idx = pIdx * 3;
        const vx = (pos[idx] - oldPos[idx]) * damping;
        const vy = (pos[idx + 1] - oldPos[idx + 1]) * damping;
        // Restoring force towards flat screen
        const restZ = (targetZ - pos[idx + 2]) * 0.08;
        const vz = (pos[idx + 2] - oldPos[idx + 2]) * damping + restZ;

        oldPos[idx] = pos[idx];
        oldPos[idx + 1] = pos[idx + 1];
        oldPos[idx + 2] = pos[idx + 2];

        pos[idx] += vx;
        pos[idx + 1] += vy;
        pos[idx + 2] += vz;

        // Strict clamp: never penetrate backing plate (z >= 0.005) or bulge out excessively (z <= 0.05)
        pos[idx + 2] = Math.max(0.006, Math.min(0.045, pos[idx + 2]));
      }
    }

    // 2. Constraint relaxation passes
    const passes = 2;
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
            pos[idxA + 2] += cz * 0.5 * diff;
            pos[idxB + 2] -= cz * 0.5 * diff;
          } else if (!pinA) {
            pos[idxA + 2] += cz * diff;
          } else if (!pinB) {
            pos[idxB + 2] -= cz * diff;
          }
        }
      }
    }

    // 3. Update geometry vertices and recompute normals
    for (let k = 0; k < pos.length; k++) {
      posAttr.array[k] = pos[k];
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Heavy Industrial Floor Stand Base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.04, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Dual Brushed-Aluminum Support Columns */}
      <mesh position={[-0.28, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.25, 16]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.28, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.25, 16]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* 3. Screen Mounting Bracket at Back */}
      <mesh position={[0, 1.35, -0.04]}>
        <boxGeometry args={[0.7, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* 4. Solid Display Backing Enclosure & Bezel */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.035]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* 5. Glowing LED Accent Trim */}
      <mesh position={[0, 1.35 - height / 2 - 0.025, 0.016]}>
        <boxGeometry args={[width, 0.008, 0.005]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* 6. Soft-Touch Interactive OLED Screen */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, 1.35, 0]}
        onPointerDown={handlePointerDown}
        castShadow
      >
        <meshStandardMaterial
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
};

export default LabRoomClothBanner;
