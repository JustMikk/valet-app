// Home (product spec §7.7): the shift that matters now, what follows it, and open shifts.
import type { Home } from "@/lib/data/staff/schemas"

import { loadShifts } from "./shift-data"
import { toHomeShift, toUpNext } from "./shift-view"
import { listOpenEvents } from "./open-shifts"
import { ensureClockInNotification } from "./notifications"

export async function getHome(staffId: string, now: Date): Promise<Home> {
  const [shifts, open] = await Promise.all([
    loadShifts(staffId, "upcoming", { limit: 3 }),
    listOpenEvents(staffId, now),
  ])
  const [current, ...next] = shifts
  if (current) await ensureClockInNotification(staffId, current, now)

  // The promo names claimable shifts first; ones that clash with the worker's own are last.
  const claimable = [...open].sort(
    (a, b) => Number(a.item.conflict !== undefined) - Number(b.item.conflict !== undefined),
  )
  return {
    shift: current ? toHomeShift(current, now) : null,
    upNext: next.map(toUpNext),
    open: { count: open.length, titles: claimable.slice(0, 2).map((event) => event.title) },
    serverNow: now.toISOString(),
  }
}
