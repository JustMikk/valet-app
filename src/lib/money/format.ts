// Money is integer cents everywhere (handoff §6); these are the only places it becomes text.

/** 528200 → "$5,282.00". Negative amounts keep their sign in front of the symbol. */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : ""
  const abs = Math.abs(Math.round(cents))
  const dollars = Math.floor(abs / 100).toLocaleString("en-US")
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`
}

/** 3800 → "$38.00 / h". */
export function formatRate(centsPerHour: number): string {
  return `${formatMoney(centsPerHour)} / h`
}

/** Minutes as decimal hours for invoices: 8340 → "139.0 h". */
export function formatHoursDecimal(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} h`
}

/** Minutes as hours and minutes for people: 1050 → "17h 30m". */
export function formatHoursMinutes(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes))
  return `${Math.floor(whole / 60)}h ${String(whole % 60).padStart(2, "0")}m`
}

/** Minutes → cents at an hourly rate, rounded to the nearest cent. */
export function amountCents(minutes: number, rateCentsPerHour: number): number {
  return Math.round((minutes * rateCentsPerHour) / 60)
}
