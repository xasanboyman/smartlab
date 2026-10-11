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
  const meshRef = useRef(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const drop = lab.activity.drop;
    if (!drop?.from || !drop?.to) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const t = (clock.elapsedTime * 6) % 1;
    mesh.position.set(
      drop.from[0] + (drop.to[0] - drop.from[0]) * t,
      drop.from[1] + (drop.to[1] - drop.from[1]) * t,
      drop.from[2] + (drop.to[2] - drop.from[2]) * t,
    );
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.0038, 12, 12]} />
      <meshStandardMaterial color="#bae6fd" transparent opacity={0.88} roughness={0.05} />
    </mesh>
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
