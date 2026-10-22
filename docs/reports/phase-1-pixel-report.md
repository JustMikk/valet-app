# Phase 1 — Pixel report: `/design-system` vs `Design System.dc.html`

Date: 2026-10-22 · Command: `pnpm exec playwright test e2e/design-system.visual.spec.ts --project=desktop`
Artifacts (regenerated on each run): `test-results/design-system-visual/` — `measurements.json` and `section-0N-design.png` / `section-0N-ours.png` side by side for sections 01–06.

## How it is measured

Both pages are rendered at 1320 px in Chromium. The export has no ids or roles, so elements are matched by their shared copy inside section 05's light panel (x 72–692 on both canvases). Boxes must match within **1 px**; the only allowed differences are listed below with their reason. A pure screenshot diff is not used against the export: the type substitution (Geist → Bricolage / Onest, decision D1) shifts every glyph, which would drown real layout differences.

## Component boxes (all pass)

| Component             | Dimension | Design | Ours | Δ                |
| --------------------- | --------- | ------ | ---- | ---------------- |
| Top-bar pill          | height    | 56     | 56   | 0                |
| Accent button         | height    | 56     | 56   | 0                |
| Accent button         | width     | 564    | 564  | 0                |
| Strong button         | height    | 56     | 56   | 0                |
| Strong button         | width     | 277    | 277  | 0                |
| Secondary button      | height    | 56     | 56   | 0                |
| Ghost button          | height    | 48     | 48   | 0                |
| Destructive button    | height    | 48     | 48   | 0                |
| Chip                  | height    | 40     | 40   | 0                |
| Badge (On site)       | height    | 30     | 30   | 0                |
| Badge (Open slot)     | height    | 30     | 30   | 0                |
| List row              | height    | 65     | 65   | 0                |
| Person row            | height    | 73     | 73   | 0                |
| Assign button         | height    | 40     | 40   | 0                |
| Attention-card action | height    | 44     | 44   | 0                |
| System banner         | height    | 44     | 44   | 0                |
| Tab bar               | height    | 80     | 76   | −4 (allowed, D1) |

Fixed while measuring: list and person rows were 1 px short. The export sets `min-height` with content-box sizing, so the 1 px hairline adds to 64 / 72; `ListRow` and `PersonRow` now use `box-content`.

## Documented differences (app screens win, D1)

| Where           | Sheet                                   | Built (source)                                                  |
| --------------- | --------------------------------------- | --------------------------------------------------------------- |
| All text        | Geist / Geist Mono                      | Bricolage Grotesque (display), Onest (UI), Geist Mono (numbers) |
| Floating chrome | Solid `--elev` + drop shadow            | Glass `--chrome` + blur + `--shadow` (Staff PWA, Admin shells)  |
| List row        | Label 18 px, action 16 px               | 17 px / 15 px (Staff Home, Staff Shifts)                        |
| Tab bar         | 80 px, padding 8, red count badge       | 76 px, padding 7, `fg` badge (Staff PWA shell)                  |
| Feature card    | Radius 22, glow α .38, title 21 px      | Radius 24, glow α .42, mono overline, title 22 px (Staff Home)  |
| Sheet           | Title 600 22 px, buttons 52 px / 16 px  | Bricolage 700 28 px, buttons 56 px / 17 px (Staff Home, Admin)  |
| Field           | Drawn permanently focused (caret, ring) | Resting state; focus ring appears on focus                      |
| Chip widths     | Geist label widths                      | Onest label widths (±2 px)                                      |

## Regression baselines

`e2e/design-system.visual.spec.ts-snapshots/section-0N-desktop-win32.png` (6 sections, `maxDiffPixelRatio` 0.002, per-pixel `threshold` 0.02 so a token color change is caught) guard `/design-system` against unintended visual change. They are Windows renders; CI on Linux skips `@visual` until Linux baselines are generated (Docker `mcr.microsoft.com/playwright` image or a CI artifact).
