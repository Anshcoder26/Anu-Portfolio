import * as THREE from "three";

/** Palette shared with the CSS theme (app/globals.css) and the PDF artwork. */
export const COLORS = {
  sindoor: "#A6232A",
  haldi: "#E3B23C",
  cream: "#F6EBD3",
  ink: "#1B1410",
  bamboo: "#7A8B3A",
  teal: "#1F5C5A",
  indigo: "#2D3E7A",
  rose: "#D9677A",
  wood: "#7A4B2E",
  steel: "#B8BCC2",
  brass: "#C9A04A",
} as const;

let cache: ReturnType<typeof create> | null = null;

function create() {
  const std = (color: string, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  return {
    sindoor: std(COLORS.sindoor, 0.6),
    haldi: std(COLORS.haldi, 0.55),
    cream: std(COLORS.cream, 0.9),
    ink: std(COLORS.ink, 0.6),
    bamboo: std(COLORS.bamboo, 0.7),
    teal: std(COLORS.teal, 0.75),
    indigo: std(COLORS.indigo, 0.75),
    rose: std(COLORS.rose, 0.6),
    wood: std(COLORS.wood, 0.55),
    lightWood: std("#C79A6B", 0.6),
    paper: std("#FBF5E8", 0.95),
    steel: std(COLORS.steel, 0.25, 0.9),
    brass: std(COLORS.brass, 0.3, 0.85),
    terracotta: std("#B5653F", 0.85),
    graphite: std("#3A3A3A", 0.5),
  };
}

/**
 * Shared, lazily-created materials so every prop reuses the same
 * GPU programs/uniforms instead of allocating its own.
 */
export function getMaterials() {
  if (!cache) cache = create();
  return cache;
}
