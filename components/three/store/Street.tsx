"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { Atmosphere } from "../atmosphere";
import { useTrigger } from "../desk/useTrigger";
import { getMaterials } from "../materials";
import { BagBody } from "../props/OnayakhiBag";
import { MugBody } from "../props/OnayakhiMug";
import { drawSky } from "../Room";
import { sharedTexture } from "../textures";
import { MarigoldGarland } from "../wall/MarigoldGarland";
import {
  paintAwning,
  paintGlassLettering,
  paintOpen,
  paintPaving,
  paintRoad,
  paintSignboard,
} from "./storeTextures";

/** Shopfront plane (front face). The shop interior is behind it (z < FACADE_Z). */
export const FACADE_Z = -1;
const FACADE_T = 0.3;
/** Half-width of the shophouse — matches the interior (SHOP in Interior.tsx). */
const HALF = 5;
const DOOR = { x: 0.75, h: 2.6 };
const SHOP_WINDOW = { x0: 1.4, x1: 3.3, y0: 0.7, y1: 2.6 };
const GROUND_H = 3.6;
const TOP = 7.2;
const PLASTER = "#EFE2C9";
const TRIM = "#7A1C22";

/** A box given by its min/max extents. */
function Slab({
  x0, x1, y0, y1, z0 = FACADE_Z - FACADE_T, z1 = FACADE_Z, color = PLASTER, material,
}: {
  x0: number; x1: number; y0: number; y1: number; z0?: number; z1?: number; color?: string; material?: THREE.Material;
}) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} castShadow receiveShadow material={material}>
      <boxGeometry args={[x1 - x0, y1 - y0, z1 - z0]} />
      {!material && <meshStandardMaterial color={color} roughness={0.92} />}
    </mesh>
  );
}

function repeatTexture(t: THREE.Texture, x: number, y: number) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(x, y);
  c.needsUpdate = true;
  return c;
}

