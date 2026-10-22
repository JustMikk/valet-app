import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { SystemBanner } from "./system-banner"
import { TextField } from "./text-field"

describe("TextField", () => {
  it("labels the input and links the helper text", () => {
    render(
      <TextField
        label="Note for your manager"
        description="Optional · your manager sees this with your selfie"
      />,
    )
    const input = screen.getByRole("textbox", { name: "Note for your manager" })
    expect(input).toHaveAccessibleDescription("Optional · your manager sees this with your selfie")
  })

  it("marks the input invalid and announces the error", () => {
    render(<TextField label="Email" error="Enter an email address" />)
    const input = screen.getByRole("textbox", { name: "Email" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription("Enter an email address")
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an email address")
  })

  it("renders a multi-line field when asked", async () => {
    render(<TextField label="Reason" multiline />)
    const textarea = screen.getByRole("textbox", { name: "Reason" })
    expect(textarea.tagName).toBe("TEXTAREA")
    await userEvent.type(textarea, "Garage level 3")
    expect(textarea).toHaveValue("Garage level 3")
  })
})

describe("SystemBanner", () => {
  it("shows a status message with its icon as a polite status", () => {
    render(
      <SystemBanner tone="warn" icon="cloud_off">
        Offline · board last updated 6:02 PM
      </SystemBanner>,
    )
    expect(screen.getByRole("status")).toHaveTextContent("Offline · board last updated 6:02 PM")
  })
})
