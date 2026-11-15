"use client";

import { COLORS, getMaterials } from "../materials";

const SPOOLS: { pos: [number, number, number]; color: string; lying?: boolean }[] = [
  { pos: [0, 0, 0], color: COLORS.sindoor },
  { pos: [0.42, 0, 0.12], color: COLORS.haldi },
  { pos: [0.2, 0, -0.38], color: COLORS.teal },
  { pos: [-0.5, 0.12, 0.35], color: COLORS.indigo, lying: true },
];

function Spool({ color }: { color: string }) {
  const m = getMaterials();
  return (
    <group>
      {[-0.17, 0.17].map((y) => (
        <mesh key={y} position-y={y} castShadow receiveShadow material={m.lightWood}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 20]} />
        </mesh>
      ))}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 20]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** A little cluster of thread spools — one tipped over. */
export function ThreadSpools(props: React.JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      {SPOOLS.map((s, i) => (
        <group
          key={i}
          position={[s.pos[0], s.lying ? 0.15 : 0.19, s.pos[2]]}
          rotation={s.lying ? [Math.PI / 2, 0, 0.6] : [0, 0, 0]}
        >
          <Spool color={s.color} />
        </group>
      ))}
    </group>
  );
}
