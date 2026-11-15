"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useTrigger } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";

const W = 0.9;
const H = 1.15;
const WARPS = 13;
const ROW_H = 0.07;
const MAX_ROWS = 13;
const START_ROWS = 6;
const PASS = 0.75; // seconds for the shuttle to cross
const WEFT = [COLORS.sindoor, COLORS.haldi, COLORS.teal, COLORS.cream, COLORS.indigo, "#E58A3A", COLORS.rose];

/**
 * A small tapestry loom on the wall. Click: the shuttle crosses the warp and
 * weaves one more row (it starts over once the piece is full).
 */
export function WallLoom(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const [rows, setRows] = useState(START_ROWS);
  const trigger = useTrigger();
  const shuttle = useRef<THREE.Group>(null);
  const busy = useRef(false);
  const innerW = W - 0.16;
  const baseY = -H / 2 + 0.14;

  useFrame((state) => {
    const s = shuttle.current;
    if (!s) return;
    const t = trigger.since(state);
    const active = t < PASS;
    s.visible = active;
    if (active) {
      const dir = rows % 2 ? -1 : 1;
      const p = t / PASS;
      s.position.x = dir * (-innerW / 2 - 0.1 + p * (innerW + 0.2));
      s.position.y = baseY + rows * ROW_H + ROW_H / 2;
      s.rotation.z = Math.sin(p * Math.PI * 6) * 0.05;
    }
  });

  return (
    <Interactive
      name="loom"
      label="Tapestry loom"
      hint="Click to weave a row"
      section="Weaving"
      sound="knock"
      lift={0}
      labelOffset={[0, H / 2 + 0.3, 0.15]}
      onActivate={() => {
        if (busy.current) return;
        busy.current = true;
        trigger.fire();
        window.setTimeout(() => {
          setRows((r) => (r >= MAX_ROWS ? 3 : r + 1));
          busy.current = false;
        }, PASS * 1000);
      }}
      {...props}
    >
      {/* Frame */}
      {[
        [0, H / 2, W, 0.07],
        [0, -H / 2, W, 0.07],
        [-W / 2, 0, 0.07, H],
        [W / 2, 0, 0.07, H],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.04]} castShadow material={m.lightWood}>
          <boxGeometry args={[w, h, 0.06]} />
        </mesh>
      ))}

      {/* Warp threads */}
      {Array.from({ length: WARPS }, (_, i) => (
        <mesh key={i} position={[-innerW / 2 + (i * innerW) / (WARPS - 1), 0, 0.05]}>
          <boxGeometry args={[0.008, H - 0.08, 0.004]} />
          <meshStandardMaterial color="#EFE6D2" roughness={1} />
        </mesh>
      ))}

      {/* Woven rows */}
      {Array.from({ length: rows }, (_, i) => (
        <mesh key={i} position={[0, baseY + i * ROW_H + ROW_H / 2, 0.056]} castShadow>
          <boxGeometry args={[innerW + 0.02, ROW_H * 0.92, 0.014]} />
          <meshStandardMaterial color={WEFT[i % WEFT.length]} roughness={0.95} />
        </mesh>
      ))}

      {/* Shuttle */}
      <group ref={shuttle} visible={false} position-z={0.08}>
        <mesh castShadow material={m.wood}>
          <boxGeometry args={[0.22, 0.045, 0.03]} />
        </mesh>
        <mesh position-x={0.12} rotation-z={-Math.PI / 2} material={m.wood}>
          <coneGeometry args={[0.022, 0.05, 6]} />
        </mesh>
        <mesh position-x={-0.12} rotation-z={Math.PI / 2} material={m.wood}>
          <coneGeometry args={[0.022, 0.05, 6]} />
        </mesh>
      </group>
    </Interactive>
  );
}
