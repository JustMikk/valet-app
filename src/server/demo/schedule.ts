// The demo's events and who is doing what in each, relative to "now" so the Live Board always has
// a real mix of states: clocked in, waiting for approval, late, due, upcoming, open.
import { wallTime, zonedInstant } from "@/lib/time/labels"

import { TZ, type VenueKey } from "./cast"

export type Scenario = "before" | "due" | "onshift"

const MIN = 60_000
const HOUR = 3_600_000

/** A punch an on-site worker already made, in minutes relative to the event start. */
export type InPunch = {
  at: number
  dist: number
  acc: number
  /** Minutes the phone was offline before this punch synced (it lands flagged). */
  syncedLateMin?: number
  /** Approved by dispatch from outside the fence (an override). */
  override?: boolean
}
export type PendingPunch = { dist: number; acc: number; note: string; waitedMin: number }

/** Finished work: in-minute relative to start, out-minute relative to end (null: never clocked out). */
export type Worked = {
  in: number
  out: number | null
  approved?: boolean
  inPunch?: Omit<InPunch, "at">
  /** The worker's note on leaving. */
  note?: string
}

export type Held = {
  who: string
  claimed?: boolean
  /** Today's clock-in (applied once the clock-in window has opened). */
  on?: InPunch
  pending?: PendingPunch
  worked?: Worked
  /** The demo worker: their clock state follows the chosen scenario instead. */
  scenarioDriven?: boolean
}
export type OpenSlot = { open: true; dropped?: { by: string; minsBeforeStart: number } }
export type SlotSpec = Held | OpenSlot

export type EventSpec = {
  key: string
  venue: VenueKey
  /** Shown to staff: "Harbor Pavilion · Wedding". */
  title: string
  kind: string
  start: Date
  end: Date
  status: "published" | "draft"
  contact: [text: string, name: string, tel: string]
  dress: string
  instructions: string
  slots: SlotSpec[]
  postedDaysAgo?: number
}

const held = (who: string, extra: Omit<Held, "who"> = {}): Held => ({ who, ...extra })
const open = (dropped?: OpenSlot["dropped"]): OpenSlot => ({ open: true, dropped })
const inAt = (at: number, dist: number, acc: number, extra: Partial<InPunch> = {}): InPunch => ({
  at,
  dist,
  acc,
  ...extra,
})

const PRIYA: EventSpec["contact"] = ["Ask for Priya, front desk", "Priya", "+14155550142"]
const MARCO: EventSpec["contact"] = ["Report to Marco, events lead", "Marco", "+14155550199"]
const CAMILLE: EventSpec["contact"] = ["Ask for Camille, front of house", "Camille", "+14155550163"]
const ELENA: EventSpec["contact"] = ["Ask for Elena, host stand", "Elena", "+14155550177"]
const DANI: EventSpec["contact"] = ["Ask for Dani, door", "Dani", "+14155550155"]
const INES: EventSpec["contact"] = ["Ask for Ines, events desk", "Ines", "+14155550188"]

const CLEAN = (name: string, i: number): Held =>
  held(name, {
    worked: { in: -(6 + (i % 5)), out: 3 + (i % 4), inPunch: { dist: 15 + i * 4, acc: 8 + i } },
  })

