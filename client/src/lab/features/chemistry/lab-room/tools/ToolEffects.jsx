import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { FlashLight, GasTube, PourStream } from "../effects";
import Co2Jet from "../effects/Co2Jet";

const FLASH_S = 0.45;
const pourFrom = new Vector3();
const pourTo = new Vector3();
const gasFrom = new Vector3();
const gasTo = new Vector3();

const pourParams = (lab) => {
  const pour = lab.activity.pour;
  if (!pour?.from || !pour.to || pour.rate <= 0) return null;
  return {
    from: pourFrom.fromArray(pour.from),
    to: pourTo.fromArray(pour.to),
    rate: Math.min(1, pour.rate * 1.6),
    color: pour.color,
    opacity: pour.opacity,
  };
};

const gasParams = (lab) => {
  const gas = lab.activity.gas;
  if (!gas?.from || !gas.to) return null;
  return { from: gasFrom.fromArray(gas.from), to: gasTo.fromArray(gas.to), bubbling: gas.bubbling };
};

const latestFlash = (lab) => lab.flashes[lab.flashes.length - 1] ?? null;

const flashParams = (lab) => {
  const flash = latestFlash(lab);
  if (!flash) return null;
  const age = lab.now() - flash.at;
  if (age > FLASH_S) return null;
  return { color: flash.color, strength: flash.strength * (1 - age / FLASH_S) };
};

const DropletTrail = ({ lab }) => {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const drop = lab.activity.drop;
    if (!drop?.from || !drop?.to) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const count = group.children.length;
    for (let i = 0; i < count; i++) {
      const child = group.children[i];
      const offset = i / count;
      const linearT = ((clock.elapsedTime * 4.2 + offset) % 1);
      // Accelerated fall under gravity
      const t = Math.pow(linearT, 1.35);
      child.position.set(
        drop.from[0] + (drop.to[0] - drop.from[0]) * linearT,
        drop.from[1] + (drop.to[1] - drop.from[1]) * t,
        drop.from[2] + (drop.to[2] - drop.from[2]) * linearT,
      );
      // Teardrop elongation in flight
      child.scale.set(0.85, 1.25, 0.85);
      if (child.material && drop.color) {
        child.material.color.set(drop.color);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {[0, 1, 2].map((idx) => (
        <mesh key={idx}>
          <sphereGeometry args={[0.0035, 14, 14]} />
          <meshStandardMaterial
            color="#bae6fd"
            transparent
            opacity={0.88}
            roughness={0.03}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
};

// World-space visuals of what the player is doing: the pour stream, the gas hose and flashes from pops and bangs.
const ToolEffects = ({ lab }) => {
  const flashGroup = useRef(null);

  useFrame(() => {
    const group = flashGroup.current;
    const flash = latestFlash(lab);
    if (group && flash) group.position.fromArray(flash.position);
  });

  return (
    <>
      <PourStream get={() => pourParams(lab)} />
      <DropletTrail lab={lab} />
      <Co2Jet lab={lab} />
      <GasTube get={() => gasParams(lab)} />
      <group ref={flashGroup}>
        <FlashLight origin={[0, 0, 0]} get={() => flashParams(lab)} />
      </group>
    </>
  );
};

export default ToolEffects;
