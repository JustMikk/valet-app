// The staff directory (product spec §7.4): who works here, their status, invites, deactivation.
import { formatPhone, phoneKey } from "@/lib/contact/contact"
import type {
  InviteEntry,
  InviteResult,
  Person,
  StaffList,
  StaffRow,
} from "@/lib/data/admin/schemas"
import { formatHoursMinutes } from "@/lib/money/format"
import { ADMIN_STATUS } from "@/lib/status/admin"
import type { StatusSpec } from "@/lib/status/presets"
import {
  calendarDaysBetween,
  formatDate,
  formatTime,
  formatWeekday,
  wallTime,
  zonedInstant,
} from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { notFound } from "../http/handler"
import { demoEnabled } from "../env"
import { textInvite, type InviteTextResult } from "../sms"
import { smsConfig } from "../sms/config"
import { textReach } from "../sms/policy"
import { adminCtx, firstName, initialsOf } from "./common"

type ListRow = {
  id: string
  name: string
  email: string
  active: boolean
  push_enabled: boolean
  onboarded_at: Date | null
  on_shift: boolean
  next_title: string | null
  next_starts: Date | null
  next_tz: string | null
  week_minutes: number
}

/** Monday 00:00 of the week containing `now`, in the zone: where "this week" starts. */
export function weekStart(now: Date, tz: string): Date {
  const w = wallTime(now, tz)
  const sinceMonday = (w.dow + 6) % 7
  return zonedInstant(tz, {
    year: w.year,
    month: w.month,
    day: w.day - sinceMonday,
    hour: 0,
    minute: 0,
  })
}

function statusOf(row: ListRow): { status: StatusSpec; bucket: StaffRow["bucket"] } {
  if (!row.active) return { status: ADMIN_STATUS.inactive, bucket: "inactive" }
  if (!row.onboarded_at) return { status: ADMIN_STATUS.invited, bucket: "invited" }
  if (row.on_shift) return { status: ADMIN_STATUS.onShift, bucket: "active" }
  if (!row.push_enabled) return { status: ADMIN_STATUS.alertsOff, bucket: "alerts" }
  return { status: ADMIN_STATUS.active, bucket: "active" }
}

function nextLabel(row: ListRow, now: Date): string {
  if (!row.active) return "—"
  if (!row.onboarded_at) return "Not joined yet"
  if (!row.next_starts || !row.next_tz || !row.next_title) return "—"
  const when =
    calendarDaysBetween(now, row.next_starts, row.next_tz) <= 0
      ? "Tonight"
      : formatWeekday(row.next_starts, row.next_tz)
  return `${when} · ${row.next_title.replace(/^The /, "")}`
}

export async function listStaff(adminId: string, now: Date): Promise<StaffList> {
  const ctx = await adminCtx(adminId)
  const list = await rows<ListRow>(
    sql()`select s.id, s.name, coalesce(nullif(s.email, ''), s.phone) as email, s.active,
            s.push_enabled, s.onboarded_at,
            exists (select 1 from assignments a
                    where a.staff_id = s.id and a.clocked_in_at is not null and a.clocked_out_at is null) as on_shift,
            nx.title as next_title, nx.starts_at as next_starts, nx.timezone as next_tz,
            coalesce(hrs.minutes, 0)::int as week_minutes
          from staff s
          left join lateral (
            select e.title, e.starts_at, v.timezone
            from assignments a join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            where a.staff_id = s.id and a.status in ('confirmed', 'claimed') and e.status = 'published'
              and e.ends_at > now() and a.clocked_out_at is null
            order by e.starts_at limit 1
          ) nx on true
          left join lateral (
            select sum(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60) as minutes
            from assignments a
            where a.staff_id = s.id and a.clocked_in_at >= ${weekStart(now, ctx.tz).toISOString()}
              and a.clocked_out_at is not null
          ) hrs on true
          where s.tenant_id = ${ctx.tenantId}
          order by s.name`,
  )
  const result: StaffRow[] = list.map((row) => {
    const { status, bucket } = statusOf(row)
    const working = row.active && row.onboarded_at
    return {
      id: row.id,
      initials: initialsOf(row.name),
      name: row.name,
      email: row.email,
      status,
      bucket,
      next: nextLabel(row, now),
      hours: working ? formatHoursMinutes(row.week_minutes) : "—",
    }
  })
  return {
    rows: result,
    total: result.filter((r) => r.bucket !== "inactive").length,
    invited: result.filter((r) => r.bucket === "invited").length,
    alertsOff: result.filter((r) => r.bucket === "alerts").length,
  }
}

