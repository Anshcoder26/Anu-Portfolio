"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { useDesk } from "../desk/DeskContext";
import { Interactive } from "../desk/Interactive";
import { useResponsivePosition, type Vec3 } from "../desk/useResponsive";
import { paintStoreSign, sharedTexture } from "../textures";
import { Pin } from "./Pin";

const W = 1.6;
const H = W * (200 / 640);

/** Pin above the middle; strings run to points near each end of the plank's top edge. */
const STRING = (() => {
  const dx = W * 0.36;
  const dy = 0.26;
  return { dx, dy, len: Math.hypot(dx, dy), angle: Math.atan2(dx, dy) };
})();

type Props = Omit<React.JSX.IntrinsicElements["group"], "position"> & { position: Vec3; compactPosition?: Vec3 };

/**
 * Wooden "Way to store →" arrow hung on the wall. Hover: it nudges the way it
 * points. Click: footsteps, a black-out, and we arrive at the Onayakhi store.
 */
export function StoreSign({ position, compactPosition, ...props }: Props) {
  const pos = useResponsivePosition(position, compactPosition);
  const desk = useDesk();
  const map = sharedTexture("store-sign", 640, 200, paintStoreSign, { fonts: true });
  const plank = useRef<THREE.Group>(null);
  const hover = useRef(false);

  useFrame((state, delta) => {
    if (!plank.current) return;
    const t = state.clock.elapsedTime;
    // Idle: a slow swing on its string. Hover: points harder, tapping forward.
    const nudge = hover.current ? 0.06 + Math.max(0, Math.sin(t * 9)) * 0.05 : 0;
    easing.damp(plank.current.position, "x", nudge, 0.08, delta);
    plank.current.rotation.z = Math.sin(t * 1.1) * 0.02 - 0.03;
  });

  return (
    <Interactive
      name="store-sign"
      label="Visit Anu's store, Onayakhi"
      direct
      lift={0}
      labelOffset={[0, -H / 2 - 0.42, 0.1]}
      onActivate={() => desk.goToStore?.()}
      position={pos}
      {...props}
    >
      {/* String from the pin down to both ends of the plank */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * STRING.dx) / 2, H / 2 - 0.04 + STRING.dy / 2, 0.02]}
          rotation-z={s * STRING.angle}
        >
          <boxGeometry args={[0.008, STRING.len, 0.004]} />
          <meshStandardMaterial color="#3a2414" />
        </mesh>
      ))}
      <Pin position={[0, H / 2 - 0.04 + STRING.dy, 0]} />
      <group ref={plank}>
        {/* Pointer handlers sit on the mesh: Interactive stops the event at its own group. */}
        <mesh
          position-z={0.03}
          castShadow
          onPointerOver={() => (hover.current = desk.enabled)}
          onPointerOut={() => (hover.current = false)}
        >
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial map={map} transparent alphaTest={0.5} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Interactive>
  );
}
