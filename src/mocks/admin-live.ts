// Live Board fixtures from the design export (Live Board.dc.html), in the same shape the API
// returns. Venue times, Fri Oct 23. Used by the static (fixture-only) build.
import type { LiveEvent, LiveSlot, SlotFacts, SlotState } from "@/lib/data/admin/ops-schemas"

let counter = 0
const slot = (name: string, state: SlotState, meta: string, facts: SlotFacts = {}): LiveSlot => ({
  id: `slot-${++counter}`,
  staffId: state === "open" ? null : `staff-${counter}`,
  name,
  state,
  meta,
  facts,
})

const EXTRA_CREW = [
  "Eli Navarro",
  "Mina Cho",
  "Ray Duncan",
  "Bea Lin",
  "Omar Haddad",
  "Gus Patel",
  "Ivy Moreno",
  "Noel Fry",
  "Tara Singh",
  "Wes Ahn",
]

type Head = Pick<
  LiveEvent,
  "id" | "venue" | "time" | "start" | "end" | "live" | "rel" | "startLabel" | "startsInMin"
>

const event = (head: Head, slots: LiveSlot[]): LiveEvent => ({ ...head, slots })

export const LIVE_EVENTS: LiveEvent[] = [
  event(
    {
      id: "grand",
      venue: "The Grand Hotel",
      time: "6:00 – 11:00 PM",
      start: 18,
      end: 23,
      live: true,
      rel: "started 4 min ago",
      startLabel: "6:00 PM",
      startsInMin: -4,
    },
    [
      slot("Jordan Ellis", "onsite", "In 5:51 PM · 38 m from center · ±12 m"),
      slot("Ana Kovač", "onsite", "In 5:48 PM · 22 m · ±9 m"),
      slot("Luis Herrera", "onsite", "In 5:55 PM · 61 m · ±40 m"),
      slot("Sam Whitaker", "flagged", "Queued offline punch · 5:57 PM, synced 6:01 PM"),
      slot("Open slot", "open", "Dropped by Cole B. at 5:12 PM", {
        droppedBy: "Cole B.",
        droppedAt: "5:12 PM",
        openMin: 52,
      }),
      slot("Open slot", "open", "Posted Tue", { openMin: 4 }),
    ],
  ),
  event(
    {
      id: "osteria",
      venue: "Osteria Nove",
      time: "5:45 – 10:30 PM",
      start: 17.75,
      end: 22.5,
      live: true,
      rel: "started 19 min ago",
      startLabel: "5:45 PM",
      startsInMin: -19,
    },
    [
      slot("Marcus Reed", "late", "Not clocked in", { lateMin: 19, tel: "+14155550100" }),
      slot("Keisha Grant", "onsite", "In 5:39 PM · 14 m · ±8 m"),
      slot("Tom Byrne", "onsite", "In 5:41 PM · 30 m · ±15 m"),
    ],
  ),
  event(
    {
      id: "harbor",
      venue: "Harbor Pavilion · Wedding",
      time: "4:00 – 11:30 PM",
      start: 16,
      end: 23.5,
      live: true,
      rel: "2h 4m in",
      startLabel: "4:00 PM",
      startsInMin: -124,
    },
    [
      slot("Dana Ortiz", "waiting", "212 m outside · ±64 m · “Garage level 3”", {
        outsideM: 212,
        accuracyM: 64,
        note: "Garage level 3",
        waitedMin: 6,
        punchId: "punch-dana",
      }),
      ...EXTRA_CREW.slice(0, 7).map((name, i) =>
        slot(name, "onsite", `In ${3 + Math.floor(i / 4)}:${48 + i} PM · verified`),
      ),
    ],
  ),
  event(
    {
      id: "maison",
      venue: "Maison Blanc",
      time: "6:00 – 11:00 PM",
      start: 18,
      end: 23,
      live: true,
      rel: "started 4 min ago",
      startLabel: "6:00 PM",
      startsInMin: -4,
    },
    [
      slot("Theo Park", "onsite", "In 5:50 PM · 18 m"),
      slot("Lena Ruiz", "onsite", "In 5:53 PM · 25 m"),
      slot("Kai Morgan", "onsite", "In 5:58 PM · 41 m"),
      slot("Chris Vale", "due", "Grace ends 6:10 PM"),
    ],
  ),
  event(
    {
      id: "laurel",
      venue: "The Laurel Club",
      time: "7:30 PM – 1:00 AM",
      start: 19.5,
      end: 25,
      live: false,
      rel: "starts in 1h 26m",
      startLabel: "7:30 PM",
      startsInMin: 86,
    },
    [
      slot("Nadia Brooks", "upcoming", "Clock-in opens 7:15 PM"),
      slot("Felix Ward", "upcoming", "Clock-in opens 7:15 PM · push off"),
      slot("June Ito", "upcoming", "Clock-in opens 7:15 PM"),
      slot("Open slot", "open", "Posted Wed", { openMin: 0 }),
      slot("Open slot", "open", "Posted Wed", { openMin: 0 }),
    ],
  ),
  event(
    {
      id: "westfield",
      venue: "Westfield Gala",
      time: "8:00 PM – 12:00 AM",
      start: 20,
      end: 24,
      live: false,
      rel: "starts in 1h 56m",
      startLabel: "8:00 PM",
      startsInMin: 116,
    },
    EXTRA_CREW.map((name) =>
      slot(
        `${name.split(" ")[0]} ${"QRSTUVWXYZ"[name.length % 10]}.`,
        "upcoming",
        "Clock-in opens 7:45 PM",
      ),
    ),
  ),
]

/** People the Assign action cycles through. */
export const ASSIGN_POOL = ["Nora Quinn", "Dev Malik", "Rosa Lim", "Ben Ochoa"] as const

/** Timeline axis: 4 PM to 1 AM, hour labels every two hours. */
export const TIMELINE = { from: 16, span: 9, now: 18.067, ticks: [16, 18, 20, 22, 24] } as const
