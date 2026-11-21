"use client";

/**
 * Canvas artwork for the Onayakhi store: shopfront, signboard, and painted
 * stand-ins for products until real photos are added (see data/store.ts).
 * Everything is in the brand's folk palette, like the rest of the site.
 */
import { COLORS } from "../materials";
import { fontFamily, rng } from "../textures";

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const MAROON = "#7A1C22";
const yatra = (px: number) => `400 ${Math.round(px)}px ${fontFamily("--font-yatra", "serif")}`;
const brand = (px: number, weight = 500) => `${weight} ${Math.round(px)}px ${fontFamily("--font-cormorant", "serif")}`;
const kalam = (px: number, weight = 700) => `${weight} ${Math.round(px)}px ${fontFamily("--font-kalam", "cursive")}`;

/**
 * The brand mark: a woman's profile facing right, with a big folk-art eye and
 * a red bindi — "the bindi represents identity, the profile self-expression".
 */
/**
 * The Onayakhi wordmark, as on the logo: a red dot standing in for the "O",
 * then N A Y A K H I in widely spaced serif capitals. Centred on (cx, cy).
 */
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  capHeight: number,
  color = MAROON,
  dot = "#B5121B",
) {
  const letters = "NAYAKHI".split("");
  const px = capHeight / 0.63; // Cormorant's caps are ~63% of the em
  ctx.save();
  ctx.font = brand(px);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const gap = capHeight * 0.62;
  const r = capHeight * 0.52;
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = r * 2 + gap + widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1);
  let x = cx - total / 2;
  const base = cy + capHeight / 2;
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(x + r, cy, r, 0, Math.PI * 2);
  ctx.fill();
  x += r * 2 + gap;
  ctx.fillStyle = color;
  letters.forEach((l, i) => {
    ctx.fillText(l, x, base);
    x += widths[i] + gap;
  });
  ctx.restore();
}

