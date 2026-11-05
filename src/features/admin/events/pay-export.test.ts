import { describe, expect, it } from "vitest"

import type { EventPay } from "@/lib/data"

import { payCsv, payFileName, payPages, payPdf } from "./pay-export"

const sheet: EventPay = {
  eventId: "e1",
  venue: "Post Oak Hotel",
  name: "Gala",
  date: "Tue Sep 15",
  start: "8:00 AM",
  end: "3:30 PM",
  rateCents: 2100,
  rows: [
    {
      assignmentId: "a1",
      staffId: "s1",
      name: "Sebah Idris",
      minutes: 450,
      amountCents: 15_750,
      balanceCents: 0,
      state: "paid",
      tips: true,
    },
    {
      assignmentId: "a2",
      staffId: "s2",
      name: "Kibrom Alemu",
      minutes: 450,
      amountCents: 15_750,
      balanceCents: 15_750,
      state: "pending",
      tips: false,
    },
  ],
  totals: {
    valets: 2,
    minutes: 900,
    amountCents: 31_500,
    paidCents: 15_750,
    pendingCents: 15_750,
  },
}

const lines = (csv: string) => csv.split("\r\n")

describe("payCsv", () => {
  it("opens with the event facts, as on the client's valet schedule", () => {
    expect(lines(payCsv(sheet)).slice(0, 4)).toEqual([
      "Event,Post Oak Hotel · Gala",
      "Date,Tue Sep 15",
      "Time,8:00 AM – 3:30 PM",
      "Per hour,21.00",
    ])
  })

  it("lists one numbered row per valet with paid, tips, balance and status", () => {
    const all = lines(payCsv(sheet))
    expect(all).toContain("No.,Valet name,Hours,Rate,Total,Paid,Tips,Balance,Status")
    expect(all).toContain("1,Sebah Idris,7.50,21.00,157.50,Yes,Yes,0.00,Paid")
    expect(all).toContain("2,Kibrom Alemu,7.50,21.00,157.50,No,No,157.50,Pending")
  })

  it("ends with the summary", () => {
    expect(lines(payCsv(sheet)).slice(-5)).toEqual([
      "Total valets,2",
      "Total hours,15.00",
      "Total pay,315.00",
      "Total paid,157.50",
      "Total pending,157.50",
    ])
  })

  it("quotes commas and quotes, and defuses spreadsheet formulas in names", () => {
    const tricky = {
      ...sheet,
      rows: [
        { ...sheet.rows[0], name: 'Lewis, "Raf"' },
        { ...sheet.rows[1], name: "=HYPERLINK(1)" },
      ],
    }
    const all = lines(payCsv(tricky))
    expect(all).toContain('1,"Lewis, ""Raf""",7.50,21.00,157.50,Yes,Yes,0.00,Paid')
    expect(all).toContain("2,'=HYPERLINK(1),7.50,21.00,157.50,No,No,157.50,Pending")
  })
})

describe("payFileName", () => {
  it("names the file after the venue, event and date", () => {
    expect(payFileName(sheet, "csv")).toBe("pay-post-oak-hotel-gala-tue-sep-15.csv")
  })
})

describe("payPages", () => {
  const texts = payPages(sheet, "Regency Valet Parking")
    .flat()
    .map((item) => item.text)

  it("prints the event, each valet with paid and tips, and the totals", () => {
    expect(texts).toEqual(
      expect.arrayContaining([
        "Regency Valet Parking",
        "VALET PAY SHEET",
        "Post Oak Hotel · Gala",
        "Tue Sep 15 · 8:00 AM – 3:30 PM · $21.00 / h",
        "Sebah Idris",
        "Kibrom Alemu",
        "7.5 h",
        "$157.50",
        "Total pay",
        "$315.00",
        "Pending",
      ]),
    )
  })

  it("continues onto a new page with the headings repeated", () => {
    const many = { ...sheet, rows: Array.from({ length: 40 }, () => sheet.rows[1]) }
    const pages = payPages(many, "Regency")
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[1]?.map((item) => item.text)).toContain("Valet")
  })
})

describe("payPdf", () => {
  it("produces a PDF", () => {
    const bytes = payPdf(sheet, "Regency")
    expect(String.fromCharCode(...bytes.slice(0, 8))).toBe("%PDF-1.4")
  })
})
