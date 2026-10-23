import { describe, expect, it } from "vitest"

import { RESULT_EXAMPLES, resultContent, type ResultKey } from "./result-copy"

const body = (key: ResultKey) => resultContent(key, RESULT_EXAMPLES[key]).body

describe("resultContent", () => {
  it("reproduces the design's copy from the example shifts", () => {
    expect(body("claimed")).toBe(
      "Harbor Pavilion · Brunch, Sun Oct 25, 10:00 AM – 3:00 PM is now in your shifts. Dispatch has been notified.",
    )
    expect(body("filled")).toBe(
      "Someone claimed the last spot at The Grand Hotel (Wed Oct 28) a moment before you. Other open shifts are still available.",
    )
    expect(body("overlap")).toBe(
      "The Laurel Club (7:30 PM – 1:00 AM) overlaps The Grand Hotel tonight (6:00 – 11:00 PM). You can only hold one at a time.",
    )
    expect(body("dropped")).toBe(
      "Harbor Pavilion (Sat Oct 24) has been reopened, and dispatch was alerted it’s a late drop. Thanks for letting us know early.",
    )
  })

  it("names the conflicting shift in the overlap action", () => {
    const content = resultContent("overlap", RESULT_EXAMPLES.overlap)
    expect(content.primaryLabel).toBe("View my Grand Hotel shift")
    expect(content.primaryHref).toBe("/staff")
  })

  it("only mentions a late drop when it was one", () => {
    const early = resultContent("dropped", { ...RESULT_EXAMPLES.dropped, late: false }).body
    expect(early).toBe(
      "Harbor Pavilion (Sat Oct 24) has been reopened. Dispatch has been notified.",
    )
  })

  it("falls back gracefully when an overlap has no conflict details", () => {
    const content = resultContent("overlap", { venue: "X", dateLabel: "", timeLabel: "7 PM" })
    expect(content.primaryHref).toBe("/staff/shifts")
    expect(content.body).toContain("overlaps a shift you hold")
  })
})
