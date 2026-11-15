"use client";

import { useThree } from "@react-three/fiber";

export type Vec3 = [number, number, number];

/** True on portrait / narrow canvases, where the wide-screen layout is partly out of frame. */
export function useNarrow() {
  return useThree((s) => s.size.width / s.size.height < 0.85);
}

/** Pick a different spot for an object on narrow screens (falls back to `position`). */
export function useResponsivePosition(position: Vec3, compact?: Vec3): Vec3 {
  const narrow = useNarrow();
  return narrow && compact ? compact : position;
}
