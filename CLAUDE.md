# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # dev server on :3000 (Turbopack)
npm run dev:webpack    # Webpack fallback — see "Build tooling"
npm run build          # production build
npm run lint           # ESLint (next core-web-vitals + typescript)
npx tsc --noEmit       # type-check (run `next build`/`next dev` once first so `LayoutProps` types exist)
npm run export-slides  # macOS only: re-render source/portfolio.pdf → public/slides/NN.jpg + public/textures/book-cover.jpg
```

There is no test suite. Verify changes visually by running the dev server and loading the page in a browser. Most bugs here are visual, such as camera framing, layout or animation.

## What this is

This is a single-page portfolio for Anusmita Nath (NIFT). An R3F study-desk scene shows a closed book. Clicking it zooms the camera in and opens the cover. A 2D Framer Motion flipbook overlay then shows the portfolio pages, which are JPEG renders of the PDF in `source/`. The PDF is git-ignored and 52 MB, so it must never go in `public/`.

## Architecture

**The phase state machine is in `app/page.tsx`. It is the spine of the app.** `Phase` (`lib/phase.ts`) is `loading → intro → opening → viewer → closing → intro`. Every visual layer is driven only by `phase`:
- `CameraRig` maps each phase to a shot preset: `loading` → wide, `intro` and `closing` → hero, `opening` and `viewer` → closeup.
- `Book` damps its cover angle toward open or closed based on the phase. It fires the callbacks that advance the machine. `onOpened` fires when the cover passes about 150° during `opening`, and `onClosed` fires when the cover is nearly shut during `closing`. Transitions are therefore driven by the animation, not by timers.
- `IntroOverlay` and `PortfolioViewer` (`open={phase === "viewer"}`) are HTML layers over the canvas.
- `Scene` sets `frameloop="never"` while in `viewer`, so the GPU idles behind the overlay. Anything that must animate in the viewer phase has to be HTML, not R3F.
- `loading → intro` happens when the `<Ready>` component inside the scene's `<Suspense>` mounts, which means the cover texture has loaded.

All transitions use functional `setPhase(p => p === X ? Y : p)`, so stray or duplicate callbacks are harmless. Keep that pattern.

**3D scene (`components/three/`):**
- `Scene` is loaded with `dynamic(..., { ssr: false })` from the client page, which keeps three.js out of the server.
- All animation uses `maath` `easing.damp*` in `useFrame`, which is frame-rate independent. Reduced motion is handled by passing a near-zero smooth time.
- **Coordinates:** the desk surface is at y = 0, and the book is centred at the origin, landscape 5:3 (`BOOK` in `Book.tsx`). The cover pivots about the spine at x = −W/2 by rotating around **z**. When it is open, the cover lies over x ∈ [−4.5, −1.5]. Props in `Scene.tsx` are deliberately placed outside that footprint, so check it before moving them.
- `CameraRig` scales each shot's distance by a `halfWidth` that must stay visible. That is how portrait phones get framed, so adjust `halfWidth` rather than adding breakpoints.
- Props are primitive geometry only, with no GLTF and no remote HDRI. `Environment` uses `Lightformer`s. Textures for the wood, tape measure and halo are drawn procedurally to canvases. Share materials through `getMaterials()` and colours through `COLORS` in `materials.ts`.

**Viewer (`components/ui/PortfolioViewer.tsx`):**
- Every page hinges on its left edge (`transform-origin: left`). Going *next* turns the outgoing page over to the left. Going *prev* swings the incoming page back in from the left.
- Direction is passed with `custom` to `AnimatePresence` and the variants.
- Neighbouring slides are warmed with `getImageProps` and `react-dom` `preload`, using the same `sizes` as the visible `<Image>`, so the srcset matches.
- In Next 16, `<Image priority>` is deprecated. Use `preload`.

**Room and time of day:** `Room.tsx` draws the white back wall as four boxes around a window opening (`WINDOW`), plus side walls, a floor and a canvas-painted sky behind the glass. `atmosphere.ts` defines four presets (morning, day, evening, night) for sky, light colours and intensities, and the lamp. `useTimeOfDay()` reads the local hour every minute, and `?time=<preset>` forces one. The shadow-casting directional light sits *outside*, behind the wall (`WINDOW_LIGHT_POS` in `Scene.tsx`). Because the walls cast shadows, that light only enters through the window, which produces the window-shaped patch on the desk. If you move the window or the light, keep the ray from the book to the light passing through the opening. The `fill` light is what keeps the wall reading as white.

**Contents page:** `hotspots` on slide 5 (`data/slides.ts`) place percentage-positioned buttons over the labels in the artwork. `flipTo()` in the viewer riffles through up to `RIFFLE_PAGES` in-between pages with fast turns, using timeouts that are cleared on any manual navigation, then does one normal turn onto the target. Hotspots without a `section` show a "coming soon" note.

**Interactive objects (`components/three/desk/`):**
- Every clickable desk or wall object is wrapped in `<Interactive name label hint section|page sound onActivate>`. It provides the hover lift, pointer cursor, sound cue and the kraft label with an "Open … ⟶" link.
- Only one label shows at a time, via `active` in `DeskContext`. `Scene.tsx` provides that context, and interactions are enabled only in `intro`.
- Labels are drei `<Html>`. On narrow screens they are portalled to `document.body` as a centred card, because labels of edge objects clipped.
- The link calls `onOpenPage(i)` in `app/page.tsx`. That bumps `opening.count`, which remounts `PortfolioViewer` via its `key`, and sets `startIndex`. The viewer then `flipTo`s that page after it opens.

**Animations:**
- Click animations use `useTrigger()` (`fire()` in the handler, `since(state)` in `useFrame`) plus the `smooth` and `wobble` helpers. Don't put per-frame state in React.
- Canvas artwork lives in `components/three/textures.ts`. `sharedTexture` is cached and static, while `animatedCanvas` is per-instance and redrawn with `draw(progress)`. Mutating a `useMemo` value inside `useFrame` trips the `react-hooks/immutability` lint, which is why `animatedCanvas` exposes methods instead.

**Raycasting gotchas:**
- R3F only raycasts objects that have handlers, so non-interactive meshes such as walls don't block clicks.
- Thin objects (scissors, tape) need an invisible `opacity={0}` hit box. The window uses an opening-sized pane.

**Onayakhi store (`components/three/store/`):**
- The canvas has two places, `Place = "studio" | "store"` in `lib/phase.ts`. `Scene.tsx` renders `Studio.tsx`, which holds the whole study and its lights, or the lazy-loaded `store/Store.tsx`. Each place owns its own lights, fog and camera rig.
- `app/page.tsx` runs the trip. The wall's `StoreSign` calls `desk.goToStore`, which triggers the `walk` sound and the black `TravelCurtain`. Behind the curtain, `place` swaps after 400 ms. The curtain lifts only once at least 2 s have passed **and** the new place's `<Ready>` has fired `onPlaceReady`. A `travelling` ref ignores repeat clicks.
- `CameraRig` snaps (rather than flies) when it remounts outside `loading`.
- `StoreView` (`street`/`inside`) and the stop index live in `page.tsx`, because `StoreOverlay` drives them.
- **Layout:**
  - The street and the interior are one continuous set. "Step inside" just changes the camera shot, so it dollies through the door.
  - The facade is at `FACADE_Z` (−1), and the shop box is `SHOP` in `Interior.tsx`. The facade's half-width matches the interior, so the neighbouring buildings don't poke into the shop.
  - Stop camera shots are `STOPS` in `Store.tsx`, in the same order as `storeStops` in `data/store.ts`.
- **Products:**
  - Each product is a `StoreItem`, which wraps `Interactive`. Clicking it reports its bounding-box centre to `FocusContext`, and the camera leans towards that point.
  - The store provides its own `DeskContext`, with `enabled` only while inside.
  - Product art is a painted canvas, or `/store/<id>.webp` when `photo: true` is set in `data/store.ts`. Keep the flag accurate, because a missing file makes `useTexture` throw.
- `MugBody` and `BagBody` are the reusable meshes behind the desk mug and bag. They take a `Trigger`.
- `Interactive` has a `direct` mode, used by the sign: a click runs `onActivate` only, and the hover caption doesn't intercept clicks.

**Wall layout:**
- Wall items sit right of the window. The "Way to store" sign has the top-right spot beside the title. The NIFT pennant hangs on the right side wall and drops that rotation in its compact spot. On narrow screens, some items take a `compactPosition` through `useResponsivePosition`. Phones see much more wall height, so compact spots sit higher.
- Thumbnails for the mood-board polaroids come from `public/slides/thumbs/`, which `npm run export-slides` generates.

**Content:** `data/slides.ts` is the single source of truth for pages. Each entry has `src`, a `section` that feeds the section `<select>` (`sections` is derived from it) and `title`/`alt` text written from the PDF's own text. Adding a page means exporting the image and adding an entry here.

**Theme:** palette tokens (`sindoor`, `haldi`, `cream`, `kraft`, `ink`, `bamboo`, `teal`) and fonts (`font-display` = Yatra One, `font-hand` = Kalam, `font-sans` = Inter) are defined in `app/globals.css` with `@theme inline`. They mirror `COLORS` in `materials.ts`, so keep the two in sync. The look follows the PDF's Indian folk-art style.

## Build tooling

Tailwind v4 is wired in through the `@tailwindcss/turbopack` loader, and there is **no PostCSS config**. For Webpack mode, `next.config.ts` has a `webpack()` hook that adds the same loader to every rule that uses `css-loader`. Without it, no Tailwind CSS is generated and the page renders unstyled. If you change the CSS pipeline, check that both modes still style the page.

The internet connection in this environment has been very slow, and an interrupted install once truncated `node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node`. When that happens, Next falls back to WASM and Turbopack refuses to run. Use `npm run dev:webpack` until the binary is reinstalled.

`next.config.ts` also enables `cacheComponents` and `partialPrefetching`, which are scaffold defaults, and sets `devIndicators: false` because the Next badge overlapped the viewer's Prev button.
