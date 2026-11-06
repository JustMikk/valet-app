// Everything about one valet for admins (ADR-024): reliability, numbers, where and when they work,
// their activity log and the admins' private notes. Built from what the app already records.
import type { InsightRange, PersonInsights, StaffNote } from "@/lib/data/admin/schemas"
import { valetActivity, type ActivityFacts } from "@/lib/insights/valet-activity"
import { reliability, valetStats } from "@/lib/insights/valet-stats"
import { formatStamp, formatTime, formatDate } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { notFound } from "../http/handler"
import { adminCtx } from "./common"

const DAY = 24 * 60 * 60_000

type ShiftRow = {
  id: string
  event: string
  tz: string
  venue: string
  starts_at: Date
  ends_at: Date
  status: string
  claimed_at: Date | null
  assigned_at: Date | null
  assigned_by: string | null
  clocked_in_at: Date | null
  clocked_out_at: Date | null
  paid_at: Date | null
  paid_cents: number | null
  pay_rate_cents: number
  tips: boolean
}

async function notesOf(staffId: string, now: Date, tz: string): Promise<StaffNote[]> {
  const notes = await rows<{ id: string; body: string; author: string | null; created_at: Date }>(
    sql()`select n.id, n.body, a.name as author, n.created_at
          from staff_notes n left join admins a on a.id = n.admin_id
          where n.staff_id = ${staffId} order by n.created_at desc limit 100`,
  )
  return notes.map((note) => ({
    id: note.id,
    body: note.body,
    author: note.author ?? "Former admin",
    when:
      formatStamp(note.created_at, now, tz) === formatTime(note.created_at, tz)
        ? `Today · ${formatTime(note.created_at, tz)}`
        : `${formatDate(note.created_at, tz)} · ${formatTime(note.created_at, tz)}`,
  }))
}

