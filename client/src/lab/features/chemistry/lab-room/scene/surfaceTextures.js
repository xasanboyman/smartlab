import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const MARKER_FONT = "'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', 'Segoe Print', cursive";
const UI_FONT = "Inter, 'Segoe UI', Arial, sans-serif";

const makeCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") };
};

// glTF UVs expect flipY = false.
const toTexture = (canvas, anisotropy = 8, wrapping = null) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = anisotropy;
  if (wrapping) {
    texture.wrapS = wrapping;
    texture.wrapT = wrapping;
  }
  return texture;
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

// ---------- Whiteboard ----------

export const createWhiteboardTexture = () => {
  const { canvas, ctx } = makeCanvas(2048, 1024);
  ctx.fillStyle = "#fbfbf9";
  ctx.fillRect(0, 0, 2048, 1024);

  // Faint leftovers of wiped marker.
  for (const [x, y, r] of [[520, 760, 260], [1500, 300, 320], [1180, 860, 200]]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(120,130,150,0.06)");
    g.addColorStop(1, "rgba(120,130,150,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1c3c96";
  ctx.font = `600 78px ${MARKER_FONT}`;
  ctx.fillText("Mavzu: Kimyoviy reaksiyalar", 110, 150);
  ctx.strokeStyle = "#1c3c96";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(110, 178);
  ctx.quadraticCurveTo(620, 168, 1080, 184);
  ctx.stroke();

  ctx.font = `500 66px ${MARKER_FONT}`;
  ctx.fillText("1)  NaOH + HCl  →  NaCl + H₂O", 140, 330);
  ctx.fillText("2)  2H₂ + O₂  →  2H₂O", 140, 450);
  ctx.fillText("3)  CaCO₃ + 2HCl  →  CaCl₂ + H₂O + CO₂↑", 140, 570);

  ctx.fillStyle = "#b3261e";
  ctx.font = `600 62px ${MARKER_FONT}`;
  ctx.fillText("Diqqat! Kislotani suvga quying,", 140, 760);
  ctx.fillText("suvni kislotaga emas!", 140, 850);

  // A quick sketch of a conical flask.
  ctx.strokeStyle = "#1f7a4a";
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(1640, 560);
  ctx.lineTo(1640, 680);
  ctx.lineTo(1520, 900);
  ctx.lineTo(1860, 900);
  ctx.lineTo(1740, 680);
  ctx.lineTo(1740, 560);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1560, 830);
  ctx.quadraticCurveTo(1690, 800, 1820, 830);
  ctx.stroke();

  return toTexture(canvas);
};

// ---------- Periodic table poster ----------

const SYMBOLS =
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(
    " ",
  );

const CATEGORIES = [
  { id: "alkali", label: "Ishqoriy metallar", color: "#f6a38d" },
  { id: "alkaline", label: "Ishqoriy-yer metallari", color: "#f7d08a" },
  { id: "transition", label: "O'tish metallari", color: "#f3b8c8" },
  { id: "post", label: "Boshqa metallar", color: "#b8d4e8" },
  { id: "metalloid", label: "Yarim metallar", color: "#c7e3a6" },
  { id: "nonmetal", label: "Nometallar", color: "#a5e0c0" },
  { id: "halogen", label: "Galogenlar", color: "#fff09a" },
  { id: "noble", label: "Inert gazlar", color: "#c9b8f0" },
  { id: "lanthanide", label: "Lantanoidlar", color: "#9fd9e0" },
  { id: "actinide", label: "Aktinoidlar", color: "#e4b4dc" },
];
const CATEGORY_COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color]));

const categoryOf = (z) => {
  if ([1, 6, 7, 8, 15, 16, 34].includes(z)) return "nonmetal";
  if ([9, 17, 35, 53, 85, 117].includes(z)) return "halogen";
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return "noble";
  if ([3, 11, 19, 37, 55, 87].includes(z)) return "alkali";
  if ([4, 12, 20, 38, 56, 88].includes(z)) return "alkaline";
  if ([5, 14, 32, 33, 51, 52].includes(z)) return "metalloid";
  if (z >= 57 && z <= 71) return "lanthanide";
  if (z >= 89 && z <= 103) return "actinide";
  const transition =
    (z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112);
  return transition ? "transition" : "post";
};

