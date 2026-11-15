"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import { AnimatePresence, motion, type PanInfo, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SLIDE_HEIGHT, SLIDE_WIDTH, sections, slides, type Hotspot } from "@/data/slides";
import { play } from "@/lib/sound";
import { SoundToggle } from "./SoundToggle";
import { StitchButton } from "./StitchButton";

const SIZES = "(max-width: 768px) 100vw, min(92vw, 1600px)";
const EASE = [0.45, 0, 0.2, 1] as const;

/** Normal page turn vs. the quick riffle used when jumping several pages. */
const TURN = { normal: 0.75, fast: 0.32 } as const;
/** Gap between pages while riffling. */
const RIFFLE_STEP_MS = 230;
/** How many in-between pages to show when jumping (the "2–3 page flip"). */
const RIFFLE_PAGES = 3;

type Turn = { dir: number; fast: boolean };

/**
 * All pages hinge on their left edge (the book's spine):
 *  - next: the current page lifts and turns over to the left, revealing the next one beneath;
 *  - prev: the previous page swings back in from the left on top.
 */
const flip: Variants = {
  enter: ({ dir }: Turn) =>
    dir > 0 ? { rotateY: 0, opacity: 0.4, zIndex: 0 } : { rotateY: -110, opacity: 1, zIndex: 2 },
  center: ({ fast }: Turn) => ({
    rotateY: 0,
    opacity: 1,
    zIndex: 1,
    transition: { duration: fast ? TURN.fast : TURN.normal, ease: EASE },
  }),
  exit: ({ dir, fast }: Turn) =>
    dir > 0
      ? { rotateY: -110, opacity: 1, zIndex: 2, transition: { duration: fast ? TURN.fast : TURN.normal, ease: EASE } }
      : { opacity: 0, zIndex: 0, transition: { duration: fast ? TURN.fast : TURN.normal } },
};

const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/** Shading that darkens a page while it is turning. */
const shade: Variants = {
  enter: { opacity: 0.45 },
  center: { opacity: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0.55, transition: { duration: 0.6, ease: EASE } },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Warm the browser cache with the exact srcset next/image will request. */
function preloadSlide(i: number) {
  const s = slides[i];
  if (!s) return;
  const { props } = getImageProps({ src: s.src, alt: "", width: SLIDE_WIDTH, height: SLIDE_HEIGHT, sizes: SIZES });
  preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes });
}

/** Evenly spaced in-between pages from `from` to `to` (exclusive of both). */
function riffleSteps(from: number, to: number) {
  const gap = Math.abs(to - from) - 1;
  const n = Math.min(RIFFLE_PAGES, gap);
  const steps: number[] = [];
  for (let k = 1; k <= n; k++) {
    const i = Math.round(from + ((to - from) * k) / (n + 1));
    if (i !== from && i !== to && !steps.includes(i)) steps.push(i);
  }
  return steps;
}

type Props = {
  open: boolean;
  /** Page to riffle to once the viewer has opened (desk-object links). */
  startIndex?: number;
  reducedMotion: boolean;
  onClose: () => void;
};

