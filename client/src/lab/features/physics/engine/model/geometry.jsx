import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const TAU = Math.PI * 2;
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _m = new THREE.Matrix4();

// [radius, y, hard]: a hard point is doubled so the lathe keeps a crisp edge.
export const lathe = (pts, segments = 48) =>
  new THREE.LatheGeometry(
    pts.flatMap(([x, y, hard]) =>
      hard ? [new THREE.Vector2(x, y), new THREE.Vector2(x, y)] : [new THREE.Vector2(x, y)],
    ),
    segments,
  );

// Same profile revolved around the x axis ([radius, x, hard]).
export const latheX = (pts, segments = 48) => lathe(pts, segments).rotateZ(-Math.PI / 2);

export const nonIndexed = (g) => {
  const out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  return out;
};

// Flat-shaded copy (hex heads, prisms).
export const flat = (g) => {
  const out = nonIndexed(g);
  out.computeVertexNormals();
  return out;
};

export const merge = (geos) => {
  const parts = geos.map(nonIndexed);
  const out = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return out;
};

// toCreasedNormals hashes positions at 0.01 precision, so run it at 100x scale.
export const creased = (g, angle = Math.PI / 5) => {
  g.scale(100, 100, 100);
  const out = toCreasedNormals(g, angle);
  out.scale(0.01, 0.01, 0.01);
  g.dispose();
  return out;
};

const extrudeShape = (shape, depth, bevel, curveSegments) => {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-3, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: bevel > 0 ? 2 : 0,
    curveSegments,
  });
  g.translate(0, 0, bevel);
  return g;
};

// Shape drawn in (x, -z), extruded upward from y0 to y1.
export const slabY = (shape, y0, y1, bevel = 0, curveSegments = 8) =>
  creased(extrudeShape(shape, y1 - y0, bevel, curveSegments).rotateX(-Math.PI / 2).translate(0, y0, 0));

// Shape drawn in (-z, y), extruded along x from x0 to x1.
export const slabX = (shape, x0, x1, bevel = 0, curveSegments = 8) =>
  creased(extrudeShape(shape, x1 - x0, bevel, curveSegments).rotateY(Math.PI / 2).translate(x0, 0, 0));

// Shape drawn in (x, y), extruded along z from z0 to z1.
export const slabZ = (shape, z0, z1, bevel = 0, curveSegments = 8) =>
  creased(extrudeShape(shape, z1 - z0, bevel, curveSegments).translate(0, 0, z0));

export const rrect = (w, h, r, cx = 0, cy = 0) => {
  const s = new THREE.Shape();
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
};

export const circleShape = (r, cx = 0, cy = 0) => {
  const s = new THREE.Shape();
  s.absarc(cx, cy, r, 0, TAU, false);
  return s;
};

export const circleHole = (r, cx = 0, cy = 0) => {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, TAU, true);
  return p;
};

export const polygon = (pts) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};

export const withHoles = (shape, holes) => {
  shape.holes.push(...holes);
  return shape;
};

// Sprocket / ring gear outline in the (-z, y) plane, pitch radius r.
export const toothedShape = (r, teeth, depth, holeR = 0) => {
  const pts = [];
  const w = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * w;
    for (const [rr, f] of [
      [r - depth, 0],
      [r - depth, 0.3],
      [r + depth * 0.5, 0.42],
      [r + depth * 0.5, 0.58],
      [r - depth, 0.7],
    ]) {
      const a = a0 + f * w;
      pts.push([-rr * Math.sin(a), rr * Math.cos(a)]);
    }
  }
  const s = polygon(pts);
  if (holeR > 0) s.holes.push(circleHole(holeR));
  return s;
};

// Hex head on a washer, +y up from the origin.
export const hexBolt = (r = 0.045, h = 0.045, washer = 0.012) =>
  merge([
    flat(new THREE.CylinderGeometry(r, r, h, 6).translate(0, washer + h / 2, 0)),
    lathe(
      [
        [0, 0],
        [r * 1.35, 0, true],
        [r * 1.35, washer, true],
        [0, washer],
      ],
      24,
    ),
  ]);

export const tube = (points, radius, segments = 40, radial = 10, closed = false) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, "catmullrom", 0.5),
    segments,
    radius,
    radial,
    closed,
  );

export const matrixAt = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(s, s, s),
  );

// Allocation-free matrix write for frame loops.
export const setInstance = (mesh, i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
  _pos.set(x, y, z);
  _quat.setFromEuler(_euler.set(rx, ry, rz));
  _scale.set(sx, sy, sz);
  mesh.setMatrixAt(i, _m.compose(_pos, _quat, _scale));
};

export const useGeometries = (build, deps = []) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geos = useMemo(build, deps);
  useEffect(() => () => Object.values(geos).forEach((g) => g?.dispose?.()), [geos]);
  return geos;
};

export const Instances = ({ geometry, material, matrices, ...rest }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [geometry, material, matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} {...rest} />;
};
