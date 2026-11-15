"use client";

import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { play } from "@/lib/sound";
import { useResponsivePosition, type Vec3 } from "../desk/useResponsive";
import { COLORS } from "../materials";
import { paintNote, sharedTexture } from "../textures";

const BASE_TILT = 0.07;

type Props = Omit<React.JSX.IntrinsicElements["group"], "position"> & {
  position: Vec3;
  /** Used on portrait/narrow screens, where the wide-screen spot is out of frame. */
  compactPosition: Vec3;
  interactive: boolean;
  /** Called with the click's screen position, so the card can expand from there. */
  onOpen: (x: number, y: number) => void;
};

/** A pinned sticky note on the wall with Anu's contact details. Click to expand. */
export function StickyNote({ position, compactPosition, interactive, onOpen, ...props }: Props) {
  const pos = useResponsivePosition(position, compactPosition);
  const note = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const active = hovered && interactive;
  useCursor(active);

  useFrame((state, delta) => {
    const g = note.current;
    if (!g) return;
    const wiggle = active ? Math.sin(state.clock.elapsedTime * 9) * 0.035 : 0;
    easing.damp(g.rotation, "z", BASE_TILT + wiggle, 0.12, delta);
    easing.damp(g.position, "z", active ? 0.08 : 0, 0.15, delta);
    const s = active ? 1.08 : 1;
    easing.damp3(g.scale, [s, s, s], 0.15, delta);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!interactive) return;
    setHovered(false);
    play("paper");
    onOpen(e.nativeEvent.clientX, e.nativeEvent.clientY);
  };

  return (
    <group position={pos} {...props}>
      <group
        ref={note}
        rotation-z={BASE_TILT}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Soft shadow on the wall */}
        <mesh position={[0.04, -0.05, 0.005]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#000" transparent opacity={0.16} depthWrite={false} />
        </mesh>
        {/* The note (lit, so it follows the room's time of day) */}
        <mesh position-z={0.012} castShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial map={sharedTexture("note", 512, 512, paintNote, { fonts: true })} roughness={0.9} />
        </mesh>
        {/* Push pin */}
        <group position={[0, 0.4, 0.03]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position-z={0.06} castShadow>
            <sphereGeometry args={[0.055, 16, 12]} />
            <meshStandardMaterial color={COLORS.sindoor} roughness={0.35} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
