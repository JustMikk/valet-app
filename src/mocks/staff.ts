// Illustrative staff-app data from the design export (Regency Valet Parking tenant). Typed
// fixtures stand in for the data layer until repositories exist (docs/DECISIONS.md ADR-011).
import type { NotificationItem, OpenShift, ShiftCard, UpNext } from "@/lib/data/staff/schemas"
import type { StatusSpec } from "@/lib/status/presets"

export const STAFF_USER = {
  initials: "JE",
  name: "Jordan Ellis",
  role: "Valet attendant",
  email: "jordan.ellis@gmail.com",
  company: "Regency Valet Parking",
  phone: "(415) 555-0123",
} as const

export const TONIGHT = {
  venue: "The Grand Hotel",
  address: "400 Market St, San Francisco",
  mapsUrl: "https://maps.google.com/?q=400+Market+St+San+Francisco",
  contact: { text: "Ask for Priya, front desk", name: "Priya", tel: "+14155550142" },
  dress: "Black suit, no sneakers · east lot, B1",
  when: "Fri Oct 23 · 6:00 – 11:00 PM · venue time (PT)",
  /** Seconds on shift in the "on the clock" demo state (2:14:07). */
  demoElapsedSecs: 8047,
  /** Scheduled shift length in seconds (5 h 9 m) for the progress bar. */
  scheduledSecs: 18540,
} as const

export const UP_NEXT: Omit<UpNext, "assignmentId">[] = [
  { dow: "SAT", day: "24", venue: "Harbor Pavilion · Wedding", time: "4:00 – 11:30 PM" },
  { dow: "TUE", day: "27", venue: "Osteria Nove", time: "5:30 – 10:30 PM" },
]

type ShiftFixture = Omit<ShiftCard, "isTonight">

const confirmed: StatusSpec = {
  tone: "subtle",
  icon: "event_available",
  filled: true,
  label: "Confirmed",
}
const approved: StatusSpec = { tone: "ok", icon: "check_circle", filled: true, label: "Approved" }

export const UPCOMING_SHIFTS: ShiftFixture[] = [
  {
    id: "tonight",
    status: { tone: "strong", icon: "timer", filled: true, label: "Today · on now" },
    date: "Fri Oct 23",
    venue: "The Grand Hotel",
    time: "6:00 – 11:00 PM",
    right: "5h",
  },
  {
    id: "harbor",
    status: confirmed,
    date: "Sat Oct 24",
    venue: "Harbor Pavilion · Wedding",
    time: "4:00 – 11:30 PM",
    right: "7h 30m",
  },
  {
    id: "osteria",
    status: confirmed,
    date: "Tue Oct 27",
    venue: "Osteria Nove",
    time: "5:30 – 10:30 PM",
    right: "5h",
  },
  {
    id: "maison",
    status: { tone: "subtle", icon: "bolt", filled: true, label: "Claimed" },
    date: "Sat Oct 31",
    venue: "Maison Blanc · Halloween",
    time: "7:00 PM – 1:00 AM",
    right: "6h",
  },
]

export const PAST_SHIFTS: ShiftFixture[] = [
  {
    id: "past-1",
    status: approved,
    date: "Thu Oct 22",
    venue: "Maison Blanc",
    time: "In 5:52 PM · Out 11:04 PM",
    right: "5h 12m",
  },
  {
    id: "past-2",
    status: { tone: "subtle", icon: "hourglass_top", filled: true, label: "In review" },
    date: "Tue Oct 20",
    venue: "Osteria Nove",
    time: "In 5:41 PM · Out 10:33 PM",
    right: "4h 52m",
  },
  {
    id: "past-3",
    status: approved,
    date: "Sat Oct 17",
    venue: "Westfield Gala",
    time: "In 7:48 PM · Out 12:06 AM",
    right: "4h 18m",
  },
]

export const HARBOR_DETAIL = {
  statusLabel: "Confirmed · Sat Oct 24",
  start: "4:00 PM",
  title: "Harbor Pavilion · Wedding",
  when: "4:00 – 11:30 PM · 7h 30m · venue time (PT)",
  clockNotice: "Clock-in opens Sat 3:45 PM, 15 min before start.",
  address: "Pier 3, The Embarcadero",
  mapsUrl: "https://maps.google.com/?q=Pier+3+The+Embarcadero",
  report: { text: "Report to Marco, events lead", name: "Marco", tel: "+14155550199" },
  crew: "Crew of 8 attendants",
  instructions:
    "Black suit, white shirt, no sneakers. Park personal cars in Lot C (north side). Key box is at the valet podium; sign keys out with Marco. Guest arrival peaks 4:30–5:30 PM.",
  dropVenue: "Harbor Pavilion",
  dropWhen: "Sat Oct 24 · 4:00 – 11:30 PM",
} as const

