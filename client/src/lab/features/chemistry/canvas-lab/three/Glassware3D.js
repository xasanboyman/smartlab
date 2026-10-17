import * as THREE from "three";

/**
 * 3D Procedural Lab Glassware & Apparatus
 * Provides physical glassware (Beakers, Flasks, Test Tubes, Bunsen Burner, Burette Stand, Bottles)
 * with physically-plausible transmission, fluid level rendering, and dynamic reaction effects.
 */

// Shared Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.38,
  transmission: 0.92,
  roughness: 0.08,
  ior: 1.52,
  thickness: 0.3,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0x9099a2,
  metalness: 0.85,
  roughness: 0.25,
});

const brassMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  metalness: 0.88,
  roughness: 0.28,
});

const darkWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a2e1b,
  roughness: 0.7,
  metalness: 0.05,
});

/**
 * Helper to generate graduation lines canvas texture
 */
function createGraduationTexture(label = "250 ml") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, 256, 512);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 4;
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "left";

  const numMarks = 5;
  for (let i = 0; i <= numMarks; i++) {
    const y = 460 - (i / numMarks) * 360;
    const markLen = i % 2 === 0 ? 55 : 35;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(30 + markLen, y);
    ctx.stroke();

    if (i > 0 && i % 2 === 0) {
      ctx.fillText(`${i * 50}`, 95, y + 8);
    }
  }

  ctx.font = "bold 20px system-ui";
  ctx.fillText(label, 30, 80);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Helper to generate bottle label texture
 */
function createBottleLabel(title, formula, hazard = "CORROSIVE") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(10, 10, 236, 236);
  ctx.strokeStyle = "#c82333";
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 228, 228);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.fillText(formula, 128, 85);

  ctx.font = "bold 22px system-ui";
  ctx.fillStyle = "#333333";
  ctx.fillText(title, 128, 125);

  // Hazard diamond
  ctx.fillStyle = "#ffc107";
  ctx.beginPath();
  ctx.moveTo(128, 155);
  ctx.lineTo(155, 180);
  ctx.lineTo(128, 205);
  ctx.lineTo(101, 180);
  ctx.fill();

  ctx.fillStyle = "#900";
  ctx.font = "bold 14px monospace";
  ctx.fillText("!", 128, 186);

  ctx.font = "bold 16px monospace";
  ctx.fillStyle = "#c82333";
  ctx.fillText(hazard, 128, 228);

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/**
 * 3D Beaker (250 ml)
 */
