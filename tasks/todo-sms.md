# Tasks: SMS, shift reminders, publishing drafts

Plan: [tasks/plan-sms.md](plan-sms.md) · Spec: [docs/specs/sms.md](../docs/specs/sms.md)
SC = the spec's success criteria.

## Phase A: SMS core

- [x] **T1: `e164()` from a phone key**
  - Acceptance: `e164("(713) 555-0120")` returns `"+17135550120"`; non-US or invalid input returns null; `isUsNumber()` covers this. Branded `E164` type.
  - Verify: `pnpm test -- src/lib/contact`
  - Files: `src/lib/contact/contact.ts`, `contact.test.ts`

- [x] **T2: SMS configuration**
  - Acceptance:
    - `env.ts` gains `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_FROM_NUMBER` and `APP_URL`, all optional.
    - `smsConfig()` returns null unless the account, key pair, token, `APP_URL` and one sender are set.
    - It builds `statusUrl = APP_URL + /api/sms/status`.
  - Verify: `pnpm test -- src/server/sms/config`; `pnpm check:fast`
  - Files: `src/server/env.ts`, `src/server/sms/config.ts`, `config.test.ts`

- [x] **T3: Twilio REST client**
  - Acceptance:
    - `sendSms(to, body)` posts form-encoded `To`, `Body` and `StatusCallback`, with `MessagingServiceSid` or `From`, Basic auth with the API key, and a 3 s timeout.
    - Responses are Zod-parsed into `{ok, sid, status}` or `{ok: false, code, message}`. 21610 is mapped to `optedOut`.
    - `validSignature(url, params, header)` implements Twilio's HMAC-SHA1 with a constant-time compare.
    - It never throws.
  - Verify: `pnpm test -- src/server/sms/twilio` (stubbed fetch; Twilio's documented signature example)
  - Files: `src/server/sms/twilio.ts`, `twilio.test.ts`

- [x] **T4: Message copy**
  - Acceptance:
    - Builders produce the seven approved texts (invite, reminder 24 h and 1 h, cancelled, assigned, rescheduled, removed).
    - The invite carries the STOP line.
    - Bodies are trimmed to keep 160 GSM-7 characters where possible, and the link is never cut.
  - Verify: `pnpm test -- src/server/sms/copy`
  - Files: `src/server/sms/copy.ts`, `copy.test.ts`

- [x] **T5: Log table and the send entry points**
  - Acceptance:
    - Migration `016_sms_and_reminders.sql` creates:
      - `sms_messages`: id, tenant_id, staff_id, kind, to_last4, dedupe_key, body_chars, twilio_sid, status, error_code, created_at, updated_at;
      - `shift_reminders`: assignment_id, offset, starts_at, with a unique key on all three.
    - `textStaff(kind, items)` and `textInvite(...)`:
      - skip with a reason (`not_configured`, `no_phone`, `not_us`, `duplicate`) via pure `policy.ts`;
      - insert `pending`, send, and update with the SID or error;
      - are best effort (`allSettled`, 3 s cap);
      - log only the last 4 digits.
  - Verify: `pnpm test -- src/server/sms`; `pnpm db:migrate` on the dev database
  - Files: `db/migrations/016_sms_and_reminders.sql`, `src/server/sms/policy.ts`, `policy.test.ts`, `src/server/sms/index.ts`

- [x] **T6: Status callback** (SC 6)
  - Acceptance:
    - `POST /api/sms/status` returns 403 without a valid `X-Twilio-Signature` computed over `APP_URL` plus the path.
    - A valid callback updates `status` and `error_code` by `MessageSid`.
    - 21610 marks the row as `opted_out`.
    - It returns an empty 204, so Twilio doesn't retry.
  - Verify: `pnpm test -- src/server/sms/status`; `pnpm build:server` lists the route
  - Files: `src/app/api/sms/status/route.api.ts`, `src/server/sms/status.ts`, `status.test.ts`

**Checkpoint A:** `pnpm check:task` · sms and contact tests · `pnpm build:server` · migration applied.

## Phase B: senders

- [x] **T7: Invite texts** (SC 1)
  - Acceptance:
    - `inviteStaff` texts each newly created phone invite: an `invite` text with `APP_URL/login?role=staff&login=+1…`.
    - `InviteResultDto` gains `texted: int` and `notTexted: {who, reason}[]`.
    - The invite sheet shows "Texted N invite(s)" and each failure with its reason.
    - The mock repo returns sample values.
  - Verify: `pnpm check:fast`; server smoke (SMS off gives `notTexted: not set up`)
  - Files: `src/server/admin/staff.ts`, `src/lib/data/admin/schemas.ts`, `src/lib/data/admin/mock-repo.ts`, `src/features/admin/staff/invite-sheet.tsx`

- [x] **T8: Shift-change texts** (SC 3)
  - Acceptance:
    - `cancelEvent` texts each assigned valet (`cancelled`).
    - `assign` texts when the event is not a draft (`assigned`).
    - `updateEvent` texts only when the window changed (`rescheduled`).
    - Live remove texts the removed valet (`removed`).
    - A name or instructions edit, a claim, or an assignment to a draft sends no text.
  - Verify: `pnpm check:fast`; server smoke for each action
  - Files: `src/server/admin/events.ts`, `src/server/admin/live.ts`

- [x] **T9: Shift reminders** (SC 2, 4)
  - Acceptance:
    - A pure `dueReminders(assignments, now)` in `lib/time` (or `src/server/reminders`) picks the 24 h and 1 h offsets, applies the late cut-offs (24 h until start − 1 h; 1 h until start), and skips the 24 h reminder for late assignments.
    - The sweep selects published, uncancelled, assigned shifts with `notify_remind` on. It claims each reminder via `shift_reminders` (`insert … on conflict do nothing returning`). Only the claimed rows get `notifyStaff` (a "Shift reminder" notice) and `textStaff('reminder')`.
    - `GET /api/cron/reminders` is guarded by `CRON_SECRET`.
    - A throttled backstop (at most once a minute) runs from the Live Board load and clock requests.
  - Verify: `pnpm test -- src/server/reminders` covering windows, DST, late assignment, cancelled events, `notify_remind` off, and two concurrent sweeps (one send); `pnpm build:server`
  - Files: `src/server/reminders.ts`, `reminders.test.ts`, `src/app/api/cron/reminders/route.api.ts`, `src/server/admin/live.ts`, `src/server/staff/clock.ts`

- [x] **T10: Publish a draft, server and API** (SC 9)
  - Acceptance:
    - `publishEvent(adminId, id, now)` sets `draft` to `published` conditionally. It returns 409 if not a draft and 400 if the draft has already ended.
    - It notifies and texts everyone assigned (`assigned`), and calls `broadcastOpen` when there are open spots.
    - Route `POST /api/admin/events/[id]/publish`.
    - `AdminRepo.publishEvent` exists in the interface and in the HTTP and mock repos.
    - The event detail DTO gains `draft: boolean` plus the assigned and open counts for the confirm text.
  - Verify: `pnpm check:fast`; `pnpm build:server`; server smoke (publish twice gives a 409)
  - Files: `src/server/admin/events.ts`, `src/app/api/admin/events/[id]/publish/route.api.ts`, `src/lib/data/admin/{repo,http-repo,mock-repo,schemas}.ts`

- [x] **T11: Publish a draft, UI** (SC 9)
  - Acceptance:
    - A draft's event page shows a **Publish event** accent button above Cancel event.
    - A `ConfirmSheet` reads "Publish {title}?" with the approved consequence line.
    - On success, the queries refresh: badge, Drafts tab, events list.
    - Errors (409, ended) show in the sheet.
  - Verify: `pnpm check:fast`; manual in `pnpm dev`
  - Files: `src/features/admin/data/queries.ts`, `src/features/admin/events/event-detail.tsx`

**Checkpoint B:** `pnpm check:task` · reminder tests · server smoke with SMS unconfigured (every action works; `sms_messages` shows `skipped: not configured`).

## Phase C: visibility, copy, docs

- [x] **T12: What admins see** (SC 5, 6)
  - Acceptance:
    - The person page gains a "Text messages" fact: On, Opted out (replied STOP), Not a US number, No phone number, or Not set up. It is derived from the phone and the latest `sms_messages` row.
    - Settings gains a read-only "Text messages: On · from …" or "Off: not set up" row.
    - DTOs and mocks are updated.
  - Verify: `pnpm check:fast`; manual in both builds
  - Files: `src/server/admin/staff.ts`, `src/server/admin/settings.ts`, `src/lib/data/admin/schemas.ts`, `src/lib/data/admin/mock-repo.ts`, `src/features/admin/settings/settings.tsx`

- [ ] **T13: Staff copy**
  - Acceptance:
    - The onboarding push step reads "Turn them on for new shifts and messages. Reminders and cancellations also come by text."
    - The Profile "Shift reminders" helper reads "24 hours and 1 hour before, in the app and by text."
  - Verify: `pnpm check:fast`; `pnpm build`
  - Files: `src/features/staff/onboarding/permission-steps.tsx`, `src/features/staff/account/profile.tsx` (or its preferences source)

- [ ] **T14: Docs and the owner's Twilio guide** (SC 7, 8)
  - Acceptance:
    - ADR-026 records the decisions: scope change, six kinds, alongside push, consent, reminders, external cron, publish.
    - OPEN_QUESTIONS rows are added.
    - The ADR-018 Vercel variable list gains `TWILIO_*`, `APP_URL` and `CRON_SECRET` (now required for reminders).
    - No `.env.example`: the owner removed it (2026-11-23) and keeps a local `.env`. The variables are documented in the setup guide and ADR-018 instead.
    - `docs/guides/twilio-setup.md` walks through, step by step:
      - which values to collect from the Twilio Console;
      - checking A2P 10DLC or toll-free status;
      - Messaging Service versus a single number, with Advanced Opt-Out on;
      - a restricted API key;
      - Vercel and `.env.local` variables;
      - the cron-job.org job (URL, header, every 5 minutes);
      - a test checklist mapped to the SC.
  - Verify: `pnpm check:task`; `pnpm secrets`
  - Files: `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/guides/twilio-setup.md`

**Checkpoint C (done):** `pnpm check:task` · SC 1–9 walked through · end-to-end texts with the owner after the guide.
