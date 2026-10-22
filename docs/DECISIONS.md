# Architecture Decision Records

Each entry: context, decision, consequences, sources. Newest last.

---

## ADR-001 — Next.js App Router with static export
**Date:** 2026-10-22 · **Status:** accepted

**Context.** The build handoff mandates Next.js (App Router), TypeScript, Tailwind and shadcn, and requires the app to build with `output: 'export'` so it can later be wrapped with Capacitor. The design README suggested Vite + React Router; the build handoff takes precedence (see OPEN_QUESTIONS D6).

**Decision.** Next.js 16.4 (scaffolded with `create-next-app`), pnpm, Tailwind v4, `output: 'export'`, `images.unoptimized: true`.

**Consequences.**
- No Server Actions, Route Handlers relying on Request, middleware/proxy, rewrites, redirects, headers, ISR, cookies or draft mode.
- `cacheComponents` and `partialPrefetching` (on by default in the 16.4 scaffold) are disabled: the build fails with `Invariant: PPR cannot be enabled in export mode`.
- Dynamic detail routes need a client-resolved scheme (to be decided in Phase 2, OPEN_QUESTIONS H5).

**Sources.** `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (bundled with next@16.4.2); verified by running `pnpm build` (output in `out/`).

---

## ADR-002 — shadcn/ui `base-nova` style on Base UI
**Date:** 2026-10-22 · **Status:** accepted

**Context.** The handoff asks for shadcn/ui as the base component layer, with Aceternity available as a registry.

**Decision.** `shadcn init -d` (preset `base-nova`, primitives from Base UI, CSS variables, neutral base color). The `@aceternity` registry is declared in `components.json`. Tokens are remapped onto the design tokens in Phase 1.

**Consequences.** Custom triggers use the Base UI `render` prop (not Radix `asChild`). The shadcn skill's `base-vs-radix` rules apply.

**Sources.** `shadcn init --help` (shadcn 4.22.1); `shadcn info --json`.
