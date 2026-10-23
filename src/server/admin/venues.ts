// Venues and their geofences (product spec §7.3). Bill rates are read here and nowhere in the
// staff API (handoff §5.4).
import type { VenueDetail, VenuePatch, VenueRow } from "@/lib/data/admin/schemas"
import { calendarDaysBetween, formatZoneShort } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { notFound } from "../http/handler"
import { adminCtx } from "./common"

type ListRow = {
  id: string
  name: string
  short_address: string
  radius_m: number
  timezone: string
}
type EventRow = { venue_id: string; status: string; starts_at: Date; ends_at: Date }

/** "3 upcoming", "Tonight" (one event, today), "Draft" (only drafts), or "No upcoming". */
function upcomingLabel(events: EventRow[], now: Date, tz: string): string {
  const live = events.filter((e) => e.status === "published" && e.ends_at > now)
  if (live.length === 0) return events.some((e) => e.status === "draft") ? "Draft" : "No upcoming"
  if (live.length === 1 && calendarDaysBetween(now, live[0].starts_at, tz) <= 0) return "Tonight"
  return `${live.length} upcoming`
}

export async function listVenues(adminId: string, now: Date): Promise<VenueRow[]> {
  const ctx = await adminCtx(adminId)
  const [venues, events] = await Promise.all([
    rows<ListRow>(
      sql()`select id, name, short_address, radius_m, timezone from venues
            where tenant_id = ${ctx.tenantId} order by name`,
    ),
    rows<EventRow>(
      sql()`select venue_id, status, starts_at, ends_at from events
            where tenant_id = ${ctx.tenantId} and status <> 'cancelled'
              and (status = 'draft' or ends_at > now())`,
    ),
  ])
  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.short_address,
    radiusM: v.radius_m,
    upcoming: upcomingLabel(
      events.filter((e) => e.venue_id === v.id),
      now,
      v.timezone,
    ),
  }))
}

type DetailRow = {
  id: string
  name: string
  address: string
  radius_m: number
  timezone: string
  contact_text: string
  dress_code: string
  bill_rate_cents: number
}

/** With no id, the first venue by name (the "Add venue" button has no design yet: D29). */
export async function getVenue(
  adminId: string,
  venueId: string | undefined,
  now: Date,
): Promise<VenueDetail> {
  const ctx = await adminCtx(adminId)
  const [v] = await rows<DetailRow>(
    sql()`select id, name, address, radius_m, timezone, contact_text, dress_code, bill_rate_cents
          from venues
          where tenant_id = ${ctx.tenantId}
            and (${venueId ?? null}::uuid is null or id = ${venueId ?? null}::uuid)
          order by name limit 1`,
  )
  if (!v) throw notFound("Venue not found.")
  return {
    id: v.id,
    name: v.name,
    address: `${v.address} · ${formatZoneShort(now, v.timezone)}`,
    radiusM: v.radius_m,
    contact: v.contact_text,
    dress: v.dress_code,
    billRateCents: v.bill_rate_cents,
  }
}

export async function patchVenue(
  adminId: string,
  venueId: string,
  patch: VenuePatch,
  now: Date,
): Promise<VenueDetail> {
  const ctx = await adminCtx(adminId)
  const [changed] = await rows<{ id: string }>(
    sql()`update venues set radius_m = coalesce(${patch.radiusM ?? null}::int, radius_m)
          where id = ${venueId} and tenant_id = ${ctx.tenantId} returning id`,
  )
  if (!changed) throw notFound("Venue not found.")
  return getVenue(adminId, venueId, now)
}
