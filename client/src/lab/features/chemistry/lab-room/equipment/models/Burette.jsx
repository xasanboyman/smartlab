import { useMemo } from "react";
import {
  CylinderGeometry,
  MeshStandardMaterial,
  CanvasTexture,
  SRGBColorSpace,
} from "three";
import { useKit } from "../kit/kitContext";
import GlassVessel from "../kit/GlassVessel";
import Contents from "../kit/Contents";
import BlobShadow from "../kit/BlobShadow";
import { arc, buildPrintBand, buildVessel, heightForVolume, radiusAt } from "../kit/vessel";
import { createGraduationTexture } from "../kit/printTextures";

// 50 ml Class AS analytical burette: Ø14 mm outer, Ø11 mm bore, 550 mm total length.
const RADIUS = 0.007;
const HEIGHT = 0.52;
const WALL = 0.0015;
const BOTTOM = 0.003;
const PRINT_RADIUS = RADIUS + 0.0001;
const PRINT_Y = [0.06, HEIGHT - 0.02];

const OUTLINE = [
  [0, 0],
  [0.002, 0.02],
  [0.004, 0.05],
  [RADIUS, 0.07],
  [RADIUS, HEIGHT - 0.01],
  [RADIUS + 0.003, HEIGHT],
];

let assets = null;
const getAssets = () => {
  if (assets) return assets;
  const vessel = buildVessel({
    outline: OUTLINE,
    wall: WALL,
    bottom: BOTTOM,
    segments: 48,
  });
  const level = (ml) => heightForVolume(vessel.innerProfile, ml);
  const createTexture = () =>
    createGraduationTexture({
      circumference: Math.PI * 2 * PRINT_RADIUS,
      y0: PRINT_Y[0],
      y1: PRINT_Y[1],
      marks: Array.from({ length: 11 }, (_, i) => {
        const ml = i * 5;
        return {
          y: level(ml),
          major: i % 2 === 0,
          label: i % 2 === 0 ? String(50 - ml) : null,
        };
      }),
      texts: [
        { value: "50:0.1 ml", x: 0, y: level(50) + 0.008, size: 0.004, weight: 700 },
        { value: "Ex +20°C", x: 0, y: level(50) + 0.004, size: 0.0026, weight: 600 },
      ],
      patches: [],
    });
  const mouth = {
    innerProfile: vessel.innerProfile,
    capacityMl: 55,
    mouthY: vessel.rimY,
    mouthR: radiusAt(vessel.innerProfile, vessel.rimY),
  };
  const printGeometry = buildPrintBand(PRINT_RADIUS, ...PRINT_Y, 64);
  assets = { vessel, mouth, createTexture, printGeometry };
  return assets;
};

const stopcockMaterial = new MeshStandardMaterial({
  color: "#0d9488",
  roughness: 0.35,
  metalness: 0.1,
});

const Burette = ({ simId, volumeMl = 0, liquidColor, liquidOpacity, cracked = false, ...props }) => {
  const kit = useKit();
  const { vessel, mouth, createTexture, printGeometry } = useMemo(() => getAssets(), []);
  const print = useMemo(() => ({
    geometry: printGeometry,
    material: kit.print("burette-50", createTexture),
  }), [kit, createTexture, printGeometry]);

  return (
    <group {...props}>
      <GlassVessel cracked={cracked} vessel={vessel} print={print}>
        <Contents
          simId={simId}
          vessel={mouth}
          fallback={{ volumeMl, color: liquidColor, opacity: liquidOpacity }}
        />
      </GlassVessel>
      <BlobShadow radius={0.03} opacity={0.25} />
      {/* Teflon Stopcock Valve at the lower neck (y = 0.04) */}
      <group position={[0, 0.04, 0]}>
        <mesh rotation-z={Math.PI / 2} material={stopcockMaterial}>
          <cylinderGeometry args={[0.0045, 0.004, 0.024, 24]} />
        </mesh>
        <mesh position={[0.014, 0, 0]} material={stopcockMaterial}>
          <boxGeometry args={[0.005, 0.016, 0.008]} />
        </mesh>
      </group>
    </group>
  );
};

export default Burette;
