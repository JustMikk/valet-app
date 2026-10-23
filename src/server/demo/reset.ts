// Resets the demo database to a known scenario in one transaction: wipe, then bulk-insert each
// table from a single JSON document (jsonb_populate_recordset), so a reset is a handful of round
// trips instead of hundreds of inserts. Columns come from the fixture rows, so anything a fixture
// leaves out takes the table's default.
import { sql } from "../db/client"
import { env } from "../env"
import { buildFixtures, type Fixtures, type Scenario } from "./fixtures"

// Insertion order respects foreign keys; table names are fixed literals, never request input.
const TABLES = [
  "tenants",
  "admins",
  "staff",
  "venues",
  "events",
  "assignments",
  "punches",
  "drops",
  "broadcasts",
  "messages",
  "notifications",
  "invoices",
  "invoice_lines",
] as const satisfies readonly (keyof Fixtures)[]

const WIPE = [
  "hours_adjustments",
  "invoice_lines",
  "invoices",
  "notifications",
  "messages",
  "broadcasts",
  "drops",
  "punches",
  "assignments",
  "events",
  "venues",
  "staff",
  "admins",
  "tenants",
].join(", ")

const IDENTIFIER = /^[a-z_]+$/

/** The union of the columns the rows set (rows may omit optional ones). */
function columnsOf(rows: Record<string, unknown>[]): string[] {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  for (const column of columns)
    if (!IDENTIFIER.test(column)) throw new Error(`bad column ${column}`)
  return columns
}

/** DEMO_VENUE_LAT / DEMO_VENUE_LNG, when both are valid coordinates. */
function grandCenterFromEnv(): { lat: number; lng: number } | undefined {
  const lat = Number(env().DEMO_VENUE_LAT)
  const lng = Number(env().DEMO_VENUE_LNG)
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  return env().DEMO_VENUE_LAT && env().DEMO_VENUE_LNG && valid ? { lat, lng } : undefined
}

export async function resetDemo(scenario: Scenario, now: Date = new Date()): Promise<void> {
  const fixtures = buildFixtures(now, scenario, { grandCenter: grandCenterFromEnv() })
  const db = sql()
  await db.transaction((txn) => [
    txn.query(`truncate table ${WIPE}`),
    ...TABLES.filter((table) => fixtures[table].length > 0).map((table) => {
      const columns = columnsOf(fixtures[table]).join(", ")
      return txn.query(
        `insert into ${table} (${columns}) select ${columns} from jsonb_populate_recordset(null::${table}, $1::jsonb)`,
        [JSON.stringify(fixtures[table])],
      )
    }),
  ])
}
