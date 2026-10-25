// What every slot of an event is doing right now. One query and one classifier serve the Live
// Board and the event roster, so they can never disagree (product spec §9.5: person-in-slot states).
import type { LiveSlot, SlotState } from "@/lib/data/admin/ops-schemas"
import { formatStamp, formatTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { shortName } from "./common"

/** Minutes after the start during which a missing clock-in is "due", not yet "late". */
export const GRACE_MIN = 10

export type SlotRow = {
  assignment_id: string
  staff_id: string | null
  staff_name: string | null
  phone: string | null
  push_enabled: boolean | null
  clocked_in_at: Date | null
  clocked_out_at: Date | null
  event_id: string
  title: string
  starts_at: Date
  ends_at: Date
  posted_at: Date
  window_min: number
  timezone: string
  radius_m: number
  punch_id: string | null
  punch_status: "accepted" | "approved" | "pending_approval" | null
  distance_m: number | null
  accuracy_m: number | null
  punch_note: string | null
  punch_flag: string | null
  punch_offline: boolean | null
  selfie: boolean | null
  selfie_image: string | null
  lat: number | null
  lng: number | null
  device_at: Date | null
  server_at: Date | null
  decided_by_name: string | null
  drop_name: string | null
  drop_at: Date | null
  drop_removed: boolean | null
  nudge_at: Date | null
}

/**
 * Slots with their latest clock-in punch, why an open slot is open, and the last nudge. With an
 * `eventId`, that one event; otherwise every published event running or starting within 14 hours.
 */
export async function loadSlots(tenantId: string, eventId?: string): Promise<SlotRow[]> {
  return rows<SlotRow>(
    sql()`select a.id as assignment_id, a.staff_id, s.name as staff_name, s.phone, s.push_enabled,
            a.clocked_in_at, a.clocked_out_at,
            e.id as event_id, e.title, e.starts_at, e.ends_at, e.posted_at,
            e.clock_in_window_min as window_min, v.timezone, v.radius_m,
            p.id as punch_id, p.status as punch_status, p.distance_m, p.accuracy_m,
            p.note as punch_note, p.flag_reason as punch_flag, p.offline as punch_offline,
            p.selfie, p.selfie_image, p.lat, p.lng, p.device_at, p.server_at, ad.name as decided_by_name,
            d.name as drop_name, d.created_at as drop_at, d.removed as drop_removed,
            n.created_at as nudge_at
          from events e
          join venues v on v.id = e.venue_id
          join assignments a on a.event_id = e.id
          left join staff s on s.id = a.staff_id
          left join lateral (
            select p.* from punches p
            where p.assignment_id = a.id and p.kind = 'in'
              and p.status in ('accepted', 'approved', 'pending_approval')
            order by p.server_at desc limit 1
          ) p on true
          left join admins ad on ad.id = p.decided_by
          left join lateral (
            select st.name, dr.created_at, (dr.removed_by is not null) as removed
            from drops dr join staff st on st.id = dr.staff_id
            where dr.assignment_id = a.id order by dr.created_at desc limit 1
          ) d on a.staff_id is null
          left join lateral (
            select m.created_at from messages m
            where m.staff_id = a.staff_id and m.sender = 'dispatch' and m.created_at >= e.starts_at
            order by m.created_at desc limit 1
          ) n on a.staff_id is not null
          where e.tenant_id = ${tenantId}
            and (
              (${eventId ?? null}::uuid is not null and e.id = ${eventId ?? null}::uuid)
              or (${eventId ?? null}::uuid is null and e.status = 'published'
                  and e.ends_at > now() and e.starts_at < now() + interval '14 hours')
            )
          order by e.starts_at, e.id, a.created_at, a.id`,
  )
}

const minutes = (ms: number) => Math.floor(ms / 60_000)

/** The slot as the board shows it: a state, the roster line, and the facts behind both. */
export function classifySlot(row: SlotRow, now: Date): LiveSlot {
  const tz = row.timezone
  const base = { id: row.assignment_id, staffId: row.staff_id }

  if (!row.staff_id) {
    const dropped = row.drop_name && row.drop_at
    const openMin = minutes(now.getTime() - (row.drop_at ?? row.starts_at).getTime())
    return {
      ...base,
      name: "Open slot",
      state: "open",
      meta: dropped
        ? `${row.drop_removed ? "Removed" : "Dropped by"} ${shortName(row.drop_name ?? "")} at ${formatTime(row.drop_at as Date, tz)}`
        : `Posted ${formatStamp(row.posted_at, now, tz)}`,
      facts: dropped
        ? {
            droppedBy: shortName(row.drop_name ?? ""),
            droppedAt: formatTime(row.drop_at as Date, tz),
            openMin: Math.max(0, openMin),
          }
        : { openMin: Math.max(0, minutes(now.getTime() - row.starts_at.getTime())) },
    }
  }

  const name = row.staff_name ?? "Unknown"
  const tel = row.phone ?? undefined
  const dist = row.distance_m ?? 0
  const acc = Math.round(row.accuracy_m ?? 0)
  const facts: LiveSlot["facts"] = { tel }
  const selfieUrl = row.selfie_image ?? undefined
  const lat = row.lat ?? undefined
  const lng = row.lng ?? undefined
  const done = (state: SlotState, meta: string, extra: LiveSlot["facts"] = {}): LiveSlot => ({
    ...base,
    name,
    state,
    meta,
    facts: { ...facts, ...extra },
    selfieUrl,
    lat,
    lng,
  })

  if (row.punch_status === "pending_approval") {
    const waited = minutes(now.getTime() - (row.server_at ?? now).getTime())
    const outside = Math.max(1, dist - row.radius_m)
    return done(
      "waiting",
      `${outside} m outside · ±${acc} m${row.punch_note ? ` · “${row.punch_note}”` : ""}`,
      {
        outsideM: outside,
        accuracyM: acc,
        note: row.punch_note ?? undefined,
        waitedMin: Math.max(0, waited),
        punchId: row.punch_id ?? undefined,
      },
    )
  }

  if (row.punch_status) {
    const at = formatTime(row.device_at ?? row.server_at ?? now, tz)
    if (row.punch_status === "approved") {
      return done(
        "override",
        `Approved override · in ${at} (request time)${row.decided_by_name ? ` · by ${row.decided_by_name.split(" ")[0]}` : ""}`,
      )
    }
    if (row.punch_offline && row.server_at && row.device_at) {
      return done(
        "flagged",
        `Queued offline punch · ${at}, synced ${formatTime(row.server_at, tz)}`,
      )
    }
    return done(
      "onsite",
      `In ${at} · ${dist} m from center · ±${acc} m${row.clocked_out_at ? ` · out ${formatTime(row.clocked_out_at, tz)}` : ""}`,
    )
  }

  const sinceStart = minutes(now.getTime() - row.starts_at.getTime())
  const nudged = row.nudge_at ? formatTime(row.nudge_at, tz) : undefined
  if (sinceStart < 0) {
    const opens = formatTime(new Date(row.starts_at.getTime() - row.window_min * 60_000), tz)
    const windowOpen = now.getTime() >= row.starts_at.getTime() - row.window_min * 60_000
    return done(
      "upcoming",
      `${windowOpen ? "Clock-in open" : `Clock-in opens ${opens}`}${row.push_enabled === false ? " · push off" : ""}`,
    )
  }
  if (sinceStart < GRACE_MIN) {
    return done(
      "due",
      `Grace ends ${formatTime(new Date(row.starts_at.getTime() + GRACE_MIN * 60_000), tz)}`,
    )
  }
  return done("late", "Not clocked in", { lateMin: sinceStart, nudgedAt: nudged })
}
