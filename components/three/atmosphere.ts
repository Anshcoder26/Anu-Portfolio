"use client";

import { useEffect, useState } from "react";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export type Atmosphere = {
  /** Sky gradient seen through the window, top → horizon. */
  sky: string[];
  /** Sun disc (normalised window coords, 0,0 = top-left) or null for night. */
  sun: { x: number; y: number; r: number; color: string; glow: string } | null;
  moon: boolean;
  stars: boolean;
  /** Distant hills silhouette colours, far → near. */
  hills: [string, string];
  /** Scene background + fog colour. */
  bg: string;
  wall: string;
  ambient: { color: string; intensity: number };
  hemi: { sky: string; ground: string; intensity: number };
  /** Light coming through the window (sun or moon) — the shadow caster. */
  window: { color: string; intensity: number };
  /** Soft front fill so the wall and desk don't go muddy. */
  fill: { color: string; intensity: number };
  /** Desk lamp spot intensity — 0 switches the lamp off. */
  lamp: number;
};

export const ATMOSPHERES: Record<TimeOfDay, Atmosphere> = {
  morning: {
    sky: ["#7fb3e0", "#b9d5ea", "#f6d7b0", "#f7c08a"],
    sun: { x: 0.28, y: 0.72, r: 0.09, color: "#fff4d6", glow: "rgba(255, 200, 120, 0.55)" },
    moon: false,
    stars: false,
    hills: ["#9fb7a0", "#6f8f72"],
    bg: "#e9dccb",
    wall: "#f3eee6",
    ambient: { color: "#ffeedd", intensity: 0.45 },
    hemi: { sky: "#cfe3ff", ground: "#7a5236", intensity: 0.55 },
    window: { color: "#ffd9a3", intensity: 3.2 },
    fill: { color: "#fff3e3", intensity: 1.25 },
    lamp: 0,
  },
  day: {
    sky: ["#3d86d6", "#6faae6", "#a9cdef", "#d6e8f5"],
    sun: { x: 0.62, y: 0.22, r: 0.08, color: "#fffef5", glow: "rgba(255, 250, 220, 0.6)" },
    moon: false,
    stars: false,
    hills: ["#8fb08f", "#5f8a62"],
    bg: "#efe8de",
    wall: "#f6f3ee",
    ambient: { color: "#ffffff", intensity: 0.55 },
    hemi: { sky: "#dcebff", ground: "#7a5236", intensity: 0.65 },
    window: { color: "#fff6e8", intensity: 3.6 },
    fill: { color: "#ffffff", intensity: 1.5 },
    lamp: 0,
  },
  evening: {
    sky: ["#3b3f78", "#8a5a8c", "#e57f5b", "#f7b267"],
    sun: { x: 0.7, y: 0.8, r: 0.1, color: "#ffd08a", glow: "rgba(255, 140, 70, 0.6)" },
    moon: false,
    stars: false,
    hills: ["#6b4e6e", "#3f3046"],
    bg: "#3a2a2c",
    wall: "#efe6dc",
    ambient: { color: "#ffd9c0", intensity: 0.3 },
    hemi: { sky: "#ffb38a", ground: "#3a2418", intensity: 0.4 },
    window: { color: "#ff9a5c", intensity: 2.4 },
    fill: { color: "#ffd8b8", intensity: 0.6 },
    lamp: 22,
  },
  night: {
    sky: ["#060b1e", "#0d1838", "#1a2a52", "#26386a"],
    sun: null,
    moon: true,
    stars: true,
    hills: ["#121a33", "#0a0f22"],
    bg: "#0b1020",
    wall: "#e8e6ef",
    ambient: { color: "#9fb0ff", intensity: 0.12 },
    hemi: { sky: "#5b6fb5", ground: "#1a1210", intensity: 0.2 },
    window: { color: "#a9c2ff", intensity: 1.4 },
    fill: { color: "#8fa2d8", intensity: 0.12 },
    lamp: 30,
  },
};

export function timeOfDayFor(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

const isTimeOfDay = (v: string | null): v is TimeOfDay =>
  v === "morning" || v === "day" || v === "evening" || v === "night";

const ORDER: TimeOfDay[] = ["morning", "day", "evening", "night"];

/**
 * The visitor's local time of day, re-checked every minute.
 * `?time=morning|day|evening|night` in the URL forces one (handy for previewing).
 * Returns `[timeOfDay, cycle]` — `cycle()` steps to the next look (the window click).
 */
export function useTimeOfDay(): [TimeOfDay, () => void] {
  const [clock, setClock] = useState<TimeOfDay>(() => {
    const forced = new URLSearchParams(window.location.search).get("time");
    return isTimeOfDay(forced) ? forced : timeOfDayFor(new Date().getHours());
  });
  const [override, setOverride] = useState<TimeOfDay | null>(null);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("time");
    if (isTimeOfDay(forced)) return;
    const id = window.setInterval(() => setClock(timeOfDayFor(new Date().getHours())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const current = override ?? clock;
  const cycle = () => setOverride(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
  return [current, cycle];
}
