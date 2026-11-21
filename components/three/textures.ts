"use client";

import * as THREE from "three";
import { contact } from "@/data/contact";
import { profile } from "@/data/profile";
import { COLORS } from "./materials";

/** CSS font-family string for a next/font variable (falls back if missing). */
export function fontFamily(variable: "--font-kalam" | "--font-yatra" | "--font-cormorant", fallback = "cursive") {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * A canvas-backed texture, painted once (and repainted when the web fonts
 * finish loading, so handwritten text isn't stuck in a fallback font).
 */
export function canvasTexture(w: number, h: number, paint: Painter, opts: { fonts?: boolean } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts.fonts && document.fonts) {
    // A web font only downloads once something asks for it — ask for each one the
    // painters use (a canvas alone doesn't), then repaint with the real letters.
    const faces = [
      `400 32px ${fontFamily("--font-yatra", "serif")}`,
      `700 32px ${fontFamily("--font-kalam")}`,
      `500 32px ${fontFamily("--font-cormorant", "serif")}`,
    ];
    Promise.all(faces.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => {
        ctx.clearRect(0, 0, w, h);
        paint(ctx, w, h);
        tex.needsUpdate = true;
      })
      .catch(() => {});
  }
  return tex;
}

/**
 * A texture whose artwork is re-painted over time (e.g. a motif drawing
 * itself). `draw(progress)` repaints and flags the texture for upload.
 */
export function animatedCanvas(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, size, size, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  let last = 1;
  return {
    texture,
    draw(progress: number) {
      if (progress === last) return;
      last = progress;
      paint(ctx, size, size, progress);
      texture.needsUpdate = true;
    },
    dispose: () => texture.dispose(),
  };
}

const cache = new Map<string, THREE.Texture>();
/** Shared (cached) texture — for static artwork used by one or more meshes. */
export function sharedTexture(key: string, w: number, h: number, paint: Painter, opts?: { fonts?: boolean }) {
  let t = cache.get(key);
  if (!t) {
    t = canvasTexture(w, h, paint, opts);
    cache.set(key, t);
  }
  return t;
}

/** Small deterministic PRNG so painted patterns are stable. */
export function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ── Bengali textiles & art ──────────────────────────────────────────────────

/** Gamchha: red ground, white checks, a green band near each end. */
export const paintGamchha: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#C8232C";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const cell = w / 10;
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(i * cell + cell * 0.38, 0, cell * 0.14, h);
    ctx.fillRect(0, i * (h / 10) + (h / 10) * 0.38, w, (h / 10) * 0.14);
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 10; i++) ctx.fillRect(i * cell + cell * 0.1, 0, cell * 0.05, h);
  ctx.fillStyle = "#2E7D4F";
  ctx.fillRect(0, h * 0.06, w, h * 0.035);
  ctx.fillRect(0, h * 0.905, w, h * 0.035);
  // woven texture
  const r = rng(3);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.06})`;
    ctx.fillRect(r() * w, r() * h, 2, 1);
  }
};

/**
 * Alpona: white rice-paste motif on terracotta — concentric petals, dots and a
 * lotus. `progress` 0…1 draws it stroke by stroke (used for the reveal).
 */
export function paintAlpona(ctx: CanvasRenderingContext2D, w: number, h: number, progress = 1) {
  const cx = w / 2;
  const cy = h / 2;
  const R = w / 2;
  ctx.fillStyle = "#A9472A";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = ctx.fillStyle = "#FBF4E6";
  ctx.lineCap = "round";

  const steps: (() => void)[] = [];
  steps.push(() => {
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  });
  // outer petals
  for (let i = 0; i < 16; i++) {
    steps.push(() => {
      const a = (i / 16) * Math.PI * 2;
      ctx.lineWidth = w * 0.014;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * R * 0.66, cy + Math.sin(a) * R * 0.66, R * 0.16, R * 0.06, a, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  // dots ring
  steps.push(() => {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82, w * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // inner lotus
  for (let i = 0; i < 8; i++) {
    steps.push(() => {
      const a = (i / 8) * Math.PI * 2;
      ctx.lineWidth = w * 0.016;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(
        cx + Math.cos(a - 0.35) * R * 0.45,
        cy + Math.sin(a - 0.35) * R * 0.45,
        cx + Math.cos(a) * R * 0.42,
        cy + Math.sin(a) * R * 0.42,
      );
      ctx.quadraticCurveTo(cx + Math.cos(a + 0.35) * R * 0.45, cy + Math.sin(a + 0.35) * R * 0.45, cx, cy);
      ctx.stroke();
    });
  }
  steps.push(() => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
  });

  const n = Math.round(steps.length * Math.max(0, Math.min(1, progress)));
  for (let i = 0; i < n; i++) steps[i]();
}

/**
 * Kantha: running-stitch fish & flower on cream cotton. `progress` reveals the
 * stitched border line (the "self-stitching" animation).
 */
export function paintKantha(ctx: CanvasRenderingContext2D, w: number, h: number, progress = 1) {
  ctx.fillStyle = "#F3E9D2";
  ctx.fillRect(0, 0, w, h);
  const stitch = (pts: [number, number][], color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.stroke();
  };
  // background running-stitch rows
  for (let r = 0; r < 18; r++) {
    stitch([[0.08, 0.08 + r * 0.05], [0.92, 0.08 + r * 0.05]], "rgba(166,35,42,0.18)");
  }
  // fish
  const fish: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const a = t * Math.PI * 2;
    fish.push([0.5 + Math.cos(a) * 0.22, 0.42 + Math.sin(a) * 0.1]);
  }
  stitch(fish, "#1F5C5A");
  stitch([[0.72, 0.42], [0.84, 0.33], [0.84, 0.51], [0.72, 0.42]], "#1F5C5A");
  ctx.setLineDash([]);
  ctx.fillStyle = "#1F5C5A";
  ctx.beginPath();
  ctx.arc(w * 0.36, h * 0.4, 5, 0, Math.PI * 2);
  ctx.fill();
  // flowers
  for (const [fx, fy] of [[0.25, 0.75], [0.5, 0.78], [0.75, 0.75]] as const) {
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      stitch([[fx, fy], [fx + Math.cos(a) * 0.06, fy + Math.sin(a) * 0.08]], "#E3B23C");
    }
  }
  // self-stitching border
  const border: [number, number][] = [[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95], [0.05, 0.05]];
  const total = 4;
  const p = Math.max(0, Math.min(1, progress)) * total;
  const visible: [number, number][] = [border[0]];
  for (let i = 0; i < total; i++) {
    if (p <= i) break;
    const f = Math.min(1, p - i);
    const [x0, y0] = border[i];
    const [x1, y1] = border[i + 1];
    visible.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
  }
  if (visible.length > 1) stitch(visible, COLORS.sindoor);
  ctx.setLineDash([]);
}

// ── Textile-industry pieces for the mood board ──────────────────────────────

export const paintCork: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#B98a5a";
  ctx.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(80,45,20,${r() * 0.25})` : `rgba(240,200,150,${r() * 0.2})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
  }
};

/** Ikat: blurred, feathered indigo/sindoor bands. */
export const paintIkat: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#F1E6CF";
  ctx.fillRect(0, 0, w, h);
  const r = rng(5);
  const bands = ["#2D3E7A", "#A6232A", "#2D3E7A", "#E3B23C", "#2D3E7A"];
  bands.forEach((c, i) => {
    const y = (i + 0.5) * (h / bands.length);
    ctx.fillStyle = c;
    for (let x = 0; x < w; x += 6) {
      const jitter = (r() - 0.5) * 14;
      ctx.fillRect(x, y - h * 0.06 + jitter, 5, h * 0.12 + (r() - 0.5) * 10);
    }
  });
};

/** Jamdani: fine floating motifs on translucent white muslin. */
export const paintJamdani: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#F7F5EF";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#9CA3AF";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = (col + (row % 2 ? 0.75 : 0.25)) * (w / 4);
      const y = (row + 0.5) * (h / 4);
      ctx.fillStyle = row % 2 ? "#A6232A" : "#1F5C5A";
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 3.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
};

/** Colour chip card with Bengali colour names. */
export const paintChips: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  const chips: [string, string][] = [
    ["#A6232A", "sindoor"],
    ["#E3B23C", "haldi"],
    ["#2D3E7A", "neel"],
    ["#2E7D4F", "sobuj"],
    ["#1B1410", "kajol"],
  ];
  const ch = h / chips.length;
  const hand = fontFamily("--font-kalam");
  chips.forEach(([c, name], i) => {
    ctx.fillStyle = c;
    ctx.fillRect(w * 0.08, i * ch + ch * 0.1, w * 0.84, ch * 0.62);
    ctx.fillStyle = "#3a2c20";
    ctx.font = `400 ${Math.round(ch * 0.22)}px ${hand}`;
    ctx.textAlign = "left";
    ctx.fillText(name, w * 0.1, i * ch + ch * 0.93);
  });
};

// ── NIFT pieces ──────────────────────────────────────────────────────────────

/** Felt pennant (triangle on a transparent canvas — use with alphaTest). */
export const paintPennant: Painter = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.sindoor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // stitched edge
  ctx.strokeStyle = "rgba(246,235,211,0.8)";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, 12);
  ctx.lineTo(w - 26, h / 2);
  ctx.lineTo(14, h - 12);
  ctx.stroke();
  ctx.setLineDash([]);
  // hoist strip
  ctx.fillStyle = COLORS.haldi;
  ctx.fillRect(0, 0, w * 0.06, h);
  // text
  const [a, b] = profile.pennant.split(" ");
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `400 ${Math.round(h * 0.26)}px ${fontFamily("--font-yatra", "serif")}`;
  ctx.fillText(a, w * 0.1, h * 0.38);
  ctx.font = `400 ${Math.round(h * 0.16)}px ${fontFamily("--font-yatra", "serif")}`;
  ctx.fillText(b ?? "", w * 0.1, h * 0.62);
};

/** Student ID card — text only, no institutional logo. */
export const paintIdCard: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = COLORS.sindoor;
  ctx.fillRect(0, 0, w, h * 0.2);
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(h * 0.075)}px ${fontFamily("--font-yatra", "serif")}`;
  ctx.fillText(`${profile.institute} ${profile.campus.toUpperCase()}`, w / 2, h * 0.1);
  // photo placeholder (silhouette)
  ctx.fillStyle = "#E8DCC4";
  ctx.fillRect(w * 0.3, h * 0.26, w * 0.4, h * 0.34);
  ctx.fillStyle = "#B9A27F";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.38, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.6, w * 0.15, h * 0.1, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  const hand = fontFamily("--font-kalam");
  ctx.fillStyle = "#1B1410";
  ctx.font = `700 ${Math.round(h * 0.07)}px ${hand}`;
  ctx.fillText(profile.name, w / 2, h * 0.7);
  ctx.fillStyle = "#5a4a3a";
  ctx.font = `400 ${Math.round(h * 0.055)}px ${hand}`;
  ctx.fillText(profile.role, w / 2, h * 0.79);
  // barcode
  ctx.fillStyle = "#1B1410";
  const r = rng(21);
  for (let x = w * 0.18; x < w * 0.82; x += 4) if (r() > 0.4) ctx.fillRect(x, h * 0.86, 2 + (r() > 0.7 ? 1 : 0), h * 0.08);
};

