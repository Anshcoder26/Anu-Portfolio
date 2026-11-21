/**
 * The page's journey:
 *   loading → intro (camera settles on the book)
 *   → opening (click: zoom + cover opens) → viewer (flipbook overlay)
 *   → closing (cover shuts, camera pulls back) → intro
 */
export type Phase = "loading" | "intro" | "opening" | "viewer" | "closing";

/** The two places the canvas can show. The book's Phase only matters in the studio. */
export type Place = "studio" | "store";

/** Onayakhi store: out on the street looking at the shopfront, or inside browsing. */
export type StoreView = "street" | "inside";
