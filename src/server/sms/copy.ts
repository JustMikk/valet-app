// The texts valets receive (docs/specs/sms.md, copy approved by the owner 2026-11-23). Pure: the
// caller formats dates and times; this writes the sentence and keeps it in plain GSM-7 characters.
// A shift text may take two segments so the event name stays whole (owner, 2026-11-26); past that
// its event details are shortened, never the fixed wording or the link. An invite is never shortened.

/** One SMS segment of GSM-7 text. Longer texts are split and billed per segment. */
export const SMS_SEGMENT = 160
/** Two segments: a split text carries 153 characters in each part. */
export const SMS_MAX = 2 * 153
/** A shortened field keeps at least this many characters, "..." included. */
const MIN_FIELD = 12

export type SmsCopy =
  | { kind: "invite"; adminFirst: string; tenant: string; link: string }
  | {
      kind: "reminder24"
      brand: string
      title: string
      /** "tomorrow", or the weekday when the reminder goes out late. */
      day: string
      range: string
      address: string
      link: string
    }
  | { kind: "reminder1"; brand: string; title: string; start: string; opens: string; link: string }
  | { kind: "cancelled" | "removed"; brand: string; title: string; date: string; link: string }
  | {
      kind: "assigned" | "rescheduled"
      brand: string
      title: string
      date: string
      range: string
      link: string
    }

/** "Regency Valet Parking" → "Regency": the name a text starts with. */
export function brandOf(tenantName: string): string {
  return tenantName.trim().split(/\s+/)[0] ?? tenantName.trim()
}

// Typographic characters our formatters and people's names produce, and their GSM-7 spelling.
// Without this one en dash turns the whole text into UCS-2: 70 characters a segment, not 160.
const PLAIN: [RegExp, string][] = [
  [/[    ]/g, " "],
  [/[–—·]/g, "-"],
  [/[‘’]/g, "'"],
  [/[“”]/g, '"'],
  [/…/g, "..."],
]

export function toGsm7(text: string): string {
  return PLAIN.reduce((out, [pattern, plain]) => out.replace(pattern, plain), text)
}

// The GSM 03.38 basic set plus its extension table (^{}\[~]|€).
const GSM7 =
  /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/

export function isGsm7(text: string): boolean {
  return GSM7.test(text)
}

/** A sentence whose `flex` fields may be shortened, ending in a `tail` that never is. */
type Template = {
  flex: Record<string, string>
  write: (flex: Record<string, string>) => string
  tail: string
}

const shorten = (value: string, length: number) =>
  value.length <= length ? value : `${value.slice(0, Math.max(0, length - 3)).trimEnd()}...`

/** Shortens the longest flexible field until the text fits two segments, or none can shrink more. */
function fit({ flex, write, tail }: Template): string {
  const fields = Object.fromEntries(Object.entries(flex).map(([k, v]) => [k, toGsm7(v.trim())]))
  const render = () => `${toGsm7(write(fields))}${tail}`
  let text = render()
  while (text.length > SMS_MAX) {
    const [name, value] = Object.entries(fields).sort((a, b) => b[1].length - a[1].length)[0] ?? []
    if (!name || value === undefined || value.length <= MIN_FIELD) break
    fields[name] = shorten(value, Math.max(MIN_FIELD, value.length - (text.length - SMS_MAX)))
    text = render()
  }
  return text
}

/** The text for one message, in the approved wording. */
export function smsText(copy: SmsCopy): string {
  switch (copy.kind) {
    case "invite":
      // Rare (one per new valet), so it may take two segments: the company name is never cut.
      return fit({
        flex: {},
        write: () =>
          `${toGsm7(copy.adminFirst)} at ${toGsm7(copy.tenant.trim())} invited you to join their valet crew.`,
        tail: ` Get started: ${copy.link} Reply STOP to opt out.`,
      })
    case "reminder24":
      return fit({
        flex: { title: copy.title, address: copy.address },
        write: (f) =>
          `${copy.brand}: Reminder, you're working ${f.title} ${copy.day}, ${copy.range}. ${f.address}`,
        tail: ` ${copy.link}`,
      })
    case "reminder1":
      return fit({
        flex: { title: copy.title },
        write: (f) =>
          `${copy.brand}: Your shift at ${f.title} starts at ${copy.start}. Clock-in opens ${copy.opens}.`,
        tail: ` ${copy.link}`,
      })
    case "cancelled":
      return fit({
        flex: { title: copy.title },
        write: (f) => `${copy.brand}: Your shift at ${f.title} on ${copy.date} was cancelled.`,
        tail: ` ${copy.link}`,
      })
    case "assigned":
      return fit({
        flex: { title: copy.title },
        write: (f) => `${copy.brand}: You're assigned to ${f.title}, ${copy.date} ${copy.range}.`,
        tail: ` ${copy.link}`,
      })
    case "rescheduled":
      return fit({
        flex: { title: copy.title },
        write: (f) => `${copy.brand}: ${f.title} has a new time: ${copy.date} ${copy.range}.`,
        tail: ` ${copy.link}`,
      })
    case "removed":
      return fit({
        flex: { title: copy.title },
        write: (f) =>
          `${copy.brand}: You were removed from ${f.title} on ${copy.date}. Questions? Reply in the app.`,
        tail: ` ${copy.link}`,
      })
  }
}
