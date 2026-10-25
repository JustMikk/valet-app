/** Postgres unique-violation (SQLSTATE 23505): a duplicate key, e.g. a replayed idempotency key. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "23505"
  )
}
