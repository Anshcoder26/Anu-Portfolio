"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useTrigger, wobble } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";

const BRUSHES: { tilt: [number, number]; length: number; handle: string; tip: string }[] = [
  { tilt: [0.18, 0.1], length: 1.5, handle: COLORS.sindoor, tip: COLORS.ink },
  { tilt: [-0.12, 0.2], length: 1.35, handle: COLORS.haldi, tip: COLORS.teal },
  { tilt: [0.05, -0.22], length: 1.6, handle: COLORS.ink, tip: COLORS.rose },
  { tilt: [-0.2, -0.08], length: 1.25, handle: COLORS.teal, tip: COLORS.haldi },
  { tilt: [0.22, -0.15], length: 1.4, handle: "#C79A6B", tip: COLORS.indigo },
];

/** Terracotta jar of brushes. Click: the brushes rattle. */
export function BrushJar(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const H = 0.75;
  const trigger = useTrigger();
  const brushes = useRef<(THREE.Group | null)[]>([]);
  const jar = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = trigger.since(state);
    if (t > 2.5) return;
    BRUSHES.forEach((b, i) => {
      const g = brushes.current[i];
      if (!g) return;
      const ti = t - i * 0.05;
      g.rotation.x = b.tilt[0] + wobble(ti, 0.18, 5 + i * 0.7, 0.45);
      g.rotation.z = b.tilt[1] + wobble(ti, 0.14, 4.3 + i * 0.5, 0.45);
    });
    if (jar.current) jar.current.rotation.z = wobble(t, 0.05, 7, 0.25);
  });

  return (
    <Interactive
      name="brushes"
      label="Brush jar"
      hint="Click to rattle the brushes"
      section="Personal Endeavours"
      sound="knock"
      labelOffset={[0, 2.1, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      <group ref={jar}>
        <mesh position-y={H / 2} castShadow receiveShadow material={m.terracotta}>
          <cylinderGeometry args={[0.36, 0.28, H, 28, 1, true]} />
        </mesh>
        <mesh position-y={0.02} material={m.terracotta}>
          <cylinderGeometry args={[0.28, 0.28, 0.04, 28]} />
        </mesh>
        <mesh position-y={H * 0.62}>
          <cylinderGeometry args={[0.343, 0.33, 0.08, 28, 1, true]} />
          <meshStandardMaterial color={COLORS.cream} roughness={0.9} />
        </mesh>
        <mesh position-y={H} rotation-x={Math.PI / 2} material={m.terracotta}>
          <torusGeometry args={[0.36, 0.025, 8, 28]} />
        </mesh>

        {BRUSHES.map((b, i) => (
          <group
            key={i}
            ref={(el) => {
              brushes.current[i] = el;
            }}
            position-y={0.1}
            rotation={[b.tilt[0], 0, b.tilt[1]]}
          >
            <mesh position-y={b.length / 2} castShadow>
              <cylinderGeometry args={[0.022, 0.03, b.length, 8]} />
              <meshStandardMaterial color={b.handle} roughness={0.35} />
            </mesh>
            <mesh position-y={b.length + 0.05} material={m.brass}>
              <cylinderGeometry args={[0.026, 0.022, 0.1, 8]} />
            </mesh>
            <mesh position-y={b.length + 0.16}>
              <coneGeometry args={[0.026, 0.14, 8]} />
              <meshStandardMaterial color={b.tip} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </Interactive>
  );
}
