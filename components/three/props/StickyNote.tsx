"use client";

import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { contact } from "@/data/contact";
import { COLORS } from "../materials";

const BASE_TILT = 0.07;

let noteTexture: THREE.CanvasTexture | null = null;

/** Draws the handwritten note to a canvas; redraws once the Kalam web font is ready. */
function getNoteTexture() {
  if (noteTexture) return noteTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-kalam").trim() || "cursive";

  const draw = () => {
    // Paper with a slightly darker bottom edge
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#FBE48A");
    g.addColorStop(1, "#F2CF55");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // Adhesive strip
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, 0, size, 70);

    ctx.fillStyle = "#2b2118";
    ctx.textAlign = "center";
    ctx.font = `700 74px ${family}`;
    ctx.fillText("Contact", size / 2, 150);
    ctx.strokeStyle = COLORS.sindoor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(150, 172);
    ctx.quadraticCurveTo(256, 160, 362, 176);
    ctx.stroke();

    ctx.fillStyle = "#3a2c20";
    ctx.font = `400 42px ${family}`;
    ctx.fillText(contact.phone.display, size / 2, 262);
    const [user, domain] = contact.email.display.split("@");
    ctx.font = `400 36px ${family}`;
    ctx.fillText(user, size / 2, 330);
    ctx.fillText(`@${domain}`, size / 2, 374);

    ctx.fillStyle = COLORS.sindoor;
    ctx.font = `700 34px ${family}`;
    ctx.fillText("tap me ✦", size / 2, 460);
  };

  draw();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  noteTexture = tex;

  document.fonts
    ?.load(`700 40px ${family}`)
    .then(() => {
      draw();
      tex.needsUpdate = true;
    })
    .catch(() => {});
  return tex;
}

type Vec3 = [number, number, number];

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
  const narrow = useThree((s) => s.size.width / s.size.height < 0.85);
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
    onOpen(e.nativeEvent.clientX, e.nativeEvent.clientY);
  };

  return (
    <group position={narrow ? compactPosition : position} {...props}>
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
          <meshStandardMaterial map={getNoteTexture()} roughness={0.9} />
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
