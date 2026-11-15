"use client";

import { COLORS } from "../materials";

// Echo the portfolio: batik teal, haldi, sindoor, indigo weave, cream calico.
const SWATCHES: { color: string; pos: [number, number]; rot: number }[] = [
  { color: COLORS.cream, pos: [0, 0], rot: 0.1 },
  { color: COLORS.indigo, pos: [0.08, 0.06], rot: -0.15 },
  { color: COLORS.haldi, pos: [-0.06, 0.1], rot: 0.32 },
  { color: COLORS.sindoor, pos: [0.1, -0.05], rot: -0.4 },
  { color: COLORS.teal, pos: [-0.02, 0.02], rot: 0.05 },
];

/** A loose stack of fabric swatches. */
export function FabricSwatches(props: React.JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      {SWATCHES.map((s, i) => (
        <mesh
          key={i}
          position={[s.pos[0], 0.012 + i * 0.014, s.pos[1]]}
          rotation-y={s.rot}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.1, 0.012, 1.1]} />
          <meshStandardMaterial color={s.color} roughness={0.95} />
        </mesh>
      ))}
      {/* Leaf motif on the top (batik) swatch */}
      {[-0.25, 0.05, 0.3].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.012 + SWATCHES.length * 0.014, (i - 1) * 0.2]}
          rotation={[-Math.PI / 2, 0, 0.6 + i]}
          scale={[1, 0.45, 1]}
        >
          <circleGeometry args={[0.14, 16]} />
          <meshStandardMaterial color="#B9D3B0" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
