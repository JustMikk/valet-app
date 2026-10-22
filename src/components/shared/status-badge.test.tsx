import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { STATUS } from "@/lib/status/presets"

import { StatusBadge } from "./status-badge"

describe("StatusBadge", () => {
  it("renders the icon and the words of a preset", () => {
    const { container } = render(<StatusBadge status={STATUS.onSite} />)
    expect(screen.getByText("On site")).toBeInTheDocument()
    expect(container.querySelector("[aria-hidden='true']")).toHaveTextContent("verified")
  })

  it("renders dynamic presets", () => {
    render(<StatusBadge status={STATUS.late(12)} />)
    expect(screen.getByText("Late 12 min")).toBeInTheDocument()
  })

  it("lets the label be overridden while keeping tone and icon", () => {
    render(<StatusBadge status={STATUS.onSite}>2h 12m</StatusBadge>)
    expect(screen.getByText("2h 12m")).toBeInTheDocument()
  })
})
