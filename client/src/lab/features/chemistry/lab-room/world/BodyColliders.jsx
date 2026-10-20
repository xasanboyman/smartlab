import { CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { GROUPS } from "./groups";

// Sensors are slightly larger than the solid so thin tools are easy to aim at.
const SENSOR_PAD = 0.015;

// Solid colliders carry the item's real mass; sensors are weightless aim targets.
const BodyColliders = ({ body, mass = 0.1, friction = 0.8, restitution = 0.05 }) => {
  if (body.shape === "cylinder") {
    const half = body.height / 2;
    return (
      <>
        <CylinderCollider
          args={[half, body.radius]}
          position={[0, half, 0]}
          collisionGroups={GROUPS.object}
          mass={mass}
          friction={friction}
          restitution={restitution}
        />
        <CylinderCollider
          sensor
          args={[half + SENSOR_PAD, body.radius + SENSOR_PAD]}
          position={[0, half, 0]}
          collisionGroups={GROUPS.sensor}
          density={0}
        />
      </>
    );
  }
  const parts = body.shape === "box" ? [body] : body.parts;
  const share = mass / parts.length;
  return parts.map((part, i) => {
    const half = part.size.map((s) => s / 2);
    return (
      <group key={i}>
        <CuboidCollider args={half} position={part.center} collisionGroups={GROUPS.object} mass={share} friction={friction} restitution={restitution} />
        <CuboidCollider
          sensor
          args={half.map((h) => h + SENSOR_PAD)}
          position={part.center}
          collisionGroups={GROUPS.sensor}
          density={0}
        />
      </group>
    );
  });
};

export default BodyColliders;
