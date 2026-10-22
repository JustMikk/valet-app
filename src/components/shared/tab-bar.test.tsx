import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TabBar } from "./tab-bar"

describe("TabBar", () => {
  const onSelect = vi.fn()
  const items = [
    { key: "board", label: "Board", icon: "space_dashboard" as const, onSelect },
    { key: "events", label: "Events", icon: "event" as const, onSelect },
    { key: "inbox", label: "Inbox", icon: "inbox" as const, badge: 2, onSelect },
    { key: "staff", label: "Staff", icon: "group" as const, href: "/staff" },
  ]

  it("is a labelled navigation landmark marking the current tab", () => {
    render(<TabBar label="Main" items={items} current="board" />)
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Board" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Events" })).not.toHaveAttribute("aria-current")
  })

  it("announces the count badge with the tab name", () => {
    render(<TabBar label="Main" items={items} current="board" />)
    expect(screen.getByRole("button", { name: "Inbox, 2 new" })).toBeInTheDocument()
  })

  it("renders link tabs and button tabs", async () => {
    render(<TabBar label="Main" items={items} current="board" />)
    expect(screen.getByRole("link", { name: "Staff" })).toHaveAttribute("href", "/staff")
    await userEvent.click(screen.getByRole("button", { name: "Events" }))
    expect(onSelect).toHaveBeenCalledWith("events")
  })
})
