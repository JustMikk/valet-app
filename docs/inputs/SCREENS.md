# Screens, Layout & Behavior

## Responsive shell (both roles)
Breakpoints by viewport width: **phone < 700px**, **tablet 700–1099px**, **desktop ≥ 1100px**.
- **Phone**: floating glass top bar (56px pills, 20px from edges, below safe area): left = logo + title pill on root pages / back button on child pages; right = avatar. Floating glass tab bar: 76px tall, 16px side inset, 24px from bottom, radius 999, 7px padding, active tab = `--surface` pill. Icons 25–26px + 11–12px 600 label; count badges top-right.
- **Tablet**: 84px icon rail on the left (glass `--card`, right border `--line`), items 46–48px, active = `--chrome` + `--shadow`. No tab bar.
- **Desktop**: 240–248px labelled sidebar (logo + product name, nav items with label + badge, user block at bottom). Child pages show a glass "Back" pill above content.
- Bottom sheets on phone become **centered dialogs** (440–480px wide, radius 28) on tablet/desktop, over `rgba(0,0,0,.4)` scrim.
- Multi-column at desktop: lists → 2–3 column card grids; detail pages → `1.2–1.4fr / 1fr` split; tables get a header row.

## Staff — navigation
Tabs: **Home · Shifts · Open (badge) · Inbox**. Profile via avatar. Clock-in and onboarding are full-screen on phone; clock-in is a centered 440×≤800 card on wider screens.

### S-Onboarding (`Staff Onboarding`)
Steps: invite → sign in (email) → 6-digit code → confirm profile → location primer → install to Home Screen (iPhone / Android segmented tabs, 3 step cards) → notifications primer (shows sample push card) → done. Progress: back button + 6 segment bar + "n of 6". Skip on push sets a Profile warning banner. Desktop: 480px glass card centered on accent glow; extra "Continue on your phone" step with QR.
Copy principle: always state *why* (location read only at clock in/out; no SMS backup, push is how we reach you).

