import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ChipGroup } from "./chip-group"
import { UnderlineTabPanel, UnderlineTabs } from "./underline-tabs"

const tabs = [
  { value: "events", label: "Events" },
  { value: "timeline", label: "Timeline" },
  { value: "people", label: "People" },
]

describe("UnderlineTabs", () => {
  it("marks the active tab and shows its panel", async () => {
    render(
      <UnderlineTabs items={tabs} defaultValue="events" label="Board views">
        <UnderlineTabPanel value="events">Events panel</UnderlineTabPanel>
        <UnderlineTabPanel value="timeline">Timeline panel</UnderlineTabPanel>
      </UnderlineTabs>,
    )
    expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Events panel")).toBeVisible()
    await userEvent.click(screen.getByRole("tab", { name: "Timeline" }))
    expect(screen.getByRole("tab", { name: "Timeline" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Timeline panel")).toBeVisible()
  })

  it("moves between tabs with arrow keys", async () => {
    render(<UnderlineTabs items={tabs} defaultValue="events" label="Board views" />)
    screen.getByRole("tab", { name: "Events" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Timeline" })).toHaveFocus()
  })
})

const days = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "sat", label: "Sat 24" },
]

describe("ChipGroup", () => {
  it("is a labelled group with one pressed chip", () => {
    render(<ChipGroup label="Day" items={days} value="today" onValueChange={() => {}} />)
    expect(screen.getByRole("group", { name: "Day" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Tomorrow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("reports the newly selected chip", async () => {
    const onValueChange = vi.fn()
    render(<ChipGroup label="Day" items={days} value="today" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Sat 24" }))
    expect(onValueChange).toHaveBeenCalledWith("sat")
  })

  it("keeps a selection when the pressed chip is pressed again", async () => {
    const onValueChange = vi.fn()
    render(<ChipGroup label="Day" items={days} value="today" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Today" }))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
