"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, DoorOpen, ExternalLink } from "lucide-react";
import { onayakhi } from "@/data/onayakhi";
import { storeStops } from "@/data/store";
import type { StoreView } from "@/lib/phase";
import { StitchButton } from "./StitchButton";

/**
 * Controls over the store: "Back to studio", the Instagram link, and either
 * "Step inside" (street) or the guided-stop arrows (inside).
 * Keys: ← → move between stops, Esc steps back out (inside → street → studio).
 */
export function StoreOverlay({
  visible,
  view,
  stop,
  onEnter,
  onStop,
  onBack,
}: {
  visible: boolean;
  view: StoreView;
  stop: number;
  onEnter: () => void;
  onStop: (stop: number) => void;
  /** One step back: inside → street, street → studio. */
  onBack: () => void;
}) {
  const count = storeStops.length;
  const prev = () => onStop((stop - 1 + count) % count);
  const next = () => onStop((stop + 1) % count);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
      else if (view === "inside" && e.key === "ArrowRight") onStop((stop + 1) % count);
      else if (view === "inside" && e.key === "ArrowLeft") onStop((stop - 1 + count) % count);
      else if (view === "street" && e.key === "Enter" && document.activeElement === document.body) onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, view, stop, count, onBack, onStop, onEnter]);

  const s = storeStops[stop];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="store"
          className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-4 pb-6 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          exit={{ opacity: 0 }}
        >
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-ink/55 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-ink/60 to-transparent" />

          <header className="flex items-start justify-between gap-3">
            <StitchButton onClick={onBack} className="pointer-events-auto text-base">
              <ArrowLeft className="size-4" aria-hidden />
              {view === "inside" ? "Outside" : "Back to studio"}
            </StitchButton>
            <a
              href={onayakhi.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md bg-ink/60 px-3 py-2 font-hand text-base text-cream backdrop-blur-sm transition-colors hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-haldi"
            >
              @0nayakhi
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </header>

          <div className="flex flex-col items-center gap-3 text-center">
            {view === "street" ? (
              <>
                <div className="flex flex-col items-center gap-1 drop-shadow">
                  {/* The Onayakhi wordmark: red dot for the "O", spaced serif capitals */}
                  <p className="flex items-center gap-2.5 font-brand text-2xl font-medium tracking-[0.42em] text-cream" aria-label="Onayakhi">
                    <span aria-hidden className="inline-block size-4 rounded-full bg-[#B5121B]" />
                    <span aria-hidden>NAYAKHI</span>
                  </p>
                  <p className="font-hand text-base text-haldi">Uniquely Her. Uniquely Crafted.</p>
                </div>
                <StitchButton tone="sindoor" onClick={onEnter} className="pointer-events-auto">
                  <DoorOpen className="size-5" aria-hidden />
                  Step inside
                </StitchButton>
              </>
            ) : (
              <>
                <p className="font-hand text-base text-cream/80 drop-shadow">Tap a product to take a closer look</p>
                <div className="flex items-center gap-2">
                  <StitchButton onClick={prev} aria-label="Previous display" className="pointer-events-auto px-3">
                    <ChevronLeft className="size-5" aria-hidden />
                  </StitchButton>
                  <div className="min-w-44 rounded-md bg-ink/65 px-4 py-1.5 backdrop-blur-sm" aria-live="polite">
                    <p className="font-display text-lg leading-tight text-cream">{s.name}</p>
                    <p className="font-hand text-sm leading-tight text-haldi">
                      {s.hint} · {stop + 1}/{count}
                    </p>
                  </div>
                  <StitchButton onClick={next} aria-label="Next display" className="pointer-events-auto px-3">
                    <ChevronRight className="size-5" aria-hidden />
                  </StitchButton>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