### S-Home (`Staff Home`)
Modes: `before` (clock-in opens 15 min before start; disabled button + note), `due` (accent "Clock in" CTA with shine), `onshift` (live h:mm:ss timer, progress bar, "Clock out" → confirm sheet). Content: status badge, hero time, venue + date, rows (address → Directions, contact → call button, dress code, Shift details). "Up next" list (date tile 52×52 radius 16). Dark "Open shifts" promo card (#0E0F12 + accent radial glow). Optional banners: push off (warn), offline sync pending (neutral), install prompt. Phone: CTA docks above tab bar; tablet/desktop: CTA inside hero glass card, desktop 2-column.

### S-Clock-in flow (`Staff Clock`)
`locating` (pulse rings, live accuracy chip "±18 m · need ±75 m") → inside fence → `camera` (oval face guide, live chip "Inside · 38 m") → `confirm` sheet (time, venue, location ✓, selfie ✓; Retake / Clock in) → `success` (pop check, rows).
Branches: `outside` (distance hero "420 m", snapshot map, Try again / Request approval) → `approval` (selfie card, preset reason chips + note; time counted from request) → `pending` (spinner ring, wait timer); `denied` (location permission off, 3 numbered fix steps); `offline` (saved on device with original timestamp, "waiting to sync" chip); `outdone` (clock-out summary).

### S-Shifts (`Staff Shifts`)
List with Upcoming / Past underline tabs; cards show status badge, date, venue, time, duration (past: approval state). Detail: badge, hero time, venue, clock-in window notice, rows, instructions card, Message dispatch, "Can't make it". Drop: late-drop warning (<24h), reason options (required), note, Keep / Drop (red). Open shifts: cards with spots-left chip (warn at 1), overlap conflict line disables claim, accent "Claim shift". Results: claimed / just filled / overlap / dropped.

### S-Account (`Staff Account`)
Inbox: single dispatch thread; bubbles (them = surface, me = fg/bg, announcement = accent-soft + accent outline with embedded claimable event card, photo attachments); delivery states Sending… → Delivered → Read by Jamie. Composer = glass pill (attach, input, send turns accent when text present). Notifications: grouped Today / Earlier, tone-coded icon circles, each deep-links. Profile: permissions health (fix button when off), notification prefs toggles (changes/cancellations locked on), language, theme, sign out.

## Admin — navigation
Phone tabs: **Live · Events · Hours · Inbox · More** (More sheet = Staff, Venues, Invoices, Settings, 2×2 tiles). Tablet/desktop sidebar lists all 8.

### A-Live Board (`Live Board`, variant `a` phone/tablet, `desktop` ≥1100)
"Need you" count first; attention cards resolved in place (approve outside-fence, call late staff); events with coverage bars (on site = ok green, confirmed = fg, remaining = surface-2). Desktop: wide board. "New event" → New event.

### A-Events / Event / New event (`Admin Pages`)
Events: filter pills (Upcoming, Short-staffed n, Drafts n, Past), grouped by day, cards with status chip (Live / n open / Full / Draft), time in mono, 8px coverage bar, "n unfilled". Event: live badge, stats tiles (On site, Need you, Unfilled), crew rows (avatar, detail, status chip, inline action Review / Call), dashed open-spot rows, Add staff → fill sheet (multi-select available staff), instructions card, Message crew, Venue & geofence, Cancel event. New event: venue/date/time/name fields, staff-needed stepper, instructions, fill mode (Post as open / Assign now), Save draft / Publish.

### A-Staff / Person
Search, filter pills, rows (phone: name+email / chip; desktop table: Name, Status, Next shift, This week). Invite sheet (email chips). Person: call/message, details rows, recent shifts, Deactivate.

### A-Venues / Venue
Card grid with mini geofence map. Venue: map with animated radius ring, radius presets 100/150/250/400 m, contact, dress code, bill rate, Save.

### A-Hours
Pay-period header; "Approve 18 clean entries" bulk bar; flagged entry cards (in/out tiles, flag reason in warn, Adjust / Approve). Adjust sheet: edit in/out, required reason shared with staff, Save & approve. Approved state fades card and shows confirmation line.

### A-Invoices / Invoice
Table (Venue · period, Status chip, Hours, Amount). Invoice: glass document card, line items (event, staff × hours × rate), total, warning for hours still in review, PDF / Send (turns ok green with confirmation).

### A-Inbox / Announcement
Desktop two-pane (threads 280–360px + conversation); phone list → thread. Announcement: audience pills (crew / tonight / all), message, reach note (who has push off), Send.

### A-Settings
Branding (logo, accent swatches — live recolor), clock-in rules (window, default geofence, accuracy, selfie toggle, early clock-out flag toggle).

## State (minimum)
- Shell: `route`, `history[]`, `theme` (light/dark/system), `accent`, breakpoint from viewport width.
- Staff: shift `mode` (before/due/onshift), elapsed seconds, clock-in `step`, location result {inside, distance, accuracy}, selfie blob, offline queue (preserve device timestamps), push/location/camera/install permission states, draft message + delivery status.
- Admin: events with need/confirmed/onSite counts, roster statuses (on site / approval / late / expected), approval requests, hours entries + flags + approval state, venues + radius, invoices, threads, tenant settings.

## Assets
- `designs/assets/regency-logo.png` — tenant logo (user supplied).
- Fonts: Google Fonts — Bricolage Grotesque, Onest, Geist Mono; Material Symbols Rounded.
- Maps, selfies, QR and photo attachments are placeholders — replace with real map tiles (e.g. Mapbox/Google), live camera, generated QR.

## Files
- `designs/Staff PWA.dc.html` — staff shell, tokens, routing, responsive nav
- `designs/Staff Home|Clock|Shifts|Account|Onboarding.dc.html` — staff pages
- `designs/Admin.dc.html` — admin shell, tokens, nav
- `designs/Admin Pages.dc.html` — all admin pages except Live Board
- `designs/Live Board.dc.html` — Live Board (phone `a`, `desktop`)
- `designs/Design System.dc.html` — component/token reference sheet
- `designs/Valet Build.dc.html` — overview canvas of all screens
- `product-spec.md` — original product & flow spec