// [row, column]; rows 9-10 are the separated lanthanide/actinide rows.
const cellOf = (z) => {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 10) return [2, z <= 4 ? z - 2 : z + 8];
  if (z <= 18) return [3, z <= 12 ? z - 10 : z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z >= 57 && z <= 71) return [9, z - 54];
  if (z >= 89 && z <= 103) return [10, z - 86];
  if (z <= 86) return [6, z <= 56 ? z - 54 : z - 68];
  return [7, z <= 88 ? z - 86 : z - 100];
};

export const createPeriodicTableTexture = () => {
  const W = 2048;
  const H = 1316;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#fdfcf8";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1d2433";
  ctx.textAlign = "center";
  ctx.font = `800 64px ${UI_FONT}`;
  ctx.fillText("KIMYOVIY ELEMENTLAR DAVRIY JADVALI", W / 2, 96);

  const pitch = 104;
  const size = 98;
  const x0 = (W - pitch * 18) / 2;
  const y0 = 140;
  const rowY = (row) => y0 + (row <= 7 ? row - 1 : row - 1.6) * pitch;

  const drawCell = (x, y, fill, number, symbol) => {
    roundRect(ctx, x, y, size, size, 10);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(29,36,51,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#1d2433";
    ctx.textAlign = "left";
    ctx.font = `600 20px ${UI_FONT}`;
    ctx.fillText(number, x + 9, y + 25);
    ctx.textAlign = "center";
    ctx.font = `800 46px ${UI_FONT}`;
    ctx.fillText(symbol, x + size / 2, y + 74);
  };

  SYMBOLS.forEach((symbol, i) => {
    const z = i + 1;
    const [row, col] = cellOf(z);
    drawCell(x0 + (col - 1) * pitch, rowY(row), CATEGORY_COLOR[categoryOf(z)], String(z), symbol);
  });
  drawCell(x0 + 2 * pitch, rowY(6), CATEGORY_COLOR.lanthanide, "", "*");
  drawCell(x0 + 2 * pitch, rowY(7), CATEGORY_COLOR.actinide, "", "**");

  const legendY = rowY(10) + pitch + 20;
  const columns = 5;
  const legendW = (W - x0 * 2) / columns;
  CATEGORIES.forEach((c, i) => {
    const x = x0 + (i % columns) * legendW;
    const y = legendY + Math.floor(i / columns) * 46;
    roundRect(ctx, x, y, 34, 34, 6);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(29,36,51,0.35)";
    ctx.stroke();
    ctx.fillStyle = "#1d2433";
    ctx.textAlign = "left";
    ctx.font = `600 26px ${UI_FONT}`;
    ctx.fillText(c.label, x + 46, y + 26);
  });

  return toTexture(canvas);
};

// ---------- Lab computer screen ----------

export const drawMonitor = (ctx, width, height, time) => {
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "#0f1b3d");
  g.addColorStop(1, "#33296e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 76px ${UI_FONT}`;
  ctx.fillText("SimuLink", width / 2, height / 2 - 40);
  ctx.fillStyle = "#c9c3ff";
  ctx.font = `600 38px ${UI_FONT}`;
  ctx.fillText("Kimyo laboratoriyasi", width / 2, height / 2 + 20);
  ctx.fillStyle = "#9aa3c7";
  ctx.font = `500 26px ${UI_FONT}`;
  ctx.fillText("Tajriba natijalari shu ekranda ko'rsatiladi", width / 2, height / 2 + 70);

  ctx.fillStyle = "rgba(5,8,20,0.85)";
  ctx.fillRect(0, height - 44, width, 44);
  ctx.fillStyle = "#e6e8f0";
  ctx.textAlign = "right";
  ctx.font = `600 24px ${UI_FONT}`;
  ctx.fillText(time, width - 24, height - 14);
};

// ---------- Wall clock ----------

export const drawClock = (ctx, size, date) => {
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#fbfbfb";
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1b1b1f";
  for (let i = 0; i < 60; i += 1) {
    const major = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r1 = c * (major ? 0.8 : 0.86);
    ctx.lineWidth = major ? size * 0.018 : size * 0.006;
    ctx.beginPath();
    ctx.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
    ctx.lineTo(c + Math.sin(a) * c * 0.92, c - Math.cos(a) * c * 0.92);
    ctx.stroke();
  }

  ctx.fillStyle = "#1b1b1f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(size * 0.09)}px ${UI_FONT}`;
  for (let h = 1; h <= 12; h += 1) {
    const a = (h / 12) * Math.PI * 2;
    ctx.fillText(String(h), c + Math.sin(a) * c * 0.66, c - Math.cos(a) * c * 0.66);
  }

  const hours = (date.getHours() % 12) + date.getMinutes() / 60;
  const minutes = date.getMinutes() + date.getSeconds() / 60;
  const hand = (angle, length, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c - Math.sin(angle) * c * 0.12, c + Math.cos(angle) * c * 0.12);
    ctx.lineTo(c + Math.sin(angle) * length, c - Math.cos(angle) * length);
    ctx.stroke();
  };
  hand((hours / 12) * Math.PI * 2, c * 0.45, size * 0.035, "#1b1b1f");
  hand((minutes / 60) * Math.PI * 2, c * 0.68, size * 0.022, "#1b1b1f");
  ctx.fillStyle = "#c62828";
  ctx.beginPath();
  ctx.arc(c, c, size * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.textBaseline = "alphabetic";
};

// ---------- Exit sign ----------

export const createExitSignTexture = () => {
  const { canvas, ctx } = makeCanvas(1024, 512);
  ctx.fillStyle = "#0b8a3e";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Door
  ctx.lineWidth = 16;
  ctx.strokeRect(96, 96, 190, 320);

  // Running figure
  ctx.beginPath();
  ctx.arc(420, 150, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(400, 210);
  ctx.lineTo(370, 320);
  ctx.moveTo(390, 240);
  ctx.lineTo(320, 280);
  ctx.moveTo(400, 230);
  ctx.lineTo(470, 280);
  ctx.moveTo(370, 320);
  ctx.lineTo(310, 400);
  ctx.moveTo(370, 320);
  ctx.lineTo(450, 380);
  ctx.lineTo(470, 430);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `800 118px ${UI_FONT}`;
  ctx.fillText("CHIQISH", 530, 256);
  return toTexture(canvas);
};

export const createDynamicTexture = (width, height, draw) => {
  const { canvas, ctx } = makeCanvas(width, height);
  const texture = toTexture(canvas, 4);
  const redraw = (...args) => {
    draw(ctx, ...args);
    texture.needsUpdate = true;
  };
  return { texture, redraw };
};

// ---------- Chemical-resistant phenolic / epoxy resin benchtop (SEFA-3) ----------

export const createPhenolicResinTexture = (width = 1024, height = 1024) => {
  const { canvas, ctx } = makeCanvas(width, height);
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Professional chemical-resistant black epoxy / phenolic resin (Trespa TopLab / Durcon)
  // Deep charcoal matte base (#16181b) with ultra-fine mineral particulate
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    const fleck = Math.random() < 0.008 ? (Math.random() < 0.5 ? 14 : -8) : 0;
    const baseR = 22 + noise + fleck;
    const baseG = 24 + noise + fleck;
    const baseB = 27 + noise * 0.9 + fleck;

    data[i] = Math.max(14, Math.min(42, Math.round(baseR)));
    data[i + 1] = Math.max(16, Math.min(44, Math.round(baseG)));
    data[i + 2] = Math.max(18, Math.min(48, Math.round(baseB)));
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle directional satin sheen polish
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, "rgba(255, 255, 255, 0.035)");
  g.addColorStop(0.5, "rgba(0, 0, 0, 0.015)");
  g.addColorStop(1, "rgba(255, 255, 255, 0.035)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // Micro-surface specular sheen
  const g2 = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.7);
  g2.addColorStop(0, "rgba(255, 255, 255, 0.02)");
  g2.addColorStop(1, "rgba(0, 0, 0, 0.01)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, width, height);

  const texture = toTexture(canvas, 16, RepeatWrapping);
  texture.repeat.set(4, 4);
  texture.generateMipmaps = true;
  return texture;
};

// ---------- Commercial laboratory non-skid homogeneous vinyl floor ----------

export const createSafetyFloorTexture = (width = 1024, height = 1024) => {
  const { canvas, ctx } = makeCanvas(width, height);

  // Light slate-gray sealed vinyl floor base
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, 0, width, height);

  // 4x4 modular tile layout with subtle gradient tone
  const tileSize = width / 4;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const shade = ((r + c * 3) % 4 - 1.5) * 1.8;
      ctx.fillStyle = `rgba(${shade > 0 ? "255,255,255" : "0,0,0"}, ${Math.abs(shade) * 0.018})`;
      ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
    }
  }

  // Draw fine anti-slip mineral flecks: quartz white, dark slate, and subtle amber
  const fleckCount = 16000;
  for (let i = 0; i < fleckCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random();
    if (r < 0.5) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    } else if (r < 0.88) {
      ctx.fillStyle = "rgba(55, 65, 81, 0.55)";
    } else {
      ctx.fillStyle = "rgba(217, 119, 6, 0.38)";
    }
    const s = 1 + Math.random() * 1.8;
    ctx.fillRect(x, y, s, s);
  }

  // Heat-welded vinyl seam lines
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#4b5563";
  for (let i = 0; i <= 4; i++) {
    const pos = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
    ctx.stroke();
  }

  // Crisp heat-weld highlight line
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 4; i++) {
    const pos = i * tileSize + 1.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
    ctx.stroke();
  }

  const texture = toTexture(canvas, 16, RepeatWrapping);
  texture.repeat.set(6, 6);
  texture.generateMipmaps = true;
  return texture;
};

