export type Half = "this" | "last"

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * The half-month (1st–15th or 16th–end) containing `date`, or the one before it, as local
 * calendar dates "YYYY-MM-DD" (invoices bill in half-months, like the seeded ones).
 */
export function halfMonth(date: Date, which: Half): { start: string; end: string } {
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let second = date.getDate() >= 16
  if (which === "last") {
    if (second) second = false
    else {
      second = true
      month -= 1
      if (month === 0) {
        month = 12
        year -= 1
      }
    }
  }
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${year}-${pad(month)}-${pad(second ? 16 : 1)}`,
    end: `${year}-${pad(month)}-${pad(second ? lastDay : 15)}`,
  }
}
