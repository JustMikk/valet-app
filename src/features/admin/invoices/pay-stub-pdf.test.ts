import { describe, expect, it } from "vitest"

import type { PayrollRow } from "@/lib/data"

import { payStubFileName, payStubPages, payStubPdf } from "./pay-stub-pdf"

const row: PayrollRow = {
  staffId: "s1",
  initials: "SI",
  name: "Sebah Idris",
  email: "sebah@example.com",
  shifts: 2,
  hours: "12.5 h",
  amountCents: 26_250,
  pendingCents: 15_750,
  lines: [
    { event: "Gala", date: "Sep 15", hours: "7.5 h", amountCents: 15_750, paid: false },
    { event: "Brunch", date: "Sep 20", hours: "5.0 h", amountCents: 10_500, paid: true },
  ],
}

const texts = (pages: ReturnType<typeof payStubPages>) => pages.flat().map((item) => item.text)

describe("payStubPages", () => {
  it("prints the valet, each event with hours, pay and paid, the total and what is pending", () => {
    expect(texts(payStubPages(row, "Sep 1 – 15", "Regency Valet Parking"))).toEqual(
      expect.arrayContaining([
        "Regency Valet Parking",
        "Sebah Idris",
        "Sep 1 – 15 · sebah@example.com",
        "Gala",
        "Sep 15",
        "7.5 h",
        "$157.50",
        "No",
        "Brunch",
        "Yes",
        "Total",
        "12.5 h",
        "$262.50",
        "Pending",
        "$157.50",
      ]),
    )
  })

  it("says so when the period has no approved shifts", () => {
    expect(texts(payStubPages({ ...row, lines: [] }, "Sep 1 – 15", "Regency"))).toContain(
      "No approved shifts this period.",
    )
  })
})

describe("payStubPdf", () => {
  it("opens with the Regency banner: PAY STUB and the period", () => {
    const pdf = Array.from(payStubPdf(row, "Sep 1 – 15", "Regency", null), (b) =>
      String.fromCharCode(b),
    ).join("")
    expect(pdf.startsWith("%PDF-1.4")).toBe(true)
    expect(pdf).toContain("(PAY STUB) Tj")
    expect(pdf).toContain(`(Sep 1 ${String.fromCharCode(0x96)} 15) Tj`)
  })
})

describe("payStubFileName", () => {
  it("names the file after the valet and the period", () => {
    expect(payStubFileName(row, "Sep 1 – 15")).toBe("pay-stub-sebah-idris-sep-1-15.pdf")
  })
})
