import { Suspense, memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Text } from "@react-three/drei";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import * as THREE from "three";
import { GEOM } from "../engineMath";
import { PARTS } from "../engineParts";
import { ENGINE_FONT } from "./engineFont";
import Block from "./parts/Block";
import HeadGasket from "./parts/HeadGasket";
import Head from "./parts/Head";
import CamCover from "./parts/CamCover";
import Crankcase from "./parts/Crankcase";
import Camshafts from "./parts/Camshafts";
import Valves from "./parts/Valves";
import SparkPlugs from "./parts/SparkPlugs";
import Pistons from "./parts/Pistons";
import PistonPins from "./parts/PistonPins";
import ConnectingRods from "./parts/ConnectingRods";
import Crankshaft from "./parts/Crankshaft";
import Flywheel from "./parts/Flywheel";
import Pulley from "./parts/Pulley";
import TimingChain from "./parts/TimingChain";
import IntakeManifold from "./parts/IntakeManifold";
import ExhaustManifold from "./parts/ExhaustManifold";
import CombustionGas from "./parts/CombustionGas";
import GasFlow from "./parts/GasFlow";

const COMPONENTS = {
  block: Block,
  headGasket: HeadGasket,
  head: Head,
  camCover: CamCover,
  crankcase: Crankcase,
  camshafts: Camshafts,
  valveIntake: Valves,
  valveExhaust: Valves,
  sparkPlug: SparkPlugs,
  piston: Pistons,
  pin: PistonPins,
  rod: ConnectingRods,
  crankshaft: Crankshaft,
  flywheel: Flywheel,
  pulley: Pulley,
  timing: TimingChain,
  intake: IntakeManifold,
  exhaust: ExhaustManifold,
};

const EXTRA_PROPS = {
  valveIntake: { which: "intake" },
  valveExhaust: { which: "exhaust" },
};

// Pedestal top meets the oil pan (floorY + 0.005).
const STAGE_Y = GEOM.floorY + 0.005;
// Sink the stage while exploding so the pan (explode y -2.9) never pierces it.
const STAGE_DROP = 3.3;
const STAGE_RADIUS = 3.6;
// Exploded engine is ~2.5x taller; shrink and lower it so the default camera still frames it.
const EXPLODE_SCALE = 0.44;
const EXPLODE_SHIFT_Y = 0.55;
const LABEL_OFFSET = 0.07;
// drei re-arms `frames` on every render, so the shadow refreshes only while the explode animation settles.
const SHADOW_FRAMES = 150;
const DOT_GEOMETRY = new THREE.SphereGeometry(0.028, 16, 12);

const noRaycast = () => {};

const setCursor = (value) => {
  document.body.style.cursor = value;
};

const StageShadow = memo(function StageShadow() {
  return (
    <ContactShadows
      position={[0, 0.004, 0]}
      opacity={0.6}
      blur={2.5}
      resolution={512}
      far={4}
      scale={8}
      frames={SHADOW_FRAMES}
      color="#04060c"
    />
  );
});

const Stage = ({ stageRef, mode, shadow }) => {
  const pedestal = useMemo(() => {
    const pts = [
      [0, -0.16],
      [STAGE_RADIUS - 0.12, -0.16],
      [STAGE_RADIUS - 0.12, -0.16],
      [STAGE_RADIUS, -0.08],
      [STAGE_RADIUS, -0.03],
      [STAGE_RADIUS - 0.03, 0],
      [STAGE_RADIUS - 0.03, 0],
      [0, 0],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 128);
  }, []);
  useEffect(() => () => pedestal.dispose(), [pedestal]);

  return (
    <group ref={stageRef} position={[0, STAGE_Y, 0]}>
      <mesh geometry={pedestal}>
        <meshStandardMaterial color="#161c2c" roughness={0.82} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[STAGE_RADIUS - 0.012, 0.011, 8, 180]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      {/* ContactShadows' own render pass breaks the WebXR framebuffer, so it is off in a headset. */}
      {shadow && <StageShadow refreshKey={mode} />}
    </group>
  );
};

