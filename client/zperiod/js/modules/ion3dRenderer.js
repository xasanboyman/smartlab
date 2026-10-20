// =============================================================================
// SmartLab 3D Ion Renderer - Interactive WebGL 3D Ion Simulation
// Features:
// - Monatomic ions: Nucleus (p+ / n0), exact ionic electron configuration shells,
//   ionization loss/gain visualization, electrostatic field corona & flux lines.
// - Polyatomic ions: Full 3D molecular ball-and-stick geometry with resonant
//   delocalized charge cloud (NH4+, SO4(2-), NO3-, CO3(2-), OH-, H3O+, etc.).
// - Hydration shell (aq): Dynamic coordinating water molecules (H2O dipoles)
//   oriented properly (O pointing to cations, H pointing to anions).
// - Interactive orbit controls (mouse drag, wheel zoom, touch rotate).
// =============================================================================

import { ensureThreeLibLoaded } from "./threeRenderer.js";

let scene = null;
let camera = null;
let renderer = null;
let animId = null;
let containerEl = null;

// Groups
let ionGroup = null;
let nucleusGroup = null;
let shellsGroup = null;
let fieldGroup = null;
let hydrationGroup = null;
let moleculeGroup = null;

// State
let isRotating = true;
let showField = true;
let showOrbitals = true;
let showHydration = false;
let currentIonData = null;

// Orbit controls state
let isDragging = false;
let prevPointer = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0.005 };
let targetRotation = { x: 0.2, y: 0 };
let currentRotation = { x: 0.2, y: 0 };
let cameraDistance = 18;
let targetCameraDistance = 18;

// Shared Geometries & Materials Cache
let sphereGeoLow = null;
let sphereGeoMid = null;
let sphereGeoHigh = null;
let cylinderGeo = null;

