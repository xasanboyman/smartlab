import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Euler, Quaternion, Vector3 } from "three";
import { useSnap } from "@/shared/utils/snapStore";
import EquipmentModel from "../equipment/EquipmentModel";
import { BlobVisibleContext } from "../equipment/kit/blobContext";
import { bodyBounds, objectType, physicsOf } from "./objectTypes";
import { actionPose, gasOutletWorld, ignitePose, lipWorld, mouthWorld } from "../tools/poses";
import { CONTAINERS } from "../sim/containers";

const BLEND_S = 0.12;

// Wall fittings are carried low, at arm's length, so they don't fill half the view.
const FIXTURE_POSE = { position: [0.3, -0.72, -0.78], rotation: [0.2, -1.05, -0.12] };

// Hand sway: a spring-damper that lags behind the camera and swings with its acceleration and turning.
// Heavier items lag more and settle slower, like a full bottle versus a spatula.
const SWAY = { stiffness: 70, damping: 11, lag: 0.028, tilt: 0.045, yawLag: 0.09, maxOffset: 0.05, maxTilt: 0.32 };
const MAX_DT = 0.05;

// Hand position in camera space: lower right, far enough to stay out of the near plane.
const handPose = (typeId) => {
  const type = objectType(typeId);
  if (type.kind === "fixture") return FIXTURE_POSE;
  const { half, center } = bodyBounds(type.body);
  const size = Math.max(half[0], half[1], half[2]) * 2;
  const lying = half[0] > half[1] * 2.5;
  return {
    position: [0.2 + size * 0.15, -0.2 - center[1] - size * 0.25, -0.42 - size * 0.55],
    rotation: lying ? [0.25, -0.9, 0] : [0.08, -0.35, 0],
  };
};

const handPosition = new Vector3();
const handQuaternion = new Quaternion();
const tmpQuaternion = new Quaternion();
const tmpEuler = new Euler();
const tmpPoint = new Vector3();
const camVel = new Vector3();
const camAccel = new Vector3();
const localAccel = new Vector3();
const localVel = new Vector3();
const swayOffset = new Vector3();
const swayEuler = new Euler();
const swayQuat = new Quaternion();
const inverseCam = new Quaternion();
const springForce = new Vector3();

const surfaceOf = (lab, target) => {
  const point = mouthWorld(target, tmpPoint);
  const params = CONTAINERS[target.typeId];
  const mixture = lab.mixture(target.id);
  if (params && mixture) point.y = target.position[1] + Math.max(0.004, (params.mouthY * mixture.volumeMl) / params.capacityMl);
  return point.toArray();
};

// Integrates the sway springs from this frame's camera motion; writes anim.offset (camera space) and anim.tilt.
const stepSway = (anim, camera, held, dt) => {
  const s = anim.sway;
  if (!s.ready) {
    s.prevPos.copy(camera.position);
    s.prevVel.set(0, 0, 0);
    s.prevYaw = camera.rotation.y;
    s.ready = true;
  }
  camVel.subVectors(camera.position, s.prevPos).divideScalar(dt);
  camAccel.subVectors(camVel, s.prevVel).divideScalar(dt).clampLength(0, 25);
  s.prevPos.copy(camera.position);
  s.prevVel.copy(camVel);
  let yawRate = (camera.rotation.y - s.prevYaw) / dt;
  if (yawRate > Math.PI * 10) yawRate -= (Math.PI * 2) / dt;
  if (yawRate < -Math.PI * 10) yawRate += (Math.PI * 2) / dt;
  yawRate = Math.max(-8, Math.min(8, yawRate));
  s.prevYaw = camera.rotation.y;

  inverseCam.copy(camera.quaternion).invert();
  localVel.copy(camVel).applyQuaternion(inverseCam);
  localAccel.copy(camAccel).applyQuaternion(inverseCam);

  // Mass scales the lag (more inertia) and slows the spring a little.
  const massK = Math.min(2.2, 0.6 + physicsOf(held.typeId).mass * 1.4);
  const k = SWAY.stiffness / massK;
  const c = SWAY.damping / Math.sqrt(massK);
  // Target: fall behind motion, swing out when turning, dip when accelerating up.
  s.target.set(-localVel.x * SWAY.lag * massK - yawRate * SWAY.yawLag * 0.35, -localVel.y * SWAY.lag * massK * 0.6 - Math.abs(localVel.z) * 0.004, -localVel.z * SWAY.lag * massK * 0.5);
  s.target.clampLength(0, SWAY.maxOffset);
  springForce.subVectors(s.target, s.offset).multiplyScalar(k).addScaledVector(s.velocity, -c);
  s.velocity.addScaledVector(springForce, dt);
  s.offset.addScaledVector(s.velocity, dt);

  // Pendulum tilt: the item swings opposite to the acceleration and trails the turn.
  const tiltTargetX = Math.max(-SWAY.maxTilt, Math.min(SWAY.maxTilt, localAccel.z * SWAY.tilt * massK));
  const tiltTargetZ = Math.max(-SWAY.maxTilt, Math.min(SWAY.maxTilt, localAccel.x * SWAY.tilt * massK + yawRate * 0.05));
  s.tiltVel.x += ((tiltTargetX - s.tilt.x) * k * 0.6 - s.tiltVel.x * c) * dt;
  s.tiltVel.y += ((tiltTargetZ - s.tilt.y) * k * 0.6 - s.tiltVel.y * c) * dt;
  s.tilt.x += s.tiltVel.x * dt;
  s.tilt.y += s.tiltVel.y * dt;
};

