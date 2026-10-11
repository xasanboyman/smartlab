import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Euler, Quaternion, Vector3 } from "three";
import { useSnap } from "@/shared/utils/snapStore";
import EquipmentModel from "../equipment/EquipmentModel";
import BodyColliders from "./BodyColliders";
import { objectType } from "./objectTypes";
import { spillMixture } from "../sim/spills";
import { pushSound } from "../sound/queue";

const BREAK_SPEED = { glass: 2.4, porcelain: 3.2 };
// Below this the mouth points sideways enough for the contents to run out.
const TIP_UP = 0.55;

const up = new Vector3();
const tmpQuat = new Quaternion();
const scratchEuler = new Euler(0, 0, 0, "XYZ");

const WorldObject = ({ object, world, lab }) => {
  const bodyRef = useRef(null);
  const lastSpeed = useRef(0);
  const type = objectType(object.typeId);
  const dynamic = object.state === "dynamic";
  const breaks = type.body.breaks;

  const restFrames = useRef(0);

  // Collision callbacks run after the solver changed the velocity, so keep the pre-impact speed.
  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!dynamic || !body) return;
    const v = body.linvel();
    const ang = body.angvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    const angSpeed = Math.hypot(ang.x, ang.y, ang.z);
    lastSpeed.current = speed;

    // Resting stability: settle back to placed (fixed) when speed stays near zero on the workbench
    if (speed < 0.08 && angSpeed < 0.12) {
      restFrames.current += 1;
      if (restFrames.current > 15) {
        const t = body.translation();
        const r = body.rotation();
        tmpQuat.set(r.x, r.y, r.z, r.w);
        scratchEuler.setFromQuaternion(tmpQuat);
        world.settle?.(object.id, [t.x, t.y, t.z], [scratchEuler.x, scratchEuler.y, scratchEuler.z]);
        restFrames.current = 0;
        return;
      }
    } else {
      restFrames.current = 0;
    }

    // A knocked-over container empties itself onto whatever is below.
    if (!lab?.mixture(object.id)) return;
    const r = body.rotation();
    up.set(0, 1, 0).applyQuaternion(tmpQuat.set(r.x, r.y, r.z, r.w));
    if (up.y > TIP_UP) return;
    const t = body.translation();
    spillMixture(lab, object.id, [t.x, t.y, t.z], { fraction: Math.min(1, delta / 0.6) });
  });

  const onImpact = () => {
    const body = bodyRef.current;
    if (!body) return;
    const t = body.translation();
    const r = body.rotation();
    const v = body.linvel();

    if (breaks && lastSpeed.current >= BREAK_SPEED[breaks]) {
      // Whatever was inside lands where the glass broke.
      if (lab) spillMixture(lab, object.id, [t.x, t.y, t.z]);
      queueMicrotask(() => world.shatter(object.id, [t.x, t.y, t.z], [r.x, r.y, r.z, r.w], [v.x, v.y, v.z]));
    } else if (lastSpeed.current > 0.4 && lab) {
      // Physical glass/metal contact sound
      pushSound(lab, { type: breaks ? "clink" : "thud", position: [t.x, t.y, t.z] });
    }
  };

  return (
    <RigidBody
      ref={bodyRef}
      type={dynamic ? "dynamic" : "fixed"}
      position={object.position}
      rotation={object.rotation}
      {...(dynamic ? { linearVelocity: object.velocity } : {})}
      colliders={false}
      ccd={dynamic}
      friction={1.5}
      restitution={0.01}
      linearDamping={1.5}
      angularDamping={2.0}
      userData={{ objectId: object.id }}
      {...(dynamic ? { onCollisionEnter: onImpact } : {})}
    >
      <BodyColliders body={type.body} />
      <EquipmentModel id={object.typeId} simId={object.id} {...object.props} />
    </RigidBody>
  );
};

const WorldObjects = ({ world, lab }) => {
  const { objects } = useSnap(world.store);
  return objects
    .filter((o) => o.state !== "held")
    .map((o) => <WorldObject key={`${o.id}:${o.state}:${o.rev}`} object={o} world={world} lab={lab} />);
};

export default WorldObjects;
