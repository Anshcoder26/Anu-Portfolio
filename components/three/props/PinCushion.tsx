"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import { COLORS, getMaterials } from "../materials";

const HEAD_COLORS = [COLORS.haldi, COLORS.teal, COLORS.cream, COLORS.indigo, COLORS.rose, "#ffffff"];
const PIN_COUNT = 16;
const PIN_LENGTH = 0.32;

/** Tomato pin cushion with instanced pins (2 draw calls for all pins). */
export function PinCushion(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const R = 0.42;

  const pins = useMemo(() => {
    // Points spread over the upper cap of the cushion (golden-angle spiral).
    const up = new THREE.Vector3(0, 1, 0);
    return Array.from({ length: PIN_COUNT }, (_, i) => {
      const t = (i + 0.5) / PIN_COUNT;
      const polar = Math.acos(1 - t * 0.9); // stay on the top ~half
      const az = i * 2.39996;
      const dir = new THREE.Vector3(
        Math.sin(polar) * Math.cos(az),
        Math.cos(polar),
        Math.sin(polar) * Math.sin(az),
      ).normalize();
      const surface = new THREE.Vector3(dir.x * R, dir.y * R * 0.72, dir.z * R);
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const rot = new THREE.Euler().setFromQuaternion(q);
      return {
        shaft: surface.clone().addScaledVector(dir, PIN_LENGTH * 0.25),
        head: surface.clone().addScaledVector(dir, PIN_LENGTH * 0.62),
        rot,
        color: HEAD_COLORS[i % HEAD_COLORS.length],
      };
    });
  }, []);

  return (
    <group {...props}>
      <group position-y={R * 0.72}>
        <mesh scale={[1, 0.72, 1]} castShadow receiveShadow material={m.sindoor}>
          <sphereGeometry args={[R, 32, 20]} />
        </mesh>
        {/* Segment seams */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-y={(i * Math.PI) / 4} scale={[1, 0.72, 1]}>
            <torusGeometry args={[R * 1.002, 0.006, 4, 48]} />
            <meshStandardMaterial color="#7d1a1f" roughness={0.8} />
          </mesh>
        ))}
        {/* Stem */}
        <mesh position-y={R * 0.72} material={m.bamboo}>
          <coneGeometry args={[0.12, 0.08, 5]} />
        </mesh>

        <Instances limit={PIN_COUNT} castShadow material={m.steel}>
          <cylinderGeometry args={[0.006, 0.006, PIN_LENGTH * 0.75, 4]} />
          {pins.map((p, i) => (
            <Instance key={i} position={p.shaft} rotation={p.rot} />
          ))}
        </Instances>
        <Instances limit={PIN_COUNT} castShadow>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial roughness={0.3} />
          {pins.map((p, i) => (
            <Instance key={i} position={p.head} color={p.color} />
          ))}
        </Instances>
      </group>
    </group>
  );
}
