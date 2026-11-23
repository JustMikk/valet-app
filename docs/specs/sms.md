# Spec: SMS for invites and shift changes (Twilio)

**Status:** approved by the owner 2026-11-23 (open questions 1–5 answered below) · **Date:** 2026-11-23

**Owner decisions (2026-11-23):**

- **Provider:** Twilio. A number registered for US A2P messaging is ready.
- **Which texts:** exactly six. An **invitation to the platform**, a **shift reminder**, a **shift cancellation**, an **assignment**, a **reschedule**, and a **removal** (the last three added 2026-11-23). Nothing else is texted.
- **Alongside push, not a fallback:** texts go out regardless of push, to every valet with a phone number on file.
- **Consent:** valets are the company's own crew, so a number on file is consent. There is no opt-in step.
- **Not in v1:** a "Resend text" button, and quiet hours.

## Assumptions (correct these before approval)

1. **This changes MVP scope.** The product spec puts SMS **out of MVP [CONFIRMED]** (§1, §11.3) and names it only as a future hook (§14). The decisions above supersede that, recorded in ADR-026. The `docs/inputs` files stay unedited.
2. **Shift reminders are new for every channel.** No reminder exists today. There is only the unused `notify_remind` preference. The product spec asks for reminders at **24 h and 1 h** before a shift (§11.3), so v1 builds both, each as an in-app row, a push and a text.
3. **The reminders preference governs reminders on every channel.** A valet who turns "Shift reminders" off in Profile gets no reminder in the app, by push or by text. Cancellations and invites are not optional.
4. **Server build only.** Like push and realtime, SMS runs only in the server build (`pnpm dev`, `build:server`, Vercel). The static export never sends.
5. **US numbers only.** The registered number is a US sender. A number whose `phoneKey` is not 11 digits starting with `1` is not texted, and the admin is told so.
6. **Twilio over REST, no SDK.** `fetch` from `src/server/sms`, as Pusher's publisher does, so there is no new runtime dependency.
7. **Credentials are environment-only.** Unlike Pusher (ADR-023), nothing goes in the public repository: a leaked Twilio credential sends paid texts. Without the variables, SMS is off and the UI says so.
8. **STOP is still honoured.** Carriers and Twilio require it, consent or not. Twilio's Advanced Opt-Out blocks sends to a number that replied STOP. The app only records it, so admins can see it.

## Objective

Valets miss invites and shift changes when push isn't on or isn't seen. These events decide whether someone shows up, so they also go by text:

- **Invitation.** Inviting someone "By phone" sends them the join link by SMS.
- **Shift reminder.** 24 h and 1 h before a shift, the assigned valet gets a reminder in the app, by push and by text.
- **Shift cancellation.** When an admin cancels an event, every assigned valet gets the existing in-app notification and push, plus a text.
- **Assignment.** When an admin assigns a valet to a shift, the valet gets the existing "You were assigned" notification plus a text.
- **Reschedule.** When an admin changes a shift's start or end time, every assigned valet gets the existing "Shift rescheduled" notification plus a text.
- **Removal.** When an admin removes a valet from a shift, the valet gets the existing "Removed from a shift" notification plus a text.

Admins can see whether texts reach each valet, and whether an invite text went through.

### User stories

- As an admin, when I invite "Kai Morgan, (713) 555-0144" by phone, Kai gets a text with a link that opens sign-in with the number filled in. The invite sheet says "Texted 1 invite", or names anyone it could not text and why.
- As a valet with a phone number, 24 hours and again 1 hour before my shift, I get a text (and a push and an in-app row) saying where and when.
- As a valet with a phone number, if my shift is cancelled I get a text saying which shift.
- As a valet with a phone number, when I'm assigned to a shift, my shift's time changes, or I'm removed from a shift, I get a text saying what changed.
- As an admin, a valet's page shows "Text messages: On", "Opted out (replied STOP)" or "No phone number".

## Behaviour

### Who gets a text

A text is sent when **all** of these hold:

