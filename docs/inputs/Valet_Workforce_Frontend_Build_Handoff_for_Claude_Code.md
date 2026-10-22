# Valet Workforce Platform — Frontend Build Handoff (for Claude Code)

**Audience:** Claude Code, building the frontend codebase
**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui (base) · Aceternity UI (selective)
**Date:** Oct 22, 2026

This file tells you **how to build**: tooling, standards, architecture, and the order of work. It deliberately does **not** describe visuals or product behavior.

- **Product behavior** (what each feature does, roles, rules, edge cases, flows) → `Valet_Workforce_PWA_MVP_Design_Handoff.md` (the "Product Handoff"). It is the source of truth for behavior.
- **Visual design** (layout, style, components, copy) → the **Claude Design export** attached alongside this file. It is the source of truth for how things look.
- If the two conflict, or either is silent on something you need, **stop and ask** instead of inventing. Log every such question in `docs/OPEN_QUESTIONS.md`.

Tags used below: **[REQUIRED]** non-negotiable · **[DEFAULT]** proposed, change only with reason · **[ASK]** needs the owner's decision before you proceed.

---

## 1. What you are building

A mobile-first **PWA** with three role areas in one codebase:

| Area | Users | Primary device |
|---|---|---|
| **Staff app** | Valet attendants | Phone |
| **Admin app** | Client owners/managers | Desktop and phone |
| **Platform admin** | REM ops (minimal) | Desktop |

Core capabilities (details in the Product Handoff): venues and geofences, staff invites, event creation/assignment/claiming, geofenced clock-in with live selfie, a **Live Board**, hours review, invoicing, and in-app chat plus push notifications.

**The same codebase may later be wrapped with Capacitor for native iOS/Android.** That requirement shapes several architecture rules in section 5. Do not skip them.

**Scope of this repo: frontend only.** The backend does not exist yet and its stack is undecided **[ASK]**. You will build against a typed data-access layer with a **mock implementation** so the whole product is demonstrable and testable now, and a real backend can be swapped in later (section 6).

---

## 2. Inputs you must read first

1. This file, fully.
2. The **Product Handoff** (`Valet_Workforce_PWA_MVP_Design_Handoff.md`), fully. Pay particular attention to sections 5 (domain model and status axes), 8 (clock-in rules), 9 (Live Board), and 13 (open decisions, which you must **not** resolve silently).
3. The **design export**. Before writing any code, do the **Design Intake** (section 4).

Place all three under `docs/inputs/` in the repo so every future session can find them.

---

## 3. MANDATORY SETUP: skills and MCP (do this before any feature code)

**[REQUIRED]** Complete every step below, in order, and verify each. Do not begin building features until the verification checklist in 3.6 passes. If a step fails, fix it or stop and report; do not continue without the tool and "work around" it.

### 3.1 Scaffold and initialise shadcn first
Some setup depends on files that only exist after initialisation (the shadcn skill activates when it finds `components.json`), so the order matters.

1. Scaffold a Next.js project (App Router, TypeScript, Tailwind, ESLint, `src/` directory, import alias `@/*`). Use **pnpm** **[DEFAULT]**.
2. Initialise shadcn:
   ```bash
   pnpm dlx shadcn@latest init
   ```
   This creates `components.json`. Choose the style/base color recommended by the design export's tokens; if unclear, use defaults and revisit in the Design Intake.
3. Commit this as the first commit.

### 3.2 Install Addy Osmani's agent skills
Source: <https://github.com/addyosmani/agent-skills>. It provides engineering workflows (spec, plan, build, test, review, ship) and 25 skills with verification gates.

**Recommended for Claude Code (whole-pack install, so shared checklists in `references/` are included):**
```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```
If the marketplace add fails with an SSH/publickey error, use the HTTPS form:
```
/plugin marketplace add https://github.com/addyosmani/agent-skills.git
/plugin install agent-skills@addy-agent-skills
```
(If it still fails: `git config --global url."https://github.com/".insteadOf git@github.com:` and retry.)

**Alternative, any agent:** `npx skills add addyosmani/agent-skills` installs all 25 skills. Prefer the plugin route; installing individual skills copies only `skills/<name>/` and omits the shared `references/` checklists.

