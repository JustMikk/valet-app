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

---

## ADR-006 — Design tokens own `--accent` and `--card`; shadcn slots map onto tokens

**Date:** 2026-10-22 · **Status:** accepted

**Context.** The design export names its tokens `--accent` (tenant gold, primary actions) and `--card` (glass card fill), and DESIGN_README says to use these exact names. shadcn's theme uses the same two names for different things: a subtle hover fill and an opaque card surface.

**Decision.**

- The design tokens keep their names and meaning. `bg-accent` is the tenant accent; `bg-card` is the glass fill.
- shadcn's other semantic slots (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--popover`, `--border`, `--input`, `--ring`, `--destructive`, `--accent-foreground`, `--card-foreground`) are mapped onto design tokens in `globals.css`, declared on `:root, [data-theme]` so they resolve inside every theme scope.
- Each vendor primitive is audited when installed: any `bg-accent` / `bg-card` used for hover or surfaces is replaced in its variants with `bg-surface` / `bg-elev`, and the edit is listed in `docs/DESIGN_INTAKE.md`.
- `dark:` follows `data-theme`, not the `.dark` class.
- Font sizes, line-heights, letter-spacing and radii are theme tokens named after the export's values (`text-36`, `leading-x105`, `tracking-n035`, `rounded-r22`, plus semantic `rounded-card` etc.). Each `text-NN` defaults to `line-height: normal`, matching the export's `font:` shorthand.

**Consequences.** Vendor components that rely on `bg-accent` for hover would show the tenant color until audited; the audit is part of each install. Verified by computed-style probe (light, dark, admin scopes).

---

## ADR-007 — Fonts via next/font; Material Symbols as a committed subset

**Date:** 2026-10-22 · **Status:** accepted

**Context.** The design uses Bricolage Grotesque (display), Onest (UI), Geist Mono (numbers) and Material Symbols Rounded (icons, FILL 0/1, weight 400–700). The app must work offline (PWA) and stay inside the LCP budget. The complete Material Symbols Rounded variable font is 5.4 MB (`material-symbols` npm 0.48.1), and icon fonts use `font-display: block`, so on slow 4G icons would stay invisible for seconds.

**Decision.**

- Text fonts load through `next/font/google` (self-hosted at build time; Bricolage with its `opsz` axis as in the export).
- Icons: `src/components/shared/icon-names.ts` lists every glyph the app may render. `pnpm icons:build` (`scripts/build-icon-font.mjs`) downloads a Google Fonts subset for exactly those names (`icon_names=`, same axes as the export: opsz 20..48, wght 400..700, FILL 0..1, GRAD 0) into `src/fonts/`, which is committed and loaded with `next/font/local`. 25 glyphs = 22.9 KiB.
- The `Icon` component accepts only `IconName`, so an unlisted name is a type error. A test fails if the committed font was built from a different list.
- No `material-symbols` npm dependency; lucide (shadcn default) is not used for product icons.

**Consequences.** Adding an icon means adding its name and running `pnpm icons:build` (network needed once). Sources: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`; verified fonts load (`document.fonts`) and glyphs render in a static-export screenshot.

---

## ADR-008 — Zod for boundary validation; tenant accent derivation

**Date:** 2026-10-22 · **Status:** accepted

**Decision.** `zod` 4 is the validation library at every boundary (handoff §7); first use is the tenant accent (`AccentHex`). Tenant accents derive `--accent-soft` and `--accent-text` in OKLCH from the exported gold variants (same lightness, chroma scaled to the accent, gold's hue offset), with text lightness nudged until it meets 4.5:1 on the page background and on the soft fill (D7). The default gold returns the exported values exactly; other accents use one hex in both modes (D8). `TenantTheme` injects the variables as a stylesheet built only from a validated hex.

**Verification.** `src/lib/tenant/*.test.ts`: the formula reproduces exported gold within ΔE_ok < 2 in both modes; all four Settings swatches meet 4.5:1 for accent text (on bg and soft) and for ink on the accent fill.
