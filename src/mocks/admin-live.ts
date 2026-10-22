// Live Board fixtures from the design export (Live Board.dc.html). Venue times, Fri Oct 23.
export type SlotState =
  "onsite" | "flagged" | "override" | "waiting" | "late" | "due" | "upcoming" | "open"

export type LiveSlot = { name: string; state: SlotState; meta: string }

export type LiveEvent = {
  id: string
  venue: string
  time: string
  /** Start and end as fractional hours on the 4 PM – 1 AM timeline (24+ is after midnight). */
  start: number
  end: number
  live: boolean
  rel: string
  slots: LiveSlot[]
}

const slot = (name: string, state: SlotState, meta: string): LiveSlot => ({ name, state, meta })

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

export const LIVE_EVENTS: LiveEvent[] = [
  {
    id: "grand",
    venue: "The Grand Hotel",
    time: "6:00 – 11:00 PM",
    start: 18,
    end: 23,
    live: true,
    rel: "started 4 min ago",
    slots: [
      slot("Jordan Ellis", "onsite", "In 5:51 PM · 38 m from center · ±12 m"),
      slot("Ana Kovač", "onsite", "In 5:48 PM · 22 m · ±9 m"),
      slot("Luis Herrera", "onsite", "In 5:55 PM · 61 m · ±40 m"),
      slot("Sam Whitaker", "flagged", "Queued offline punch · 5:57 PM, synced 6:01"),
      slot("Open slot", "open", "Dropped by Cole B. at 5:12 PM (late drop)"),
      slot("Open slot", "open", "Unfilled since posting"),
    ],
  },
  {
    id: "osteria",
    venue: "Osteria Nove",
    time: "5:45 – 10:30 PM",
    start: 17.75,
    end: 22.5,
    live: true,
    rel: "started 19 min ago",
    slots: [
      slot("Marcus Reed", "late", "Not clocked in · push reminder 5:55 PM"),
      slot("Keisha Grant", "onsite", "In 5:39 PM · 14 m · ±8 m"),
      slot("Tom Byrne", "onsite", "In 5:41 PM · 30 m · ±15 m"),
    ],
  },
  {
    id: "harbor",
    venue: "Harbor Pavilion · Wedding",
    time: "4:00 – 11:30 PM",
    start: 16,
    end: 23.5,
    live: true,
    rel: "2h 04m in",
    slots: [
      slot("Dana Ortiz", "waiting", "212 m outside · ±64 m · “Garage level 3”"),
      ...EXTRA_CREW.slice(0, 7).map((name, i) =>
        slot(name, "onsite", `In ${3 + Math.floor(i / 4)}:${48 + i} PM · verified`),
      ),
    ],
  },
  {
    id: "maison",
    venue: "Maison Blanc",
    time: "6:00 – 11:00 PM",
    start: 18,
    end: 23,
    live: true,
    rel: "started 4 min ago",
    slots: [
      slot("Theo Park", "onsite", "In 5:50 PM · 18 m"),
      slot("Lena Ruiz", "onsite", "In 5:53 PM · 25 m"),
      slot("Kai Morgan", "onsite", "In 5:58 PM · 41 m"),
      slot("Chris Vale", "due", "Grace ends 6:10 PM"),
    ],
  },
  {
    id: "laurel",
    venue: "The Laurel Club",
    time: "7:30 PM – 1:00 AM",
    start: 19.5,
    end: 25,
    live: false,
    rel: "starts in 1h 26m",
    slots: [
      slot("Nadia Brooks", "upcoming", "Clock-in opens 7:15 PM"),
      slot("Felix Ward", "upcoming", "Clock-in opens 7:15 PM · push off"),
      slot("June Ito", "upcoming", "Clock-in opens 7:15 PM"),
      slot("Open slot", "open", "Posted Wed · 38 eligible notified"),
      slot("Open slot", "open", "Posted Wed · 38 eligible notified"),
    ],
  },
  {
    id: "westfield",
    venue: "Westfield Gala",
    time: "8:00 PM – 12:00 AM",
    start: 20,
    end: 24,
    live: false,
    rel: "starts in 1h 56m",
    slots: EXTRA_CREW.map((name) =>
      slot(
        `${name.split(" ")[0]} ${"QRSTUVWXYZ"[name.length % 10]}.`,
        "upcoming",
        "Clock-in opens 7:45 PM",
      ),
    ),
  },
]

/** People the Assign action cycles through. */
export const ASSIGN_POOL = ["Nora Quinn", "Dev Malik", "Rosa Lim", "Ben Ochoa"] as const

/** Timeline axis: 4 PM to 1 AM, hour labels every two hours. */
export const TIMELINE = { from: 16, span: 9, now: 18.067, ticks: [16, 18, 20, 22, 24] } as const
