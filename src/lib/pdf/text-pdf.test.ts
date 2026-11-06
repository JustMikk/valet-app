import { describe, expect, it } from "vitest"

import { buildPdf, textWidth } from "./text-pdf"

const latin1 = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join("")

describe("buildPdf", () => {
  const pdf = latin1(
    buildPdf([
      [
        { text: "Invoice (draft) \\ 1", x: 54, y: 700, size: 20, bold: true },
        { text: "$1,234.00", x: 558, y: 680, align: "right" },
      ],
      [{ text: "Page two – “quoted”", x: 54, y: 700 }],
    ]),
  )

  it("is a PDF with a header, trailer and one page object per page", () => {
    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true)
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true)
    expect(pdf).toContain("/Count 2")
  })

  it("escapes string delimiters and keeps text readable", () => {
    expect(pdf).toContain("(Invoice \\(draft\\) \\\\ 1) Tj")
  })

  it("maps typographic characters to WinAnsi bytes", () => {
    expect(pdf).toContain(
      `(Page two ${String.fromCharCode(0x96)} ${String.fromCharCode(0x93)}quoted${String.fromCharCode(0x94)}) Tj`,
    )
  })

  it("has a cross-reference table whose offsets point at each object", () => {
    const start = Number(/startxref\n(\d+)/.exec(pdf)?.[1])
    expect(pdf.slice(start, start + 4)).toBe("xref")
    const entries = [...pdf.slice(start).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]))
    expect(entries.length).toBeGreaterThan(5)
    entries.forEach((offset, i) => {
      expect(pdf.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
    })
  })

  it("right-aligns by starting the text at x minus its width", () => {
    const x = 558 - textWidth("$1,234.00", 11)
    expect(pdf).toContain(`${Math.round(x * 100) / 100} 680 Td`)
  })
})

describe("buildPdf with the Regency banner", () => {
  const pages = [[{ text: "Body one", x: 54, y: 600 }], [{ text: "Body two", x: 54, y: 600 }]]
  const count = (text: string, part: string) => text.split(part).length - 1

  it("draws the dark banner with its label and number on every page", () => {
    const pdf = latin1(
      buildPdf(pages, { banner: { title: "INVOICE", subtitle: "INV-2026-0151", logo: null } }),
    )
    expect(count(pdf, "(INVOICE) Tj")).toBe(2)
    expect(count(pdf, "(INV-2026-0151) Tj")).toBe(2)
    // The rounded bar is a closed, filled path; the wordmark stands in for a missing logo.
    expect(count(pdf, "h f")).toBe(2)
    expect(count(pdf, "(REGENCY) Tj")).toBe(2)
  })

  it("embeds the logo once and places it on every page", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
    const pdf = latin1(
      buildPdf(pages, {
        banner: { title: "PAY STUB", subtitle: "Nov 1 – 15", logo: { jpeg, width: 2, height: 1 } },
      }),
    )
    expect(count(pdf, "/Subtype /Image")).toBe(1)
    expect(pdf).toContain("/Filter /DCTDecode")
    expect(pdf).toContain(latin1(jpeg))
    expect(count(pdf, "/Im1 Do")).toBe(2)
    expect(pdf).not.toContain("(REGENCY) Tj")
  })

  it("keeps the cross-reference offsets right around the binary image", () => {
    const jpeg = new Uint8Array(Array.from({ length: 300 }, (_, i) => i % 256))
    const pdf = latin1(
      buildPdf(pages, {
        banner: { title: "T", subtitle: "S", logo: { jpeg, width: 3, height: 1 } },
      }),
    )
    const start = Number(/startxref\n(\d+)/.exec(pdf)?.[1])
    const entries = [...pdf.slice(start).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]))
    entries.forEach((offset, i) => {
      expect(pdf.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
    })
  })
})

describe("textWidth", () => {
  it("measures digits at 0.556 em", () => {
    expect(textWidth("100", 10)).toBeCloseTo(16.68, 2)
  })
})