// Polyatomic molecular 3D coordinates (Angstroms scaled for 3D view)
const POLYATOMIC_STRUCTURES = {
  nh4_plus: {
    formula: "NH₄⁺",
    center: { elem: "N", color: 0x3b82f6, radius: 0.9 },
    ligands: [
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [1.1, 1.1, 1.1] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-1.1, -1.1, 1.1] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-1.1, 1.1, -1.1] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [1.1, -1.1, -1.1] },
    ],
  },
  h3o_plus: {
    formula: "H₃O⁺",
    center: { elem: "O", color: 0xef4444, radius: 0.85 },
    ligands: [
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [1.2, 0.0, -0.4] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-0.6, 1.04, -0.4] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-0.6, -1.04, -0.4] },
    ],
  },
  oh_minus: {
    formula: "OH⁻",
    center: { elem: "O", color: 0xef4444, radius: 0.85 },
    ligands: [{ elem: "H", color: 0xffffff, radius: 0.45, pos: [0, 0, 1.3] }],
  },
  no3_minus: {
    formula: "NO₃⁻",
    center: { elem: "N", color: 0x3b82f6, radius: 0.85 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.6, 0, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.8, 1.38, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.8, -1.38, 0] },
    ],
  },
  no2_minus: {
    formula: "NO₂⁻",
    center: { elem: "N", color: 0x3b82f6, radius: 0.85 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.3, -0.6, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.3, -0.6, 0] },
    ],
  },
  so4_2minus: {
    formula: "SO₄²⁻",
    center: { elem: "S", color: 0xeab308, radius: 1.05 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.3, 1.3, 1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.3, -1.3, 1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.3, 1.3, -1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.3, -1.3, -1.3] },
    ],
  },
  so3_2minus: {
    formula: "SO₃²⁻",
    center: { elem: "S", color: 0xeab308, radius: 1.0 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, -0.4, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.7, -0.4, 1.2] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.7, -0.4, -1.2] },
    ],
  },
  co3_2minus: {
    formula: "CO₃²⁻",
    center: { elem: "C", color: 0x475569, radius: 0.8 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.5, 0, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.75, 1.3, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.75, -1.3, 0] },
    ],
  },
  hco3_minus: {
    formula: "HCO₃⁻",
    center: { elem: "C", color: 0x475569, radius: 0.8 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.5, 0, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.75, 1.3, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.75, -1.3, 0] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-1.4, -1.9, 0] },
    ],
  },
  po4_3minus: {
    formula: "PO₄³⁻",
    center: { elem: "P", color: 0xf97316, radius: 1.05 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, 1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, -1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, 1.4, -1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, -1.4, -1.4] },
    ],
  },
  clo4_minus: {
    formula: "ClO₄⁻",
    center: { elem: "Cl", color: 0x22c55e, radius: 1.0 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.3, 1.3, 1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.3, -1.3, 1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.3, 1.3, -1.3] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.3, -1.3, -1.3] },
    ],
  },
  clo3_minus: {
    formula: "ClO₃⁻",
    center: { elem: "Cl", color: 0x22c55e, radius: 1.0 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, -0.4, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.7, -0.4, 1.2] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-0.7, -0.4, -1.2] },
    ],
  },
  clo_minus: {
    formula: "ClO⁻",
    center: { elem: "Cl", color: 0x22c55e, radius: 1.0 },
    ligands: [{ elem: "O", color: 0xef4444, radius: 0.75, pos: [0, 0, 1.6] }],
  },
  mno4_minus: {
    formula: "MnO₄⁻",
    center: { elem: "Mn", color: 0x9333ea, radius: 1.1 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, 1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, -1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, 1.4, -1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, -1.4, -1.4] },
    ],
  },
  cro4_2minus: {
    formula: "CrO₄²⁻",
    center: { elem: "Cr", color: 0xf59e0b, radius: 1.1 },
    ligands: [
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, 1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, -1.4, 1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.4, 1.4, -1.4] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.4, -1.4, -1.4] },
    ],
  },
  cn_minus: {
    formula: "CN⁻",
    center: { elem: "C", color: 0x475569, radius: 0.8 },
    ligands: [{ elem: "N", color: 0x3b82f6, radius: 0.8, pos: [0, 0, 1.3] }],
  },
  ch3coo_minus: {
    formula: "CH₃COO⁻",
    center: { elem: "C", color: 0x475569, radius: 0.8 },
    ligands: [
      { elem: "C", color: 0x475569, radius: 0.8, pos: [0, 1.5, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [1.2, -0.6, 0] },
      { elem: "O", color: 0xef4444, radius: 0.75, pos: [-1.2, -0.6, 0] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [0.9, 1.9, 0.5] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [-0.9, 1.9, 0.5] },
      { elem: "H", color: 0xffffff, radius: 0.45, pos: [0, 1.9, -0.9] },
    ],
  },
};

