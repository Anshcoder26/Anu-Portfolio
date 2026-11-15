"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Interactive } from "../desk/Interactive";
import { useTrigger } from "../desk/useTrigger";
import { getMaterials } from "../materials";
import { animatedCanvas, paintKantha } from "../textures";

const S = 0.85;
const SIZE = 320;
const STITCH_TIME = 1.8;

/**
 * Framed kantha — Bengal's running-stitch embroidery (a fish and flowers).
 * Click: a sindoor border stitches itself around the cloth.
 */
export function KanthaFrame(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const trigger = useTrigger();

  // Animates its own canvas, so it gets a private texture.
  const art = useMemo(() => animatedCanvas(SIZE, paintKantha), []);
  useEffect(() => () => art.dispose(), [art]);

  useFrame((state) => {
    const t = trigger.since(state);
    art.draw(t < STITCH_TIME ? t / STITCH_TIME : 1);
  });

  return (
    <Interactive
      name="kantha"
      label="Kantha embroidery"
      hint="Bengal's running stitch — click to stitch"
      section="Embroidery"
      sound="swoosh"
      lift={0}
      labelOffset={[0, S / 2 + 0.3, 0.15]}
      onActivate={trigger.fire}
      {...props}
    >
      {/* Frame */}
      <mesh position-z={0.02} castShadow material={m.wood}>
        <boxGeometry args={[S + 0.1, S + 0.1, 0.04]} />
      </mesh>
      <mesh position-z={0.041}>
        <planeGeometry args={[S, S]} />
        <meshStandardMaterial map={art.texture} roughness={0.95} />
      </mesh>
    </Interactive>
  );
}
