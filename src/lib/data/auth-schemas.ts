// Wire format of sign-in. Staff are recognised by their email or phone number alone (owner
// decision, ADR-025); admins also give a password. The server reads `login` as one or the other.
import { z } from "zod/mini"

/** An email or a phone number, in any common formatting. */
export const LoginId = z.string().check(z.trim(), z.minLength(3), z.maxLength(254))

export const StaffLoginRequest = z.object({ login: LoginId })

export const AdminLoginRequest = z.object({
  login: LoginId,
  password: z.string().check(z.minLength(1), z.maxLength(200)),
})
