import { RequestCodeRequest } from "@/lib/data/staff/schemas"
import { readBody, route } from "@/server/http/handler"

/** Demo sign-in: no email is sent (the code is fixed), so this only validates the address. */
export const POST = route(async ({ req }) => {
  await readBody(req, RequestCodeRequest)
  return Response.json({ sent: true })
})
