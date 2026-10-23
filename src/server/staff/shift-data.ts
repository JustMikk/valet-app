// The one query behind Home, My shifts and Shift detail: a staff member's assignments with their
// event, venue and clock-in facts. No rate columns exist on these tables for staff (handoff §5.4).
import { rows, sql } from "../db/client"

export type ShiftRow = {
  assignment_id: string
  status: "open" | "confirmed" | "claimed" | "completed" | "no_show"
  hours_status: "in_review" | "approved"
  clocked_in_at: Date | null
  clocked_out_at: Date | null
  event_id: string
  title: string
  starts_at: Date
  ends_at: Date
  window_min: number
  crew_size: number
  contact_text: string
  contact_name: string
  contact_tel: string
  dress_code: string
  instructions: string
  venue_name: string
  address: string
  short_address: string
  maps_url: string
  timezone: string
  lat: number
  lng: number
  radius_m: number
  min_accuracy_m: number
  in_distance_m: number | null
}

export type ShiftScope = "upcoming" | "past" | "any"

type Options = { assignmentId?: string; limit?: number }

/** Upcoming: held, published, not yet clocked out and not over. Past: finished or over. */
export async function loadShifts(
  staffId: string,
  scope: ShiftScope,
  { assignmentId, limit = 20 }: Options = {},
): Promise<ShiftRow[]> {
  return rows<ShiftRow>(
    sql()`select a.id as assignment_id, a.status, a.hours_status, a.clocked_in_at, a.clocked_out_at,
            e.id as event_id, e.title, e.starts_at, e.ends_at,
            e.clock_in_window_min as window_min, e.crew_size,
            e.contact_text, e.contact_name, e.contact_tel, e.dress_code, e.instructions,
            v.name as venue_name, v.address, v.short_address, v.maps_url, v.timezone,
            v.lat, v.lng, v.radius_m, v.min_accuracy_m,
            (select p.distance_m from punches p
               where p.assignment_id = a.id and p.kind = 'in' and p.status in ('accepted', 'approved')
               order by p.server_at desc limit 1) as in_distance_m
          from assignments a
          join events e on e.id = a.event_id
          join venues v on v.id = e.venue_id
          where a.staff_id = ${staffId}
            and (${assignmentId ?? null}::uuid is null or a.id = ${assignmentId ?? null}::uuid)
            and (
              ${scope} = 'any'
              or (${scope} = 'upcoming' and a.status in ('confirmed', 'claimed')
                  and e.status = 'published' and a.clocked_out_at is null and e.ends_at > now())
              or (${scope} = 'past' and (a.status = 'completed' or e.ends_at <= now()))
            )
          order by (a.clocked_in_at is not null and a.clocked_out_at is null) desc,
                   (case when ${scope} = 'past' then -1 else 1 end) * extract(epoch from e.starts_at)
          limit ${limit}`,
  )
}
