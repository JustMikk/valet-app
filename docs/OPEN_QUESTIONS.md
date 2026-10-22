# Open Questions

Status: `open` · `answered` · `resolved-default` (a working default is in place, owner can override).
Owner for all items: product owner (Mikiyas) unless noted. Dates are when the item was logged.

## Build handoff §11 — owner decisions

| #   | Question                                                 | Status   | Logged     | Notes                                                                   |
| --- | -------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------- |
| H1  | Backend stack, API contract and auth provider            | open     | 2026-10-22 | Building against `lib/data` interfaces + mock layer until decided       |
| H2  | Realtime transport (SSE / WebSocket / managed)           | open     | 2026-10-22 | `RealtimeClient` interface + mock emitter until decided                 |
| H3  | Staff sign-in method without SMS                         | open     | 2026-10-22 | Same as Product spec §13.1; blocks slice 1                              |
| H4  | Map and geocoding provider (+ licensing/storage terms)   | open     | 2026-10-22 | Blocks venue pin/fence UI (slice 2)                                     |
| H5  | Dynamic-route strategy under static export               | open     | 2026-10-22 | Proposal to come as an ADR in Phase 2                                   |
| H6  | Aceternity licensing — any Pro blocks licensed?          | open     | 2026-10-22 | Free components only until answered                                     |
| H7  | Install the Chrome DevTools MCP for browser verification | open     | 2026-10-22 | Playwright screenshots used meanwhile                                   |
| H8  | Performance budgets and `/constraints` thresholds        | answered | 2026-10-22 | CONSTRAINTS.md (ADR-005); per-route-group bundle budgets due in Phase 2 |

## Product spec §13 — open product decisions (do not resolve silently)

| #   | Question                                                                              | Status | Logged     |
| --- | ------------------------------------------------------------------------------------- | ------ | ---------- |
| P1  | Staff sign-in method (magic link / code vs password vs both)                          | open   | 2026-10-22 |
| P2  | Staff see own pay rate? Co-workers visible to each other?                             | open   | 2026-10-22 |
| P3  | Billing rules: minimum hours per worker vs per event; early-arrival minutes; rounding | open   | 2026-10-22 |
| P4  | GPS accuracy threshold; default geofence radius validation with real venues           | open   | 2026-10-22 |
| P5  | Mark no-show and slot reopening when the event is already live                        | open   | 2026-10-22 |
| P6  | Worker-entered corrections: note-only vs request-a-correction flow                    | open   | 2026-10-22 |
| P7  | Invoice void/reissue and partial payments                                             | open   | 2026-10-22 |
| P8  | Email as a safety net for critical notifications                                      | open   | 2026-10-22 |
| P9  | Retention policy for selfies and location samples                                     | open   | 2026-10-22 |
| P10 | W-2 vs 1099 for the first client                                                      | open   | 2026-10-22 |
| P11 | Bulk staff import at launch                                                           | open   | 2026-10-22 |
| P12 | Languages staff need                                                                  | open   | 2026-10-22 |
| P13 | Request-approval path (§8.5) in MVP?                                                  | open   | 2026-10-22 |

## Design intake conflicts

| #   | Question                                                                                                                                                              | Status           | Logged     | Resolution                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `Design System.dc.html` v0.1 uses Geist + solid pills; app screens use Bricolage Grotesque / Onest + glass chrome                                                     | answered         | 2026-10-22 | App screens + design README win; the Design System sheet supplies inventory and component specs                                        |
| D2  | Build handoff refers to `Valet_Workforce_PWA_MVP_Design_Handoff.md`; the file provided is `product-spec.md`                                                           | resolved-default | 2026-10-22 | Treating `product-spec.md` as the Product Handoff                                                                                      |
| D3  | Accent swatch #4: `#2F6B4F` (Design System) vs `#2F5D46` (design README)                                                                                              | resolved-default | 2026-10-22 | `#2F5D46`: the app screens' Settings uses it (D1 rule)                                                                                 |
| D4  | Sheet radius 28 (Design System) vs 30 (design README); chip radius 10 vs pill                                                                                         | resolved-default | 2026-10-22 | Per component, following the app screens                                                                                               |
| D5  | REM Ops (platform admin) role has no designs                                                                                                                          | open             | 2026-10-22 | Needed before slice 10                                                                                                                 |
| D6  | Design README recommends Vite + React Router; build handoff mandates Next.js                                                                                          | answered         | 2026-10-22 | Next.js per build handoff (ADR-001)                                                                                                    |
| D7  | Tenant accent changes recompute only `--accent-ink`; `--accent-soft`/`--accent-text` stay gold                                                                        | answered         | 2026-10-22 | Proposal in docs/specs/phase-1-design-system.md (color-mix derivation)                                                                 |
| D8  | Dark-mode tenant accent: only default gold has a dark variant                                                                                                         | answered         | 2026-10-22 | Default: same hex both modes + ink contrast check                                                                                      |
| D9  | Ship `/design-system` in production builds?                                                                                                                           | answered         | 2026-10-22 | Default: ship, `noindex`, unlinked                                                                                                     |
| D10 | Staff Home promo card hard-codes `#0E0F12` and a gold glow; tokens define `--hero` dark = `#1E1E21` and the glow should follow the tenant accent                      | resolved-default | 2026-10-22 | Token `--hero` per theme; glow from `--accent-rgb` at the app screen alpha (.42)                                                       |
| D11 | Exported `--fg-3` (3.28:1 light, 4.32:1 dark) and `--ok` on `--ok-soft` (4.35:1) fail WCAG AA text contrast                                                           | resolved-default | 2026-10-22 | Accessible text values, exported value kept for graphics as `--fg-3-line` (ADR-009). Owner to confirm or supply design-approved values |
| D12 | `/design-system` (dev reference, noindex) exceeds the Lighthouse budget (LCP 4–5 s): it renders every component twice in client code                                  | resolved-default | 2026-10-22 | Dev routes axe-checked but outside the performance budget (ADR-009). Owner to confirm                                                  |
| D13 | Tenant accent swatches had only hex values as accessible names; I proposed spoken names (Regency gold, Burgundy, Navy, Forest green)                                  | resolved-default | 2026-10-22 | Labels are my wording, not from the design; owner to confirm or replace                                                                |
| D14 | Phone bottom sheets had no non-gesture way to close; added a "Close" control that stays visually hidden until keyboard focus (off for ConfirmSheet, which has Cancel) | resolved-default | 2026-10-22 | Keeps the exported look; owner to confirm or ask for a visible close button                                                            |
| D15 | Admin phone Inbox: opening a thread has no way back to the list in the design (the top-bar Back leaves the page)                                                      | resolved-default | 2026-10-23 | Added an "All messages" back button in the thread header on phone only; owner to confirm                                               |
| D16 | Admin "Adjust" in Hours shows one example (Sam Rivera's auto-closed entry)                                                                                            | resolved-default | 2026-10-23 | The sheet opens for any entry with that entry's own times; only the auto-closed one has a proposed correction                          |
| D17 | Admin cancel event / deactivate person have no confirmation in the design                                                                                             | resolved-default | 2026-10-23 | Added a ConfirmSheet that states the consequence (rule: consequence in words); owner to confirm                                        |
| D18 | Admin table rows on phone: the design's invoice rows drop the amount under the name (3 cells in a 2-column grid)                                                      | resolved-default | 2026-10-23 | Replicated as exported; owner to confirm this is intended                                                                              |
