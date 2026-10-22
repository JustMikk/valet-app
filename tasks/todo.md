# Phase 1 — Design System: tasks

Every task: `pnpm check:task` green, one commit, source of truth = spec + app screens (D1). Commands: unit `pnpm test`, build `pnpm build`, full `pnpm check:full`.

## Foundation

- [x] **Task 1: Design tokens**
  - Acceptance: `src/styles/tokens.css` defines every color token (light + dark), glass/elevation tokens (staff + admin flavours) and motion tokens, all scoped by `[data-theme]` / `[data-app]`. The token metadata (`meta.ts`) and its CSS sync test move to Task 15 with their consumer: the no-orphans boundary rule rejects a module nothing imports.
  - Verify: Task 2 build consumes it
  - Files: `src/styles/tokens.css`
  - Scope: S

- [x] **Task 2: Tailwind theme + shadcn variable mapping (ADR-006)**
  - Acceptance: `globals.css` imports tokens and maps them in `@theme inline` (colors, radii, shadows, fonts). shadcn semantic variables point at our tokens. Type-scale `@utility` classes exist. The `--accent`/`--card` collision is resolved and recorded. The scaffold `.dark` variant is replaced by `[data-theme=dark]`.
  - Verify: `pnpm build`; a scratch render shows `bg-surface`, `text-fg-2`, `text-hero` resolve (checked in Task 15 too)
  - Files: `src/app/globals.css`, `docs/DECISIONS.md`
  - Scope: S

- [x] **Task 3: Fonts and Icon (ADR-007)**
  - Acceptance: Bricolage Grotesque, Onest and Geist Mono load via `next/font` and feed `--fd`/`--ff`/`--fm`. Material Symbols is a committed subset font built from `icon-names.ts` by `pnpm icons:build` (the full font is 5.4 MB; subset 22.9 KiB). `Icon` supports `name`/`filled`/`weight`/`size`, is `aria-hidden` unless given a `label`.
  - Verify: `pnpm test src/components/shared/icon`; `pnpm build`
  - Files: `src/app/layout.tsx`, `src/components/shared/icon.tsx`, `src/components/shared/icon.test.tsx`, `package.json`, `docs/DECISIONS.md`
  - Scope: M

- [x] **Task 4: Tenant accent**
  - Acceptance: `deriveAccentVars(hex, mode)` validates input with Zod. Gold returns the exported values exactly. Ink switches at luminance .55. Soft/text derivation reproduces gold within ΔE < 2. `TenantThemeProvider` injects the vars at the root with no component reading the tenant.
  - Verify: `pnpm test src/lib/tenant`
  - Files: `src/lib/tenant/accent.ts`, `src/lib/tenant/accent.test.ts`, `src/lib/tenant/tenant-theme-provider.tsx`, `src/lib/tenant/index.ts`
  - Scope: M

- [x] **Task 5: Theme mode (light / dark / system)**
  - Acceptance: preference persisted (try/catch, safe without storage). An inline no-flash script sets `data-theme` before paint in the static export. `useThemeMode()` hook. Schema-validated storage read.
  - Verify: `pnpm test src/lib/theme`; `pnpm build` then load `out/` with dark preference → no light flash
  - Files: `src/lib/theme/theme.ts`, `src/lib/theme/theme.test.ts`, `src/lib/theme/theme-script.tsx`, `src/lib/theme/index.ts`, `src/app/layout.tsx`
  - Scope: M

### Checkpoint A

- [ ] `pnpm check:task` green; `pnpm build` green
- [ ] Root page renders with tokens, fonts and dark mode switching correctly

## Components

- [x] **Task 6: Button, IconButton, GlassPill**
  - Acceptance: shadcn `button` variants replaced with accent / strong / secondary / ghost / destructive / destructive-soft × lg 56 / md 48 / sm 40 / compact 44; `shine`; disabled + `reason` (linked by `aria-describedby`); press scale. IconButton/GlassPill 56 px glass with optional dot badge and required accessible label.
  - Verify: `pnpm test src/components`
  - Files: `src/components/ui/button.tsx` (variants), `src/components/shared/action-button.tsx` (icon slots, shine, reason), `src/components/shared/icon-button.tsx`, `src/components/shared/glass-pill.tsx`, `src/components/shared/button.test.tsx`; `glass*` and `shine-sweep` utilities in `globals.css`
  - Scope: M

- [x] **Task 7: StatusBadge + status presets**
  - Acceptance: badge tones ok/warn/neutral/strong/info/outline/muted/bad/bad-solid; the 12 presets from the sheet live in `src/lib/status`; every preset renders icon + words.
  - Verify: `pnpm test src/lib/status src/components/shared/status-badge`
  - Files: `src/components/ui/badge.tsx`, `src/components/shared/status-badge.tsx`, `src/lib/status/presets.ts`, `src/lib/status/presets.test.ts`
  - Scope: M

- [x] **Task 8: ListRow, HeroStat, Avatar, PersonRow**
  - Acceptance: dimensions per sheet (64 / 72 px rows, 44 px avatar, open-slot dashed variant); tabular numerals on HeroStat.
  - Verify: `pnpm test src/components/shared`
  - Files: `src/components/shared/list-row.tsx`, `src/components/shared/hero-stat.tsx`, `src/components/shared/person-row.tsx`, `src/components/ui/avatar.tsx`, `src/components/shared/rows.test.tsx`
  - Scope: M

- [x] **Task 9: CoverageBar**
  - Acceptance: segments on-site / late / expected / open with flex weights; open is hatched and outlined; legend; accessible summary ("4 on site, 1 late, 1 open of 6").
  - Verify: `pnpm test src/components/shared/coverage-bar`
  - Files: `src/components/shared/coverage-bar.tsx`, `src/components/shared/coverage-bar.test.tsx`
  - Scope: S

