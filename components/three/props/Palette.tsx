"use client";

import { COLORS, getMaterials } from "../materials";

const BLOBS: { pos: [number, number]; color: string; r: number }[] = [
  { pos: [-0.55, -0.25], color: COLORS.sindoor, r: 0.13 },
  { pos: [-0.2, -0.45], color: COLORS.haldi, r: 0.12 },
  { pos: [0.2, -0.42], color: COLORS.teal, r: 0.12 },
  { pos: [0.52, -0.18], color: COLORS.indigo, r: 0.11 },
  { pos: [0.55, 0.22], color: COLORS.rose, r: 0.12 },
  { pos: [0.1, 0.05], color: "#E58A3A", r: 0.16 },
  { pos: [-0.3, 0.12], color: COLORS.bamboo, r: 0.1 },
];

/** Wooden artist's palette with paint dabs and a thumb hole. */
export function Palette(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  return (
    <group {...props}>
      <mesh scale={[1.25, 1, 0.9]} castShadow receiveShadow material={m.lightWood}>
        <cylinderGeometry args={[0.8, 0.8, 0.04, 40]} />
      </mesh>
      {/* Thumb hole */}
      <mesh position={[-0.6, 0.022, 0.38]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.11, 24]} />
        <meshStandardMaterial color="#5a3820" roughness={1} />
      </mesh>
      {BLOBS.map((b, i) => (
        <mesh
          key={i}
          position={[b.pos[0], 0.025, b.pos[1]]}
          scale={[1, 0.28, 0.85]}
          castShadow
        >
          <sphereGeometry args={[b.r, 16, 10]} />
          <meshStandardMaterial color={b.color} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}
