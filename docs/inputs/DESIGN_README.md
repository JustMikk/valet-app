# Handoff: Valet Workforce PWA (Regency Valet Parking tenant) — MVP

## Overview
A mobile-first, installable web app (PWA) for a valet company's workforce. Two roles are designed:
- **Staff** (valet attendants): onboarding, home/next shift, geofenced clock-in with selfie, shifts, open-shift claiming, inbox, notifications, profile.
- **Admin / Dispatch**: Live Board (real-time coverage), events + crew roster, new event, staff, venues + geofence, hours review, invoices, inbox + announcements, settings.

Product behavior and business rules are in `product-spec.md` (the original PRD). This README covers the visual/interaction layer. **REM Ops (platform operator) role is not designed yet.**

## About the Design Files
Files in `designs/` are **design references built in HTML** — prototypes showing intended look and behavior, **not production code**. Recreate them in the target codebase's environment (React is the assumed stack; use its established patterns, router, state and component libraries). If no codebase exists yet, a React + TypeScript PWA (Vite, React Router, a CSS-variables theme) is the recommended starting point.

How to open: open any `*.dc.html` directly in a browser (they load `support.js` and Google Fonts). `Valet Build.dc.html` is the overview canvas — pick a group from the top bar to see every page at phone / tablet / desktop in light and dark. `Staff PWA.dc.html` and `Admin.dc.html` are the full interactive apps and are responsive to the window width.

Reading the source: each file is a template (HTML with `{{ value }}` holes, `<sc-for>` loops, `<sc-if>` conditionals, `<dc-import>` child components) plus a `class Component` whose `renderVals()` holds all data, state and computed styles. Treat the class as the spec for state and logic.

## Fidelity
**High-fidelity.** Final colors, type, spacing, radii, motion and copy. Recreate pixel-accurately. Mock data (names, venues, times) is illustrative.

## Design Tokens
Defined as CSS custom properties on the app root (`Staff PWA` / `Admin` → `LIGHT`, `DARK`, `fx`). Use these exact names.

### Color — light
| token | hex | use |
|---|---|---|
| --bg | #FFFFFF | page |
| --surface | #F4F4F2 | inputs, secondary buttons, list fills |
| --surface-2 | #E9E9E6 | avatars, tracks, neutral chips |
| --elev | #FFFFFF | raised items on surface |
| --fg | #0B0B0B | text, strong buttons |
| --fg-2 | #5E5E5B | secondary text |
| --fg-3 | #8E8E8A | tertiary / disabled text |
| --line | #E6E6E3 | dividers |
| --accent | #C9A24A | tenant accent (gold from logo) — primary actions only |
| --accent-ink | #1C1404 | text on accent (auto-switches to #FFFFFF for dark accents, luminance < .55) |
| --accent-soft | #F7EFDA | selected chips/options |
| --accent-text | #7F611A | accent-colored text |
| --ok / --ok-soft | #2A7F36 / #E5F3E1 | on site, verified, approved |
| --warn / --warn-soft | #B9480E / #FCEDE2 | needs attention, outside fence, short |
| --bad / --bad-soft | #C02A20 / #FBE7E5 | late, destructive |
| --info / --info-soft | #1E5BC6 / #E6EDFA | pending, invited |

### Color — dark
bg #0A0A0B · surface #18181A · surface-2 #252528 · elev #1E1E21 · fg #F4F4F2 · fg-2 #A6A6A1 · fg-3 #76766F · line #2B2B2E · accent #D9B661 · accent-ink #1C1404 · accent-soft #2B2415 · accent-text #E6C77E · ok #62C46F / #14261A · warn #FF8F57 / #2E1B11 · bad #FF6E63 / #311715 · info #82AEFF / #14203A

