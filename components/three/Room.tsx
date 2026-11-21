"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Atmosphere } from "./atmosphere";
import { Interactive } from "./desk/Interactive";
import { getMaterials } from "./materials";

/** Back wall plane (front face) — the desk's back edge sits against it. */
export const WALL_Z = -5.05;
/** Window opening in the back wall, left of the desk. */
export const WINDOW = { x0: -6.4, x1: -2.4, y0: 0.9, y1: 3.9 } as const;

const WALL_T = 0.2;
const FLOOR_Y = -3;
const ROOM = { x0: -7.1, x1: 7.1, top: 11, front: 12 };

/** Paints the view outside: sky gradient, sun or moon + stars, rolling hills. */
export function drawSky(a: Atmosphere) {
  const w = 512;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  a.sky.forEach((c, i) => grad.addColorStop(i / (a.sky.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (a.stars) {
    let s = 11;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.6})`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h * 0.7, rand() * 1.3 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const disc = (x: number, y: number, r: number, color: string, glow: string) => {
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 4);
    g.addColorStop(0, glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  if (a.sun) disc(a.sun.x * w, a.sun.y * h, a.sun.r * w, a.sun.color, a.sun.glow);
  if (a.moon) {
    const mx = w * 0.68;
    const my = h * 0.28;
    const mr = w * 0.07;
    disc(mx, my, mr, "#f4f1e4", "rgba(190, 210, 255, 0.35)");
    ctx.fillStyle = "rgba(170, 170, 160, 0.35)";
    for (const [dx, dy, r] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.35, 0.12]]) {
      ctx.beginPath();
      ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Two layers of hills along the horizon.
  const hill = (base: number, amp: number, freq: number, phase: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3) * amp * 0.4);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  };
  hill(h * 0.8, 14, 0.012, 1, a.hills[0]);
  hill(h * 0.9, 10, 0.02, 3, a.hills[1]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One solid box of wall, positioned by its min/max extents. */
function WallBox({ x0, x1, y0, y1, color }: { x0: number; x1: number; y0: number; y1: number; color: string }) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, WALL_Z - WALL_T / 2]} castShadow receiveShadow>
      <boxGeometry args={[x1 - x0, y1 - y0, WALL_T]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

/**
 * The study: white back wall with a window on the left (its view follows the
 * time of day), side walls, wooden floor. The back wall casts shadows, so the
 * window light lands on the desk as a window-shaped patch.
 */
export function Room({ atmosphere: a, onWindowClick }: { atmosphere: Atmosphere; onWindowClick?: () => void }) {
  const m = getMaterials();
  const sky = useMemo(() => drawSky(a), [a]);
  useEffect(() => () => sky.dispose(), [sky]);

  const { x0, x1, y0, y1 } = WINDOW;
  const wx = (x0 + x1) / 2;
  const wy = (y0 + y1) / 2;
  const frame = 0.12;

  return (
    <group>
      {/* Back wall in four pieces around the window opening */}
      <WallBox x0={ROOM.x0} x1={x0} y0={FLOOR_Y} y1={ROOM.top} color={a.wall} />
      <WallBox x0={x1} x1={ROOM.x1} y0={FLOOR_Y} y1={ROOM.top} color={a.wall} />
      <WallBox x0={x0} x1={x1} y0={FLOOR_Y} y1={y0} color={a.wall} />
      <WallBox x0={x0} x1={x1} y0={y1} y1={ROOM.top} color={a.wall} />

      {/* Side walls */}
      {[ROOM.x0, ROOM.x1].map((x, i) => (
        <mesh
          key={x}
          position={[x, (FLOOR_Y + ROOM.top) / 2, (WALL_Z + ROOM.front) / 2]}
          rotation-y={i === 0 ? Math.PI / 2 : -Math.PI / 2}
          receiveShadow
        >
          <planeGeometry args={[ROOM.front - WALL_Z, ROOM.top - FLOOR_Y]} />
          <meshStandardMaterial color={a.wall} roughness={0.95} />
        </mesh>
      ))}

      {/* Floor */}
      <mesh position={[0, FLOOR_Y, (WALL_Z + ROOM.front) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.front - WALL_Z]} />
        <meshStandardMaterial color="#6b4430" roughness={0.8} />
      </mesh>
      {/* Skirting board */}
      <mesh position={[0, FLOOR_Y + 0.12, WALL_Z + 0.03]} receiveShadow material={m.wood}>
        <boxGeometry args={[ROOM.x1 - ROOM.x0, 0.24, 0.06]} />
      </mesh>

      {/* The view outside (unlit, so it reads as bright sky). Click to change the time of day. */}
      <Interactive
        name="window"
        label="Window"
        hint="Click to change the time of day"
        sound="chime"
        lift={0}
        labelOffset={[wx, wy + 0.4, WALL_Z + 0.3]}
        onActivate={onWindowClick}
      >
        {/* Invisible pane exactly the size of the opening = the click target */}
        <mesh position={[wx, wy, WALL_Z - 0.05]}>
          <planeGeometry args={[x1 - x0, y1 - y0]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Interactive>
      <mesh position={[wx, wy, WALL_Z - 0.9]}>
        <planeGeometry args={[(x1 - x0) * 1.6, (y1 - y0) * 1.6]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>

      {/* Window frame, mullions and sill */}
      <group position={[wx, wy, WALL_Z + 0.02]}>
        {[
          [0, (y1 - y0) / 2, x1 - x0 + frame * 2, frame],
          [0, -(y1 - y0) / 2, x1 - x0 + frame * 2, frame],
          [-(x1 - x0) / 2, 0, frame, y1 - y0],
          [(x1 - x0) / 2, 0, frame, y1 - y0],
          [0, 0, frame * 0.6, y1 - y0],
          [0, (y1 - y0) * 0.12, x1 - x0, frame * 0.6],
        ].map(([px, py, sx, sy], i) => (
          <mesh key={i} position={[px, py, 0]} castShadow material={m.cream}>
            <boxGeometry args={[sx, sy, 0.14]} />
          </mesh>
        ))}
        <mesh position={[0, -(y1 - y0) / 2 - 0.06, 0.16]} castShadow receiveShadow material={m.cream}>
          <boxGeometry args={[x1 - x0 + 0.5, 0.08, 0.4]} />
        </mesh>
      </group>

      {/* Curtain gathered at the window's left side, on a brass rod */}
      <mesh position={[x0 - 0.35, wy + 0.2, WALL_Z + 0.18]} castShadow>
        <boxGeometry args={[0.55, y1 - y0 + 1.4, 0.12]} />
        <meshStandardMaterial color="#a6232a" roughness={0.9} />
      </mesh>
      <mesh position={[wx, y1 + 0.35, WALL_Z + 0.26]} rotation-z={Math.PI / 2} material={m.brass}>
        <cylinderGeometry args={[0.03, 0.03, (x1 - x0) + 1.6, 8]} />
      </mesh>
    </group>
  );
}
