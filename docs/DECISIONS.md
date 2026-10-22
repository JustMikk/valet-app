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

---

## ADR-003 — Quality tooling

**Date:** 2026-10-22 · **Status:** accepted

**Context.** Handoff §7 requires lint, typecheck, tests and build in CI and in a pre-commit hook, with every dependency justified.

**Decision.**

| Dependency                                                                           | Why                                                                                                                                          |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `prettier` + `prettier-plugin-tailwindcss`                                           | Formatting and Tailwind class sorting (handoff §7 tooling); also sorts inside `cn()`/`cva()`                                                 |
| `vitest`, `@vitejs/plugin-react`, `jsdom`                                            | Unit and component tests (handoff §7 testing)                                                                                                |
| `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | Behavior-level component tests                                                                                                               |
| `@playwright/test`                                                                   | E2E with phone (390), tablet (820), desktop (1440) projects; served from the static `out/` via `serve@14` (run with `dlx`, not a dependency) |
| `husky` + `lint-staged`                                                              | Pre-commit: ESLint + Prettier on staged files, then `tsc --noEmit`                                                                           |
| `cn` (added by shadcn init)                                                          | shadcn's compiled replacement for `clsx` + `tailwind-merge` (repo `shadcn-ui/cn`)                                                            |

ESLint additions: `no-explicit-any`, `no-non-null-assertion`, `ban-ts-comment` (`@ts-expect-error` only with a description), `no-console` (warn/error allowed). Lint runs with `--max-warnings=0`. CI (`.github/workflows/ci.yml`) runs lint, typecheck, format check, unit tests, build, `pnpm audit --prod`, then Playwright.

**Consequences.** `pnpm check` runs the same gate locally. On Windows the first Vitest run after install can exceed the jsdom worker start-up timeout; reruns pass.

---

## ADR-004 — Run the shadcn MCP server from the local install

**Date:** 2026-10-22 · **Status:** accepted

**Context.** The `.mcp.json` written by `shadcn mcp init` runs `npx shadcn@latest mcp`. On this network npx resolves and downloads `@latest` on each start, and Claude Code timed out the connection after 30 s. The locally installed `shadcn` (devDependency, 4.22.1) answers the MCP `initialize` handshake in under 5 s.

**Decision.** `.mcp.json` runs `node node_modules/shadcn/dist/index.js mcp`. The MCP version is now pinned with the project's `shadcn` devDependency, and upgrading it is a normal dependency bump.

**Consequences.** Requires `pnpm install` before the MCP server can start.

---

## ADR-005 — Constraint tooling (CONSTRAINTS.md)

**Date:** 2026-10-22 · **Status:** accepted (owner answers from `/constraints`: all dimensions, block on failure, handoff targets + ratchets, 90 s at task end with the rest in CI)

**Decision.**

| Tool                              | Why                                                                                                                                       | Where installed                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@vitest/coverage-v8`             | Changed-line coverage (lcov) without a second test run                                                                                    | devDependency                                                           |
| `@axe-core/playwright`            | axe-core WCAG 2.1 AA checks inside the existing Playwright viewports (instead of `@axe-core/cli`, which would need its own browser setup) | devDependency                                                           |
| `lighthouse`                      | Core Web Vitals lab metrics; driven over CDP on Playwright's Chromium, so no `chrome-launcher` dependency                                 | devDependency                                                           |
| `size-limit` + `@size-limit/file` | Gzipped client JS budget                                                                                                                  | devDependency                                                           |
| `dependency-cruiser`              | Handoff §5.3 layer boundaries                                                                                                             | devDependency                                                           |
| gitleaks 8.30.1                   | Secrets, always `--redact`                                                                                                                | Scoop (local), release binary (CI)                                      |
| osv-scanner 2.7.0                 | Dependency vulnerabilities from the OSV database                                                                                          | Scoop (local), release binary (CI)                                      |
| Semgrep 1.140.0                   | Code scanning (default + OWASP Top 10)                                                                                                    | CI container only: no native Windows build, Docker not required locally |

Project-specific rules (device APIs, tokens only, component size) are ESLint rules, not new tools. The floor guard is `scripts/floor-guard.mjs`, adapted from the agent-skills reference; it blocks code-level floor violations everywhere and lets bar changes (new exceptions, loosened thresholds) through locally with a warning, blocking them in CI unless the owner labels the PR `constraints-change-approved`.

**Consequences.** Lighthouse gates on the median of 3 runs and runs before Playwright, because a single lab run on a busy machine inflated LCP from ~1.7 s to 4.3 s. Bundle budget is a ratchet until route groups exist (Phase 2).
