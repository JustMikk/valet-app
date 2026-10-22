# Design Intake

Handoff §4. Living inventory of the design export, the tokens and components built from it, gaps and conflicts. Updated per slice. Visual source of truth: the app screens + DESIGN_README; `Design System.dc.html` supplies inventory and component specs (OPEN_QUESTIONS D1).

## Tokens (Phase 1)

| Group            | Where                                             | Notes                                                                                                                                                                     |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color            | `src/styles/tokens.css`, `src/lib/tokens/meta.ts` | 21 exported tokens × light/dark, scoped by `[data-theme]`. Accessible deviations: `--fg-3` text, `--ok` light (D11); exported `--fg-3` kept as `--fg-3-line` for graphics |
| Tenant accent    | `src/lib/tenant`                                  | `--accent`, `-rgb`, `-ink`, `-soft`, `-text` derived per tenant (D7, D8); injected by `TenantTheme`                                                                       |
| Glass, elevation | `tokens.css`; `glass*` utilities in `globals.css` | Staff and admin flavours via `[data-app]` (sheet α, card line, ambient glow); `--shadow`, `--card-line`, `--sheet-shadow`, `--dialog-shadow`                              |
| Type             | `globals.css` `@theme`                            | Bricolage Grotesque / Onest / Geist Mono; px-named sizes (`text-11`…`text-72`, line-height normal by default), `leading-x090`…`x155`, `tracking-n050`…`p060`              |
| Radius, spacing  | `globals.css` `@theme`                            | px-named radii (`rounded-r3`…`r32`) + semantic (`chip`, `tile`, `field`, `card`, `hero`, `dialog`, `sheet`, `pill`); Tailwind 4 px spacing scale                          |
| Motion           | `tokens.css`, `globals.css`                       | rise, screen, sheet-up, fade, pop, shine, pulse-ring; loops dropped under `prefers-reduced-motion`                                                                        |
| Icons            | `src/lib/icons/icon-names.ts`, `src/fonts/`       | Material Symbols Rounded subset (ADR-007)                                                                                                                                 |

## Component sourcing (§8.2)

| Component                                                   | Source                                   | Notes                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button (`ui/button`)                                        | shadcn `button`                          | Variants and sizes replaced with the design system (vendor theming edit, ADR-006)                                           |
| ActionButton                                                | custom on shadcn `button`                | Icon slots, CTA shine, disabled reason                                                                                      |
| IconButton                                                  | custom on Base UI `Button`               | Glass / surface circles; required label; badge                                                                              |
| GlassPill, GlassCard                                        | custom                                   | Glass utilities                                                                                                             |
| StatusBadge (`ui/badge`)                                    | shadcn `badge`                           | Variants replaced with status tones; presets in `src/lib/status`                                                            |
| HeroStat, ListRow, PersonRow                                | custom                                   | ListRow renders as any element via Base UI `useRender`                                                                      |
| PersonAvatar (`ui/avatar`)                                  | shadcn `avatar`                          | Only the `cn` import changed                                                                                                |
| CoverageBar                                                 | custom                                   | No registry equivalent (segmented headcount bar)                                                                            |
| UnderlineTabs                                               | Base UI `Tabs` (shadcn `tabs` evaluated) | shadcn's line variant draws a 2 px pseudo indicator with dark overrides that conflict with the 3 px underline; file removed |
| ChipGroup (`ui/toggle`, `toggle-group`)                     | shadcn `toggle-group`                    | `toggle` variants replaced with the design chip                                                                             |
| TextField (`ui/field`, `input`, `textarea`)                 | shadcn `field`, `input`, `textarea`      | Input and textarea restyled; field styled through `className`                                                               |
| SystemBanner, AttentionCard, FeatureCard, PagerDots, TabBar | custom                                   | No registry equivalents in this visual form                                                                                 |
| ResponsiveSheet, ConfirmSheet (`ui/drawer`, `ui/dialog`)    | shadcn `drawer`, `dialog`                | Overlays use the design scrim; dialog's built-in close buttons removed                                                      |
| Aceternity                                                  | none                                     | Nothing in Phase 1 calls for a distinctive effect                                                                           |

## Gaps (states the design does not show)

| Gap               | Handling                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| Field error state | `bad` tokens: 1.5 px `--bad` inset, 13 px `--bad` message, `role="alert"`       |
| Focus indicator   | Global 2 px `--fg` outline (`:focus-visible`); inputs use the design's fg inset |
| Disabled chip     | 50% opacity, not-allowed cursor                                                 |

## Conflicts

See OPEN_QUESTIONS D1–D12. Resolved by default: D1 (app screens win), D3 (`#2F5D46`), D4 (radii per component), D10 (hero token), D11 (contrast), D12 (dev routes outside perf budget). Pixel deltas from D1 are listed in `docs/reports/phase-1-pixel-report.md`.
