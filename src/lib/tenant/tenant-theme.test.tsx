import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { tenantThemeCss } from "./accent"
import { TenantTheme } from "./tenant-theme"

describe("TenantTheme", () => {
  it("injects the accent variables for both theme scopes", () => {
    const { container } = render(<TenantTheme accent="#8E1B2A" />)
    const style = container.querySelector("style")
    expect(style?.textContent).toBe(tenantThemeCss("#8E1B2A"))
  })

  it("injects nothing for the default accent, which tokens.css already defines", () => {
    const { container } = render(<TenantTheme accent="#C9A24A" />)
    expect(container.querySelector("style")).toBeNull()
  })

  it("throws on an invalid accent instead of rendering unchecked CSS", () => {
    expect(() => render(<TenantTheme accent="red;}body{display:none" />)).toThrow()
  })
})
