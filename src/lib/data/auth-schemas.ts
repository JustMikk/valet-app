// Wire format of sign-in. Staff are recognised by their email alone (owner decision); dispatchers
// also give a password.
import { z } from "zod/mini"

export const StaffLoginRequest = z.object({ email: z.email() })

export const AdminLoginRequest = z.object({
  email: z.email(),
  password: z.string().check(z.minLength(1), z.maxLength(200)),
})
