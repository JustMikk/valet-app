// Neon Postgres over HTTP: one stateless query function per call, so it works the same in dev,
// a Node server and serverless. Tagged templates parameterise every value (no string-built SQL).
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

import { env } from "../env"

type Sql = NeonQueryFunction<false, false>

let client: Sql | null = null

export function sql(): Sql {
  client ??= neon(env().DATABASE_URL)
  return client
}

/**
 * Types the rows of a query. The database is our own store with migrated columns, so the row shape
 * is asserted here; everything that crosses the HTTP boundary is validated by Zod instead.
 */
export async function rows<T>(query: PromiseLike<unknown>): Promise<T[]> {
  return (await query) as T[]
}
