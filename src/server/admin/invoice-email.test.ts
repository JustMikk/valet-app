import { describe, expect, it } from "vitest"

import { cleanRecipients, dueText, periodText } from "./invoice-email"

describe("cleanRecipients", () => {
  it("trims and lowercases, drops blanks and repeats, and never copies the client", () => {
    expect(
      cleanRecipients({
        client: " Billing@Grand.com ",
        manager: "gm@grand.com",
        accountant: "",
        others: ["", "billing@grand.com", "GM@grand.com", "ap@grand.com", "ap@grand.com "],
      }),
    ).toEqual({
      client: "billing@grand.com",
      manager: "gm@grand.com",
      accountant: "",
      others: ["ap@grand.com"],
      cc: ["gm@grand.com", "ap@grand.com"],
    })
  })

  it("copies nobody when the manager is also the client", () => {
    expect(
      cleanRecipients({ client: "a@x.com", manager: "a@x.com", accountant: "", others: [] }).cc,
    ).toEqual([])
  })
})

describe("periodText", () => {
  it("names a period with its year", () => {
    expect(
      periodText({
        period_start: "2026-11-01",
        period_end: "2026-11-15",
        event_id: null,
        label: null,
      }),
    ).toBe("Nov 1 – 15, 2026")
  })

  it("names an event's invoice by the event and its date", () => {
    expect(
      periodText({
        period_start: "2026-10-17",
        period_end: "2026-10-17",
        event_id: "e1",
        label: "Holiday Gala · Oct 17",
      }),
    ).toBe("Holiday Gala, Oct 17, 2026")
  })
})

describe("dueText", () => {
  it("is the venue-local date with its year", () => {
    expect(dueText(new Date("2026-12-09T18:00:00Z"), "America/Chicago")).toBe("Dec 9, 2026")
  })
})
