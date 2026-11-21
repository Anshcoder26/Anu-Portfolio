"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { Phase } from "@/lib/phase";
import { StitchButton } from "./StitchButton";

/** Title + hint shown over the desk. Fades out once the book starts opening. */
export function IntroOverlay({
  phase,
  hidden = false,
  onOpen,
  onContact,
  onStore,
}: {
  phase: Phase;
  /** We're away at the store. */
  hidden?: boolean;
  onOpen: () => void;
  onContact: () => void;
  /** Keyboard/screen-reader route to the wall's "Way to store" sign. */
  onStore: () => void;
}) {
  const visible = !hidden && (phase === "loading" || phase === "intro" || phase === "closing");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-between px-4 pb-8 pt-10 sm:pt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          {/* Scrims keep the title/button legible over a bright daytime wall */}
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-ink/70 via-ink/35 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/55 to-transparent" />
          <motion.header
            className="text-center"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-2 font-hand text-sm tracking-[0.3em] text-haldi/90 uppercase sm:text-base">
              Anusmita Nath · NIFT
            </p>
            <h1 className="font-display text-4xl leading-tight text-cream drop-shadow-[0_3px_12px_rgb(0_0_0/0.7)] sm:text-6xl">
              Welcome To <span className="text-haldi">Anu&apos;s</span> Portfolio
            </h1>
            <div aria-hidden className="folk-border mx-auto mt-4 h-1.5 w-40 rounded-full sm:w-56" />
          </motion.header>

          <div className="flex flex-col items-center gap-3">
            {phase === "loading" ? (
              <p className="font-hand text-lg text-cream/70" role="status">
                Setting up the desk…
              </p>
            ) : (
              <>
                <motion.p
                  className="font-hand text-lg text-cream/85"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  Tap the book to open it
                </motion.p>
                <StitchButton
                  tone="sindoor"
                  onClick={onOpen}
                  disabled={phase !== "intro"}
                  className="pointer-events-auto"
                >
                  <BookOpen className="size-5" aria-hidden />
                  Open portfolio
                </StitchButton>
                {/* Keyboard/screen-reader route to the wall sticky note */}
                <button
                  type="button"
                  onClick={onContact}
                  className="pointer-events-auto sr-only rounded-md bg-kraft px-3 py-1.5 font-hand text-ink focus:not-sr-only focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-haldi"
                >
                  Contact details
                </button>
                <button
                  type="button"
                  onClick={onStore}
                  className="pointer-events-auto sr-only rounded-md bg-kraft px-3 py-1.5 font-hand text-ink focus:not-sr-only focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-haldi"
                >
                  Visit Onayakhi store
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
