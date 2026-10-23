// Resets the demo database to a known scenario in one transaction: wipe, then bulk-insert each
// table from a single JSON document (jsonb_populate_recordset), so a reset is a handful of round
// trips instead of hundreds of inserts.
import { sql } from "../db/client"
import { buildFixtures, type Fixtures, type Scenario } from "./fixtures"

// Insertion order respects foreign keys; table names are fixed literals, never request input.
const TABLES = [
  "tenants",
  "staff",
  "venues",
  "events",
  "assignments",
  "punches",
  "messages",
  "notifications",
] as const satisfies readonly (keyof Fixtures)[]

export async function resetDemo(scenario: Scenario, now: Date = new Date()): Promise<void> {
  const fixtures = buildFixtures(now, scenario)
  const db = sql()
  await db.transaction((txn) => [
    txn.query(
      "truncate table notifications, messages, drops, punches, assignments, events, venues, staff, tenants",
    ),
    ...TABLES.filter((table) => fixtures[table].length > 0).map((table) =>
      txn.query(
        `insert into ${table} select * from jsonb_populate_recordset(null::${table}, $1::jsonb)`,
        [JSON.stringify(fixtures[table])],
      ),
    ),
  ])
}
