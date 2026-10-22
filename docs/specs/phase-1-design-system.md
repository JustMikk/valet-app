# Spec: Phase 1 — Design System

Status: **approved 2026-10-22** (D7 proposal, D8 and D9 defaults accepted) · 2026-10-22 · Plan reference: Phase 1 of the approved build plan

## Objective

Turn the visual language of the design export into a reusable, token-driven component layer that every later slice builds on, and prove it with a `/design-system` page that recreates `Design System.dc.html` pixel-accurately.

- **Users of this phase:** the engineers and agents building slices 1–10. End users see these components indirectly on every screen.
- **Source of truth:** the app screens (`Staff PWA`, `Admin`, `Admin Pages`, `Live Board`, `Staff *`) and `DESIGN_README.md` for tokens, fonts and elevation; `Design System.dc.html` for the component inventory, the specs of each component and the showcase layout (OPEN_QUESTIONS D1).
- **Success looks like:** a later slice can build a screen using only tokens and components from this phase, with no hex values, raw font sizes or one-off styles.

## Assumptions (correct any now)

1. **Light and dark are both built.** The export defines both (handoff §4.4).
2. **Tenant input is one accent hex plus logo and name.** The default Regency gold uses `#C9A24A` in light and `#D9B661` in dark; any other tenant accent uses the same hex in both modes, as the app screens do.
3. **Two shell flavours of the glass tokens.** Staff and admin differ slightly: sheet α .80 vs .82, the light `--card-line` edge, and the ambient glow (3 glows at α .34/.16/.12 vs 2 at .30/.12). Tokens are scoped by `data-app="staff" | "admin"`; staff is the default.
4. **`/design-system` is a development reference.** It ships in the static export, excluded from search engines (`noindex`) and from any app navigation.
5. **Accent swatches** for tenant settings are `#C9A24A`, `#8E1B2A`, `#1F3A5F`, `#2F5D46`. The app screens' Settings value settles D3.
6. **Breakpoints:** phone < 700 px, tablet 700–1099 px, desktop ≥ 1100 px (SCREENS.md). The sheet's ≥ 768 and ≥ 1200 mentions are superseded.
7. **Icons:** Material Symbols Rounded, self-hosted so they work offline. No lucide icons in product UI, even though `shadcn init` set lucide as the default icon library.

## Scope

**In scope**

- Design tokens:
  - color, light and dark
  - glass and elevation
  - radius, spacing, type scale, motion
- Tenant accent derivation and injection.
- Theme switching (light / dark / system) with no flash of the wrong theme.
- Fonts: Bricolage Grotesque, Onest, Geist Mono, Material Symbols Rounded.
- The component set below.
- The `/design-system` showcase with sections 01–06, light and dark side by side, and an accent switcher.
- Tests and pixel checks.
- `docs/DESIGN_INTAKE.md`: token inventory plus the sourcing table for these components.

**Out of scope** (later phases)

- App shells: top bar, tab bar, rail and sidebar placement, routing (Phase 2).
- Feature screens and any data.
- PWA manifest, service worker, provider interfaces.

## Components

The sheet's "05" section plus the primitives the app screens repeat. Each component's source is recorded in DESIGN_INTAKE.

