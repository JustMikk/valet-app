import { describe, expect, it } from "vitest"

import type { LiveEvent, LiveSlot, SlotState } from "@/lib/data/admin/ops-schemas"

import {
  boardPeople,
  deriveBoard,
  sheetSlots,
  slotStatus,
  spanLabel,
  summarizeEvent,
} from "./model"

const slot = (
  id: string,
  name: string,
  state: SlotState,
  facts: LiveSlot["facts"] = {},
  meta = "In 5:51 PM · 38 m",
): LiveSlot => ({ id, staffId: state === "open" ? null : `s-${id}`, name, state, meta, facts })

const event = (over: Partial<LiveEvent> & { slots: LiveSlot[] }): LiveEvent => ({
  id: "e1",
  venue: "The Grand Hotel",
  time: "6:00 – 11:00 PM",
  start: 18,
  end: 23,
  live: true,
  rel: "started 4 min ago",
  startLabel: "6:00 PM",
  startsInMin: -4,
  ...over,
})

describe("slotStatus", () => {
  it("states every slot in words and a glyph, with late carrying its minutes", () => {
    expect(slotStatus({ state: "late", facts: { lateMin: 19 } }).label).toBe("Late 19m")
    expect(slotStatus({ state: "open", facts: {} })).toMatchObject({ label: "Open", filled: false })
    expect(slotStatus({ state: "waiting", facts: {} }).label).toBe("Approval")
  })
})

describe("summarizeEvent", () => {
  it("counts people by what they are doing and writes a legend", () => {
    const s = summarizeEvent(
      event({
        slots: [
          slot("1", "A", "onsite"),
          slot("2", "B", "flagged"),
          slot("3", "C", "waiting"),
          slot("4", "D", "late", { lateMin: 9 }),
          slot("5", "E", "upcoming"),
          slot("6", "F", "open"),
        ],
      }),
    )
    expect(s.counts).toEqual({ onsite: 2, waiting: 1, late: 1, exp: 1, open: 1 })
    expect(s.legend).toBe("2 on site · 1 approval · 1 late · 1 expected · 1 open")
    expect(s.filledOf).toBe("5/6 filled")
    expect(s.health.status.label).toBe("Short 1")
    expect(s.bar[0]).toBe("onsite")
    expect(s.bar.at(-1)).toBe("open")
  })

  it("reads on track when everyone is where they should be", () => {
    expect(summarizeEvent(event({ slots: [slot("1", "A", "onsite")] })).health.status.label).toBe(
      "On track",
    )
  })
})

describe("deriveBoard attention queue", () => {
  const board = deriveBoard(
    [
      event({
        slots: [
          slot("a", "Jordan Ellis", "onsite"),
          slot("b", "Marcus Reed", "late", { lateMin: 19 }),
          slot("c", "Dana Ortiz", "waiting", {
            outsideM: 212,
            accuracyM: 64,
            note: "Garage level 3",
            waitedMin: 6,
            punchId: "p1",
          }),
          slot("d", "Open slot", "open", {
            droppedBy: "Cole B.",
            droppedAt: "5:12 PM",
            openMin: 52,
          }),
        ],
      }),
      event({
        id: "e2",
        venue: "The Laurel Club",
        live: false,
        startLabel: "7:30 PM",
        startsInMin: 86,
        rel: "starts in 1h 26m",
        slots: [slot("x", "Open slot", "open"), slot("y", "Open slot", "open")],
      }),
    ],
    {},
  )

  it("orders by urgency: short, late, approval, unfilled", () => {
    expect(board.attention.map((a) => a.kind)).toEqual(["short", "late", "waiting", "unfilled"])
  })

  it("builds the sentences from facts", () => {
    const [short, late, waiting, unfilled] = board.attention
    expect(short.title).toBe("The Grand Hotel is short 1")
    expect(short.sub).toBe("Live since 6:00 PM · drop by Cole B. at 5:12 PM · open 52 min")
    expect(late.title).toBe("Marcus Reed is 19 min late")
    expect(late.sub).toBe("The Grand Hotel · started 6:00 PM")
    expect(waiting.title).toBe("Dana Ortiz asks to clock in")
    expect(waiting.sub).toBe(
      "The Grand Hotel · 212 m outside fence, ±64 m · “Garage level 3” · waiting 6 min",
    )
    expect(waiting.selfie).toBe(true)
    expect(waiting.punchId).toBe("p1")
    expect(unfilled.title).toBe("The Laurel Club: 2 slots unfilled")
    expect(unfilled.sub).toBe("Starts 7:30 PM (in 1h 26m) · 4-hour alert")
  })

  it("switches Message to Message again once the person has been nudged", () => {
    const after = deriveBoard(
      [event({ slots: [slot("b", "Marcus Reed", "late", { lateMin: 5 })] })],
      { b: true },
    )
    expect(after.attention[0].actions[0]).toEqual({ id: "message-again", label: "Message again" })
    expect(after.attention[0].sub).toContain("message delivered")
  })

  it("alerts for unfilled events only inside the four-hour window", () => {
    const far = deriveBoard(
      [
        event({
          live: false,
          startsInMin: 5 * 60,
          slots: [slot("x", "Open slot", "open")],
        }),
      ],
      {},
    )
    expect(far.attention).toHaveLength(0)
  })

  it("tallies the pulse across events", () => {
    expect(board.pulse).toEqual({ need: 4, live: 1, onShift: 1, expected: 1, open: 3 })
  })
})

describe("roster ordering and people", () => {
  const e = event({
    slots: [
      slot("1", "Ok", "onsite"),
      slot("2", "Late", "late", { lateMin: 3 }),
      slot("3", "Open slot", "open"),
      slot("4", "Soon", "upcoming"),
    ],
  })

  it("puts problems first in the roster sheet", () => {
    expect(sheetSlots(e).map((s) => s.slot.state)).toEqual(["late", "open", "onsite", "upcoming"])
  })

  it("lists people who are working, filtered by name, without open slots or not-yet-live people", () => {
    expect(boardPeople([e], "").map((p) => p.name)).toEqual(["Ok", "Late", "Soon"])
    expect(boardPeople([e], "lat").map((p) => p.name)).toEqual(["Late"])
  })
})

describe("spanLabel", () => {
  it("reads minutes and hours", () => {
    expect(spanLabel(52)).toBe("52 min")
    expect(spanLabel(86)).toBe("1h 26m")
    expect(spanLabel(120)).toBe("2h")
    expect(spanLabel(-5)).toBe("0 min")
  })
})
