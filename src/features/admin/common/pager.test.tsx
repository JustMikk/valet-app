import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Pager, usePager } from "./pager"

function List({ count, size }: { count: number; size?: number }) {
  const pager = usePager(
    Array.from({ length: count }, (_, i) => `Row ${i + 1}`),
    size,
  )
  return (
    <>
      <ul>
        {pager.rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
      <Pager {...pager} />
    </>
  )
}

describe("Pager", () => {
  it("shows one page at a time and steps with the arrows", async () => {
    const user = userEvent.setup()
    render(<List count={20} />)
    expect(screen.getAllByRole("listitem")).toHaveLength(8)
    expect(screen.getByText("1–8 of 20")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Previous page" }).hasAttribute("disabled")).toBe(
      true,
    )

    await user.click(screen.getByRole("button", { name: "Next page" }))
    await user.click(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText("17–20 of 20")).toBeTruthy()
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.getByRole("button", { name: "Next page" }).hasAttribute("disabled")).toBe(true)
  })

  it("hides when everything fits on one page", () => {
    render(<List count={8} />)
    expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull()
  })
})
