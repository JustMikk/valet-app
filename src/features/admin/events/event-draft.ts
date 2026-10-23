import type { FillMode } from "@/lib/data"

/** The New event form's fields, kept while the dispatcher goes off to add a venue and comes back. */
export type EventDraft = {
  venueId: string
  date: string
  start: string
  end: string
  name: string
  need: number
  instructions: string
  fill: FillMode
}

export const EMPTY_DRAFT: EventDraft = {
  venueId: "",
  date: "",
  start: "10:00",
  end: "15:00",
  name: "",
  need: 8,
  instructions: "",
  fill: "open",
}

const KEY = "vw-event-draft"

export function saveDraft(draft: EventDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Storage unavailable: the form simply starts empty on return.
  }
}

/** The saved draft, or an empty one. Reading leaves it in place; call clearDraft once it is used. */
export function readDraft(): EventDraft {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<EventDraft>) } : EMPTY_DRAFT
  } catch {
    return EMPTY_DRAFT
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
