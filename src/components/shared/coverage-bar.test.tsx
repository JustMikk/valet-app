import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CoverageBar, coverageSummary } from "./coverage-bar"

const counts = { onSite: 4, late: 1, expected: 0, open: 1 }

describe("coverageSummary", () => {
  it("describes every non-empty segment and the headcount in words", () => {
    expect(coverageSummary(counts)).toBe("4 on site, 1 late, 1 open of 6")
  })

  it("includes expected arrivals when present", () => {
    expect(coverageSummary({ onSite: 2, late: 0, expected: 3, open: 0 })).toBe(
      "2 on site, 3 expected of 5",
    )
  })
})

describe("coverageSummary with unusable counts", () => {
  it("says there are no slots instead of printing 'of 0'", () => {
    expect(coverageSummary({ onSite: 0, late: 0, expected: 0, open: 0 })).toBe("No slots")
  })

  it("treats negative, fractional and non-finite counts as valid whole numbers or zero", () => {
    expect(coverageSummary({ onSite: -2, late: Number.NaN, expected: 2.9, open: 1 })).toBe(
      "2 expected, 1 open of 3",
    )
  })
})

describe("CoverageBar", () => {
  it("draws a neutral empty track with a text equivalent when there are no slots", () => {
    const { container } = render(
      <CoverageBar counts={{ onSite: 0, late: 0, expected: 0, open: 0 }} legend />,
    )
    expect(screen.getByRole("img", { name: "No slots" })).toBeInTheDocument()
    expect(container.querySelector("[data-segment='none']")).not.toBeNull()
    expect(screen.queryByText(/of 0/)).toBeNull()
  })

  it("exposes the summary as the bar's accessible name", () => {
    render(<CoverageBar counts={counts} />)
    expect(screen.getByRole("img", { name: "4 on site, 1 late, 1 open of 6" })).toBeInTheDocument()
  })

  it("draws one segment per non-empty state, weighted by count", () => {
    const { container } = render(<CoverageBar counts={counts} />)
    const segments = container.querySelectorAll("[data-segment]")
    expect([...segments].map((s) => s.getAttribute("data-segment"))).toEqual([
      "onSite",
      "late",
      "open",
    ])
    expect((segments[0] as HTMLElement).style.flexGrow).toBe("4")
  })

  it("draws open slots as the empty track (the label says it in words)", () => {
    const { container } = render(<CoverageBar counts={counts} />)
    expect(container.querySelector("[data-segment='open']")).toHaveClass("bg-surface-2")
  })

  it("shows the legend with the headcount", () => {
    render(<CoverageBar counts={counts} legend />)
    expect(screen.getByText("of 6")).toBeInTheDocument()
  })
})
