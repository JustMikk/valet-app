import { z } from "zod/mini"

import { StaffNoteDto } from "@/lib/data/admin/schemas"
import { deleteStaffNote } from "@/server/admin/person-insights"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const DELETE = adminRoute<{ id: string; noteId: string }>(async ({ params, adminId }) =>
  ok(
    z.array(StaffNoteDto),
    await deleteStaffNote(adminId, readId(params.id), readId(params.noteId), new Date()),
  ),
)
