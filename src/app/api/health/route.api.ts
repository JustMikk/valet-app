import { sql } from "@/server/db/client"

export const dynamic = "force-dynamic"

/** Liveness + database reachability for the demo API. */
export async function GET() {
  const [row] = await sql()`select now() as now`
  return Response.json({ ok: true, dbTime: row?.now ?? null })
}
