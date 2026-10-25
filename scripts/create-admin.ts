// Creates (or updates the password of) a dispatcher account:
//   tsx --env-file=.env.local scripts/create-admin.ts <email> <password> ["Full Name"]
// The account joins the first tenant. Dispatchers sign in with this email and password.
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/server/auth/password"
import { rows, sql } from "../src/server/db/client"

async function main() {
  const [email, password, name = "Dispatcher"] = process.argv.slice(2)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    console.error('Usage: pnpm admin:create <email> <password> ["Full Name"]')
    process.exit(2)
  }
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
    await sql()`update admins set password_hash = ${hash} where id = ${existing.id}`
    console.log(`Updated the password for ${email}.`)
    return
  }
  await sql()`insert into admins (tenant_id, name, email, role_label, password_hash)
              values (${tenant.id}, ${name}, ${email}, 'Owner · Admin', ${hash})`
  console.log(`Created dispatcher ${email}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