export function createBeaker3D(options = {}) {
  const group = new THREE.Group();
  group.name = "Beaker";

  const radius = 0.35;
  const height = 0.85;

  // Outer Glass Cylinder with Spout
  const glassGeo = new THREE.CylinderGeometry(radius, radius * 0.96, height, 32, 1, true);
  const glassMesh = new THREE.Mesh(glassGeo, glassMaterial.clone());
  glassMesh.position.y = height / 2;
  glassMesh.castShadow = true;
  group.add(glassMesh);

  // Glass Base
  const baseGeo = new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.04, 32);
  const baseMesh = new THREE.Mesh(baseGeo, glassMaterial.clone());
  baseMesh.position.y = 0.02;
  group.add(baseMesh);

  // Lip Rim
  const rimGeo = new THREE.TorusGeometry(radius, 0.018, 12, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, glassMaterial.clone());
  rimMesh.position.y = height;
  group.add(rimMesh);

  // Graduations Decal
  const gradGeo = new THREE.CylinderGeometry(radius + 0.002, radius + 0.002, height * 0.8, 32, 1, true, 0, Math.PI / 2);
  const gradMat = new THREE.MeshBasicMaterial({
    map: createGraduationTexture("250 ml"),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const gradMesh = new THREE.Mesh(gradGeo, gradMat);
  gradMesh.position.y = height / 2;
  gradMesh.rotation.y = -Math.PI / 4;
  group.add(gradMesh);

  // Liquid Inside
  const liquidMat = new THREE.MeshStandardMaterial({
    color: options.liquidColor || 0x2288ff,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  });

  const liquidGeo = new THREE.CylinderGeometry(radius * 0.93, radius * 0.91, 0.01, 32);
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidMesh.position.y = 0.01;
  group.add(liquidMesh);

  // Liquid surface meniscus
  const surfaceGeo = new THREE.CircleGeometry(radius * 0.93, 32);
  surfaceGeo.rotateX(-Math.PI / 2);
  const surfaceMesh = new THREE.Mesh(surfaceGeo, liquidMat);
  surfaceMesh.position.y = 0.01;
  group.add(surfaceMesh);

  group.userData = {
    type: "beaker",
    maxVolume: 250,
    volume: options.volume || 100,
    liquidMesh,
    surfaceMesh,
    liquidMat,
    height,
    radius,
    setVolume(v) {
      this.volume = Math.max(0, Math.min(250, v));
      const fraction = this.volume / 250;
      const curH = Math.max(0.01, fraction * height * 0.85);
      liquidMesh.scale.set(1, curH / 0.01, 1);
      liquidMesh.position.y = curH / 2 + 0.02;
      surfaceMesh.position.y = curH + 0.02;
      liquidMesh.visible = this.volume > 0;
      surfaceMesh.visible = this.volume > 0;
    },
    setColor(hex) {
      liquidMat.color.set(hex);
    },
  };

  group.userData.setVolume(options.volume || 120);
  return group;
}

/**
 * 3D Erlenmeyer Flask (250 ml)
 */
export function createErlenmeyerFlask3D(options = {}) {
  const group = new THREE.Group();
  group.name = "ErlenmeyerFlask";

  // Lathe geometry for iconic conical flask body
  const points = [];
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.44, 0.02)); // base
  points.push(new THREE.Vector2(0.42, 0.1));
  points.push(new THREE.Vector2(0.16, 0.75)); // neck start
  points.push(new THREE.Vector2(0.16, 1.05)); // neck top
  points.push(new THREE.Vector2(0.19, 1.08)); // flared lip

  const flaskGeo = new THREE.LatheGeometry(points, 32);
  const flaskMesh = new THREE.Mesh(flaskGeo, glassMaterial.clone());
  flaskMesh.castShadow = true;
  group.add(flaskMesh);

  // Liquid Inside
  const liquidMat = new THREE.MeshStandardMaterial({
    color: options.liquidColor || 0xffffff,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const liquidGeo = new THREE.CylinderGeometry(0.32, 0.41, 0.35, 32);
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidMesh.position.y = 0.18;
  group.add(liquidMesh);

  group.userData = {
    type: "flask",
    maxVolume: 250,
    volume: options.volume || 80,
    liquidMesh,
    liquidMat,
    setVolume(v) {
      this.volume = Math.max(0, Math.min(250, v));
      const fraction = this.volume / 250;
      const curH = Math.max(0.01, fraction * 0.65);
      liquidMesh.scale.set(1, curH / 0.35, 1);
      liquidMesh.position.y = curH / 2 + 0.04;
      liquidMesh.visible = this.volume > 0;
    },
    setColor(hex) {
      liquidMat.color.set(hex);
    },
  };

  group.userData.setVolume(options.volume || 100);
  return group;
}

/**
 * 3D Bunsen Burner with dual-zone animated flame
 */
export function createBunsenBurner3D() {
  const group = new THREE.Group();
  group.name = "BunsenBurner";

  // Heavy hexagonal base
  const baseGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.08, 6);
  const baseMesh = new THREE.Mesh(baseGeo, metalMaterial);
  baseMesh.position.y = 0.04;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Gas supply inlet pipe
  const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
  pipeGeo.rotateZ(Math.PI / 2);
  const pipeMesh = new THREE.Mesh(pipeGeo, brassMaterial);
  pipeMesh.position.set(0.2, 0.08, 0);
  group.add(pipeMesh);

  // Air collar (knurled ring with air hole)
  const collarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16);
  const collarMesh = new THREE.Mesh(collarGeo, brassMaterial);
  collarMesh.position.y = 0.15;
  group.add(collarMesh);

  // Vertical chimney barrel
  const barrelGeo = new THREE.CylinderGeometry(0.085, 0.09, 0.85, 24);
  const barrelMesh = new THREE.Mesh(barrelGeo, metalMaterial);
  barrelMesh.position.y = 0.58;
  barrelMesh.castShadow = true;
  group.add(barrelMesh);

  // Top rim
  const rimGeo = new THREE.CylinderGeometry(0.1, 0.085, 0.05, 24);
  const rimMesh = new THREE.Mesh(rimGeo, metalMaterial);
  rimMesh.position.y = 1.02;
  group.add(rimMesh);

  // Flame: Inner blue cone (hot core)
  const innerFlameGeo = new THREE.ConeGeometry(0.065, 0.35, 16);
  innerFlameGeo.translate(0, 0.175, 0);
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0x00d0ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  innerFlame.position.y = 1.04;
  group.add(innerFlame);

  // Flame: Outer luminous cone (blue oxidizing or orange reducing flame)
  const outerFlameGeo = new THREE.ConeGeometry(0.12, 0.65, 16);
  outerFlameGeo.translate(0, 0.325, 0);
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0x2288ff,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });
  const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
  outerFlame.position.y = 1.04;
  group.add(outerFlame);

  // Flame Light
  const flameLight = new THREE.PointLight(0x00d0ff, 2.5, 3.5);
  flameLight.position.y = 1.4;
  group.add(flameLight);

  group.userData = {
    type: "burner",
    isLit: false,
    collarOpen: true,
    innerFlame,
    outerFlame,
    flameLight,
    ignite() {
      this.isLit = true;
      this.updateFlame();
    },
    extinguish() {
      this.isLit = false;
      innerFlame.visible = false;
      outerFlame.visible = false;
      flameLight.intensity = 0;
    },
    toggleCollar() {
      this.collarOpen = !this.collarOpen;
      this.updateFlame();
    },
    updateFlame() {
      if (!this.isLit) {
        innerFlame.visible = false;
        outerFlame.visible = false;
        flameLight.intensity = 0;
        return;
      }
      innerFlame.visible = true;
      outerFlame.visible = true;
      if (this.collarOpen) {
        // High temp roaring blue flame (1300°C)
        innerFlameMat.color.set(0x00f0ff);
        outerFlameMat.color.set(0x1a75ff);
        flameLight.color.set(0x00d0ff);
        flameLight.intensity = 2.8;
      } else {
        // Luminous safety yellow/orange flame (750°C)
        innerFlameMat.color.set(0xff7700);
        outerFlameMat.color.set(0xffaa00);
        flameLight.color.set(0xff9900);
        flameLight.intensity = 1.8;
      }
    },
    animate(time) {
      if (!this.isLit) return;
      const flicker = 1 + Math.sin(time * 35) * 0.08 + Math.cos(time * 22) * 0.04;
      innerFlame.scale.set(flicker, flicker * (1 + Math.sin(time * 40) * 0.1), flicker);
      outerFlame.scale.set(flicker, flicker * (1 + Math.cos(time * 30) * 0.12), flicker);
      flameLight.intensity = (this.collarOpen ? 2.8 : 1.8) * flicker;
    },
  };

  group.userData.extinguish();
  return group;
}

