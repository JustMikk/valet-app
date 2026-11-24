// The branded frame every email shares (ADR-027): the Regency logo on the dark banner, as on the PDF
// and the invoice page, then a white card on the app's page color. Email apps read neither CSS
// variables nor linked styles, so colors are the light theme's values (src/styles/tokens.css)
// written inline, the layout is tables, and the fonts fall back to system ones.
import { EMAIL_LOGO } from "./logo"

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c)

const COLOR = {
  page: "#f7f7f5", // --bg
  card: "#ffffff", // --elev
  surface: "#f4f4f2", // --surface
  ink: "#0e0e10", // --fg, --hero
  muted: "#5e5e5b", // --fg-2
  faint: "#70706c", // --fg-3
  line: "#e6e6e3", // --line
  gold: "#c9a24a", // --accent
  goldText: "#7f611a", // --accent-text
  onHero: "#f4f4f2", // --hero-fg
} as const

const SANS = "Onest,'Segoe UI',Helvetica,Arial,sans-serif"
const DISPLAY = `'Bricolage Grotesque',${SANS}`

/** Body text: escaped, unless it is already markup built here. */
export type Html = { html: string }
const markup = (content: string | Html) =>
  typeof content === "string" ? escapeHtml(content) : content.html

export const strong = (text: string): Html => ({
  html: `<strong style="color:${COLOR.ink};font-weight:600">${escapeHtml(text)}</strong>`,
})
export const join = (...parts: (string | Html)[]): Html => ({ html: parts.map(markup).join("") })

export const paragraph = (content: string | Html) =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:24px;color:${COLOR.ink}">${markup(content)}</p>`

export const heading = (text: string) =>
  `<h1 style="margin:0 0 24px;font-family:${DISPLAY};font-size:24px;line-height:30px;font-weight:700;letter-spacing:-0.2px;color:${COLOR.ink}">${escapeHtml(text)}</h1>`

/** A button that survives every email app: a link padded inside a colored table cell. */
export const button = (label: string, href: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr>` +
  `<td align="center" bgcolor="${COLOR.goldText}" style="border-radius:999px;background:${COLOR.goldText}">` +
  `<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 32px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:600;color:${COLOR.card};text-decoration:none;border-radius:999px">${escapeHtml(label)}</a>` +
  `</td></tr></table>`

/** The link in small type, for apps that block buttons. */
export const smallLink = (href: string) =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:13px;line-height:20px;color:${COLOR.faint};word-break:break-all">` +
  `<a href="${escapeHtml(href)}" style="color:${COLOR.goldText};text-decoration:underline">${escapeHtml(href)}</a></p>`

/** Label and value rows on the surface color; the first row's value is set large. */
export function summary(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map((row, index) => {
      const lead = index === 0
      const border = index > 0 ? `border-top:1px solid ${COLOR.line};` : ""
      const size = lead
        ? `font-family:${DISPLAY};font-size:28px;line-height:34px;font-weight:700`
        : `font-family:${SANS};font-size:16px;line-height:22px;font-weight:600`
      return (
        `<tr><td style="${border}padding:${lead ? "4px 0 14px" : "14px 0 4px"};font-family:${SANS};font-size:14px;line-height:20px;color:${COLOR.muted}">${escapeHtml(row.label)}</td>` +
        `<td align="right" style="${border}padding:${lead ? "4px 0 14px" : "14px 0 4px"};${size};color:${COLOR.ink};white-space:nowrap">${escapeHtml(row.value)}</td></tr>`
      )
    })
    .join("")
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;background:${COLOR.surface};border-radius:16px">` +
    `<tr><td style="padding:18px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table></td></tr></table>`
  )
}

export type Frame = {
  /** The subject, as the document's title. */
  title: string
  /** The inbox preview line, hidden in the email itself. */
  preheader: string
  /** The banner's right side, as on the PDF: "INVOICE" over the number. */
  banner?: { label: string; value: string }
  /** Markup built with the helpers above. */
  body: string[]
  /** Under the card, in small type. */
  footer: string
}

function bannerSide(banner: Frame["banner"]): string {
  if (!banner) return ""
  return (
    `<td align="right" valign="middle" style="font-family:${SANS}">` +
    `<div style="font-size:11px;line-height:16px;font-weight:600;letter-spacing:1.2px;color:${COLOR.gold};text-transform:uppercase">${escapeHtml(banner.label)}</div>` +
    `<div style="font-size:15px;line-height:22px;font-weight:600;color:${COLOR.onHero};white-space:nowrap">${escapeHtml(banner.value)}</div>` +
    `</td>`
  )
}

/** The whole email: page, card with the logo banner, the body, and the footer line. */
export function frame(f: Frame): string {
  const logo = `<img src="cid:${EMAIL_LOGO.cid}" width="${EMAIL_LOGO.width}" height="${EMAIL_LOGO.height}" alt="Regency Parking Service" style="display:block;border:0;outline:none;width:${EMAIL_LOGO.width}px;height:${EMAIL_LOGO.height}px">`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(f.title)}</title>
<style>
@media (max-width:620px){.pad{padding-left:20px!important;padding-right:20px!important}.page{padding:12px 8px!important}}
</style>
</head>
<body style="margin:0;padding:0;background:${COLOR.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(f.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.page}" style="background:${COLOR.page}">
<tr><td class="page" align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COLOR.card};border:1px solid ${COLOR.line};border-radius:20px;overflow:hidden">
<tr><td class="pad" bgcolor="${COLOR.ink}" style="background:${COLOR.ink};padding:22px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle">${logo}</td>${bannerSide(f.banner)}
</tr></table>
</td></tr>
<tr><td style="height:3px;line-height:3px;font-size:0;background:${COLOR.gold}" bgcolor="${COLOR.gold}">&nbsp;</td></tr>
<tr><td class="pad" style="padding:36px 32px 20px">
${f.body.join("\n")}
</td></tr>
</table>
<p style="margin:20px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${COLOR.faint};text-align:center">${escapeHtml(f.footer)}</p>
</td></tr>
</table>
</body>
</html>`
}
