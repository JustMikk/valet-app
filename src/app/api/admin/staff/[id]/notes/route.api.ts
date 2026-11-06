import { z } from "zod/mini"

import { NewStaffNoteRequest, StaffNoteDto } from "@/lib/data/admin/schemas"
import { addStaffNote } from "@/server/admin/person-insights"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const { body } = await readBody(req, NewStaffNoteRequest)
  return ok(
    z.array(StaffNoteDto),
    await addStaffNote(adminId, readId(params.id), body, new Date()),
    201,
  )
})
