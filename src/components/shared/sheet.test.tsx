import { useState } from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ConfirmSheet } from "./confirm-sheet"
import { ResponsiveSheet } from "./responsive-sheet"

/** Stubs matchMedia for a given viewport width; `resize` notifies subscribers like a real window. */
function createViewport(initial: number) {
  let width = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal("matchMedia", (query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      get matches() {
        return width >= min
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }
  })
  return {
    resize(next: number) {
      width = next
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("ResponsiveSheet", () => {
  it("opens as a bottom sheet on phone, with a grabber", async () => {
    createViewport(390)
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Clock out now?">
        Body
      </ResponsiveSheet>,
    )
    const dialog = await screen.findByRole("dialog", { name: "Clock out now?" })
    expect(dialog.querySelector("[data-grabber]")).not.toBeNull()
  })

  it("opens as a centered dialog from 700 px, without a grabber", async () => {
    createViewport(1024)
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Clock out now?">
        Body
      </ResponsiveSheet>,
    )
    const dialog = await screen.findByRole("dialog", { name: "Clock out now?" })
    expect(dialog.querySelector("[data-grabber]")).toBeNull()
  })

  it("asks to close on Escape", async () => {
    createViewport(1024)
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

  it.each([390, 1024])(
    "has a Close control that does not depend on a gesture (%i px)",
    async (width) => {
      createViewport(width)
      const onOpenChange = vi.fn()
      render(
        <ResponsiveSheet open onOpenChange={onOpenChange} title="Details">
          Body
        </ResponsiveSheet>,
      )
      await userEvent.click(await screen.findByRole("button", { name: "Close" }))
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    },
  )

  it("omits the Close control when told the content has its own dismissal", async () => {
    createViewport(390)
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Details" dismissible={false}>
        Body
      </ResponsiveSheet>,
    )
    await screen.findByRole("dialog")
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })

  it("keeps the same sheet and its content when the viewport changes while open", async () => {
    const viewport = createViewport(390)
    const Harness = ({ open }: { open: boolean }) => (
      <ResponsiveSheet open={open} onOpenChange={() => {}} title="Edit">
        <input aria-label="Name" />
      </ResponsiveSheet>
    )
    const { rerender } = render(<Harness open />)
    const input = await screen.findByLabelText("Name")
    await userEvent.type(input, "Ana")

    viewport.resize(1024)

    expect(screen.getByLabelText("Name")).toBe(input) // same DOM node: not remounted
    expect(input).toHaveValue("Ana")
    expect(input).toHaveFocus()
    expect(screen.getByRole("dialog").querySelector("[data-grabber]")).not.toBeNull()

    // Once closed, the next opening follows the new breakpoint.
    rerender(<Harness open={false} />)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    rerender(<Harness open />)
    const reopened = await screen.findByRole("dialog")
    expect(reopened.querySelector("[data-grabber]")).toBeNull()
  })

  it.each([390, 1024])("returns focus to the trigger when it closes (%i px)", async (width) => {
    createViewport(width)
    function WithTrigger() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open details
          </button>
          <ResponsiveSheet open={open} onOpenChange={setOpen} title="Details">
            Body
          </ResponsiveSheet>
        </>
      )
    }
    render(<WithTrigger />)
    const trigger = screen.getByRole("button", { name: "Open details" })
    await userEvent.click(trigger)
    await screen.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(trigger).toHaveFocus()
  })
})

describe("ConfirmSheet", () => {
  it("states the consequence and confirms or cancels", async () => {
    createViewport(1024)
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

  it("relies on Cancel as its dismissal, with no extra Close control", async () => {
    createViewport(390)
    render(
      <ConfirmSheet
        open
        onOpenChange={() => {}}
        title="Remove this shift?"
        consequence="It returns to the open list."
        confirmLabel="Remove"
        onConfirm={() => {}}
      />,
    )
    await screen.findByRole("dialog")
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })
})
