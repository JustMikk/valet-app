import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ActionButton } from "./action-button"
import { GlassPill } from "./glass-pill"
import { IconButton } from "./icon-button"

describe("ActionButton", () => {
  it("renders the label with a leading icon and fires onClick", async () => {
    const onClick = vi.fn()
    render(
      <ActionButton variant="accent" icon="login" onClick={onClick}>
        Clock in
      </ActionButton>,
    )
    const button = screen.getByRole("button", { name: "Clock in" })
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("explains why it is disabled, linked for assistive tech", () => {
    render(
      <ActionButton disabled reason="Clock-in opens 5:45 PM">
        Clock in
      </ActionButton>,
    )
    const button = screen.getByRole("button", { name: "Clock in" })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription("Clock-in opens 5:45 PM")
  })

  it("does not fire onClick while disabled", async () => {
    const onClick = vi.fn()
    render(
      <ActionButton disabled onClick={onClick}>
        Clock in
      </ActionButton>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Clock in" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("adds the decorative shine sweep only when asked", () => {
    const { container, rerender } = render(<ActionButton shine>Clock in</ActionButton>)
    expect(container.querySelector(".animate-shine")).toHaveAttribute("aria-hidden", "true")
    rerender(<ActionButton>Clock in</ActionButton>)
    expect(container.querySelector(".animate-shine")).toBeNull()
  })
})

describe("IconButton", () => {
  it("requires and exposes an accessible label", () => {
    render(<IconButton icon="notifications" label="Notifications" />)
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument()
  })

  it("announces the badge, not just shows a dot", () => {
    render(<IconButton icon="notifications" label="Notifications" badge="New" />)
    expect(screen.getByRole("button", { name: "Notifications (New)" })).toBeInTheDocument()
  })
})

describe("GlassPill", () => {
  it("renders its content", () => {
    render(<GlassPill>Live Board</GlassPill>)
    expect(screen.getByText("Live Board")).toBeInTheDocument()
  })
})
