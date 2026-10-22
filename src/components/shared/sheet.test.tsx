import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ConfirmSheet } from "./confirm-sheet"
import { ResponsiveSheet } from "./responsive-sheet"

function mockWidth(width: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => {
      const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
      return {
        matches: width >= min,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe("ResponsiveSheet", () => {
  it("opens as a bottom sheet on phone, with a grabber", async () => {
    mockWidth(390)
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Clock out now?">
        Body
      </ResponsiveSheet>,
    )
    const dialog = await screen.findByRole("dialog", { name: "Clock out now?" })
    expect(dialog.querySelector("[data-grabber]")).not.toBeNull()
  })

  it("opens as a centered dialog from 700 px, without a grabber", async () => {
    mockWidth(1024)
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Clock out now?">
        Body
      </ResponsiveSheet>,
    )
    const dialog = await screen.findByRole("dialog", { name: "Clock out now?" })
    expect(dialog.querySelector("[data-grabber]")).toBeNull()
  })

  it("asks to close on Escape", async () => {
    mockWidth(1024)
    const onOpenChange = vi.fn()
    render(
      <ResponsiveSheet open onOpenChange={onOpenChange} title="Clock out now?">
        Body
      </ResponsiveSheet>,
    )
    await screen.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()))
  })
})

describe("ConfirmSheet", () => {
  it("states the consequence and confirms or cancels", async () => {
    mockWidth(1024)
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmSheet
        open
        onOpenChange={onOpenChange}
        title="Mark Marcus Reed as no-show?"
        consequence="He'll get 0 hours for Osteria Nove."
        confirmLabel="Mark no-show"
        tone="destructive"
        onConfirm={onConfirm}
      />,
    )
    const dialog = await screen.findByRole("dialog", { name: "Mark Marcus Reed as no-show?" })
    expect(dialog).toHaveAccessibleDescription("He'll get 0 hours for Osteria Nove.")
    await userEvent.click(screen.getByRole("button", { name: "Mark no-show" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
