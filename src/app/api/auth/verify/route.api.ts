import { SessionDto, VerifyCodeRequest } from "@/lib/data/staff/schemas"
import { verifyCode } from "@/server/auth/sign-in"
import { ok, readBody, route } from "@/server/http/handler"

export const POST = route(async ({ req }) => {
  const { email, code } = await readBody(req, VerifyCodeRequest)
  return ok(SessionDto, await verifyCode(email, code))
})