type PersonRow = {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
  installed: boolean
  device_label: string | null
  push_enabled: boolean
  created_at: Date
  week_minutes: number
  sms_last: string | null
}

export async function getPerson(adminId: string, staffId: string, now: Date): Promise<Person> {
  const ctx = await adminCtx(adminId)
  const [p] = await rows<PersonRow>(
    sql()`select s.id, s.name, s.email, s.phone, s.active, s.installed, s.device_label,
            s.push_enabled, s.created_at,
            (select m.status from sms_messages m
              where m.staff_id = s.id and m.status <> 'skipped'
              order by m.created_at desc limit 1) as sms_last,
            coalesce((select sum(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60)
                      from assignments a
                      where a.staff_id = s.id and a.clocked_out_at is not null
                        and a.clocked_in_at >= ${weekStart(now, ctx.tz).toISOString()}), 0)::int as week_minutes
          from staff s where s.id = ${staffId} and s.tenant_id = ${ctx.tenantId}`,
  )
  if (!p) throw notFound("Person not found.")
  const recent = await rows<{
    title: string
    clocked_in_at: Date
    clocked_out_at: Date | null
    starts_at: Date
    tz: string
  }>(
    sql()`select e.title, a.clocked_in_at, a.clocked_out_at, e.starts_at, v.timezone as tz
          from assignments a join events e on e.id = a.event_id join venues v on v.id = e.venue_id
          where a.staff_id = ${staffId} and a.clocked_in_at is not null
          order by a.clocked_in_at desc limit 5`,
  )
  const joined = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: ctx.tz,
  }).format(p.created_at)
  return {
    id: p.id,
    initials: initialsOf(p.name),
    name: p.name,
    role: `Valet attendant · joined ${joined}`,
    phone: p.phone.replace(/[^\d+]/g, "").replace(/^(\d{10})$/, "+1$1"),
    active: p.active,
    rows: [
      { k: "Phone", v: p.phone || "—" },
      { k: "Email", v: p.email || "—" },
      {
        k: "App installed",
        v: p.installed ? `Yes${p.device_label ? ` · ${p.device_label}` : ""}` : "No",
      },
      { k: "Notifications", v: p.push_enabled ? "On" : "Off" },
      { k: "Text messages", v: textReach(smsConfig() !== null, p.phone, p.sms_last) },
      { k: "Hours this pay period", v: formatHoursMinutes(p.week_minutes) },
    ],
    shifts: recent.map((shift) => ({
      venue: shift.title,
      when: shift.clocked_out_at
        ? formatDate(shift.starts_at, shift.tz)
        : `Tonight · in ${formatTime(shift.clocked_in_at, shift.tz)}`,
      hours: shift.clocked_out_at
        ? formatHoursMinutes(
            (shift.clocked_out_at.getTime() - shift.clocked_in_at.getTime()) / 60_000,
          )
        : "live",
    })),
  }
}

const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

/** "kai.morgan@gmail.com" → "Kai Morgan": a placeholder name until they confirm their profile. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email
  const words = local.split(/[._-]+/).filter(Boolean)
  return (words.length ? words : [local]).map(titleCase).join(" ")
}

/**
 * Adds people to the team by email or by phone (ADR-025); they then sign in with what they were
 * invited with. Anyone already on the team (same email, or same number in any formatting) is
 * skipped and named in `skipped`.
 */
