import { describe, expect, it } from "vitest"

import { toBase64 } from "./base64"

describe("toBase64", () => {
  it("encodes bytes as Buffer does, across chunk boundaries", () => {
    const bytes = new Uint8Array(70_000).map((_, i) => (i * 7) % 256)
    expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"))
  })

  it("encodes the start of a PDF", () => {
    expect(toBase64(new TextEncoder().encode("%PDF-1.4"))).toBe("JVBERi0xLjQ=")
  })
})