/**
 * 3D Titration Retort Stand with Graduated Burette & Droplet Dispenser
 */
export function createTitrationStand3D() {
  const group = new THREE.Group();
  group.name = "TitrationStand";

  // Heavy rectangular base
  const baseGeo = new THREE.BoxGeometry(0.7, 0.06, 0.45);
  const baseMesh = new THREE.Mesh(baseGeo, metalMaterial);
  baseMesh.position.set(0, 0.03, 0);
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Vertical steel rod
  const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 16);
  const rodMesh = new THREE.Mesh(rodGeo, metalMaterial);
  rodMesh.position.set(-0.25, 1.1, 0);
  rodMesh.castShadow = true;
  group.add(rodMesh);

  // Clamp bosshead
  const clampGeo = new THREE.BoxGeometry(0.1, 0.08, 0.1);
  const clampMesh = new THREE.Mesh(clampGeo, brassMaterial);
  clampMesh.position.set(-0.25, 1.45, 0);
  group.add(clampMesh);

  // Clamp arm holding burette
  const armGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.32, 12);
  armGeo.rotateZ(Math.PI / 2);
  const armMesh = new THREE.Mesh(armGeo, metalMaterial);
  armMesh.position.set(-0.1, 1.45, 0);
  group.add(armMesh);

  // Burette tube
  const buretteGeo = new THREE.CylinderGeometry(0.04, 0.035, 1.4, 24);
  const buretteMesh = new THREE.Mesh(buretteGeo, glassMaterial.clone());
  buretteMesh.position.set(0.05, 1.4, 0);
  group.add(buretteMesh);

  // Stopcock valve handle
  const valveGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12);
  valveGeo.rotateZ(Math.PI / 2);
  const valveMesh = new THREE.Mesh(valveGeo, brassMaterial);
  valveMesh.position.set(0.05, 0.8, 0.03);
  group.add(valveMesh);

  // Liquid inside burette
  const buretteLiquidGeo = new THREE.CylinderGeometry(0.033, 0.033, 1.1, 16);
  const buretteLiquidMat = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.75,
  });
  const buretteLiquidMesh = new THREE.Mesh(buretteLiquidGeo, buretteLiquidMat);
  buretteLiquidMesh.position.set(0.05, 1.45, 0);
  group.add(buretteLiquidMesh);

  // Droplet particle
  const dropGeo = new THREE.SphereGeometry(0.022, 12, 12);
  const dropMat = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.85,
  });
  const dropMesh = new THREE.Mesh(dropGeo, dropMat);
  dropMesh.position.set(0.05, 0.68, 0);
  dropMesh.visible = false;
  group.add(dropMesh);

  group.userData = {
    type: "burette",
    isOpen: false,
    volume: 50.0,
    valveMesh,
    buretteLiquidMesh,
    dropMesh,
    dropProgress: 0,
    toggleValve() {
      this.isOpen = !this.isOpen;
      valveMesh.rotation.z = this.isOpen ? Math.PI / 2 : 0;
    },
    animate(dt, onDropHit) {
      if (this.isOpen && this.volume > 0) {
        this.dropMesh.visible = true;
        this.dropProgress += dt * 3.5;
        this.dropMesh.position.y = 0.68 - this.dropProgress * 0.45;
        if (this.dropProgress >= 1.0) {
          this.dropProgress = 0;
          this.volume = Math.max(0, this.volume - 0.2);
          if (onDropHit) onDropHit(0.2);
        }
      } else {
        this.dropMesh.visible = false;
      }
    },
  };

  return group;
}

