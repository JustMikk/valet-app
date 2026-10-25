// Hours review (product spec §10.1): every shift's hours are checked before they are final. An
// entry is flagged when its punches say something unusual; the rest can be approved in one tap.
// Adjusting needs a reason, is shared with the worker, and writes an audit entry.
import type { AdjustResult, Hours, HoursEntry } from "@/lib/data/admin/ops-schemas"
import { formatHoursMinutes } from "@/lib/money/format"
import { formatDate, formatDuration, formatTime, wallTime, zonedInstant } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { badRequest, conflict, notFound } from "../http/handler"
import { adminCtx, initialsOf, notifyStaff } from "./common"
import { syncEventInvoices } from "./event-invoice"
import { weekStart } from "./staff"

const MIN = 60_000
const EARLY_OUT_MIN = 30
const LATE_SYNC_MIN = 60

type HoursRow = {
  assignment_id: string
  event_id: string
  staff_id: string
  hours_status: "in_review" | "approved"
  clocked_in_at: Date
  clocked_out_at: Date | null
  name: string
  starts_at: Date
  ends_at: Date
  venue: string
  tz: string
  flag_early_out: boolean
  in_status: string | null
  in_flag: string | null
  in_offline: boolean | null
  in_note: string | null
  in_dist: number | null
  in_device_at: Date | null
  in_server_at: Date | null
  decided_by_name: string | null
  out_note: string | null
  out_flag: string | null
  adj_reason: string | null
}

/** What, if anything, makes an entry unusual: one sentence, most important first. */
export function describeFlag(row: HoursRow): string | null {
  if (!row.clocked_out_at) return "No clock-out. Auto-closed at scheduled end."
  if (row.in_status === "approved" || row.in_flag === "Approved override") {
    const by = row.decided_by_name ? ` by ${row.decided_by_name.split(" ")[0]}` : ""
    const note = row.in_note ? ` (${row.in_note.toLowerCase()})` : ""
    return `Clocked in ${row.in_dist ?? 0} m away, approved${by}${note}.`
  }
  const earlyMin = (row.ends_at.getTime() - row.clocked_out_at.getTime()) / MIN
  if (row.flag_early_out && earlyMin >= EARLY_OUT_MIN) {
    const note = row.out_note ? ` Note: “${row.out_note}”.` : ""
    return `Left ${formatHoursMinutes(earlyMin)} early.${note}`
  }
  if (row.in_offline && row.in_server_at && row.in_device_at) {
    const lateMin = (row.in_server_at.getTime() - row.in_device_at.getTime()) / MIN
    if (lateMin >= LATE_SYNC_MIN) {
      return `Synced ${Math.round(lateMin / 60)}h late (was offline). Times are from the phone.`
    }
  }
  return row.in_flag ?? row.out_flag
}

/** The entry as the screen shows it, and whether it is clean (no flag: fine to approve in bulk). */
export function toEntry(row: HoursRow): { entry: HoursEntry; clean: boolean } {
  const out = row.clocked_out_at ?? row.ends_at
  const flag = describeFlag(row)
  return {
    clean: flag === null,
    entry: {
      id: row.assignment_id,
      initials: initialsOf(row.name),
      name: row.name,
      venue: `${row.venue} · ${formatDate(row.starts_at, row.tz)}`,
      inTime: formatTime(row.clocked_in_at, row.tz),
      outTime: formatTime(out, row.tz),
      total: formatDuration(out.getTime() - row.clocked_in_at.getTime()),
      flag: flag ?? "",
      outFlagged: !row.clocked_out_at,
      approved: row.hours_status === "approved",
      adjustedReason: row.adj_reason ?? undefined,
    },
  }
}

async function loadRows(tenantId: string, ids?: string[]): Promise<HoursRow[]> {
  return rows<HoursRow>(
    sql()`select a.id as assignment_id, a.event_id, a.staff_id, a.hours_status, a.clocked_in_at, a.clocked_out_at,
            s.name, e.starts_at, e.ends_at, v.name as venue, v.timezone as tz, t.flag_early_out,
            pin.status as in_status, pin.flag_reason as in_flag, pin.offline as in_offline,
            pin.note as in_note, pin.distance_m as in_dist, pin.device_at as in_device_at,
            pin.server_at as in_server_at, ad.name as decided_by_name,
            pout.note as out_note, pout.flag_reason as out_flag, adj.reason as adj_reason
          from assignments a
          join staff s on s.id = a.staff_id
          join events e on e.id = a.event_id
          join venues v on v.id = e.venue_id
          join tenants t on t.id = e.tenant_id
          left join lateral (
            select p.* from punches p where p.assignment_id = a.id and p.kind = 'in'
              and p.status in ('accepted', 'approved') order by p.server_at desc limit 1
          ) pin on true
          left join admins ad on ad.id = pin.decided_by
          left join lateral (
            select p.* from punches p where p.assignment_id = a.id and p.kind = 'out'
              order by p.server_at desc limit 1
          ) pout on true
          left join lateral (
            select h.reason from hours_adjustments h where h.assignment_id = a.id
              order by h.created_at desc limit 1
          ) adj on true
          where e.tenant_id = ${tenantId} and a.clocked_in_at is not null
            and (a.clocked_out_at is not null or e.ends_at < now())
            and (${ids ? JSON.stringify(ids) : null}::jsonb is null
                 or a.id in (select jsonb_array_elements_text(${ids ? JSON.stringify(ids) : null}::jsonb)::uuid))
          order by e.ends_at desc, s.name`,
  )
}

