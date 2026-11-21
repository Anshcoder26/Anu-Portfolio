/**
 * Onayakhi store contents — Anu's products, taken from @0nayakhi on Instagram.
 *
 * To use a real product photo instead of the painted placeholder:
 *   1. save it as public/store/<id>.jpg (cropped to the artwork),
 *   2. run `npm run optimize-images` (→ public/store/<id>.webp),
 *   3. set `photo: true` on the product below.
 */

export type ProductId =
  | "poster"
  | "mug"
  | "tapestry"
  | "tote"
  | "journal"
  | "sleeve"
  | "phonecases"
  | "echoesmug"
  | "keychains"
  | "necklace"
  | "cushion"
  | "deckchair"
  | "bag";

export type Product = {
  id: ProductId;
  name: string;
  /** One line from the Instagram post. */
  caption: string;
  /** Which guided stop it's displayed at (index into `storeStops`). */
  stop: number;
  /** True once public/store/<id>.webp exists — otherwise artwork is painted in code. */
  photo?: boolean;
};

export const storeStops = [
  { name: "The Onayakhi wall", hint: "Where it all began" },
  { name: "Mug shelf", hint: "Caffeinated creativity" },
  { name: "Wall textiles", hint: "A little rhythm on the walls" },
  { name: "Echoes of Memory", hint: "Rust, newsprint and florals" },
  { name: "Lounge corner", hint: "Woven chair and cushions" },
  { name: "Counter", hint: "Packaging that carries more than a product" },
] as const;

export const products: Record<ProductId, Product> = {
  poster: {
    id: "poster",
    name: "Onayakhi — the story",
    caption: "Inspired by Anokhi, meaning unique. Uniquely Her. Uniquely Crafted.",
    stop: 0,
    photo: true,
  },
  mug: {
    id: "mug",
    name: "Onayakhi mug",
    caption: "Anu's artwork on a black ceramic mug — her first printed product",
    stop: 1,
  },
  tapestry: {
    id: "tapestry",
    name: "Wall tapestry",
    caption: "A little rhythm on the walls",
    stop: 2,
    photo: true,
  },
  tote: {
    id: "tote",
    name: "Echoes of Memory tote",
    caption: "Rust and newsprint on canvas — from the Echoes of Memory collection",
    stop: 3,
    photo: true,
  },
  journal: {
    id: "journal",
    name: "Echoes of Memory journal",
    caption: "Hard-cover journal with an elastic band — Echoes of Memory",
    stop: 3,
    photo: true,
  },
  sleeve: {
    id: "sleeve",
    name: "Laptop sleeve",
    caption: "Sindoor brushstrokes and torn paper — Echoes of Memory",
    stop: 3,
    photo: true,
  },
  phonecases: {
    id: "phonecases",
    name: "Phone cases",
    caption: "Newsprint and red brushwork, made to carry — Echoes of Memory",
    stop: 3,
    photo: true,
  },
  echoesmug: {
    id: "echoesmug",
    name: "Echoes of Memory mug",
    caption: "Splattered florals on white ceramic",
    stop: 3,
    photo: true,
  },
  keychains: {
    id: "keychains",
    name: "Macramé keychains",
    caption: "Hand-knotted cotton cord on wooden rings",
    stop: 3,
    photo: true,
  },
  necklace: {
    id: "necklace",
    name: "Flower necklace",
    caption: "Hand-shaped petals with golden beads",
    stop: 3,
    photo: true,
  },
  cushion: {
    id: "cushion",
    name: "Echoes of Memory cushion",
    caption: "A splattered floral, printed on a cushion cover",
    stop: 4,
    photo: true,
  },
  deckchair: {
    id: "deckchair",
    name: "Woven deck chair",
    caption: "A spectrum of weaves crafted for comfort",
    stop: 4,
    photo: true,
  },
  bag: {
    id: "bag",
    name: "Onayakhi packaging",
    caption: "Packaging that carries more than a product",
    stop: 5,
  },
};

/** URL of a product's photo texture (only valid when `photo` is true). */
export const productPhoto = (id: ProductId) => `/store/${id}.webp`;