| Component                         | Source                              | Notes (spec from sheet + app screens)                                                                                                                                                                                                                                                             |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon`                            | custom                              | Material Symbols wrapper: `name`, `filled`, `weight`, `size`; decorative by default (`aria-hidden`), labelled when standalone                                                                                                                                                                     |
| `Button`                          | shadcn `button` (variants replaced) | Variants: `accent`, `strong`, `secondary`, `ghost`, `destructive`, `destructive-soft`. Sizes: lg 56, md 48, sm 40 (+ 44 compact for card actions). Pill radius. Icon slot. `shine` on accent CTA. Disabled = surface fill + fg-3 label; an optional `reason` line below. Press scale on `:active` |
| `IconButton`, `GlassPill`         | custom on `Button`                  | 56 px glass (`--chrome` + `--blur` + `--shadow`); optional dot badge                                                                                                                                                                                                                              |
| `HeroStat`                        | custom                              | Display number (tabular) + delta line (icon, tone word, muted context)                                                                                                                                                                                                                            |
| `UnderlineTabs`                   | shadcn `tabs` (variant)             | 19 px labels, 3 px fg indicator, hairline base                                                                                                                                                                                                                                                    |
| `ChipGroup` / `FilterChip`        | shadcn `toggle-group`               | 40 px, radius 10, selected = accent-soft + 1.5 px accent inset; trailing icon action                                                                                                                                                                                                              |
| `ListRow`                         | custom                              | ≥ 64 px, hairlines, label / value / trailing action + chevron                                                                                                                                                                                                                                     |
| `StatusBadge` + presets           | shadcn `badge` (variants replaced)  | 30 px pill, always icon + words. Tones: ok, warn, neutral, strong, info, outline, muted, bad, bad-solid. Presets for the 12 slot/health states on the sheet                                                                                                                                       |
| `CoverageBar` + legend            | custom                              | Segments on-site / late / expected / open; open hatched and outlined; accessible text summary                                                                                                                                                                                                     |
| `Avatar`, `PersonRow`             | shadcn `avatar`                     | 44 px initials; dashed open-slot variant; 72 px row with evidence line + trailing badge or action                                                                                                                                                                                                 |
| `AttentionCard`                   | custom (shadcn `card` evaluated)    | Tone icon circle, title, meta line, up to 3 actions                                                                                                                                                                                                                                               |
| `FeatureCard`, `PagerDots`        | custom                              | `--hero` ground + accent radial glow, dismissible                                                                                                                                                                                                                                                 |
| `TextField`                       | shadcn `field` + `input`            | 56 px, radius 16, surface fill, 1.5 px fg focus inset, accent caret, label / helper / error                                                                                                                                                                                                       |
| `SystemBanner`                    | custom                              | Pill banner, warn / neutral, icon + text                                                                                                                                                                                                                                                          |
| `TabBar`                          | custom                              | Floating glass, 76 px (app screens; sheet shows 80), active = surface pill, count badge                                                                                                                                                                                                           |
| `ResponsiveSheet`, `ConfirmSheet` | shadcn `drawer` + `dialog`          | Phone: bottom sheet (radius 30 top, grabber, sheet-up). ≥ 700: centered dialog 440–480 px, radius 28, `rgba(0,0,0,.4)` scrim. Consequence in words                                                                                                                                                |
| `GlassCard`                       | custom                              | `--card` + `--blur` + `--card-line`                                                                                                                                                                                                                                                               |

Aceternity: nothing in the Design System calls for a distinctive effect, so none is used in this phase.

## Tech stack

Next.js 16.4 (static export), React 19.3, Tailwind 4.3 (`@theme inline`), shadcn `base-nova` on Base UI 1.9, `class-variance-authority`, `cn`. Fonts via `next/font/google`. Icons via the `material-symbols` npm package. That package is a new dependency and gets an ADR.

## Commands

```
Dev:        pnpm dev                      → http://localhost:3000/design-system
Edit loop:  pnpm check:fast
Task end:   pnpm check:task               (unit tests + coverage + boundaries)
Full:       pnpm check:full               (build, Lighthouse, size, osv, e2e incl. axe)
Pixel:      pnpm exec playwright test e2e/design-system.visual.spec.ts
Add vendor: pnpm dlx shadcn@latest add <item>
```

## Project structure

```
src/styles/tokens.css            color, glass, radius, motion tokens ([data-theme], [data-app])
src/app/globals.css              Tailwind + @theme inline mapping + shadcn variable mapping + @utility type scale
src/app/layout.tsx               fonts, theme no-flash script, TenantThemeProvider
src/lib/tenant/                  deriveAccentVars, tenant types, TenantThemeProvider
src/lib/theme/                   theme preference (light/dark/system), no-flash script
src/lib/status/                  status presets (state → tone, icon, label)
src/components/ui/               shadcn vendor primitives (button, badge, tabs, toggle-group, input, field, avatar, drawer, dialog…)
src/components/shared/           Icon, IconButton, GlassPill, HeroStat, UnderlineTabs, ChipGroup, ListRow, StatusBadge,
                                 CoverageBar, PersonRow, AttentionCard, FeatureCard, TextField, SystemBanner, TabBar,
                                 ResponsiveSheet, ConfirmSheet, GlassCard (+ index.ts)