export function buildSchedule(now: Date, scenario: Scenario): EventSpec[] {
  const today = wallTime(now, TZ)
  const day = (days: number, hour: number, minute = 0) =>
    zonedInstant(TZ, { year: today.year, month: today.month, day: today.day + days, hour, minute })
  const rounded = (offsetMin: number) =>
    new Date(Math.floor((now.getTime() + offsetMin * MIN) / MIN) * MIN)
  const plus = (date: Date, hours: number) => new Date(date.getTime() + hours * HOUR)

  const tonight = rounded(scenario === "due" ? 12 : scenario === "before" ? 105 : -125)
  const osteriaStart = rounded(-19)
  const harborStart = rounded(-124)
  const maisonStart = rounded(-4)
  const laurelStart = new Date(Math.max(tonight.getTime() + 90 * MIN, now.getTime() + 30 * MIN))

  return [
    {
      key: "tonight",
      venue: "grand",
      title: "The Grand Hotel",
      kind: "Corporate dinner",
      start: tonight,
      end: plus(tonight, 5),
      status: "published",
      contact: PRIYA,
      dress: "Black suit, no sneakers · east lot, B1",
      instructions:
        "Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
      slots: [
        held("Jordan Ellis", { scenarioDriven: true }),
        held("Maya Patel", { on: inAt(-14, 22, 9) }),
        held("Devon Kim", { on: inAt(-13, 61, 40) }),
        held("Luis Torres", {
          pending: { dist: 420, acc: 38, note: "Garage level 3", waitedMin: 8 },
        }),
        held("Ari Brooks"),
        held("Sam Rivera"),
        open({ by: "Cole Bennett", minsBeforeStart: 48 }),
        open(),
      ],
    },
    {
      key: "osteria-live",
      venue: "osteria",
      title: "Osteria Nove · Dinner service",
      kind: "Dinner service",
      start: osteriaStart,
      end: plus(osteriaStart, 4.75),
      status: "published",
      contact: ELENA,
      dress: "Black shirt and slacks",
      instructions: "Street valet on Valencia. Keys stay at the stand.",
      slots: [
        held("Marcus Reed"),
        held("Keisha Grant", { on: inAt(-6, 14, 8) }),
        held("Tom Byrne", { on: inAt(-4, 30, 15) }),
      ],
    },
    {
      key: "harbor-live",
      venue: "harbor",
      title: "Harbor Pavilion · Sunset reception",
      kind: "Reception",
      start: harborStart,
      end: plus(harborStart, 7.5),
      status: "published",
      contact: MARCO,
      dress: "Black suit, white shirt, no sneakers · Lot C",
      instructions: "Park personal cars in Lot C (north side). Sign keys out with Marco.",
      slots: [
        held("Dana Ortiz", {
          pending: { dist: 212, acc: 64, note: "Garage level 3", waitedMin: 6 },
        }),
        ...[
          "Eli Navarro",
          "Mina Cho",
          "Ray Duncan",
          "Bea Lin",
          "Omar Haddad",
          "Gus Patel",
          "Ivy Moreno",
        ].map((name, i) => held(name, { on: inAt(-12 + i, 16 + i * 5, 10 + i * 3) })),
      ],
    },
    {
      key: "maison-live",
      venue: "maison",
      title: "Maison Blanc · Wine dinner",
      kind: "Wine dinner",
      start: maisonStart,
      end: plus(maisonStart, 5),
      status: "published",
      contact: CAMILLE,
      dress: "Black suit",
      instructions: "Fillmore St entrance.",
      slots: [
        held("Theo Park", { on: inAt(-10, 18, 8) }),
        held("Lena Ruiz", { on: inAt(-7, 25, 9) }),
        held("Kai Morgan", { on: inAt(-2, 41, 12) }),
        held("Chris Vale"),
      ],
    },
    {
      key: "laurel",
      venue: "laurel",
      title: "The Laurel Club",
      kind: "Members night",
      start: laurelStart,
      end: plus(laurelStart, 5.5),
      status: "published",
      contact: DANI,
      dress: "Black suit",
      instructions: "Club entrance on Laurel Ave.",
      postedDaysAgo: 2,
      slots: [held("Nadia Brooks"), held("Felix Ward"), held("June Ito"), open(), open()],
    },
    {
      key: "harbor",
      venue: "harbor",
      title: "Harbor Pavilion · Wedding",
      kind: "Wedding",
      start: day(1, 16),
      end: day(1, 23, 30),
      status: "published",
      contact: MARCO,
      dress: "Black suit, white shirt, no sneakers · Lot C",
      instructions:
        "Black suit, white shirt, no sneakers. Park personal cars in Lot C (north side). Key box is at the valet podium; sign keys out with Marco. Guest arrival peaks 4:30–5:30 PM.",
      slots: [
        "Jordan Ellis",
        "Maya Patel",
        "Devon Kim",
        "Luis Torres",
        "Ari Brooks",
        "Sam Rivera",
        "Kai Morgan",
        "Nia Okafor",
      ].map((n) => held(n)),
    },
    {
      key: "brunch",
      venue: "harbor",
      title: "Harbor Pavilion · Brunch",
      kind: "Sunday brunch",
      start: day(2, 10),
      end: day(2, 15),
      status: "published",
      contact: MARCO,
      dress: "Black suit, no sneakers",
      instructions: "Lot C, north side.",
      slots: [held("Nia Okafor"), held("Ivy Moreno"), open(), open(), open()],
    },
    {
      key: "osteria",
      venue: "osteria",
      title: "Osteria Nove",
      kind: "Dinner service",
      start: day(4, 17, 30),
      end: day(4, 22, 30),
      status: "published",
      contact: ELENA,
      dress: "Black shirt and slacks",
      instructions: "Street valet on Valencia. Keys stay at the stand.",
      slots: [held("Jordan Ellis"), held("Kai Morgan")],
    },
    {
      key: "grand-wed",
      venue: "grand",
      title: "The Grand Hotel",
      kind: "Board dinner",
      start: day(5, 17),
      end: day(5, 22),
      status: "published",
      contact: PRIYA,
      dress: "Black suit, no sneakers · east lot, B1",
      instructions: "East lot, level B1.",
      slots: [held("Luis Herrera"), held("Sam Whitaker"), held("Tom Byrne"), open()],
    },
    {
      key: "halloween",
      venue: "maison",
      title: "Maison Blanc · Halloween",
      kind: "Halloween gala",
      start: day(8, 19),
      end: day(9, 1),
      status: "published",
      contact: CAMILLE,
      dress: "Black suit required, costumes optional",
      instructions: "Costumes optional, black suit required. Use the Fillmore St entrance.",
      slots: [
        held("Jordan Ellis", { claimed: true }),
        ...["Theo Park", "Lena Ruiz", "Ana Kovač", "Eli Navarro", "Mina Cho"].map((n) => held(n)),
        open(),
        open(),
        open(),
        open(),
      ],
    },
    {
      key: "westfield-draft",
      venue: "westfield",
      title: "Westfield Gala · Charity auction",
      kind: "Charity auction",
      start: day(10, 19),
      end: day(10, 23),
      status: "draft",
      contact: INES,
      dress: "Black suit",
      instructions: "",
      slots: Array.from({ length: 6 }, () => open()),
    },
    // ── Finished work, for hours review ────────────────────────────────────────────────────
    {
      key: "maison-past",
      venue: "maison",
      title: "Maison Blanc",
      kind: "Dinner service",
      start: day(-1, 18),
      end: day(-1, 23),
      status: "published",
      contact: CAMILLE,
      dress: "Black suit",
      instructions: "",
      slots: [
        held("Jordan Ellis", {
          worked: { in: -8, out: 4, approved: true, inPunch: { dist: 38, acc: 12 } },
        }),
        held("Theo Park", {
          worked: { in: -9, out: 2, approved: true, inPunch: { dist: 20, acc: 9 } },
        }),
      ],
    },
    {
      key: "osteria-past",
      venue: "osteria",
      title: "Osteria Nove",
      kind: "Dinner service",
      start: day(-3, 18),
      end: day(-3, 22, 30),
      status: "published",
      contact: ELENA,
      dress: "Black shirt and slacks",
      instructions: "",
      slots: [
        held("Jordan Ellis", { worked: { in: -19, out: 3, inPunch: { dist: 38, acc: 12 } } }),
        held("Ari Brooks", {
          worked: { in: -19, out: -78, note: "family emergency", inPunch: { dist: 30, acc: 10 } },
        }),
      ],
    },
    {
      key: "westfield-past",
      venue: "westfield",
      title: "Westfield Gala",
      kind: "Gala",
      start: day(-6, 19, 30),
      end: day(-5, 0),
      status: "published",
      contact: INES,
      dress: "Black suit",
      instructions: "",
      slots: [
        held("Jordan Ellis", {
          worked: { in: 18, out: 6, approved: true, inPunch: { dist: 40, acc: 12 } },
        }),
      ],
    },
    {
      key: "grand-past",
      venue: "grand",
      title: "The Grand Hotel",
      kind: "Corporate dinner",
      start: day(-2, 18),
      end: day(-2, 23),
      status: "published",
      contact: PRIYA,
      dress: "Black suit",
      instructions: "",
      slots: [
        held("Luis Torres", {
          worked: { in: -8, out: 2, inPunch: { dist: 420, acc: 38, override: true } },
        }),
        ...[
          "Ana Kovač",
          "Luis Herrera",
          "Sam Whitaker",
          "Marcus Reed",
          "Keisha Grant",
          "Tom Byrne",
          "Chris Vale",
          "Lena Ruiz",
          "Dev Malik",
        ].map(CLEAN),
      ],
    },
    {
      key: "laurel-past",
      venue: "laurel",
      title: "The Laurel Club",
      kind: "Members night",
      start: day(-2, 19, 30),
      end: day(-1, 1),
      status: "published",
      contact: DANI,
      dress: "Black suit",
      instructions: "",
      slots: [
        held("Maya Patel", {
          worked: { in: -12, out: 6, inPunch: { dist: 25, acc: 9, syncedLateMin: 130 } },
        }),
        ...[
          "Nadia Brooks",
          "Felix Ward",
          "June Ito",
          "Bea Lin",
          "Omar Haddad",
          "Gus Patel",
          "Nora Quinn",
          "Rosa Lim",
          "Ben Ochoa",
        ].map(CLEAN),
      ],
    },
    {
      key: "harbor-past",
      venue: "harbor",
      title: "Harbor Pavilion · Corporate lunch",
      kind: "Corporate lunch",
      start: day(-1, 16),
      end: day(-1, 23, 30),
      status: "published",
      contact: MARCO,
      dress: "Black suit",
      instructions: "",
      slots: [
        held("Sam Rivera", { worked: { in: -8, out: null, inPunch: { dist: 35, acc: 10 } } }),
        CLEAN("Ivy Moreno", 3),
      ],
    },
  ]
}
