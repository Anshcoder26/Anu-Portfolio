import path from "node:path";
import type { NextConfig } from "next";

const tailwindLoader = path.join(process.cwd(), "node_modules/@tailwindcss/turbopack/dist/index.js");

type Rule = { oneOf?: Rule[]; use?: unknown; test?: unknown };

const usesCssLoader = (use: unknown) =>
  Array.isArray(use) &&
  use.some((u) => {
    const loader = typeof u === "string" ? u : (u as { loader?: string } | null)?.loader;
    return typeof loader === "string" && /[\\/]css-loader[\\/]/.test(loader);
  });

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  // Turbopack (default): Tailwind v4 runs as a CSS loader.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Webpack fallback (`next dev --webpack`, used when the native SWC binary is
  // unavailable): run the same Tailwind loader ahead of Next's CSS pipeline.
  webpack(config) {
    const visit = (rules: Rule[]) => {
      for (const rule of rules) {
        if (rule?.oneOf) visit(rule.oneOf);
        if (rule && usesCssLoader(rule.use) && String(rule.test).includes("css")) {
          (rule.use as unknown[]).push({ loader: tailwindLoader });
        }
      }
    };
    visit(config.module.rules as Rule[]);
    return config;
  },
};

export default nextConfig;
