// Applies db/migrations/*.sql in order, once each: node --env-file=.env.local scripts/db-migrate.mjs
// Each file runs in one transaction; applied names are recorded in schema_migrations.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set (copy .env.example to .env.local).")
  process.exit(2)
}

const sql = neon(url)
const dir = join(import.meta.dirname, "..", "db", "migrations")

await sql`create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
)`
const applied = new Set((await sql`select name from schema_migrations`).map((row) => row.name))

for (const file of readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort()) {
  if (applied.has(file)) {
    console.log(`skip   ${file}`)
    continue
  }
  const statements = readFileSync(join(dir, file), "utf8")
    .split(/;[ \t]*\r?\n/)
    .map((chunk) =>
      chunk
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean)
  await sql.transaction((txn) => [
    ...statements.map((statement) => txn.query(statement)),
    txn`insert into schema_migrations (name) values (${file})`,
  ])
  console.log(`apply  ${file} (${statements.length} statements)`)
}
