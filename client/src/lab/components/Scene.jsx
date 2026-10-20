// Shared Canvas wrapper: consistent lighting, camera and orbit controls.
// Reads SceneControl context so the bottom toolbar can pause/reset the camera.
import { Suspense } from "react";
import { PCFShadowMap } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AdaptiveDpr } from "@react-three/drei";
import { XR, XROrigin, IfInSessionMode } from "@react-three/xr";
import { useSceneControlOptional } from "./sceneControl";
import CardboardView from "./CardboardView";
import GazeReticle from "./GazeReticle";
import Locomotion from "./Locomotion";

const Loader = () => (
  <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
    Yuklanmoqda...
  </div>
);

// frameloop="demand" renders only on change (camera move, invalidate) - use it
// for heavy static scenes (anatomy). Animated scenes keep the default "always".
// lights={false} lets a page bring its own studio rig (biology); shadows turns on
// the renderer shadow map for rigs that cast them.
const Scene = ({
  children,
  camera = [0, 0, 8],
  controls = {},
  bg,
  autoRotate = false,
  frameloop = "always",
  gl,
  lights = true,
  shadows = false,
  loader,
}) => {
  const { paused, controlsRef, xrStore, inVR, cardboard, vrBox, walk } =
    useSceneControlOptional();

  // In cardboard mode the gyroscope drives the camera, so disable orbit + adaptive
  // dpr (CardboardView always renders) and stop auto-rotate. Walk mode is a
  // first-person controller, so it also takes over from OrbitControls.
  // "VR box" shares the same stereo split (persisting without a gyroscope).
  const cardboardOn = !!cardboard || !!vrBox;
  const walkOn = !!walk;
  const freeControl = cardboardOn || walkOn;

  // OrbitControls + cardboard stereo must NOT run during an immersive WebXR
  // session (they fight the WebXR-owned camera and blank the headset).
  const cameraControls = (
    <>
      <CardboardView enabled={cardboardOn && !inVR} persist={!!vrBox} />
      {!freeControl && frameloop === "always" && <AdaptiveDpr pixelated />}
      {!freeControl && (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3}
          maxDistance={40}
          autoRotate={autoRotate && !paused}
          autoRotateSpeed={0.8}
          regress={frameloop === "always"}
          {...controls}
        />
      )}
    </>
  );

  const content = (
    <>
      {bg && <color attach="background" args={[bg]} />}
      {lights && (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.1} />
          <directionalLight position={[-5, -3, -5]} intensity={0.4} />
        </>
      )}
      {children}

      {/* VR box: markazda nishon (kontroller "tanlash" nimani olishini ko'rsatadi). */}
      <GazeReticle enabled={!!vrBox} />

      <Locomotion />

      {/* XR (workspace) bo'lsa: turish nuqtasini markazlashgan modeldan biroz
          orqaga qo'yib, kamera boshqaruvlarini sessiya tashqarisiga qulflaymiz.
          Hero sahnada (store yo'q) XR-komponentlarsiz oddiy boshqaruv ishlaydi. */}
      {xrStore ? (
        <>
          <XROrigin position={[0, -1.2, 4]} />
          <IfInSessionMode deny={["immersive-vr", "immersive-ar"]}>
            {cameraControls}
          </IfInSessionMode>
        </>
      ) : (
        cameraControls
      )}
    </>
  );

  return (
    <div className="relative h-full w-full">
      <Suspense fallback={loader ?? <Loader />}>
        {/* Full-resolution rendering; perf comes from frameloop, not lower dpr. */}
        <Canvas
          frameloop={freeControl ? "always" : frameloop}
          camera={{ position: camera, fov: 50 }}
          dpr={[1, 2]}
          gl={gl}
          shadows={shadows === true ? { type: PCFShadowMap } : shadows}
        >
          {/* Wrap in <XR> only when a store exists (workspace); the hero has none. */}
          {xrStore ? <XR store={xrStore}>{content}</XR> : content}
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Scene;
