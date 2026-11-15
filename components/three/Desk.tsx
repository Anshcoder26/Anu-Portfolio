"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/** Small deterministic PRNG (Park–Miller). */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** Procedural wood grain drawn to a canvas once — no texture download. */
function useWoodTexture() {
  return useMemo(() => {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#7a4a2c";
    ctx.fillRect(0, 0, w, h);

    // Deterministic pseudo-random so the grain is stable between renders.
    const rand = seededRandom(7);

    for (let i = 0; i < 140; i++) {
      const y = rand() * h;
      const amp = 2 + rand() * 6;
      const freq = 0.004 + rand() * 0.01;
      const phase = rand() * Math.PI * 2;
      const light = rand() > 0.5;
      ctx.strokeStyle = light
        ? `rgba(196, 140, 92, ${0.08 + rand() * 0.12})`
        : `rgba(60, 30, 16, ${0.1 + rand() * 0.18})`;
      ctx.lineWidth = 0.6 + rand() * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x * freq + phase) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/** Desk top (surface at y = 0, back edge against the wall), legs, cutting mat. */
export function Desk() {
  const wood = useWoodTexture();

  return (
    <group>
      <RoundedBox
        args={[14, 0.5, 9]}
        radius={0.08}
        smoothness={3}
        position={[0, -0.25, -0.5]}
        receiveShadow
      >
        <meshStandardMaterial map={wood} roughness={0.62} />
      </RoundedBox>

      {/* Green self-healing cutting mat with a grid — a fashion-studio staple */}
      <group position={[-0.2, 0.006, 0.1]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[8.6, 4.8]} />
          <meshStandardMaterial color="#2F5A45" roughness={0.9} />
        </mesh>
        <gridHelper
          args={[8.4, 42, "#7FA88E", "#4C7A62"]}
          position-y={0.002}
          scale={[1, 1, 4.6 / 8.4]}
        />
      </group>

      {/* Legs down to the floor (y = -3) */}
      {[
        [-6.6, 3.5],
        [6.6, 3.5],
        [-6.6, -4.5],
        [6.6, -4.5],
      ].map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, -1.75, z]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 2.5, 0.4]} />
          <meshStandardMaterial map={wood} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}
