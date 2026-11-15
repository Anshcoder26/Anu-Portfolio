"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useTrigger } from "../desk/useTrigger";
import { animatedCanvas, paintAlpona } from "../textures";

const R = 0.36;
const DRAW_TIME = 2.2;
const SIZE = 256;

/**
 * Terracotta coaster painted with alpona (Bengali rice-paste floor art).
 * Click: it spins and the motif redraws itself stroke by stroke.
 */
export function AlponaCoaster(props: React.JSX.IntrinsicElements["group"]) {
  const trigger = useTrigger();
  const disc = useRef<THREE.Group>(null);

  // This coaster animates its own canvas, so it gets a private texture.
  const art = useMemo(() => animatedCanvas(SIZE, paintAlpona), []);
  useEffect(() => () => art.dispose(), [art]);

  useFrame((state, delta) => {
    const t = trigger.since(state);
    if (disc.current && t < 1.6) disc.current.rotation.y += delta * 9 * Math.exp(-t * 2);
    art.draw(t < DRAW_TIME ? Math.max(0, (t - 0.2) / (DRAW_TIME - 0.2)) : 1);
  });

  return (
    <Interactive
      name="alpona"
      label="Alpona coaster"
      hint="Bengali rice-paste art — click to redraw"
      page={4}
      sound="chime"
      lift={0.04}
      labelOffset={[0, 0.55, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      <group ref={disc}>
        <mesh position-y={0.015} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, 0.03, 40]} />
          {/* Cylinder groups: 0 side, 1 top, 2 bottom */}
          <meshStandardMaterial attach="material-0" color="#8E3A22" roughness={0.9} />
          <meshStandardMaterial attach="material-1" map={art.texture} roughness={0.85} />
          <meshStandardMaterial attach="material-2" color="#8E3A22" roughness={0.9} />
        </mesh>
      </group>
    </Interactive>
  );
}
