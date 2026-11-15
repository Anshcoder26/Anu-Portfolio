"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { useDesk } from "../desk/DeskContext";
import { Interactive } from "../desk/Interactive";
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

/**
 * Wooden artist's palette. Click a paint dab to load the brush with that
 * colour — the top fabric swatch on the desk gets dyed with it.
 */
export function Palette(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const { dye, setDye, enabled } = useDesk();
  const blobs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    BLOBS.forEach((b, i) => {
      const mesh = blobs.current[i];
      if (!mesh) return;
      const picked = dye === b.color;
      easing.damp3(mesh.scale, picked ? [1.35, 0.5, 1.15] : [1, 0.28, 0.85], 0.12, delta);
    });
  });

  return (
    <Interactive
      name="palette"
      label="Paint palette"
      hint="Pick a colour — it dyes the fabric swatch"
      section="Prints"
      sound="pop"
      labelOffset={[0, 0.7, 0]}
      {...props}
    >
      <mesh scale={[1.25, 1, 0.9]} castShadow receiveShadow material={m.lightWood}>
        <cylinderGeometry args={[0.8, 0.8, 0.04, 40]} />
      </mesh>
      <mesh position={[-0.6, 0.022, 0.38]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.11, 24]} />
        <meshStandardMaterial color="#5a3820" roughness={1} />
      </mesh>
      {BLOBS.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            blobs.current[i] = el;
          }}
          position={[b.pos[0], 0.025, b.pos[1]]}
          scale={[1, 0.28, 0.85]}
          castShadow
          // Bubbles up to <Interactive>, which plays the sound and shows the label.
          onClick={() => enabled && setDye(b.color)}
        >
          <sphereGeometry args={[b.r, 16, 10]} />
          <meshStandardMaterial color={b.color} roughness={0.25} />
        </mesh>
      ))}
    </Interactive>
  );
}
