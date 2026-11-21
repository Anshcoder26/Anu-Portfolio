"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import type { Phase, Place, StoreView } from "@/lib/phase";
import { play } from "@/lib/sound";
import { ContactCard } from "@/components/ui/ContactCard";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { PortfolioViewer } from "@/components/ui/PortfolioViewer";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { StoreOverlay } from "@/components/ui/StoreOverlay";
import { TravelCurtain } from "@/components/ui/TravelCurtain";

// WebGL only exists in the browser — keep three.js out of the server bundle.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

/** The black-out lasts at least this long (the walk), and until the new place has loaded. */
const WALK_MS = 2000;
/** Curtain fade-in time before the scene swaps behind it. */
const FADE_MS = 400;

type Trip = { to: Place; walked: boolean; arrived: boolean };

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [contactAt, setContactAt] = useState<{ x: number; y: number } | null>(null);
  // Each opening of the book remounts the viewer, starting at `start`.
  const [opening, setOpening] = useState({ count: 0, start: 0 });
  const reducedMotion = useReducedMotion() ?? false;

  // ── Studio ⇄ Onayakhi store ──
  const [place, setPlace] = useState<Place>("studio");
  const [storeView, setStoreView] = useState<StoreView>("street");
  const [storeStop, setStoreStop] = useState(0);
  const [trip, setTrip] = useState<Trip | null>(null);
  const travelling = useRef(false);

  const travelTo = useCallback((to: Place) => {
    if (travelling.current) return;
    travelling.current = true;
    play("walk");
    setTrip({ to, walked: false, arrived: false });
    window.setTimeout(() => {
      setPlace(to);
      setStoreView("street");
      setStoreStop(0);
    }, FADE_MS);
    window.setTimeout(() => setTrip((t) => t && { ...t, walked: true }), WALK_MS);
  }, []);
  const onPlaceReady = useCallback((p: Place) => setTrip((t) => (t && t.to === p ? { ...t, arrived: true } : t)), []);
  const onTripOver = useCallback(() => {
    setTrip(null);
    travelling.current = false;
  }, []);
  const curtain = trip !== null && !(trip.walked && trip.arrived);

  const onGoToStore = useCallback(() => {
    if (phase === "intro") travelTo("store");
  }, [phase, travelTo]);
  const onEnterStore = useCallback(() => {
    if (storeView !== "street") return;
    play("door");
    setStoreView("inside");
  }, [storeView]);
  const onStoreBack = useCallback(() => {
    if (storeView === "inside") setStoreView("street");
    else travelTo("studio");
  }, [storeView, travelTo]);

  // ── The book ──
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

  const inStudio = place === "studio";

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <Scene
          phase={phase}
          place={place}
          storeView={storeView}
          storeStop={storeStop}
          reducedMotion={reducedMotion}
          onReady={onReady}
          onPlaceReady={onPlaceReady}
          onOpen={onOpen}
          onOpened={onOpened}
          onClosed={onClosed}
          onContact={onContact}
          onOpenPage={onOpenPage}
          onGoToStore={onGoToStore}
          onEnterStore={onEnterStore}
        />
      </div>

      <IntroOverlay
        phase={phase}
        hidden={!inStudio}
        onOpen={onOpen}
        onContact={() => onContact(window.innerWidth / 2, window.innerHeight / 2)}
        onStore={onGoToStore}
      />
      <StoreOverlay
        visible={!inStudio && !curtain}
        view={storeView}
        stop={storeStop}
        onEnter={onEnterStore}
        onStop={setStoreStop}
        onBack={onStoreBack}
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
      <TravelCurtain show={curtain} to={trip?.to ?? "store"} reducedMotion={reducedMotion} onHidden={onTripOver} />
    </main>
  );
}
