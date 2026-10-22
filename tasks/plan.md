# Implementation Plan: Phase 1 — Design System

Spec: [docs/specs/phase-1-design-system.md](../docs/specs/phase-1-design-system.md) (approved 2026-10-22). Tasks: [tasks/todo.md](todo.md).

## Overview

Tokens first, then theming plumbing (fonts, icons, tenant accent, theme mode), then the components bottom-up, then the `/design-system` page that composes them, then pixel, a11y and perf verification against `Design System.dc.html`. Every task leaves `pnpm check:task` green and is committed on its own.

## Architecture decisions

- **Token names stay exactly as exported** (`--bg`, `--surface`, `--accent`, `--card`…; DESIGN_README "use these exact names"). shadcn's own variables collide on two names: `--accent` (shadcn: subtle hover fill; ours: tenant gold) and `--card` (shadcn: card surface; ours: glass fill). Decision (ADR-006, Task 2): our tokens own those names. shadcn's semantic slots (`--background`, `--primary`, `--muted`, `--border`, `--ring`, `--popover`…) are mapped onto ours. Each vendor primitive installed is audited for `bg-accent` / `bg-card` usage and mapped to `bg-surface` in its variants.
- **Theme scoping by attribute, not `:root` only.** `[data-theme="light"|"dark"]` and `[data-app="staff"|"admin"]` can be set on any element, so the showcase renders both themes side by side and the shells pick their glass flavour.
- **Tenant accent derived in TypeScript, injected as CSS variables.** `deriveAccentVars(hex, mode)` returns `--accent`, `--accent-rgb`, `--accent-ink`, `--accent-soft`, `--accent-text`. The default gold returns the exported values exactly; other accents use a mixing formula unit-tested to reproduce gold within ΔE < 2 (D7). Components never read the tenant.
- **Type scale as Tailwind `@utility` classes** (`text-hero`, `text-title-1`, `text-label`…). Each sets family, size, line-height, weight and tracking together, so no component composes raw sizes.
- **Icons self-hosted** (`material-symbols` package, Rounded variable font) behind one `Icon` component (ADR-007).
- **`/design-system` lives at `src/app/(dev)/design-system`**, `noindex`, composed from `src/features/design-system` (D9).

## Dependency graph

```
tokens.css + meta ──► globals.css theme mapping ──► fonts + Icon
        │                                              │
        └──► deriveAccentVars ─► TenantThemeProvider    │
                     theme mode (no-flash) ─────────────┤
                                                        ▼
        Button/IconButton ─► StatusBadge ─► ListRow/HeroStat/PersonRow ─► CoverageBar
        Tabs/ChipGroup ─► TextField/SystemBanner ─► Cards ─► TabBar ─► Sheets
                                                        │
                                                        ▼
                         /design-system sections 01–04 ─► section 05–06
                                                        │
                                                        ▼
                         pixel harness ─► a11y + perf + size + DESIGN_INTAKE
```

## Task list

See [todo.md](todo.md) for acceptance criteria per task.

- Foundation: Tasks 1–5 → Checkpoint A
- Components: Tasks 6–14 → Checkpoint B
- Showcase and verification: Tasks 15–18 → Checkpoint C (owner review)

## Risks and mitigations

| Risk                                                                                    | Impact                                             | Mitigation                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--accent` / `--card` name collision with shadcn                                        | High: vendor hover states would turn gold or glass | Task 2 ADR-006 + per-primitive audit at install; visual check in Task 17                                                                                       |
| Material Symbols variable font is large (multi-MB woff2)                                | Med: LCP, bundle/offline size                      | Task 3 measures it; if it is over budget, subset to the glyphs used (generated list) and record the reason. `font-display: block` avoids showing ligature text |
| Pixel diffs from the font substitution (Geist → Onest/Bricolage) mask real layout diffs | Med                                                | Compare component boxes (bounding-rect sizes, radii, colors via computed style) as well as screenshots; overlay report reviewed by eye                         |
| Base UI primitives differ from Radix docs                                               | Low                                                | shadcn skill `base-vs-radix` rules; `render` prop                                                                                                              |
| Vitest worker start-up timeout on Windows                                               | Low                                                | Rerun once (CONSTRAINTS.md known issue)                                                                                                                        |
| Bundle ratchet will fail as fonts/components land                                       | Certain                                            | Task 18 updates the ratchet with a recorded reason (owner-visible bar change)                                                                                  |

## Open questions

None blocking. D7–D9 answered 2026-10-22.
