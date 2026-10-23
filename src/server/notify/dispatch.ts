// What staff do that dispatch should hear about right away: the staff services call this, and it
// turns it into a notification (and push) for every dispatcher of the person's tenant.
import { rows, sql } from "../db/client"
import { notifyAdmins, type AdminNotice } from "./index"

/** "Cole Bennett" → "Cole B." */
function shortName(name: string): string {
  const [first, ...rest] = name.split(" ")
  const last = rest.at(-1)
  return last ? `${first} ${last[0]}.` : (first ?? name)
}

/** Never throws: a notification problem must not fail the staff action that caused it. */
export async function tellDispatch(
  staffId: string,
  make: (who: string) => AdminNotice,
): Promise<void> {
  try {
    const [person] = await rows<{ name: string; tenant_id: string }>(
      sql()`select name, tenant_id from staff where id = ${staffId}`,
    )
    if (person) await notifyAdmins(person.tenant_id, make(shortName(person.name)))
  } catch (error) {
    console.warn("Dispatch notification skipped", error)
  }
}

export const snippet = (text: string, max = 80) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text
