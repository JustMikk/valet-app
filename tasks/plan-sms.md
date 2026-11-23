# Implementation Plan: SMS for invites and shift changes, shift reminders, publishing drafts

Spec: [docs/specs/sms.md](../docs/specs/sms.md) (approved 2026-11-23). Tasks: [tasks/todo-sms.md](todo-sms.md).

## Overview

Build the SMS core first: phone formatting, configuration, the Twilio client, copy, logging and the status callback. Nothing calls it yet. Then wire each sender:

- invites;
- the four shift-change triggers;
- the new reminder sweep;
- the new Publish action for drafts.

Finish with what admins and valets see, then the docs and the owner's Twilio setup guide. Every task leaves `pnpm check:fast` green and is committed on its own. `pnpm check:task` runs at each checkpoint. The static export must keep building with no `/api` routes.

## Architecture decisions

- **One entry point per direction.** `textStaff(kind, items)` and `textInvite(...)` in `src/server/sms/index.ts`. Services call it right after the existing `notifyStaff`. `notifyStaff` itself stays SMS-free: the text kinds are a short fixed list, not "every notification", so the trigger sites opt in explicitly. A grep for `textStaff` then shows exactly what texts.
- **Pure core, thin shell.**
  - `contact.e164`, `sms/copy.ts`, `sms/policy.ts` (who can be texted, why not) and the reminder window maths (`lib/time`) are pure and unit-tested.
  - `twilio.ts` is `fetch` plus Zod parsing, tested with a stubbed `fetch`.
  - Database writes sit in `index.ts` and `reminders.ts`.
- **Log first, then send.** Each text is inserted into `sms_messages` as `pending` before the Twilio call, then updated with the SID or the error. A crash mid-send leaves a visible row, not a silent gap.
- **Idempotency in SQL, not in memory.**
  - Reminders claim their send with `insert … on conflict do nothing returning`, so only the run that inserts the row sends.
  - `shift_reminders` is keyed on `(assignment_id, offset, starts_at)`, so a reschedule re-arms both reminders.
  - Other kinds dedupe on `dedupe_key` (kind, staff, assignment) inside a 10-minute window, in the insert statement.
- **Best effort with a time cap.** A batch of texts runs with `Promise.allSettled` under the same 3 s budget as push. Twilio's own queue paces delivery. A failure is logged and never thrown to the caller.
- **Configuration gates everything.** `smsConfig()` returns null unless all the required variables and one sender are present. Callers don't check; the module no-ops and logs `skipped: not configured`.
- **Reminder scheduler.** `/api/cron/reminders` is called by an outside cron service every 5 minutes. It is guarded by the same `CRON_SECRET` Bearer check as retention. A throttled side-effect run (at most once a minute, process-local timestamp) from the Live Board load and clock requests is the backstop.
- **Publish is a state change plus announcements.** `publishEvent` uses a conditional `update … where status = 'draft' returning`, so a second publish is a clean conflict. It reuses the existing assigned notice and `broadcastOpen`, then texts the assigned valets.

## Dependency graph

```text
T1 e164 ─┐
T2 config┼─► T3 twilio ─┐
         │   T4 copy ───┼─► T5 migration + textStaff/textInvite ─► T6 status callback
         │              │                        │
         │              │      ┌─────────────────┼──────────────────┬──────────────┐
         │              │      ▼                 ▼                  ▼              ▼
         │              │  T7 invites   T8 shift-change texts  T9 reminders  T10 publish (server)
         │              │                                                         │
         │              │                                                      T11 publish (UI)
         └──────────────┴─► T12 admin visibility (fact row, settings) ─► T13 copy ─► T14 docs + guide
```

T7–T10 depend only on T5 and are independent of each other.

## Phases and checkpoints

### Phase A: SMS core (T1–T6)

Nothing sends yet, except through tests.

**Checkpoint A:**

- `pnpm check:task` passes.
- `pnpm test -- src/server/sms src/lib/contact` passes.
- `pnpm build:server` lists `/api/sms/status`.
- The migration applies on Neon: `pnpm db:migrate` against the dev branch.

### Phase B: senders (T7–T11)

**Checkpoint B:**

- `pnpm check:task` passes.
- The reminder tests pass.
- Server build smoke test with SMS **not** configured: invite, assign, reschedule, remove, cancel and publish all still work, with `sms_messages` rows marked `skipped: not configured`.

### Phase C: visibility, copy, docs (T12–T14)

**Checkpoint C (done):**

- `pnpm check:task` passes, and the spec's success criteria 1–9 are walked through.
- The owner follows `docs/guides/twilio-setup.md`, sets the variables, and runs the end-to-end texts to their own phone. That run is done together, after the code is merged.

## Risks and mitigations

| Risk                                                                  | Mitigation                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate texts (double click, concurrent cron and side-effect sweep) | SQL-level claims: the reminders unique key, and the `dedupe_key` window in the insert. Concurrency is tested in `reminders.test.ts` with two sweeps.                                        |
| A Twilio outage or slow API slowing admin actions                     | 3 s cap, `allSettled`; the send happens after the database write and the notification, never inside a transaction.                                                                          |
| A leaked credential sending paid texts                                | Environment-only variables, `pnpm secrets` in the hook, nothing in `NEXT_PUBLIC_*`. The guide recommends a restricted API key.                                                              |
| A forged status callback                                              | `X-Twilio-Signature` HMAC-SHA1 over the exact public URL plus sorted params, constant-time compare. The URL comes from `APP_URL`, not the request host, so a proxy can't break or spoof it. |
| Reminder times wrong across time zones or DST                         | Instants are compared in UTC (`starts_at - 24h`, `- 1h`); only the copy is venue-local. DST cases are in the tests.                                                                         |
| Cron not set up yet                                                   | The traffic backstop still sends, late at quiet times. The guide makes the cron job a required step.                                                                                        |
| `.env.example` is deleted in the working tree                         | Not touched by this plan until the owner says whether the deletion is intended (T14).                                                                                                       |
| Assigned-to-draft people from before this change                      | Publishing tells everyone assigned at that moment, so existing drafts are covered the first time they are published.                                                                        |

## Verification per task

- `pnpm check:fast`.
- The task's own tests (`pnpm test -- <paths>`).
- For API tasks, `pnpm build:server`.
- The spec's success criteria are mapped to tasks in `todo-sms.md`.