1. **SMS is configured.** All the Twilio environment variables are set.
2. **It is one of the six kinds:** `invite`, `reminder` (24 h or 1 h), `cancelled`, `assigned`, `rescheduled` or `removed`.
3. **The recipient has a US number.** Its `phoneKey` is valid and US.
4. **No duplicate.** The same kind for the same shift or invite has not already been texted to them in the last 10 minutes (a double-click on Assign or Save never texts twice). Reminders are once per assignment, offset and start time.

Push settings and devices play no part. A valet who replied STOP is not skipped by the app: Twilio refuses the send with error 21610, which is not billed. The app records that as "opted out".

### Shift reminders (new)

- **Who and when.** Each assignment of an assigned valet to a published, uncancelled event gets reminders at **24 h** and **1 h** before `starts_at`. A shift assigned or claimed after a reminder's time gets only the later reminder. An assignment made under 1 h before the start gets none.
- **Delivery.** In-app row, push and SMS, through `notifyStaff` plus the SMS step. Skipped entirely if the valet has `notify_remind` off (Assumption 3).
- **Once only.** Each send is recorded as a `shift_reminders` row (`assignment_id`, `offset`, `starts_at`), with a unique constraint. Keying on the start time means a reschedule re-arms both reminders for the new time; the old time's reminders are simply never due again.
- **Scheduler (owner, 2026-11-23): an outside cron service.** An external cron job (for example cron-job.org) calls `GET /api/cron/reminders` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`. The sweep sends every reminder now due. A throttled run on API traffic (once a minute at most, like photo retention) stays as a backstop, so a missed cron tick only delays a reminder. The setup guide covers creating the job.
- **Late reminders.** If a sweep runs late, the 24 h reminder is still sent until 1 h before the start. The 1 h reminder is still sent until the start. After that, a missed reminder is dropped rather than sent stale.

### Invite texts

- Sent once when an invite "By phone" creates a staff row. Not sent for skipped (duplicate) entries or for email invites. No resend in v1.
- The link is `{APP_URL}/login?role=staff&login=<E.164>`. It pre-fills the sign-in field and changes nothing else about sign-in (ADR-025).

### Shift-change texts

Each of these already sends an in-app notification and push. The valets it reaches who have a US number also get a text, from the same place in the code:

| Kind          | Raised by                                      | Notification today     | Texted when                                                                                                                                                                              |
| ------------- | ---------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cancelled`   | `cancelEvent` (`admin/events.ts`)              | "Shift cancelled"      | always, to every assigned valet                                                                                                                                                          |
| `assigned`    | `assignStaff` (`admin/events.ts`)              | "You were assigned"    | when the event is published (including assignments made while creating a published event). An assignment to a draft is not announced today, so it is not texted either (Open question 5) |
| `rescheduled` | `updateEvent` (`admin/events.ts`)              | "Shift rescheduled"    | only when the start or end time changed. A name or instructions edit ("Event updated") is not texted                                                                                     |
| `removed`     | the Live Board remove action (`admin/live.ts`) | "Removed from a shift" | always, to the removed valet                                                                                                                                                             |

A valet claiming an open shift themselves is not an assignment and is not texted.

### Publishing a draft (owner, 2026-11-23: fix it here)

Today nothing can publish a draft event, so people assigned to a draft are never told about their spot. This work adds it:

- **Server:** `publishEvent` moves a draft to `published` (only from `draft`; publishing twice is a conflict). It then:
  - sends "You were assigned" to everyone already assigned (in-app, push and text, kind `assigned`);
  - posts the open spots to staff, as creating a published event does (`broadcastOpen`);
  - arms their reminders.
- **API:** `POST /api/admin/events/[id]/publish`, with an `AdminRepo.publishEvent` method in the HTTP and mock repos.
- **UI:** a draft event's page gets a **Publish event** accent button, above Cancel event. A confirm sheet states the consequence before acting:
  - title: "Publish {event title}?"
  - consequence: "{N} assigned valets are told now, in the app and by text. {M} open spots are posted to staff."
  - confirm label: "Publish event"

  After publishing, the badge and lists update as for any published event.

