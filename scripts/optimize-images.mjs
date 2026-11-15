// Converts the images the 3D scene loads directly (they skip next/image's
// automatic optimisation) to WebP, sized for how big they appear on screen.
//
//   node scripts/optimize-images.mjs        (also run by `npm run export-slides`)
//
// The portfolio pages in public/slides/NN.jpg are left as-is: the viewer serves
// them through next/image, which already resizes them and converts them to WebP/AVIF.
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const pub = (p) => path.join(root, "public", p);

/** [source jpg, max width, quality, delete source afterwards?] */
const jobs = [
  // The book cover: seen large in the close-up, so keep 1024px.
  ["textures/book-cover.jpg", 1024, 80, true],
  // Onayakhi brand artwork (cropped from Anu's product photos).
  ["textures/onayakhi-bag.jpg", 512, 82, true],
  ["textures/onayakhi-mug-art.jpg", 256, 85, true],
  ["textures/onayakhi-tag.jpg", 192, 85, true],
];

// Mood-board polaroid thumbnails: tiny on the wall, 320px is plenty.
const thumbs = pub("slides/thumbs");
if (existsSync(thumbs)) {
  for (const f of readdirSync(thumbs).filter((f) => f.endsWith(".jpg"))) {
    jobs.push([`slides/thumbs/${f}`, 320, 75, true]);
  }
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
let before = 0;
let after = 0;

for (const [rel, width, quality, removeSource] of jobs) {
  const src = pub(rel);
  if (!existsSync(src)) continue;
  const out = src.replace(/\.jpe?g$/i, ".webp");
  await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(out);
  const a = statSync(src).size;
  const b = statSync(out).size;
  before += a;
  after += b;
  console.log(`✓ ${rel} ${kb(a)} → ${path.basename(out)} ${kb(b)}`);
  if (removeSource) unlinkSync(src);
}

if (before) console.log(`\nTotal ${kb(before)} → ${kb(after)} (−${Math.round((1 - after / before) * 100)}%)`);
else console.log("Nothing to optimise (already WebP).");