Slash commands this installs (use the namespaced form where a built-in has the same name, e.g. `/agent-skills:review`):
`/spec` · `/plan` · `/build` · `/test` · `/constraints` · `/review` · `/webperf` · `/code-simplify` · `/ship`

### 3.3 Install the shadcn skill
Source: <https://ui.shadcn.com/docs/skills>. Gives you project-aware knowledge of shadcn/ui: it reads `components.json`, runs `shadcn info --json`, and enforces correct composition patterns and APIs for the project's base library.
```bash
pnpm dlx skills add shadcn/ui
```

### 3.4 Install and connect the shadcn MCP server
Source: <https://ui.shadcn.com/docs/mcp>. Lets you browse, search, and install components from registries.
```bash
pnpm dlx shadcn@latest mcp init --client claude
```
This writes `.mcp.json`. If you configure it manually, the entry is:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```
**Restart Claude Code**, then run `/mcp` and confirm `shadcn` shows **Connected**. If you see "No tools or prompts": run `npx clear-npx-cache`, re-enable the server, restart.

### 3.5 Register the Aceternity UI registry
Source: <https://ui.aceternity.com/components/cli>. Aceternity components install through the same shadcn CLI and MCP server once the registry is declared.

Add to `components.json`:
```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```
Commands you will use:
```bash
npx shadcn@latest search @aceternity -q "card"      # discover
npx shadcn@latest view @aceternity/<name>           # inspect code and deps before installing
npx shadcn@latest add @aceternity/<name>            # install
npx shadcn@latest list @aceternity                  # list everything
```
Through the MCP server you can do the same in natural language (e.g., "find a file-upload component from the Aceternity registry").

**Licensing:** Some Aceternity blocks/templates are paid ("All-Access"). **[REQUIRED]** Never work around a paywall. If the design export uses something that needs a license the owner hasn't confirmed, substitute a shadcn-based equivalent and log it in `docs/OPEN_QUESTIONS.md`.

### 3.6 Setup verification checklist (all must be true)
- [ ] `components.json` exists and includes the `@aceternity` registry
- [ ] `/plugin` shows `agent-skills` installed; `/spec`, `/plan`, `/build`, `/test`, `/constraints`, `/review` are available
- [ ] shadcn skill installed (`skills add shadcn/ui` succeeded); `pnpm dlx shadcn@latest info --json` runs
- [ ] `/mcp` shows `shadcn` as **Connected**
- [ ] A test query succeeds through the MCP server against **both** registries (e.g., "show me the button component" and "search @aceternity for a card"), then discard the test output
- [ ] `docs/SETUP_LOG.md` records the commands run, versions installed, and the verification results

### 3.7 Set the quality bar and project memory (still before feature code)
1. Run **`/constraints`** (constraint-driven-development) to produce `CONSTRAINTS.md` from the standards in section 7, and place each check at the right cost point (editor/pre-commit/CI). Do not accept defaults you cannot justify; get owner approval for thresholds.
2. Create **`CLAUDE.md`** at the repo root (context-engineering skill): a concise summary of this document's rules, the skill/MCP protocol (section 8), the folder structure, and links to `docs/inputs/`. Keep it short; link, don't paste.
3. Create `docs/DECISIONS.md` (ADR log, documentation-and-adrs skill). Record every architectural choice with the reason.

---

## 4. Design Intake (before any feature code)

The design export was produced by a design tool; treat it as a **reference to translate**, not code to copy.

1. **Inventory** every screen, state, and flow in the export. Write `docs/DESIGN_INTAKE.md` mapping each to a Product Handoff flow (section numbers) and listing:
   - **Tokens** (color, type, spacing, radius, shadow, motion). Move them into the Tailwind/shadcn theme as CSS variables; **no hard-coded hex values or magic numbers in components**.
   - **Components** and, for each, its source decision (shadcn primitive / Aceternity / custom) using the decision tree in section 8.2.
   - **Gaps:** states the Product Handoff requires that the design does not show (error, empty, offline, permission-denied, pending-sync, etc.).
   - **Conflicts** between design and Product Handoff rules.
2. **Tenant theming:** the product serves multiple client companies with their own logo and name (and possibly brand color). Design the token layer so tenant branding is injected via CSS variables at the root, not baked into components **[REQUIRED]**.
3. Ask the owner to resolve gaps and conflicts **before** building the affected slice.
4. Light and dark mode: follow whatever the design export defines; if it defines only one, build only that one and note it.

---

## 5. Architecture rules

### 5.1 Capacitor-ready from day one
Capacitor bundles static web assets into the native shell (or loads a remote URL, which risks store rejection as a thin wrapper). To keep the native option cheap later:

- **[REQUIRED]** The app must **build and run with `output: 'export'`** (static export). That means: no Next.js server-only features in the app (no Server Actions, no Route Handlers, no middleware, no ISR/`revalidate`, no server-side cookies/session logic, no `next/image` default optimizer unless configured for export). All server logic lives in the future backend, reached via the data layer.
- **Dynamic routes under static export** need pre-known params. For entity detail pages (events, staff, invoices, threads), use a **client-resolved routing approach** that works under export (e.g., query-param detail routes or a single client-rendered catch-all). Verify the current Next.js docs for the supported pattern (source-driven-development skill) and record the choice in `docs/DECISIONS.md`. Deep links from push notifications must resolve through this scheme.
- **Wrap every device capability behind an interface** in `src/lib/platform/` so the web implementation can be swapped for Capacitor plugins later:
  - `LocationProvider` — single-shot position with accuracy and a "simulated/mock" flag when available. **No continuous or background tracking in the PWA.**
  - `CameraProvider` — **live** selfie capture returning a Blob (no gallery picker).
  - `PushProvider` — permission state, subscribe/unsubscribe, deep-link handling.
  - `OfflineStore` / `OfflineQueue` — durable storage and sync queue (IndexedDB on web).
  - `MapProvider` — venue pin/fence selection and punch-point display **[ASK: which map/geocoding provider]**.
  - No component may call `navigator.geolocation`, `getUserMedia`, `Notification`, or `indexedDB` directly. Only the web provider implementations do.
- Avoid browser-only assumptions in UI logic (hover-only affordances, reliance on browser history chrome, fixed viewport assumptions). Respect safe-area insets.

### 5.2 PWA requirements
- Web app manifest, icons, installability, theme color; offline shell for the staff app routes needed offline (my shifts, active shift, clock-in).
- Service worker for caching and offline: evaluate a maintained solution (e.g., Serwist) against the current Next.js PWA guidance **[DEFAULT]**; record the choice as an ADR.
- Web push: subscription flow and notification display. **iOS only supports web push for installed home-screen apps (iOS 16.4+), so install detection and guidance are part of onboarding** (Product Handoff 7.5). Verify current platform behavior on real devices; do not assume.
- Update strategy: new versions must not strand users on stale clients mid-shift (detect update, prompt safely, never interrupt an in-progress punch).

### 5.3 Folder structure **[DEFAULT]**
```
src/
  app/
    (auth)/                 # sign-in, invite acceptance
    (staff)/                # staff app routes
    (admin)/                # admin app routes (incl. live board)
    (platform)/             # REM ops
    manifest.ts
  components/
    ui/                     # shadcn + Aceternity installed primitives (vendor layer)
    shared/                 # our generic composites built on ui/ (no domain logic)
  features/
    venues/  staff/  events/  shifts/  clock/  live-board/
    hours-review/  invoices/  messaging/  settings/
      components/  hooks/  api/  schemas/  types.ts  utils/  __tests__/
  lib/
    platform/               # LocationProvider, CameraProvider, PushProvider, OfflineQueue, MapProvider
    data/                   # data-access interfaces, mock + http implementations
    realtime/               # RealtimeClient interface + mock emitter
    geo/                    # pure geofence math (haversine, accuracy-aware inside check)
    time/                   # all time-zone-aware formatting and math
    money/                  # integer-cents money helpers
    permissions/            # role/capability checks
    tenant/                 # tenant theming and context
  mocks/                    # seeded fixtures and scenario scripts
