import { describe, expect, it } from "vitest"

import { parseDollars } from "../events/pay-rate-editor"
import { parsePercent } from "./billing-settings"

describe("parseDollars", () => {
  it("reads whole and two-decimal hourly amounts as cents", () => {
    expect(parseDollars("21")).toBe(2100)
    expect(parseDollars(" 21.50 ")).toBe(2150)
    expect(parseDollars("7.5")).toBe(750)
  })

  it("rejects zero, three decimals, signs, words and absurd rates", () => {
    expect(parseDollars("0")).toBeNull()
    expect(parseDollars("21.505")).toBeNull()
    expect(parseDollars("-21")).toBeNull()
    expect(parseDollars("twenty")).toBeNull()
    expect(parseDollars("1001")).toBeNull()
  })
})

describe("parsePercent", () => {
  it("reads a percentage as basis points", () => {
    expect(parsePercent("6.25")).toBe(625)
    expect(parsePercent("8")).toBe(800)
    expect(parsePercent("0")).toBe(0)
  })

  it("rejects anything over 50 % or not a plain number", () => {
    expect(parsePercent("51")).toBeNull()
    expect(parsePercent("6.255")).toBeNull()
    expect(parsePercent("6%")).toBeNull()
  })
})