// ---------- Crisp safety signs and warning decals atlas ----------

export const createSafetySignAtlasTexture = (baseImage = null, width = 1024, height = 1024) => {
  const { canvas, ctx } = makeCanvas(width, height);

  if (baseImage) {
    try {
      ctx.drawImage(baseImage, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, width, height);
  }

  const drawSign = (x, y, w, h, headerBg, headerText, bodyLines) => {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.stroke();

    const hh = Math.round(h * 0.28);
    ctx.fillStyle = headerBg;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, hh, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(hh * 0.52)}px ${UI_FONT}`;
    ctx.fillText(headerText, x + w / 2, y + hh / 2 + 1);

    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const lineSpacing = Math.round((h - hh) / (bodyLines.length + 1));
    bodyLines.forEach((line, idx) => {
      ctx.font = `${idx === 0 ? "bold" : "500"} ${Math.round(lineSpacing * 0.44)}px ${UI_FONT}`;
      ctx.fillText(line, x + w / 2, y + hh + (idx + 1) * lineSpacing - 4);
    });

    ctx.restore();
  };

  // 1. ABC Fire Extinguisher (top left)
  drawSign(
    10, 10, 236, 236,
    "#b91c1c",
    "O'T O'CHIRGICH",
    [
      "FIRE EXTINGUISHER",
      "TOIFA: A · B · C",
      "1. Halqani torting (PULL)",
      "2. Olov tubiga qarating (AIM)",
      "3. Tutqichni bosing (SQUEEZE)",
    ],
  );

  // 2. Laboratory rules (top center)
  drawSign(
    260, 10, 496, 236,
    "#1d4ed8",
    "LABORATORIYA XAVFSIZLIK QOIDALARI",
    [
      "LABORATORY SAFETY RULES",
      "Reaktivlar bilan faqat ko'zoynakda ishlang",
      "Kislotani suvga quying, suvni kislotaga emas",
      "To'kilgan moddani darhol tozalang",
    ],
  );

  // 3. First Aid Box (top right)
  drawSign(
    770, 10, 244, 236,
    "#047857",
    "TEZKOR YORDAM",
    [
      "FIRST AID STATION",
      "Kuyish va jarohatlar uchun",
      "Zararlangan terini sovuting",
      "+998 103 / FAVQULODDA",
    ],
  );

  // 4. Fire Blanket (middle left)
  drawSign(
    10, 260, 236, 236,
    "#b91c1c",
    "YONG'IN ADYOLI",
    [
      "FIRE BLANKET",
      "Tasmadan ushlab torting",
      "Olov ustiga to'liq yoping",
      "Kislorodni kesib o'chirish",
    ],
  );

  // 5. Eye Protection / PPE (middle right)
  drawSign(
    520, 260, 236, 236,
    "#1d4ed8",
    "DIQQAT / NOTICE",
    [
      "XIMOYA KO'ZOYNAKLARI",
      "EYE PROTECTION REQUIRED",
      "Reaktivlar bilan ishlaganda",
      "ko'zoynak taqish majburiy!",
    ],
  );

  // 6. Fume Hood Sash Working Height Limit
  ctx.save();
  const stripeW = 20;
  for (let sx = 260; sx < 756; sx += stripeW * 2) {
    ctx.fillStyle = "#facc15";
    ctx.fillRect(sx, 520, stripeW, 100);
    ctx.fillStyle = "#111827";
    ctx.fillRect(sx + stripeW, 520, stripeW, 100);
  }
  ctx.fillStyle = "#111827";
  ctx.fillRect(310, 532, 396, 76);
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 2;
  ctx.strokeRect(310, 532, 396, 76);
  ctx.fillStyle = "#facc15";
  ctx.textAlign = "center";
  ctx.font = `bold 16px ${UI_FONT}`;
  ctx.fillText("▲ MAKSIMAL ISH BALANDLIGI: 30 sm ▲", 508, 560);
  ctx.fillStyle = "#ffffff";
  ctx.font = `13px ${UI_FONT}`;
  ctx.fillText("MAXIMUM SASH WORKING HEIGHT — KEEP CLOSED", 508, 588);
  ctx.restore();

  // 7. NFPA 704 Diamond
  ctx.save();
  const cx = 640;
  const cy = 880;
  const rad = 95;
  const drawDiamond = (dx, dy, color, text) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + dy - rad * 0.48);
    ctx.lineTo(cx + dx + rad * 0.48, cy + dy);
    ctx.lineTo(cx + dx, cy + dy + rad * 0.48);
    ctx.lineTo(cx + dx - rad * 0.48, cy + dy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color === "#ffffff" ? "#111827" : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold 32px ${UI_FONT}`;
    ctx.fillText(text, cx + dx, cy + dy);
  };
  drawDiamond(0, -rad * 0.48, "#dc2626", "2");
  drawDiamond(-rad * 0.48, 0, "#2563eb", "3");
  drawDiamond(rad * 0.48, 0, "#eab308", "1");
  drawDiamond(0, rad * 0.48, "#ffffff", "W");
  ctx.restore();

  // 8. Master Gas Shutoff & GFCI Labels
  drawSign(
    10, 770, 244, 236,
    "#b91c1c",
    "GAZ MAGISTRALI",
    [
      "EMERGENCY GAS SHUT-OFF",
      "Kran 90° burilganda",
      "barcha gaz liniyalari uziladi",
      "Favqulodda yopish krani",
    ],
  );

  return toTexture(canvas, 8);
};


