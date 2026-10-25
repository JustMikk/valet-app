import { describe, expect, it } from "vitest"

import {
  amountCents,
  formatHoursDecimal,
  formatHoursMinutes,
  formatMoney,
  formatRate,
} from "./format"

describe("money formatting", () => {
  it("formats integer cents with thousands separators", () => {
    expect(formatMoney(528200)).toBe("$5,282.00")
    expect(formatMoney(5)).toBe("$0.05")
    expect(formatMoney(0)).toBe("$0.00")
    expect(formatMoney(100000000)).toBe("$1,000,000.00")
  })

  it("keeps the sign of negative amounts in front", () => {
    expect(formatMoney(-12345)).toBe("-$123.45")
  })

  it("formats hourly rates and hour totals the way the design does", () => {
    expect(formatRate(3800)).toBe("$38.00 / h")
    expect(formatHoursDecimal(8340)).toBe("139.0 h")
    expect(formatHoursDecimal(5790)).toBe("96.5 h")
    expect(formatHoursMinutes(1050)).toBe("17h 30m")
    expect(formatHoursMinutes(5)).toBe("0h 05m")
  })

  it("multiplies minutes by an hourly rate without float drift", () => {
    expect(amountCents(3510, 3800)).toBe(222300)
    expect(amountCents(1470, 3800)).toBe(93100)
    expect(amountCents(2400, 3500)).toBe(140000)
    expect(amountCents(7, 3333)).toBe(389)
  })
})
