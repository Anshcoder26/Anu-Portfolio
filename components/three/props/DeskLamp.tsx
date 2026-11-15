"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { COLORS, getMaterials } from "../materials";

/**
 * Brass desk lamp; its spotlight pools warm light on the book (evening/night).
 * `intensity` 0 switches it off.
 * `target` is the world point the shade aims at. Click toggles it (`onToggle`).
 */
export function DeskLamp({
  target = [0, 0, 0],
  intensity = 28,
  onToggle,
  ...props
}: React.JSX.IntrinsicElements["group"] & {
  target?: [number, number, number];
  intensity?: number;
  onToggle?: () => void;
}) {
  const on = intensity > 0;
  const m = getMaterials();
  const light = useRef<THREE.SpotLight>(null);
  const aim = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (light.current && aim.current) light.current.target = aim.current;
  }, []);

  return (
    <>
      <Interactive
        name="lamp"
        label="Desk lamp"
        hint={on ? "Click to switch off" : "Click to switch on"}
        sound="click"
        lift={0}
        labelOffset={[0.4, 3, 0.2]}
        onActivate={onToggle}
        {...props}
      >
        <mesh position-y={0.05} castShadow material={m.brass}>
          <cylinderGeometry args={[0.45, 0.5, 0.1, 32]} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation-z={-0.18} castShadow material={m.brass}>
          <cylinderGeometry args={[0.035, 0.035, 2.4, 10]} />
        </mesh>
        <group position={[0.42, 2.35, 0.2]} rotation={[0.35, 0, -1.0]}>
          <mesh castShadow>
            <coneGeometry args={[0.45, 0.6, 32, 1, true]} />
            <meshStandardMaterial color={COLORS.teal} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={-0.15}>
            <sphereGeometry args={[0.13, 16, 12]} />
            <meshStandardMaterial
              color={on ? "#fff3d6" : "#d8d2c4"}
              emissive="#ffd59a"
              emissiveIntensity={on ? 3 : 0}
            />
          </mesh>
        </group>
        <spotLight
          ref={light}
          position={[0.8, 2.1, 0.4]}
          angle={0.65}
          penumbra={0.8}
          intensity={intensity}
          visible={on}
          distance={14}
          decay={1.6}
          color="#ffd7a0"
        />
      </Interactive>
      <object3D ref={aim} position={target} />
    </>
  );
}