export async function getPersonInsights(
  adminId: string,
  staffId: string,
  rangeDays: InsightRange,
  now: Date,
): Promise<PersonInsights> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{ invited_at: Date | null; onboarded_at: Date | null }>(
    sql()`select invited_at, onboarded_at from staff
          where id = ${staffId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!person) throw notFound("Person not found.")
  const since = new Date(now.getTime() - rangeDays * DAY).toISOString()

  const [shifts, drops, punches, adjustments, notes] = await Promise.all([
    rows<ShiftRow>(
      sql()`select a.id, e.title as event, v.timezone as tz, v.name as venue, e.starts_at, e.ends_at,
                   e.status, a.claimed_at, a.assigned_at, ad.name as assigned_by, a.clocked_in_at,
                   a.clocked_out_at, a.paid_at, a.paid_cents, e.pay_rate_cents, a.tips
            from assignments a join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            left join admins ad on ad.id = a.assigned_by
            where a.staff_id = ${staffId} and e.starts_at >= ${since}
            order by e.starts_at`,
    ),
    rows<{
      id: string
      event: string
      tz: string
      created_at: Date
      reason: string
      note: string | null
      late: boolean
      removed_by: string | null
    }>(
      sql()`select d.id, e.title as event, v.timezone as tz, d.created_at, d.reason, d.note, d.late,
                   ad.name as removed_by
            from drops d join assignments a on a.id = d.assignment_id
            join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            left join admins ad on ad.id = d.removed_by
            where d.staff_id = ${staffId} and d.created_at >= ${since}`,
    ),
    rows<{
      id: string
      event: string
      tz: string
      starts_at: Date
      kind: "in" | "out"
      device_at: Date
      geofence: "inside" | "outside" | "low_accuracy" | "unknown"
      distance_m: number | null
      status: "accepted" | "pending_approval" | "approved" | "rejected"
      flagged: boolean
      flag_reason: string | null
      offline: boolean
    }>(
      sql()`select p.id, e.title as event, v.timezone as tz, e.starts_at, p.kind, p.device_at,
                   p.geofence, p.distance_m, p.status, p.flagged, p.flag_reason, p.offline
            from punches p join assignments a on a.id = p.assignment_id
            join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            where p.staff_id = ${staffId} and p.device_at >= ${since}`,
    ),
    rows<{ id: string; event: string; tz: string; created_at: Date; reason: string; by: string }>(
      sql()`select h.id, e.title as event, v.timezone as tz, h.created_at, h.reason, ad.name as by
            from hours_adjustments h join assignments a on a.id = h.assignment_id
            join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            join admins ad on ad.id = h.admin_id
            where a.staff_id = ${staffId} and h.created_at >= ${since}`,
    ),
    notesOf(staffId, now, ctx.tz),
  ])

  const past = shifts.filter((shift) => shift.starts_at <= now)
  const stats = valetStats(
    past.map((shift) => ({
      venue: shift.venue,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
      cancelled: shift.status === "cancelled",
      clockedInAt: shift.clocked_in_at,
      clockedOutAt: shift.clocked_out_at,
      payRateCents: shift.pay_rate_cents,
      paidCents: shift.paid_cents,
      tips: shift.tips,
    })),
    drops.map((drop) => ({ late: drop.late, removed: drop.removed_by !== null })),
    now,
    ctx.tz,
  )

  const facts: ActivityFacts = {
    invitedAt:
      person.invited_at && person.invited_at.toISOString() >= since ? person.invited_at : null,
    onboardedAt:
      person.onboarded_at && person.onboarded_at.toISOString() >= since
        ? person.onboarded_at
        : null,
    shifts: past.map((shift) => ({
      id: shift.id,
      event: shift.event,
      tz: shift.tz,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
      cancelled: shift.status === "cancelled",
      claimedAt: shift.claimed_at,
      assignedAt: shift.assigned_at,
      assignedBy: shift.assigned_by,
      clockedInAt: shift.clocked_in_at,
      clockedOutAt: shift.clocked_out_at,
      paidAt: shift.paid_at,
      paidCents: shift.paid_cents,
    })),
    drops: drops.map((drop) => ({
      id: drop.id,
      event: drop.event,
      tz: drop.tz,
      at: drop.created_at,
      reason: drop.reason,
      note: drop.note,
      late: drop.late,
      removedBy: drop.removed_by,
    })),
    punches: punches.map((punch) => ({
      id: punch.id,
      event: punch.event,
      tz: punch.tz,
      startsAt: punch.starts_at,
      kind: punch.kind,
      at: punch.device_at,
      geofence: punch.geofence,
      distanceM: punch.distance_m,
      status: punch.status,
      flagged: punch.flagged,
      flagReason: punch.flag_reason,
      offline: punch.offline,
    })),
    adjustments: adjustments.map((h) => ({
      id: h.id,
      event: h.event,
      tz: h.tz,
      at: h.created_at,
      reason: h.reason,
      by: h.by,
    })),
  }
  const activity = valetActivity(facts, now, ctx.tz).slice(0, 200)

  return {
    rangeDays,
    score: reliability(stats),
    stats: {
      shifts: stats.shifts,
      minutes: stats.minutes,
      onTime: stats.onTime,
      late: stats.late,
      avgLateMin: stats.avgLateMin,
      noShows: stats.noShows,
      drops: stats.drops,
      lateDrops: stats.lateDrops,
      removed: stats.removed,
      claimed: past.filter((shift) => shift.claimed_at !== null).length,
      assigned: past.filter((shift) => shift.assigned_at !== null).length,
      outsideFence: punches.filter((p) => p.kind === "in" && p.geofence !== "inside").length,
      flagged: punches.filter((p) => p.flagged).length,
      adjustments: adjustments.length,
      tipsShifts: stats.tipsShifts,
      earnedCents: stats.earnedCents,
      paidCents: stats.paidCents,
      pendingCents: stats.pendingCents,
    },
    upcoming: shifts
      .filter((shift) => shift.starts_at > now && shift.status !== "cancelled")
      .slice(0, 5)
      .map((shift) => ({
        event: shift.event,
        when: `${formatDate(shift.starts_at, shift.tz)} · ${formatTime(shift.starts_at, shift.tz)}`,
      })),
    months: stats.months,
    venues: stats.venues,
    activity: activity.map((item) => ({
      id: item.id,
      when: item.when,
      kind: item.kind,
      title: item.title,
      detail: item.detail,
      issue: item.issue,
    })),
    notes,
  }
}

export async function addStaffNote(
  adminId: string,
  staffId: string,
  body: string,
  now: Date,
): Promise<StaffNote[]> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{ id: string }>(
    sql()`select id from staff where id = ${staffId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!person) throw notFound("Person not found.")
  await sql()`insert into staff_notes (staff_id, admin_id, body) values (${staffId}, ${adminId}, ${body})`
  return notesOf(staffId, now, ctx.tz)
}

export async function deleteStaffNote(
  adminId: string,
  staffId: string,
  noteId: string,
  now: Date,
): Promise<StaffNote[]> {
  const ctx = await adminCtx(adminId)
  await sql()`delete from staff_notes n using staff s
              where n.id = ${noteId} and n.staff_id = ${staffId}
                and s.id = n.staff_id and s.tenant_id = ${ctx.tenantId}`
  return notesOf(staffId, now, ctx.tz)
}
