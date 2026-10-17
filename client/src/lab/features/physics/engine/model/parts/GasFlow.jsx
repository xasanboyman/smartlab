import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CYCLE,
  CYLINDERS,
  EXHAUST_PIPE_RADIUS,
  GAS_COLORS,
  GEOM,
  INTAKE_PIPE_RADIUS,
  cylinderTheta,
  exhaustPrimaryPoints,
  intakeRunnerPoints,
  valveLift,
} from "../../engineMath";

const COUNT = 20;
const RADIUS = 0.032;
const LUT_SIZE = 160;
const HIDE_AFTER = 0.6;
const GOLDEN = 2.399963;
const _m = new THREE.Matrix4();
const noRaycast = () => null;

const frac = (x) => x - Math.floor(x);

const STREAMS = [
  { which: "intake", points: intakeRunnerPoints, pipe: INTAKE_PIPE_RADIUS, color: GAS_COLORS.mixture, speed: 1.6, seed: 0.13 },
  { which: "exhaust", points: exhaustPrimaryPoints, pipe: EXHAUST_PIPE_RADIUS, color: GAS_COLORS.exhaust, speed: 2.4, seed: 0.57 },
];

// Arc-length table per cylinder so the frame loop never touches the curve API (which allocates).
const buildTrack = (stream, x) => {
  const curve = new THREE.CatmullRomCurve3(stream.points(x).map((p) => new THREE.Vector3(...p)));
  const pts = curve.getSpacedPoints(LUT_SIZE - 1);
  const pos = new Float32Array(LUT_SIZE * 3);
  const nrm = new Float32Array(LUT_SIZE * 2);
  for (let i = 0; i < LUT_SIZE; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(LUT_SIZE - 1, i + 1)];
    const ty = b.y - a.y;
    const tz = b.z - a.z;
    const tl = Math.hypot(ty, tz) || 1;
    pos.set([pts[i].x, pts[i].y, pts[i].z], i * 3);
    nrm.set([-tz / tl, ty / tl], i * 2);
  }
  const offsets = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const r = Math.sqrt(frac(i * 0.618034 + stream.seed)) * stream.pipe * 0.6;
    const a = i * GOLDEN;
    offsets[i * 4] = r * Math.cos(a);
    offsets[i * 4 + 1] = r * Math.sin(a);
    offsets[i * 4 + 2] = (frac(i * 0.754878 + stream.seed) - 0.5) * (0.7 / COUNT);
    offsets[i * 4 + 3] = 0.75 + 0.5 * frac(i * 0.319 + stream.seed);
  }
  return { pos, nrm, offsets, length: curve.getLength() };
};

const Stream = ({ simRef, stream }) => {
  const meshRef = useRef(null);
  const last = useRef(null);
  const states = useRef(CYLINDERS.map(() => ({ phase: 0, closedFor: 99, vis: 0 })));

  const assets = useMemo(() => {
    const tracks = CYLINDERS.map(({ x }) => buildTrack(stream, x));
    const geometry = new THREE.SphereGeometry(RADIUS, 10, 7);
    const material = new THREE.MeshStandardMaterial({
      color: stream.color,
      emissive: stream.color,
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0,
    });
    return { tracks, geometry, material };
  }, [stream]);
  useEffect(
    () => () => {
      assets.geometry.dispose();
      assets.material.dispose();
    },
    [assets],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const theta = simRef.current.theta;
    let d = last.current == null ? 0 : theta - last.current;
    if (d > CYCLE / 2) d -= CYCLE;
    else if (d < -CYCLE / 2) d += CYCLE;
    last.current = theta;
    const ease = Math.min(1, delta * 5);
    let any = false;

    for (let c = 0; c < CYLINDERS.length; c++) {
      const s = states.current[c];
      const track = assets.tracks[c];
      const open = valveLift(cylinderTheta(theta, c), stream.which) / GEOM.valveMaxLift;
      if (open > 0) s.closedFor = 0;
      else s.closedFor += Math.abs(d);
      s.phase = frac(s.phase + (stream.speed * open * d) / track.length);
      const target = s.closedFor < HIDE_AFTER ? 1 : 0;
      s.vis += (target - s.vis) * ease;
      const hidden = s.vis < 0.002 && target === 0;
      if (!hidden) any = true;

      const { pos, nrm, offsets } = track;
      for (let i = 0; i < COUNT; i++) {
        const idx = c * COUNT + i;
        if (hidden) {
          _m.makeScale(0, 0, 0);
          mesh.setMatrixAt(idx, _m);
          continue;
        }
        const u = frac(i / COUNT + s.phase + offsets[i * 4 + 2]);
        const f = u * (LUT_SIZE - 1);
        const j = Math.min(LUT_SIZE - 2, Math.floor(f));
        const t = f - j;
        const px = pos[j * 3] + (pos[j * 3 + 3] - pos[j * 3]) * t;
        const py = pos[j * 3 + 1] + (pos[j * 3 + 4] - pos[j * 3 + 1]) * t;
        const pz = pos[j * 3 + 2] + (pos[j * 3 + 5] - pos[j * 3 + 2]) * t;
        const ny = nrm[j * 2];
        const nz = nrm[j * 2 + 1];
        const a = offsets[i * 4];
        const b = offsets[i * 4 + 1];
        const ends = Math.min(1, u / 0.06, (1 - u) / 0.06);
        const scale = s.vis * ends * offsets[i * 4 + 3];
        _m.makeScale(scale, scale, scale).setPosition(px + b, py + ny * a, pz + nz * a);
        mesh.setMatrixAt(idx, _m);
      }
    }
    mesh.visible = any;
    if (any) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[assets.geometry, assets.material, COUNT * CYLINDERS.length]}
      frustumCulled={false}
      raycast={noRaycast}
      visible={false}
    />
  );
};

const GasFlow = ({ simRef }) => (
  <group>
    {STREAMS.map((stream) => (
      <Stream key={stream.which} simRef={simRef} stream={stream} />
    ))}
  </group>
);

export default GasFlow;
