"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useResponsivePosition, type Vec3 } from "../desk/useResponsive";
import { useTrigger, wobble } from "../desk/useTrigger";
import { paintPennant, sharedTexture } from "../textures";
import { Pin } from "./Pin";

const W = 1.35;
const H = 0.55;

type Props = Omit<React.JSX.IntrinsicElements["group"], "position"> & { position: Vec3; compactPosition?: Vec3 };

/** Felt "NIFT BANGALORE" pennant pinned at its hoist. Click: it swings. */
export function Pennant({ position, compactPosition, ...props }: Props) {
  const pos = useResponsivePosition(position, compactPosition);
  const map = sharedTexture("pennant", 512, 210, paintPennant, { fonts: true });
  const trigger = useTrigger();
  const flag = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!flag.current) return;
    const idle = Math.sin(state.clock.elapsedTime * 1.3) * 0.015;
    flag.current.rotation.z = -0.06 + idle + wobble(trigger.since(state), 0.22, 1.6, 0.9);
  });

  return (
    <Interactive
      name="pennant"
      label="NIFT Bangalore"
      hint="National Institute of Fashion Technology"
      page={0}
      sound="swoosh"
      lift={0}
      labelOffset={[W / 2, 0.55, 0.1]}
      onActivate={trigger.fire}
      position={pos}
      {...props}
    >
      <group ref={flag}>
        <mesh position={[W / 2, 0, 0.02]} castShadow>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial map={map} transparent alphaTest={0.5} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Pin position={[0.04, 0, 0]} />
    </Interactive>
  );
}
