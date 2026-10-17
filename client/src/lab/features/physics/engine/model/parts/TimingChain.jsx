import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYCLE, GEOM, TAU, VALVES, camRotationX, crankRotationX } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { circleHole, latheX, merge, polygon, setInstance, slabX, toothedShape, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.timing.shell;
const X = GEOM.chainX;
const R1 = GEOM.crankSprocketRadius;
const R2 = GEOM.camSprocketRadius;
const CRANK_TEETH = 20;
const CAM_TEETH = 40;
const PITCH = (TAU * R1) / CRANK_TEETH;
const HALF_W = 0.05;
const LUT_SIZE = 600;
const MARK_COLOR = "#fde047";
const noRaycast = () => null;

// Sprocket centres in the (y, z) plane, in the order the chain wraps them (+y toward +z).
const SPROCKETS = [
  { y: 0, z: 0, r: R1 },
  { y: VALVES.intake.camCenter.y, z: VALVES.intake.camCenter.z, r: R2 },
  { y: VALVES.exhaust.camCenter.y, z: VALVES.exhaust.camCenter.z, r: R2 },
];

// Closed loop around the three sprockets as a uniform arc-length table of (y, z, ty, tz).
const buildLoop = () => {
  const n = SPROCKETS.length;
  const depart = [];
  const arrive = [];
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = SPROCKETS[i];
    const b = SPROCKETS[(i + 1) % n];
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const d = Math.hypot(dy, dz);
    const psi = Math.atan2(dz, dy) - Math.acos((a.r - b.r) / d);
    depart[i] = psi;
    arrive[(i + 1) % n] = psi;
    lines[i] = [
      [a.y + a.r * Math.cos(psi), a.z + a.r * Math.sin(psi)],
      [b.y + b.r * Math.cos(psi), b.z + b.r * Math.sin(psi)],
    ];
  }
  const dense = [];
  for (let i = 0; i < n; i++) {
    const s = SPROCKETS[i];
    let a0 = arrive[i];
    let a1 = depart[i];
    while (a1 < a0) a1 += TAU;
    const steps = Math.max(2, Math.ceil(((a1 - a0) * s.r) / 0.01));
    for (let k = 0; k < steps; k++) {
      const a = a0 + ((a1 - a0) * k) / steps;
      dense.push([s.y + s.r * Math.cos(a), s.z + s.r * Math.sin(a)]);
    }
    const [p, q] = lines[i];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const lsteps = Math.max(2, Math.ceil(len / 0.01));
    for (let k = 0; k < lsteps; k++) {
      const t = k / lsteps;
      dense.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const length = cum[dense.length];
  const lut = new Float32Array(LUT_SIZE * 4);
  let j = 0;
  for (let i = 0; i < LUT_SIZE; i++) {
    const s = (i / LUT_SIZE) * length;
    while (j < dense.length - 1 && cum[j + 1] < s) j++;
    const a = dense[j];
    const b = dense[(j + 1) % dense.length];
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (s - cum[j]) / seg;
    const ty = (b[0] - a[0]) / seg;
    const tz = (b[1] - a[1]) / seg;
    lut.set([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, ty, tz], i * 4);
  }
  return { lut, length, lines };
};

const sampleLoop = (loop, s, out) => {
  const f = ((((s / loop.length) % 1) + 1) % 1) * LUT_SIZE;
  const i = Math.floor(f) % LUT_SIZE;
  const k = (i + 1) % LUT_SIZE;
  const t = f - Math.floor(f);
  const { lut } = loop;
  out[0] = lut[i * 4] + (lut[k * 4] - lut[i * 4]) * t;
  out[1] = lut[i * 4 + 1] + (lut[k * 4 + 1] - lut[i * 4 + 1]) * t;
  out[2] = lut[i * 4 + 2];
  out[3] = lut[i * 4 + 3];
  return out;
};

const buildSprockets = () => {
  const crank = merge([
    slabX(toothedShape(R1, CRANK_TEETH, 0.022, 0.1), X - HALF_W, X + HALF_W, 0.004, 2),
    latheX([[0.1, X - 0.08], [0.13, X - 0.08, true], [0.13, X + 0.08, true], [0.1, X + 0.08, true]], 24),
  ]);
  const camShape = toothedShape(R2, CAM_TEETH, 0.022, 0.09);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + Math.PI / 5;
    camShape.holes.push(circleHole(0.055, -0.2 * Math.sin(a), 0.2 * Math.cos(a)));
  }
  const cam = merge([
    slabX(camShape, X - HALF_W, X + HALF_W, 0.004, 2),
    latheX([[0.065, X - 0.08], [0.12, X - 0.08, true], [0.12, X + 0.08, true], [0.065, X + 0.08, true]], 24),
  ]);
  // Timing marks: on the cam sprocket at the lobe nose, on the crank sprocket at TDC.
  const wedge = (a) =>
    slabX(
      polygon([
        [-(R2 - 0.07) * Math.sin(a - 0.07), (R2 - 0.07) * Math.cos(a - 0.07)],
        [-(R2 - 0.07) * Math.sin(a + 0.07), (R2 - 0.07) * Math.cos(a + 0.07)],
        [-(R2 + 0.0) * Math.sin(a), (R2 + 0.0) * Math.cos(a)],
      ]),
      X + HALF_W,
      X + HALF_W + 0.006,
    );
  const crankMark = new THREE.BoxGeometry(0.008, 0.05, 0.03).translate(X + HALF_W + 0.004, R1 - 0.05, 0);
  return {
    crank,
    cam,
    intakeMark: wedge(VALVES.intake.lobeAngle),
    exhaustMark: wedge(VALVES.exhaust.lobeAngle),
    crankMark,
    roller: new THREE.CylinderGeometry(0.02, 0.02, 0.062, 10).rotateZ(Math.PI / 2),
    plate: new THREE.BoxGeometry(0.008, PITCH + 0.022, 0.03),
  };
};

// Guide rails along the two straight runs, just outside the chain.
const buildGuides = (loop) => {
  const rails = loop.lines.map(([p, q], i) => {
    const dy = q[0] - p[0];
    const dz = q[1] - p[1];
    const len = Math.hypot(dy, dz);
    const ang = Math.atan2(dz, dy);
    // Outward normal of a +y→+z wrapped loop points to the right of the travel direction.
    const ny = dz / len;
    const nz = -dy / len;
    const cy = (p[0] + q[0]) / 2 + ny * 0.045;
    const cz = (p[1] + q[1]) / 2 + nz * 0.045;
    const g = new THREE.BoxGeometry(0.12, len - 0.5, 0.035).rotateX(ang).translate(X, cy, cz);
    return i === 1 ? null : g;
  });
  return merge(rails.filter(Boolean));
};

const TimingChain = ({ simRef, mode, selected }) => {
  const crankRef = useRef(null);
  const camRefs = useRef([]);
  const rollerRef = useRef(null);
  const plateRef = useRef(null);
  const unwrap = useRef({ last: null, angle: 0 });
  const steel = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const dark = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const plastic = usePartMaterial("plastic", { mode, shell: SHELL, selected });
  const markMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MARK_COLOR, emissive: MARK_COLOR, emissiveIntensity: 0.6, roughness: 0.4 }),
    [],
  );
  useEffect(() => () => markMat.dispose(), [markMat]);
  const loop = useMemo(buildLoop, []);
  const geo = useGeometries(() => ({ ...buildSprockets(), guides: buildGuides(loop) }), [loop]);
  const links = Math.round(loop.length / PITCH);
  const spacing = loop.length / links;
  const sample = useRef(new Float32Array(4)).current;

  useFrame(() => {
    const rollers = rollerRef.current;
    const plates = plateRef.current;
    const theta = simRef.current.theta;
    if (crankRef.current) crankRef.current.rotation.x = crankRotationX(theta);
    for (const cam of camRefs.current) if (cam) cam.rotation.x = camRotationX(theta);
    if (!rollers || !plates) return;
    // Unwrapped crank angle keeps the chain continuous across the 4π wrap.
    const u = unwrap.current;
    if (u.last != null) {
      let d = theta - u.last;
      if (d < -CYCLE / 2) d += CYCLE;
      u.angle += d;
    }
    u.last = theta;
    const s0 = u.angle * R1;
    for (let i = 0; i < links; i++) {
      const s = s0 + i * spacing;
      sampleLoop(loop, s, sample);
      setInstance(rollers, i, X, sample[0], sample[1]);
      sampleLoop(loop, s + spacing / 2, sample);
      const ang = Math.atan2(sample[3], sample[2]);
      const dx = i % 2 ? 0.042 : 0.028;
      setInstance(plates, 2 * i, X + dx, sample[0], sample[1], ang);
      setInstance(plates, 2 * i + 1, X - dx, sample[0], sample[1], ang);
    }
    rollers.instanceMatrix.needsUpdate = true;
    plates.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <group ref={crankRef}>
        <mesh geometry={geo.crank} material={steel} castShadow />
        <mesh geometry={geo.crankMark} material={markMat} />
      </group>
      {["intake", "exhaust"].map((which, i) => {
        const c = VALVES[which].camCenter;
        return (
          <group
            key={which}
            ref={(g) => {
              camRefs.current[i] = g;
            }}
            position={[0, c.y, c.z]}
          >
            <mesh geometry={geo.cam} material={steel} castShadow />
            <mesh geometry={which === "intake" ? geo.intakeMark : geo.exhaustMark} material={markMat} />
          </group>
        );
      })}
      <instancedMesh ref={rollerRef} args={[geo.roller, steel, links]} frustumCulled={false} raycast={noRaycast} />
      <instancedMesh ref={plateRef} args={[geo.plate, dark, links * 2]} frustumCulled={false} raycast={noRaycast} />
      <mesh geometry={geo.guides} material={plastic} />
    </group>
  );
};

export default TimingChain;
