// A small PDF writer for text documents (invoices): Letter pages, the built-in Helvetica and
// Helvetica-Bold fonts, left- or right-aligned text at absolute positions. No dependency, no
// images; enough to produce a real, openable, printable PDF in the browser.

export const PAGE = { width: 612, height: 792, margin: 54 } as const

export type TextItem = {
  text: string
  x: number
  /** Baseline, measured from the bottom of the page. */
  y: number
  size?: number
  bold?: boolean
  /** `right`: `x` is where the text ends. */
  align?: "left" | "right"
}
export type PdfPage = TextItem[]

// Helvetica advance widths (1/1000 em) for printable ASCII 32..126, from the standard AFM.
// prettier-ignore
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]
const DEFAULT_WIDTH = 556

/** Width of `text` in points at `size`. Exact for digits, money and plain ASCII. */
export function textWidth(text: string, size: number): number {
  let total = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    total += code >= 32 && code <= 126 ? (WIDTHS[code - 32] ?? DEFAULT_WIDTH) : DEFAULT_WIDTH
  }
  return (total * size) / 1000
}

// Characters outside Latin-1 that WinAnsi (the encoding the fonts use) still has.
const WIN_ANSI: Record<string, number> = {
  "€": 0x80,
  "…": 0x85,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
}

/** One byte per character, escaped for a PDF string literal; unknown characters become "?". */
function literal(text: string): string {
  let out = ""
  for (const char of text) {
    const code = WIN_ANSI[char] ?? char.charCodeAt(0)
    const byte = code <= 0xff ? code : 0x3f
    const safe = String.fromCharCode(byte)
    out += safe === "\\" || safe === "(" || safe === ")" ? `\\${safe}` : safe
  }
  return out
}

const num = (value: number) => String(Math.round(value * 100) / 100)

function contentOf(page: PdfPage): string {
  return page
    .map((item) => {
      const size = item.size ?? 11
      const x = item.align === "right" ? item.x - textWidth(item.text, size) : item.x
      return `BT /${item.bold ? "F2" : "F1"} ${num(size)} Tf ${num(x)} ${num(item.y)} Td (${literal(item.text)}) Tj ET`
    })
    .join("\n")
}

/** The PDF file for these pages, as bytes. */
export function buildPdf(pages: PdfPage[]): Uint8Array<ArrayBuffer> {
  const objects: string[] = []
  const add = (body: string) => objects.push(body) // object number = index + 1

  // 1 catalog, 2 page tree, 3 regular font, 4 bold font, then (page, content) pairs.
  const pageIds = pages.map((_, i) => 5 + i * 2)
  add("<< /Type /Catalog /Pages 2 0 R >>")
  add(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  )
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  pages.forEach((page, i) => {
    const stream = contentOf(page)
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
    )
    add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  let file = "%PDF-1.4\n"
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(file.length)
    file += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = file.length
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) file += `${String(offset).padStart(10, "0")} 00000 n \n`
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  const bytes = new Uint8Array(new ArrayBuffer(file.length))
  for (let i = 0; i < file.length; i++) bytes[i] = file.charCodeAt(i) & 0xff
  return bytes
}