docs/
  inputs/  SETUP_LOG.md  DESIGN_INTAKE.md  DECISIONS.md  OPEN_QUESTIONS.md
```
Rules for layers:
- `components/ui/` is the **vendor layer**: add via CLI/MCP; keep edits minimal and documented. Do not put product logic here.
- `components/shared/` composes `ui/` into reusable building blocks.
- `features/*` own domain components and logic. Features may import from `shared`, `ui`, and `lib`, **never from each other's internals** (cross-feature access goes through a feature's public `index.ts`).
- Route files in `app/` stay thin: compose feature components, no business logic.

### 5.4 Roles and permissions in the frontend
- One `lib/permissions` module defines capabilities per role (Staff, Admin, Platform admin). Route groups and components use it; no scattered `role === 'admin'` checks.
- **[REQUIRED]** Use **separate view-model/DTO types per role** so sensitive fields cannot accidentally render in the wrong place: bill rates must not exist in any staff-facing type; pay rates must not exist in any venue-facing or invoice type. The real backend must enforce this too; the frontend's job is to never request or hold what it shouldn't show.
- Platform "view-as" must be visibly indicated and routed through the same permission model.

---

## 6. Data-access layer (backend-agnostic) and realtime

The backend and its auth provider are not chosen **[ASK]**. Build so that choice is a swap, not a rewrite.

- Define **TypeScript interfaces** per domain (e.g., `EventsRepo`, `StaffRepo`, `ShiftsRepo`, `PunchesRepo`, `InvoicesRepo`, `MessagesRepo`, `VenuesRepo`, `SettingsRepo`) in `lib/data/`, plus **Zod schemas** that validate everything crossing the boundary.
- Ship a **mock implementation** (in-memory, persisted to IndexedDB if useful for demos) behind these interfaces, with deterministic seed data. A future `http` implementation will be added without changing feature code.
- Server state via **TanStack Query** (cache, optimistic updates where safe, retries, offline awareness). Minimal client state via a small store only where truly needed.
- **Realtime** through a `RealtimeClient` interface (subscribe to channels/topics, connection state, last-update time). Provide a **mock emitter** that replays scripted scenarios (arrivals, late workers, drops, claims, override requests) so the Live Board can be built and demonstrated without a backend. The real transport (SSE/WebSocket/other) is **[ASK]**.
- **Idempotency:** punches and other writes that can be retried carry a client-generated idempotency key.
- **Money:** integer minor units only; one `lib/money` module for formatting and arithmetic. Never use floats for currency.
- **Time:** all event times are venue-local; one `lib/time` module owns zone-aware formatting, durations, overnight events, and DST edges. No ad-hoc `new Date()` math in components.
- **Seed scenarios** (in `src/mocks/`) must include the five scenarios from Product Handoff 9.13, a clean day, an empty tenant (first-run), and an offline/queued-punch case.

### 6.1 Geofence logic
- `lib/geo` contains pure, unit-tested functions: distance (haversine), accuracy-aware inside/outside/low-accuracy classification using tenant settings (radius, max accuracy). The client's verdict is **advisory UX only**; the server is authoritative and will re-verify. The UI must handle the server disagreeing with the client.

### 6.2 Offline punch queue (staff app)
- Punch = `{ idempotencyKey, assignmentId, type, deviceTimestamp, locationSample, selfieBlob?, geofenceResultClient }` stored durably before any network attempt.
- States: `pending → syncing → synced | failed(retryable) | flagged-by-server`. Backoff retries; survive app restarts; visible pending/synced/failed markers in the UI.
- Cache "my shifts" for offline viewing. Conflicts resolve to **flagged for admin review**, never silent discard (Product Handoff 8.4 and 12).

---

## 7. Code quality standards **[REQUIRED]**

These feed `/constraints` (section 3.7). Tighten them if the owner agrees; do not loosen them to get green.

**Language and structure**
- TypeScript `strict: true`, no `any` (use `unknown` and narrow), no non-null assertions without a comment, no `@ts-ignore` (use `@ts-expect-error` with a reason).
- Zod (or equivalent) at every boundary: API responses, form input, storage reads, query params.
- Components: small, single-purpose, typed props, no business logic in presentational components, no giant files (aim ≤ ~250 lines; split beyond that), no deep prop drilling (use composition or context where it reads better).
- Server vs client components: default to the simplest model that satisfies the static-export rule in 5.1; mark `"use client"` deliberately and keep it at leaf boundaries.
- No dead code, no commented-out blocks, no stray `console.log`.

**Styling**
- Tailwind utilities with design tokens only; extract repeated patterns into components or `cva` variants, not copy-pasted class strings.
- Use `cn()` for conditional classes. No inline `style` except for truly dynamic values. No hard-coded colors, spacing scales, or breakpoints outside the theme.
- Never edit vendor primitives for one-off needs; wrap or extend in `components/shared/`.

**Forms**
- Follow the shadcn skill's composition guidance (e.g., the `Field` / `FieldGroup` pattern) with React Hook Form + Zod **[DEFAULT]**. Accessible labels, errors, and descriptions on every field.

**Accessibility (WCAG 2.1 AA)**
- Keyboard operable, visible focus, correct roles/labels, sufficient contrast, **never color alone to convey status** (critical for the Live Board), respect `prefers-reduced-motion`, touch targets sized for one-handed outdoor use.
- Use `references/accessibility-checklist.md` from the agent-skills pack as the checklist.

**Performance**
- Targets via `/constraints`; start from Core Web Vitals "good" thresholds measured on a throttled mid-range Android profile **[DEFAULT]**. Propose bundle budgets per route group (the staff app's critical path must be lean; the admin Live Board can be heavier).
- Aceternity/Motion-heavy components are **lazy-loaded and never on the staff clock-in critical path**.
- Measure before optimizing (`/webperf`, performance-optimization skill).

**Testing (TDD where logic exists)**
- Vitest + React Testing Library for units and components; **Playwright** for end-to-end with **mobile viewport projects** for the staff app and desktop plus mobile for the admin app; MSW or the mock repos for network.
- Mandatory unit tests for: `lib/geo`, `lib/time`, `lib/money`, permission checks, offline queue state machine, billing/hours calculations on the client, status-derivation logic (event health, person-in-slot states from Product Handoff 9.5–9.6).
- Test pyramid per the agent-skills `test-driven-development` skill; tests assert behavior, not implementation.

**Tooling and workflow**
- ESLint + Prettier (+ Tailwind class sorting plugin), TypeScript check, tests, and build in **CI and a pre-commit hook** (e.g., husky + lint-staged) **[DEFAULT]**.
- **Git:** small, atomic commits (~100 lines per change where possible), conventional commit messages, trunk-based flow, one vertical slice per branch/PR (`git-workflow-and-versioning`).
- Dependencies: justify each new one in `docs/DECISIONS.md`; prefer what the shadcn/Aceternity registries already pull in; run an audit before each slice completes.
- Security: no secrets in the repo; env via `.env.local` with a committed `.env.example`; follow `security-and-hardening` (input handling, XSS, dependency audit).
- Documentation: ADR for each notable decision; README with run/test/build instructions; short per-feature `README.md` where behavior is non-obvious.

---

## 8. Skill and MCP usage protocol (applies to the ENTIRE build)

Installing the tools is not enough. **[REQUIRED]** Use them as specified below on every slice, and record in each PR description which skills, commands, and MCP queries were used.

### 8.1 Which tool at which moment

| Moment | Use | Output / gate |
|---|---|---|
| Start of the project | `/constraints` (constraint-driven-development), context-engineering, documentation-and-adrs | `CONSTRAINTS.md`, `CLAUDE.md`, `docs/DECISIONS.md` |
| Before each slice | `/spec` (spec-driven-development) scoped to the slice, grounded in the Product Handoff section + design intake; then `/plan` (planning-and-task-breakdown) | Slice spec with acceptance criteria; small atomic task list. **Get owner approval before `/build`** |
| Unclear requirement | `interview-me` skill (one question at a time) | Answers logged in `docs/OPEN_QUESTIONS.md` |
| Any framework/library decision | **source-driven-development**: verify against official docs (Next.js, Tailwind, shadcn, Capacitor, Web Push), cite sources, flag what is unverified | Cited ADR entries. Do **not** rely on memory for versions or APIs |
| Writing UI | shadcn skill + shadcn MCP + `frontend-ui-engineering` (component architecture, accessibility, responsive) | Component sourcing decision per 8.2 |
| Implementing a task | `/build` with `incremental-implementation` and `test-driven-development` | One thin vertical slice at a time: implement → test → verify → commit |
| Tests fail / build breaks | `debugging-and-error-recovery` | Root cause, regression test, no silencing checks |
| Verifying in browser | `browser-testing-with-devtools` (needs the Chrome DevTools MCP; **[ASK]** the owner before installing it) | Runtime evidence: console, network, mobile viewport behavior |
| Slice complete | `/test`, then `/review` (`/agent-skills:review`), then `/code-simplify` where warranted | Five-axis review, severity-labelled findings resolved |
| Touching auth, input, storage, permissions, uploads | `security-and-hardening` | Checklist from `references/security-checklist.md` |
| Before accepting a slice | `/webperf` on the slice's routes; accessibility checklist | Metrics reported honestly, not estimated |
| End of MVP | `/ship` (shipping-and-launch) | Launch checklist |

**`/build auto`** (single approved autonomous pass) is **not allowed** until foundation slices 0–2 are approved by the owner. After that, it may be used per slice **only** if tests-first and per-task commits remain intact and it pauses on failures.

For high-stakes pieces (offline punch queue, geofence verification logic, hours/billing calculations, permission boundaries), also apply **doubt-driven-development**: an adversarial fresh-context review of the design and the implementation before merge.

### 8.2 Component sourcing decision tree **[REQUIRED]**
For every UI element in the design export, in this order:

1. **Does a shadcn primitive or block cover it?** Check with the shadcn MCP (`search`/`view`) and the shadcn skill's guidance. If yes → install via the CLI/MCP and compose it. **This is the default and covers most of the product** (forms, tables, dialogs/sheets/drawers, tabs, command palette, sidebar, badges, tooltips, skeleton, empty states, toasts, data tables, calendar/date picker, avatar, etc.).
2. **Is it a distinctive interaction or effect the design explicitly calls for** (and shadcn has no equivalent)? Search the **Aceternity** registry (`search @aceternity`, `view` first to check code, dependencies, and license). If it fits → install via CLI/MCP and wrap it in `components/shared/` so the rest of the app depends on our wrapper, not the vendor file.
3. **Neither fits?** Build a custom component **from shadcn primitives and tokens**. Document why in `docs/DECISIONS.md`.

Rules:
- **Never hand-write a component that exists in the shadcn registry.** Query first; cite the registry item you used or ruled out.
- **Operational screens come first.** The staff clock-in path, the Live Board, hours review, and the attention queue are used under time pressure on phones outdoors. Prefer plain, fast, accessible shadcn primitives there. Use Aceternity only where the design export explicitly requires it, and only if it does not hurt performance, legibility, or `prefers-reduced-motion` behavior. Decorative effects belong on marketing-style surfaces, not on operational ones.
- Record each component's source (`shadcn` / `aceternity` / `custom`) in a table in `docs/DESIGN_INTAKE.md` and keep it current.
- Pin versions of installed registry components' dependencies; check for conflicting Tailwind or Motion versions before adding Aceternity items.
- If the design export shows something that conflicts with accessibility requirements (contrast, tap target size, color-only status), implement the accessible version and flag the deviation.

### 8.3 Evidence rule
"Seems right" never counts. Each slice's PR must include: test output, lint/typecheck/build results, an accessibility check, a mobile-viewport check for staff routes, and (for performance-relevant slices) measured numbers. If a check was skipped, say so and why.

---

## 9. Build plan: vertical slices

Each slice is a thin, end-to-end, demonstrable increment (UI + data layer + mock + tests). Complete, review, and get owner sign-off before moving on. Section numbers refer to the **Product Handoff**.

| # | Slice | Product Handoff | Notes |
|---|---|---|---|
| **0** | **Foundation**: tooling per section 3, Design Intake, tokens, tenant theming, app shells for staff/admin/platform route groups, permissions module, platform provider interfaces (web impls), data layer + mock + seed scenarios, realtime mock, PWA manifest and basic service worker, CI | 3, 4, 12 | No feature UI beyond shells. Gate: `/constraints` approved, CI green, static export builds |
| **1** | **Auth and onboarding**: invite acceptance, location consent, install guidance, notification permission, sign-in method (**[ASK]** — undecided, Product Handoff 13.1) | 7.1, 7.2, 7.5 | iOS install and push flow must be real-device verified |
| **2** | **Venues and staff management** | 7.3, 7.4 | Map/geocoding provider **[ASK]** before building the pin/fence UI |
| **3** | **Events**: create, edit, cancel, duplicate, assign, remove/replace, fill tracking, open-slot publishing | 7.6, 5.1, 5.2 | Event status has two independent axes; model both |
| **4** | **Staff shifts**: home, my shifts, open events, claim (race handling), drop (late-drop flag) | 7.7–7.9 | Instant first-come claim is confirmed |
| **5** | **Clock in/out** with geofence evaluation, live selfie, exception paths, request-approval flow, offline queue | 8 | Highest-risk slice: apply doubt-driven-development; real-device testing for location, camera, offline |
| **6** | **Live Board and attention queue**: by-event view, health states, person-in-slot states, in-place actions, realtime behavior, plus Day timeline and People views | 9 | Largest UI slice. Implement state derivation as pure, heavily tested functions first, then UI. Honor 9.9 (no live-tracking illusion) |
| **7** | **Hours review and approval** | 10.1 | Edits require a reason and write audit entries |
| **8** | **Invoicing**: drafting, preview, send, status timeline, memos, payment recording, hours export | 10.2–10.6 | Money in integer cents; locking after send |
| **9** | **Messaging and notifications**: 1:1 chat, broadcasts, notification center, preferences, push deep links | 11 | Delivery/read states; broadcast reply routing |
| **10** | **Settings, platform admin, hardening**: tenant settings, platform tenant management and view-as, audit views, accessibility pass, performance pass, PWA audit, real-device matrix | 6, 7.1, 12 | Then `/ship` |

Between slices: update `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, and `CLAUDE.md` if conventions changed.

---

## 10. Definition of done (every slice)

- [ ] Behavior matches the Product Handoff section(s) listed, including edge cases and failure states, and matches the design export (or documented, approved deviations)
- [ ] All Product Handoff **[OPEN]** items touched by this slice are handled in a way that works for either answer, or have been explicitly decided by the owner and logged
- [ ] Components sourced per 8.2; sources recorded
- [ ] Types strict; boundaries validated; no `any`; no lint suppressions
- [ ] Unit/component tests for new logic; e2e for the slice's primary flow (mobile viewport for staff)
- [ ] Lint, typecheck, tests, and `next build` with static export all pass in CI
- [ ] Accessibility checked against the checklist (keyboard, focus, contrast, labels, non-color status, reduced motion)
- [ ] Staff routes verified at phone viewport; offline/slow-network behavior verified where relevant
- [ ] No role sees data it shouldn't (bill vs pay rates, other tenants' data)
- [ ] `/review` findings resolved; ADRs and docs updated; commit history is atomic and readable
- [ ] Demo path works end to end against the mock layer using the seeded scenarios

---

## 11. Open items that need the owner **[ASK]** (do not decide silently)

1. **Backend stack, API contract, and auth provider.** Until decided, build against the data-access interfaces and mock layer.
2. **Realtime transport** (SSE, WebSocket, or a managed service).
3. **Staff sign-in method** without SMS (Product Handoff 13.1).
4. **Map and geocoding provider** for venue pins/fences and punch-point display, and its licensing/storage terms.
5. **Dynamic-route strategy under static export** (5.1) if the owner prefers a different tradeoff.
6. **Aceternity licensing**: whether any Pro blocks are licensed.
7. **Installing the Chrome DevTools MCP** for browser-based verification (8.1).
8. **Performance budgets and `/constraints` thresholds** (section 7).
9. Every Product Handoff section 13 item that a slice touches.

Keep this list in `docs/OPEN_QUESTIONS.md` with status, owner, and date.

---

## 12. Guardrails

- **Do not** invent product behavior, copy, or business rules. Ask, or follow the Product Handoff and design export.
- **Do not** start features before section 3 is complete and verified.
- **Do not** copy design-export code wholesale; translate it into the project's components, tokens, and standards.
- **Do not** silence lint rules, skip tests, or weaken types to get green. Fix the cause or escalate.
- **Do not** add continuous or background location tracking, a gallery-upload selfie path, or any client-side trust of geofence results.
- **Do not** put bill rates in staff-facing code or pay rates in venue-facing code.
- **Do not** use Next.js server-only features that break static export (5.1).
- **Do not** bypass a licensing paywall or add undocumented dependencies.
- **Do** keep commits small, evidence attached, and decisions written down.
