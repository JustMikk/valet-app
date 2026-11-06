// The Performance list (ADR-024): every active valet's reliability and key numbers for a period,
// from the same rules as one valet's page.
import type { InsightRange, TeamPerformanceRow } from "@/lib/data/admin/schemas"
import { reliability, valetStats } from "@/lib/insights/valet-stats"

import { rows, sql } from "../db/client"
import { adminCtx, initialsOf } from "./common"

const DAY = 24 * 60 * 60_000

export async function listTeamPerformance(
  adminId: string,
  rangeDays: InsightRange,
  now: Date,
): Promise<TeamPerformanceRow[]> {
  const ctx = await adminCtx(adminId)
  const since = new Date(now.getTime() - rangeDays * DAY).toISOString()
  const [staff, shifts, drops] = await Promise.all([
    rows<{ id: string; name: string }>(
      sql()`select id, name from staff
            where tenant_id = ${ctx.tenantId} and active and onboarded_at is not null
            order by name`,
    ),
    rows<{
      staff_id: string
      venue: string
      starts_at: Date
      ends_at: Date
      status: string
      clocked_in_at: Date | null
      clocked_out_at: Date | null
      pay_rate_cents: number
      paid_cents: number | null
      tips: boolean
    }>(
      sql()`select a.staff_id, v.name as venue, e.starts_at, e.ends_at, e.status, a.clocked_in_at,
                   a.clocked_out_at, e.pay_rate_cents, a.paid_cents, a.tips
            from assignments a join events e on e.id = a.event_id join venues v on v.id = e.venue_id
            where e.tenant_id = ${ctx.tenantId} and a.staff_id is not null
              and e.starts_at >= ${since} and e.starts_at <= ${now.toISOString()}`,
    ),
    rows<{ staff_id: string; late: boolean; removed: boolean }>(
      sql()`select d.staff_id, d.late, d.removed_by is not null as removed
            from drops d join staff s on s.id = d.staff_id
            where s.tenant_id = ${ctx.tenantId} and d.created_at >= ${since}`,
    ),
  ])

  return staff.map((person) => {
    const stats = valetStats(
      shifts
        .filter((shift) => shift.staff_id === person.id)
        .map((shift) => ({
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
      drops.filter((drop) => drop.staff_id === person.id),
      now,
      ctx.tz,
    )
    const score = reliability(stats)
    return {
      staffId: person.id,
      name: person.name,
      initials: initialsOf(person.name),
      score: score.value,
      band: score.band,
      shifts: stats.shifts,
      minutes: stats.minutes,
      onTimePct: stats.shifts ? Math.round((100 * stats.onTime) / stats.shifts) : null,
      late: stats.late,
      noShows: stats.noShows,
      lateDrops: stats.lateDrops,
      earnedCents: stats.earnedCents,
    }
  })
}
