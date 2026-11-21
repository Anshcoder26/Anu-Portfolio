import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Kalam, Yatra_One } from "next/font/google";
import "./globals.css";

const yatra = Yatra_One({ variable: "--font-yatra", weight: "400", subsets: ["latin"] });
const kalam = Kalam({ variable: "--font-kalam", weight: ["400", "700"], subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Onayakhi's wordmark: a high-contrast classical serif, set in widely spaced capitals.
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", weight: ["500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anu's Portfolio — Anusmita Nath",
  description:
    "Portfolio of Anusmita Nath, NIFT: batik, prints, weaving, embroidery, jewellery and product design.",
  openGraph: {
    title: "Anu's Portfolio — Anusmita Nath",
    description: "Batik, prints, weaving, embroidery, jewellery and product design by Anusmita Nath.",
    images: [{ url: "/slides/01.jpg", width: 1920, height: 1152 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1410",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${yatra.variable} ${kalam.variable} ${inter.variable} ${cormorant.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
