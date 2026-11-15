"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import type { Phase } from "@/lib/phase";
import { play } from "@/lib/sound";
import { ContactCard } from "@/components/ui/ContactCard";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { PortfolioViewer } from "@/components/ui/PortfolioViewer";
import { SoundToggle } from "@/components/ui/SoundToggle";

// WebGL only exists in the browser — keep three.js out of the server bundle.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [contactAt, setContactAt] = useState<{ x: number; y: number } | null>(null);
  // Each opening of the book remounts the viewer, starting at `start`.
  const [opening, setOpening] = useState({ count: 0, start: 0 });
  const reducedMotion = useReducedMotion() ?? false;

  const onReady = useCallback(() => setPhase((p) => (p === "loading" ? "intro" : p)), []);
  /** Open the book — at the cover, or (from a desk object's label) riffled to a page. */
  const onOpenPage = useCallback((start: number) => {
    setPhase((p) => {
      if (p !== "intro") return p;
      setOpening((o) => ({ count: o.count + 1, start }));
      play("thud");
      return "opening";
    });
  }, []);
  const onOpen = useCallback(() => onOpenPage(0), [onOpenPage]);
  const onOpened = useCallback(() => setPhase((p) => (p === "opening" ? "viewer" : p)), []);
  const onClose = useCallback(() => setPhase((p) => (p === "viewer" ? "closing" : p)), []);
  const onClosed = useCallback(() => setPhase((p) => (p === "closing" ? "intro" : p)), []);
  const onContact = useCallback((x: number, y: number) => setContactAt({ x, y }), []);
  const onContactClose = useCallback(() => setContactAt(null), []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <Scene
          phase={phase}
          reducedMotion={reducedMotion}
          onReady={onReady}
          onOpen={onOpen}
          onOpened={onOpened}
          onClosed={onClosed}
          onContact={onContact}
          onOpenPage={onOpenPage}
        />
      </div>

      <IntroOverlay
        phase={phase}
        onOpen={onOpen}
        onContact={() => onContact(window.innerWidth / 2, window.innerHeight / 2)}
      />
      <PortfolioViewer
        key={opening.count}
        open={phase === "viewer"}
        startIndex={opening.start}
        reducedMotion={reducedMotion}
        onClose={onClose}
      />
      {phase !== "viewer" && <SoundToggle className="fixed bottom-4 left-4 z-40" />}
      <ContactCard origin={contactAt} reducedMotion={reducedMotion} onClose={onContactClose} />
    </main>
  );
}