export function drawProfile(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, ink = COLORS.ink) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // Hair: a dark mass with a bun at the back
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(10, -78);
  ctx.bezierCurveTo(-40, -92, -78, -50, -70, 0);
  ctx.bezierCurveTo(-66, 40, -40, 70, -20, 86);
  ctx.lineTo(4, 40);
  ctx.bezierCurveTo(-6, 10, -8, -30, 10, -78);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-74, -22, 26, 0, Math.PI * 2);
  ctx.fill();
  // Face (skin) — forehead, nose, lips, chin, neck
  ctx.fillStyle = "#E7B48A";
  ctx.beginPath();
  ctx.moveTo(10, -78);
  ctx.bezierCurveTo(34, -70, 44, -46, 44, -28);
  ctx.lineTo(60, 2);
  ctx.lineTo(46, 8);
  ctx.bezierCurveTo(50, 16, 46, 20, 42, 22);
  ctx.bezierCurveTo(48, 28, 44, 34, 38, 36);
  ctx.bezierCurveTo(38, 50, 28, 56, 16, 54);
  ctx.lineTo(14, 92);
  ctx.lineTo(-20, 92);
  ctx.lineTo(-20, 86);
  ctx.bezierCurveTo(-4, 50, -10, 0, 10, -78);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Folk eye (almond + pupil) and brow
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(24, -26, 13, 6, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(29, -26, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -40);
  ctx.quadraticCurveTo(26, -48, 42, -38);
  ctx.stroke();
  // Lips
  ctx.fillStyle = COLORS.sindoor;
  ctx.beginPath();
  ctx.ellipse(42, 22, 5, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Bindi
  ctx.fillStyle = "#D7192A";
  ctx.beginPath();
  ctx.arc(34, -52, 6, 0, Math.PI * 2);
  ctx.fill();
  // Jhumka earring
  ctx.fillStyle = COLORS.haldi;
  ctx.beginPath();
  ctx.arc(-14, 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-24, 26);
  ctx.quadraticCurveTo(-14, 12, -4, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Lotus — the 🪷 from the bio. */
function drawLotus(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  for (const [a, len] of [[0, 1], [-0.55, 0.85], [0.55, 0.85], [-1.05, 0.65], [1.05, 0.65]] as const) {
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12, -24 * len, 0, -44 * len);
    ctx.quadraticCurveTo(12, -24 * len, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ── Street ───────────────────────────────────────────────────────────────────

/** Shop board: the brand's cream paper with a maroon frame and the wordmark. */
export const paintSignboard: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#F7F0E6";
  ctx.fillRect(0, 0, w, h);
  // Soft paper grain
  const r = rng(31);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(120,80,50,${r() * 0.05})`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.strokeStyle = MAROON;
  ctx.lineWidth = h * 0.05;
  ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h * 0.88);
  ctx.lineWidth = h * 0.012;
  ctx.strokeRect(h * 0.13, h * 0.13, w - h * 0.26, h * 0.74);
  drawWordmark(ctx, w / 2, h / 2, h * 0.34);
};

/** Sindoor + cream awning stripes with a scalloped edge drawn below. */
export const paintAwning: Painter = (ctx, w, h) => {
  const n = 12;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? COLORS.cream : COLORS.sindoor;
    ctx.fillRect((i * w) / n, 0, w / n + 1, h);
  }
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, h * 0.85, w, h * 0.15);
};

/** Footpath: big sandstone slabs with joints. */
export const paintPaving: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#c9b79a";
  ctx.fillRect(0, 0, w, h);
  const r = rng(5);
  const cols = 4;
  const rows = 4;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const l = 70 + r() * 14;
      ctx.fillStyle = `hsl(35, 22%, ${l}%)`;
      ctx.fillRect((x * w) / cols + 2, (y * h) / rows + 2, w / cols - 4, h / rows - 4);
    }
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(60,40,20,${r() * 0.12})`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
};

/** Asphalt with a dashed centre line (the texture repeats along the road). */
export const paintRoad: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#4a4a4f";
  ctx.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${r() * 0.08})`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.fillStyle = "#e8e2c8";
  ctx.fillRect(w * 0.1, h * 0.48, w * 0.4, h * 0.04);
  ctx.fillRect(w * 0.6, h * 0.48, w * 0.4, h * 0.04);
};

// ── Interior ─────────────────────────────────────────────────────────────────

/** Terracotta floor tiles. */
export const paintFloor: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#8a4a2e";
  ctx.fillRect(0, 0, w, h);
  const r = rng(17);
  const n = 4;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.fillStyle = `hsl(18, ${45 + r() * 10}%, ${36 + r() * 8}%)`;
      ctx.fillRect((x * w) / n + 3, (y * h) / n + 3, w / n - 6, h / n - 6);
    }
  }
};

/** Alpona frieze for the bottom of the store walls (repeats horizontally). */
export const paintFrieze: Painter = (ctx, w, h) => {
  ctx.fillStyle = MAROON;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#f6ebd3";
  ctx.fillStyle = "#f6ebd3";
  ctx.lineWidth = 3;
  // Wavy vine with dots and lotuses
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h / 2 + Math.sin((x / w) * Math.PI * 4) * h * 0.18);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    drawLotus(ctx, (i + 0.25) * (w / 4), h * 0.72, h / 110, "#f6ebd3");
    ctx.beginPath();
    ctx.arc((i + 0.75) * (w / 4), h * 0.25, h * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.haldi;
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
};

/** The brand-story poster: profile, ONAYAKHI, the tagline. */
export const paintPoster: Painter = (ctx, w, h) => {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, w, h);
  // Sindoor arch behind the profile
  ctx.fillStyle = COLORS.sindoor;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.62);
  ctx.lineTo(w * 0.18, h * 0.3);
  ctx.arc(w / 2, h * 0.3, w * 0.32, Math.PI, 0);
  ctx.lineTo(w * 0.82, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.haldi;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.32, w * 0.24, 0, Math.PI * 2);
  ctx.fill();
  drawProfile(ctx, w * 0.49, h * 0.36, w / 330);
  // Lotus row
  for (let i = 0; i < 5; i++) drawLotus(ctx, w * (0.22 + i * 0.14), h * 0.66, w / 900, i % 2 ? COLORS.teal : COLORS.rose);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = MAROON;
  ctx.font = yatra(w * 0.13);
  ctx.fillText("ONAYAKHI", w / 2, h * 0.76);
  ctx.fillStyle = COLORS.ink;
  ctx.font = kalam(w * 0.052);
  ctx.fillText("Uniquely Her. Uniquely Crafted.", w / 2, h * 0.85);
  ctx.font = kalam(w * 0.036, 400);
  ctx.fillStyle = "rgba(27,20,16,0.7)";
  ctx.fillText("Inspired by “Anokhi” — meaning unique", w / 2, h * 0.92);
  ctx.strokeStyle = COLORS.sindoor;
  ctx.lineWidth = w * 0.015;
  ctx.strokeRect(w * 0.03, h * 0.02, w * 0.94, h * 0.96);
};

/** "A little rhythm on the walls" — bands of folk motifs. */
export const paintTapestry: Painter = (ctx, w, h) => {
  const bands = [COLORS.sindoor, COLORS.cream, COLORS.teal, COLORS.haldi, MAROON, COLORS.cream, COLORS.indigo, COLORS.haldi];
  const bh = h / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * bh, w, bh);
    const ink = c === COLORS.cream || c === COLORS.haldi ? MAROON : COLORS.cream;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    const y = i * bh;
    const n = 9;
    for (let k = 0; k < n; k++) {
      const x = (k + 0.5) * (w / n);
      switch (i % 4) {
        case 0: // triangles
          ctx.beginPath();
          ctx.moveTo(x - bh * 0.3, y + bh * 0.8);
          ctx.lineTo(x, y + bh * 0.2);
          ctx.lineTo(x + bh * 0.3, y + bh * 0.8);
          ctx.fill();
          break;
        case 1: // dots
          ctx.beginPath();
          ctx.arc(x, y + bh / 2, bh * 0.14, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 2: // lotus
          drawLotus(ctx, x, y + bh * 0.82, bh / 70, ink);
          break;
        default: // waves
          ctx.beginPath();
          ctx.arc(x, y + bh * 0.7, bh * 0.25, Math.PI, 0);
          ctx.stroke();
      }
    }
  });
  // Woven texture
  const r = rng(12);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.07})`;
    ctx.fillRect(r() * w, r() * h, 3, 1);
  }
};

/** Deck-chair sling: "a spectrum of weaves" — graded stripes with a twill texture. */
export const paintWeave: Painter = (ctx, w, h) => {
  const stripes = [COLORS.sindoor, "#d9562e", COLORS.haldi, COLORS.cream, COLORS.bamboo, COLORS.teal, COLORS.indigo, COLORS.rose];
  const sw = w / stripes.length;
  stripes.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * sw, 0, sw + 1, h);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(i * sw + sw * 0.45, 0, sw * 0.1, h);
  });
  // Twill: diagonal ribs
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 2;
  for (let x = -h; x < w; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
};

/** "Happy customers 🌻" note on the counter. */
export const paintHappyNote: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#fdf3b0";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "center";
  ctx.font = kalam(h * 0.16);
  ctx.fillText("Happy", w / 2, h * 0.32);
  ctx.fillText("customers", w / 2, h * 0.52);
  // Little sunflower
  ctx.fillStyle = COLORS.haldi;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(w / 2 + Math.cos(a) * h * 0.1, h * 0.76 + Math.sin(a) * h * 0.1, h * 0.06, h * 0.03, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#5a3a1a";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.76, h * 0.06, 0, Math.PI * 2);
  ctx.fill();
};

/** Small hanging "Open" board on the door. */
export const paintOpen: Painter = (ctx, w, h) => {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = COLORS.sindoor;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = COLORS.sindoor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = yatra(h * 0.42);
  ctx.fillText("Open", w / 2, h * 0.52);
};

/** Painted shop window lettering (transparent glass with gold script). */
export const paintGlassLettering: Painter = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(227,178,60,0.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = kalam(h * 0.2);
  ctx.fillText("handcrafted", w / 2, h * 0.38);
  ctx.font = kalam(h * 0.14, 400);
  ctx.fillText("art · textiles · gifts", w / 2, h * 0.64);
};
