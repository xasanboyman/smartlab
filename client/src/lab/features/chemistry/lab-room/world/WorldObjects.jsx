import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Euler, Quaternion, Vector3 } from "three";
import { useSnap } from "@/shared/utils/snapStore";
import EquipmentModel from "../equipment/EquipmentModel";
import BodyColliders from "./BodyColliders";
import { objectType, physicsOf } from "./objectTypes";
import { spillMixture } from "../sim/spills";
import { pushSound } from "../sound/queue";
import { pushFeed } from "../sim/feed";
import { logJournal } from "../sim/journal";
import { displayName } from "./prompts";
import { massG } from "../chemistry/mixture";

// Below this the mouth points sideways enough for the contents to run out.
const TIP_UP = 0.55;
// A falling body that hits a standing one this fast knocks it over.
const KNOCK_SPEED = 0.7;
const SETTLE_MS = 220;
const REST_FRAMES = 18;
const MIN_SOUND_SPEED = 0.35;
const SOUND_EVERY_MS = 120;

const up = new Vector3();
const tmpQuat = new Quaternion();
const scratchEuler = new Euler(0, 0, 0, "XYZ");

const soundOf = (phys, speed, position) => ({
  type: phys.sound,
  position,
  // Impact loudness grows with speed; the pitch tag lets glass of different sizes ring differently.
  strength: Math.min(1, 0.25 + speed / 3.5),
  size: phys.mass > 0.5 ? 1.6 : phys.mass > 0.15 ? 1.15 : 0.85,
});

// The short dip-and-recover when an item is set down; purely visual, the collider is already in place.
const settleOffset = (ageMs) => {
  if (ageMs == null || ageMs > SETTLE_MS) return 0;
  const t = ageMs / SETTLE_MS;
  // Drops from 6 mm, lands at ~45%, bounces 1 mm and rests.
  if (t < 0.45) return 0.006 * (1 - (t / 0.45) ** 2);
  return 0.0012 * Math.sin(((t - 0.45) / 0.55) * Math.PI) * (1 - t);
};

const WorldObject = ({ object, world, lab }) => {
  const bodyRef = useRef(null);
  const visualRef = useRef(null);
  const lastSpeed = useRef(0);
  const peakY = useRef(-Infinity);
  const lastSoundAt = useRef(0);
  const restFrames = useRef(0);
  const type = objectType(object.typeId);
  const phys = physicsOf(object.typeId);
  const dynamic = object.state === "dynamic";
  const cracked = Boolean(object.props?.cracked);

  // Collision callbacks run after the solver changed the velocity, so keep the pre-impact speed.
  useFrame((_, delta) => {
    const visual = visualRef.current;
    if (visual && !dynamic) {
      visual.position.y = object.placedAt ? settleOffset(performance.now() - object.placedAt) : 0;
    }
    const body = bodyRef.current;
    if (!dynamic || !body) return;
    const v = body.linvel();
    const ang = body.angvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    const angSpeed = Math.hypot(ang.x, ang.y, ang.z);
    lastSpeed.current = speed;
    peakY.current = Math.max(peakY.current, body.translation().y);

    // Back to a fixed, placeable object once it has really come to rest.
    if (speed < 0.06 && angSpeed < 0.1) {
      restFrames.current += 1;
      if (restFrames.current > REST_FRAMES) {
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

  const onImpact = (payload) => {
    const body = bodyRef.current;
    if (!body) return;
    const t = body.translation();
    const r = body.rotation();
    const v = body.linvel();
    // A long frame makes the solver overshoot, so the fall height bounds the impact speed.
    const fromFall = Math.sqrt(2 * 9.81 * Math.max(0, peakY.current - t.y)) + 0.5;
    const speed = Math.min(lastSpeed.current, fromFall);
    peakY.current = t.y;
    const position = [t.x, t.y, t.z];

    // Something standing in the way gets shoved: it tips, rolls and may spill.
    const otherId = payload?.other?.rigidBody?.userData?.objectId;
    if (otherId && speed > KNOCK_SPEED) {
      const other = world.get(otherId);
      if (other?.state === "placed") {
        const push = Math.min(1.2, speed * 0.35 * Math.sqrt(phys.mass / Math.max(0.05, physicsOf(other.typeId).mass)));
        const dx = other.position[0] - t.x;
        const dz = other.position[2] - t.z;
        const flat = Math.max(0.03, Math.hypot(dx, dz));
        world.wake(otherId, [(dx / flat) * push, 0.15 * push, (dz / flat) * push], [(dz / flat) * push * 6, 0, -(dx / flat) * push * 6]);
      }
    }

    if (phys.breaks && speed >= phys.shatter) {
      // Whatever was inside lands where the glass broke.
      if (lab) spillMixture(lab, object.id, position);
      queueMicrotask(() => {
        world.shatter(object.id, position, [r.x, r.y, r.z, r.w], [v.x, v.y, v.z]);
        if (lab) {
          pushFeed(lab, { kind: "warning", id: "glass-broken" });
          logJournal(lab, { kind: "break", text: `${displayName(object.typeId)} sindi (${speed.toFixed(1)} m/s urilish)` });
        }
      });
      return;
    }
    if (phys.breaks && !cracked && speed >= phys.crack) {
      if (world.markCracked(object.id) && lab) {
        pushSound(lab, { type: "crack", position, strength: 0.9 });
        pushFeed(lab, { kind: "warning", id: "cracked-glass" });
        logJournal(lab, { kind: "break", text: `${displayName(object.typeId)} darz ketdi` });
      }
      return;
    }
    const now = performance.now();
    if (speed > MIN_SOUND_SPEED && lab && now - lastSoundAt.current > SOUND_EVERY_MS) {
      lastSoundAt.current = now;
      pushSound(lab, soundOf(phys, speed, position));
    }
  };

  const contentsKg = lab?.mixture(object.id) ? massG(lab.mixture(object.id)) / 1000 : 0;

  return (
    <RigidBody
      ref={bodyRef}
      type={dynamic ? "dynamic" : "fixed"}
      position={object.position}
      rotation={object.rotation}
      {...(dynamic ? { linearVelocity: object.velocity, angularVelocity: object.angular ?? [0, 0, 0] } : {})}
      colliders={false}
      ccd={dynamic}
      friction={phys.friction}
      restitution={phys.restitution}
      linearDamping={0.08}
      angularDamping={0.35}
      canSleep
      userData={{ objectId: object.id }}
      {...(dynamic ? { onCollisionEnter: onImpact } : {})}
    >
      <BodyColliders body={type.body} mass={phys.mass + contentsKg} friction={phys.friction} restitution={phys.restitution} />
      <group ref={visualRef}>
        <EquipmentModel id={object.typeId} simId={object.id} {...object.props} />
      </group>
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
