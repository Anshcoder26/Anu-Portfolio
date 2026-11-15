"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Mail, Phone, X } from "lucide-react";
import { contact } from "@/data/contact";

type Origin = { x: number; y: number };

type Props = {
  /** Screen point the note was clicked at (the card grows out of it), or null when closed. */
  origin: Origin | null;
  reducedMotion: boolean;
  onClose: () => void;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          /* clipboard blocked — the link itself still works */
        }
      }}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="grid size-9 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sindoor"
    >
      {copied ? <Check className="size-4 text-teal" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}

/** The wall sticky note, expanded: big paper note with tap-to-call / tap-to-email links. */
export function ContactCard({ origin, reducedMotion, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = origin !== null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Offset from the screen centre to the click, so the note grows out of the wall note.
  const from =
    origin && typeof window !== "undefined"
      ? { x: origin.x - window.innerWidth / 2, y: origin.y - window.innerHeight / 2 }
      : { x: 0, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="contact"
          className="fixed inset-0 z-30 grid place-items-center bg-ink/55 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            onClick={(e) => e.stopPropagation()}
            initial={reducedMotion ? { opacity: 0 } : { x: from.x, y: from.y, scale: 0.12, rotate: 10, opacity: 0.6 }}
            animate={{ x: 0, y: 0, scale: 1, rotate: -2, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { x: from.x, y: from.y, scale: 0.12, rotate: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 210, damping: 24 }}
            className="relative w-full max-w-md rounded-[3px] bg-gradient-to-b from-[#FBE48A] to-[#F2CF55] px-7 pb-8 pt-10 text-ink shadow-[0_30px_60px_-12px_rgb(0_0_0/0.6),0_2px_0_rgb(0_0_0/0.05)]"
          >
            {/* Adhesive strip + push pin */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-8 bg-black/[0.04]" />
            <div
              aria-hidden
              className="absolute left-1/2 top-2 size-6 -translate-x-1/2 rounded-full bg-sindoor shadow-[inset_-3px_-3px_0_rgb(0_0_0/0.25),0_3px_4px_rgb(0_0_0/0.35)]"
            />
            {/* Curled corner */}
            <div
              aria-hidden
              className="absolute bottom-0 right-0 size-10 bg-gradient-to-tl from-[#d9b23c] to-[#f6d975] [clip-path:polygon(100%_0,0_100%,0_0)]"
            />

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close contact note"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sindoor"
            >
              <X className="size-5" aria-hidden />
            </button>

            <h2 id="contact-title" className="font-hand text-4xl font-bold">
              Let&apos;s connect!
            </h2>
            <svg aria-hidden viewBox="0 0 200 10" className="mt-1 h-2.5 w-44 text-sindoor">
              <path d="M2 6 Q 100 0 198 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="mt-3 font-hand text-lg text-ink/75">{contact.name} · NIFT</p>

            <ul className="mt-6 space-y-3 font-hand text-lg">
              <li className="flex items-center gap-2">
                <a
                  href={contact.phone.href}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sindoor"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sindoor text-cream">
                    <Phone className="size-4" aria-hidden />
                  </span>
                  <span className="truncate underline decoration-sindoor/40 decoration-2 underline-offset-4">
                    {contact.phone.display}
                  </span>
                </a>
                <CopyButton value={contact.phone.display} label="phone number" />
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={contact.email.href}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sindoor"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal text-cream">
                    <Mail className="size-4" aria-hidden />
                  </span>
                  <span className="truncate underline decoration-teal/40 decoration-2 underline-offset-4">
                    {contact.email.display}
                  </span>
                </a>
                <CopyButton value={contact.email.display} label="email address" />
              </li>
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
