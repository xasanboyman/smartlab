import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Color, DoubleSide } from "three";
import { ROOM_ASSETS } from "../labRoomAssets";

const STROBE_HZ = 1.4;
const ALARM_RED = new Color("#ff2b1d");
const HOOD_WHITE = new Color("#fff4dd");
const OFF = new Color("#000000");

const nodesOf = (scene) => ({
  extinguisher: scene.getObjectByName("extinguisher") ?? null,
  alarmLight: scene.getObjectByName("alarm_light") ?? null,
  bell: scene.getObjectByName("alarm_bell") ?? null,
  hoodLight: scene.getObjectByName("fumehood_light") ?? null,
  hoodRocker: scene.getObjectByName("fumehood_switch")?.children?.[1] ?? null,
  ventRocker: scene.getObjectByName("ventilation_switch")?.children?.[1] ?? null,
  fumehoodSash: scene.getObjectByName("fumehood_sash") ?? null,
  glassSash: scene.getObjectByName("glass_fumehood_sash") ?? null,
});

const glow = (mesh, color, strength) => {
  if (!mesh?.material) return;
  mesh.material.emissive.copy(strength > 0 ? color : OFF);
  mesh.material.emissiveIntensity = strength;
};

const restore = (nodes) => {
  if (nodes.extinguisher) nodes.extinguisher.visible = true;
  glow(nodes.alarmLight, OFF, 0);
  glow(nodes.hoodLight, OFF, 0);
  if (nodes.bell) nodes.bell.rotation.z = 0;
  if (nodes.hoodRocker) nodes.hoodRocker.rotation.z = 0;
  if (nodes.ventRocker) nodes.ventRocker.rotation.z = 0;
  if (nodes.fumehoodSash) nodes.fumehoodSash.position.y = 1.3;
  if (nodes.glassSash) nodes.glassSash.position.y = 1.3;
};

// The safety corner reacts to the room state: bracket, strobe, bell and the two fan switches.
const step = (nodes, lab, world, light, time) => {
  const { alarm, devices } = lab.hazards;
  const calm = lab.prefs.reduceMotion;
  if (nodes.extinguisher) {
    nodes.extinguisher.visible = !world.store.get().objects.some((o) => o.typeId === "extinguisher");
  }
  const beat = alarm.active ? (calm ? 0.75 : 0.5 + 0.5 * Math.sin(time * STROBE_HZ * Math.PI * 2)) : 0;
  glow(nodes.alarmLight, ALARM_RED, beat * 9);
  if (light) light.intensity = beat * 1.4;
  if (nodes.bell) nodes.bell.rotation.z = alarm.active && !calm ? Math.sin(time * 26) * 0.045 : 0;
  glow(nodes.hoodLight, HOOD_WHITE, devices.hoodFan ? 2.4 : 0);
  if (nodes.hoodRocker) nodes.hoodRocker.rotation.z = devices.hoodFan ? 0.12 : -0.12;
  if (nodes.ventRocker) nodes.ventRocker.rotation.z = devices.ventilation ? 0.12 : -0.12;

  // Fume hood sash raises smoothly to safe operating height when hood ventilation is active
  const targetSashY = devices.hoodFan ? 1.5 : 1.3;
  if (nodes.fumehoodSash) {
    nodes.fumehoodSash.position.y += (targetSashY - nodes.fumehoodSash.position.y) * 0.1;
  }
  if (nodes.glassSash) {
    nodes.glassSash.position.y += (targetSashY - nodes.glassSash.position.y) * 0.1;
  }
};

// Dual arched spray jet stream for emergency eyewash
const EyewashArc = ({ startX, flip, time }) => {
  const sway = Math.sin(time * 18 + (flip ? 1 : 0)) * 0.003;
  return (
    <group position={[startX, 0.07, 0]}>
      {/* Jet riser */}
      <mesh position={[flip ? -0.015 : 0.015, 0.04 + sway, 0]} rotation={[0, 0, flip ? 0.45 : -0.45]}>
        <cylinderGeometry args={[0.005, 0.007, 0.08, 8]} />
        <meshStandardMaterial color="#b9e6fe" transparent opacity={0.75} roughness={0.06} />
      </mesh>
      {/* Jet apex fall */}
      <mesh position={[flip ? -0.035 : 0.035, 0.02 + sway, 0]} rotation={[0, 0, flip ? 1.15 : -1.15]}>
        <cylinderGeometry args={[0.004, 0.005, 0.06, 8]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.7} roughness={0.06} />
      </mesh>
    </group>
  );
};

