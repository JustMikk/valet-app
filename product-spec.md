# Valet Workforce Platform — MVP PWA: Product & User-Flow Handoff

**Audience:** Claude Design (and any engineer picking this up after)
**Purpose:** Give you the full product context, rules, and user flows so you can design the interface freely. This document deliberately contains **no visual or UI specifications**. Layout, style, navigation patterns, and interaction details are yours to decide. What is fixed here is *what the product must do, for whom, in what order, under which rules, and what can go wrong*.

**Date:** Oct 22, 2026

---

## 0. How to read this document

Tags used throughout:

| Tag | Meaning |
|---|---|
| **[CONFIRMED]** | Decided with the product owner. Treat as fixed. |
| **[DEFAULT]** | Proposed default so flows are complete. Easy to change; design for it but expect it may be tuned. |
| **[OPEN]** | Genuinely undecided. Do not invent an answer in the design; design so either answer works, or surface it as a question. |
| **[FUTURE]** | Out of MVP, but the design should not paint us into a corner. |

**Design freedom:** Everything visual and structural (IA, navigation, components, density, motion, theming, branding treatment).
**Not negotiable:** The rules, state models, permissions, and failure paths in this document. If a design needs one of them to change, flag it rather than silently working around it.

---

## 1. Product summary

A workforce, staffing, and billing platform for **valet and parking service companies** (the "client"; first client is a startup valet company running staff across hotels, restaurants, and events). It is delivered and operated by **REM**, who also provide the client's website, email automation, and brand management.

The platform lets a valet company:

1. Set up the **venues** it serves and the **staff** it employs.
2. Post **events** (a venue, a time window, a headcount), fill them by assigning staff and letting staff claim open spots.
3. Verify that staff **physically arrived and worked** (geofenced clock-in with selfie).
4. See **everything happening right now** on a live board.
5. Turn verified hours into accurate **invoices** to venues.
6. Stay in touch with staff through **in-app chat, broadcasts, and automated push notifications**.

Guiding principle: **clock data is the only source of billable hours.** Workers never enter hours. The company invoices venues; workers never invoice.

### Multi-client from day one
The architecture serves more than one valet/event-staffing company (tenants). The MVP launches with one, but every venue, worker, event, and invoice belongs to a tenant, and each tenant has its own branding. Design with that in mind (e.g., tenant logo/name appear in admin, staff app, and invoices), without building multi-tenant switching UI beyond the platform-admin role below.

---

## 2. MVP scope

### In scope **[CONFIRMED]**

**Admin**
- Venue management (address, pin, geofence radius)
- Staff creation and invitation
- Event creation and management
- Staff assignment, plus open slots staff can claim
- Event status tracking, including a **Live Board**
- Hours review and approval
- Invoice generation, delivery, and status tracking
- Individual and broadcast messaging, plus automated notifications

**Staff**
- Accept invite, consent to location use, install the app
- See assigned shifts, claim open slots, drop a slot
- Clock in (location inside geofence + on-site selfie) and clock out
- Chat with admin; receive push notifications

**Platform admin (REM ops)** — minimal: create/manage client accounts and branding, view-as support access.

### Explicitly out of MVP
- SMS (in-app chat and push only) **[CONFIRMED]**
- Waitlist and auto-backfill **[FUTURE]**
- Periodic in-shift location check-ins **[FUTURE]**
- Continuous/background location tracking **[FUTURE — native build only]**
- Venue login / read-only venue portal **[FUTURE]** (venues receive email invoices only)
- Accounting sync (QuickBooks/Xero) **[FUTURE]**
- Payroll processing (we only export approved hours) 
- Batched weekly/monthly invoices **[FUTURE]** (MVP: one invoice per event)
- Recurring events **[FUTURE]** — likely the first follow-up request; model events so recurrence can be added later
- Online payment of invoices **[FUTURE]** (MVP: admin records payment manually)
- Customer-facing valet features (digital tickets, request-my-car, driver payments) — not part of this product

---

## 3. Platform and technical constraints that shape the design

- **React PWA first.** Installs from a link to the home screen on iOS and Android. No app-store involvement for MVP. The same codebase may later be wrapped with **Capacitor** for native iOS/Android builds. Design should not depend on browser-only behavior (hover-only affordances, reliance on browser back/forward chrome, etc.).
- **Two very different usage contexts:**
  - **Staff:** phone only, often outdoors, rushed, one-handed, mixed device quality, possibly weak signal. The core staff job (clock in) must be fast.
  - **Admin:** desktop and phone. Admins frequently manage from their phone while physically at a venue, so the **Live Board must work well on a phone**, not only on a desktop.
- **Location is read only at the moment of a punch (foreground).** A PWA cannot track in the background or wake on geofence entry/exit. Do **not** design anything that implies continuous or live GPS tracking (no moving dots, no "last seen 30 seconds ago" for MVP). Location verification = a snapshot taken when the worker clocks in/out.
- **Camera:** the selfie is captured live in the app at clock-in. Design the capture step as a live camera capture, not a gallery picker.
- **Push notifications:** On iOS, web push only works after the app is installed to the home screen (iOS 16.4+) and permission is granted from a user gesture. **Installing the app and enabling notifications must be part of staff onboarding**, because SMS fallback does not exist in MVP. Android is easier but should follow the same onboarding.
- **Offline:** Staff punches must work without signal and sync later with the *original* timestamp. Staff app should cache "my shifts" for offline viewing. Admin surfaces can require connectivity but must communicate stale/offline state honestly (see Live Board).
- **Real-time:** Fill counts, clock-ins, and attention items update live for admins.
- **Time zones:** Event times are in the **venue's time zone**. Everyone sees event times in venue-local time, labeled where ambiguity is possible.
- **Branding:** Tenant logo/name in admin, staff app, invoice PDF, and invoice emails. REM branding on platform-admin surfaces.

---

## 4. Roles and permissions

