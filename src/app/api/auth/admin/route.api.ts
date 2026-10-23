import { AdminLoginRequest } from "@/lib/data/auth-schemas"
import { SessionDto } from "@/lib/data/staff/schemas"
import { adminSignIn } from "@/server/auth/sign-in"
import { ok, readBody, route } from "@/server/http/handler"

export const POST = route(async ({ req }) => {
  const { email, password } = await readBody(req, AdminLoginRequest)
  return ok(SessionDto, await adminSignIn(email, password))
})
