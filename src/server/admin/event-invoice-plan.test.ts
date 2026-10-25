import { describe, expect, it } from "vitest"

import { planEventInvoice, type CrewHours, type InvoiceEvent } from "./event-invoice-plan"

const TZ = "America/Los_Angeles"
// Sat Nov 7 2026, 6 PM – 11 PM Pacific (UTC-8).
const event: InvoiceEvent = {
  title: "Gala night",
  kind: "Wedding",
  starts_at: new Date("2026-11-08T02:00:00Z"),
  ends_at: new Date("2026-11-08T07:00:00Z"),
  crew_size: 5,
  status: "published",
  tz: TZ,
  bill_rate_cents: 3800,
}
const after = new Date("2026-11-08T12:00:00Z")

const worked = (name: string, inAt: string, outAt: string): CrewHours => ({
  name,
  hours_status: "approved",
  clocked_in_at: new Date(inAt),
  clocked_out_at: new Date(outAt),
})

const cole = worked("Cole Bennett", "2026-11-08T01:58:00Z", "2026-11-08T07:00:00Z")
const ana = worked("Ana Ruiz", "2026-11-08T02:00:00Z", "2026-11-08T06:30:00Z")

describe("planEventInvoice", () => {
  it("bills each worker's approved hours at the venue's rate, sorted by name", () => {
    const plan = planEventInvoice(event, [cole, ana], after)
    expect(plan?.lines).toEqual([
      {
        what: "Ana Ruiz",
        detail: "6:00 PM – 10:30 PM",
        staff_count: 1,
        minutes: 270,
        rate_cents: 3800,
        amount_cents: 17_100,
      },
      {
        what: "Cole Bennett",
        detail: "5:58 PM – 11:00 PM",
        staff_count: 1,
        minutes: 302,
        rate_cents: 3800,
        amount_cents: 19_127,
      },
    ])
  })

  it("names the event, when it ran and how many of the requested crew worked", () => {
    const plan = planEventInvoice(event, [cole, ana], after)
    expect(plan?.label).toBe("Wedding · Nov 7")
    expect(plan?.summary).toBe("Wedding · Sat Nov 7 · 6:00 – 11:00 PM · 2 of 5 staff")
  })

  it("falls back to the event's title when it has no kind", () => {
    expect(planEventInvoice({ ...event, kind: "" }, [cole], after)?.label).toBe(
      "Gala night · Nov 7",
    )
  })

  it("waits until the event is over", () => {
    expect(planEventInvoice(event, [cole], new Date("2026-11-08T05:00:00Z"))).toBeNull()
  })

  it("waits while anyone who clocked in still has hours in review", () => {
    const pending: CrewHours = { ...ana, hours_status: "in_review" }
    expect(planEventInvoice(event, [cole, pending], after)).toBeNull()
  })

  it("does not bill someone who never clocked in, and does not wait for them", () => {
    const absent: CrewHours = {
      name: "Zed Ng",
      hours_status: "in_review",
      clocked_in_at: null,
      clocked_out_at: null,
    }
    expect(planEventInvoice(event, [cole, absent], after)?.lines.map((l) => l.what)).toEqual([
      "Cole Bennett",
    ])
  })

  it("has nothing to invoice when no one has billable hours", () => {
    expect(planEventInvoice(event, [], after)).toBeNull()
  })

  it("never invoices a draft or a cancelled event", () => {
    expect(planEventInvoice({ ...event, status: "draft" }, [cole], after)).toBeNull()
    expect(planEventInvoice({ ...event, status: "cancelled" }, [cole], after)).toBeNull()
  })

  it("bills an overnight event on the date it started", () => {
    const night = {
      ...event,
      starts_at: new Date("2026-11-08T05:00:00Z"),
      ends_at: new Date("2026-11-08T10:00:00Z"),
    }
    const plan = planEventInvoice(
      night,
      [worked("Ana Ruiz", "2026-11-08T05:00:00Z", "2026-11-08T10:00:00Z")],
      after,
    )
    expect(plan?.label).toBe("Wedding · Nov 7")
    expect(plan?.lines[0]?.minutes).toBe(300)
  })
})
