// Punch-photo retention (OPEN_QUESTIONS P9, decided by the owner): a clock-in selfie is kept 30 days
// from the punch, then deleted. Only the image goes; the punch and the fact that a selfie was taken
// stay on record. Runs from a scheduled call (`/api/cron/retention`) and, so the demo needs no
// scheduler, at most once an hour as a side effect of a punch or a Live Board load.
import { rows, sql } from "./db/client"

export const SELFIE_RETENTION_DAYS = 30
const SWEEP_EVERY_MS = 60 * 60 * 1000

/** Photos from punches before this instant are expired. */
export function selfieCutoff(now: Date): Date {
  return new Date(now.getTime() - SELFIE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

/** Deletes expired punch photos and returns how many were removed. */
export async function purgeExpiredSelfies(now: Date = new Date()): Promise<number> {
  const purged = await rows<{ id: string }>(
    sql()`update punches set selfie_image = null, selfie_purged_at = ${now.toISOString()}
          where selfie_image is not null and server_at < ${selfieCutoff(now).toISOString()}
          returning id`,
  )
  return purged.length
}

let lastSweep = 0

/** The hourly side-effect sweep. Never throws: retention problems must not fail a request. */
export async function sweepExpiredSelfies(now: Date = new Date()): Promise<void> {
  if (now.getTime() - lastSweep < SWEEP_EVERY_MS) return
  lastSweep = now.getTime()
  try {
    await purgeExpiredSelfies(now)
  } catch (error) {
    lastSweep = 0
    console.warn("Photo retention sweep failed", error)
  }
}
