"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { paintGamchha, sharedTexture } from "../textures";

const PW = 0.75; // panel width (x)
const PD = 1.0; // panel depth (z)
const T = 0.008;
const OPEN_FOR_MS = 3200;

/**
 * Gamchha — the red-and-white checked Bengal cotton towel, folded in half.
 * Click: it unfolds to show the full check, then folds itself back.
 */
export function Gamchha(props: React.JSX.IntrinsicElements["group"]) {
  const map = sharedTexture("gamchha", 512, 512, paintGamchha);
  const [open, setOpen] = useState(false);
  const flap = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), OPEN_FOR_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useFrame((state, delta) => {
    const f = flap.current;
    if (!f) return;
    easing.damp(f.rotation, "z", open ? 0 : Math.PI, 0.32, delta);
    // A soft cloth ripple while it moves.
    const moving = Math.abs(f.rotation.z - (open ? 0 : Math.PI)) > 0.02;
    f.position.y = 0.02 + (moving ? Math.sin(state.clock.elapsedTime * 18) * 0.01 : 0);
  });

  const material = <meshStandardMaterial map={map} roughness={0.95} side={THREE.DoubleSide} />;

  return (
    <Interactive
      name="gamchha"
      label="Gamchha"
      hint="Handwoven Bengal cotton — click to unfold"
      section="Weaving"
      sound="swoosh"
      lift={0.02}
      labelOffset={[0.4, 0.55, 0]}
      onActivate={() => setOpen(true)}
      {...props}
    >
      {/* Bottom half */}
      <mesh position={[PW / 2, 0.006, 0]} castShadow receiveShadow>
        <boxGeometry args={[PW, T, PD]} />
        {material}
      </mesh>
      {/* Top half — hinged on the fold line (x = PW) */}
      <group ref={flap} position={[PW, 0.02, 0]} rotation-z={Math.PI}>
        <mesh position={[PW / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[PW, T, PD]} />
          {material}
        </mesh>
      </group>
    </Interactive>
  );
}