export function PortfolioViewer({ open, startIndex = 0, reducedMotion, onClose }: Props) {
  const [view, setView] = useState({ index: 0, dir: 1, fast: false });
  const [notice, setNotice] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const { index } = view;
  const slide = slides[index];
  const last = slides.length - 1;

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /** Single page turn (or a plain jump with reduced motion). */
  const goTo = useCallback(
    (target: number, fast = false) => {
      const to = Math.max(0, Math.min(last, target));
      setView((v) => (to === v.index ? v : { index: to, dir: to > v.index ? 1 : -1, fast }));
      play("paper");
    },
    [last],
  );

  /** Jump with a quick riffle through a few in-between pages, then a normal final turn. */
  const flipTo = useCallback(
    (target: number) => {
      clearTimers();
      const to = Math.max(0, Math.min(last, target));
      const steps = reducedMotion ? [] : riffleSteps(index, to);
      steps.forEach((i, k) => {
        timers.current.push(window.setTimeout(() => goTo(i, true), k * RIFFLE_STEP_MS));
      });
      timers.current.push(window.setTimeout(() => goTo(to), steps.length * RIFFLE_STEP_MS));
      steps.forEach(preloadSlide);
      preloadSlide(to);
    },
    [goTo, index, last, reducedMotion],
  );

  // Opened from a desk object: riffle to its page once the viewer is in.
  const flipToRef = useRef(flipTo);
  useEffect(() => {
    flipToRef.current = flipTo;
  }, [flipTo]);
  useEffect(() => {
    if (!open || startIndex <= 0) return;
    const t = window.setTimeout(() => flipToRef.current(startIndex), 650);
    return () => window.clearTimeout(t);
  }, [open, startIndex]);

  const next = useCallback(() => {
    clearTimers();
    goTo(index + 1);
  }, [goTo, index]);
  const prev = useCallback(() => {
    clearTimers();
    goTo(index - 1);
  }, [goTo, index]);

  const openHotspot = (h: Hotspot) => {
    const s = h.section && sections.find((x) => x.name === h.section);
    if (s) flipTo(s.index);
    else setNotice(`${h.label} — coming soon`);
  };

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Keyboard navigation while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Home") flipTo(0);
      else if (e.key === "End") flipTo(last);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, flipTo, last, onClose]);

  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
    else clearTimers();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    preloadSlide(index + 1);
    preloadSlide(index - 1);
  }, [open, index]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -500) next();
    else if (info.offset.x > 60 || info.velocity.x > 500) prev();
  };

  const turn: Turn = { dir: view.dir, fast: view.fast };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio viewer"
          className="paper-grain fixed inset-0 z-20 flex flex-col bg-ink/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5 } }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <div aria-hidden className="folk-border h-2 w-full shrink-0" />

          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="hidden font-display text-xl text-haldi sm:block">Anu&apos;s Portfolio</p>

            <label className="flex min-w-0 items-center gap-2 font-hand text-cream/80">
              <span className="sr-only sm:not-sr-only">Section</span>
              <select
                value={slide.section}
                onChange={(e) => {
                  const s = sections.find((x) => x.name === e.target.value);
                  if (s) flipTo(s.index);
                }}
                className="max-w-[55vw] cursor-pointer truncate rounded-md border-2 border-dashed border-kraft/60 bg-ink px-3 py-1.5 font-hand text-base text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-haldi"
              >
                {sections.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
            <SoundToggle className="size-10" />
            <StitchButton ref={closeRef} onClick={onClose} aria-label="Close portfolio and return to the desk" className="px-3 py-2">
              <X className="size-5" aria-hidden />
              <span className="hidden sm:inline">Close</span>
            </StitchButton>
            </div>
          </header>

          {/* Stage */}
          <div className="flex min-h-0 flex-1 items-center justify-center px-3 sm:px-8">
            <motion.div
              className="relative aspect-[5/3] w-[min(94vw,calc((100dvh-11.5rem)*5/3))] cursor-grab touch-pan-y [perspective:2400px] active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={onDragEnd}
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0, transition: { duration: 0.6, ease: EASE } }}
            >
              {/* Page stack edge under the current page */}
              <div aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm bg-cream/25" />
              <div aria-hidden className="absolute inset-0 translate-x-0.75 translate-y-0.75 rounded-sm bg-cream/40" />

              <AnimatePresence initial={false} custom={turn}>
                <motion.figure
                  key={index}
                  custom={turn}
                  variants={reducedMotion ? fade : flip}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 overflow-hidden rounded-sm bg-cream shadow-[0_24px_60px_rgb(0_0_0/0.6)] [backface-visibility:hidden] [transform-origin:left_center]"
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes={SIZES}
                    preload={index === 0}
                    draggable={false}
                    className="pointer-events-none select-none object-cover"
                  />
                  {/* Spine shadow + turning shade */}
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/30 to-transparent" />
                  {!reducedMotion && (
                    <motion.div
                      aria-hidden
                      variants={shade}
                      className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent"
                    />
                  )}

                  {/* Clickable labels (contents page) */}
                  {slide.hotspots?.map((h) => (
                    <button
                      key={h.label}
                      type="button"
                      onClick={() => openHotspot(h)}
                      aria-label={h.section ? `Go to ${h.label}` : `${h.label} (coming soon)`}
                      className="group absolute cursor-pointer rounded-[40%] outline-none"
                      style={{ left: `${h.box[0]}%`, top: `${h.box[1]}%`, width: `${h.box[2]}%`, height: `${h.box[3]}%` }}
                    >
                      <span className="absolute inset-0 rounded-[40%] opacity-0 shadow-[0_0_0_3px_var(--color-haldi),0_0_28px_6px_rgb(227_178_60/0.55)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </button>
                  ))}
                </motion.figure>
              </AnimatePresence>

              {/* "Coming soon" note */}
              <AnimatePresence>
                {notice && (
                  <motion.p
                    key={notice}
                    role="status"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink/90 px-4 py-2 font-hand text-base text-cream shadow-lg outline-2 outline-dashed -outline-offset-4 outline-haldi/70"
                  >
                    {notice}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Footer navigation */}
          <footer className="flex shrink-0 items-center justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
            <StitchButton onClick={prev} disabled={index === 0} aria-label="Previous page">
              <ChevronLeft className="size-5" aria-hidden />
              <span className="hidden sm:inline">Prev</span>
            </StitchButton>

            <div className="min-w-0 text-center" aria-live="polite">
              <p className="font-display text-lg text-haldi tabular-nums">
                {pad(index + 1)} <span className="text-cream/40">/ {pad(slides.length)}</span>
              </p>
              <p className={`truncate font-hand text-sm sm:text-base ${slide.hotspots ? "text-haldi" : "text-cream/75"}`}>
                {slide.hotspots ? "Tap a section to jump there" : slide.title}
              </p>
            </div>

            <StitchButton onClick={next} disabled={index === last} aria-label="Next page">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-5" aria-hidden />
            </StitchButton>
          </footer>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
