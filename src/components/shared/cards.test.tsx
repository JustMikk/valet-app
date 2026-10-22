import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AttentionCard } from "./attention-card"
import { FeatureCard, PagerDots } from "./feature-card"
import { GlassCard } from "./glass-card"

describe("AttentionCard", () => {
  it("states what, how long, and offers in-place actions", async () => {
    const onMessage = vi.fn()
    render(
      <AttentionCard
        tone="warn"
        icon="running_with_errors"
        title="Marcus Reed is 12 min late"
        meta="Osteria Nove · started 5:30 PM · unresolved 2 min"
        actions={[
          { label: "Message", onClick: onMessage },
          { label: "Call", onClick: () => {} },
          { label: "Replace", onClick: () => {} },
        ]}
      />,
    )
    expect(screen.getByText("Marcus Reed is 12 min late")).toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(3)
    await userEvent.click(screen.getByRole("button", { name: "Message" }))
    expect(onMessage).toHaveBeenCalledOnce()
  })
})

describe("FeatureCard", () => {
  it("is one action with a separate, labelled dismiss button", async () => {
    const onOpen = vi.fn()
    const onDismiss = vi.fn()
    render(
      <FeatureCard
        title="3 open shifts this weekend"
        body="First to claim gets it."
        cta="See open shifts"
        onClick={onOpen}
        onDismiss={onDismiss}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /See open shifts/ }))
    expect(onOpen).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it("has no dismiss button unless dismissible", () => {
    render(<FeatureCard title="Open shifts" cta="See open shifts" onClick={() => {}} />)
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull()
  })
})

describe("PagerDots", () => {
  it("states the position in words", () => {
    render(<PagerDots count={3} active={0} label="Promotion" />)
    expect(screen.getByText("Promotion 1 of 3")).toBeInTheDocument()
  })
})

describe("GlassCard", () => {
  it("renders children on a glass surface", () => {
    render(<GlassCard>Tonight</GlassCard>)
    expect(screen.getByText("Tonight")).toHaveClass("glass-card")
  })
})
