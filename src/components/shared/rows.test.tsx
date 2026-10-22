import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { STATUS } from "@/lib/status/presets"

import { HeroStat } from "./hero-stat"
import { ListRow, ListRowAction, ListRowValue } from "./list-row"
import { PersonAvatar, PersonRow } from "./person-row"
import { StatusBadge } from "./status-badge"

describe("ListRow", () => {
  it("renders label with a value", () => {
    render(<ListRow trailing={<ListRowValue>5:45 PM</ListRowValue>}>Clock-in opens</ListRow>)
    expect(screen.getByText("Clock-in opens")).toBeInTheDocument()
    expect(screen.getByText("5:45 PM")).toBeInTheDocument()
  })

  it("can render as a button with an action and chevron", async () => {
    const onClick = vi.fn()
    render(
      <ListRow
        render={<button type="button" onClick={onClick} />}
        trailing={<ListRowAction chevron>Directions</ListRowAction>}
      >
        400 Market St, San Francisco
      </ListRow>,
    )
    await userEvent.click(screen.getByRole("button", { name: /400 Market St.*Directions/ }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe("HeroStat", () => {
  it("shows the number and the delta line", () => {
    render(
      <HeroStat
        value="2h 14m"
        delta={{ tone: "ok", icon: "north_east", label: "On the clock", context: "since 5:51 PM" }}
      />,
    )
    expect(screen.getByText("2h 14m")).toBeInTheDocument()
    expect(screen.getByText("On the clock")).toBeInTheDocument()
    expect(screen.getByText("since 5:51 PM")).toBeInTheDocument()
  })
})

describe("PersonRow", () => {
  it("shows initials, name, evidence and a trailing status", () => {
    render(
      <PersonRow
        avatar={<PersonAvatar name="Ana Kovač" />}
        name="Ana Kovač"
        detail="In 5:52 PM · 38 m from center · ±12 m"
        trailing={<StatusBadge status={STATUS.onSite}>2h 12m</StatusBadge>}
      />,
    )
    expect(screen.getByText("AK")).toBeInTheDocument()
    // The initials repeat the name beside them, so assistive tech should skip them.
    expect(screen.getByText("AK").closest("[aria-hidden='true']")).not.toBeNull()
    expect(screen.getByText("Ana Kovač")).toBeInTheDocument()
    expect(screen.getByText("2h 12m")).toBeInTheDocument()
  })

  it("renders an open slot without a person", () => {
    render(
      <PersonRow avatar={<PersonAvatar open />} name="Open slot" detail="Started 1h 04m ago" />,
    )
    expect(screen.getByText("Open slot")).toBeInTheDocument()
  })
})
