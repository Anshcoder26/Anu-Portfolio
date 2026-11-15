"use client";

import { COLORS, getMaterials } from "../materials";

/** Closed spiral sketchbook with a pencil resting on it. */
export function Sketchbook(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const W = 1.5;
  const D = 2;
  const rings = 11;

  return (
    <group {...props}>
      {/* Board + pages + cover */}
      <mesh position-y={0.02} castShadow receiveShadow material={m.ink}>
        <boxGeometry args={[W, 0.04, D]} />
      </mesh>
      <mesh position-y={0.075} castShadow receiveShadow material={m.paper}>
        <boxGeometry args={[W - 0.04, 0.07, D - 0.06]} />
      </mesh>
      <mesh position-y={0.125} castShadow receiveShadow>
        <boxGeometry args={[W, 0.03, D]} />
        <meshStandardMaterial color={COLORS.teal} roughness={0.85} />
      </mesh>
      {/* Label */}
      <mesh position={[0, 0.141, 0.25]} rotation-x={-Math.PI / 2} material={m.cream}>
        <planeGeometry args={[0.8, 0.35]} />
      </mesh>

      {/* Spiral binding along the top edge */}
      {Array.from({ length: rings }, (_, i) => (
        <mesh
          key={i}
          position={[-W / 2 + 0.15 + (i * (W - 0.3)) / (rings - 1), 0.075, -D / 2 + 0.02]}
          rotation-y={Math.PI / 2}
          material={m.steel}
        >
          <torusGeometry args={[0.08, 0.012, 6, 16]} />
        </mesh>
      ))}

      {/* Pencil */}
      <group position={[0.15, 0.17, -0.1]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh castShadow material={m.haldi}>
          <cylinderGeometry args={[0.035, 0.035, 1.3, 6]} />
        </mesh>
        <mesh position-y={0.72} material={m.lightWood}>
          <coneGeometry args={[0.035, 0.14, 6]} />
        </mesh>
        <mesh position-y={0.8} material={m.graphite}>
          <coneGeometry args={[0.012, 0.04, 6]} />
        </mesh>
        <mesh position-y={-0.68} material={m.rose}>
          <cylinderGeometry args={[0.036, 0.036, 0.08, 12]} />
        </mesh>
      </group>
    </group>
  );
}