| Capability | Staff | Admin (client owner/manager) | Platform admin (REM ops) | Venue contact |
|---|---|---|---|---|
| Sign in to the app | Yes | Yes | Yes | **No** (email only) |
| View/claim open events | Yes | — | — | — |
| View own shifts/hours/pay | Yes | — | — | — |
| Clock in/out | Yes | — | — | — |
| Create/edit venues, staff, events | — | Yes | View-as | — |
| Assign/remove staff | — | Yes | View-as | — |
| Live Board | — | Yes | View-as | — |
| Review/approve/edit hours | — | Yes | View-as | — |
| Create/send invoices | — | Yes | Yes (on behalf) | Receives |
| See bill rates | **Never** | Yes | Yes | Sees invoice totals |
| See pay rates | Own only **[OPEN: show own pay rate?]** | Yes | Yes | **Never** |
| Message | Own thread with admins | All staff threads, broadcasts | — | — |
| Manage tenants/branding | — | Own tenant settings | Yes | — |

Notes:
- Multiple admins can exist per tenant (owner + managers). Chat threads and the attention queue are **shared** across a tenant's admins **[DEFAULT]**; the UI should show which admin acted.
- Every admin action that changes money, hours, or assignments is audit-logged (who, when, before/after, reason where applicable).
- **Never** expose pay rates to venues or bill rates to staff, including in invoice PDFs, emails, and notifications.

---

## 5. Core domain model (concepts the design must reflect)

**Tenant** — a client company. Owns everything below.

**Venue** — a billable place: name, address, map pin (geofence center), geofence radius, time zone, billing contact(s) (name, email), default bill rate, optional billing-rule overrides, on-site instructions/notes.

**Staff member** — person with a status (Invited, Active, Deactivated), contact info, pay rate (with history), optional lightweight tags/groups **[DEFAULT]** (e.g., "Lead", "Weekend") used for targeting broadcasts.

**Event** — a job at one venue: date, start/end, **headcount N**, bill rate (defaults from venue, overridable per event), instructions, holiday flag. An event has **N slots**.

**Slot** — one position in an event. At any time a slot is **Open** or **Filled** by one staff member. History is retained (who held it, drops, removals) for reliability reporting and audit.

**Assignment** — staff ↔ slot, created by admin assignment or staff claim. Both result in the same confirmed state (no pending claims).

**Punch** — clock-in or clock-out record: device timestamp, server-received timestamp, location sample (lat/lng, accuracy), geofence result, distance from center, selfie (clock-in), source (live, queued-offline, admin-edited, override-approved), flags, edit history.

**Hours record** — derived per assignment from punches: scheduled vs actual in/out, hours, flags, approval state, lock state.

**Invoice** — per event (MVP): number, venue + billing contact(s), lines per worker (in/out, hours, bill rate), adjustments/fees, total, terms and due date, status timeline, related credit/debit memos.

**Conversation / Message / Broadcast / Notification** — see section 11.

### 5.1 Two independent status axes on an event
Admins think about events two ways at once, and the design must keep them separate:

**A. Lifecycle (where is the event in time and money):**
`Draft → Scheduled → In progress → Completed (needs review) → Hours approved → Invoiced → Paid` (and `Cancelled` from Draft/Scheduled)

- *Draft* — saved by admin, invisible to staff.
- *Scheduled* — published; before start time.
- *In progress* — start time reached. If someone is still clocked in after the end time, it stays In progress with an **overrun** indicator.
- *Completed (needs review)* — end time passed and nobody is still clocked in (or admin closed the event, which flags anyone still clocked in as a missed clock-out).
- *Hours approved* — every assignment's hours resolved and approved; ready to invoice. Still reopenable until an invoice is sent.
- *Invoiced* — invoice sent; hours locked.
- *Paid* — admin recorded payment.

**B. Staffing (is it covered):**
`Open (unfilled slots exist)` or `Filled (all slots filled)`, with counts: required / filled / open. This axis is meaningful in Scheduled and In progress.

So "Scheduled + Open" and "In progress + Open" are different situations and the design should be able to express both.

### 5.2 Assignment (slot-holder) states
`Assigned/Claimed (confirmed) → Clocked in → Clocked out → Hours approved`

Side outcomes: `Dropped` (staff gave it up; slot reopens), `Removed` (admin removed; slot reopens), `No-show` (admin marked; zero hours), plus **derived** conditions: `Due soon`, `Late`, `Missing clock-out`.

### 5.3 Invoice states
`Draft → Sent → Viewed → Paid`, with `Overdue` derived after due date, and `Void` **[OPEN: void/reissue policy]**. After Sent, hours are locked; further changes happen through **credit or debit memos** referencing the original invoice.

---

## 6. Tenant settings and defaults

All **[DEFAULT]** unless noted. The Settings area must expose these; the flows below reference them by name.

| Setting | Default | Used for |
|---|---|---|
| Default time zone | Tenant's; overridable per venue | Event display |
| Clock-in window opens | 15 min before start | Staff can't clock in earlier |
| Late grace | 10 min after start | "Late" state, admin alert |
| Missing clock-out flag | 30 min after event end | Reminder to staff, then flag to admin |
| Default geofence radius | 150 m (editable per venue) | Clock-in verification |
| Max GPS accuracy to auto-verify | 75 m **[OPEN: exact number]** | Low-accuracy handling |
| Selfie required at clock-in | Yes **[CONFIRMED]** | Punch validity |
| Selfie required at clock-out | No (toggle) | Punch validity |
| Late-drop cutoff | 24 h before start | Flag drops as "late" |
| Short-staffed alerts | At 24 h, 4 h before start, and at start if slots remain open | Admin attention queue |
| Shift reminders to staff | 24 h and 1 h before start | Push |
| Claim mode | Instant, first-come-first-served **[CONFIRMED]** | Open slots |
| Invoice terms | Net 30 | Due date |
| Invoice reminders (to venue) | 3 days before due, on due date, +7, +14 | Automated email |
| Invoice number prefix/sequence | Tenant-configurable | Invoice identity |
| Billing rules | See 10.2 | Invoice totals |

---

## 7. User flows — setup and management

Each flow lists: **Actor · Entry · Steps · Rules · Edge cases · Resulting state/notifications.**

### 7.1 Platform admin: create a client account (REM ops)
**Actor:** Platform admin.
**Steps:**
1. Create tenant: company name, logo, primary contact, default time zone.
2. Create the first client admin (name + email); system sends an invite.
3. Optionally preconfigure tenant settings (section 6).
4. Hand off; the client admin completes sign-up from the invite.

**Rules:** Platform admin can **view-as** any tenant for support. View-as sessions are clearly indicated and audit-logged; destructive actions while viewing-as require confirmation.
**Edge cases:** Invite expired/resent; wrong email corrected before acceptance.

