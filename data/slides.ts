export type Slide = {
  /** Public path of the exported page image (see scripts/export-slides.swift). */
  src: string;
  /** Section the page belongs to — drives the jump menu. */
  section: string;
  /** Short page title shown under the viewer. */
  title: string;
  /** Screen-reader description, based on the page's text. */
  alt: string;
  /**
   * Clickable regions drawn over the page (the contents page). `box` is
   * [left, top, width, height] in % of the page. `section` must match a
   * `section` below; omit it for topics that have no pages yet.
   */
  hotspots?: Hotspot[];
};

export type Hotspot = {
  label: string;
  section?: string;
  box: [number, number, number, number];
};

/** Native size of every exported page (5:3, matches the PDF). */
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1152;

const page = (n: number) => `/slides/${String(n).padStart(2, "0")}.jpg`;

/**
 * One entry per PDF page, in order. To add a page: export it to
 * public/slides/NN.jpg and add an entry here.
 */
export const slides: Slide[] = [
  {
    src: page(1),
    section: "Introduction",
    title: "Anusmita's Portfolio",
    alt: "Cover: “Anusmita's Portfolio — inside my insights”, folk-art illustration of a patterned fish over red stripes and a woman holding a leafy branch, framed by bamboo.",
  },
  {
    src: page(2),
    section: "Introduction",
    title: "Opening",
    alt: "Decorative page with red block-printed side borders.",
  },
  {
    src: page(3),
    section: "Introduction",
    title: "About Anusmita",
    alt: "Hand-drawn chalk mind map around the name Anusmita: Tripura, crafts, Durga puja, explore the world, foodie, click memories, work ideas growth, furry friends, nature needs plants, mountains call, beach therapy — with a photo of Anusmita.",
  },
  {
    src: page(4),
    section: "Introduction",
    title: "Interlude",
    alt: "Decorative page with a patterned folk border and a red lotus motif.",
  },
  {
    src: page(5),
    section: "Introduction",
    title: "Contents",
    alt: "Contents illustrated as a ten-armed Durga holding labels: Batik, Prints, Weaves, Embroidery, Jewelleries, Product Design, Fashion illustration, Beyond the classroom, Portrait Photography, Branding.",
    hotspots: [
      { label: "Batik", section: "Batik", box: [9, 6, 22, 12.5] },
      { label: "Prints", section: "Prints", box: [5, 21.5, 23.5, 13.5] },
      { label: "Weaves", section: "Weaving", box: [5, 38, 22, 13] },
      { label: "Embroidery", section: "Embroidery", box: [5, 53.5, 22, 14] },
      { label: "Jewelleries", section: "Jewellery", box: [11, 68.5, 21, 15] },
      { label: "Product Design", section: "Product Design", box: [67.5, 6.5, 23.5, 12.5] },
      { label: "Fashion illustration", box: [71.5, 21.5, 23, 14] },
      { label: "Beyond the classroom", section: "Personal Endeavours", box: [72.5, 38.5, 22, 13.5] },
      { label: "Portrait Photography", box: [72.5, 54.5, 22, 13.5] },
      { label: "Branding", box: [68, 69.5, 21.5, 14.5] },
    ],
  },
  {
    src: page(6),
    section: "Batik",
    title: "Batik — Resist-dyeing",
    alt: "Batik: exploration of traditional resist-dyeing motifs applied to a contemporary table linen collection — teal leaf-print table runner, mats and coasters, with three exploration swatches.",
  },
  {
    src: page(7),
    section: "Batik",
    title: "Batik — Concept note",
    alt: "Batik concept note: a nature-inspired collection with delicate leaf motifs on a deep teal base. Keywords: nature inspired, hand dyed, earthy, organic, textural, calm, repetitive.",
  },
  {
    src: page(8),
    section: "Batik",
    title: "Batik — Process chart",
    alt: "Process chart of Batik: photos of waxing, dyeing and finishing the teal leaf fabric.",
  },
  {
    src: page(9),
    section: "Prints",
    title: "Hand Prints — Echoes of memory",
    alt: "Hand prints, Echoes of memory: dry-brush prints in coffee and ash on newspaper, flower stamping with poster colours, and scaled cardboard stamping with toothbrush spatter.",
  },
  {
    src: page(10),
    section: "Prints",
    title: "Hand Prints — Concept note",
    alt: "Concept note: Echoes of Memory explores the quiet presence of past moments through faded visuals, layered textures, muted tones and a sense of nostalgia.",
  },
  {
    src: page(11),
    section: "Prints",
    title: "Digital Prints",
    alt: "Digital prints: motifs inspired by comb and key, flower and leaf, and key and clock.",
  },
  {
    src: page(12),
    section: "Prints",
    title: "Digital Prints — Theme board",
    alt: "Theme board with keywords: everyday objects, perspective, spatial, geometry, shift, abstract, structured.",
  },
  {
    src: page(13),
    section: "Weaving",
    title: "Weaving — VIBGYOR",
    alt: "Weaving: a VIBGYOR-inspired woven fabric combining basket, sateen, herringbone, diamond and pointed twill weaves, applied to a deck chair.",
  },
  {
    src: page(14),
    section: "Embroidery",
    title: "Embroidery — Exploration swatches",
    alt: "Embroidery exploration swatches: herringbone, blanket, cross, satin, fly, chain, cable, lazy daisy, French knot, bullion knot, running, back, split and stem stitches.",
  },
  {
    src: page(15),
    section: "Embroidery",
    title: "Embroidery — Napkin ring & Floral face",
    alt: "Embroidered napkin ring with vibrant multicoloured threadwork, and Floral face — a minimalist portrait with floral motifs in blue, pink and green threads.",
  },
  {
    src: page(16),
    section: "Jewellery",
    title: "Jewellery — Fish scale & Chocolate wrapper",
    alt: "Jewellery design: floral fish-scale jewellery with pearlescent petals, and statement earrings made from upcycled chocolate wrappers.",
  },
  {
    src: page(17),
    section: "Jewellery",
    title: "Jewellery — Waste textile & Recycled jeans",
    alt: "Upcycled textile-waste jewellery set in teal and lime with gold beadwork and mirrors, and a recycled denim statement necklace with pearls.",
  },
  {
    src: page(18),
    section: "Jewellery",
    title: "Jewellery — Panchkatha & Hasuli",
    alt: "Panchkatha, a Gupta-period-inspired gold medallion jewellery set, and Hasuli, a statement Hasli inspired by Maa Durga with gemstones and mirror accents.",
  },
  {
    src: page(19),
    section: "Jewellery",
    title: "Jewellery — Yarn & Metal necklaces",
    alt: "A yarn necklace and a metal necklace.",
  },
  {
    src: page(20),
    section: "Product Design",
    title: "Product Design — Turtle container & Fabric doll",
    alt: "Product design: a handcrafted striped turtle-shaped container with golden detailing, and a recycled fabric doll with yarn hair.",
  },
  {
    src: page(21),
    section: "Product Design",
    title: "Product Design — 3-in-1 home décor",
    alt: "A sculptural wall mask combining paper mâché, yarn, metal wire and pearls, exploring contrasting textures in home décor.",
  },
  {
    src: page(22),
    section: "Product Design",
    title: "Product Design — Lamp & Pen holder",
    alt: "An antique lamp built around an icosahedron, and a geometric pen holder from manipulated icosahedron and tetrahedron forms.",
  },
  {
    src: page(23),
    section: "Product Design",
    title: "Product Design — Paper mâché",
    alt: "Paper mâché home décor: a Rapunzel tower and a metallic mouse.",
  },
  {
    src: page(24),
    section: "Product Design",
    title: "Product Design — Macramé charms",
    alt: "Macramé keychains and bag charms.",
  },
  {
    src: page(25),
    section: "Personal Endeavours",
    title: "Personal Endeavours — T-shirt painting",
    alt: "Personal endeavours: a teal T-shirt with pearl embellishment and macramé hem, and a white T-shirt painted with a folk-art figure.",
  },
];

/** First page index for each section, in reading order. */
export const sections: { name: string; index: number }[] = slides.reduce<
  { name: string; index: number }[]
>((acc, s, i) => {
  if (!acc.some((x) => x.name === s.section)) acc.push({ name: s.section, index: i });
  return acc;
}, []);
