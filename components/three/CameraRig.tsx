"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import type { Phase } from "@/lib/phase";
import { BOOK } from "./Book";

type Shot = {
  position: [number, number, number];
  target: [number, number, number];
  /** Half-width (world units) that must stay visible, used to pull back on narrow screens. */
  halfWidth: number;
  /** Smooth time in seconds — larger is slower. */
  smooth: number;
};

const SPREAD_CENTER_X = -BOOK.width / 2; // spine; open spread spans both sides of it

const SHOTS: Record<"wide" | "hero" | "closeup", Shot> = {
  wide: { position: [0, 5.5, 11.5], target: [0, 0.8, -1], halfWidth: 6, smooth: 0.6 },
  hero: { position: [0, 4.4, 7.8], target: [0, 0.5, -0.9], halfWidth: 3.6, smooth: 0.9 },
  closeup: {
    position: [SPREAD_CENTER_X, 5.2, 0.9],
    target: [SPREAD_CENTER_X, 0.3, 0.05],
    halfWidth: 3.3,
    smooth: 0.7,
  },
};

const shotFor = (phase: Phase) =>
  phase === "loading" ? SHOTS.wide : phase === "opening" || phase === "viewer" ? SHOTS.closeup : SHOTS.hero;

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();

/**
 * Eases the camera between shot presets. Frame-rate independent (maath damp),
 * pulls back on portrait screens so the book always fits, and adds a light
 * pointer parallax while idling on the desk.
 */
export function CameraRig({ phase, reducedMotion }: { phase: Phase; reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const lookAt = useRef(new THREE.Vector3(...SHOTS.wide.target));

  useFrame((state, delta) => {
    const shot = shotFor(phase);
    tmpTarget.set(...shot.target);
    tmpPos.set(...shot.position);

    // Distance needed so `halfWidth` fits horizontally at this aspect ratio.
    const offset = tmpOffset.copy(tmpPos).sub(tmpTarget);
    const halfFovX = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const needed = shot.halfWidth / Math.tan(halfFovX);
    const scale = Math.max(1, needed / offset.length());
    tmpPos.copy(tmpTarget).addScaledVector(offset, scale);

    if (phase === "intro" && !reducedMotion) {
      tmpPos.x += state.pointer.x * 0.35;
      tmpPos.y += state.pointer.y * 0.2;
    }

    const smooth = reducedMotion ? 0.0001 : shot.smooth;
    easing.damp3(camera.position, tmpPos, smooth, delta);
    easing.damp3(lookAt.current, tmpTarget, smooth, delta);
    camera.lookAt(lookAt.current);
  });

  return null;
}
