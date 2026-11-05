// The Live Board's counts over time (ADR-021): saved at most every five minutes per tenant, read
// back as "the same time yesterday" for the arrows on the board's counts. A snapshot, not a
// replay of history, because a slot's past occupant is overwritten when someone drops.
import type { Live, Pulse } from "@/lib/data/admin/ops-schemas"
import { deriveBoard } from "@/lib/live/model"

import { rows, sql } from "../db/client"

const MIN = 60_000
const DAY = 24 * 60 * MIN

/** At most one snapshot per tenant in this many minutes. */
export const PULSE_EVERY_MIN = 5
/** Yesterday's snapshot must be within this many minutes of exactly 24 hours ago. */
export const PULSE_MATCH_MIN = 15
/** Snapshots older than this are deleted. */
export const PULSE_KEEP_DAYS = 8

export type PulseRow = {
  taken_at: Date
  need: number
  live: number
  on_shift: number
  expected: number
  open: number
}

/** The counts the board shows, the same way the browser works them out. */
export function pulseOf(live: Pick<Live, "events">): Pulse {
  return deriveBoard(live.events, {}).pulse
}

/** The snapshot nearest to 24 hours before `now`, within the match window; null if none. */
export function closestToYesterday(snapshots: PulseRow[], now: Date): Pulse | null {
  const target = now.getTime() - DAY
  let best: PulseRow | null = null
  for (const row of snapshots) {
    const off = Math.abs(row.taken_at.getTime() - target)
    if (off > PULSE_MATCH_MIN * MIN) continue
    if (!best || off < Math.abs(best.taken_at.getTime() - target)) best = row
  }
  if (!best) return null
  const { need, live, on_shift: onShift, expected, open } = best
  return { need, live, onShift, expected, open }
}

/**
 * Saves the counts unless the tenant has a snapshot from the last five minutes, and drops
 * snapshots past the keep window. Never throws: a missed snapshot must not fail the board.
 */
export async function recordPulse(tenantId: string, pulse: Pulse, now: Date): Promise<void> {
  const at = now.toISOString()
  try {
    await sql()`insert into pulse_snapshots (tenant_id, taken_at, need, live, on_shift, expected, open)
                select ${tenantId}, ${at}, ${pulse.need}, ${pulse.live}, ${pulse.onShift},
                       ${pulse.expected}, ${pulse.open}
                where not exists (
                  select 1 from pulse_snapshots
                  where tenant_id = ${tenantId}
                    and taken_at > ${new Date(now.getTime() - PULSE_EVERY_MIN * MIN).toISOString()}
                )
                on conflict do nothing`
    await sql()`delete from pulse_snapshots
                where tenant_id = ${tenantId}
                  and taken_at < ${new Date(now.getTime() - PULSE_KEEP_DAYS * DAY).toISOString()}`
  } catch (error) {
    console.warn("Pulse snapshot failed", error)
  }
}

/** The board's counts at this time yesterday, or null when there is nothing to compare. */
export async function pulseYesterday(tenantId: string, now: Date): Promise<Pulse | null> {
  const target = now.getTime() - DAY
  try {
    const snapshots = await rows<PulseRow>(
      sql()`select taken_at, need, live, on_shift, expected, open from pulse_snapshots
            where tenant_id = ${tenantId}
              and taken_at between ${new Date(target - PULSE_MATCH_MIN * MIN).toISOString()}
                               and ${new Date(target + PULSE_MATCH_MIN * MIN).toISOString()}`,
    )
    return closestToYesterday(
      snapshots.map((row) => ({ ...row, taken_at: new Date(row.taken_at) })),
      now,
    )
  } catch (error) {
    console.warn("Pulse lookup failed", error)
    return null
  }
}