/** "Pay period Oct 19 – 25 · locks Mon 9 AM": the week (Monday to Sunday) containing today. */
function periodLabel(now: Date, tz: string): string {
  const start = weekStart(now, tz)
  const end = new Date(start.getTime() + 6 * 24 * 60 * MIN + 12 * 60 * MIN)
  const a = formatDate(start, tz).split(" ")
  const b = formatDate(end, tz).split(" ")
  const range = a[1] === b[1] ? `${a[1]} ${a[2]} – ${b[2]}` : `${a[1]} ${a[2]} – ${b[1]} ${b[2]}`
  return `Pay period ${range} · locks Mon 9 AM`
}

export async function getHours(adminId: string, now: Date): Promise<Hours> {
  const ctx = await adminCtx(adminId)
  const entries = (await loadRows(ctx.tenantId)).map(toEntry)
  const pending = entries.filter((e) => !e.entry.approved)
  return {
    period: periodLabel(now, ctx.tz),
    cleanCount: pending.filter((e) => e.clean).length,
    review: pending.filter((e) => !e.clean).map((e) => e.entry),
    approved: entries
      .filter((e) => e.entry.approved)
      .slice(0, 30)
      .map((e) => e.entry),
  }
}

/** How many entries still need a decision (the Hours badge): flagged ones, not the clean batch. */
export async function reviewCount(tenantId: string): Promise<number> {
  const entries = (await loadRows(tenantId)).map(toEntry)
  return entries.filter((e) => !e.entry.approved && !e.clean).length
}

async function approveRows(selected: HoursRow[]): Promise<void> {
  if (selected.length === 0) return
  const ids = JSON.stringify(selected.map((r) => r.assignment_id))
  // A shift nobody clocked out of is closed at its scheduled end when approved as it stands.
  await sql()`update assignments a set hours_status = 'approved', status = 'completed',
                     clocked_out_at = coalesce(a.clocked_out_at, e.ends_at)
              from events e
              where e.id = a.event_id
                and a.id in (select jsonb_array_elements_text(${ids}::jsonb)::uuid)`
  // The last approval of an event drafts its invoice.
  await syncEventInvoices(
    selected.map((r) => r.event_id),
    new Date(),
  )
  await notifyStaff(
    selected.map((r) => ({
      staffId: r.staff_id,
      icon: "check_circle",
      tone: "ok" as const,
      title: "Hours approved",
      body: `${r.venue}, ${formatDate(r.starts_at, r.tz)} · ${toEntry(r).entry.total}`,
      href: "/staff/shifts",
    })),
  )
}

export async function approveEntry(adminId: string, assignmentId: string): Promise<void> {
  const ctx = await adminCtx(adminId)
  const [row] = (await loadRows(ctx.tenantId, [assignmentId])).filter(
    (r) => r.hours_status === "in_review",
  )
  if (!row) throw notFound("That entry isn't waiting for review.")
  await approveRows([row])
}

export async function approveClean(adminId: string): Promise<number> {
  const ctx = await adminCtx(adminId)
  const clean = (await loadRows(ctx.tenantId)).filter(
    (r) => r.hours_status === "in_review" && toEntry(r).clean,
  )
  await approveRows(clean)
  return clean.length
}

/** The scheduled end's date, ±1 day, whichever puts a typed "HH:mm" closest to that end. */
function resolveOut(row: HoursRow, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number)
  const end = wallTime(row.ends_at, row.tz)
  const candidates = [-1, 0, 1].map((offset) =>
    zonedInstant(row.tz, {
      year: end.year,
      month: end.month,
      day: end.day + offset,
      hour: h,
      minute: m,
    }),
  )
  return candidates.reduce((best, c) =>
    Math.abs(c.getTime() - row.ends_at.getTime()) < Math.abs(best.getTime() - row.ends_at.getTime())
      ? c
      : best,
  )
}

export async function adjustEntry(
  adminId: string,
  assignmentId: string,
  input: { outTime: string; reason: string },
): Promise<AdjustResult> {
  const ctx = await adminCtx(adminId)
  const [row] = (await loadRows(ctx.tenantId, [assignmentId])).filter(
    (r) => r.hours_status === "in_review",
  )
  if (!row) throw notFound("That entry isn't waiting for review.")
  const out = resolveOut(row, input.outTime)
  const worked = out.getTime() - row.clocked_in_at.getTime()
  if (worked <= 0 || worked > 24 * 60 * MIN) {
    throw badRequest(
      "The out time has to be after the in time and within a day of it.",
      "invalid_request",
    )
  }
  const reason = input.reason.trim()
  if (reason.length < 3) throw conflict("reason_required", "Add a reason the worker will see.")

  await sql()`with adj as (
                insert into hours_adjustments (assignment_id, admin_id, old_in, old_out, new_out, reason)
                values (${assignmentId}, ${ctx.adminId}, ${row.clocked_in_at.toISOString()},
                        ${row.clocked_out_at?.toISOString() ?? null}, ${out.toISOString()}, ${reason})
              )
              update assignments set clocked_out_at = ${out.toISOString()}, status = 'completed',
                                     hours_status = 'approved'
              where id = ${assignmentId}`
  await syncEventInvoices([row.event_id], new Date())
  const outLabel = formatTime(out, row.tz)
  await notifyStaff([
    {
      staffId: row.staff_id,
      icon: "edit_calendar",
      tone: "warn",
      title: "Hours adjusted",
      body: `${row.venue}, ${formatDate(row.starts_at, row.tz)}: out ${outLabel}. ${reason}`,
      href: "/staff/shifts",
    },
  ])
  return { outTime: outLabel, total: formatDuration(worked), name: row.name }
}
