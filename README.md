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
- **Interactive desk and wall:** every object reacts to a click with its own animation and sound, plus a label that can jump into the matching portfolio section.

  | Object | What it does | Opens |
  |---|---|---|
  | Thread spools | Unspools a thread across the mat | Embroidery |
  | Tailor's shears | Snips and drops a fabric scrap | Product Design |
  | Pin cushion | Pins pop out | Jewellery |
  | Paint palette | Click a colour to dye the top fabric swatch | Prints |
  | Fabric swatches | Shuffles the stack | Batik |
  | Sketchbook | Opens to a fashion croquis | About |
  | Brush jar | Rattles | Personal Endeavours |
  | Alpona coaster | Redraws its rice-paste pattern | Contents |
  | Gamchha | Unfolds | Weaving |
  | Onayakhi mug (on the coaster) | Slurp: the coffee level drops | @0nayakhi on Instagram |
  | Onayakhi bag (under the window) | Rocks | @0nayakhi on Instagram |
  | Measuring tape | Reels in | — |
  | Desk lamp | Switches on or off | — |
  | Window | Changes the time of day | — |
  | Kantha frame | Stitches its border | Embroidery |
  | Mood-board polaroids | — | Their page |
  | Student ID card | Swings | — |
  | Tapestry loom | Weaves a row | Weaving |
  | NIFT Bangalore pennant | Swings | Cover |

  The campus and ID-card text live in `data/profile.ts`, and the Onayakhi brand link lives in `data/onayakhi.ts`. Its artwork was cropped from Anu's product photos into `public/textures/onayakhi-*.jpg`. Sound is off by default; the speaker button turns it on. All sounds are synthesised in `lib/sound.ts`, so there are no audio files.
- **Contact sticky note:** the yellow note on the wall opens a larger card with tap-to-call, tap-to-email and copy buttons. The details live in `data/contact.ts`, the wall note is in `components/three/props/StickyNote.tsx`, and the card is in `components/ui/ContactCard.tsx`.
- **Contents page:** on page 5, the labels held by Durga are clickable. The viewer riffles through a few pages and lands on that section. Positions and links are in `hotspots` in `data/slides.ts`. Labels without pages yet show "coming soon"; give them a `section` once their pages exist.

- **Viewer controls:** ← / → (or swipe) to turn pages, Home / End to jump to the first or last page, and Esc to close.
- **Reduced motion:** with "reduce motion" turned on in the OS, the camera cuts instead of flying and pages crossfade.
- **Performance:** the 3D scene stops rendering while the viewer is open. All props are simple shapes, so there are no model downloads.
