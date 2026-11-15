"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import type { Phase } from "@/lib/phase";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { PortfolioViewer } from "@/components/ui/PortfolioViewer";

// WebGL only exists in the browser — keep three.js out of the server bundle.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const reducedMotion = useReducedMotion() ?? false;

  const onReady = useCallback(() => setPhase((p) => (p === "loading" ? "intro" : p)), []);
  const onOpen = useCallback(() => setPhase((p) => (p === "intro" ? "opening" : p)), []);
  const onOpened = useCallback(() => setPhase((p) => (p === "opening" ? "viewer" : p)), []);
  const onClose = useCallback(() => setPhase((p) => (p === "viewer" ? "closing" : p)), []);
  const onClosed = useCallback(() => setPhase((p) => (p === "closing" ? "intro" : p)), []);

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
        />
      </div>

      <IntroOverlay phase={phase} onOpen={onOpen} />
      <PortfolioViewer open={phase === "viewer"} reducedMotion={reducedMotion} onClose={onClose} />
    </main>
  );
}
