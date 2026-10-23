// Venues and their geofences (product spec §7.3). Bill rates are read here and nowhere in the
// staff API (handoff §5.4).
import type { NewVenueRequest, VenueDetail, VenuePatch, VenueRow } from "@/lib/data/admin/schemas"
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
  lat: number
  lng: number
  radius_m: number
  timezone: string
  contact_text: string
  contact_name: string
  contact_tel: string
  dress_code: string
  billing_email: string
  bill_rate_cents: number
}

/** With no id, the first venue by name (what a screen opened without `?id=` shows). */
export async function getVenue(
  adminId: string,
  venueId: string | undefined,
  now: Date,
): Promise<VenueDetail> {
  const ctx = await adminCtx(adminId)
  const [v] = await rows<DetailRow>(
    sql()`select id, name, address, lat, lng, radius_m, timezone, contact_text, contact_name,
                 contact_tel, dress_code, billing_email, bill_rate_cents
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
    street: v.address,
    lat: v.lat,
    lng: v.lng,
    radiusM: v.radius_m,
    contact: v.contact_text,
    contactName: v.contact_name,
    contactTel: v.contact_tel,
    dress: v.dress_code,
    billingEmail: v.billing_email,
    billRateCents: v.bill_rate_cents,
  }
}

/** "400 Market St, San Francisco" → "400 Market St": the short line lists and events show. */
const shortAddress = (street: string) => street.split(",")[0]?.trim() || street

const mapsUrl = (lat: number, lng: number) => `https://maps.google.com/?q=${lat},${lng}`

/** Adds a venue to the tenant, in the tenant's time zone and with its default accuracy rule. */
export async function createVenue(
  adminId: string,
  input: NewVenueRequest,
  now: Date,
): Promise<VenueDetail> {
  const ctx = await adminCtx(adminId)
  const [created] = await rows<{ id: string }>(
    sql()`insert into venues (tenant_id, name, address, short_address, maps_url, lat, lng, radius_m,
                              min_accuracy_m, timezone, contact_text, contact_name, contact_tel,
                              dress_code, billing_email, bill_rate_cents)
          select ${ctx.tenantId}, ${input.name}, ${input.street}, ${shortAddress(input.street)},
                 ${mapsUrl(input.lat, input.lng)}, ${input.lat}, ${input.lng}, ${input.radiusM},
                 t.min_accuracy_m, t.timezone, ${input.contactName}, ${input.contactName},
                 ${input.contactTel}, ${input.dress}, ${input.billingEmail}, ${input.billRateCents}
          from tenants t where t.id = ${ctx.tenantId}
          returning id`,
  )
  return getVenue(adminId, created.id, now)
}

/** Changes a venue. Events already created keep the contact and dress code they copied. */
export async function patchVenue(
  adminId: string,
  venueId: string,
  patch: VenuePatch,
  now: Date,
): Promise<VenueDetail> {
  const ctx = await adminCtx(adminId)
  const [current] = await rows<{ lat: number; lng: number }>(
    sql()`select lat, lng from venues where id = ${venueId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!current) throw notFound("Venue not found.")
  const lat = patch.lat ?? current.lat
  const lng = patch.lng ?? current.lng
  const moved = patch.lat !== undefined || patch.lng !== undefined
  await sql()`update venues set
      name = coalesce(${patch.name ?? null}::text, name),
      address = coalesce(${patch.street ?? null}::text, address),
      short_address = case when ${patch.street ?? null}::text is null then short_address
                           else ${shortAddress(patch.street ?? "")} end,
      lat = ${lat}, lng = ${lng},
      maps_url = case when ${moved} then ${mapsUrl(lat, lng)} else maps_url end,
      radius_m = coalesce(${patch.radiusM ?? null}::int, radius_m),
      contact_name = coalesce(${patch.contactName ?? null}::text, contact_name),
      contact_text = coalesce(${patch.contactName ?? null}::text, contact_text),
      contact_tel = coalesce(${patch.contactTel ?? null}::text, contact_tel),
      dress_code = coalesce(${patch.dress ?? null}::text, dress_code),
      billing_email = coalesce(${patch.billingEmail ?? null}::text, billing_email),
      bill_rate_cents = coalesce(${patch.billRateCents ?? null}::int, bill_rate_cents)
    where id = ${venueId} and tenant_id = ${ctx.tenantId}`
  return getVenue(adminId, venueId, now)
}
