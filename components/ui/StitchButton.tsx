"use client";

import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

type Props = Omit<ComponentProps<typeof motion.button>, "children"> & {
  children: ReactNode;
  tone?: "kraft" | "sindoor";
};

/**
 * Sketchbook-style button: a kraft-paper tag with a dashed "stitched" inner
 * border, slight tilt, and a lift on hover.
 */
export function StitchButton({ children, tone = "kraft", className = "", ...props }: Props) {
  const palette =
    tone === "kraft"
      ? "bg-kraft text-ink outline-ink/60"
      : "bg-sindoor text-cream outline-cream/70";

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2, rotate: -1.5 }}
      whileTap={{ scale: 0.95, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`group relative inline-flex select-none items-center gap-2 rounded-md px-4 py-2.5 font-hand text-lg font-bold leading-none shadow-[3px_4px_0_rgb(0_0_0/0.45)] outline-2 outline-dashed -outline-offset-[6px] transition-colors focus-visible:ring-4 focus-visible:ring-haldi disabled:pointer-events-none disabled:opacity-35 ${palette} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
