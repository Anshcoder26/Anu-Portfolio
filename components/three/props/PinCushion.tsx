"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useTrigger } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";

const HEAD_COLORS = [COLORS.haldi, COLORS.teal, COLORS.cream, COLORS.indigo, COLORS.rose, "#ffffff"];
const PIN_COUNT = 16;
const PIN_LENGTH = 0.32;
const R = 0.42;

type InstanceRef = THREE.Object3D;

/** Tomato pin cushion. Click: the pins pop out one after another and spring back. */
export function PinCushion(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const trigger = useTrigger();
  const shafts = useRef<(InstanceRef | null)[]>([]);
  const heads = useRef<(InstanceRef | null)[]>([]);

  const pins = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return Array.from({ length: PIN_COUNT }, (_, i) => {
      const t = (i + 0.5) / PIN_COUNT;
      const polar = Math.acos(1 - t * 0.9);
      const az = i * 2.39996;
      const dir = new THREE.Vector3(
        Math.sin(polar) * Math.cos(az),
        Math.cos(polar),
        Math.sin(polar) * Math.sin(az),
      ).normalize();
      const surface = new THREE.Vector3(dir.x * R, dir.y * R * 0.72, dir.z * R);
      const rot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir));
      return {
        dir,
        shaft: surface.clone().addScaledVector(dir, PIN_LENGTH * 0.25),
        head: surface.clone().addScaledVector(dir, PIN_LENGTH * 0.62),
        rot,
        color: HEAD_COLORS[i % HEAD_COLORS.length],
      };
    });
  }, []);

  useFrame((state) => {
    const t = trigger.since(state);
    if (t > 3) return;
    pins.forEach((p, i) => {
      const ti = t - i * 0.04;
      const pop = ti > 0 ? 0.24 * Math.exp(-ti * 2.2) * Math.abs(Math.sin(ti * 6)) : 0;
      shafts.current[i]?.position.copy(p.shaft).addScaledVector(p.dir, pop);
      heads.current[i]?.position.copy(p.head).addScaledVector(p.dir, pop);
    });
  });

  return (
    <Interactive
      name="pins"
      label="Pin cushion"
      hint="Click to pop the pins"
      section="Jewellery"
      sound="pop"
      labelOffset={[0, 1.15, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      <group position-y={R * 0.72}>
        <mesh scale={[1, 0.72, 1]} castShadow receiveShadow material={m.sindoor}>
          <sphereGeometry args={[R, 32, 20]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-y={(i * Math.PI) / 4} scale={[1, 0.72, 1]}>
            <torusGeometry args={[R * 1.002, 0.006, 4, 48]} />
            <meshStandardMaterial color="#7d1a1f" roughness={0.8} />
          </mesh>
        ))}
        <mesh position-y={R * 0.72} material={m.bamboo}>
          <coneGeometry args={[0.12, 0.08, 5]} />
        </mesh>

        <Instances limit={PIN_COUNT} castShadow material={m.steel}>
          <cylinderGeometry args={[0.006, 0.006, PIN_LENGTH * 0.75, 4]} />
          {pins.map((p, i) => (
            <Instance
              key={i}
              ref={(el: InstanceRef | null) => {
                shafts.current[i] = el;
              }}
              position={p.shaft}
              rotation={p.rot}
            />
          ))}
        </Instances>
        <Instances limit={PIN_COUNT} castShadow>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial roughness={0.3} />
          {pins.map((p, i) => (
            <Instance
              key={i}
              ref={(el: InstanceRef | null) => {
                heads.current[i] = el;
              }}
              position={p.head}
              color={p.color}
            />
          ))}
        </Instances>
      </group>
    </Interactive>
  );
}