const EngineModel = ({ simRef, mode, selectedId, onSelectPart, inVR = false }) => {
  const amount = useRef(0);
  const wrapperRefs = useRef({});
  const labelRefs = useRef({});
  const textRefs = useRef({});
  const dotRefs = useRef({});
  const stageRef = useRef(null);
  const fitRef = useRef(null);
  const initialMode = useRef(mode);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => () => setCursor("auto"), []);

  // X-ray: shells stop catching rays so the parts behind the glass stay clickable.
  useEffect(() => {
    const xray = mode === "xray";
    for (const part of PARTS) {
      if (!part.shell) continue;
      wrapperRefs.current[part.id]?.traverse((o) => {
        if (xray && !o.userData.savedRaycast) {
          o.userData.savedRaycast = o.raycast;
          o.raycast = noRaycast;
          // XR grab/touch pointers ignore raycast() and only honour pointerEvents.
          o.pointerEvents = "none";
        } else if (!xray && o.userData.savedRaycast) {
          o.raycast = o.userData.savedRaycast;
          delete o.userData.savedRaycast;
          delete o.pointerEvents;
        }
      });
    }
  }, [mode]);

  // Hover raycasts hit ~250k render triangles every pointer move (and every XR frame) without a BVH.
  useEffect(() => {
    const build = () => {
      for (const part of PARTS) {
        wrapperRefs.current[part.id]?.traverse((o) => {
          if (!o.isMesh || o.isInstancedMesh || !o.geometry?.attributes.position) return;
          const saved = o.userData.savedRaycast;
          if ((saved ?? o.raycast) !== THREE.Mesh.prototype.raycast) return;
          if (!o.geometry.boundsTree) o.geometry.boundsTree = new MeshBVH(o.geometry, { indirect: true });
          if (saved) o.userData.savedRaycast = acceleratedRaycast;
          else o.raycast = acceleratedRaycast;
        });
      }
    };
    const ric = window.requestIdleCallback;
    const id = ric ? ric(build, { timeout: 2000 }) : setTimeout(build, 300);
    return () => (ric ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  // Compile the x-ray shader variants up front so the first "Rentgen"/"Ishga tushirish" click doesn't hitch.
  useEffect(() => {
    if (initialMode.current === "xray") return;
    const id = setTimeout(() => {
      if (gl.xr.isPresenting) return;
      const saved = new Map();
      for (const part of PARTS) {
        if (!part.shell) continue;
        wrapperRefs.current[part.id]?.traverse((o) => {
          const m = o.material;
          if (!o.isMesh || !m?.isMeshStandardMaterial || saved.has(m)) return;
          saved.set(m, { transparent: m.transparent, side: m.side, forceSinglePass: m.forceSinglePass });
          m.transparent = true;
          m.side = THREE.DoubleSide;
          m.forceSinglePass = true;
          m.needsUpdate = true;
        });
      }
      gl.compile(scene, camera);
      saved.forEach((state, m) => {
        Object.assign(m, state);
        m.needsUpdate = true;
      });
    }, 250);
    return () => clearTimeout(id);
  }, [gl, scene, camera]);

  useFrame((_, delta) => {
    const target = mode === "explode" ? 1 : 0;
    let a = THREE.MathUtils.damp(amount.current, target, 5, delta);
    if (Math.abs(a - target) < 1e-4) a = target;
    amount.current = a;

    const fade = THREE.MathUtils.clamp((a - 0.05) / 0.45, 0, 1);
    const fit = 1 - EXPLODE_SCALE * a;
    const shift = EXPLODE_SHIFT_Y * a;
    if (fitRef.current) {
      fitRef.current.scale.setScalar(fit);
      fitRef.current.position.y = shift;
    }
    for (const part of PARTS) {
      const [ex, ey, ez] = part.explode;
      const wrapper = wrapperRefs.current[part.id];
      if (wrapper) wrapper.position.set(ex * a, ey * a, ez * a);

      const label = labelRefs.current[part.id];
      if (!label) continue;
      const opacity = part.id === selectedId ? 1 : fade;
      label.visible = opacity > 0;
      if (!label.visible) continue;
      const [ax, ay, az] = part.anchor;
      label.position.set((ax + ex * a) * fit, (ay + ey * a) * fit + shift, (az + ez * a) * fit);
      const text = textRefs.current[part.id];
      if (text) {
        text.fillOpacity = opacity;
        text.outlineOpacity = opacity;
      }
      const dot = dotRefs.current[part.id];
      if (dot) dot.material.opacity = opacity;
    }

    if (stageRef.current) stageRef.current.position.y = STAGE_Y - STAGE_DROP * a;
  });

  const handleOver = (e) => {
    e.stopPropagation();
    setCursor("pointer");
  };
  const handleOut = () => setCursor("auto");

  return (
    <group>
      <group ref={fitRef}>
        {PARTS.map((part) => {
          const Part = COMPONENTS[part.id];
          if (!Part) return null;
          return (
            <group
              key={part.id}
              ref={(g) => {
                wrapperRefs.current[part.id] = g;
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPart?.(part.id);
              }}
              onPointerOver={handleOver}
              onPointerOut={handleOut}
            >
              <Part
                simRef={simRef}
                mode={mode}
                selected={selectedId === part.id}
                {...EXTRA_PROPS[part.id]}
              />
            </group>
          );
        })}

        <CombustionGas simRef={simRef} active={mode === "xray"} />
        {mode === "xray" && <GasFlow simRef={simRef} />}
      </group>

      <Suspense fallback={null}>
        {PARTS.map((part) => {
          const leftSide = part.anchor[0] < -0.2;
          return (
            <group
              key={part.id}
              ref={(g) => {
                labelRefs.current[part.id] = g;
              }}
              position={part.anchor}
              visible={false}
            >
              <Billboard>
                <mesh
                  ref={(m) => {
                    dotRefs.current[part.id] = m;
                  }}
                  geometry={DOT_GEOMETRY}
                  renderOrder={30}
                >
                  <meshBasicMaterial
                    color="#c4b5fd"
                    transparent
                    opacity={0}
                    depthTest={false}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
                <Text
                  ref={(t) => {
                    textRefs.current[part.id] = t;
                  }}
                  font={ENGINE_FONT}
                  position={[leftSide ? -LABEL_OFFSET : LABEL_OFFSET, LABEL_OFFSET, 0]}
                  fontSize={0.13}
                  anchorX={leftSide ? "right" : "left"}
                  anchorY="bottom"
                  color="#ffffff"
                  outlineWidth={0.012}
                  outlineColor="#0b0f1a"
                  fillOpacity={0}
                  outlineOpacity={0}
                  renderOrder={31}
                >
                  <meshBasicMaterial
                    attach="material"
                    side={THREE.DoubleSide}
                    transparent
                    depthTest={false}
                    depthWrite={false}
                    toneMapped={false}
                  />
                  {part.label}
                </Text>
              </Billboard>
            </group>
          );
        })}
      </Suspense>

      <Stage stageRef={stageRef} mode={mode} shadow={!inVR} />
    </group>
  );
};

export default EngineModel;
