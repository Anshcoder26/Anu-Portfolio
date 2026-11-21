"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { sections, slides } from "@/data/slides";
import { play, type Cue } from "@/lib/sound";
import { useDesk } from "./DeskContext";
import { useNarrow } from "./useResponsive";

const LABEL_MS = 6000;

type Props = Omit<React.JSX.IntrinsicElements["group"], "children" | "name"> & {
  /** Unique key for this object (which label is open). */
  name: string;
  /** Name shown on the label. */
  label: string;
  /** One line under the name, e.g. "Click to snip". */
  hint?: string;
  /** Portfolio section the label links to (matches `section` in data/slides.ts)… */
  section?: string;
  /** …or a specific 0-based page index. */
  page?: number;
  /** …or an external link (opens in a new tab). */
  href?: string;
  /** Button text for `href`. */
  hrefLabel?: string;
  sound?: Cue;
  /** Runs on click (animations live in the child component). */
  onActivate?: () => void;
  /** Where the label floats, relative to this group. */
  labelOffset?: [number, number, number];
  /** Lift on hover (world units). */
  lift?: number;
  /** Click just runs `onActivate` (no pinned label) — the label still shows on hover. */
  direct?: boolean;
  children: ReactNode;
};

/**
 * Makes a desk/wall object interactive: hover lift + pointer cursor, click →
 * its own action + sound + a kraft label that can jump into the portfolio.
 * Only one label shows at a time (DeskContext.active).
 */
export function Interactive({
  name: id,
  label,
  hint,
  section,
  page,
  href,
  hrefLabel = "Visit ↗",
  sound,
  onActivate,
  labelOffset = [0, 0.9, 0],
  lift = 0.06,
  direct = false,
  children,
  ...group
}: Props) {
  const desk = useDesk();
  const narrow = useNarrow();
  const inner = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hot = hovered && desk.enabled;
  useCursor(hot);

  const target = page ?? (section ? sections.find((s) => s.name === section)?.index : undefined);
  const targetName = target !== undefined ? (section ?? slides[target]?.title) : undefined;
  const showLabel = desk.enabled && (desk.active === id || hot);
  const showLink = desk.enabled && desk.active === id && (target !== undefined || !!href);

  // Auto-hide the clicked label after a while (paused while the pointer is on it).
  const { active, setActive } = desk;
  useEffect(() => {
    if (active !== id || pinned) return;
    const t = window.setTimeout(() => setActive(null), LABEL_MS);
    return () => window.clearTimeout(t);
  }, [active, id, pinned, setActive]);

  useFrame((_, delta) => {
    if (inner.current) easing.damp(inner.current.position, "y", hot ? lift : 0, 0.15, delta);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!desk.enabled) return;
    onActivate?.();
    if (sound) play(sound);
    if (direct) setHovered(false);
    else setActive(id);
  };

  const card = (
    <div
      className="rounded-md bg-kraft px-3 py-2 text-center text-ink shadow-[2px_3px_0_rgb(0_0_0/0.4)] outline-2 outline-dashed -outline-offset-4 outline-ink/40"
      onMouseEnter={() => setPinned(true)}
      onMouseLeave={() => setPinned(false)}
    >
      <p className="font-hand text-base font-bold leading-tight">{label}</p>
      {hint && <p className="font-hand text-sm leading-tight text-ink/70">{hint}</p>}
      {showLink && (
        <button
          type="button"
          onClick={() => {
            setActive(null);
            if (href) {
              window.open(href, "_blank", "noopener,noreferrer");
              return;
            }
            play("paper");
            if (target !== undefined) desk.openPage(target);
          }}
          className="mt-1.5 rounded bg-sindoor px-2.5 py-1 font-hand text-sm font-bold text-cream transition-colors hover:bg-sindoor-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haldi"
        >
          {href ? hrefLabel : <>Open {targetName} ⟶</>}
        </button>
      )}
    </div>
  );

  return (
    <group {...group}>
      <group
        ref={inner}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {children}
      </group>

      {showLabel && (
        <Html position={labelOffset} center zIndexRange={[9, 0]} style={{ pointerEvents: "none" }}>
          {narrow
            ? // Phones: a card centred above the bottom buttons (edge objects' labels would clip).
              createPortal(
                <div className="pointer-events-auto fixed bottom-36 left-1/2 z-[9] w-max max-w-[80vw] -translate-x-1/2">
                  {card}
                </div>,
                document.body,
              )
            : // Direct objects: the hover label is just a caption — clicks go through to the object.
              <div className={`${direct ? "pointer-events-none" : "pointer-events-auto"} w-max max-w-56 -translate-y-1/2`}>{card}</div>}
        </Html>
      )}
    </group>
  );
}