// 3D Plumbed Emergency Eyewash Station
const EyewashStation = ({ active, time }) => {
  return (
    <group position={[2.8, 1.05, 3.65]}>
      {/* Wall supply pipe */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 12]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Drain pipe down to floor */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 1.04, 12]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Yellow polypropylene catch bowl */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.13, 0.07, 24]} />
        <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Push-flag actuator paddle */}
      <mesh position={[0.14, 0.02, 0]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.07, 0.05, 0.008]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
      {/* Twin spray nozzles */}
      <mesh position={[-0.045, 0.04, 0]}>
        <cylinderGeometry args={[0.01, 0.014, 0.025, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.045, 0.04, 0]}>
        <cylinderGeometry args={[0.01, 0.014, 0.025, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Active aerated water spray jets */}
      {active && (
        <>
          <EyewashArc startX={-0.045} flip={false} time={time} />
          <EyewashArc startX={0.045} flip={true} time={time} />
          {/* Froth ring in basin */}
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.11, 20]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.65} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  );
};

// 3D Emergency Safety Shower Fixture
const SafetyShower = ({ active, time }) => {
  const ripple = 0.44 + Math.sin(time * 16) * 0.04;
  return (
    <group position={[2.8, 2.65, 3.3]}>
      {/* Supply vertical pipe descending from ceiling */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.45, 12]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Horizontal pipe from wall */}
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.36, 12]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* High-visibility yellow drench shower bell */}
      <mesh position={[0, -0.06, 0]}>
        <coneGeometry args={[0.13, 0.09, 24, 1, true]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.2} side={DoubleSide} />
      </mesh>
      {/* Perforated drench shower face */}
      <mesh position={[0, -0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.125, 24]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Shower pull rod and triangular handle */}
      <mesh position={[0.08, -0.36, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.62, 8]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.08, -0.68, 0]}>
        <torusGeometry args={[0.04, 0.007, 8, 3]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Active deluge drench cascade */}
      {active && (
        <>
          {/* Falling water deluge cone */}
          <mesh position={[0, -1.35, 0]} scale={[1, -1, 1]}>
            <coneGeometry args={[0.42, 2.5, 24, 1, true]} />
            <meshStandardMaterial
              color="#c7edfd"
              transparent
              opacity={0.48}
              roughness={0.08}
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
          {/* Floor splash pool */}
          <mesh position={[0, -2.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[ripple, 24]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  );
};

// 3D Sink Faucet Running Stream
const SinkFaucetStream = ({ active, time }) => {
  if (!active) return null;
  const pulse = 0.048 + Math.sin(time * 20) * 0.008;
  return (
    <group>
      {/* Running stream cylinder from faucet outlet into drain bowl */}
      <mesh position={[0.6, 0.92, 3.69]}>
        <cylinderGeometry args={[0.012, 0.01, 0.56, 16]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.72} roughness={0.05} metalness={0.05} />
      </mesh>
      {/* Bottom splash disc */}
      <mesh position={[0.6, 0.64, 3.69]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[pulse, 16]} />
        <meshStandardMaterial color="#c7edfd" transparent opacity={0.65} roughness={0.1} />
      </mesh>
    </group>
  );
};

// 3D Emergency Master Gas Shutoff Valve Box
const GasShutoffBox = ({ gasOpen }) => {
  return (
    <group position={[-3.8, 1.15, 3.8]}>
      {/* Through gas piping */}
      <mesh position={[0, 0, -0.01]}>
        <cylinderGeometry args={[0.015, 0.015, 0.38, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Heavy-duty OSHA yellow utility enclosure */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.22, 0.22, 0.05]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Red border warning rim */}
      <mesh position={[0, 0, 0.036]}>
        <boxGeometry args={[0.2, 0.2, 0.005]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.5} />
      </mesh>
      {/* Quarter-turn valve handle (0 = vertical open, -PI/2 = horizontal closed) */}
      <group position={[0, 0, 0.045]} rotation={[0, 0, gasOpen ? 0 : -Math.PI / 2]}>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.022, 0.11, 0.015]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
      {/* Diagnostic status LED */}
      <mesh position={[0.07, -0.07, 0.04]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial
          color={gasOpen ? "#22c55e" : "#ef4444"}
          emissive={gasOpen ? "#22c55e" : "#ef4444"}
          emissiveIntensity={2.5}
        />
      </mesh>
    </group>
  );
};

// 3D GFCI Duplex Outlet Model on bench raceways
const GfciOutlet = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Stainless duplex wallplate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.016]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.82} roughness={0.24} />
      </mesh>
      {/* Test & reset buttons */}
      <mesh position={[0, -0.008, 0.009]}>
        <boxGeometry args={[0.018, 0.01, 0.005]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.008, 0.009]}>
        <boxGeometry args={[0.018, 0.01, 0.005]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      {/* Active GFCI status pinhole LED */}
      <mesh position={[0.022, 0.038, 0.009]}>
        <sphereGeometry args={[0.0035, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.8} />
      </mesh>
    </group>
  );
};