// Monatomic electron shell map (Z -> neutral shells, and ion configuration)
const MONATOMIC_SPECIES = {
  h_plus: { Z: 1, charge: 1, p: 1, n: 0, shells: [], lost: [1], radius: "0.84 fm" },
  li_plus: { Z: 3, charge: 1, p: 3, n: 4, shells: [2], lost: [1], radius: "76 pm" },
  na_plus: { Z: 11, charge: 1, p: 11, n: 12, shells: [2, 8], lost: [1], radius: "102 pm" },
  k_plus: { Z: 19, charge: 1, p: 19, n: 20, shells: [2, 8, 8], lost: [1], radius: "138 pm" },
  ag_plus: { Z: 47, charge: 1, p: 47, n: 61, shells: [2, 8, 18, 18], lost: [1], radius: "115 pm" },
  mg_2plus: { Z: 12, charge: 2, p: 12, n: 12, shells: [2, 8], lost: [2], radius: "72 pm" },
  ca_2plus: { Z: 20, charge: 2, p: 20, n: 20, shells: [2, 8, 8], lost: [2], radius: "100 pm" },
  ba_2plus: { Z: 56, charge: 2, p: 56, n: 81, shells: [2, 8, 18, 18, 8], lost: [2], radius: "135 pm" },
  zn_2plus: { Z: 30, charge: 2, p: 30, n: 35, shells: [2, 8, 18], lost: [2], radius: "74 pm" },
  al_3plus: { Z: 13, charge: 3, p: 13, n: 14, shells: [2, 8], lost: [3], radius: "53 pm" },
  cu_plus: { Z: 29, charge: 1, p: 29, n: 35, shells: [2, 8, 18], lost: [1], radius: "77 pm" },
  cu_2plus: { Z: 29, charge: 2, p: 29, n: 35, shells: [2, 8, 17], lost: [2], radius: "73 pm" },
  fe_2plus: { Z: 26, charge: 2, p: 26, n: 30, shells: [2, 8, 14], lost: [2], radius: "78 pm" },
  fe_3plus: { Z: 26, charge: 3, p: 26, n: 30, shells: [2, 8, 13], lost: [3], radius: "64 pm" },
  pb_2plus: { Z: 82, charge: 2, p: 82, n: 125, shells: [2, 8, 18, 32, 18, 2], lost: [2], radius: "119 pm" },
  f_minus: { Z: 9, charge: -1, p: 9, n: 10, shells: [2, 8], gained: 1, radius: "133 pm" },
  cl_minus: { Z: 17, charge: -1, p: 17, n: 18, shells: [2, 8, 8], gained: 1, radius: "181 pm" },
  br_minus: { Z: 35, charge: -1, p: 35, n: 45, shells: [2, 8, 18, 8], gained: 1, radius: "196 pm" },
  i_minus: { Z: 53, charge: -1, p: 53, n: 74, shells: [2, 8, 18, 18, 8], gained: 1, radius: "220 pm" },
  o_2minus: { Z: 8, charge: -2, p: 8, n: 8, shells: [2, 8], gained: 2, radius: "140 pm" },
  s_2minus: { Z: 16, charge: -2, p: 16, n: 16, shells: [2, 8, 8], gained: 2, radius: "184 pm" },
  n_3minus: { Z: 7, charge: -3, p: 7, n: 7, shells: [2, 8], gained: 3, radius: "171 pm" },
  p_3minus: { Z: 15, charge: -3, p: 15, n: 16, shells: [2, 8, 8], gained: 3, radius: "212 pm" },
};

function parseChargeNumber(chargeStr = "+") {
  if (typeof chargeStr === "number") return chargeStr;
  if (!chargeStr) return 1;
  if (chargeStr === "+") return 1;
  if (chargeStr === "-") return -1;
  if (chargeStr === "2+") return 2;
  if (chargeStr === "3+") return 3;
  if (chargeStr === "2-") return -2;
  if (chargeStr === "3-") return -3;
  const num = parseInt(chargeStr.replace(/[^0-9]/g, ""), 10) || 1;
  return chargeStr.includes("-") ? -num : num;
}

export async function initIon3D(container, ion) {
  if (!container || !ion) return;
  cleanupIon3D();

  containerEl = container;
  currentIonData = ion;

  const THREE = await ensureThreeLibLoaded();

  // Create Scene
  scene = new THREE.Scene();

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 400;

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);
  camera.position.set(0, 3, cameraDistance);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight1.position.set(10, 15, 12);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.6);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  // Reusable Geometries
  sphereGeoLow = new THREE.SphereGeometry(1, 16, 16);
  sphereGeoMid = new THREE.SphereGeometry(1, 24, 24);
  sphereGeoHigh = new THREE.SphereGeometry(1, 32, 32);
  cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);

  // Root ion group
  ionGroup = new THREE.Group();
  scene.add(ionGroup);

  // Build Ion Model
  buildIonModel(THREE, ion);

  // Setup Event Listeners
  setupInteractionEvents(container);

  // Setup HUD controls
  setupHudControls(ion);

  // Start Animation Loop
  let lastTime = performance.now();
  const animate = (time) => {
    animId = requestAnimationFrame(animate);
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    updateFrame(THREE, dt, time);
    renderer.render(scene, camera);
  };
  animId = requestAnimationFrame(animate);
}

