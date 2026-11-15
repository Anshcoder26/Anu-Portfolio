"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { COLORS, getMaterials } from "../materials";
import { paintCroquis, sharedTexture } from "../textures";

const W = 1.5;
const D = 2;
const RINGS = 11;
const OPEN_ANGLE = 2.7; // radians the cover swings back over the spiral

/**
 * Spiral sketchbook. Click: the cover swings open on its spiral binding to
 * reveal a fashion croquis; click again to close.
 */
export function Sketchbook(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const [open, setOpen] = useState(false);
  const cover = useRef<THREE.Group>(null);
  const sketch = sharedTexture("croquis", 512, 680, paintCroquis, { fonts: true });

  useFrame((_, delta) => {
    if (cover.current) easing.damp(cover.current.rotation, "x", open ? -OPEN_ANGLE : 0, 0.28, delta);
  });

  return (
    <Interactive
      name="sketchbook"
      label="Sketchbook"
      hint={open ? "Click to close" : "Click to peek inside"}
      page={2}
      sound="paper"
      labelOffset={[0, 0.9, -0.3]}
      onActivate={() => setOpen((o) => !o)}
      {...props}
    >
      {/* Back board + pages */}
      <mesh position-y={0.02} castShadow receiveShadow material={m.ink}>
        <boxGeometry args={[W, 0.04, D]} />
      </mesh>
      <mesh position-y={0.075} castShadow receiveShadow material={m.paper}>
        <boxGeometry args={[W - 0.04, 0.07, D - 0.06]} />
      </mesh>
      {/* First page: the croquis (revealed when the cover opens) */}
      <mesh position-y={0.1105} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.08, D - 0.12]} />
        <meshStandardMaterial map={sketch} roughness={0.95} />
      </mesh>

      {/* Cover — hinged along the spiral edge (z = -D/2) */}
      <group ref={cover} position={[0, 0.125, -D / 2]}>
        <group position-z={D / 2}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[W, 0.03, D]} />
            <meshStandardMaterial color={COLORS.teal} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.016, 0.25]} rotation-x={-Math.PI / 2} material={m.cream}>
            <planeGeometry args={[0.8, 0.35]} />
          </mesh>
        </group>
      </group>

      {/* Spiral binding */}
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          position={[-W / 2 + 0.15 + (i * (W - 0.3)) / (RINGS - 1), 0.075, -D / 2 + 0.02]}
          rotation-y={Math.PI / 2}
          material={m.steel}
        >
          <torusGeometry args={[0.08, 0.012, 6, 16]} />
        </mesh>
      ))}

      {/* Pencil resting beside the book */}
      <group position={[W / 2 + 0.18, 0.036, 0.15]} rotation={[Math.PI / 2, 0, 0.12]}>
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
    </Interactive>
  );
}