// ---------- Wear detail: roughness and bump maps for the bench top, floor and sink steel ----------

// Linear-space grayscale canvas texture (roughness/bump maps must not be sRGB).
const toDataTexture = (canvas, repeat, anisotropy = 8) => {
  const texture = new CanvasTexture(canvas);
  texture.flipY = false;
  texture.anisotropy = anisotropy;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
};

const hash = (x, y, seed) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t) => t * t * (3 - 2 * t);
const noise2 = (x, y, period, seed) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const w = (v) => ((v % period) + period) % period;
  const v = (i, j) => hash(w(xi + i), w(yi + j), seed);
  const top = v(0, 0) + (v(1, 0) - v(0, 0)) * fx;
  const bottom = v(0, 1) + (v(1, 1) - v(0, 1)) * fx;
  return top + (bottom - top) * fy;
};
const fbm = (u, v, base, seed, octaves = 4) => {
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    const f = base * 2 ** o;
    const w = 0.5 ** o;
    sum += noise2(u * f, v * f, f, seed + o * 17) * w;
    norm += w;
  }
  return sum / norm;
};

const paintGray = (ctx, size, sample) => {
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const g = Math.round(Math.max(0, Math.min(1, sample(x / size, y / size, x, y))) * 255);
      data.set([g, g, g, 255], (y * size + x) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
};

const ring = (u, v, cx, cy, r, w) => {
  const d = Math.hypot(u - cx, v - cy);
  return Math.exp(-((d - r) * (d - r)) / (w * w));
};

// Phenolic bench top: satin base with wiped streaks, a few dried ring stains and fine scratches.
export const createBenchDetailTextures = (size = 1024) => {
  const roughness = makeCanvas(size, size);
  // Two faint dried rings per tile; the map tiles 1.5× across a bench so they never read as a pattern.
  const rings = [[0.22, 0.31, 0.05, 0.003], [0.71, 0.76, 0.035, 0.0025]];
  paintGray(roughness.ctx, size, (u, v) => {
    const broad = fbm(u, v, 3, 11, 3);
    // Wipe marks run diagonally; they leave the surface slightly glossier.
    const streak = fbm(u * 0.35 + v * 0.65, (u - v) * 0.1, 6, 29, 2);
    let r = 0.3 + (broad - 0.5) * 0.16 + (streak - 0.5) * 0.08;
    for (const [cx, cy, rad, w] of rings) r += ring(u, v, cx, cy, rad, w) * 0.12;
    return r;
  });
  const bump = makeCanvas(size, size);
  paintGray(bump.ctx, size, (u, v, x, y) => {
    let h = 0.5 + (fbm(u, v, 24, 5, 3) - 0.5) * 0.08;
    // Sparse hairline scratches.
    const line = Math.abs(Math.sin((u * 7.3 + v * 1.9) * Math.PI * 2 + fbm(u, v, 2, 3, 2) * 4));
    if (line > 0.998 && hash(x >> 3, y >> 3, 9) > 0.6) h -= 0.08;
    for (const [cx, cy, rad, w] of rings) h += ring(u, v, cx, cy, rad, w) * 0.02;
    return h;
  });
  return { roughness: toDataTexture(roughness.canvas, 1.5, 16), bump: toDataTexture(bump.canvas, 1.5, 16) };
};

// Vinyl floor: matte with glossier scuffed lanes where people walk and darker grime along the seams.
export const createFloorDetailTexture = (size = 1024) => {
  const { canvas, ctx } = makeCanvas(size, size);
  paintGray(ctx, size, (u, v) => {
    const lanes = Math.exp(-((v - 0.5) * (v - 0.5)) / 0.06) * 0.5 + Math.exp(-((u - 0.5) * (u - 0.5)) / 0.08) * 0.4;
    const scuff = fbm(u, v, 5, 41, 3);
    const seam = Math.min(Math.abs((u * 4) % 1 - 0.5), Math.abs((v * 4) % 1 - 0.5));
    return 0.42 - lanes * scuff * 0.22 + (seam < 0.015 ? 0.15 : 0) + (scuff - 0.5) * 0.1;
  });
  return toDataTexture(canvas, 6, 16);
};

// Brushed stainless: fine parallel grain in the roughness and a faint bump so highlights streak.
export const createBrushedSteelTextures = (size = 512) => {
  const roughness = makeCanvas(size, size);
  paintGray(roughness.ctx, size, (u, v, x, y) => 0.28 + (hash(x, y >> 4, 3) - 0.5) * 0.18 + (fbm(u, v, 4, 7, 2) - 0.5) * 0.08);
  const bump = makeCanvas(size, size);
  paintGray(bump.ctx, size, (u, v, x, y) => 0.5 + (hash(x, y >> 3, 5) - 0.5) * 0.12);
  return { roughness: toDataTexture(roughness.canvas, 3, 16), bump: toDataTexture(bump.canvas, 3, 16) };
};