// 3D Wall-Mounted Fire Blanket Container
const FireBlanket = () => {
  return (
    <group position={[-4.15, 1.5, 3.925]}>
      {/* Red durable steel/fiberglass wall enclosure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.26, 0.32, 0.06]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Front instruction plaque */}
      <mesh position={[0, 0.02, 0.031]}>
        <boxGeometry args={[0.22, 0.22, 0.002]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Flame symbol backdrop */}
      <mesh position={[0, 0.04, 0.033]}>
        <boxGeometry args={[0.16, 0.08, 0.002]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      {/* Dual quick-release hanging pull tapes */}
      <mesh position={[-0.05, -0.19, 0.015]}>
        <boxGeometry args={[0.026, 0.11, 0.004]} />
        <meshStandardMaterial color="#f3f4f6" roughness={0.7} />
      </mesh>
      <mesh position={[0.05, -0.19, 0.015]}>
        <boxGeometry args={[0.026, 0.11, 0.004]} />
        <meshStandardMaterial color="#f3f4f6" roughness={0.7} />
      </mesh>
    </group>
  );
};

// 3D OSHA First Aid Kit Wall Cabinet
const FirstAidBox = () => {
  return (
    <group position={[-3.75, 1.6, 3.87]}>
      {/* White enameled steel case */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.34, 0.28, 0.09]} />
        <meshStandardMaterial color="#f9fafb" roughness={0.3} metalness={0.15} />
      </mesh>
      {/* Chrome latch */}
      <mesh position={[0.165, 0, 0.015]}>
        <boxGeometry args={[0.012, 0.045, 0.018]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Safety Green Cross emblem */}
      <mesh position={[0, 0.01, 0.046]}>
        <boxGeometry args={[0.038, 0.12, 0.003]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0.046]}>
        <boxGeometry args={[0.12, 0.038, 0.003]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} />
      </mesh>
    </group>
  );
};

// 3D Industrial Room Purge Exhaust Fan System
const PurgeExhaustFan = ({ active, time }) => {
  const spin = active ? time * 32 : 0;
  return (
    <group position={[-4.96, 2.7, 2.09]} rotation={[0, Math.PI / 2, 0]}>
      {/* Square industrial wall duct frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.54, 0.54, 0.04]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Circular shroud */}
      <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.05, 28]} />
        <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Rotating fan impeller blades */}
      <group position={[0, 0, 0.01]} rotation={[0, 0, spin]}>
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* 4 aerodynamic blades */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <group key={idx} rotation={[0, 0, angle]}>
            <mesh position={[0.11, 0, 0]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.15, 0.045, 0.005]} />
              <meshStandardMaterial color="#d1d5db" metalness={0.88} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Protective wire mesh grill */}
      <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.004, 24]} />
        <meshStandardMaterial color="#9ca3af" wireframe metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Ventilation status indicator light */}
      <mesh position={[0.22, 0.22, 0.01]}>
        <sphereGeometry args={[0.009, 12, 12]} />
        <meshStandardMaterial
          color={active ? "#38bdf8" : "#64748b"}
          emissive={active ? "#38bdf8" : "#000000"}
          emissiveIntensity={active ? 2.5 : 0}
        />
      </mesh>
    </group>
  );
};

const Fixtures = ({ lab, world }) => {
  const { scene } = useGLTF(ROOM_ASSETS.glb);
  const nodes = useMemo(() => nodesOf(scene), [scene]);
  const lightRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => () => restore(nodes), [nodes]);

  useFrame(({ clock }) => {
    timeRef.current = clock.elapsedTime;
    step(nodes, lab, world, lightRef.current, clock.elapsedTime);
  });

  const eyewashActive = Boolean(lab.utilityState?.eyewash);
  const showerActive = Boolean(lab.utilityState?.shower);
  const faucetActive = Boolean(lab.utilityState?.faucet);
  const gasOpen = lab.utilityState?.gasOpen ?? true;

  return (
    <>
      <pointLight ref={lightRef} position={[-4.15, 2.42, 3.6]} color="#ff2b1d" intensity={0} distance={5} />

      {/* Safety infrastructure */}
      <EyewashStation active={eyewashActive} time={timeRef.current} />
      <SafetyShower active={showerActive} time={timeRef.current} />
      <SinkFaucetStream active={faucetActive} time={timeRef.current} />
      <GasShutoffBox gasOpen={gasOpen} />
      <FireBlanket />
      <FirstAidBox />
      <PurgeExhaustFan active={Boolean(lab.hazards?.devices?.ventilation)} time={timeRef.current} />

      {/* Bench electrical raceway GFCI duplex receptacles */}
      <GfciOutlet position={[-1.2, 0.95, -1.15]} />
      <GfciOutlet position={[1.2, 0.95, -1.15]} />
      <GfciOutlet position={[-1.2, 0.95, 1.35]} />
      <GfciOutlet position={[1.2, 0.95, 1.35]} />
    </>
  );
};

// Only the baked room has these fittings; the placeholder room has none.
const RoomFixtures = ({ lab, world, enabled = true }) => (enabled ? <Fixtures lab={lab} world={world} /> : null);

export default RoomFixtures;