/**
 * 3D Test Tube Rack with 4 Colored Solution Tubes
 */
export function createTestTubeRack3D() {
  const group = new THREE.Group();
  group.name = "TestTubeRack";

  // Wooden base
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.35), darkWoodMaterial);
  base.position.y = 0.025;
  group.add(base);

  // Top plate with 4 holes
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), darkWoodMaterial);
  topPlate.position.y = 0.55;
  group.add(topPlate);

  // Side pillars
  const pillarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.52, 12);
  const p1 = new THREE.Mesh(pillarGeo, darkWoodMaterial);
  p1.position.set(-0.5, 0.28, 0);
  const p2 = new THREE.Mesh(pillarGeo, darkWoodMaterial);
  p2.position.set(0.5, 0.28, 0);
  group.add(p1, p2);

  // 4 Test tubes
  const tubeColors = [0x2288ff, 0x9922bb, 0xff5533, 0x22cc77];
  const tubeNames = ["CuSO₄", "KMnO₄", "FeCl₃", "NiSO₄"];

  const tubes = [];
  for (let i = 0; i < 4; i++) {
    const tx = -0.36 + i * 0.24;
    const tubeGroup = new THREE.Group();
    tubeGroup.position.set(tx, 0.42, 0);

    // Glass tube
    const tubeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.72, 24, 1, true);
    const tubeMesh = new THREE.Mesh(tubeGeo, glassMaterial.clone());
    tubeGroup.add(tubeMesh);

    // Rounded tube bottom
    const bottomGeo = new THREE.SphereGeometry(0.065, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomMesh = new THREE.Mesh(bottomGeo, glassMaterial.clone());
    bottomMesh.position.y = -0.36;
    tubeGroup.add(bottomMesh);

    // Liquid
    const liqGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.45, 16);
    const liqMat = new THREE.MeshStandardMaterial({
      color: tubeColors[i],
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
    });
    const liqMesh = new THREE.Mesh(liqGeo, liqMat);
    liqMesh.position.y = -0.12;
    tubeGroup.add(liqMesh);

    tubeGroup.userData = {
      name: tubeNames[i],
      color: tubeColors[i],
      type: "testtube",
    };

    tubes.push(tubeGroup);
    group.add(tubeGroup);
  }

  group.userData = { tubes };
  return group;
}

