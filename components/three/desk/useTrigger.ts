"use client";

import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";

/**
 * Click-started animation clock. `fire()` from an event handler; inside
 * `useFrame`, `since(state)` is seconds since the last fire (Infinity before
 * the first). Call this hook before the component's own `useFrame`.
 */
export function useTrigger() {
  const start = useRef(-Infinity);
  const pending = useRef(false);

  useFrame((state) => {
    if (pending.current) {
      start.current = state.clock.elapsedTime;
      pending.current = false;
    }
  });

  return {
    fire: () => {
      pending.current = true;
    },
    since: (state: RootState) => state.clock.elapsedTime - start.current,
  };
}

export type Trigger = ReturnType<typeof useTrigger>;

/** Smoothstep 0…1. */
export const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

/** Decaying wobble: starts at `amp`, oscillates at `freq` Hz, dies over ~`decay` s. */
export const wobble = (t: number, amp: number, freq = 6, decay = 0.8) =>
  t < 0 || !Number.isFinite(t) ? 0 : amp * Math.exp(-t / decay) * Math.sin(t * freq * Math.PI * 2);