function buildIonModel(THREE, ion) {
  // Clear any existing sub-groups
  while (ionGroup.children.length > 0) {
    const child = ionGroup.children[0];
    ionGroup.remove(child);
  }

  const chargeNum = parseChargeNumber(ion.charge);
  const isCation = chargeNum > 0;
  const isPolyatomic = Boolean(POLYATOMIC_STRUCTURES[ion.id]);

  fieldGroup = new THREE.Group();
  hydrationGroup = new THREE.Group();
  shellsGroup = new THREE.Group();
  nucleusGroup = new THREE.Group();
  moleculeGroup = new THREE.Group();

  ionGroup.add(fieldGroup);
  ionGroup.add(hydrationGroup);
  ionGroup.add(shellsGroup);
  ionGroup.add(nucleusGroup);
  ionGroup.add(moleculeGroup);

  if (isPolyatomic) {
    buildPolyatomicMolecule(THREE, ion.id, isCation);
  } else {
    buildMonatomicAtom(THREE, ion.id, isCation, chargeNum);
  }

  // Build Hydration Shell (H2O coordinating dipoles)
  buildHydrationShell(THREE, isCation);

  // Build Electrostatic Field Aura
  buildElectrostaticField(THREE, isCation, chargeNum);
}

function buildMonatomicAtom(THREE, ionId, isCation, chargeNum) {
  const meta = MONATOMIC_SPECIES[ionId] || {
    Z: 11,
    charge: chargeNum,
    p: 11,
    n: 12,
    shells: [2, 8],
    lost: isCation ? [1] : [],
    gained: !isCation ? 1 : 0,
    radius: "100 pm",
  };

  // 1. Central Nucleus
  const numProtons = Math.min(meta.p, 16);
  const numNeutrons = Math.min(meta.n, 16);
  const nucleusRadius = Math.max(0.7, Math.pow(numProtons + numNeutrons, 1 / 3) * 0.35);

  const protonMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    roughness: 0.3,
    metalness: 0.2,
  });

  const neutronMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x1e3a8a,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Pack nucleons
  const totalNucleons = numProtons + numNeutrons;
  for (let i = 0; i < totalNucleons; i++) {
    const isProton = i < numProtons;
    const mesh = new THREE.Mesh(sphereGeoLow, isProton ? protonMat : neutronMat);
    mesh.scale.setScalar(0.28);

    // Fibonacci sphere distribution for uniform cluster
    const phi = Math.acos(1 - (2 * (i + 0.5)) / totalNucleons);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const r = (nucleusRadius * 0.7) * (0.6 + 0.4 * Math.random());

    mesh.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    nucleusGroup.add(mesh);
  }

  // Glowing nucleus aura
  const nucAuraMat = new THREE.MeshBasicMaterial({
    color: isCation ? 0x60a5fa : 0xf43f5e,
    transparent: true,
    opacity: 0.25,
    wireframe: true,
  });
  const nucAura = new THREE.Mesh(sphereGeoMid, nucAuraMat);
  nucAura.scale.setScalar(nucleusRadius * 1.3);
  nucleusGroup.add(nucAura);

  // 2. Electron Shells & Orbitals
  const shellRadii = [2.6, 4.2, 5.8, 7.4, 9.0];

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
  });

  const electronMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  meta.shells.forEach((electronCount, shellIdx) => {
    const r = shellRadii[shellIdx] || (shellIdx + 1) * 2.2;
    const ringGeo = new THREE.TorusGeometry(r, 0.035, 12, 64);
    const ring = new THREE.Mesh(ringGeo, ringMat);

    // Slight orbital inclination for aesthetic 3D look
    ring.rotation.x = 0.2 * shellIdx;
    ring.rotation.y = 0.35 * shellIdx;
    shellsGroup.add(ring);

    // Add electron particles
    const shellGroup = new THREE.Group();
    shellGroup.rotation.x = ring.rotation.x;
    shellGroup.rotation.y = ring.rotation.y;

    for (let e = 0; e < electronCount; e++) {
      const angle = (e / electronCount) * Math.PI * 2;
      const electron = new THREE.Mesh(sphereGeoLow, electronMat);
      electron.scale.setScalar(0.2);
      electron.position.set(r * Math.cos(angle), r * Math.sin(angle), 0);
      shellGroup.add(electron);
    }

    shellGroup.userData = { speed: 1.2 / Math.sqrt(shellIdx + 1), radius: r };
    shellsGroup.add(shellGroup);
  });

  // 3. Lost outer valence shell indicator for cations
  if (isCation && meta.lost && meta.lost.length > 0) {
    const lostIdx = meta.shells.length;
    const lostR = shellRadii[lostIdx] || (lostIdx + 1) * 2.2;

    const lostRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const lostRing = new THREE.Mesh(new THREE.TorusGeometry(lostR, 0.02, 8, 36), lostRingMat);
    lostRing.rotation.x = 0.5;
    shellsGroup.add(lostRing);
  }
}

