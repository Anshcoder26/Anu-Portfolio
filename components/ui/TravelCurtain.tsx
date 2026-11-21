"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Black-out while we walk between the studio and the store: footprints
 * stepping across the middle of the screen. The scene swaps behind it.
 */
export function TravelCurtain({
  show,
  to,
  reducedMotion,
  onHidden,
}: {
  show: boolean;
  to: "studio" | "store";
  reducedMotion: boolean;
  /** Fully faded out — the trip is over. */
  onHidden: () => void;
}) {
  return (
    <AnimatePresence onExitComplete={onHidden}>
      {show && (
        <motion.div
          key="curtain"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.35 } }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          role="status"
          aria-live="polite"
        >
          <div aria-hidden className="relative h-10 w-56">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute block h-3.5 w-2 rounded-full bg-cream/80"
                style={{ left: `${i * 17}%`, top: i % 2 ? "8%" : "52%", rotate: 90 }}
                initial={{ opacity: 0 }}
                animate={reducedMotion ? { opacity: 0.6 } : { opacity: [0, 0.85, 0.15] }}
                transition={reducedMotion ? undefined : { delay: 0.2 + i * 0.27, duration: 0.9 }}
              />
            ))}
          </div>
          <p className="font-hand text-lg text-cream/70">
            {to === "store" ? "Walking to Onayakhi…" : "Back to the studio…"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
