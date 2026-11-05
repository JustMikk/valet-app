import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { AppShell } from "./app-shell"
import { NotificationList, type NotificationGroup } from "./notification-list"
import { PushPrompt } from "./push-prompt"

const groups: NotificationGroup[] = [
  {
    label: "TODAY",
    items: [
      {
        id: "1",
        icon: "chat_bubble",
        tone: "info",
        title: "New message from Alex",
        body: "Use the side entrance",
        time: "4:00 AM",
        href: "/staff/inbox",
        unread: true,
      },
    ],
  },
  {
    label: "EARLIER",
    items: [
      {
        id: "2",
        icon: "check_circle",
        tone: "ok",
        title: "Hours approved",
        body: "Maison Blanc, 5h 12m",
        time: "Thu",
        href: "/staff/shifts",
        unread: false,
      },
    ],
  },
]

describe("NotificationList", () => {
  it("groups rows by day and links each to its screen", () => {
    render(<NotificationList groups={groups} />)
    expect(screen.getByRole("region", { name: "TODAY" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "EARLIER" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /New message from Alex/ })).toHaveAttribute(
      "href",
      "/staff/inbox",
    )
  })

  it("marks only unread rows, in words as well as colour", () => {
    render(<NotificationList groups={groups} />)
    expect(screen.getAllByRole("img", { name: "Unread" })).toHaveLength(1)
  })

  it("calls onOpen when a row is chosen", async () => {
    const onOpen = vi.fn((event?: unknown) => event)
    render(<NotificationList groups={groups} onOpen={() => onOpen()} />)
    await userEvent.click(screen.getByRole("link", { name: /Hours approved/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("says so when there is nothing", () => {
    render(<NotificationList groups={[]} />)
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })
})

describe("PushPrompt", () => {
  const handlers = { onEnable: vi.fn(), onDisable: vi.fn() }

  it("draws nothing where push cannot work", () => {
    const { container, rerender } = render(<PushPrompt status="unavailable" {...handlers} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<PushPrompt status="unconfigured" {...handlers} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("offers to turn alerts on, and off", async () => {
    const { rerender } = render(<PushPrompt status="off" {...handlers} />)
    await userEvent.click(screen.getByRole("button", { name: "Turn on" }))
    expect(handlers.onEnable).toHaveBeenCalledTimes(1)
    rerender(<PushPrompt status="on" {...handlers} />)
    expect(screen.getByText("Alerts are on for this device")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }))
    expect(handlers.onDisable).toHaveBeenCalledTimes(1)
  })

  it("explains a blocked permission instead of offering a dead button", () => {
    render(<PushPrompt status="blocked" {...handlers} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.getByText(/blocked/i)).toBeInTheDocument()
  })

  it("shows what went wrong", () => {
    render(<PushPrompt status="off" error="Couldn't turn on." {...handlers} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't turn on.")
  })
})

describe("notification bell and drawer", () => {
  // jsdom has no scrollTo; the route screen resets its scroll position on every route change.
  beforeAll(() => {
    Element.prototype.scrollTo = vi.fn()
  })

  const shell = (unread: number, onClose?: () => void) => (
    <AppShell
      app="staff"
      logo={{ src: "/brand/regency-crest.svg", alt: "Regency", width: 224, height: 235 }}
      brand={{ title: "Regency" }}
      phoneTitle="Regency"
      user={{ initials: "JE", name: "Jordan Ellis", role: "Valet" }}
      sidebarItems={[{ key: "home", label: "Home", icon: "home", href: "/staff" }]}
      tabItems={[{ key: "home", label: "Home", icon: "home", href: "/staff" }]}
      currentKey="home"
      isRoot
      notifications={{ unread, onClose, children: <p>Drawer content</p> }}
      onBack={() => {}}
    >
      Page
    </AppShell>
  )

  it("names the unread count and opens the drawer over the page", async () => {
    render(shell(3))
    const bells = screen.getAllByRole("button", { name: "Notifications, 3 unread" })
    expect(bells.length).toBeGreaterThan(0)
    await userEvent.click(bells[0])
    expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeInTheDocument()
    expect(screen.getByText("Drawer content")).toBeInTheDocument()
    expect(screen.getByText("Page")).toBeInTheDocument()
  })

  it("reports closing, however it is dismissed, so the app can mark things read", async () => {
    const onClose = vi.fn()
    render(shell(1, onClose))
    const bell = screen.getAllByRole("button", { name: /^Notifications/ })[0]
    await userEvent.click(bell)
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(await screen.findByRole("button", { name: "Close notifications" }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it("draws no bell when the app gives no notifications", () => {
    render(
      <AppShell
        app="staff"
        logo={{ src: "/brand/regency-crest.svg", alt: "Regency", width: 224, height: 235 }}
        brand={{ title: "Regency" }}
        phoneTitle="Regency"
        user={{ initials: "JE", name: "Jordan Ellis", role: "Valet" }}
        sidebarItems={[]}
        tabItems={[]}
        currentKey={null}
        isRoot
        onBack={() => {}}
      >
        Page
      </AppShell>,
    )
    expect(screen.queryByRole("button", { name: /^Notifications/ })).not.toBeInTheDocument()
  })
})