### 7.2 Admin: first-run setup
**Actor:** Client admin, after accepting the invite.
**Steps:** Set a sign-in method → confirm company profile and logo → add first venue (7.3) → invite first staff (7.4) → create first event (7.5).
**Design intent:** The product is empty on day one. First-run should guide the admin through the *minimum viable path to a filled event* (venue → staff → event) and make the empty states of each list point to the next action.

### 7.3 Admin: manage venues and geofences
**Actor:** Admin. **Entry:** Venues area, or inline while creating an event.
**Create steps:**
1. Enter venue name and address.
2. Place/confirm the **geofence center** (admin confirms or adjusts the pin; the address alone is not trusted).
3. Set **geofence radius** (default from settings) — admin needs to *see* the fence relative to the venue to judge it.
4. Set time zone (defaults from address/tenant).
5. Add **billing contact(s)** (name, email) — required before an invoice can be sent to this venue.
6. Optional: default bill rate, billing-rule overrides, on-site instructions (parking location, dress code, who to ask for on arrival).

**Rules:**
- A venue with no pin/radius cannot host an event (clock-in depends on it).
- Editing a venue's geofence **never changes past punches or past verifications**; it applies to future punches only.
- Venues can be archived (hidden from new events; history kept). They cannot be deleted if they have events.
- Large or awkward venues (hotel with a remote garage, a campus) are real: the radius must be tunable per venue, and the admin should be able to understand "will my staff be inside this?" before saving.

**Edge cases:** Address can't be geocoded → admin places the pin manually. Two venues share a building → separate venues, separate fences, no restriction on overlap.

### 7.4 Admin: create and invite staff
**Actor:** Admin. **Entry:** Staff area.
**Steps:**
1. Add staff: name, email (and phone as a contact field), pay rate, optional tags.
2. Send invite. **No SMS in MVP**, so invites go by **email and/or a copyable invite link/QR code** the admin can share through their own channels (e.g., a text from their own phone, WhatsApp).
3. Staff status shows **Invited** until accepted, then **Active**.

