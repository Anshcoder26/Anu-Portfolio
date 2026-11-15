/** Anu's own brand. Used by the Onayakhi mug and bag on the desk. */
export const onayakhi = {
  name: "Onayakhi",
  instagram: "https://www.instagram.com/0nayakhi/",
  tagline: "Packaging that carries more than a product",
} as const;

/** Open the brand's Instagram in a new tab (call from a click handler so it isn't blocked). */
export function openOnayakhiInstagram() {
  window.open(onayakhi.instagram, "_blank", "noopener,noreferrer");
}
