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
- Icons: `src/lib/icons/icon-names.ts` lists every glyph the app may render. `pnpm icons:build` (`scripts/build-icon-font.mjs`) downloads a Google Fonts subset for exactly those names (`icon_names=`, same axes as the export: opsz 20..48, wght 400..700, FILL 0..1, GRAD 0) into `src/fonts/`, which is committed and loaded with `next/font/local`. 25 glyphs = 22.9 KiB.
- The `Icon` component accepts only `IconName`, so an unlisted name is a type error. A test fails if the committed font was built from a different list.
- No `material-symbols` npm dependency; lucide (shadcn default) is not used for product icons.

**Consequences.** Adding an icon means adding its name and running `pnpm icons:build` (network needed once). Sources: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`; verified fonts load (`document.fonts`) and glyphs render in a static-export screenshot.

---

## ADR-008 — Zod for boundary validation; tenant accent derivation

**Date:** 2026-10-22 · **Status:** accepted

**Decision.** `zod` 4 is the validation library at every boundary (handoff §7); first use is the tenant accent (`AccentHex`). Tenant accents derive `--accent-soft` and `--accent-text` in OKLCH from the exported gold variants (same lightness, chroma scaled to the accent, gold's hue offset), with text lightness nudged until it meets 4.5:1 on the page background and on the soft fill (D7). The default gold returns the exported values exactly; other accents use one hex in both modes (D8). `TenantTheme` injects the variables as a stylesheet built only from a validated hex.

**Verification.** `src/lib/tenant/*.test.ts`: the formula reproduces exported gold within ΔE_ok < 2 in both modes; all four Settings swatches meet 4.5:1 for accent text (on bg and soft) and for ink on the accent fill.

---

## ADR-009 — Critical-path weight and accessible contrast (Phase 1 verification)

**Date:** 2026-10-22 · **Status:** accepted pending owner review (bar changes flagged in CONSTRAINTS.md)

**Context.** Task 18 measured `/` at LCP 2.76 s (budget 2.5 s) and 199 KiB of JS: the layout preloaded four font files (157 KiB) on every route, and the `@/lib/theme` barrel pulled the client hook — and full `zod` (28 KiB gz) — into every page. axe found 86 serious contrast failures, all from two exported tokens.

**Decisions.**

- **zod/mini** for client-side boundary checks (tenant accent, theme preference): same validation, tree-shakable. Full `zod` remains available where size does not matter.
- The root layout imports `ThemeScript` from its file, not the barrel, so client code stays out of server-only imports.
- Only Onest (LCP text) and the icon subset (`display: block`) are preloaded; Bricolage (75 KiB) and Geist Mono swap in. `/` is back to LCP 1.99 s and 175.3 kB JS.
- **Per-route JS budgets** (`scripts/route-js-size.mjs`, `route-budgets.json`) replace `size-limit`'s whole-export total, so the dev-only `/design-system` chunk (89 KiB) no longer counts against product routes. `size-limit` and `@size-limit/file` removed.
- **Dev reference routes** (`DEV_ROUTES`, noindex) are axe- and focus-checked but outside the Lighthouse budget; product routes (`ROUTES`) carry all budgets.
- **Contrast (D11, handoff §8.2 "implement the accessible version and flag")**: `--fg-3` text is darkened (light `#8E8E8A` → `#70706C`, dark `#76766F` → `#86867F`) to meet 4.5:1 on `--bg` and `--surface`; graphics keep the exported value as `--fg-3-line` (non-text needs 3:1, which it meets). `--ok` light `#2A7F36` → `#257A32` to meet 4.5:1 on `--ok-soft`.

**Verification.** `pnpm check:full`: axe and focus clean on both routes × 3 viewports; Lighthouse `/` within budget; per-route JS within budget.

---

## ADR-010 — Floor guard counts assertions net per file

**Date:** 2026-10-22 · **Status:** accepted (owner chose this option in the Phase 1 review)

**Context.** `scripts/floor-guard.mjs` (from the agent-skills reference) flagged every removed `expect`/`assert`/`should` line in a test file. A reworded or strengthened assertion removes one line and adds one, so legitimate test improvements were blocked as if assertions had been deleted (5 false positives in the Phase 1 review fixes).

**Decision.** `assertion-removed` fires when a test file that still exists ends with fewer assertion lines than it had (removed > added). Deleting a test file is still `test-deleted`; new skips, suppressions and stubs are unchanged. The floor line in CONSTRAINTS.md is reworded to match. `scripts/floor-guard.test.ts` pins the behaviour on a throwaway git repo: replace passes, add passes, delete or net loss fails, file deletion fails, suppression fails.

**Consequences.** Swapping an assertion for a weaker one at equal count is no longer caught mechanically; code review (`/review`) remains the check for that. The guard exempts its own file from scanning, so changes to the guard are not self-flagged: they are reviewed as their own commit.

---

## ADR-011 — Build mode: pages first, testing after the full build

**Date:** 2026-10-22 · **Status:** accepted (owner direction: "build all the pages with the right components and micro interactions, then do the testing after the whole build")

**Context.** Phase 1 took longer than expected because every task carried the full gate set (tests, coverage, Lighthouse, axe, visual baselines). Most of that cost came from non-functional checks that are better run once the screens exist.

**Decision.** `check:task` is now types + lint + secrets + floor + boundaries + static build. Tests, coverage, performance, accessibility runs, visual baselines, PWA/offline, platform providers and the real data layer are deferred to a testing phase that starts when every page in `tasks/build-all.md` exists (CONSTRAINTS.md "Build mode"). The floor, tokens-only, boundaries and secrets checks are unchanged.

**Consequences.** New pages ship without tests until the testing phase; the testing phase must restore the deferred rows as per-task gates. Existing Phase 1 tests keep running in `check:full`. Pages use typed fixtures (`src/mocks`) instead of the data layer; swapping in repositories is a later task. _(Superseded for the staff side by ADR-012.)_

---

## ADR-012 — Demo API on Next.js with a dual-mode build; Neon Postgres; one data layer

**Date:** 2026-10-23 · **Status:** accepted (owner direction: make the staff features real with Next.js API routes and a Neon Postgres database; "a demo app, nothing serious"; the dual-mode build was chosen from the options offered)

**Context.** Pages ran on typed fixtures (ADR-011). The owner wants real behaviour for the staff side first, then admin. The static-export rule (ADR-001, CONSTRAINTS "Static export") forbids route handlers that read a `Request`, so API routes and the Capacitor-ready export cannot be the same build.

**Decision.**

- **Two targets from one codebase** (`next.config.ts`):
  - _static_ (default; `pnpm build`, `pnpm dev:static`): `output: 'export'`, exactly as before. CONSTRAINTS is unchanged and still enforced.
  - _server_ (`VALET_TARGET=server`; `pnpm dev`, `pnpm build:server`, `pnpm start:server` through `scripts/next-server.mjs`): registers the API handlers and builds into `.next-server`, so it never shares a cache with the static build.
- **API handlers are named `route.api.ts`.** `pageExtensions` adds `api.ts` only in server mode, so the static export does not see them (verified: the export lists no `/api/*`; the server build lists all 19). Checked against `node_modules/next/dist/docs/.../pageExtensions.md` and `static-exports.md`.
- **Layers.** `src/app/api/**/route.api.ts` (thin) → `src/server/*` (services, Neon access, session tokens; server-only, enforced by dependency-cruiser rules `server-is-private` and `server-has-no-ui`) → `src/lib/*` (pure logic and the shared DTO schemas).
- **One data layer** (`src/lib/data`, handoff §6). Screens depend on the `StaffRepo` interface. The HTTP implementation calls the API and Zod-validates every response; the mock implementation serves the design fixtures in the static export. The choice is build-time (`NEXT_PUBLIC_DATA_SOURCE`). TanStack Query holds server state.
- **Wire format** is defined once (`src/lib/data/staff/schemas.ts`, `zod/mini`) and validates requests, the server's own responses, and responses in the client. DTOs are display-ready and venue-local (built by `lib/time`), so the server, the mock and the design agree. No bill or pay rate exists in any staff type or staff query.
- **Server rules from the product spec.** The geofence is recomputed server-side from the raw sample (`lib/geo`, accuracy-aware). Clock window, one active clock and a required selfie are enforced. Offline punches keep their device time and land flagged rather than rejected. Out-of-fence requests wait for dispatch and clock in at the request time. No drop after clock-in; a drop under 24 h is flagged late. A claim is one atomic statement (`FOR UPDATE SKIP LOCKED`) with overlap detection. Punch writes are idempotent per key.
- **Database.** Neon Postgres over HTTP (`@neondatabase/serverless`), plain SQL migrations in `db/migrations` applied by `scripts/db-migrate.mjs`, tagged-template queries only (no string-built SQL). Seed data is relative to "now" (`pnpm db:seed [before|due|onshift]` or `POST /api/demo/reset`), with stable ids for people so a browser's session survives a reset.
- **Auth (demo-grade).** Stateless HMAC-signed Bearer tokens (30 days). "Email me a code" accepts the fixed code from the onboarding design; `POST /api/auth/demo` gives the default worker a session and exists only with `DEMO_MODE=1`. The signature check, expiry and per-worker scoping are real.

**Dependencies (handoff §7: justify each).** `@neondatabase/serverless`: a Postgres client that works over HTTP, so no TCP pool or `ws` is needed. `@tanstack/react-query`: server state, as the handoff specifies. `tsx` (dev): runs the TypeScript seed script with the project's path aliases. Vendor component: shadcn `skeleton` for loading states, edited only to import `cn` from `@/lib/utils` and to honour reduced motion.

**Consequences.**

- `pnpm check:task` still builds the static export. The API is type-checked, linted and boundary-checked by the same commands, and has unit tests for the token, seed invariants, label mapping, geofence and time logic, plus end-to-end runs against Neon (smoke script, four-way claim race, browser walkthrough in both modes).
- Device APIs (GPS, camera, push) are still simulated (`?sim=`), so `lib/platform` is the next step for the clock flow; the server already judges whatever position it is sent.
- `route-budgets.json`, Lighthouse and axe still cover only `/` and `/design-system` (build mode, ADR-011).
- The demo database is shared and `POST /api/demo/reset` is unauthenticated when `DEMO_MODE=1`: acceptable for a demo, and it must be off anywhere else.

---

## ADR-013 — Platform providers: real GPS and camera behind `lib/platform`

**Date:** 2026-10-23 · **Status:** accepted (owner direction: when staff clock in, detect their location and turn the camera on to take a photo)

**Context.** The clock flow simulated the reading and the selfie (`?sim=`). Handoff §5.1 requires every device capability behind an interface so Capacitor plugins can replace the web ones, and CONSTRAINTS "Device APIs" lets only `src/lib/platform/**` touch `navigator.geolocation` and `mediaDevices`.

**Decision.**

- `LocationProvider.acquire` (web: `watchPosition`, high accuracy, no cached position) refines for up to 20 s, stops at the first fix as accurate as the venue needs, and returns the best fix on timeout. It is acquisition for one punch, not tracking: the watch is cleared on every exit path, including abort. Distinct failures: denied, unsupported, unavailable, timeout.
- `CameraProvider.open` (web: `getUserMedia`, front camera, video only) returns a session that previews live in a `<video>` and captures one frame as a JPEG (longest side 640 px, quality 0.72, about 25–60 KB). There is no file picker or gallery path. The camera is released when the step ends, the screen unmounts or the photo is taken.
- Simulated providers implement the same interfaces for `?sim=` links and for the fixture-only static build (no venue to stand at). With the demo API and no `?sim=`, the real devices are used.
- The selfie travels with the punch (`selfieImage`, validated as a JPEG data URL under 600 KB) and is stored in `punches.selfie_image` (migration 003). The server still judges the position and requires the selfie flag; a clock-out with no location lands flagged rather than blocked.
- `DEMO_VENUE_LAT` / `DEMO_VENUE_LNG` (optional) move the demo's Grand Hotel to a real coordinate, so a real GPS fix can be inside its fence when testing in person.

**Consequences.**

- Geolocation and camera need a secure context: `localhost` works; a phone reaching the dev server over plain `http://<lan-ip>` will not get either permission, so on-device testing needs HTTPS (a tunnel or a deployed preview).
- Push was built next (ADR-015).
- Selfie retention is still the owner's decision (product spec §13, OPEN_QUESTIONS P9); photos accumulate in the demo database until reset.
- Verified in Edge with a fake camera device and a controlled position against the live API: inside (38 m, judged by the server), outside (420 m), location denied, camera refused, camera released after capture, photo stored.

---

## ADR-014 — Admin API and one admin data layer

**Date:** 2026-10-23 · **Status:** accepted (owner direction: do the admin side API and integration and make it real)

**Context.** The admin app (Live Board, Events, Staff, Venues, Hours, Invoices, Inbox, Settings) ran on fixtures. The staff side already runs on `StaffRepo` with HTTP and mock implementations (ADR-012).

**Decision.**

- `AdminRepo` is the admin app's data boundary, with an HTTP implementation (32 endpoints under `/api/admin/**`, thin `route.api.ts` handlers, logic in `src/server/admin/*`) and a mock implementation for the static export. Screens use TanStack Query hooks in `features/admin/data`.
- Tokens carry a role (`staff` or `admin`). `adminRoute` answers 403 to a staff token, `staffRoute` the reverse. Legacy tokens read as staff. The demo sign-in (`POST /api/auth/demo`, only with `DEMO_MODE=1`) takes `{role}`.
- The Live Board model (slot status, summaries, board derivation) is pure and lives in `lib/live/model.ts`, shared by the server, the mock repo and the screens. Wording is built from structured `facts`, never stored as prose.
- Rules stay on the server: approving or declining an out-of-fence request, nudging, removing from a slot, assigning (one person per spot, never double-booked), hours adjustment with a reason, invoice send. Money is integer cents; bill rates exist only in venue and invoice types.
- The seed is a living operation relative to "now": events today in every state, past hours with flags, invoices, threads. `POST /api/demo/reset` rebuilds it, and ids are stable so tokens survive.
- The tenant accent follows the saved setting (staff read it from their profile), so changing it in Settings recolours both apps.

**Consequences.**

- Cross-app effects are real: a staff member's decline, reply or clock-in shows on the admin screens, and an approval, removal or hours adjustment shows on the staff app.
- Push delivery is still not built; notifications are rows the staff inbox reads.
- Screens that have no design (Add venue, New invoice, invoice PDF, editing instructions) are logged in OPEN_QUESTIONS D29–D33.

---

## ADR-015 — Notification drawer, Web Push, photo retention, and the admin screens the design lacks

**Date:** 2026-10-23 · **Status:** accepted (owner direction: build the missing admin screens, real push notifications, keep punch photos 30 days, a notification icon on every page that opens as a side drawer)

**Decision.**

- **Bell and drawer.** `AppShell` takes `notifications` and draws the bell (phone top bar, tablet rail, desktop sidebar, and the Live Board’s own phone bar) plus a right-hand drawer over the current page; choosing a row navigates and closes it. Closing the drawer marks everything read. Staff and admin have the same shape (`Notifications` DTO), served by `/api/staff/notifications` and `/api/admin/notifications`, polled every 15 s. The full-screen clock-in and onboarding flows have no chrome and so no bell.
- **Admin notifications** (`admin_notifications`, one row per dispatcher): a clock-in request needing approval, a dropped shift, a staff message, and "late" (derived on the Live Board, once per shift via a dedupe key).
- **Web Push.** `PushProvider` in `lib/platform` (web: service worker `/sw.js` + `PushManager`; fixture build: unsupported). The server (`src/server/notify`) writes the center row and pushes to every device the person allowed, using VAPID keys from the environment (`VAPID_*`; without them push is off and the UI hides it). Delivery is best effort and capped at 3 s; endpoints the push service reports gone are deleted. Staff respect their push setting. Turning alerts on is in the drawer, the onboarding step and the profile. One browser endpoint belongs to one person at a time, so staff and admin in the same browser take it over from each other.
- **Retention (P9).** A punch photo is deleted 30 days after the punch; the punch and the `selfie` fact stay. It runs hourly as a side effect of a punch or a Live Board load, and from `GET /api/cron/retention` with `CRON_SECRET` for a real scheduler.
- **Admin screens added** (D29, D30): Add venue, Edit venue, New invoice, invoice PDF (a small dependency-free writer in `lib/pdf`), Edit event instructions.

**Consequences.**

- Verified end to end in Edge: a staff message produced a displayed push notification on an admin device through the real push service.
- iOS delivers push only to an installed home-screen app, which needs the manifest’s icon set (D37).
- `web-push` is a new server dependency.

---

## ADR-016 — Real sign-in; the demo launcher moves to /demo

**Date:** 2026-10-23 · **Status:** accepted (owner direction)

**Decision.**

- `/` is a short public landing page with two sign-in buttons; `/login` signs in (`?role=staff|admin`, `?next=` to return to where the person was headed, kept inside their own app); the old demo launcher is `/demo`.
- **Staff** sign in with their email alone: an active staff row with that email is enough (invited people included, so they can finish onboarding). **Dispatchers** sign in with email and password (`admins.password_hash`, scrypt, constant-time compare, one message for either being wrong). Accounts are created by hand: `pnpm admin:create <email> <password> ["Name"]` (it also resets a password).
- The client no longer creates a demo session silently. No session, or an expired one, sends the person to `/login`; `/`, `/login`, `/demo` and `/staff/onboarding` are reachable signed out. The demo shortcuts (`/api/auth/demo`, reset) still need `DEMO_MODE=1` and are used from `/demo`.
- A demo reset keeps dispatchers that have a password; the seeded demo dispatcher has none.
- Sign out: Profile (staff) and Settings (dispatch). The static build has no server, so signing in there just lets the person through.

**Consequences.** Email-only staff sign-in is weak by design (D38). Turn `DEMO_MODE` off anywhere real.

---

## ADR-017 — Venue search and a real map

**Date:** 2026-10-23 · **Status:** accepted (owner direction: step-by-step Add venue with place search, geocoding and a map; Add venue from New event)

**Decision.**

- `lib/places` is a `PlacesProvider` interface with Photon (komoot, OpenStreetMap data, free, no key) behind it: search as you type (300 ms pause, three characters, cancelled when superseded), results give name, address and coordinates, validated with Zod at the boundary.
- `VenueMap` (Leaflet, OpenStreetMap tiles, loaded in the browser only) shows the pin and the clock-in circle on Add / Edit venue and the venue page; the pin is draggable on the form. The circle and pin take their colours from design tokens through CSS classes.
- Add / Edit venue is two steps: (1) search, map, drag the pin, radius; (2) name, address, contact, dress code, billing. Back keeps what was typed. Typed coordinates remain as a fallback when search is unavailable ("Use my current location" was removed: it was unreliable).
- New event is its own set of steps (Venue, Venue details when new, When, Crew) and adds a venue in place with the same search, map and radius: nothing redirects to the Venues page, and the new venue is created at the end of its details step and selected. The Venues page keeps its own Add venue flow.

**Consequences.** Both services are public and rate-limited by fair use (D40). `leaflet` is a new dependency.
