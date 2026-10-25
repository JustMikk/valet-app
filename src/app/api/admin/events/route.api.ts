import { EventListDto, EventTab, IdDto, NewEventRequest } from "@/lib/data/admin/schemas"
import { createEvent, listEvents } from "@/server/admin/events"
import { adminRoute, ok, readBody, readQuery } from "@/server/http/handler"
import { z } from "zod/mini"

export const GET = adminRoute(async ({ req, adminId }) => {
  const tab = readQuery(req, "tab", z.optional(EventTab)) ?? "upcoming"
  return ok(EventListDto, await listEvents(adminId, tab, new Date()))
})

export const POST = adminRoute(async ({ req, adminId }) =>
  ok(IdDto, await createEvent(adminId, await readBody(req, NewEventRequest), new Date()), 201),
)
