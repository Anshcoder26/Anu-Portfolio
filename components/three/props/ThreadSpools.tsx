"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { smooth, useTrigger } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";

const SPOOLS: { pos: [number, number, number]; color: string; lying?: boolean }[] = [
  { pos: [0, 0, 0], color: COLORS.sindoor },
  { pos: [0.42, 0, 0.12], color: COLORS.haldi },
  { pos: [0.2, 0, -0.38], color: COLORS.teal },
  { pos: [-0.5, 0.12, 0.35], color: COLORS.indigo, lying: true },
];

/** Thread run (local coords): from the red spool out across the mat. */
const THREAD_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.12, 0.18, 0.02),
  new THREE.Vector3(0.45, 0.02, 0.35),
  new THREE.Vector3(0.7, 0.012, 0.95),
  new THREE.Vector3(0.35, 0.012, 1.45),
  new THREE.Vector3(0.95, 0.012, 1.9),
]);
const TUBE_SEGMENTS = 120;
const RADIAL = 5;
const OUT = 0.9;
const HOLD = 1.6;
const BACK = 0.7;

function Spool({ color }: { color: string }) {
  const m = getMaterials();
  return (
    <group>
      {[-0.17, 0.17].map((y) => (
        <mesh key={y} position-y={y} castShadow receiveShadow material={m.lightWood}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 20]} />
        </mesh>
      ))}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 20]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  );
}

/**
 * Thread spools. Click: the red spool spins and its thread unrolls across the
 * mat, holds, then winds back in.
 */
export function ThreadSpools(props: React.JSX.IntrinsicElements["group"]) {
  const trigger = useTrigger();
  const spinner = useRef<THREE.Group>(null);
  const thread = useMemo(() => new THREE.TubeGeometry(THREAD_PATH, TUBE_SEGMENTS, 0.012, RADIAL, false), []);
  const total = thread.index?.count ?? 0;

  useFrame((state, delta) => {
    const t = trigger.since(state);
    let p = 0;
    if (t < OUT) p = t / OUT;
    else if (t < OUT + HOLD) p = 1;
    else if (t < OUT + HOLD + BACK) p = 1 - (t - OUT - HOLD) / BACK;
    const ring = RADIAL * 6;
    thread.setDrawRange(0, Math.floor((total * smooth(p)) / ring) * ring);
    if (spinner.current) {
      if (t < OUT) spinner.current.rotation.y += delta * 14;
      else if (t > OUT + HOLD && t < OUT + HOLD + BACK) spinner.current.rotation.y -= delta * 18;
    }
  });

  return (
    <Interactive
      name="spools"
      label="Thread spools"
      hint="Click to unspool a thread"
      section="Embroidery"
      sound="swoosh"
      labelOffset={[0.1, 0.85, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      {SPOOLS.map((s, i) => (
        <group
          key={i}
          ref={i === 0 ? spinner : undefined}
          position={[s.pos[0], s.lying ? 0.15 : 0.19, s.pos[2]]}
          rotation={s.lying ? [Math.PI / 2, 0, 0.6] : [0, 0, 0]}
        >
          <Spool color={s.color} />
        </group>
      ))}
      <mesh geometry={thread} castShadow>
        <meshStandardMaterial color={COLORS.sindoor} roughness={0.8} />
      </mesh>
    </Interactive>
  );
}
