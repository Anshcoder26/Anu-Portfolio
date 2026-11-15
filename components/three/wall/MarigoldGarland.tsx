"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import * as THREE from "three";

const COUNT = 30;
const ORANGE = "#F07A1A";
const YELLOW = "#F6BE2C";

/**
 * Genda phool (marigold) garland draped across the wall — a festive Bengali
 * touch. Marigolds are instanced (one draw call); the string sways gently.
 */
export function MarigoldGarland({
  from,
  to,
  sag = 0.22,
}: {
  from: [number, number, number];
  to: [number, number, number];
  sag?: number;
}) {
  const group = useRef<THREE.Group>(null);

  const flowers = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return Array.from({ length: COUNT }, (_, i) => {
      const t = i / (COUNT - 1);
      const p = a.clone().lerp(b, t);
      p.y -= sag * 4 * t * (1 - t); // parabola ≈ catenary for a short drape
      p.z += 0.07;
      return { p, color: i % 3 === 2 ? YELLOW : ORANGE, s: 0.9 + ((i * 37) % 10) / 40 };
    });
  }, [from, to, sag]);

  useFrame((state) => {
    if (group.current) group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.9) * 0.025;
  });

  return (
    <group ref={group}>
      <Instances limit={COUNT} castShadow>
        <icosahedronGeometry args={[0.065, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {flowers.map((f, i) => (
          <Instance key={i} position={f.p} color={f.color} scale={f.s} />
        ))}
      </Instances>
      {/* Leaf tassels at each end */}
      {[from, to].map((end, i) => (
        <mesh key={i} position={[end[0], end[1] - 0.12, end[2] + 0.07]} rotation-z={i ? -0.3 : 0.3}>
          <coneGeometry args={[0.05, 0.22, 5]} />
          <meshStandardMaterial color="#3E7B3A" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