export async function inviteStaff(adminId: string, invites: InviteEntry[]): Promise<InviteResult> {
  const ctx = await adminCtx(adminId)
  const invited: string[] = []
  const skipped: string[] = []
  let texted = 0
  const notTexted: InviteResult["notTexted"] = []
  let tenant: string | undefined
  // In demo mode, immediately mark the new staff as onboarded so they appear in the
  // available-staff picker and can be assigned to events without waiting for sign-up.
  const demo = demoEnabled()
  for (const entry of invites) {
    if ("email" in entry) {
      const email = entry.email.trim().toLowerCase()
      const [created] = await rows<{ id: string }>(
        sql()`insert into staff (tenant_id, name, email, invited_at, onboarded_at, installed)
              values (${ctx.tenantId}, ${nameFromEmail(email)}, ${email}, now(),
                      case when ${demo} then now() end, false)
              on conflict (lower(email)) where email <> '' do nothing
              returning id`,
      )
      ;(created ? invited : skipped).push(email)
      continue
    }
    const phone = formatPhone(entry.phone)
    if (!phoneKey(entry.phone)) {
      skipped.push(`${entry.phone} (not a phone number)`)
      continue
    }
    const [created] = await rows<{ id: string }>(
      sql()`insert into staff (tenant_id, name, email, phone, invited_at, onboarded_at, installed)
            values (${ctx.tenantId}, ${entry.name.trim()}, '', ${phone}, now(),
                    case when ${demo} then now() end, false)
            on conflict (phone_key) where phone_key is not null do nothing
            returning id`,
    )
    ;(created ? invited : skipped).push(phone)
    if (!created) continue
    // A phone invite also goes out by text with the sign-in link (ADR-026).
    const result = await textInvite({
      tenantId: ctx.tenantId,
      staffId: created.id,
      adminFirst: firstName(ctx.name),
      tenantName: (tenant ??= await tenantName(ctx.tenantId)),
      phone,
    })
    if (result.texted) texted += 1
    else notTexted.push({ who: phone, reason: NOT_TEXTED[result.reason] })
  }
  return { invited: invited.length, skipped, texted, notTexted }
}

/** Why a phone invite was not texted, as the invite sheet says it. */
const NOT_TEXTED: Record<Exclude<InviteTextResult, { texted: true }>["reason"], string> = {
  not_configured: "texts aren't set up yet",
  not_us: "not a US number",
  no_phone: "not a phone number",
  failed: "the text didn't go through",
}

async function tenantName(tenantId: string): Promise<string> {
  const [row] = await rows<{ name: string }>(sql()`select name from tenants where id = ${tenantId}`)
  return row?.name ?? ""
}

/**
 * Permanently delete a staff record, active or not. Their upcoming unclocked shifts reopen for
 * others; their past shifts, hours, punches, messages and notifications are deleted with them.
 */
export async function deleteStaff(adminId: string, staffId: string): Promise<void> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{ id: string }>(
    sql()`select id from staff where id = ${staffId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!person) throw notFound("Person not found.")
  const db = sql()
  await db.transaction([
    db`delete from drops where staff_id = ${staffId}`,
    db`delete from punches where staff_id = ${staffId}`,
    db`delete from notifications where staff_id = ${staffId}`,
    db`delete from messages where staff_id = ${staffId}`,
    db`update assignments a set staff_id = null, status = 'open', claimed_at = null,
                                assigned_at = null, assigned_by = null
       from events e
       where a.staff_id = ${staffId} and e.id = a.event_id
         and a.clocked_in_at is null and e.ends_at > now()`,
    db`delete from assignments where staff_id = ${staffId}`,
    db`delete from staff where id = ${staffId} and tenant_id = ${ctx.tenantId}`,
  ])
}

/** Deactivate: they leave their upcoming shifts (reopened for others) and can no longer sign in. */
export async function deactivateStaff(adminId: string, staffId: string, now: Date): Promise<void> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{ id: string }>(
    sql()`update staff set active = false
          where id = ${staffId} and tenant_id = ${ctx.tenantId} and active returning id`,
  )
  if (!person) throw notFound("Person not found or already inactive.")
  await sql()`with reopened as (
                update assignments a set staff_id = null, status = 'open', claimed_at = null,
                                         assigned_at = null, assigned_by = null
                from events e
                where a.staff_id = ${staffId} and e.id = a.event_id
                  and a.clocked_in_at is null and e.ends_at > ${now.toISOString()}
                returning a.id, e.starts_at
              )
              insert into drops (assignment_id, staff_id, reason, late, removed_by)
              select id, ${staffId}, 'removed', starts_at - ${now.toISOString()}::timestamptz < interval '24 hours', ${adminId}
              from reopened`
}