/** Fashion croquis sketch for the inside of the sketchbook. */
export const paintCroquis: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#FBF6EA";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(60,60,60,0.12)";
  ctx.lineWidth = 1;
  for (let y = 30; y < h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const cx = w * 0.42;
  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  // head + neck
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.13, w * 0.04, h * 0.045, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.175);
  ctx.lineTo(cx, h * 0.22);
  ctx.stroke();
  // saree-inspired gown (haldi wash + sindoor border)
  ctx.fillStyle = "rgba(227,178,60,0.75)";
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.07, h * 0.24);
  ctx.lineTo(cx + w * 0.07, h * 0.24);
  ctx.lineTo(cx + w * 0.05, h * 0.42);
  ctx.quadraticCurveTo(cx + w * 0.22, h * 0.7, cx + w * 0.2, h * 0.86);
  ctx.lineTo(cx - w * 0.18, h * 0.86);
  ctx.quadraticCurveTo(cx - w * 0.16, h * 0.62, cx - w * 0.05, h * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = COLORS.sindoor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.18, h * 0.855);
  ctx.lineTo(cx + w * 0.2, h * 0.855);
  ctx.stroke();
  // pallu drape
  ctx.strokeStyle = COLORS.sindoor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.06, h * 0.25);
  ctx.quadraticCurveTo(cx - w * 0.02, h * 0.4, cx - w * 0.1, h * 0.55);
  ctx.stroke();
  // arms + legs
  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.07, h * 0.25);
  ctx.lineTo(cx - w * 0.12, h * 0.45);
  ctx.moveTo(cx + w * 0.07, h * 0.25);
  ctx.lineTo(cx + w * 0.13, h * 0.42);
  ctx.moveTo(cx - w * 0.02, h * 0.86);
  ctx.lineTo(cx - w * 0.03, h * 0.97);
  ctx.moveTo(cx + w * 0.04, h * 0.86);
  ctx.lineTo(cx + w * 0.06, h * 0.97);
  ctx.stroke();
  // notes
  const hand = fontFamily("--font-kalam");
  ctx.fillStyle = "#3a2c20";
  ctx.font = `400 ${Math.round(h * 0.04)}px ${hand}`;
  ctx.textAlign = "left";
  ctx.fillText("haldi silk +", w * 0.66, h * 0.32);
  ctx.fillText("sindoor border", w * 0.66, h * 0.37);
  ctx.fillText("kantha detail ✦", w * 0.66, h * 0.62);
  ctx.font = `700 ${Math.round(h * 0.05)}px ${hand}`;
  ctx.fillText("sketch no. 7", w * 0.06, h * 0.06 + 10);
};