src/features/design-system/      showcase sections (01–06) + tokens.meta.ts (+ index.ts)
src/app/(dev)/design-system/page.tsx   thin route
e2e/design-system.visual.spec.ts      pixel comparison against docs/inputs/designs/Design System.dc.html
```

## Code style

```tsx
const statusBadgeVariants = cva(
  "rounded-pill text-label-sm inline-flex h-7.5 items-center gap-1.25 pr-2.75 pl-2",
  {
    variants: {
      tone: {
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        outline: "text-fg-2 shadow-[inset_0_0_0_1.5px_var(--fg-3)]",
      },
    },
  },
)

export function StatusBadge({ tone, icon, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      <Icon name={icon} filled size={18} />
      {children}
    </span>
  )
}
```

- Variants via `cva`; conditional classes via `cn()`; token utilities only.
- Arbitrary values only when they reference a token (`var(--…)`).
- Named exports. Props typed explicitly; `className` passthrough on every component.
- `"use client"` only on interactive leaves (sheets, tabs, chip groups, theme controls).
- Base UI `render` prop for custom triggers (ADR-002).

## Testing strategy

- **Unit (Vitest):**
  - `deriveAccentVars`: luminance threshold, rgb triplet, soft/text derivation, invalid-hex rejection via Zod
  - status presets: every preset has an icon and a label
  - `tokens.meta.ts` ↔ `tokens.css` sync test
- **Component (RTL):**
  - Button: disabled state + reason is announced
  - StatusBadge: renders icon + text
  - CoverageBar: accessible summary text, open segment has a pattern
  - ChipGroup: single select, keyboard
  - TextField: label / helper / error wiring
  - ResponsiveSheet: title present, Esc closes, focus returns
- **E2E:**
  - axe on `/design-system`, both themes, all three viewports (CONSTRAINTS.md)
  - visual regression: section screenshots of `/design-system` committed as baselines
- **Pixel check vs design:** Playwright renders `Design System.dc.html` (with `support.js`) and `/design-system` at 1320 px, section by section. Size, spacing, radius and color must match. Glyph-width differences from the font substitution (Geist → Onest/Bricolage, decision D1) are expected and reviewed by eye in an overlay report.
- **Coverage:** ≥ 80% of changed lines (CONSTRAINTS.md).

## Boundaries

- **Always:**
  - tokens only
  - icon + words for status
  - `pnpm check:task` before each commit
  - record the component source in DESIGN_INTAKE
  - query the shadcn MCP before writing a component
- **Ask first:**
  - any new dependency beyond `material-symbols` and the shadcn-installed primitives
  - any Aceternity component
  - a token value that differs from the export
  - changing a breakpoint
- **Never:**
  - hard-coded hex or raw font sizes in components
  - editing vendor primitives beyond the documented variant swap
  - status shown by color alone
  - weakening CONSTRAINTS.md

## Success criteria

1. `/design-system` renders sections 01–06 at 1320 px. Each Section 05 component matches the design file in size, spacing, radius and color, in light and dark (pixel report attached).
2. Switching among the 4 accents recolors accent fills, accent-soft chips, accent text, the ambient glow and `--accent-ink`. Status colors do not change.
3. Theme toggle (light / dark / system) has no flash of the wrong theme on load of the static export.
4. Every component in the table exists in `src/components/shared` (or as a documented variant in `ui/`), is used on the showcase, and has a test where it carries logic or a11y wiring.
5. axe: zero critical/serious on `/design-system` in both themes at phone, tablet and desktop.
6. Lighthouse for `/design-system` is within the CONSTRAINTS.md budget. The bundle-size ratchet is updated with a recorded reason, because fonts and new components are expected to grow it.
7. `pnpm check:full` passes; `docs/DESIGN_INTAKE.md` lists every token and component with its source.

## Open questions

1. **Accent soft/text derivation (new, D7).** The app screens recompute only `--accent-ink` when the tenant accent changes; `--accent-soft` and `--accent-text` stay gold. Proposal: derive both with CSS `color-mix()`, tuned so gold reproduces the exported values within ΔE < 2, for example soft ≈ 15% accent on `--bg` and text ≈ accent mixed toward `--fg`. Approve, or keep the export's behaviour?
2. **Dark-mode tenant accent (new, D8).** Only the default gold has a dark variant (`#D9B661`). Should tenant settings accept an optional dark accent, or use the same hex in both modes as the screens do? Default: same hex, plus a contrast check on `--accent-ink`.
3. **`/design-system` in production builds (D9).** Ship it (`noindex`, unlinked) or exclude it from production builds? Default: ship.