function buildPolyatomicMolecule(THREE, ionId, isCation) {
  const struct = POLYATOMIC_STRUCTURES[ionId] || POLYATOMIC_STRUCTURES.so4_2minus;

  // Center atom
  const centerMat = new THREE.MeshStandardMaterial({
    color: struct.center.color,
    roughness: 0.3,
    metalness: 0.15,
  });
  const centerMesh = new THREE.Mesh(sphereGeoHigh, centerMat);
  centerMesh.scale.setScalar(struct.center.radius);
  moleculeGroup.add(centerMesh);

  // Ligand atoms and bonds
  struct.ligands.forEach((lig) => {
    const ligMat = new THREE.MeshStandardMaterial({
      color: lig.color,
      roughness: 0.35,
      metalness: 0.1,
    });
    const ligMesh = new THREE.Mesh(sphereGeoHigh, ligMat);
    ligMesh.scale.setScalar(lig.radius);
    ligMesh.position.set(...lig.pos);
    moleculeGroup.add(ligMesh);

    // Cylinder bond connecting center to ligand
    const vPos = new THREE.Vector3(...lig.pos);
    const dist = vPos.length();

    const bondMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.2,
    });
    const bondMesh = new THREE.Mesh(cylinderGeo, bondMat);
    bondMesh.scale.set(1, dist, 1);

    // Orient cylinder along vector
    bondMesh.position.copy(vPos).multiplyScalar(0.5);
    bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vPos.clone().normalize());
    moleculeGroup.add(bondMesh);
  });

  // Resonant charge delocalization envelope
  const envelopeMat = new THREE.MeshBasicMaterial({
    color: isCation ? 0x38bdf8 : 0xf43f5e,
    transparent: true,
    opacity: 0.15,
    wireframe: true,
  });
  const envelope = new THREE.Mesh(sphereGeoMid, envelopeMat);
  envelope.scale.setScalar(3.2);
  moleculeGroup.add(envelope);
}

function buildHydrationShell(THREE, isCation) {
  const numWater = 6; // Octahedral coordination
  const hydDist = 7.2;

  const oMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red Oxygen
    roughness: 0.25,
  });
  const hMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White Hydrogen
    roughness: 0.2,
  });
  const bondMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.5,
  });

  const positions = [
    [hydDist, 0, 0],
    [-hydDist, 0, 0],
    [0, hydDist, 0],
    [0, -hydDist, 0],
    [0, 0, hydDist],
    [0, 0, -hydDist],
  ];

  positions.forEach((p, idx) => {
    const waterMol = new THREE.Group();
    waterMol.position.set(...p);

    // Oxygen atom
    const oMesh = new THREE.Mesh(sphereGeoMid, oMat);
    oMesh.scale.setScalar(0.55);
    waterMol.add(oMesh);

    // Two Hydrogen atoms at ~104.5 degrees
    const h1 = new THREE.Mesh(sphereGeoLow, hMat);
    const h2 = new THREE.Mesh(sphereGeoLow, hMat);
    h1.scale.setScalar(0.32);
    h2.scale.setScalar(0.32);

    h1.position.set(0.65, 0.45, 0);
    h2.position.set(-0.65, 0.45, 0);
    waterMol.add(h1);
    waterMol.add(h2);

    // Bonds
    const b1 = new THREE.Mesh(cylinderGeo, bondMat);
    b1.scale.set(0.6, 0.7, 0.6);
    b1.position.set(0.32, 0.22, 0);
    b1.rotation.z = -0.6;
    waterMol.add(b1);

    const b2 = new THREE.Mesh(cylinderGeo, bondMat);
    b2.scale.set(0.6, 0.7, 0.6);
    b2.position.set(-0.32, 0.22, 0);
    b2.rotation.z = 0.6;
    waterMol.add(b2);

    // Orientation:
    // For Cations: Oxygen (delta -) faces center (0,0,0)
    // For Anions: Hydrogens (delta +) face center (0,0,0)
    const dirToCenter = new THREE.Vector3().copy(waterMol.position).negate().normalize();
    if (isCation) {
      waterMol.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirToCenter);
    } else {
      waterMol.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirToCenter);
    }

    waterMol.userData = {
      basePos: new THREE.Vector3(...p),
      phase: idx * 1.05,
    };

    hydrationGroup.add(waterMol);
  });

  hydrationGroup.visible = showHydration;
}

