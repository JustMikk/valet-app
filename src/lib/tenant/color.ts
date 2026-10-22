// Color math for tenant accent derivation: sRGB ↔ OKLab/OKLCH (Björn Ottosson, 2020),
// WCAG 2.1 relative luminance and contrast, and perceptual distance in OKLab.

export type Rgb = { r: number; g: number; b: number }
export type Oklch = { l: number; c: number; h: number }
type Oklab = { l: number; a: number; b: number }

export function parseHex(hex: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) throw new Error(`Not a #RRGGBB color: ${hex}`)
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
}

export function toHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  )
}

const toLinear = (v: number) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const fromLinear = (c: number) =>
  255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function toOklab({ r, g, b }: Rgb): Oklab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/** Linear sRGB channels (unclamped) for an OKLab color. */
function oklabToLinear({ l, a, b }: Oklab): [number, number, number] {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

export function toOklch(rgb: Rgb): Oklch {
  const { l, a, b } = toOklab(rgb)
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { l, c: Math.hypot(a, b), h: h < 0 ? h + 360 : h }
}

const inGamut = (channels: number[]) => channels.every((c) => c >= -1e-4 && c <= 1 + 1e-4)

/** OKLCH → sRGB, reducing chroma (keeping lightness and hue) until the color fits sRGB. */
export function fromOklch({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180
  const lab = (chroma: number): Oklab => ({
    l,
    a: chroma * Math.cos(rad),
    b: chroma * Math.sin(rad),
  })
  let chroma = c
  if (!inGamut(oklabToLinear(lab(chroma)))) {
    let lo = 0
    let hi = c
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklabToLinear(lab(mid)))) lo = mid
      else hi = mid
    }
    chroma = lo
  }
  const [r, g, b] = oklabToLinear(lab(chroma)).map((v) =>
    Math.min(255, Math.max(0, fromLinear(Math.min(1, Math.max(0, v))))),
  )
  return { r, g, b }
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** WCAG 2.1 contrast ratio between two colors (1–21). */
export function contrastRatio(x: Rgb, y: Rgb): number {
  const [hi, lo] = [relativeLuminance(x), relativeLuminance(y)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

/** Euclidean distance in OKLab, scaled ×100 (≈ 1 is a just-noticeable difference ×1–2). */
export function deltaEOk(x: Rgb, y: Rgb): number {
  const p = toOklab(x)
  const q = toOklab(y)
  return 100 * Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b)
}
