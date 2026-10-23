// Clock in / out (product spec §8): the server is authoritative. It re-runs the geofence on the raw
// sample, enforces the window and one-active-clock rules, honors offline timestamps, and lands
// problem punches flagged for review instead of rejecting them. Writes are idempotent per key.
import type {
  ClockCheck,
  ClockCheckRequest,
  ClockPunch,
  ClockPunchRequest,
  ClockRequestStatus,
} from "@/lib/data/staff/schemas"
import { classifyFix, type GeofenceVerdict } from "@/lib/geo/geofence"
import { formatRange, formatTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { isUniqueViolation } from "../db/errors"
import { env } from "../env"
import { badRequest, conflict, notFound } from "../http/handler"
import { tellDispatch } from "../notify/dispatch"
import { sweepExpiredSelfies } from "../retention"
import { loadShifts, type ShiftRow } from "./shift-data"

const OFFLINE_MAX_AGE_MS = 24 * 3_600_000

type PunchRow = {
  id: string
  assignment_id: string
  kind: "in" | "out"
  status: "accepted" | "pending_approval" | "approved" | "rejected"
  geofence: GeofenceVerdict | "unknown"
  distance_m: number | null
  flagged: boolean
  device_at: Date
  server_at: Date
}

async function loadOwn(staffId: string, assignmentId: string): Promise<ShiftRow> {
  const [row] = await loadShifts(staffId, "any", { assignmentId, limit: 1 })
  if (!row) throw notFound("Shift not found.")
  return row
}

const fenceOf = (row: ShiftRow) => ({
  lat: row.lat,
  lng: row.lng,
  radiusM: row.radius_m,
  maxAccuracyM: row.min_accuracy_m,
})

const VERDICT_LABEL = {
  inside: "Inside",
  outside: "Outside",
  low_accuracy: "Low accuracy",
} as const

function locationLabel(geofence: PunchRow["geofence"], distance: number | null): string {
  if (geofence === "unknown" || distance === null) return "Not captured"
  return `${VERDICT_LABEL[geofence]} · ${distance} m`
}

export async function checkLocation(staffId: string, req: ClockCheckRequest): Promise<ClockCheck> {
  const row = await loadOwn(staffId, req.assignmentId)
  const result = classifyFix(req.location, fenceOf(row))
  return {
    verdict: result.verdict,
    distanceM: result.distanceM,
    radiusM: row.radius_m,
    neededAccuracyM: row.min_accuracy_m,
    venueName: row.venue_name,
    hoursLabel: formatRange(row.starts_at, row.ends_at, row.timezone),
  }
}

function toPunch(punch: PunchRow, row: ShiftRow): ClockPunch {
  const tz = row.timezone
  const effective = punch.device_at
  const worked =
    punch.kind === "out" && row.clocked_in_at
      ? Math.max(0, Math.floor((effective.getTime() - row.clocked_in_at.getTime()) / 1000))
      : null
  return {
    punchId: punch.id,
    status: punch.status === "pending_approval" ? "pending_approval" : "accepted",
    flagged: punch.flagged,
    effectiveAt: effective.toISOString(),
    effectiveLabel: formatTime(effective, tz),
    venueName: row.venue_name,
    shiftEndLabel: formatTime(row.ends_at, tz),
    reportTo: row.contact_text.replace(/^(Ask for|Report to)\s+/i, ""),
    locationLabel: locationLabel(punch.geofence, punch.distance_m),
    workedSecs: worked,
  }
}

async function findPunch(staffId: string, key: string): Promise<PunchRow | undefined> {
  const [punch] = await rows<PunchRow>(
    sql()`select id, assignment_id, kind, status, geofence, distance_m, flagged, device_at, server_at
          from punches where staff_id = ${staffId} and idempotency_key = ${key}`,
  )
  return punch
}

/** Offline punches keep their device time (within a day); online punches use the server clock. */
function effectiveTime(req: ClockPunchRequest, now: Date): Date {
  if (!req.offline) return now
  const device = new Date(req.deviceTimestamp).getTime()
  if (!Number.isFinite(device)) throw badRequest("The punch time is not valid.", "invalid_request")
  return new Date(Math.min(now.getTime(), Math.max(now.getTime() - OFFLINE_MAX_AGE_MS, device)))
}

function evaluate(req: ClockPunchRequest, row: ShiftRow) {
  if (!req.location) return { verdict: "unknown" as const, distanceM: null }
  return classifyFix(req.location, fenceOf(row))
}

type Decision = { status: PunchRow["status"]; flagged: boolean; reason: string | null }

async function insertPunch(
  staffId: string,
  req: ClockPunchRequest,
  row: ShiftRow,
  kind: "in" | "out",
  at: Date,
  fix: ReturnType<typeof evaluate>,
  decision: Decision,
  now: Date,
): Promise<PunchRow> {
  const loc = req.location
  const insert = sql()`insert into punches
      (assignment_id, staff_id, kind, idempotency_key, device_at, server_at, lat, lng, accuracy_m,
       distance_m, geofence, selfie, selfie_image, offline, status, note, flagged, flag_reason)
    values (${row.assignment_id}, ${staffId}, ${kind}, ${req.idempotencyKey}, ${at.toISOString()},
       ${now.toISOString()}, ${loc?.lat ?? null}, ${loc?.lng ?? null}, ${loc?.accuracyM ?? null},
       ${fix.distanceM}, ${fix.verdict}, ${req.selfie}, ${req.selfieImage ?? null}, ${req.offline}, ${decision.status},
       ${req.note ?? null}, ${decision.flagged}, ${decision.reason})
    returning id, assignment_id, kind, status, geofence, distance_m, flagged, device_at, server_at`
  if (decision.status === "pending_approval") {
    const [punch] = await rows<PunchRow>(insert)
    return punch
  }
  const stamp = at.toISOString()
  const update =
    kind === "in"
      ? sql()`update assignments set clocked_in_at = ${stamp}
              where id = ${row.assignment_id} and clocked_in_at is null`
      : sql()`update assignments set clocked_out_at = ${stamp}, status = 'completed'
              where id = ${row.assignment_id} and clocked_out_at is null`
  const [result] = await sql().transaction([insert, update])
  return (result as PunchRow[])[0]
}

async function replay(staffId: string, req: ClockPunchRequest): Promise<ClockPunch | null> {
  const existing = await findPunch(staffId, req.idempotencyKey)
  if (!existing) return null
  return toPunch(existing, await loadOwn(staffId, existing.assignment_id))
}

export async function punchIn(
  staffId: string,
  req: ClockPunchRequest,
  now: Date,
): Promise<ClockPunch> {
  await sweepExpiredSelfies(now)
  const replayed = await replay(staffId, req)
  if (replayed) return replayed

  const row = await loadOwn(staffId, req.assignmentId)
  if (row.status !== "confirmed" && row.status !== "claimed") {
    throw conflict("assignment_changed", "Your assignment changed. Message dispatch.")
  }
  if (row.clocked_in_at && !row.clocked_out_at) {
    throw conflict("already_clocked_in", "You're already on the clock for this shift.")
  }
  const [other] = await rows<{ id: string }>(
    sql()`select id from assignments
          where staff_id = ${staffId} and clocked_in_at is not null and clocked_out_at is null
            and id <> ${row.assignment_id} limit 1`,
  )
  if (other) throw conflict("clocked_in_elsewhere", "You have another shift on the clock.")

  const at = effectiveTime(req, now)
  const opens = row.starts_at.getTime() - row.window_min * 60_000
  if (at.getTime() < opens) {
    throw conflict(
      "window_not_open",
      `Clock-in opens ${formatTime(new Date(opens), row.timezone)}.`,
    )
  }
  if (at >= row.ends_at) {
    throw conflict("event_over", "This event is over. Message dispatch to add your hours.")
  }
  if (!req.selfie) throw badRequest("A selfie is required to clock in.", "selfie_required")

  const fix = evaluate(req, row)
  let decision: Decision
  if (fix.verdict === "inside") {
    decision = { status: "accepted", flagged: false, reason: null }
  } else if (req.offline) {
    // Sync disagrees with the device: land it flagged for review, never punish silently (§8.4).
    decision = {
      status: "accepted",
      flagged: true,
      reason: `Queued punch ${fix.verdict.replace("_", " ")}`,
    }
  } else if (req.requestApproval) {
    decision = { status: "pending_approval", flagged: false, reason: null }
  } else {
    const where = fix.distanceM === null ? "" : ` You're ${fix.distanceM} m from the venue.`
    throw conflict("outside_fence", `Not inside the venue area.${where}`)
  }

  try {
    const punch = toPunch(await insertPunch(staffId, req, row, "in", at, fix, decision, now), row)
    if (decision.status === "pending_approval") {
      const away = fix.distanceM === null ? "" : ` · ${fix.distanceM} m away`
      await tellDispatch(staffId, (who) => ({
        icon: "wrong_location",
        tone: "warn",
        title: `${who} needs approval`,
        body: `Clock-in request at ${row.venue_name}${away}`,
        href: "/admin",
      }))
    }
    return punch
  } catch (error) {
    // Two copies of the same request raced: the second returns the first's result.
    if (isUniqueViolation(error)) {
      const raced = await replay(staffId, req)
      if (raced) return raced
    }
    throw error
  }
}

export async function punchOut(
  staffId: string,
  req: ClockPunchRequest,
  now: Date,
): Promise<ClockPunch> {
  const replayed = await replay(staffId, req)
  if (replayed) return replayed

  const row = await loadOwn(staffId, req.assignmentId)
  if (!row.clocked_in_at || row.clocked_out_at) {
    throw conflict("not_clocked_in", "You're not on the clock for this shift.")
  }
  const at = new Date(Math.max(effectiveTime(req, now).getTime(), row.clocked_in_at.getTime()))
  const fix = evaluate(req, row)
  // Leaving is never blocked: outside the fence at clock-out is allowed but flagged (§8.6).
  const flagged = fix.verdict !== "inside"
  const decision: Decision = {
    status: "accepted",
    flagged,
    reason: flagged
      ? fix.verdict === "unknown"
        ? "Clock-out location not captured"
        : `Clock-out ${fix.verdict.replace("_", " ")}`
      : null,
  }
  try {
    const punch = await insertPunch(staffId, req, row, "out", at, fix, decision, now)
    return toPunch(punch, { ...row, clocked_out_at: at })
  } catch (error) {
    if (isUniqueViolation(error)) {
      const raced = await replay(staffId, req)
      if (raced) return raced
    }
    throw error
  }
}

/** Dispatch's decision on an out-of-fence request: clocked in at the time of the request (§8.5). */
export async function approvePunch(staffId: string, punchId: string): Promise<boolean> {
  const approved = await rows<{ id: string }>(
    sql()`with p as (
            update punches set status = 'approved', decided_at = now(),
                               flagged = true, flag_reason = 'Approved override'
            where id = ${punchId} and staff_id = ${staffId} and status = 'pending_approval'
            returning assignment_id, device_at
          )
          update assignments a set clocked_in_at = p.device_at
            from p where a.id = p.assignment_id and a.clocked_in_at is null
          returning a.id`,
  )
  return approved.length > 0
}

type RequestRow = {
  status: PunchRow["status"]
  device_at: Date
  server_at: Date
  timezone: string
}

export async function getRequestStatus(
  staffId: string,
  punchId: string,
  now: Date,
): Promise<ClockRequestStatus> {
  const read = async () => {
    const [request] = await rows<RequestRow>(
      sql()`select p.status, p.device_at, p.server_at, v.timezone
            from punches p
            join assignments a on a.id = p.assignment_id
            join events e on e.id = a.event_id
            join venues v on v.id = e.venue_id
            where p.id = ${punchId} and p.staff_id = ${staffId} and p.kind = 'in'`,
    )
    if (!request) throw notFound("Request not found.")
    return request
  }
  let request = await read()
  const waited = (now.getTime() - request.server_at.getTime()) / 1000
  const autoSecs = Number(env().DEMO_AUTO_APPROVE_SECS ?? 20)
  if (request.status === "pending_approval" && env().DEMO_MODE === "1" && waited >= autoSecs) {
    await approvePunch(staffId, punchId)
    request = await read()
  }
  const tz = request.timezone
  return {
    status: request.status === "accepted" ? "approved" : request.status,
    requestedLabel: formatTime(request.server_at, tz),
    effectiveLabel: request.status === "approved" ? formatTime(request.device_at, tz) : null,
  }
}
