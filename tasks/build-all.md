# Build-all page list

The testing phase (CONSTRAINTS.md "Build mode", ADR-011) starts when every page below exists.

## Staff — done

Home, My shifts, Shift detail, Drop, Result, Open shifts, Inbox, Notifications, Profile, Clock-in flow (all steps), Onboarding (all steps).

## Admin — done

Live Board (phone/tablet and desktop), Events, Event, New event, Staff, Person, Venues, Venue, Hours, Invoices, Invoice, Inbox, Announcement, Settings.

## Not built

Platform admin (REM Ops): no designs yet (OPEN_QUESTIONS D5).

## First tasks of the testing phase

1. Restore the deferred gates in `check:task`.
2. Tests for the model code (`live-model.ts`, accent provider) and the shared components added since Phase 1 (PillTabs, ToastPill, AttentionCard variants).
3. axe and keyboard runs on every route; reduced-motion pass.
4. Visual baselines and pixel reports against `docs/inputs/designs/`.
5. Lighthouse and bundle budgets; then PWA/offline, platform providers and the real data layer.
