import { StaffLoginRequest } from "@/lib/data/auth-schemas"
import { SessionDto } from "@/lib/data/staff/schemas"
import { staffSignIn } from "@/server/auth/sign-in"
import { ok, readBody, route } from "@/server/http/handler"

export const POST = route(async ({ req }) => {
  const { email } = await readBody(req, StaffLoginRequest)
  return ok(SessionDto, await staffSignIn(email))
})
