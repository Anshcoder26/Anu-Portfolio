"use client";

import { lazy, Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import type { Phase, Place, StoreView } from "@/lib/phase";
import { ATMOSPHERES, useTimeOfDay } from "./atmosphere";
import { Studio } from "./Studio";

// The store is only downloaded when someone walks there.
const Store = lazy(() => import("./store/Store"));

export type SceneProps = {
  phase: Phase;
  /** Which world the canvas shows: the study, or Onayakhi's store. */
  place: Place;
  storeView: StoreView;
  /** Current guided stop inside the store. */
  storeStop: number;
  reducedMotion: boolean;
  onReady: () => void;
  /** A place finished loading (its textures are in) — lets the travel curtain lift. */
  onPlaceReady: (place: Place) => void;
  onOpen: () => void;
  onOpened: () => void;
  onClosed: () => void;
  /** Sticky note clicked — screen position of the click. */
  onContact: (x: number, y: number) => void;
  /** A desk/wall object's "Open …" link — open the book at this page. */
  onOpenPage: (index: number) => void;
  /** The wall's "Way to store" sign. */
  onGoToStore: () => void;
  /** The shop door on the street was clicked. */
  onEnterStore: () => void;
};

export default function Scene({
  phase,
  place,
  storeView,
  storeStop,
  reducedMotion,
  onReady,
  onPlaceReady,
  onOpen,
  onOpened,
  onClosed,
  onContact,
  onOpenPage,
  onGoToStore,
  onEnterStore,
}: SceneProps) {
  const [timeOfDay, cycleTime] = useTimeOfDay();
  const a = ATMOSPHERES[timeOfDay];
  // The one object whose label is open — cleared by clicking empty space.
  const [active, setActive] = useState<string | null>(null);

  const studioReady = useCallback(() => {
    onReady();
    onPlaceReady("studio");
  }, [onReady, onPlaceReady]);
  const storeReady = useCallback(() => onPlaceReady("store"), [onPlaceReady]);

  return (
    <Canvas
      // Nothing moves behind the viewer overlay, so stop rendering entirely.
      frameloop={phase === "viewer" ? "never" : "always"}
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 10.5], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: "high-performance" }}
      aria-label={place === "studio" ? "A study desk with Anu's portfolio book" : "Onayakhi, Anu's store"}
      onPointerMissed={() => setActive(null)}
    >
      {place === "studio" ? (
        <Studio
          phase={phase}
          reducedMotion={reducedMotion}
          atmosphere={a}
          onCycleTime={cycleTime}
          onReady={studioReady}
          onOpen={onOpen}
          onOpened={onOpened}
          onClosed={onClosed}
          onContact={onContact}
          onOpenPage={onOpenPage}
          onGoToStore={onGoToStore}
          active={active}
          setActive={setActive}
        />
      ) : (
        <Suspense fallback={null}>
          <Store
            atmosphere={a}
            view={storeView}
            stop={storeStop}
            reducedMotion={reducedMotion}
            onReady={storeReady}
            onEnter={onEnterStore}
            active={active}
            setActive={setActive}
          />
        </Suspense>
      )}
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
