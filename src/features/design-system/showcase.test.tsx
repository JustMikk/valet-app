import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { DesignSystemShowcase } from "./showcase"

describe("DesignSystemShowcase", () => {
  it("starts on Regency gold without overriding the token defaults", () => {
    const { container } = render(<DesignSystemShowcase />)
    expect(screen.getByRole("button", { name: "Accent Regency gold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(container.querySelector("style")).toBeNull()
  })

  it("recolors the page and the accent swatches when another accent is picked", async () => {
    const { container } = render(<DesignSystemShowcase />)
    await userEvent.click(screen.getByRole("button", { name: "Accent Burgundy" }))
    expect(screen.getByRole("button", { name: "Accent Burgundy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(container.querySelector("style")?.textContent).toContain("--accent:#8E1B2A")
    expect(screen.getAllByText(/#8E1B2A \/ #8E1B2A/).length).toBeGreaterThan(0)
  })
})
