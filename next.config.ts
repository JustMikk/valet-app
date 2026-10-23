import type { NextConfig } from "next"

// Two build targets (docs/DECISIONS.md ADR-012):
//  - static (default): `output: 'export'` keeps the app Capacitor-ready (handoff §5.1). Route
//    handlers are named `route.api.ts`, which this mode does not register, so nothing server-only
//    reaches the export and the data layer runs on the in-memory mock repositories.
//  - server (`VALET_TARGET=server`, see scripts/next-server.mjs): registers `route.api.ts` so the
//    demo API under `src/app/api` runs on Next.js, and the data layer talks to it over HTTP. It
//    builds into its own folder so it never collides with a static `next dev` / `next build`.
const serverTarget = process.env.VALET_TARGET === "server"
// NEXT_DIST_DIR lets a build run beside a live dev server without sharing its .next cache.
const distDir = process.env.NEXT_DIST_DIR ?? (serverTarget ? ".next-server" : undefined)

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  ...(serverTarget
    ? { pageExtensions: ["tsx", "ts", "jsx", "js", "api.ts"] }
    : { output: "export" }),
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_DATA_SOURCE: serverTarget ? "api" : "mock" },
  // cacheComponents/partialPrefetching are omitted: PPR cannot run in export mode.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