Rule: the accent is tenant-swappable (Settings offers #C9A24A, #8E1B2A, #1F3A5F, #2F5D46). Status colors never change with the tenant.

### Glass + elevation
| token | light | dark |
|---|---|---|
| --chrome (floating bars/buttons) | rgba(255,255,255,.62) | rgba(34,34,38,.55) |
| --card (glass cards) | rgba(255,255,255,.58) | rgba(40,40,44,.5) |
| --sheet (bottom sheets/dialogs) | rgba(255,255,255,.8–.82) | rgba(30,30,34,.8–.82) |
| --blur | blur(22px) saturate(180%) | same |
| --blur-lg | blur(36px) saturate(180%) | same |
| --shadow | 0 10px 30px rgba(0,0,0,.08), inset 0 0 0 1px rgba(255,255,255,.75) | 0 10px 30px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.09) |
| --card-line | inset 0 0 0 1px rgba(0,0,0,.05), 0 4px 18px rgba(0,0,0,.05) | inset 0 0 0 1px rgba(255,255,255,.07) |
| --ambient (page bg glow) | radial accent glows at top-right (α .30–.34) and left (α .12–.16) | α .26–.30 / .12 |

Glass is only for floating chrome (top pill, tab bar, sidebar), cards, sheets and dialogs — never body text areas.

### Typography
- Display `--fd`: **Bricolage Grotesque** (500–800), tight tracking.
- UI/body `--ff`: **Onest** (400–700).
- Numbers/codes: **Geist Mono** 500/600, `font-variant-numeric: tabular-nums` for clocks/durations/amounts.
- Icons: **Material Symbols Rounded**, FILL 1 for most glyphs, 20–28px.

| role | spec |
|---|---|
| Hero number (clock, time) | 700 52–60px/1 Bricolage, -0.045em |
| Page title | 700 40px/1 Bricolage, -0.035em |
| Screen headline | 700 32–44px/1.05 Bricolage, -0.03 to -0.04em |
| Card / section title | 600 20–26px/1.15–1.2 Bricolage, -0.015 to -0.02em |
| Body large | 400 17px/1.45 Onest |
| Body | 400 15–16px/1.4 Onest |
| Label / button | 600 15–19px Onest |
| Caption / overline | 600 12–13px Onest, +0.04–0.06em, uppercase |
Minimum text 12px; on-phone body never below 15px.

### Spacing, radius, sizing
- Page padding: phone 20px sides, top = safe-area + 82px (clears floating top bar), bottom 140–200px (clears tab bar/dock). Tablet 32px; desktop 40–48px.
- Content max-width: staff 1120px, admin 1160px, forms 520–600px, chat 760px; centered.
- Gaps: 4/6/8/10/12/14/16/20/22/24/28/32px.
- Radii: pill 999px (all buttons, chips, bars); cards 22–24px; hero cards 28px; sheets 30px top corners; dialogs 28–32px; inputs 16px; small tiles 14–16px.
- Hit targets: ≥44px; primary buttons 56–60px tall; list rows 56–72px min height.

### Motion
| name | spec |
|---|---|
| rise (list/card entry) | translateY(14px)→0 + fade, .55s cubic-bezier(.2,.8,.2,1), stagger 50–60ms |
| screen enter | fade + scale 1.015→1, .38s same easing |
| sheet up | translateY(40px)→0, .32s cubic-bezier(.2,.9,.3,1) |
| success pop | scale .4→1.08→1, .5s cubic-bezier(.2,.9,.3,1.3) + ring burst |
| CTA shine | diagonal white sweep across primary CTA, 3.6s loop, 1s delay |
| press | scale(.94–.98) on :active, .16s |
| toggles | knob left .22s cubic-bezier(.3,.7,.4,1.3) |
| locating pulse | 3 rings scale .35→1, 2.4s staggered .8s |
Respect `prefers-reduced-motion`: drop loops (shine, pulse), keep fades.

## Screens, Interactions, State, Assets, Files
See **`SCREENS.md`** in this folder — per-screen layout, components, copy, flows, error/empty states, responsive behavior and state model.
