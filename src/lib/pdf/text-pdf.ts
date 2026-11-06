// A small PDF writer for text documents (invoices, pay sheets): Letter pages, the built-in
// Helvetica and Helvetica-Bold fonts, left- or right-aligned text at absolute positions, and the
// Regency banner on top of every page. No dependency; enough for a real, printable PDF.

export const PAGE = { width: 612, height: 792, margin: 54 } as const

/** A JPEG to draw (the banner logo), with its size in pixels. */
export type PdfImage = { jpeg: Uint8Array; width: number; height: number }

/** The Regency bar on every page: logo left, a gold label and a white line right. */
export type PdfBanner = { title: string; subtitle: string; logo: PdfImage | null }

/** The banner's dark ground (the brand's hero ink), 0–255 RGB: logos are rendered onto it. */
export const BANNER_FILL = [14, 14, 16] as const
// The brand gold and white, 0–1 for PDF colour operators.
const GOLD = "0.788 0.635 0.29"
const WHITE = "1 1 1"

const BAR = { x: 36, top: PAGE.height - 36, height: 64, radius: 14 } as const
const BAR_BOTTOM = BAR.top - BAR.height
const LOGO_HEIGHT = 40

/** Where page content starts below the banner. */
export const CONTENT_TOP = BAR_BOTTOM - 34

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

function textOp(item: TextItem, color?: string): string {
  const size = item.size ?? 11
  const x = item.align === "right" ? item.x - textWidth(item.text, size) : item.x
  const fill = color ? `${color} rg ` : ""
  return `BT ${fill}/${item.bold ? "F2" : "F1"} ${num(size)} Tf ${num(x)} ${num(item.y)} Td (${literal(item.text)}) Tj ET`
}

const contentOf = (page: PdfPage) => page.map((item) => textOp(item)).join("\n")

/** A filled rectangle with rounded corners (Bézier quarter circles). */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = r * 0.5523
  return [
    `${num(x + r)} ${num(y)} m`,
    `${num(x + w - r)} ${num(y)} l`,
    `${num(x + w - r + k)} ${num(y)} ${num(x + w)} ${num(y + r - k)} ${num(x + w)} ${num(y + r)} c`,
    `${num(x + w)} ${num(y + h - r)} l`,
    `${num(x + w)} ${num(y + h - r + k)} ${num(x + w - r + k)} ${num(y + h)} ${num(x + w - r)} ${num(y + h)} c`,
    `${num(x + r)} ${num(y + h)} l`,
    `${num(x + r - k)} ${num(y + h)} ${num(x)} ${num(y + h - r + k)} ${num(x)} ${num(y + h - r)} c`,
    `${num(x)} ${num(y + r)} l`,
    `${num(x)} ${num(y + r - k)} ${num(x + r - k)} ${num(y)} ${num(x + r)} ${num(y)} c`,
    "h f",
  ].join("\n")
}

/**
 * The banner's drawing operators; `/Im1` is the logo when there is one. Wrapped in q … Q: the fill
 * colour is graphics state that ET does not reset, so the white subtitle would otherwise paint
 * the whole page body white.
 */
function bannerOf(banner: PdfBanner): string {
  const width = PAGE.width - BAR.x * 2
  const right = BAR.x + width - 20
  const fill = BANNER_FILL.map((c) => num(c / 255)).join(" ")
  const ops = [`q ${fill} rg`, roundedRect(BAR.x, BAR_BOTTOM, width, BAR.height, BAR.radius), "Q"]
  const logoY = BAR_BOTTOM + (BAR.height - LOGO_HEIGHT) / 2
  if (banner.logo) {
    const logoWidth = (LOGO_HEIGHT * banner.logo.width) / banner.logo.height
    ops.push(`q ${num(logoWidth)} 0 0 ${LOGO_HEIGHT} ${BAR.x + 20} ${num(logoY)} cm /Im1 Do Q`)
  } else {
    ops.push(textOp({ text: "REGENCY", x: BAR.x + 20, y: logoY + 13, size: 18, bold: true }, GOLD))
  }
  ops.push(
    textOp(
      { text: banner.title, x: right, y: BAR.top - 26, size: 9, bold: true, align: "right" },
      GOLD,
    ),
    textOp(
      { text: banner.subtitle, x: right, y: BAR.top - 45, size: 13, bold: true, align: "right" },
      WHITE,
    ),
  )
  return ["q", ...ops, "Q"].join("\n")
}

/** Bytes as a one-char-per-byte string, so binary streams survive the byte conversion below. */
const binary = (bytes: Uint8Array) => {
  let out = ""
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return out
}

/** The PDF file for these pages, as bytes; with `banner`, every page opens with it. */
export function buildPdf(
  pages: PdfPage[],
  options: { banner?: PdfBanner } = {},
): Uint8Array<ArrayBuffer> {
  const objects: string[] = []
  const add = (body: string) => objects.push(body) // object number = index + 1
  const logo = options.banner?.logo ?? null

  // 1 catalog, 2 page tree, 3 regular font, 4 bold font, [5 logo], then (page, content) pairs.
  const first = logo ? 6 : 5
  const pageIds = pages.map((_, i) => first + i * 2)
  add("<< /Type /Catalog /Pages 2 0 R >>")
  add(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  )
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  if (logo) {
    add(
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpeg.length} >>\n` +
        `stream\n${binary(logo.jpeg)}\nendstream`,
    )
  }
  const images = logo ? " /XObject << /Im1 5 0 R >>" : ""
  pages.forEach((page, i) => {
    const body = contentOf(page)
    const stream = options.banner ? `${bannerOf(options.banner)}\n${body}` : body
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >>${images} >> /Contents ${first + 1 + i * 2} 0 R >>`,
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