- **Past drafts:** a draft whose end time has passed cannot be published ("This event has already ended."), as creating one already refuses.

### Message copy (proposals, owner to confirm: Open question 1)

- **Invite:** `{Admin first name} at {Tenant name} invited you to join their valet crew. Get started: {link} Reply STOP to opt out.`
- **Reminder, 24 h:** `{Tenant short name}: Reminder, you're working {event title} tomorrow, {time range}. {venue address} {link}`
- **Reminder, 1 h:** `{Tenant short name}: Your shift at {event title} starts at {start time}. Clock-in opens {window open time}. {link}`
- **Cancelled:** `{Tenant short name}: Your shift at {event title} on {date} was cancelled. {link}`
- **Assigned:** `{Tenant short name}: You're assigned to {event title}, {date} {time range}. {link}`
- **Rescheduled:** `{Tenant short name}: {event title} has a new time: {date} {time range}. {link}`
- **Removed:** `{Tenant short name}: You were removed from {event title} on {date}. Questions? Reply in the app. {link}`
- **Length.** Aim for under 160 GSM-7 characters. Trim the body, never the link.

### Delivery and failure

- **Best effort.** A failed text never fails the action that caused it, as with push (ADR-015). Sends are capped at 3 s per batch.
- **Logging.** Every attempt is a row in `sms_messages`: kind, staff id, masked number, Twilio SID, status, error code.
- **Status callback.** `POST /api/sms/status` moves a row through queued → sent → delivered, undelivered or failed. It accepts only requests with a valid **`X-Twilio-Signature`**; anything else gets a 403.

### What admins see

- **A valet's page.** A fact row "Text messages", one of: `On`, `Opted out (replied STOP)`, `Not a US number`, `No phone number`, or `Not set up`. "Opted out" means the latest attempt failed with 21610.
- **Invite result.** "Texted N invite(s)", plus each phone that could not be texted, with the reason.
- **Settings.** A read-only row: "Text messages: On · from (713) 555-0100", or "Off: not set up".

### Staff app changes

- **Onboarding push step.** Its copy is no longer true. It currently reads "There are no text messages, so this is how we reach you". New copy is in Open question 1.
- **Profile.** No new control. "Shift reminders" now also controls the reminder texts, and its helper line says so (copy in Open question 1).

## Tech stack

Unchanged: Next.js 16.4.2 server build, Neon Postgres (tagged-template SQL), Zod (`zod/mini`) at every boundary, TanStack Query, Vitest.
New: Twilio Programmable Messaging REST (`POST /2010-04-01/Accounts/{AccountSid}/Messages.json`) via `fetch`. No new npm dependency.

### Environment (`src/server/env.ts`, `.env.example`, ADR-018's Vercel list)

