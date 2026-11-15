# Anu's Portfolio

Portfolio site for **Anusmita Nath** (NIFT). It opens on a 3D study desk. Click the book and the camera zooms in, the cover opens, and you can flip through her 25-page portfolio.

Built with Next.js 16 (App Router), React Three Fiber, drei, Tailwind CSS v4 and Framer Motion.

## Run it

```bash
npm install
npm run dev        # → http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run dev:webpack` | Dev server in Webpack mode (fallback if the native SWC binary is broken) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run export-slides` | Re-export the PDF pages to `public/slides` (macOS only) |

## Updating the portfolio pages

The slides are images exported from the PDF:

1. Put the new PDF at `source/portfolio.pdf`.
2. Run `npm run export-slides`. This uses macOS PDFKit, so nothing extra needs installing. It writes `public/slides/01.jpg…` and the book-cover texture `public/textures/book-cover.jpg`.
3. If the number of pages changes, or you want new titles or sections, edit [`data/slides.ts`](data/slides.ts). Each page has a `section` (which feeds the section menu), a `title` (shown under the page) and `alt` text (for screen readers).

## Project structure

```
app/
  page.tsx              Phase state machine: loading → intro → opening → viewer → closing
  layout.tsx            Fonts (Yatra One, Kalam, Inter) + metadata
  globals.css           Tailwind v4 theme tokens (sindoor, haldi, cream, ink, bamboo, teal)
components/
  three/
    Scene.tsx           Canvas, lights, environment, prop layout
    CameraRig.tsx       Camera shots (wide → hero → close-up), eased with maath
    Book.tsx            Clickable book: hinged cover, hover lift + halo
    Desk.tsx            Procedural wood desk, cutting mat, back wall
    materials.ts        Shared palette + materials
    props/              Palette, Sketchbook, PinCushion, ThreadSpools, Scissors,
                        BrushJar, TapeMeasure, FabricSwatches, DeskLamp
  ui/
    IntroOverlay.tsx    "Welcome To Anu's Portfolio" title + open button
    PortfolioViewer.tsx Flipbook: page turns, swipe, keys, section menu
    StitchButton.tsx    Stitched kraft-paper button
data/slides.ts          Page list (src, section, title, alt)
lib/phase.ts            Phase type
scripts/export-slides.swift
```

## Notes

- **Time of day:** the room follows the visitor's clock. Morning (5–10) shows a sunrise, day (10–16) a bright sky, evening (16–19) a sunset with the lamp on, and night a moon and stars with the lamp on. Sun or moon light comes through the window onto the desk. To preview a look, add `?time=morning`, `?time=day`, `?time=evening` or `?time=night` to the URL. To tweak a look, edit `components/three/atmosphere.ts`.
- **Contents page:** on page 5, the labels held by Durga are clickable. The viewer riffles through a few pages and lands on that section. Positions and links are in `hotspots` in `data/slides.ts`. Labels without pages yet show "coming soon"; give them a `section` once their pages exist.

- **Viewer controls:** ← / → (or swipe) to turn pages, Home / End to jump to the first or last page, and Esc to close.
- **Reduced motion:** with "reduce motion" turned on in the OS, the camera cuts instead of flying and pages crossfade.
- **Performance:** the 3D scene stops rendering while the viewer is open. All props are simple shapes, so there are no model downloads.
