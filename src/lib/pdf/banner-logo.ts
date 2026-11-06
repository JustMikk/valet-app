// The Regency logo for the PDF banner: the website SVG drawn onto the banner's dark ground and
// saved as a JPEG (PDFs take JPEGs directly; the ground stands in for transparency). Rendered once
// per page load. Null when the browser can't render it: the banner then shows the wordmark in text.
import { BRAND_LOGO } from "@/lib/brand"

import { BANNER_FILL, type PdfImage } from "./text-pdf"

// Twice the SVG's size, so the logo stays sharp when the PDF is zoomed or printed.
const SCALE = 2

let cached: Promise<PdfImage | null> | null = null

async function render(): Promise<PdfImage | null> {
  const image = new Image()
  image.src = BRAND_LOGO.src
  await image.decode()
  const canvas = document.createElement("canvas")
  canvas.width = BRAND_LOGO.width * SCALE
  canvas.height = BRAND_LOGO.height * SCALE
  const context = canvas.getContext("2d")
  if (!context) return null
  context.fillStyle = `rgb(${BANNER_FILL.join(",")})`
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  )
  if (!blob) return null
  return {
    jpeg: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  }
}

export function loadBannerLogo(): Promise<PdfImage | null> {
  cached ??= render().catch(() => null)
  return cached
}