function buildElectrostaticField(THREE, isCation, chargeNum) {
  const color = isCation ? 0x00e5ff : 0xf43f5e;

  // Glow sphere
  const glowMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.12,
  });
  const glow = new THREE.Mesh(sphereGeoHigh, glowMat);
  glow.scale.setScalar(5.5);
  fieldGroup.add(glow);

  // Field flux rings
  const fluxMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
  });

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5 + i * 1.8, 0.02, 8, 48), fluxMat);
    ring.rotation.x = Math.PI / 4 + i * 0.4;
    ring.rotation.y = i * 0.6;
    ring.userData = { rotSpeed: (isCation ? 1 : -1) * (0.3 / (i + 1)) };
    fieldGroup.add(ring);
  }

  fieldGroup.visible = showField;
}

function setupInteractionEvents(container) {
  const onPointerDown = (e) => {
    isDragging = true;
    prevPointer.x = e.clientX;
    prevPointer.y = e.clientY;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevPointer.x;
    const dy = e.clientY - prevPointer.y;
    prevPointer.x = e.clientX;
    prevPointer.y = e.clientY;

    targetRotation.y += dx * 0.008;
    targetRotation.x += dy * 0.008;
    // Clamp vertical tilt
    targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotation.x));
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  const onWheel = (e) => {
    e.preventDefault();
    targetCameraDistance += e.deltaY * 0.02;
    targetCameraDistance = Math.max(9, Math.min(32, targetCameraDistance));
  };

  container.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  container.addEventListener("wheel", onWheel, { passive: false });

  container._ionCleanups = [
    () => container.removeEventListener("pointerdown", onPointerDown),
    () => window.removeEventListener("pointermove", onPointerMove),
    () => window.removeEventListener("pointerup", onPointerUp),
    () => container.removeEventListener("wheel", onWheel),
  ];
}