**Admin management actions:** resend invite, revoke invite, edit details, change pay rate (rate history preserved; changes apply forward, never silently to past hours), deactivate (can't be assigned or claim; history kept), reactivate.

**Staff profile (admin view):** contact info, status, current pay rate, upcoming shifts, shift history, simple reliability counts (late, no-show, late drops) **[DEFAULT]**, and a path to message them.

**Rules:**
- Deactivating a staff member with upcoming shifts requires the admin to resolve those slots (each reopens).
- Importing staff in bulk is not required for MVP **[OPEN: CSV import wanted early?]**.

### 7.5 Staff: accept invite and onboard
**Actor:** Staff. **Entry:** Invite link/QR.
**Steps:**
1. Open invite → see which company invited them.
2. Create access. **[OPEN: sign-in method]** — SMS codes are out (no SMS), so candidates are email magic-link/one-time code, with optional password. Optimize for workers who forget passwords and change phones.
3. Confirm profile (name; optional profile photo — useful for admins identifying people on the board).
4. **Location consent** — plain-language, specific: location is read **only when you clock in or out**; it is not tracked otherwise. Consent is recorded with a timestamp. Without consent, the worker can browse but cannot clock in (and is told why).
5. **Install the app** — Android: install prompt. iOS: guided "Add to Home Screen" steps (required for push on iOS). The flow should detect "not installed" and continue to nudge, not just ask once.
6. **Enable notifications** — requested from a user tap, with a clear reason ("so you hear about shifts and changes"). Explain what happens if declined (they may miss shifts; there is no text-message backup).
7. Land on the staff home (7.7).

**Edge cases:** Invite already used; invite for a deactivated staff member; opening the invite on desktop (offer to continue on phone); user declines location or notifications (allow continuing, keep gentle reminders, and surface a visible "notifications off" state somewhere the admin can also see **[DEFAULT]** so admins know who can't be reached by push).

### 7.6 Admin: create and manage events (core flow)

#### 7.6.1 Create
**Actor:** Admin. **Entry:** Events area / "New event" (also from empty states and the Live Board).
**Steps:**
1. **Venue** — choose existing, or create inline (7.3).
2. **When** — date, start, end (venue time zone). Support overnight events (end after midnight).
3. **Headcount** — number of workers needed (N slots).
4. **Bill rate** — defaults from venue/tenant; overridable for this event. Optional holiday flag.
5. **Instructions** — notes staff will see (parking, dress code, contact on site).
6. **Assign staff now (optional)** — pick staff for some or all slots. The picker must make **availability legible**: free, already assigned elsewhere that overlaps, deactivated (not selectable), and who is already on this event. Overlap is a warning for the admin and a hard block for claims.
7. **Remaining slots** — any unassigned slots become **open for claim**. Publishing notifies eligible staff (all Active staff, or a chosen tag/group). **[CONFIRMED]**: assigned slots are filled at creation; any remaining slots are available to claim.
8. **Review and publish** — summary shows: venue, time, N slots, X assigned, Y open to claim, bill rate, who will be notified.
9. Alternatively **Save as draft** (not visible to staff).

**Rules:**
- Assigned slots are **confirmed immediately** (no accept step). Staff are notified; staff can later drop (7.9).
- If X = N, the event is **Filled** and nothing is broadcast.
- If X < N, the event is **Open** and published open slots appear in staff's open-events feed.
- Past start times can't be scheduled except by admin with explicit confirmation **[DEFAULT]**.
- **Duplicate event** is a first-class action (copy venue/time/headcount/rate to a new date) **[DEFAULT]** — valet clients repeat events constantly, and it's the cheap precursor to recurrence.

#### 7.6.2 Edit an event
**Before start:**
- Change time/venue/instructions → all assigned staff notified ("schedule change"); they may drop if it no longer works. Changing the **venue** is treated as a major change and should be clearly confirmed by the admin before sending.
- **Increase headcount** → new open slots appear; admin chooses whether to re-notify staff.
- **Decrease headcount** → allowed only down to the number of filled slots; to go lower, the admin must first remove assigned staff.
- **Cancel** → confirmation naming how many staff are affected; all assigned/claimed staff notified; slots closed. Cannot cancel an event that already has punches (it must be completed and reviewed).

**After start (event live):**
- Extend/shorten the end time → logged; affects "overrun" and missing-clock-out timing.
- Add/remove staff → allowed; late additions follow normal assignment rules.
- Headcount increases while live are common (venue asks for more cars covered) and should be a fast path: add slots → assign or broadcast.

#### 7.6.3 Manage staffing on an event
**Actor:** Admin. **Entry:** Event detail, or in place from the Live Board.
**Actions:**
- **Assign** a staff member to an open slot (same availability-aware picker).
- **Remove** a staff member (slot reopens; staff notified; optional note).
- **Replace** (remove + assign in one move) **[DEFAULT]** — common when someone calls out.
- **Broadcast the open slot(s)** to eligible staff (all, a tag, or hand-picked) with a message attached to the event.
- **Mark no-show** (only after late grace has passed; zero hours; slot is *not* automatically reopened if the event is already live **[OPEN]**).

**Fill tracking:** The event always shows required / filled / open and *who* holds each slot, live. Fill changes (claims, drops, removals) update immediately for every admin.

### 7.7 Staff: home, my shifts, and open events
**Actor:** Staff. **Entry:** App open (including from a push notification, which should deep-link to the relevant item).
**What staff need at open, in priority order:**
1. **If a shift is happening now or within the clock-in window:** the app should land them on *that shift's action* (clock in, or the in-progress shift with clock-out). The primary action must be reachable in essentially one step from app open.
2. Otherwise: **my upcoming shifts** (venue, date/time, instructions, who to contact).
3. **Open events I can claim** (with spots remaining).
4. Messages / notifications.

**My shift detail shows:** venue, address (with a way to navigate there using the phone's own maps — no in-app routing is built), time, instructions, co-workers assigned **[OPEN: show co-workers?]**, clock status, and the actions Clock in / Clock out / Can't make it.
**Never shown to staff:** bill rates; other staff's pay.

### 7.8 Staff: claim an open slot
**Entry:** Open-events feed, or a push ("New event: Grand Hotel, Sat 6–11 PM — 3 spots").
**Steps:**
1. View event details (venue, time, duration, instructions, spots left).
2. Tap claim → **instant confirmation** if a spot remains. **[CONFIRMED]** first-come-first-served; no admin approval.
3. The shift appears in My Shifts; the admin's fill count updates live; admin gets a "slot filled" notification (and "event filled" if it was the last).

**Rules and failure paths:**
- **Race:** two workers claim the last spot → one succeeds; the other gets a clear "just filled" message and is routed back to remaining open events.
- **Overlap:** a worker cannot claim an event that overlaps one they already hold (blocked with explanation naming the conflict). Back-to-back with insufficient travel time is **not** enforced in MVP.
- **Deactivated or no location consent:** claim allowed only if account is Active; missing location consent is surfaced as a warning (they'd be unable to clock in later) **[DEFAULT]**.
- **Event changed/cancelled while viewing:** show the current truth, do not let a stale claim go through.
- Admin can remove a claimed worker at any time (7.6.3).

### 7.9 Staff: drop a shift
**Entry:** My shift detail → "Can't make it".
**Steps:**
1. Choose a reason (short presets + optional note).
2. Confirm. If inside the **late-drop cutoff**, the confirmation states plainly that the admin will be alerted as a late drop. **[DEFAULT]** Do not hard-block late drops: blocking produces no-shows, which are worse for the company.
3. Slot **reopens immediately**; admin notified (urgent styling/priority if late); open slot may be re-broadcast to eligible staff automatically **[DEFAULT]** or manually by admin.

**Rules:**
- A worker cannot drop after clocking in (they clock out instead).
- Drops are recorded for reliability counts.
- If the event is already **In progress**, a drop is effectively a no-show path; route the worker to message the admin instead **[DEFAULT]**.

---

## 8. User flows — clock in and clock out (the trust core)

This is the feature the rest of the product depends on: invoices are only as honest as the punches. It must be **fast for honest workers** and **hard to fake**, and it must never leave a worker stuck at a venue with no path forward.

### 8.1 What counts as a valid clock-in
A clock-in is **valid** when all are true:
1. The worker has an assignment on this event and is within the **clock-in window** (opens 15 min before start by default).
2. A location sample is captured **at the moment of the punch** and falls **inside the venue geofence** (accounting for the sample's accuracy).
3. A **live selfie** is captured and attached.

Otherwise it is not recorded as a normal punch; one of the exception paths below applies.

### 8.2 Clock-in flow (happy path)
**Actor:** Staff, on site. **Entry:** App open → shift in clock-in window → Clock in.
1. **Pre-flight (silent when everything is fine):** location permission granted, location services on, camera available, consent recorded. If anything is missing, the worker is guided to fix it *right here* (see 8.4), not sent away.
2. **Acquire location** — show that the app is working out the position, and that it is waiting for a good-enough fix. This can take several seconds outdoors and longer in garages.
3. **Evaluate against geofence** — result is one of: *inside*, *outside*, *low accuracy / can't confirm*.
4. **Capture selfie** — live camera; allow retake; confirm.
5. **Submit** — success state states what was recorded: venue, **time**, and "you're on the clock". The shift now shows as in progress with a running timer and the Clock out action.
6. The admin's Live Board and event roster update in real time with the arrival, selfie, and verification result.

**Speed requirement:** a worker with permissions already granted should complete this in a handful of taps and well under half a minute.
**Order of steps** (location first, selfie second) is intentional: don't make a worker take a selfie if they're going to be told they're outside the fence. **[DEFAULT — design may test the alternative]**

### 8.3 Before the window opens / after the event
- **Before the window:** the shift shows when clock-in opens (and a countdown). Clock in is visibly unavailable, not hidden.
- **Window open but not yet clocked in:** the shift is the home screen's primary item.
- **Event over and still not clocked in:** the worker is told they can't clock in; directed to message the admin (the admin can add a punch in hours review).

### 8.4 Exception paths (each needs a designed state)

| Situation | What the worker should experience | What the admin sees |
|---|---|---|
| **Location permission denied / services off** | Plain explanation of why it's needed; platform-specific steps to enable; a retry once fixed | Nothing until they act; if they message or request approval, it appears there |
| **Camera permission denied** | Explanation; steps to enable; cannot complete clock-in without selfie | Same as above |
| **Low accuracy / no fix** | Guidance to wait, step outside, retry; after repeated failure, the **request approval** path (below) | Nothing, until a request is submitted |
| **Outside the geofence** | Clear message with how far they are from the venue and the next step; ability to retry (they may have just arrived) and the **request approval** path | Nothing, until a request is submitted |
| **No signal (offline)** | Punch is captured locally (location, selfie, original timestamp) and shown as **saved, waiting to sync**, with a visible pending marker. Worker is told they're on the clock | Appears when synced, marked as a queued punch, with original time |
| **Sync reveals a problem** (e.g., queued punch was outside fence, or timestamps look wrong) | Worker is **not** retroactively punished or surprised | The punch lands **flagged for review** rather than silently rejected |
| **Already clocked in elsewhere** | Told they have an active shift; only one active clock at a time | — |
| **Assignment removed while clocking in** | Told the assignment changed; directed to the admin | Event roster reflects removal |

### 8.5 Request admin approval (out-of-fence / can't-verify punch)
Because real venues have poor GPS (garages, covered drives, tall buildings, remote lots), a hard block with no escape would strand workers and cost the company coverage. **[DEFAULT — included as a minimal exception path; confirm]**
1. Worker chooses "Request approval to clock in".
2. They take the selfie and add a short note (e.g., "Garage level 3").
3. The request is sent with the location sample and the time of the request. Worker sees a **pending** state and can keep waiting or message the admin.
4. The admin gets an **attention item** and a push. They see: who, which event, how far outside, accuracy, selfie, note.
5. Admin **approves** → the punch is recorded as clocked in **at the time of the request** (the worker is not penalized for admin delay), flagged "approved override". Or **rejects** → worker notified, with an optional message.
6. Overrides are visible in hours review and on the roster; they are never invisible.

### 8.6 Clock-out flow
**Actor:** Staff. **Entry:** Active shift → Clock out.
1. Confirmation shows time worked so far, so an accidental tap is catchable.
2. Location sample is captured. **Outside the geofence at clock-out is allowed but flagged** — never trap a person who is leaving. **[DEFAULT]**
3. Selfie only if the tenant requires it at clock-out.
4. Success state shows total time worked for the shift.
5. Offline behavior is identical to clock-in (queue and sync with original time).

### 8.7 Missed clock-out
- At *event end + missing clock-out flag threshold*, the worker gets a push reminder. **[DEFAULT]**
- If still clocked in after a further interval, the assignment is flagged **Missing clock-out** and an attention item is raised for the admin.
- The system **does not auto-clock-out** in MVP **[DEFAULT]**; the admin resolves it in hours review by entering the actual end time with a required reason (audited).
- The worker may leave a **note** on the shift ("left at 11:15, forgot to clock out") that the admin sees in review. No worker-entered hours.

### 8.8 Anti-abuse expectations (design must not undermine)
- Selfie is live-captured and timestamped; admins can open it from the roster and from hours review.
- Locations are verified server-side as well as on the device; the device's own "inside" opinion is never the final word.
- Admin **sees**: inside/outside result, distance from the venue center, accuracy, and where the punch was taken relative to the fence. Admin does **not** see a live location trail (none exists).
- Retention period for selfies/locations is **[OPEN]**; design should allow deletion/expiry to be added.

---

## 9. The Live Board (admin's operational control room)

This is the surface the admin will have open on the day of events, often on a phone, often in a hurry. Treat it as the most important screen in the product.

### 9.1 The job it does
In three seconds the admin should be able to answer:
1. **Is every event I'm responsible for covered right now and for the next few hours?**
2. **What needs me, and how urgent is it?**
3. **Where is a specific person, and are they working?**

And then **act without leaving the screen** (message, assign, approve, correct).

### 9.2 Design principles for this surface
1. **Attention first, status second.** Calm when everything is fine; loud, specific, and ordered when it is not. A board where everything looks equally important is a failure.
2. **Honest data.** Only show what is true. Location in MVP is a punch-time snapshot, not live tracking. Never imply otherwise (see 9.9).
3. **Counts always reconcile.** For any event: arrived + expected-not-yet-here + open = required headcount. No ambiguity about who is covered.
4. **Resolve in place.** Every problem presented can be acted on from where it's shown.
5. **Stable under change.** Live updates must not make things jump while the admin is reading or tapping. New urgency should be noticeable without hijacking position.
6. **Glanceable on a phone** at an event, in sunlight, one-handed, and still dense enough on a desktop for six simultaneous venues.
7. **Time is first-class.** "Starts in 40 min", "late by 12 min", "on shift 3h 10m" matter more than raw timestamps.

### 9.3 Zoom levels (information architecture, not layout)
**Level 0 — The day pulse.** A small set of numbers at the top: events live now, staff on shift now, expected-but-not-arrived, open slots across upcoming events, items needing attention. Tapping any of these filters the board.

**Level 1 — Events.** One entry per event in scope, each summarizing *coverage* and *health* (9.4, 9.6).

**Level 2 — Event roster.** Every slot in the event, each with its state, person, and the evidence for that state (9.5). Open slots appear as explicit entries with actions, never as missing rows.

**Level 3 — Person.** From any slot: contact/message, today's assignments, clock history, selfie and punch evidence, reliability counts.

### 9.4 Event coverage representation (what must be communicable)
For each event, the admin should perceive at once:
- **Venue, window, and time context** — countdown to start, or elapsed/remaining time if live, or "overrun".
- **Coverage composition**, in three parts that sum to headcount:
  1. **On site** — clocked in and verified
  2. **Expected** — assigned, not yet clocked in (and whether that's still fine or already late)
  3. **Open** — slots with no one assigned
- **Health** — the event's overall condition (9.6), with the single most important reason.
- **Issues count** — flags needing a decision (override requests, late, missing clock-out).

How these are encoded visually is entirely the designer's call; all three coverage parts must be distinguishable and the sum must read as the headcount.

### 9.5 Person-in-slot states (each needs a distinct representation)

| State | Meaning | Key evidence/timers |
|---|---|---|
| **Open** | Slot unfilled | Time until start; actions: assign, broadcast |
| **Assigned — upcoming** | Confirmed, clock-in window not open | Time until window opens; "notifications off" indicator if applicable |
| **Due now** | Clock-in window open, not yet clocked in | Time until start |
| **Late** | Past start + grace, not clocked in | Minutes late; last message sent; one-tap message/call |
| **On site — verified** | Clocked in, inside fence | Clock-in time, selfie, distance/accuracy, time on shift |
| **On site — flagged** | Clocked in but with an issue (low accuracy, queued punch, approved override) | Which flag and why |
| **Waiting for approval** | Requested override, admin hasn't decided | How long they've waited; selfie + note; approve/reject |
| **Clocked out** | Done | In/out, total time |
| **Missing clock-out** | Past end + threshold, still clocked in | Overrun duration; actions |
| **No-show** | Admin marked | Who marked and when |
| **Dropped / removed** | Left the slot (history retained, slot reopened) | When, why, late-drop flag |

### 9.6 Event health states (derived; rules are fixed, wording/visuals are not)

| Health | Condition |
|---|---|
| **On track** | All slots filled; every assigned worker is either on site or not yet due |
| **Unfilled — upcoming** | Open slots exist; event not yet started (escalates as start approaches: 24 h → 4 h → at start) |
| **Short — live** | Event has started and slots are open, or workers who dropped/no-showed have not been replaced |
| **Running late** | One or more workers past start + grace without clocking in |
| **Needs a decision** | Pending override requests or other unresolved admin items |
| **Overrun** | Past end time with workers still clocked in |
| **Awaiting review** | Event completed; hours not yet approved |

An event can hold more than one condition; the board shows the **most urgent first** and the others as secondary. Urgency order (highest first): *Short — live* → *Running late / Waiting for approval* → *Unfilled — imminent* → *Overrun / Missing clock-out* → *Unfilled — later* → *Awaiting review* → *On track*.

### 9.7 Ways of seeing the day
| View | Purpose | Status |
|---|---|---|
| **By event** (default) | Coverage and health per event, attention first | **MVP — required** |
| **Day timeline** | Events across the day against a "now" marker; shows overlaps, workload peaks, and where gaps are coming | **[DEFAULT]** strongly recommended |
| **People** | Everyone on shift or expected right now, searchable by name — answers "is Marcus there yet?" when a venue calls | **[DEFAULT]** strongly recommended |
| **Map of venues** | Venues with event health, and (inside an event) *where punches were taken relative to the fence* | **Nice-to-have.** It's a supporting lens, not the primary view, because there is no live movement to show |

Time scope: **Today** by default, with the ability to look at other days. Past days are read-only history. Filters: venue, health, search by person.

### 9.8 The attention queue
A single, unified list of everything requiring an admin decision, shared across the tenant's admins. It feeds the Live Board prominence, a badge, and push notifications.

| Item type | Raised when | Resolution actions |
|---|---|---|
| Short-staffed | Open slots at 24 h, 4 h, and at start | Assign, broadcast, edit headcount |
| Late arrival | Worker past start + grace, not clocked in | Message, call, replace, mark no-show |
| Late drop | Worker dropped inside the cutoff | Assign replacement, broadcast |
| Approval request | Worker asked to clock in outside fence/low accuracy | Approve, reject (with message) |
| Missing clock-out | Past end + threshold | Correct punch, message worker |
| Overrun | Workers still clocked in past end | Extend event, message, force-close |
| Hours ready for review | Event completed | Open review |
| Invoice overdue | Past due date | Open invoice, record payment, send reminder |

Each item shows *what happened, how long ago, how long it has been unresolved*, and the resolving actions. Resolved items leave the queue; the history stays in the audit trail. Two admins must not silently work the same item twice: show when someone else has opened or resolved it.

### 9.9 Location honesty (important for UX copy and visuals)
- In MVP, "where" means **where the worker was when they punched**, shown as a verification result (inside/outside, distance, accuracy) with an optional map of the punch point and the fence.
- There is **no live position**, no movement, and no "last seen" after the punch. The board must never present stale punch data as current location.
- **[FUTURE]** When periodic in-shift check-ins arrive (native build or push-prompted), the person state gains a *freshness* concept ("verified 12 min ago", "stale"). Leave room for it, but don't build it now.

### 9.10 Actions available in place
From the board or roster, without navigating away: message a person; call them (using the device dialer); assign someone to an open slot; broadcast open slot(s); replace a worker; mark no-show; approve/reject an override request; open selfie/evidence; extend the event end time; open the event. Every action that changes the state of an event, slot, or punch is logged with the acting admin.

Destructive or consequential actions (remove staff, mark no-show, cancel) require a confirmation that states the consequence in words.

### 9.11 Real-time behavior and trust
- Updates stream live. The board shows when it was last updated and whether it is connected.
- If the admin goes offline, the board remains readable but is **clearly marked stale**; no action that depends on live data should appear to succeed silently while offline.
- Changes made by another admin appear, with attribution, without jumping the layout under the cursor.
- New attention items are noticeable (including a push when the app isn't focused) but don't reorder what the admin is currently interacting with.

### 9.12 Quiet and edge states
- **Nothing today:** show the next upcoming event, not a blank page; offer "create event".
- **Everything on track:** the board should feel calm; the pulse numbers carry the reassurance.
- **Scale assumption:** a startup valet company, likely tens of events per week early on, peaking to roughly **10–15 concurrent events and a few hundred staff** on the busiest nights. The board must stay readable at the top of that range.
- **Event just ended:** it moves from live to "Awaiting review" instead of vanishing.
- **Venue contact calls and the admin has 20 seconds:** the fastest path from "phone rings" to "I know who's there" is the People view or search.

### 9.13 Scenarios the design should be tested against
1. **Friday 6 PM, six events live.** One hotel is short by two; one restaurant has a worker 12 minutes late; the rest are fine. Can the admin find and fix both problems in under a minute from a phone?
2. **A garage with bad GPS.** A worker can't clock in; sends an approval request with a selfie. The admin approves from a push while driving between venues (as a passenger). Is the path short and are the consequences clear?
3. **A worker drops 90 minutes before start.** The admin is alerted as a late drop, broadcasts the slot, one worker claims it, and the board updates without the admin refreshing.
4. **Venue calls: "Where's our second attendant?"** Admin finds the person, sees they're late by 18 minutes, messages them, and sees the message delivered, all within one flow.
5. **End of night.** Five events complete; the admin moves from the board straight into reviewing hours without losing context.

---

## 10. User flows — hours review and invoicing

### 10.1 Hours review and approval
**Actor:** Admin. **Entry:** "Hours ready for review" attention item, an event in "Completed (needs review)", or the review queue.

**What the admin is deciding:** for each worker on the event, *are these hours correct, and can we bill them?*

**Per-worker row must make visible:**
- Scheduled window vs **actual in/out**, and resulting hours
- **Flags:** late arrival, missing clock-out, out-of-fence or low-accuracy punch, queued/offline punch, approved override, no-show, early clock-in
- **Evidence:** arrival selfie, punch location relative to the fence, worker's note
- **Edit history** if any

**Steps:**
1. Open the event's review (or work through a queue of events).
2. Resolve flagged rows: correct a time (**reason required**, audited with before/after and who), add a missing punch (e.g., worker never clocked in but demonstrably worked) **[OPEN: how strict is "demonstrably"]**, mark no-show, or accept as is.
3. **Approve clean rows in bulk** ("approve all without flags") so the common case is fast; flagged rows demand an individual decision.
4. When every row is resolved, **approve the event's hours** → status **Hours approved** → "Create invoice" becomes the primary next action.

**Rules:**
- **Clock data is the only source of billable hours.** Admin edits are allowed but always carry a reason and appear in the audit trail. Workers cannot enter or change hours.
- Approved hours can be reopened **until an invoice is sent**. After send, they are locked (10.5).
- Early-arrival and rounding treatment is a **billing rule** **[OPEN: do minutes before scheduled start count? rounding increment?]**; the review screen should always show scheduled vs actual so the admin can see what a rule did.
- A worker with no punches and no admin resolution blocks approval of the event, so nothing is invoiced by accident.

### 10.2 Billing rules (inputs to the invoice total)
Configured at tenant level with optional per-venue override. **[DEFAULT]** capabilities (specific values are the client's):
- **Bill rate** per hour (venue default, overridable per event) — separate from every worker's pay rate.
- **Minimum billable hours** — **[OPEN: per worker per event, or per event?]**
- **Overtime** — threshold and multiplier **[DEFAULT]**
- **Holiday** — multiplier, applied when the event is flagged as a holiday
- **Flat fees** — fixed lines (e.g., setup fee) added to an invoice
- Billable hours derive only from approved hours.

### 10.3 Create and send an invoice (one per event in MVP)
**Actor:** Admin. **Entry:** Event with Hours approved → Create invoice; or the Invoices area.
**Steps:**
1. System **drafts** the invoice from approved hours and billing rules: event, date, venue, **requested vs actual headcount**, **hours per worker**, line totals, fees, grand total, invoice number, terms, due date.
2. Admin **previews it exactly as the venue will see it** (the PDF), with tenant branding.
3. Admin may add/remove fee lines or adjustments (each requires a short description). Edits to *hours* go back through review, not through the invoice.
4. Confirm **recipient(s)** — venue billing contact(s); if none exist, the admin is prompted to add one first.
5. **Send** — a confirmation states that **hours will lock**. On send: invoice emailed to the venue with the PDF and a **secure view link**; event status → **Invoiced**; hours locked.
6. The admin gets confirmation, and the invoice appears in the invoice list with its timeline.

**What the venue sees:** event, date, requested vs actual headcount, per-worker hours, rates charged, totals, terms, due date, tenant branding, how to pay (tenant-provided text). **Never** pay rates or internal flags.
**Edge cases:** Missing/invalid billing email; send failure/bounce (surfaced to admin, not silent); event with zero billable hours (cannot invoice); sending to multiple contacts.

### 10.4 Invoice tracking and reminders
**Statuses:** Draft → **Sent** → **Viewed** (venue opened the secure link) → **Paid**; **Overdue** is derived after the due date.
- **Paid:** admin records payment manually (date, amount, method/reference). Partial payments **[OPEN]**.
- **Automated reminders** to the venue by email on the tenant's schedule (default: 3 days before due, on due date, +7, +14). Admin can pause reminders per invoice and can send a manual reminder.
- Overdue invoices raise an attention item.
- The invoice detail shows a **timeline**: created, sent (to whom), viewed (when), reminders sent, payment recorded, memos issued.
- **Invoice list** supports status filters, venue filter, search, and clear "outstanding" and "overdue" totals.

### 10.5 After the invoice is sent (locking and corrections)
- Hours for that event are **locked**. The admin cannot edit punches or approved hours.
- Mistakes are corrected through a **credit memo** (reduces what's owed) or **debit memo** (adds), each tied to the original invoice, with a reason, and sent to the venue like an invoice. The original is never silently altered.
- Voiding an invoice and reissuing is **[OPEN]**; design the invoice detail so a "void/reissue" path could be added without restructuring.

### 10.6 Hours export for payroll
- Admin can export **approved hours** by date range (and by worker/venue) as a file for the client's existing payroll tool. Payroll itself is out of scope.
- Export includes worker, event, venue, approved in/out, hours, and pay rate in effect.

---

## 11. Messaging and notifications

Two different things; the design should keep them distinct:
- **Conversations** — human messages (admin ↔ staff, broadcasts).
- **Notifications** — system events pushed to people (and listed in an in-app notification center).

### 11.1 One-to-one chat
- Each staff member has **one running thread** with the tenant's admins **[DEFAULT]**; any admin can reply and the staff member sees who replied. Messages can reference an event (so context isn't lost: "re: Grand Hotel, Sat").
- Admin has an **inbox** of threads: unread first, searchable by person, filterable (unread, needs reply). From the Live Board and staff profile, "message" lands in the right thread.
- Message content: text, with **image attachments** **[DEFAULT]** (e.g., a parking map or a photo of an issue). Delivered/read state is visible to the sender.
- Staff see one conversation with "the company/dispatch", not a list of individual admins' threads **[DEFAULT]**.

### 11.2 Broadcasts
**Actor:** Admin. **Entry:** Messaging area, or from an event ("broadcast open slots").
**Steps:**
1. Choose **audience:** all active staff, an event's assigned crew, **eligible staff for an open slot** (active, not double-booked), a tag/group, or hand-picked individuals.
2. Compose; optionally attach an **event** so recipients can open it directly (and claim, if slots are open).
3. **Preview recipient count** (and who is excluded and why, e.g., notifications off).
4. Send. The admin sees **delivery and read counts**.

**Rules:** Broadcasts are **one-way announcements**; a recipient's reply goes into their **own private thread** with the admin, not into a group. Staff with notifications off still get the message in-app; the admin sees who may not have been alerted.

### 11.3 Automated notifications (push + in-app notification center)
There is **no SMS fallback in MVP**; push plus an in-app notification center (the source of truth) is the entire reach. This makes the onboarding steps for install and push critical, and makes "can this person actually be reached?" a visible fact for admins.

| Trigger | Recipient | Notes |
|---|---|---|
| Event published with open slots | Eligible staff | Deep-links to the event to claim |
| Assigned to an event by admin | That staff member | |
| Slot claimed | Admin; claimer gets confirmation | |
| Event fully filled | Admin | |
| Short-staffed (24 h, 4 h, at start) | Admin | Escalating urgency |
| Shift reminders (24 h, 1 h) | Assigned staff | |
| Clock-in window opened | Assigned staff **[DEFAULT]** | Optional |
| Late (start + grace, not clocked in) | Staff (nudge), then admin | |
| Schedule change / venue change | Affected staff | |
| Event cancelled | Affected staff | |
| Removed from an event | That staff member | |
| Slot dropped (flag if late) | Admin | Urgent if inside cutoff |
| Open slot re-opened | Eligible staff **[DEFAULT]** | |
| Override/approval request | Admin | |
| Override decision | Requesting staff | |
| Missing clock-out | Staff, then admin | |
| Hours ready for review | Admin | |
| Invoice sent / viewed / overdue | Admin | Venue gets email separately |
| New chat message | Recipient | |
| Broadcast | Audience | |

Design needs: per-user notification preferences (what is allowed, quiet hours **[FUTURE]**), grouping to avoid notification floods on busy nights, and notifications that **deep-link to the exact item** (event, shift, thread, approval request).

**[OPEN]** Whether critical notifications (e.g., "you've been assigned", "event cancelled") should also go by **email** as a safety net given no SMS.

---

## 12. Cross-cutting requirements

**Audit trail.** Record who/when/what/before-after (and reason where required) for: assignments and removals, punch edits and overrides, hours approval, invoice send/void/memos, rate changes, settings changes, and view-as sessions. Admins can see the history relevant to the object they're viewing (e.g., an hours row's edit history).

**Permissions and privacy.** Location read only at punch; consent timestamped; selfies and punch locations visible to admins only; bill/pay rate separation enforced everywhere, including notifications and PDFs. Selfie/location retention and deletion policy **[OPEN]**.

**Worker classification sensitivity.** If workers are 1099 contractors, heavy control (continuous tracking, rigid rules) can resemble employment. The MVP's punch-time-only location model is deliberately light-touch; copy in consent and onboarding should be factual and non-coercive. The client should get an employment attorney's view before launch **[OPEN: W-2 vs 1099 for this client]**.

**Offline and sync.** Staff: shifts viewable offline; punches queue with original timestamps and sync automatically with clear pending/synced/failed states. Conflicts (e.g., assignment removed while offline) must resolve to a *flag for admin review*, not a silent discard.

**Errors and empty states.** Every list needs a designed empty state that points to the next action (no venues, no staff, no events, no open events, no messages, no invoices). Every permission failure (location, camera, notifications) needs an explanation and a fix path.

**Accessibility and context of use.** Outdoor readability, large tap targets for quick one-handed use, plain language for staff (assume mixed literacy and languages; **[OPEN: multilingual needs, e.g., Spanish]**), and never relying on color alone to carry meaning on the board.

**Data portability.** The tenant can export its data (staff, venues, events, hours, invoices) — required for client trust and vendor-exit safety.

**Time.** Venue-local times everywhere; clear handling of overnight events and daylight-saving transitions.

---

## 13. Open decisions (do not resolve in design; design so either answer works)

1. **Staff sign-in method** without SMS (email magic link/code vs password vs both).
2. **Staff seeing their own pay rate**, and whether co-workers on an event are visible to each other.
3. **Billing rules specifics:** minimum hours per worker vs per event; early-arrival minutes; rounding.
4. **GPS accuracy threshold** for auto-verification, and default geofence radius validation with real venues.
5. **Mark no-show and slot reopening** when the event is already live.
6. **Worker-entered corrections:** note-only (current) vs request-a-correction flow.
7. **Invoice void/reissue** and **partial payments.**
8. **Email as a safety net** for critical notifications.
9. **Retention policy** for selfies and location samples.
10. **W-2 vs 1099** for the first client (compliance review).
11. **Bulk staff import** need at launch.
12. **Languages** staff need.
13. **Request-approval path** (8.5) — included as a minimal exception path; confirm the product owner wants it in MVP.

---

## 14. Future hooks (don't build; don't block)

- **SMS** via REM's own telephony as a fallback channel for push (A2P registration and opt-in required first).
- **Periodic in-shift check-ins** → adds *freshness* to person states on the Live Board.
- **Background tracking and auto-detected arrival** → native (Capacitor) build only, subject to OS permissions, store review, and the scope/compliance discussion above.
- **Waitlist and auto-backfill** when a worker drops or no-shows.
- **Recurring events** and event templates.
- **Venue read-only portal** and batched weekly/monthly invoices.
- **Accounting sync** (QuickBooks/Xero), **online invoice payment.**
- **Reporting** (fill rate, reliability, revenue by venue) and per-tenant analytics.
- **Native app builds** from the same codebase; any native-only capability must sit behind the same interfaces (location, camera, push, storage) used by the PWA.

---

## 15. Glossary

- **Tenant** — a client valet/staffing company using the platform.
- **Venue** — a place the tenant serves and bills (hotel, restaurant, event site).
- **Event** — a job at a venue with a time window and headcount.
- **Slot** — one required worker position within an event.
- **Assignment** — a staff member holding a slot (assigned by admin or claimed).
- **Punch** — a clock-in or clock-out record with location and (at clock-in) selfie.
- **Geofence** — the circular area around a venue within which a clock-in is valid.
- **Override** — an admin-approved clock-in that failed automatic verification.
- **Attention queue** — the unified list of items needing an admin decision.
- **Hours approval** — admin confirmation that an event's hours are billable.
- **Lock** — hours become uneditable once an invoice is sent.
- **Credit/debit memo** — post-send correction document tied to an invoice.
- **View-as** — platform admin viewing a tenant's account for support.
