import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYLINDERS, GEOM, VALVES, cylinderTheta, valveLift } from "../../engineMath";
import { PART_BY_ID } from "../../engineParts";
import { usePartMaterial } from "../materials";
import { Instances, lathe, matrixAt, merge, setInstance, useGeometries } from "../geometry";

const PART_ID = { intake: "valveIntake", exhaust: "valveExhaust" };
const HEAD_KIND = { intake: "valveSteel", exhaust: "heatSteel" };
const HEAD_R = GEOM.valveHeadRadius;
const STEM_R = 0.024;
const L = GEOM.valveStemLength;
const SEAT_Y = 0.27;
const RETAINER_Y = 0.49;
const SPRING_LEN = RETAINER_Y - SEAT_Y - 0.01;
const ROLLER_R = GEOM.rollerRadius;
const ROLLER_Y = L + GEOM.bucketHeight + ROLLER_R;

// Valve slots: two per cylinder per side, in cylinder order.
const slots = (which) => {
  const v = VALVES[which];
  return CYLINDERS.flatMap(({ x, index }) =>
    [-1, 1].map((s) => ({ x: x + s * GEOM.valvePairDX, cyl: index, v })),
  );
};

class Helix extends THREE.Curve {
  constructor(radius, height, turns, wire) {
    super();
    this.radius = radius;
    this.height = height;
    this.turns = turns;
    this.wire = wire;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const u = t * this.turns;
    const dead = 0.8;
    const pad = this.wire * 1.1;
    let y;
    if (u < dead) y = pad * (u / dead);
    else if (u > this.turns - dead) y = this.height - pad * ((this.turns - u) / dead);
    else y = pad + ((u - dead) / (this.turns - 2 * dead)) * (this.height - 2 * pad);
    const a = u * Math.PI * 2;
    return target.set(this.radius * Math.cos(a), y, this.radius * Math.sin(a));
  }
}

const build = () => {
  const head = lathe(
    [
      [0, 0.004],
      [0.08, 0.001],
      [HEAD_R - 0.012, 0, true],
      [HEAD_R, 0.01, true],
      [HEAD_R, 0.02, true],
      [HEAD_R - 0.02, 0.04, true],
      [0.085, 0.05],
      [0.06, 0.075],
      [0.044, 0.11],
      [0.034, 0.15],
      [STEM_R, 0.2],
    ],
    44,
  );
  const stem = lathe(
    [
      [STEM_R, 0.19],
      [STEM_R, L - 0.006, true],
      [0.018, L, true],
      [0, L],
    ],
    20,
  );
  const retainer = lathe(
    [
      [STEM_R, RETAINER_Y - 0.02],
      [0.05, RETAINER_Y - 0.02, true],
      [0.056, RETAINER_Y, true],
      [0.082, RETAINER_Y, true],
      [0.082, RETAINER_Y + 0.03, true],
      [0.034, RETAINER_Y + 0.04, true],
      [STEM_R, RETAINER_Y + 0.04],
    ],
    32,
  );
  const bucket = lathe(
    [
      [0, L - 0.01],
      [0.085, L - 0.01, true],
      [0.085, L + GEOM.bucketHeight - 0.012, true],
      [0.075, L + GEOM.bucketHeight, true],
      [0, L + GEOM.bucketHeight],
    ],
    36,
  );
  const roller = new THREE.CylinderGeometry(ROLLER_R, ROLLER_R, 0.12, 20).rotateZ(Math.PI / 2).translate(0, ROLLER_Y, 0);
  const axle = new THREE.CylinderGeometry(0.011, 0.011, 0.16, 10).rotateZ(Math.PI / 2).translate(0, ROLLER_Y, 0);
  const cheeks = [1, -1].map((s) =>
    new THREE.BoxGeometry(0.012, 0.085, 0.05).translate(s * 0.072, L + GEOM.bucketHeight + 0.025, 0),
  );
  const seat = lathe(
    [
      [HEAD_R - 0.012, -0.006],
      [HEAD_R + 0.028, -0.006, true],
      [HEAD_R + 0.028, 0.03, true],
      [HEAD_R + 0.004, 0.03, true],
    ],
    44,
  );
  const guide = lathe(
    [
      [STEM_R + 0.003, 0.17],
      [0.042, 0.17, true],
      [0.042, SEAT_Y - 0.012, true],
      [0.085, SEAT_Y - 0.012, true],
      [0.085, SEAT_Y, true],
      [STEM_R + 0.003, SEAT_Y, true],
    ],
    28,
  );
  const spring = new THREE.TubeGeometry(new Helix(0.066, SPRING_LEN, 5.5, 0.011), 132, 0.011, 6, false);
  return {
    valve: merge([head, stem, retainer]),
    follower: merge([bucket, roller, axle, ...cheeks]),
    seat: merge([seat, guide]),
    spring,
  };
};

const Valves = ({ simRef, mode, selected, which = "intake" }) => {
  const shell = PART_BY_ID[PART_ID[which]].shell;
  const valveRef = useRef(null);
  const followerRef = useRef(null);
  const springRef = useRef(null);
  const headMat = usePartMaterial(HEAD_KIND[which], { mode, shell, selected });
  const darkMat = usePartMaterial("darkSteel", { mode, shell, selected });
  const steelMat = usePartMaterial("steel", { mode, shell, selected });
  const geo = useGeometries(build);
  const list = useRef(slots(which)).current;
  const seatMatrices = useRef(list.map(({ x, v }) => matrixAt(x, v.headClosed.y, v.headClosed.z, v.tiltX))).current;

  useFrame(() => {
    const valve = valveRef.current;
    const follower = followerRef.current;
    const spring = springRef.current;
    if (!valve || !follower || !spring) return;
    const theta = simRef.current.theta;
    for (let i = 0; i < list.length; i++) {
      const { x, cyl, v } = list[i];
      const lift = valveLift(cylinderTheta(theta, cyl), which);
      const y = v.headClosed.y - v.dir.y * lift;
      const z = v.headClosed.z - v.dir.z * lift;
      setInstance(valve, i, x, y, z, v.tiltX);
      setInstance(follower, i, x, y, z, v.tiltX);
      setInstance(
        spring,
        i,
        x,
        v.headClosed.y + v.dir.y * SEAT_Y,
        v.headClosed.z + v.dir.z * SEAT_Y,
        v.tiltX,
        0,
        0,
        1,
        (SPRING_LEN - lift) / SPRING_LEN,
        1,
      );
    }
    valve.instanceMatrix.needsUpdate = true;
    follower.instanceMatrix.needsUpdate = true;
    spring.instanceMatrix.needsUpdate = true;
  });

  const n = list.length;
  return (
    <group>
      <Instances geometry={geo.seat} material={steelMat} matrices={seatMatrices} />
      <instancedMesh ref={valveRef} args={[geo.valve, headMat, n]} frustumCulled={false} castShadow />
      <instancedMesh ref={followerRef} args={[geo.follower, darkMat, n]} frustumCulled={false} />
      <instancedMesh ref={springRef} args={[geo.spring, darkMat, n]} frustumCulled={false} />
    </group>
  );
};

export default Valves;
