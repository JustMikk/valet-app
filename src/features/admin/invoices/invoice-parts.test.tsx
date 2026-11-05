import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { InvoiceDetail } from "@/lib/data"

import { InvoiceDetails, InvoiceFacts, Money, splitInvoiceNumber } from "./invoice-parts"

describe("splitInvoiceNumber", () => {
  it("separates the number from its status word", () => {
    const { number, status } = splitInvoiceNumber("INV-2026-0142 · DRAFT")
    expect(number).toBe("INV-2026-0142")
    expect(status?.label).toBe("Draft")
  })

  it("reads overdue without its day count", () => {
    expect(splitInvoiceNumber("INV-2026-0140 · OVERDUE").status?.label).toBe("Overdue")
  })

  it("has no chip for an unknown or missing status", () => {
    expect(splitInvoiceNumber("INV-2026-0143").status).toBeNull()
    expect(splitInvoiceNumber("INV-2026-0143 · VOID").status).toBeNull()
  })
})

describe("Money", () => {
  it("sets the cents apart from the dollars", () => {
    render(<Money cents={528_250} />)
    expect(screen.getByText(".50")).toBeInTheDocument()
    expect(screen.getByText(".50").parentElement).toHaveTextContent("$5,282.50")
  })
})

describe("InvoiceFacts", () => {
  it("splits an event summary into when and crew rows", () => {
    render(<InvoiceFacts period="Wedding · Sat Nov 7 · 6:00 – 11:00 PM · 4 of 5 staff" event />)
    expect(screen.getByText("Wedding · Sat Nov 7")).toBeInTheDocument()
    expect(screen.getByText("6:00 – 11:00 PM · 4 of 5 staff")).toBeInTheDocument()
  })

  it("keeps a period invoice's line whole", () => {
    render(<InvoiceFacts period="Oct 16 – 31, 2026 · from approved hours" event={false} />)
    expect(screen.getByText("Oct 16 – 31, 2026 · from approved hours")).toBeInTheDocument()
  })
})

describe("InvoiceDetails", () => {
  const invoice: InvoiceDetail = {
    id: "inv",
    number: "INV-2026-0142 · DRAFT",
    venue: "Harbor Pavilion",
    period: "Oct 16 – 31, 2026 · from approved hours",
    totalCents: 315_400,
    notice: null,
    billedTo: "billing@harborpavilion.com",
    sent: false,
    lines: [
      { what: "Wedding", staffCount: 8, minutes: 3510, rateCents: 3800, amountCents: 222_300 },
      { what: "Brunch", staffCount: 5, minutes: 1470, rateCents: 3800, amountCents: 93_100 },
    ],
  }

  it("lists a draft's facts, with its one bill rate and the terms", () => {
    render(<InvoiceDetails invoice={invoice} status={splitInvoiceNumber(invoice.number).status} />)
    expect(screen.getByText("billing@harborpavilion.com")).toBeInTheDocument()
    expect(screen.getByText("Oct 16 – 31, 2026")).toBeInTheDocument()
    expect(screen.getByText("Bill rate")).toBeInTheDocument()
    expect(screen.getByText("Due 14 days after sending")).toBeInTheDocument()
  })

  it("drops the terms once sent and the rate when lines differ", () => {
    const gala = {
      what: "Gala",
      staffCount: 6,
      minutes: 2400,
      rateCents: 3500,
      amountCents: 140_000,
    }
    const sent = { ...invoice, sent: true, lines: [...invoice.lines, gala] }
    render(<InvoiceDetails invoice={sent} status={null} />)
    expect(screen.queryByText("Terms")).not.toBeInTheDocument()
    expect(screen.queryByText("Bill rate")).not.toBeInTheDocument()
    expect(screen.queryByText("Status")).not.toBeInTheDocument()
  })
})