function setupHudControls(ion) {
  const chargeNum = parseChargeNumber(ion.charge);
  const isCation = chargeNum > 0;
  const isPoly = Boolean(POLYATOMIC_STRUCTURES[ion.id]);
  const monatomic = MONATOMIC_SPECIES[ion.id];

  // Update HUD values
  const chargeBadge = document.getElementById("ion-hud-charge");
  const electronsBadge = document.getElementById("ion-hud-electrons");
  const radiusBadge = document.getElementById("ion-hud-radius");
  const watermark = document.getElementById("ion-modal-watermark");

  if (watermark) {
    watermark.textContent = ion.symbol + (ion.charge || "");
  }

  if (chargeBadge) {
    chargeBadge.textContent = `${ion.charge} ${isCation ? "Kation (+)" : "Anion (-)"}`;
    chargeBadge.className = `ion-hud-badge charge-badge ${isCation ? "cation" : "anion"}`;
  }

  if (electronsBadge) {
    if (isPoly) {
      electronsBadge.textContent = "Ko'p atomli molekulyar ion";
    } else if (monatomic) {
      const eCount = monatomic.shells.reduce((a, b) => a + b, 0);
      electronsBadge.textContent = `${eCount} e⁻ (${isCation ? "Yo'qotilgan" : "Birikkan"}: ${Math.abs(chargeNum)})`;
    }
  }

  if (radiusBadge) {
    if (isPoly) {
      radiusBadge.textContent = "Molekulyar karkas";
    } else if (monatomic) {
      radiusBadge.textContent = `Ion radiusi: ${monatomic.radius}`;
    }
  }

  // Bind Buttons
  const btnHydration = document.getElementById("ion-toggle-hydration");
  const btnField = document.getElementById("ion-toggle-field");
  const btnOrbitals = document.getElementById("ion-toggle-orbitals");
  const btnRotate = document.getElementById("ion-toggle-rotate");
  const btnReset = document.getElementById("ion-reset-view");

  if (btnHydration) {
    btnHydration.onclick = () => {
      showHydration = !showHydration;
      btnHydration.classList.toggle("active", showHydration);
      if (hydrationGroup) hydrationGroup.visible = showHydration;
    };
    btnHydration.classList.toggle("active", showHydration);
  }

  if (btnField) {
    btnField.onclick = () => {
      showField = !showField;
      btnField.classList.toggle("active", showField);
      if (fieldGroup) fieldGroup.visible = showField;
    };
    btnField.classList.toggle("active", showField);
  }

  if (btnOrbitals) {
    btnOrbitals.onclick = () => {
      showOrbitals = !showOrbitals;
      btnOrbitals.classList.toggle("active", showOrbitals);
      if (shellsGroup) shellsGroup.visible = showOrbitals;
    };
    btnOrbitals.classList.toggle("active", showOrbitals);
  }

  if (btnRotate) {
    btnRotate.onclick = () => {
      isRotating = !isRotating;
      btnRotate.classList.toggle("active", isRotating);
    };
    btnRotate.classList.toggle("active", isRotating);
  }

  if (btnReset) {
    btnReset.onclick = () => {
      targetRotation.x = 0.2;
      targetRotation.y = 0;
      targetCameraDistance = 18;
    };
  }
}

function updateFrame(THREE, dt, time) {
  if (!ionGroup) return;

  // Smooth rotation
  if (isRotating && !isDragging) {
    targetRotation.y += 0.008;
  }

  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
  cameraDistance += (targetCameraDistance - cameraDistance) * 0.1;

  ionGroup.rotation.x = currentRotation.x;
  ionGroup.rotation.y = currentRotation.y;
  camera.position.z = cameraDistance;

  // Animate electron orbits
  if (shellsGroup && showOrbitals) {
    shellsGroup.children.forEach((child) => {
      if (child.userData && child.userData.speed) {
        child.rotation.z += child.userData.speed * dt * 2.5;
      }
    });
  }

  // Animate electrostatic field
  if (fieldGroup && showField) {
    fieldGroup.children.forEach((child) => {
      if (child.userData && child.userData.rotSpeed) {
        child.rotation.z += child.userData.rotSpeed * dt;
      }
    });
  }

  // Animate hydration shell water wobbles
  if (hydrationGroup && showHydration) {
    const tSec = time * 0.002;
    hydrationGroup.children.forEach((water) => {
      if (water.userData && water.userData.basePos) {
        const p = water.userData.basePos;
        const phase = water.userData.phase;
        const wave = Math.sin(tSec + phase) * 0.35;
        water.position.copy(p).addScaledVector(p.clone().normalize(), wave);
      }
    });
  }
}

export function cleanupIon3D() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  if (containerEl?._ionCleanups) {
    containerEl._ionCleanups.forEach((fn) => fn());
    containerEl._ionCleanups = null;
  }

  if (renderer && containerEl) {
    if (renderer.domElement && renderer.domElement.parentElement === containerEl) {
      containerEl.removeChild(renderer.domElement);
    }
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;
  ionGroup = null;
  containerEl = null;
}
