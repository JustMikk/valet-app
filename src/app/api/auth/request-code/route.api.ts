import { RequestCodeRequest } from "@/lib/data/staff/schemas"
import { readBody, route } from "@/server/http/handler"

/** Demo sign-in: nothing is sent (the code is fixed), so this only checks the email or phone. */
export const POST = route(async ({ req }) => {
  await readBody(req, RequestCodeRequest)
  return Response.json({ sent: true })
})