/**
 * 3D Chemical Reagent Bottle
 */
export function createReagentBottle3D(name, formula, colorHex, liquidHex, hazard = "CORROSIVE") {
  const group = new THREE.Group();
  group.name = `Bottle_${formula}`;

  // Amber / Dark Chemical Glass Body
  const bottleGeo = new THREE.CylinderGeometry(0.18, 0.17, 0.48, 24);
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: colorHex || 0x6e3c16, // Amber glass
    roughness: 0.15,
    transmission: 0.65,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });
  const bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);
  bottleMesh.position.y = 0.24;
  bottleMesh.castShadow = true;
  group.add(bottleMesh);

  // Bottle Shoulder & Neck
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.16, 0.16, 24);
  const neckMesh = new THREE.Mesh(neckGeo, bottleMat);
  neckMesh.position.y = 0.54;
  group.add(neckMesh);

  // Black Bakelite Cap
  const capGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 24);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.y = 0.65;
  capMesh.castShadow = true;
  group.add(capMesh);

  // Label Decal
  const labelGeo = new THREE.CylinderGeometry(0.182, 0.182, 0.28, 24, 1, true, 0, Math.PI * 0.9);
  const labelMat = new THREE.MeshBasicMaterial({
    map: createBottleLabel(name, formula, hazard),
    side: THREE.DoubleSide,
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = 0.24;
  labelMesh.rotation.y = -Math.PI * 0.45;
  group.add(labelMesh);

  group.userData = {
    type: "reagent",
    name,
    formula,
    liquidHex,
  };

  return group;
}

/**
 * 3D Heavy Chemical Research Workbench
 */
export function createLabBench3D(width = 4.2, depth = 1.6, height = 0.95) {
  const group = new THREE.Group();
  group.name = "LabBench";

  // Black Phenolic Resin Countertop (chemical & heat resistant)
  const topGeo = new THREE.BoxGeometry(width, 0.1, depth);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x1b1f24,
    roughness: 0.28,
    metalness: 0.18,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = height;
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // Brushed steel support frame and legs
  const legGeo = new THREE.BoxGeometry(0.09, height, 0.09);
  const positions = [
    [-width / 2 + 0.15, height / 2, -depth / 2 + 0.15],
    [width / 2 - 0.15, height / 2, -depth / 2 + 0.15],
    [-width / 2 + 0.15, height / 2, depth / 2 - 0.15],
    [width / 2 - 0.15, height / 2, depth / 2 - 0.15],
  ];

  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, metalMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Cross stretchers
  const crossGeoX = new THREE.BoxGeometry(width - 0.3, 0.06, 0.06);
  const c1 = new THREE.Mesh(crossGeoX, metalMaterial);
  c1.position.set(0, 0.2, -depth / 2 + 0.15);
  const c2 = new THREE.Mesh(crossGeoX, metalMaterial);
  c2.position.set(0, 0.2, depth / 2 - 0.15);
  group.add(c1, c2);

  // Back reagent shelf
  const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.04, 0.35), topMat);
  shelfTop.position.set(0, height + 0.38, -depth / 2 + 0.25);
  shelfTop.castShadow = true;
  group.add(shelfTop);

  const shelfSupportGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.38, 16);
  const s1 = new THREE.Mesh(shelfSupportGeo, metalMaterial);
  s1.position.set(-width * 0.4, height + 0.19, -depth / 2 + 0.25);
  const s2 = new THREE.Mesh(shelfSupportGeo, metalMaterial);
  s2.position.set(width * 0.4, height + 0.19, -depth / 2 + 0.25);
  group.add(s1, s2);

  return group;
}