| Variable                                       | Required for SMS | Purpose                                                                      |
| ---------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                           | yes              | The account in the API path                                                  |
| `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` | yes              | REST auth with an API key, not the Auth Token (Twilio's production standard) |
| `TWILIO_AUTH_TOKEN`                            | yes              | Checks `X-Twilio-Signature` on the status callback                           |
| `TWILIO_MESSAGING_SERVICE_SID`                 | one of these two | Preferred sender: carries the A2P campaign and Advanced Opt-Out              |
| `TWILIO_FROM_NUMBER`                           | one of these two | A single E.164 sender instead                                                |
| `APP_URL`                                      | yes              | Public origin for links and the callback URL                                 |

SMS counts as configured only when all of the required variables and one sender are present. The reminder sweep runs with or without SMS: reminders still go in the app and by push.

## Commands

```bash
pnpm dev                          # server build (sends texts when TWILIO_* are set)
pnpm db:migrate                   # applies db/migrations/016_sms_and_reminders.sql
pnpm test -- src/server/sms src/server/reminders
pnpm check:fast                   # typecheck + lint + secrets + floor guard
pnpm check:task                   # + boundaries + static build (no /api routes in the export)
pnpm build:server                 # lists /api/sms/status and /api/cron/reminders
```

## Project structure

```text
db/migrations/016_sms_and_reminders.sql  sms_messages, shift_reminders (unique assignment_id + offset)
src/server/sms/twilio.ts                 REST send (form-encoded, Basic auth), signature check
src/server/sms/copy.ts                   pure: the four message texts, trimming, GSM-7 length
src/server/sms/index.ts                  textStaff(kind, recipients), textInvite(...): log, send, record
src/server/reminders.ts                  due-reminder query (pure time maths in lib/time), sweep, throttle
src/server/sms/*.test.ts, src/server/reminders.test.ts
src/server/admin/events.ts               cancelEvent, assignStaff, updateEvent (window only): text after notifyStaff
src/server/admin/live.ts                 remove from shift: texts the removed valet
src/server/admin/staff.ts                inviteStaff: texts phone invites; "Text messages" fact
src/server/admin/settings.ts             SMS status row
src/app/api/sms/status/route.api.ts      Twilio status callback (thin)
src/app/api/cron/reminders/route.api.ts  scheduled sweep (CRON_SECRET), thin
src/app/api/admin/events/[id]/publish/route.api.ts  publish a draft (thin)
src/features/admin/events/event-detail.tsx   Publish event button + confirm sheet (drafts only)
docs/guides/twilio-setup.md              owner setup guide (Twilio values, Vercel variables, cron job)
src/lib/contact/contact.ts               e164() from phoneKey
src/lib/data/**/schemas.ts               invite result texted/failed, text-reach fact, settings row
src/features/admin/staff/*, src/features/admin/settings/settings.tsx
src/features/staff/onboarding/permission-steps.tsx, src/features/staff/account/profile.tsx (copy)
src/mocks/*                              fixture values for new DTO fields (static build)
docs/DECISIONS.md (ADR-026), docs/OPEN_QUESTIONS.md, .env.example
```

`src/server/sms` and `src/server/reminders.ts` stay server-only (dependency-cruiser `server-is-private`, `server-has-no-ui`).

## Code style

Follow `src/server/notify/push.ts`: plain functions, a header comment saying why, best effort, and an environment check that turns the feature off.

```ts
// Twilio Programmable Messaging over REST (no SDK). Best effort: a failed text never fails the
// action that caused it; the caller gets a result to log, not an exception.
export type SendResult =
  { ok: true; sid: string; status: string } | { ok: false; code: number | null; message: string }

export async function sendSms(to: E164, body: string): Promise<SendResult> {
  const cfg = smsConfig()
  if (!cfg) return { ok: false, code: null, message: "SMS not configured" }
  const form = new URLSearchParams({ To: to, Body: body, StatusCallback: cfg.statusUrl })
  if (cfg.messagingServiceSid) form.set("MessagingServiceSid", cfg.messagingServiceSid)
  else form.set("From", cfg.from)
  const response = await fetch(`${API}/Accounts/${cfg.accountSid}/Messages.json`, {
    method: "POST",
    headers: { authorization: basicAuth(cfg.keySid, cfg.keySecret) },
    body: form,
    signal: AbortSignal.timeout(SEND_BUDGET_MS),
  })
  return parseSendResponse(response.status, await response.json()) // Zod-validated
}
```

Conventions:

- Tagged-template SQL only.
- Zod for Twilio responses and callback bodies.
- No `any`.
- Numbers move as a branded `E164` type built from `phoneKey`.
- Logs never contain message bodies or full numbers, only the last 4 digits.

## Testing strategy

Vitest unit tests next to the code:

- **`sms/copy.test.ts`:** the seven texts (invite, two reminders, cancelled, assigned, rescheduled, removed), STOP line on the invite, trimming keeps the link whole, GSM-7 length.
- **`sms/twilio.test.ts`:**
  - the request shape (form fields, Basic auth, Messaging Service vs From);
  - parsing success, 21610 (opted out) and 429 / 5xx;
  - `X-Twilio-Signature` validation against Twilio's documented example.
- **`sms/index.test.ts`:** recipients without a US number are skipped with a reason. A repeat within the dedupe window is never texted twice. Only the six kinds can be sent.
- **`reminders.test.ts`:**
  - due-reminder selection across time zones and DST;
  - the 24 h and 1 h windows, and late assignment (only the later reminder);
  - late sweeps (sent until the cut-off, then dropped);
  - cancelled events and unassigned slots excluded;
  - `notify_remind` off is skipped;
  - idempotent re-runs;
  - a reschedule re-arms both reminders for the new start time.
- **`contact.test.ts`:** `e164()`.

End to end (manual, owner's registered number, server build):

- Invite your own phone by phone and receive the text.
- Assign yourself a shift starting in about 61 minutes: the 1 h reminder arrives on the next sweep.
- Assign yourself, change the shift's time, remove yourself, and receive one text for each.
- Cancel the event and receive the cancellation text.
- On a public deploy, a status callback moves the row to `delivered`.

Callbacks cannot reach `localhost`, so that last check runs on Vercel.

This is server logic that spends money and runs on a schedule, so these tests are part of the task, not deferred by build mode (ADR-011).

## Boundaries

- **Always:**
  - Text only the six kinds.
  - Keep the static export building.
  - Validate `X-Twilio-Signature`.
  - Make every send best effort, with a time cap.
  - Make reminders idempotent.
  - Mask numbers in logs.
  - Update ADR-026, OPEN_QUESTIONS, `.env.example` and the Vercel variable list.
- **Ask first:**
  - Texting any other notification.
  - Changing the message copy.
  - Texting non-US numbers.
  - Adding the Twilio SDK or any dependency.
  - Adding a `vercel.json` cron or changing reminder offsets.
- **Never:**
  - Commit Twilio credentials or expose them to client code or `NEXT_PUBLIC_*`.
  - Fail a user action because a text failed.
  - Send from the static build or the mock repo.

## Success criteria

1. With the `TWILIO_*` variables and `APP_URL` set, inviting a US number by phone sends one SMS with a working sign-in link. The invite sheet reports it as texted.
2. Every assigned valet with a US number gets exactly one reminder text at 24 h and one at 1 h before the shift, whatever their push setting, unless "Shift reminders" is off. Every reminder also appears in the app and by push.
3. Cancelling an event texts every assigned valet with a US number once. Assigning a valet to a published event, changing a shift's start or end time, and removing a valet each text the affected valets once. Editing an event's name or instructions, a valet claiming an open shift, and assigning to a draft do not text.
4. Re-running the reminder sweep, or calling it from two places at once, never sends a reminder twice.
5. With any Twilio variable missing, nothing is texted and nothing errors. Reminders still arrive in the app and by push. Settings shows texts as not set up.
6. A status callback without a valid signature gets a 403. A valid one updates `sms_messages.status`. A 21610 shows the valet as "Opted out (replied STOP)".
7. `pnpm check:task` passes, the static export has no `/api` routes, and the new tests pass.
8. No Twilio secret appears in the repository or the client bundle; `pnpm secrets` is clean.
9. Publishing a draft moves it to published once. Everyone already assigned gets "You were assigned" in the app, by push and by text. Its open spots are posted to staff, and its reminders are armed. Publishing again, or publishing an ended draft, is refused with a message.

## Owner answers to the open questions (2026-11-23)

1. **Copy:** accepted as written: the seven texts, "Regency" as the short name, the onboarding line and the "Shift reminders" helper.
2. **Reminder times:** both 24 h and 1 h, both texted.
3. **Scheduler:** an outside cron service calling `/api/cron/reminders` (see Shift reminders).
4. **Sender and Twilio setup:** the owner will be guided through everything needed from Twilio. Deliverable: `docs/guides/twilio-setup.md`, a step-by-step guide covering:
   - which values to collect (account SID, API key SID and secret, Auth Token, Messaging Service SID or From number);
   - checking the number's A2P 10DLC or toll-free status;
   - turning on Advanced Opt-Out;
   - setting the variables on Vercel and in `.env.local`;
   - creating the external cron job;
   - a test-send checklist.

   The code supports both a Messaging Service and a single From number until the owner chooses.

5. **Drafts:** fixed in this work (see "Publishing a draft").
