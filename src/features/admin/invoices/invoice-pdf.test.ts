import { describe, expect, it } from "vitest"

import type { InvoiceDetail } from "@/lib/data"

import { invoiceNumber, invoicePages, invoicePdf } from "./invoice-pdf"

const invoice: InvoiceDetail = {
  id: "inv",
  number: "INV-2026-0142 · DRAFT",
  venue: "Harbor Pavilion",
  period: "Oct 16 – 31, 2026 · from approved hours",
  totalCents: 528_200,
  notice: "2 entries from Oct 24 are still in review and not included.",
  billedTo: "billing@harborpavilion.com",
  sent: false,
  lines: [
    {
      what: "Wedding · Sat Oct 24",
      staffCount: 8,
      minutes: 3510,
      rateCents: 3800,
      amountCents: 222_300,
    },
    {
      what: "Sunday brunch · Oct 18",
      staffCount: 5,
      minutes: 1470,
      rateCents: 3800,
      amountCents: 93_100,
    },
  ],
}

const texts = (pages: ReturnType<typeof invoicePages>) => pages.flat().map((item) => item.text)

describe("invoicePages", () => {
  it("prints the venue, period, every line, the total and the notice", () => {
    const all = texts(invoicePages(invoice, "Regency Valet Parking"))
    expect(all).toEqual(
      expect.arrayContaining([
        "Regency Valet Parking",
        "INV-2026-0142",
        "Harbor Pavilion",
        "Billed to billing@harborpavilion.com",
        "Wedding · Sat Oct 24",
        "58.5 h",
        "$38.00 / h",
        "$2,223.00",
        "$5,282.00",
        invoice.notice,
      ]),
    )
  })

  it("leaves the notice off a sent invoice", () => {
    const all = texts(invoicePages({ ...invoice, notice: null, sent: true }, "Regency"))
    expect(all.some((text) => text.includes("still in review"))).toBe(false)
  })

  it("continues onto a new page, repeating the column headings", () => {
    const many = {
      ...invoice,
      lines: Array.from({ length: 40 }, (_, i) => ({ ...invoice.lines[0], what: `Event ${i}` })),
    }
    const pages = invoicePages(many, "Regency")
    expect(pages.length).toBeGreaterThan(1)
    expect(texts([pages[1]])).toContain("Description")
  })
})

describe("invoicePdf", () => {
  it("produces a PDF", () => {
    const bytes = invoicePdf(invoice, "Regency")
    expect(String.fromCharCode(...bytes.slice(0, 8))).toBe("%PDF-1.4")
  })

  it("names the file by the invoice number alone", () => {
    expect(invoiceNumber("INV-2026-0142 · OVERDUE")).toBe("INV-2026-0142")
  })
})
