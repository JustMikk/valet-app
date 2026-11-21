// Creates (or updates the password and phone of) an admin account:
//   tsx --env-file=.env.local scripts/create-admin.ts <email> <password> ["Full Name"] ["Phone"]
// The account joins the first tenant. Admins sign in with this email or phone, and the password.
import { formatPhone, phoneKey } from "../src/lib/contact/contact"
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/server/auth/password"
import { rows, sql } from "../src/server/db/client"

async function main() {
  const [email, password, name = "Dispatcher", phoneArg = ""] = process.argv.slice(2)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    console.error('Usage: pnpm admin:create <email> <password> ["Full Name"] ["Phone"]')
    process.exit(2)
  }
  if (phoneArg && !phoneKey(phoneArg)) {
    console.error("That phone number is too short or too long.")
    process.exit(2)
  }
  const phone = phoneArg ? formatPhone(phoneArg) : ""
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`)
    process.exit(2)
  }
  const [tenant] = await rows<{ id: string }>(
    sql()`select id from tenants order by created_at limit 1`,
  )
  if (!tenant) {
    console.error("No tenant yet. Run pnpm db:setup first.")
    process.exit(1)
  }
  const hash = hashPassword(password)
  const [existing] = await rows<{ id: string }>(
    sql()`select id from admins where lower(email) = lower(${email})`,
  )
  if (existing) {
    await sql()`update admins set password_hash = ${hash},
                       phone = case when ${phone} = '' then phone else ${phone} end
                where id = ${existing.id}`
    console.log(`Updated the password${phone ? " and phone" : ""} for ${email}.`)
    return
  }
  await sql()`insert into admins (tenant_id, name, email, role_label, password_hash, phone)
              values (${tenant.id}, ${name}, ${email}, 'Owner · Admin', ${hash}, ${phone})`
  console.log(`Created dispatcher ${email}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