export const DROP_REASONS = [
  { key: "sick", label: "I’m sick", icon: "sick" },
  { key: "ride", label: "Transport problem", icon: "directions_car" },
  { key: "family", label: "Family emergency", icon: "family_restroom" },
  { key: "other", label: "Something else", icon: "more_horiz" },
] as const

export type ClaimOutcome = "claimed" | "filled" | "overlap"
type OpenShiftFixture = OpenShift & { outcome: ClaimOutcome }

export const OPEN_SHIFTS: OpenShiftFixture[] = [
  {
    id: "laurel",
    date: "FRI OCT 23 · TONIGHT",
    venue: "The Laurel Club",
    time: "7:30 PM – 1:00 AM · 5h 30m",
    spots: 2,
    conflict: "Overlaps your Grand Hotel shift (6–11 PM)",
    outcome: "overlap",
  },
  {
    id: "brunch",
    date: "SUN OCT 25",
    venue: "Harbor Pavilion · Brunch",
    time: "10:00 AM – 3:00 PM · 5h",
    spots: 3,
    outcome: "claimed",
  },
  {
    id: "grand-wed",
    date: "WED OCT 28",
    venue: "The Grand Hotel",
    time: "5:00 – 10:00 PM · 5h",
    spots: 1,
    outcome: "filled",
  },
  {
    id: "halloween",
    date: "SAT OCT 31",
    venue: "Maison Blanc · Halloween",
    time: "7:00 PM – 1:00 AM · 6h",
    spots: 4,
    outcome: "claimed",
  },
]

export type ChatFixture =
  | { kind: "day"; text: string }
  | {
      kind: "message"
      who?: string
      text: string
      ref?: string
      img?: string
      event?: string
      meta: string
      from: "them" | "me" | "broadcast"
    }

export const CHAT_MESSAGES: ChatFixture[] = [
  { kind: "day", text: "TODAY · FRI OCT 23" },
  {
    kind: "message",
    who: "Jamie · Dispatch",
    text: "Hi Jordan, Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
    ref: "re: The Grand Hotel · Fri",
    meta: "2:10 PM",
    from: "them",
  },
  { kind: "message", text: "Got it, thanks! See you there.", meta: "2:14 PM · Read", from: "me" },
  {
    kind: "message",
    who: "Announcement to all staff",
    text: "Halloween at Maison Blanc needs 4 more attendants. Costumes optional, black suit required.",
    event: "Maison Blanc · Halloween",
    meta: "3:00 PM · broadcast · replies come here",
    from: "broadcast",
  },
  {
    kind: "message",
    who: "Alex · Dispatch",
    text: "Use the side entrance on Mission St. Front drive is blocked until 6:30.",
    img: "PHOTO · PARKING MAP",
    meta: "5:38 PM",
    from: "them",
  },
]

export const NOTIFICATION_GROUPS: {
  label: string
  items: Omit<NotificationItem, "id" | "unread">[]
}[] = [
  {
    label: "TODAY",
    items: [
      {
        icon: "timer",
        tone: "accent",
        title: "Clock-in is open",
        body: "The Grand Hotel starts at 6:00 PM. Tap to clock in.",
        time: "5:45 PM",
        href: "/staff",
      },
      {
        icon: "chat_bubble",
        tone: "info",
        title: "New message from Alex",
        body: "Use the side entrance on Mission St…",
        time: "5:38 PM",
        href: "/staff/inbox",
      },
      {
        icon: "add_circle",
        tone: "ok",
        title: "New open shift · 4 spots",
        body: "Maison Blanc · Halloween, Sat Oct 31, 7 PM – 1 AM",
        time: "3:00 PM",
        href: "/staff/open",
      },
    ],
  },
  {
    label: "EARLIER",
    items: [
      {
        icon: "edit_calendar",
        tone: "warn",
        title: "Schedule change",
        body: "Osteria Nove on Tue Oct 27 now starts 5:30 PM (was 6:00 PM).",
        time: "Thu",
        href: "/staff/shifts/detail",
      },
      {
        icon: "check_circle",
        tone: "ok",
        title: "Hours approved",
        body: "Maison Blanc, Thu Oct 22 · 5h 12m",
        time: "Thu",
        href: "/staff/shifts",
      },
      {
        icon: "event_available",
        tone: "info",
        title: "You were assigned",
        body: "Harbor Pavilion · Wedding, Sat Oct 24",
        time: "Wed",
        href: "/staff/shifts/detail",
      },
    ],
  },
]

export const NOTIFY_PREFS = [
  { key: "open", label: "New open shifts", note: "When a shift you can claim is posted" },
  { key: "remind", label: "Shift reminders", note: "24 hours and 1 hour before" },
  { key: "msg", label: "Messages", note: "From dispatch" },
  {
    key: "change",
    label: "Changes & cancellations",
    note: "Always on, since these affect your shifts",
    locked: true,
  },
] as const
