// Smoothly flies the camera (and OrbitControls target) to a point when `target`
// changes; any user drag cancels the flight. Works with frameloop="demand".
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneControlOptional } from "@/lab/components/sceneControl";

const CameraFocus = ({ target, distance = 3, direction, speed = 5, controlsRef: externalControls }) => {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const { controlsRef: ctxControls } = useSceneControlOptional();
  const controlsRef = externalControls || ctxControls;
  const anim = useRef({ active: false, eye: new THREE.Vector3(), look: new THREE.Vector3() });

  useEffect(() => {
    if (!target) return;
    const look = new THREE.Vector3().fromArray(target);
    const controls = controlsRef?.current;
    const from = controls?.target ?? look;
    const dir = direction
      ? new THREE.Vector3().fromArray(direction).normalize()
      : camera.position.clone().sub(from).normalize();
    if (dir.lengthSq() < 1e-6) dir.set(0, 0.2, 1).normalize();
    anim.current.eye.copy(look).addScaledVector(dir, distance);
    anim.current.look.copy(look);
    anim.current.active = true;
    invalidate();
  }, [target, distance, direction, camera, controlsRef, invalidate]);

  useEffect(() => {
    const controls = controlsRef?.current;
    if (!controls) return;
    const stop = () => (anim.current.active = false);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a.active) return;
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-speed * dt);
    camera.position.lerp(a.eye, k);
    const controls = controlsRef?.current;
    if (controls) {
      controls.target.lerp(a.look, k);
      controls.update();
    } else camera.lookAt(a.look);
    if (camera.position.distanceTo(a.eye) < 0.002) {
      camera.position.copy(a.eye);
      if (controls) controls.target.copy(a.look);
      a.active = false;
    }
    invalidate();
  });

  return null;
};

export default CameraFocus;
