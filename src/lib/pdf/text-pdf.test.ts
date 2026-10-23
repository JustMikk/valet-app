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

describe("textWidth", () => {
  it("measures digits at 0.556 em", () => {
    expect(textWidth("100", 10)).toBeCloseTo(16.68, 2)
  })
})
