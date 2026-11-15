"use client";

import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCursor, useTexture } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { Phase } from "@/lib/phase";
import { COLORS, getMaterials } from "./materials";

// Landscape 5:3, matching the portfolio pages.
export const BOOK = { width: 3, depth: 1.8, block: 0.28, board: 0.045 } as const;

/** Cover angle when fully open — a touch under 180° so it reads as a hinge. */
const OPEN_ANGLE = Math.PI * 0.97;
/** Angle past which the viewer is revealed / the closing is considered done. */
const REVEAL_ANGLE = (150 * Math.PI) / 180;
const CLOSED_EPSILON = 0.03;

type Props = {
  phase: Phase;
  reducedMotion: boolean;
  onOpen: () => void;
  onOpened: () => void;
  onClosed: () => void;
};

export function Book({ phase, reducedMotion, onOpen, onOpened, onClosed }: Props) {
  const m = getMaterials();
  const lift = useRef<THREE.Group>(null);
  const cover = useRef<THREE.Group>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const fired = useRef<Phase | null>(null);
  const [hovered, setHovered] = useState(false);

  const coverMap = useTexture("/textures/book-cover.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  const interactive = phase === "intro";
  useCursor(hovered && interactive);

  const open = phase === "opening" || phase === "viewer";
  const { width: W, depth: D, block: B, board: T } = BOOK;
  const top = T + B; // height of the page block's upper face

  useFrame((state, delta) => {
    const g = lift.current;
    const c = cover.current;
    if (!g || !c) return;

    const speed = reducedMotion ? 0.001 : 1;
    const hoverOn = hovered && interactive;

    // Idle bob + hover lift while waiting on the desk.
    const bob = phase === "intro" ? Math.sin(state.clock.elapsedTime * 1.6) * 0.015 : 0;
    easing.damp(g.position, "y", (hoverOn ? 0.12 : 0) + bob, 0.18 * speed, delta);
    easing.damp(g.rotation, "x", hoverOn ? -0.05 : 0, 0.25 * speed, delta);
    if (halo.current) easing.damp(halo.current, "opacity", hoverOn ? 0.55 : 0, 0.2, delta);

    // Cover hinge: rotate about the spine (z axis), lifting the right edge over to the left.
    easing.damp(c.rotation, "z", open ? OPEN_ANGLE : 0, (open ? 0.55 : 0.45) * speed, delta);

    const angle = c.rotation.z;
    if (phase === "opening" && angle > REVEAL_ANGLE && fired.current !== "opening") {
      fired.current = "opening";
      onOpened();
    }
    if (phase === "closing" && angle < CLOSED_EPSILON && fired.current !== "closing") {
      fired.current = "closing";
      onClosed();
    }
    if (phase === "intro") fired.current = null;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!interactive) return;
    setHovered(false);
    onOpen();
  };

  return (
    <group
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Golden halo on the desk when hovered */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <planeGeometry args={[W + 0.7, D + 0.7]} />
        <meshBasicMaterial
          ref={halo}
          color={COLORS.haldi}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaMap={getHaloAlpha()}
        />
      </mesh>

      <group ref={lift}>
        {/* Back board */}
        <mesh position-y={T / 2} castShadow receiveShadow material={m.sindoor}>
          <boxGeometry args={[W, T, D]} />
        </mesh>

        {/* Page block (slightly inset, cream page edges) */}
        <mesh position={[0.03, T + B / 2, 0]} castShadow receiveShadow material={m.paper}>
          <boxGeometry args={[W - 0.1, B, D - 0.08]} />
        </mesh>
        {/* Faint page lines on the fore-edge */}
        {[0.25, 0.5, 0.75].map((f) => (
          <mesh key={f} position={[0.03, T + B * f, D / 2 - 0.035]} material={m.cream}>
            <boxGeometry args={[W - 0.12, 0.004, 0.002]} />
          </mesh>
        ))}

        {/* Ribbon bookmark peeking out of the fore-edge */}
        <mesh position={[W * 0.2, top - 0.01, D / 2 + 0.1]} rotation-x={0.35} material={m.haldi}>
          <boxGeometry args={[0.07, 0.006, 0.26]} />
        </mesh>

        {/* Spine */}
        <mesh position={[-W / 2 + 0.02, (top + T) / 2, 0]} castShadow material={m.sindoor}>
          <boxGeometry args={[0.06, top + T, D]} />
        </mesh>

        {/* Front cover — pivots on the spine edge */}
        <group ref={cover} position={[-W / 2, top, 0]}>
          <mesh position={[W / 2, T / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, T, D]} />
            {/* Box face order: +x, -x, +y, -y, +z, -z */}
            <meshStandardMaterial attach="material-0" color={COLORS.sindoor} roughness={0.6} />
            <meshStandardMaterial attach="material-1" color={COLORS.sindoor} roughness={0.6} />
            <meshStandardMaterial attach="material-2" map={coverMap} roughness={0.55} />
            <meshStandardMaterial attach="material-3" color={COLORS.cream} roughness={0.9} />
            <meshStandardMaterial attach="material-4" color={COLORS.sindoor} roughness={0.6} />
            <meshStandardMaterial attach="material-5" color={COLORS.sindoor} roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

let haloAlpha: THREE.Texture | null = null;
/** Soft radial falloff used as the halo's alpha map (built once). */
function getHaloAlpha() {
  if (haloAlpha) return haloAlpha;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  haloAlpha = new THREE.CanvasTexture(canvas);
  return haloAlpha;
}