- [x] **Task 10: UnderlineTabs, ChipGroup**
  - Acceptance: tabs underline variant (19 px, 3 px indicator); ChipGroup single-select via ToggleGroup, keyboard operable, selected = accent-soft + inset.
  - Verify: `pnpm test src/components/shared`
  - Note: shadcn `tabs` was installed and evaluated, then removed: its line variant's 2 px pseudo indicator and dark-mode border overrides conflict with the 3 px underline, so UnderlineTabs composes the same Base UI primitive. `toggle` variants swapped to the design chip.
  - Files: `src/components/ui/toggle.tsx`, `src/components/ui/toggle-group.tsx`, `src/components/shared/underline-tabs.tsx`, `src/components/shared/chip-group.tsx`, `src/components/shared/tabs-chips.test.tsx`
  - Scope: M

- [x] **Task 11: TextField, SystemBanner**
  - Acceptance: Field + Input at 56 px / radius 16 / surface / focus inset / accent caret; label, helper, error wired (`aria-invalid`, `aria-describedby`). SystemBanner warn/neutral with icon.
  - Verify: `pnpm test src/components/shared`
  - Files: `src/components/ui/field.tsx`, `src/components/ui/input.tsx`, `src/components/shared/text-field.tsx`, `src/components/shared/system-banner.tsx`, `src/components/shared/field-banner.test.tsx`
  - Scope: M

- [x] **Task 12: AttentionCard, FeatureCard, PagerDots, GlassCard**
  - Acceptance: specs per sheet; FeatureCard dismiss button labelled; GlassCard uses glass tokens.
  - Verify: `pnpm test src/components/shared`
  - Files: `src/components/shared/attention-card.tsx`, `src/components/shared/feature-card.tsx`, `src/components/shared/glass-card.tsx`, `src/components/shared/cards.test.tsx`
  - Scope: M

- [x] **Task 13: TabBar**
  - Acceptance: floating glass 76 px, 7 px padding, active = surface pill, count badge; `nav` + `aria-current`.
  - Verify: `pnpm test src/components/shared/tab-bar`
  - Files: `src/components/shared/tab-bar.tsx`, `src/components/shared/tab-bar.test.tsx`
  - Scope: S

- [x] **Task 14: ResponsiveSheet, ConfirmSheet**
  - Acceptance: Drawer below 700 px (radius 30 top, grabber, sheet-up), Dialog at 700 px and up (440–480 px, radius 28, `rgba(0,0,0,.4)` scrim token); title required; Esc closes; focus returns. ConfirmSheet states the consequence and pairs Cancel + action.
  - Verify: `pnpm test src/components/shared/sheet`
  - Files: `src/components/ui/drawer.tsx`, `src/components/ui/dialog.tsx`, `src/components/shared/responsive-sheet.tsx`, `src/components/shared/sheet.test.tsx`, `src/hooks/use-breakpoint.ts`
  - Scope: M

### Checkpoint B

- [x] `pnpm check:task` green; boundaries clean; every component exported from `src/components/shared/index.ts`

## Showcase and verification

- [x] **Task 15: `/design-system` route, sections 01–04, accent switcher**
  - Acceptance: thin route (`noindex`); sections Principles, Color tokens (from meta), Type scale, Space/Radius/Elevation match the sheet's layout at 1320 px; 4-swatch accent switcher recolors live.
  - Verify: `pnpm build`; manual at `/design-system`
  - Acceptance (moved from Task 1): token metadata + sync test against `tokens.css`, at `src/lib/tokens/meta.ts` (token values are data; features may not hard-code colors).
  - Files: `src/app/(dev)/design-system/page.tsx`, `src/features/design-system/tokens.meta.ts` (+ test), `src/features/design-system/sections-foundations.tsx`, `src/features/design-system/accent-switcher.tsx`, `src/features/design-system/index.ts`
  - Scope: M

- [x] **Task 16: Sections 05 (components, light + dark) and 06 (rules)**
  - Acceptance: section 05 renders every component in two `data-theme` scopes side by side, same order and labels as the sheet; section 06 rules.
  - Verify: `pnpm build`; manual
  - Files: `src/features/design-system/section-components.tsx`, `src/features/design-system/component-specimens.tsx`, `src/features/design-system/section-rules.tsx`
  - Scope: M

- [ ] **Task 17: Pixel comparison**
  - Acceptance: `e2e/design-system.visual.spec.ts` renders the design file and `/design-system` at 1320 px, screenshots each section/component, compares element boxes and computed colors/radii, writes a side-by-side + overlay report; deltas fixed or listed as font-only; baselines committed.
  - Verify: `pnpm exec playwright test e2e/design-system.visual.spec.ts --project=desktop`
  - Files: `e2e/design-system.visual.spec.ts`, `e2e/visual-helpers.ts`, baselines
  - Scope: M

- [ ] **Task 18: A11y, perf, size, intake**
  - Acceptance: `/design-system` added to `e2e/routes.ts`; axe clean in both themes × 3 viewports; Lighthouse within budget; bundle ratchet updated with a recorded reason; `docs/DESIGN_INTAKE.md` lists tokens and component sources.
  - Verify: `pnpm check:full`
  - Files: `e2e/routes.ts`, `e2e/a11y.spec.ts`, `.size-limit.json`, `CONSTRAINTS.md`, `docs/DESIGN_INTAKE.md`
  - Scope: M

### Checkpoint C — owner review

- [ ] Owner reviews `/design-system` against `Design System.dc.html` (light, dark, 4 accents) and the pixel report
- [ ] `pnpm check:full` green; `/agent-skills:review` findings resolved
