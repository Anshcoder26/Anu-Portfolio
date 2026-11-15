/**
 * The page's journey:
 *   loading → intro (camera settles on the book)
 *   → opening (click: zoom + cover opens) → viewer (flipbook overlay)
 *   → closing (cover shuts, camera pulls back) → intro
 */
export type Phase = "loading" | "intro" | "opening" | "viewer" | "closing";
