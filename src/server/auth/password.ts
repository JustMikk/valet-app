// Password hashing for dispatcher accounts: scrypt with a per-password random salt, compared in
// constant time. Stored as "scrypt$<salt hex>$<hash hex>".
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const KEY_BYTES = 32
const SALT_BYTES = 16

export const MIN_PASSWORD_LENGTH = 4

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES)
  const hash = scryptSync(password, salt, KEY_BYTES)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  const [scheme, saltHex, hashHex] = (stored ?? "").split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) {
    // Still do the work, so "no such account" costs the same as "wrong password".
    scryptSync(password, Buffer.alloc(SALT_BYTES), KEY_BYTES)
    return false
  }
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
