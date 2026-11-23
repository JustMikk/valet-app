// Email or phone (ADR-025): how a sign-in or an invite is read. Phone numbers are compared by a key
// of their digits, so "(713) 555-0120" and "+1 713 555 0120" are the same person. The database
// computes the same key (migration 015, staff.phone_key and admins.phone_key): keep them in step.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Digits only; a 10-digit number is taken as US/Canada (+1). Null unless 8–15 digits. */
export function phoneKey(text: string): string | null {
  const digits = text.replace(/\D/g, "")
  if (digits.length === 10) return `1${digits}`
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

export type Login = { kind: "email"; email: string } | { kind: "phone"; key: string }

/** An email (anything with an @) or a phone number; null when it is neither. */
export function parseLogin(text: string): Login | null {
  const value = text.trim()
  if (value.includes("@")) {
    const email = value.toLowerCase()
    return EMAIL.test(email) ? { kind: "email", email } : null
  }
  const key = phoneKey(value)
  return key ? { kind: "phone", key } : null
}

/** "(713) 555-0120" for US/Canada numbers, "+251911234567" for the rest. */
export function formatPhone(text: string): string {
  const key = phoneKey(text)
  if (!key) return text.trim()
  if (key.length === 11 && key.startsWith("1")) {
    return `(${key.slice(1, 4)}) ${key.slice(4, 7)}-${key.slice(7)}`
  }
  return `+${key}`
}

/** A phone number in E.164 ("+17135550120"), the only form an SMS provider accepts. */
export type E164 = string & { readonly __brand: "E164" }

/** Any typed phone number as E.164, keyed exactly as `phoneKey`; null when it is not one. */
export function e164(text: string): E164 | null {
  const key = phoneKey(text)
  return key ? (`+${key}` as E164) : null
}

/** US/Canada (+1 and ten digits): the only numbers the registered SMS sender texts. */
export function isUsNumber(number: E164 | null): number is E164 {
  return number !== null && /^\+1\d{10}$/.test(number)
}
