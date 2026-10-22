import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export keeps the app Capacitor-ready (handoff §5.1): no server-only features.
  output: "export",
  images: { unoptimized: true },
  // cacheComponents/partialPrefetching are omitted: PPR cannot run in export mode.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
