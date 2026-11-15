"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { Phase } from "@/lib/phase";
import { ATMOSPHERES, useTimeOfDay } from "./atmosphere";
import { Book } from "./Book";
import { CameraRig } from "./CameraRig";
import { Desk } from "./Desk";
import { Room, WALL_Z } from "./Room";
import { BrushJar } from "./props/BrushJar";
import { DeskLamp } from "./props/DeskLamp";
import { FabricSwatches } from "./props/FabricSwatches";
import { Palette } from "./props/Palette";
import { PinCushion } from "./props/PinCushion";
import { Scissors } from "./props/Scissors";
import { Sketchbook } from "./props/Sketchbook";
import { StickyNote } from "./props/StickyNote";
import { TapeMeasure } from "./props/TapeMeasure";
import { ThreadSpools } from "./props/ThreadSpools";

export type SceneProps = {
  phase: Phase;
  reducedMotion: boolean;
  onReady: () => void;
  onOpen: () => void;
  onOpened: () => void;
  onClosed: () => void;
  /** Sticky note clicked — screen position of the click. */
  onContact: (x: number, y: number) => void;
};

/**
 * Where the sun/moon "is": outside, behind the back wall and to the left, so
 * its light comes in through the window (Room.WINDOW) and lands on the book.
 */
const WINDOW_LIGHT_POS: [number, number, number] = [-9, 7, -12];

/** Mounted inside <Suspense>, so it only runs once the textures have loaded. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

export default function Scene({
  phase,
  reducedMotion,
  onReady,
  onOpen,
  onOpened,
  onClosed,
  onContact,
}: SceneProps) {
  const a = ATMOSPHERES[useTimeOfDay()];

  return (
    <Canvas
      // Nothing moves behind the viewer overlay, so stop rendering entirely.
      frameloop={phase === "viewer" ? "never" : "always"}
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 10.5], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: "high-performance" }}
      aria-label="A study desk with Anu's portfolio book"
    >
      <color attach="background" args={[a.bg]} />
      <fog attach="fog" args={[a.bg, 16, 34]} />

      {/* Lighting follows the visitor's time of day (see atmosphere.ts) */}
      <ambientLight intensity={a.ambient.intensity} color={a.ambient.color} />
      <hemisphereLight args={[a.hemi.sky, a.hemi.ground, a.hemi.intensity]} />
      <directionalLight
        position={WINDOW_LIGHT_POS}
        intensity={a.window.intensity}
        color={a.window.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <directionalLight position={[3, 6, 9]} intensity={a.fill.intensity} color={a.fill.color} />
      {/* Local reflections without downloading an HDRI */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffe6c4" position={[0, 5, 2]} scale={[8, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.8} color="#E3B23C" position={[-6, 2, 0]} scale={[4, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.5} color="#A6232A" position={[6, 2, -2]} scale={[4, 4, 1]} rotation-y={-Math.PI / 2} />
      </Environment>

      <Suspense fallback={null}>
        <Room atmosphere={a} />
        {/* Contact sticky note pinned on the wall, right of the window */}
        <StickyNote
          position={[4.6, 1.05, WALL_Z]}
          compactPosition={[1.4, 1.35, WALL_Z]}
          scale={1.4}
          interactive={phase === "intro"}
          onOpen={onContact}
        />
        <Desk />

        {/* Props are kept clear of the open book's footprint (x -4.5…1.5, z ±0.9). */}
        <DeskLamp position={[-5.6, 0, -3.3]} target={[-0.5, 0, 0]} intensity={a.lamp} />
        <BrushJar position={[-5.9, 0, -1.2]} />
        <ThreadSpools position={[-3.2, 0, -2.05]} rotation-y={0.4} />
        <Palette position={[-5.4, 0, 1.5]} rotation-y={0.5} />
        <TapeMeasure position={[-1.4, 0, 2.15]} />
        <Scissors position={[1.9, 0, 1.75]} rotation-y={-0.6} />
        <PinCushion position={[3.3, 0, 1.55]} />
        <Sketchbook position={[3.7, 0, -1.0]} rotation-y={0.32} />
        <FabricSwatches position={[5.7, 0, 0.6]} rotation-y={-0.3} />

        <Book phase={phase} reducedMotion={reducedMotion} onOpen={onOpen} onOpened={onOpened} onClosed={onClosed} />
        <Ready onReady={onReady} />
      </Suspense>

      <CameraRig phase={phase} reducedMotion={reducedMotion} />
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
