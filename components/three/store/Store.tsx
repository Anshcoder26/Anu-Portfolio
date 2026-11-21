"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { StoreView } from "@/lib/phase";
import type { Atmosphere } from "../atmosphere";
import { DeskContext, type DeskApi } from "../desk/DeskContext";
import type { Vec3 } from "../desk/useResponsive";
import { Interior, SHOP } from "./Interior";
import { Street } from "./Street";

type Shot = { position: Vec3; target: Vec3; halfWidth: number };

/** Across the road, looking at the shopfront. */
const STREET: Shot = { position: [0, 2.4, 13], target: [0, 2.9, -1], halfWidth: 5.6 };

/** Guided stops inside — same order as `storeStops` in data/store.ts. */
export const STOPS: Shot[] = [
  { position: [0, 1.75, -3.0], target: [0, 1.9, -11], halfWidth: 3.0 }, // brand wall (overview)
  { position: [-1.5, 1.75, -6], target: [-5, 1.65, -6], halfWidth: 1.6 }, // mug shelf
  { position: [-0.6, 1.85, -5.6], target: [5, 1.95, -5.3], halfWidth: 2.2 }, // textiles
  { position: [0, 2.25, -4.5], target: [0, 0.95, -6.85], halfWidth: 1.6 }, // Echoes of Memory table
  { position: [1.75, 1.7, -6.2], target: [3.0, 0.75, -9.5], halfWidth: 1.8 }, // lounge: deck chair + cushion bench
  { position: [-0.7, 1.9, -6.4], target: [-3.2, 1.2, -9.3], halfWidth: 1.6 }, // counter
];

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();
const tmpFocus = new THREE.Vector3();

/**
 * Eases between the street shot and the guided stops. Narrow screens pull back
 * (like CameraRig) but stay inside the shop. A focused product draws the
 * camera in towards it.
 */
function StoreCamera({ view, stop, focus, reducedMotion }: { view: StoreView; stop: number; focus: Vec3 | null; reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const lookAt = useRef(new THREE.Vector3(...STREET.target));
  const snap = useRef(true);

  useFrame((state, delta) => {
    const shot = view === "street" ? STREET : STOPS[stop] ?? STOPS[0];
    tmpTarget.set(...shot.target);
    tmpPos.set(...shot.position);

    const offset = tmpOffset.copy(tmpPos).sub(tmpTarget);
    const halfFovX = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const needed = shot.halfWidth / Math.tan(halfFovX);
    const scale = THREE.MathUtils.clamp(needed / offset.length(), 1, view === "street" ? 1.9 : 2.2);
    tmpPos.copy(tmpTarget).addScaledVector(offset, scale);

    if (view === "inside") {
      if (focus) {
        // Lean in: look at the product from partway along the way to it.
        tmpFocus.set(...focus);
        tmpPos.lerp(tmpFocus, 0.35);
        tmpTarget.copy(tmpFocus);
      }
      tmpPos.x = THREE.MathUtils.clamp(tmpPos.x, SHOP.x0 + 0.4, SHOP.x1 - 0.4);
      tmpPos.z = THREE.MathUtils.clamp(tmpPos.z, SHOP.z0 + 0.4, SHOP.z1 + 0.25);
      tmpPos.y = THREE.MathUtils.clamp(tmpPos.y, 0.6, SHOP.h - 0.3);
    }

    if (!reducedMotion) {
      tmpPos.x += state.pointer.x * (view === "street" ? 0.4 : 0.12);
      tmpPos.y += state.pointer.y * (view === "street" ? 0.2 : 0.06);
    }

    // Walking through the door is a slower glide than hopping between displays.
    const smooth = reducedMotion || snap.current ? 0.0001 : view === "inside" && camera.position.z > SHOP.z1 ? 0.75 : 0.55;
    snap.current = false;
    easing.damp3(camera.position, tmpPos, smooth, delta);
    easing.damp3(lookAt.current, tmpTarget, smooth, delta);
    camera.lookAt(lookAt.current);
  });

  return null;
}

/** Mounted inside <Suspense>, so it only runs once everything has loaded. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

export type StoreProps = {
  atmosphere: Atmosphere;
  view: StoreView;
  stop: number;
  reducedMotion: boolean;
  onReady: () => void;
  /** The door was clicked on the street. */
  onEnter: () => void;
  active: string | null;
  setActive: (id: string | null) => void;
};

const noop = () => {};

/**
 * Onayakhi — Anu's store, the canvas's second place. The street and the
 * interior are one continuous set: "Step inside" dollies the camera through
 * the door.
 */
export default function Store({ atmosphere: a, view, stop, reducedMotion, onReady, onEnter, active, setActive }: StoreProps) {
  const inside = view === "inside";
  const night = a.lamp > 0;
  const [focus, setFocus] = useState<{ stop: number; at: Vec3 } | null>(null);
  // Focus belongs to the stop (and the label) it was made at.
  const focusAt = inside && focus && focus.stop === stop && active ? focus.at : null;

  const api = useMemo<DeskApi>(
    () => ({ enabled: inside, openPage: noop, dye: null, setDye: noop, active: inside ? active : null, setActive }),
    [inside, active, setActive],
  );

  return (
    <>
      <color attach="background" args={[a.sky[2]]} />
      <fog attach="fog" args={[a.bg, 30, 75]} />
      <ambientLight intensity={a.ambient.intensity * 0.9} color={a.ambient.color} />
      <hemisphereLight args={[a.hemi.sky, a.hemi.ground, a.hemi.intensity]} />
      {/* Sun/moon over the street, from front-left so the facade is lit */}
      <directionalLight
        position={[-8, 12, 14]}
        intensity={a.window.intensity * 0.8}
        color={a.window.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      <directionalLight position={[4, 5, 10]} intensity={a.fill.intensity * 0.6} color={a.fill.color} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffe6c4" position={[0, 5, 2]} scale={[8, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.8} color="#E3B23C" position={[-6, 2, 0]} scale={[4, 4, 1]} rotation-y={Math.PI / 2} />
      </Environment>

      <DeskContext.Provider value={api}>
        <Street atmosphere={a} open={inside} enabled={!inside} onEnter={onEnter} />
        <Interior night={night} onFocus={(at) => setFocus({ stop, at })} />
      </DeskContext.Provider>

      <StoreCamera view={view} stop={stop} focus={focusAt} reducedMotion={reducedMotion} />
      <Ready onReady={onReady} />
    </>
  );
}
