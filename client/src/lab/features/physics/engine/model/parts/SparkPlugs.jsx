import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GEOM, cylinderTheta, sparkIntensity } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { Instances, creased, lathe, matrixAt, merge, useGeometries } from "../geometry";

const SHELL = PART_BY_ID.sparkPlug.shell;
const BASE = GEOM.sparkPlugBaseY;
const TOP = GEOM.sparkPlugTopY;
const THREAD_Y0 = BASE + 0.04;
const THREAD_Y1 = BASE + 0.34;
const HEX_Y0 = GEOM.coverTopY + 0.03;
const HEX_H = 0.11;
const INSULATOR_Y1 = TOP - 0.12;
const SPARK_Y = BASE + 0.018;
const PLUG_MATRICES = CYLINDERS.map(({ x }) => matrixAt(x, 0, 0));
const noRaycast = () => null;

const buildShell = () => {
  const pts = [
    [0.03, THREAD_Y0],
    [0.05, THREAD_Y0, true],
  ];
  const pitch = 0.02;
  const turns = Math.floor((THREAD_Y1 - THREAD_Y0 - 0.02) / pitch);
  for (let i = 0; i < turns; i++) {
    const y = THREAD_Y0 + 0.01 + i * pitch;
    pts.push([0.05, y, true], [0.059, y + pitch * 0.45, true], [0.059, y + pitch * 0.55, true]);
  }
  pts.push(
    [0.05, THREAD_Y0 + 0.01 + turns * pitch, true],
    [0.05, THREAD_Y1, true],
    [0.058, THREAD_Y1, true],
    [0.058, HEX_Y0, true],
    [0.045, HEX_Y0],
  );
  const shell = lathe(pts, 32);
  const crimp = lathe(
    [
      [0.05, HEX_Y0 + HEX_H - 0.01],
      [0.072, HEX_Y0 + HEX_H - 0.01, true],
      [0.072, HEX_Y0 + HEX_H + 0.025, true],
      [0.062, HEX_Y0 + HEX_H + 0.055, true],
      [0.057, HEX_Y0 + HEX_H + 0.055],
    ],
    32,
  );
  const center = lathe(
    [
      [0, BASE + 0.024],
      [0.007, BASE + 0.025, true],
      [0.009, BASE + 0.06],
    ],
    12,
  );
  const strapV = new THREE.BoxGeometry(0.014, THREAD_Y0 - BASE + 0.012, 0.028).translate(0.042, (BASE + THREAD_Y0 + 0.012) / 2, 0);
  const strapH = new THREE.BoxGeometry(0.058, 0.013, 0.028).translate(0.02, BASE + 0.0065, 0);
  const terminal = lathe(
    [
      [0.016, INSULATOR_Y1 - 0.01],
      [0.016, TOP - 0.09, true],
      [0.034, TOP - 0.088, true],
      [0.034, TOP - 0.028],
      [0.03, TOP - 0.012],
      [0.018, TOP - 0.002],
      [0, TOP],
    ],
    24,
  );
  return merge([shell, crimp, center, strapV, strapH, terminal]);
};

const buildHex = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    if (i === 0) s.moveTo(0.09 * Math.cos(a), 0.09 * Math.sin(a));
    else s.lineTo(0.09 * Math.cos(a), 0.09 * Math.sin(a));
  }
  const bevel = 0.008;
  const g = new THREE.ExtrudeGeometry(s, {
    depth: HEX_H - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 1,
  });
  return creased(g.rotateX(-Math.PI / 2).translate(0, HEX_Y0 + bevel, 0), Math.PI / 6);
};

const buildCeramic = () => {
  const y0 = HEX_Y0 + HEX_H + 0.03;
  const pts = [
    [0.02, BASE + 0.03],
    [0.03, BASE + 0.1],
    [0.036, THREAD_Y1],
    [0.052, y0, true],
    [0.057, y0 + 0.01, true],
    [0.057, y0 + 0.05],
  ];
  const ribs = 4;
  const ribY0 = y0 + 0.06;
  const ribStep = 0.05;
  for (let i = 0; i < ribs; i++) {
    const y = ribY0 + i * ribStep;
    pts.push([0.05, y], [0.062, y + 0.012], [0.062, y + 0.03], [0.05, y + 0.042]);
  }
  pts.push([0.046, INSULATOR_Y1 - 0.03], [0.03, INSULATOR_Y1, true], [0.016, INSULATOR_Y1]);
  return lathe(pts, 36);
};

const SparkPlugs = ({ simRef, mode, selected }) => {
  const coreRefs = useRef([]);
  const haloRefs = useRef([]);
  const steelMat = usePartMaterial("steel", { mode, shell: SHELL, selected });
  const hexMat = usePartMaterial("darkSteel", { mode, shell: SHELL, selected });
  const ceramicMat = usePartMaterial("ceramic", { mode, shell: SHELL, selected });
  const geo = useGeometries(() => ({ shell: buildShell(), hex: buildHex(), ceramic: buildCeramic() }));

  const fx = useMemo(
    () => ({
      core: new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      halo: new THREE.MeshBasicMaterial({
        color: "#7dd3fc",
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      sphere: new THREE.SphereGeometry(1, 16, 12),
    }),
    [],
  );
  useEffect(() => () => Object.values(fx).forEach((o) => o.dispose()), [fx]);

  useFrame(() => {
    const theta = simRef.current.theta;
    for (let i = 0; i < CYLINDERS.length; i++) {
      const k = sparkIntensity(cylinderTheta(theta, i));
      const core = coreRefs.current[i];
      const halo = haloRefs.current[i];
      if (!core || !halo) continue;
      const on = k > 0.01;
      core.visible = on;
      halo.visible = on;
      if (!on) continue;
      core.scale.setScalar(0.012 + 0.03 * k);
      halo.scale.setScalar(0.03 + 0.11 * k);
      halo.material.opacity = 0.6 * k;
    }
  });

  return (
    <group>
      <Instances geometry={geo.shell} material={steelMat} matrices={PLUG_MATRICES} />
      <Instances geometry={geo.hex} material={hexMat} matrices={PLUG_MATRICES} />
      <Instances geometry={geo.ceramic} material={ceramicMat} matrices={PLUG_MATRICES} />
      {CYLINDERS.map(({ x, index }) => (
        <group key={index} position={[x, SPARK_Y, 0]}>
          <mesh
            ref={(m) => {
              coreRefs.current[index] = m;
            }}
            geometry={fx.sphere}
            material={fx.core}
            raycast={noRaycast}
            visible={false}
            renderOrder={5}
          />
          <mesh
            ref={(m) => {
              haloRefs.current[index] = m;
            }}
            geometry={fx.sphere}
            material={fx.halo}
            raycast={noRaycast}
            visible={false}
            renderOrder={5}
          />
        </group>
      ))}
    </group>
  );
};

export default SparkPlugs;
