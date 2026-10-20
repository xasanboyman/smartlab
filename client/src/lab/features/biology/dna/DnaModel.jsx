// DNA double helix: two sugar-phosphate backbones (tube + nodes) and base-pair
// rungs split into their two complementary halves (A-T red/blue, G-C green/amber).
// The selected base glows; others stay lit so the pairing rule stays visible.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { usePausableFrame } from "@/lab/components/usePausableFrame";
import BioLabel from "../shared/BioLabel";

export const BASES = [
  { id: "A", letter: "A", name: "Adenin", color: "#ef4444", pair: "T", type: "Purin", bonds: 2, about: "Ikki halqali purin asosi. Timin bilan 2 ta vodorod bog'i orqali juftlashadi (A=T)." },
  { id: "T", letter: "T", name: "Timin", color: "#3b82f6", pair: "A", type: "Pirimidin", bonds: 2, about: "Bir halqali pirimidin asosi. Faqat DNKda uchraydi; RNKda uning o'rnini uratsil egallaydi." },
  { id: "G", letter: "G", name: "Guanin", color: "#10b981", pair: "C", type: "Purin", bonds: 3, about: "Ikki halqali purin asosi. Sitozin bilan 3 ta vodorod bog'i hosil qiladi (G≡C) - bu juft mustahkamroq." },
  { id: "C", letter: "C", name: "Sitozin", color: "#f59e0b", pair: "G", type: "Pirimidin", bonds: 3, about: "Bir halqali pirimidin asosi. Guanin bilan 3 vodorod bog'i orqali bog'lanadi." },
];
const BASE_BY_ID = Object.fromEntries(BASES.map((b) => [b.id, b]));

const RUNGS = 24;
const RADIUS = 1.1;
const HEIGHT = 6.4;
const TURNS = 2.4;
// Repeating A-T-G-C-T-A-C-G pattern so each base appears on both strands.
const SEQUENCE = ["A", "T", "G", "C", "T", "A", "C", "G"];

const backboneCurve = (phase) => {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    const a = t * Math.PI * 2 * TURNS + phase;
    pts.push(new THREE.Vector3(Math.cos(a) * RADIUS, (t - 0.5) * HEIGHT, Math.sin(a) * RADIUS));
  }
  return new THREE.CatmullRomCurve3(pts);
};

const DnaModel = ({ activeBase = null, autoRotate = true, showLabels = true }) => {
  const group = useRef();
  usePausableFrame((_, delta) => {
    if (group.current && autoRotate) group.current.rotation.y += delta * 0.4;
  });

  const rungs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < RUNGS; i++) {
      const t = i / (RUNGS - 1);
      const angle = t * Math.PI * 2 * TURNS;
      const y = (t - 0.5) * HEIGHT;
      const x = Math.cos(angle) * RADIUS;
      const z = Math.sin(angle) * RADIUS;
      const left = SEQUENCE[i % SEQUENCE.length];
      arr.push({ y, angle, a: [x, y, z], b: [-x, y, -z], left, right: BASE_BY_ID[left].pair });
    }
    return arr;
  }, []);

  const tubes = useMemo(
    () => [new THREE.TubeGeometry(backboneCurve(0), 220, 0.07, 10, false), new THREE.TubeGeometry(backboneCurve(Math.PI), 220, 0.07, 10, false)],
    [],
  );

  const labelRung = activeBase ? rungs.find((r) => r.left === activeBase || r.right === activeBase) : null;

  return (
    <group ref={group}>
      {tubes.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow receiveShadow>
          <meshPhysicalMaterial color="#cbd5e1" roughness={0.35} metalness={0.25} clearcoat={0.5} />
        </mesh>
      ))}
      {rungs.map((r, i) => {
        const halves = [
          { base: BASE_BY_ID[r.left], offset: RADIUS / 2 },
          { base: BASE_BY_ID[r.right], offset: -RADIUS / 2 },
        ];
        return (
          <group key={i} position={[0, r.y, 0]} rotation={[0, -r.angle, 0]}>
            {/* backbone nodes (phosphate) */}
            {[RADIUS, -RADIUS].map((x, k) => (
              <mesh key={k} position={[x, 0, 0]} castShadow>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshPhysicalMaterial color="#94a3b8" roughness={0.3} metalness={0.35} clearcoat={0.6} />
              </mesh>
            ))}
            {halves.map(({ base, offset }) => {
              const lit = activeBase === base.id;
              const dim = activeBase && !lit;
              return (
                <mesh key={base.id} position={[offset, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.085, 0.085, RADIUS - 0.08, 14]} />
                  <meshPhysicalMaterial
                    color={base.color}
                    roughness={0.3}
                    clearcoat={0.7}
                    clearcoatRoughness={0.25}
                    emissive={base.color}
                    emissiveIntensity={lit ? 0.9 : dim ? 0.05 : 0.22}
                    transparent={!!dim}
                    opacity={dim ? 0.55 : 1}
                  />
                </mesh>
              );
            })}
            {/* hydrogen bonds between the halves */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
              <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={0.6} />
            </mesh>
          </group>
        );
      })}
      {showLabels && labelRung && (
        <BioLabel
          position={labelRung.left === activeBase ? labelRung.a : labelRung.b}
          offset={[0, 0.35, 0]}
          text={`${BASE_BY_ID[activeBase].name} (${activeBase})`}
          color={BASE_BY_ID[activeBase].color}
          active
          occlude={false}
        />
      )}
    </group>
  );
};

export default DnaModel;