/** Two-leaf wooden door with glass panes; swings inward when we step inside. */
function Doors({ open, onEnter, enabled }: { open: boolean; onEnter: () => void; enabled: boolean }) {
  const leaves = useRef<(THREE.Group | null)[]>([]);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && enabled);
  const sign = sharedTexture("store-open", 256, 128, paintOpen, { fonts: true });

  useFrame((_, delta) => {
    leaves.current.forEach((g, i) => {
      if (!g) return;
      const s = i ? -1 : 1;
      const ajar = hovered && enabled ? 0.12 : 0;
      easing.damp(g.rotation, "y", s * (open ? 1.75 : ajar), open ? 0.35 : 0.2, delta);
    });
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (enabled) onEnter();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {[-1, 1].map((s, i) => (
        // Hinge at the outer edge of the opening
        <group
          key={s}
          ref={(el) => {
            leaves.current[i] = el;
          }}
          position={[s * DOOR.x, 0, FACADE_Z - 0.12]}
        >
          <group position-x={-s * (DOOR.x / 2)}>
            <mesh position-y={DOOR.h / 2} castShadow>
              <boxGeometry args={[DOOR.x - 0.02, DOOR.h, 0.06]} />
              <meshStandardMaterial color="#6B3A1E" roughness={0.6} />
            </mesh>
            {/* Glass pane */}
            <mesh position={[0, DOOR.h * 0.62, 0.035]}>
              <planeGeometry args={[DOOR.x - 0.2, DOOR.h * 0.5]} />
              <meshStandardMaterial color="#cfe3e6" roughness={0.05} metalness={0.2} transparent opacity={0.35} />
            </mesh>
            {/* Brass handle */}
            <mesh position={[-s * (DOOR.x / 2 - 0.1), DOOR.h * 0.45, 0.06]} material={getMaterials().brass}>
              <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
            </mesh>
            {/* "Open" board on the left leaf */}
            {i === 0 && (
              <mesh position={[0, DOOR.h * 0.3, 0.04]}>
                <planeGeometry args={[0.42, 0.21]} />
                <meshStandardMaterial map={sign} roughness={0.8} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  );
}

/** Street lamp; glows (and lights the pavement) in the evening and at night. */
function StreetLamp({ on, ...props }: React.JSX.IntrinsicElements["group"] & { on: boolean }) {
  const m = getMaterials();
  return (
    <group {...props}>
      <mesh position-y={2.1} castShadow material={m.ink}>
        <cylinderGeometry args={[0.05, 0.08, 4.2, 10]} />
      </mesh>
      <mesh position={[0, 4.15, 0.3]} rotation-x={Math.PI / 2} material={m.ink}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
      </mesh>
      <mesh position={[0, 4.05, 0.55]}>
        <coneGeometry args={[0.22, 0.25, 12, 1, true]} />
        <meshStandardMaterial color="#1B1410" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.95, 0.55]}>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshStandardMaterial color="#fff1c8" emissive="#ffcf7a" emissiveIntensity={on ? 3 : 0.2} toneMapped={!on} />
      </mesh>
      {on && <pointLight position={[0, 3.8, 0.55]} intensity={14} distance={9} decay={1.6} color="#ffcf8a" />}
    </group>
  );
}

function Tree(props: React.JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      <mesh position-y={1.3} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 2.6, 8]} />
        <meshStandardMaterial color="#5a3b22" roughness={0.9} />
      </mesh>
      {[
        [0, 3.1, 0, 1.1],
        [-0.6, 2.7, 0.2, 0.8],
        [0.6, 2.8, -0.1, 0.85],
        [0.1, 3.7, 0.1, 0.75],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? "#4f7a3a" : "#3e6b33"} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Plant(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  return (
    <group {...props}>
      <mesh position-y={0.22} castShadow material={m.terracotta}>
        <cylinderGeometry args={[0.22, 0.16, 0.44, 14]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin(i * 2.1) * 0.1, 0.6 + i * 0.12, Math.cos(i * 2.1) * 0.1]} castShadow>
          <icosahedronGeometry args={[0.2 - i * 0.03, 1]} />
          <meshStandardMaterial color="#4f8a3a" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A neighbouring building: a coloured block with a grid of windows. */
function Neighbour({ x0, x1, h, color, lit, z = FACADE_Z }: { x0: number; x1: number; h: number; color: string; lit: boolean; z?: number }) {
  const cols = Math.max(1, Math.floor((x1 - x0) / 1.6));
  const rows = Math.max(1, Math.floor((h - 1) / 1.8));
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, h / 2, z - 3]} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0, h, 6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const glow = lit && (i * 7) % 3 !== 0;
        return (
          <mesh key={i} position={[x0 + ((c + 0.5) * (x1 - x0)) / cols, 1.6 + r * 1.8, z + 0.01]}>
            <planeGeometry args={[0.7, 0.95]} />
            <meshStandardMaterial
              color={glow ? "#ffd58a" : "#3c4a5a"}
              emissive={glow ? "#ffb54a" : "#000000"}
              emissiveIntensity={glow ? 1.2 : 0}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * The street outside Onayakhi: road, footpath, the shophouse with its
 * "Onayakhi.com" board, striped awning, display windows, and neighbours.
 */
export function Street({
  atmosphere: a,
  open,
  enabled,
  onEnter,
}: {
  atmosphere: Atmosphere;
  /** Doors swing open (we're stepping in / inside). */
  open: boolean;
  /** Door clickable (on the street, curtain up). */
  enabled: boolean;
  onEnter: () => void;
}) {
  const m = getMaterials();
  const night = a.lamp > 0;
  const sky = useMemo(() => drawSky(a), [a]);
  useEffect(() => () => sky.dispose(), [sky]);

  const board = sharedTexture("store-board", 1280, 274, paintSignboard, { fonts: true });
  const awning = sharedTexture("store-awning", 512, 64, paintAwning);
  const glass = sharedTexture("store-glass", 512, 256, paintGlassLettering, { fonts: true });
  const paving = useMemo(() => repeatTexture(sharedTexture("store-paving", 512, 512, paintPaving), 12, 2), []);
  const road = useMemo(() => repeatTexture(sharedTexture("store-road", 512, 256, paintRoad), 14, 1), []);
  // Window display products (static — the street isn't interactive except the door).
  const still = useTrigger();

  const { x0: wx0, x1: wx1, y0: wy0, y1: wy1 } = SHOP_WINDOW;

  return (
    <group>
      {/* Sky far behind the rooftops */}
      <mesh position={[0, 9, -40]}>
        <planeGeometry args={[120, 50]} />
        <meshBasicMaterial map={sky} toneMapped={false} fog={false} />
      </mesh>

      {/* Ground: footpath in front of the shop, road, far footpath, open ground */}
      <mesh position={[0, 0, 0.75]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 3.5]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.06, 2.55]} castShadow receiveShadow>
        <boxGeometry args={[60, 0.12, 0.18]} />
        <meshStandardMaterial color="#bdb3a3" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.12, 5.8]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 6.4]} />
        <meshStandardMaterial map={road} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 10]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.02, 35]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[120, 48]} />
        <meshStandardMaterial color="#7f876c" roughness={1} />
      </mesh>

      {/* ── The shophouse ── */}
      {/* Ground floor around the door + two display windows */}
      <Slab x0={-HALF} x1={-wx1} y0={0} y1={wy1} />
      <Slab x0={wx1} x1={HALF} y0={0} y1={wy1} />
      <Slab x0={-wx0} x1={-DOOR.x} y0={0} y1={wy1} />
      <Slab x0={DOOR.x} x1={wx0} y0={0} y1={wy1} />
      <Slab x0={-wx1} x1={-wx0} y0={0} y1={wy0} color={TRIM} />
      <Slab x0={wx0} x1={wx1} y0={0} y1={wy0} color={TRIM} />
      <Slab x0={-HALF} x1={HALF} y0={wy1} y1={GROUND_H} />
      {/* Upper storey */}
      <Slab x0={-HALF} x1={HALF} y0={GROUND_H} y1={TOP} color="#E8D3B0" />
      {/* Cornice + parapet + floor band */}
      <Slab x0={-HALF - 0.15} x1={HALF + 0.15} y0={TOP} y1={TOP + 0.22} z0={FACADE_Z - FACADE_T} z1={FACADE_Z + 0.2} color={TRIM} />
      <Slab x0={-HALF - 0.1} x1={HALF + 0.1} y0={GROUND_H - 0.08} y1={GROUND_H + 0.08} z0={FACADE_Z - FACADE_T} z1={FACADE_Z + 0.12} color={TRIM} />
      {/* Plinth step at the door */}
      <Slab x0={-1.1} x1={1.1} y0={0} y1={0.08} z0={FACADE_Z} z1={FACADE_Z + 0.45} color="#a99a85" />

      {/* Upper windows with green shutters (lit at night) */}
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, 5.55, FACADE_Z + 0.01]}>
          <mesh>
            <planeGeometry args={[0.9, 1.3]} />
            <meshStandardMaterial
              color={night ? "#ffd58a" : "#5d7480"}
              emissive={night ? "#ffb54a" : "#000"}
              emissiveIntensity={night ? 1.1 : 0}
              roughness={0.2}
            />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.68, 0, 0.03]} castShadow>
              <boxGeometry args={[0.42, 1.36, 0.05]} />
              <meshStandardMaterial color="#2F6B5A" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, -0.74, 0.08]} castShadow>
            <boxGeometry args={[1.2, 0.08, 0.2]} />
            <meshStandardMaterial color={TRIM} />
          </mesh>
        </group>
      ))}

      {/* Signboard: the Onayakhi wordmark, ringed with bulbs */}
      <group position={[0, 4.35, FACADE_Z + 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[5.6, 1.2, 0.1]} />
          <meshStandardMaterial attach="material-0" color={TRIM} />
          <meshStandardMaterial attach="material-1" color={TRIM} />
          <meshStandardMaterial attach="material-2" color={TRIM} />
          <meshStandardMaterial attach="material-3" color={TRIM} />
          <meshStandardMaterial attach="material-4" map={board} roughness={0.85} />
          <meshStandardMaterial attach="material-5" color={TRIM} />
        </mesh>
        {Array.from({ length: 22 }, (_, i) => {
          const t = i / 22;
          // Walk the board's outline
          const per = 2 * (5.6 + 1.2);
          let d = t * per;
          let x: number;
          let y: number;
          if (d < 5.6) [x, y] = [-2.8 + d, 0.66];
          else if ((d -= 5.6) < 1.2) [x, y] = [2.86, 0.6 - d];
          else if ((d -= 1.2) < 5.6) [x, y] = [2.8 - d, -0.66];
          else [x, y] = [-2.86, -0.6 + (d - 5.6)];
          return (
            <mesh key={i} position={[x, y, 0.08]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <meshStandardMaterial
                color="#fff1c8"
                emissive="#ffc45a"
                emissiveIntensity={night ? 2.5 : 0.15}
                toneMapped={!night}
              />
            </mesh>
          );
        })}
        {night && <pointLight position={[0, -0.2, 1.2]} intensity={6} distance={6} color="#ffc46a" />}
      </group>

      {/* Striped awning over the windows and door, sloping out */}
      <group position={[0, 3.05, FACADE_Z]}>
        <mesh position={[0, 0, 0.55]} rotation-x={0.5} castShadow receiveShadow>
          <planeGeometry args={[HALF * 2 - 0.4, 1.25]} />
          <meshStandardMaterial map={awning} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        {/* Scalloped valance */}
        {Array.from({ length: 24 }, (_, i) => (
          <mesh key={i} position={[-HALF + 0.4 + i * 0.4, -0.33, 1.1]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={i % 2 ? "#F6EBD3" : "#A6232A"} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Marigold toran over the door */}
      <MarigoldGarland from={[-DOOR.x, DOOR.h + 0.02, FACADE_Z]} to={[DOOR.x, DOOR.h + 0.02, FACADE_Z]} sag={0.18} />

      {/* Display windows: glass with gold lettering, products on plinths behind */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[(s * (wx0 + wx1)) / 2, (wy0 + wy1) / 2, FACADE_Z - 0.15]}>
            <planeGeometry args={[wx1 - wx0, wy1 - wy0]} />
            <meshStandardMaterial color="#d8ecef" roughness={0.05} metalness={0.3} transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <mesh position={[(s * (wx0 + wx1)) / 2, wy1 - 0.35, FACADE_Z - 0.14]}>
            <planeGeometry args={[1.5, 0.75]} />
            <meshBasicMaterial map={glass} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[(s * (wx0 + wx1)) / 2, wy0 + 0.2, FACADE_Z - 0.7]} castShadow receiveShadow material={m.cream}>
            <boxGeometry args={[1.0, 0.4 + wy0, 0.6]} />
          </mesh>
        </group>
      ))}
      <group position={[-(wx0 + wx1) / 2, wy0 + 0.4, FACADE_Z - 0.7]} rotation-y={0.35} scale={1.6}>
        <MugBody trigger={still} steam={false} />
      </group>
      <group position={[(wx0 + wx1) / 2, wy0 + 0.4, FACADE_Z - 0.7]} rotation-y={-0.25} scale={1.05}>
        <BagBody trigger={still} />
      </group>

      {/* Doors, pots either side */}
      <Doors open={open} enabled={enabled} onEnter={onEnter} />
      <Plant position={[-1.05, 0, FACADE_Z + 0.35]} />
      <Plant position={[1.05, 0, FACADE_Z + 0.35]} />

      {/* Neighbours, a tree and a street lamp */}
      <Neighbour x0={-10.5} x1={-HALF - 0.05} h={6.2} color="#D7A98A" lit={night} />
      <Neighbour x0={HALF + 0.05} x1={11} h={8.4} color="#9EB7AE" lit={night} />
      <Neighbour x0={-18} x1={-10.55} h={9.5} color="#C9C0A6" lit={night} z={FACADE_Z - 0.6} />
      <Neighbour x0={11.05} x1={19} h={5.5} color="#D9B66E" lit={night} z={FACADE_Z - 0.4} />
      <Tree position={[-6.4, 0, 1.6]} />
      <StreetLamp position={[6.3, 0, 1.9]} rotation-y={Math.PI} on={night} />
      <StreetLamp position={[-10.5, 0, 1.9]} rotation-y={Math.PI} on={night} />
    </group>
  );
}
