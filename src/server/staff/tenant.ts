import { rows, sql } from "../db/client"

/** The tenant's clock, used wherever a label is not tied to one venue (messages, notifications). */
export async function tenantTimezone(staffId: string): Promise<string> {
  const [row] = await rows<{ timezone: string }>(
    sql()`select t.timezone from staff s join tenants t on t.id = s.tenant_id where s.id = ${staffId}`,
  )
  return row?.timezone ?? "America/Los_Angeles"
}