/** Contact sticky note artwork. */
export const paintNote: Painter = (ctx, w) => {
  const size = w;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#FBE48A");
  g.addColorStop(1, "#F2CF55");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.fillRect(0, 0, size, 70);
  const family = fontFamily("--font-kalam");
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

// ── Onayakhi store ──────────────────────────────────────────────────────────

/**
 * Hand-painted wooden arrow pointing right: "Way to store" + footprints.
 * Transparent outside the arrow — use with alphaTest.
 */
export const paintStoreSign: Painter = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const tip = w * 0.84;
  const inset = h * 0.14;
  const arrow = () => {
    ctx.beginPath();
    ctx.moveTo(6, inset);
    ctx.lineTo(tip, inset);
    ctx.lineTo(tip, 4);
    ctx.lineTo(w - 4, h / 2);
    ctx.lineTo(tip, h - 4);
    ctx.lineTo(tip, h - inset);
    ctx.lineTo(6, h - inset);
    ctx.closePath();
  };
  // Plank with wood grain
  arrow();
  ctx.fillStyle = "#7A4B2E";
  ctx.fill();
  ctx.save();
  arrow();
  ctx.clip();
  const r = rng(21);
  for (let i = 0; i < 26; i++) {
    const y = r() * h;
    ctx.strokeStyle = `rgba(40,22,10,${0.15 + r() * 0.2})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 14, w * 0.6, y + (r() - 0.5) * 14, w, y + (r() - 0.5) * 8);
    ctx.stroke();
  }
  ctx.restore();
  // Painted haldi border
  arrow();
  ctx.strokeStyle = COLORS.haldi;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = "rgba(27,20,16,0.55)";
  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(w * 0.02, h * 0.05);
  ctx.scale(0.96, 0.9);
  arrow();
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);
  // Lettering
  ctx.fillStyle = COLORS.cream;
  ctx.strokeStyle = "rgba(27,20,16,0.85)";
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `400 ${Math.round(h * 0.4)}px ${fontFamily("--font-yatra", "serif")}`;
  ctx.strokeText("Way to store", w * 0.05, h * 0.5);
  ctx.fillText("Way to store", w * 0.05, h * 0.5);
  // Little footprints walking towards the tip
  ctx.fillStyle = COLORS.haldi;
  for (let i = 0; i < 3; i++) {
    const x = w * 0.74 + i * w * 0.04;
    const y = h / 2 + (i % 2 ? -1 : 1) * h * 0.09;
    ctx.beginPath();
    ctx.ellipse(x, y, h * 0.035, h * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};
