"use client";

import { createContext, useContext } from "react";

export type DeskApi = {
  /** Objects only react while the camera is on the desk (phase "intro"). */
  enabled: boolean;
  /** Open the book and riffle to a page. */
  openPage: (index: number) => void;
  /** Colour picked on the paint palette (dyes the top fabric swatch). */
  dye: string | null;
  setDye: (color: string) => void;
  /** The one object whose label is showing. */
  active: string | null;
  setActive: (id: string | null) => void;
};

export const DeskContext = createContext<DeskApi | null>(null);

export function useDesk() {
  const api = useContext(DeskContext);
  if (!api) throw new Error("useDesk must be used inside <DeskContext.Provider> (Scene.tsx)");
  return api;
}