// Moves the held model between the hand and the pose of the running action, and publishes where it is.
const followHand = (group, camera, held, lab, world, anim, delta) => {
  const dt = Math.max(1e-3, Math.min(delta, MAX_DT));
  const pose = handPose(held.typeId);
  stepSway(anim, camera, held, dt);
  const sway = anim.sway;
  const calm = lab.prefs?.reduceMotion ? 0.35 : 1;
  swayOffset.set(pose.position[0] + sway.offset.x * calm, pose.position[1] + sway.offset.y * calm, pose.position[2] + sway.offset.z * calm);
  handPosition.copy(swayOffset).applyMatrix4(camera.matrixWorld);
  swayEuler.set(pose.rotation[0] + sway.tilt.x * calm, pose.rotation[1], pose.rotation[2] - sway.tilt.y * calm);
  handQuaternion.copy(camera.quaternion).multiply(tmpQuaternion.setFromEuler(swayEuler));

  const activity = lab.activity;
  const action = activity.action;
  const target = action ? world.get(action.targetId) : null;
  anim.holdS = action && anim.actionKey === `${action.id}:${action.targetId}` ? anim.holdS + delta : 0;
  anim.actionKey = action ? `${action.id}:${action.targetId}` : null;

  let desired = null;
  if (action && target) {
    const lamp = target.typeId === "spirit-lamp" || target.typeId === "bunsen-burner" ? target : null;
    desired = actionPose({ action, held, target, lamp, camera, holdS: anim.holdS, lab });
  } else if (activity.ignite && (held.typeId === "spirit-lamp" || held.typeId === "bunsen-burner")) {
    const igniteTarget = world.get(activity.ignite.simId);
    if (igniteTarget) desired = ignitePose({ target: igniteTarget, camera, held });
  }
  if (desired) anim.pose = desired;
  anim.weight += ((desired ? 1 : 0) - anim.weight) * (1 - Math.exp(-delta / BLEND_S));

  if (anim.pose && anim.weight > 0.001) {
    group.position.lerpVectors(handPosition, anim.pose.position, anim.weight);
    group.quaternion.slerpQuaternions(handQuaternion, anim.pose.quaternion, anim.weight);
    // A little of the hand tremor stays on the action pose so a pour still breathes.
    if (anim.weight > 0.5) {
      swayQuat.setFromEuler(swayEuler.set(sway.tilt.x * 0.25, 0, -sway.tilt.y * 0.25));
      group.quaternion.multiply(swayQuat);
    }
  } else {
    group.position.copy(handPosition);
    group.quaternion.copy(handQuaternion);
    anim.pose = null;
  }
  group.updateMatrixWorld();

  activity.heldPositions = { [held.id]: group.position.toArray() };
  activity.release = [camVel.x, camVel.y, camVel.z];
  if (activity.pour && desired?.lip && target) {
    activity.pour.from = anim.weight > 0.85 ? lipWorld(group.position, group.quaternion, desired.lip).toArray() : null;
    activity.pour.to = surfaceOf(lab, world.get(activity.pour.intoId) ?? target);
  }
  if (activity.drop && target) {
    if (activity.drop.dropperId === held.id) {
      activity.drop.from = lipWorld(group.position, group.quaternion, [0, -0.04, 0]).toArray();
      activity.drop.to = surfaceOf(lab, target);
    }
  }
  if (activity.gas && target) {
    activity.gas.from = gasOutletWorld(group.matrixWorld).toArray();
    const end = mouthWorld(target, tmpPoint);
    if (activity.gas.bubbling) end.y = target.position[1] + 0.012;
    activity.gas.to = end.toArray();
  }
};

const createSway = () => ({
  ready: false,
  prevPos: new Vector3(),
  prevVel: new Vector3(),
  prevYaw: 0,
  target: new Vector3(),
  offset: new Vector3(),
  velocity: new Vector3(),
  tilt: { x: 0, y: 0 },
  tiltVel: { x: 0, y: 0 },
});

const HeldItem = ({ world, lab }) => {
  const { hotbar, activeSlot, objects } = useSnap(world.store);
  const groupRef = useRef(null);
  const anim = useRef({ weight: 0, pose: null, holdS: 0, actionKey: null, heldId: null, sway: createSway() });
  const heldId = hotbar[activeSlot];
  const held = heldId ? objects.find((o) => o.id === heldId) : null;

  // Runs after the player moved the camera (priority 0) and before the composer renders (1).
  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group || !held) return;
    const a = anim.current;
    if (a.heldId !== held.id) {
      a.heldId = held.id;
      a.sway = createSway();
      // A fresh item swings in from below as the hand lifts it.
      a.sway.offset.set(0.02, -0.06, 0.01);
    }
    followHand(group, camera, held, lab, world, a, delta);
  }, 0.6);

  if (!held) return null;
  return (
    <group ref={groupRef}>
      <BlobVisibleContext.Provider value={false}>
        <EquipmentModel key={held.id} id={held.typeId} simId={held.id} {...held.props} />
      </BlobVisibleContext.Provider>
    </group>
  );
};

export default HeldItem;
