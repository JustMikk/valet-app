// @vitest-environment node
import { describe, expect, it } from "vitest"

import { adminChannel, channelAuth, channelOwner, staffChannel, triggerRequest } from "./pusher"

// Pusher's authentication reference inputs with stand-in credentials. The algorithm reproduces
// the reference's own example signatures, and was checked live against a real app (ADR-023).
const keys = { appId: "3", key: "test-key", secret: "test-secret", cluster: "mt1" }

describe("channelAuth", () => {
  it("signs a private channel subscription as key:hmac(socket_id:channel)", () => {
    const [publicPart, signature] = channelAuth(keys, "1234.1234", "private-foobar").split(":")
    expect(publicPart).toBe("test-key")
    expect(signature).toBe("37ebb0a1a65b48edd9a1353c77587d5631d7ca86a75044f71502977dfae28420")
  })
})

describe("triggerRequest", () => {
  it("signs the REST call that publishes an event (auth_version 1.0)", () => {
    const body = JSON.stringify({
      name: "foo",
      channels: ["project-3"],
      data: JSON.stringify({ some: "data" }),
    })
    const url = new URL(triggerRequest(keys, body, 1_353_088_179))
    expect(url.origin).toBe("https://api-mt1.pusher.com")
    expect(url.pathname).toBe("/apps/3/events")
    expect(url.searchParams.get("body_md5")).toBe("ec365a775a4cd0599faeb73354201b6f")
    expect(url.searchParams.get("auth_key")).toBe("test-key")
    expect(url.searchParams.get("auth_signature")).toBe(
      "7f49c41238194065260998f407264c77f365ad8e364706a543cb957e29365df8",
    )
  })
})

describe("channelOwner", () => {
  const staffId = "00000000-0000-4000-8000-000000000101"
  const tenantId = "00000000-0000-4000-8000-000000000001"

  it("reads who a channel belongs to", () => {
    expect(channelOwner(staffChannel(staffId))).toEqual({ role: "staff", id: staffId })
    expect(channelOwner(adminChannel(tenantId))).toEqual({ role: "admin", id: tenantId })
  })

  it("refuses anything else", () => {
    expect(channelOwner("private-foobar")).toBeNull()
    expect(channelOwner(`presence-staff-${staffId}`)).toBeNull()
    expect(channelOwner(`private-staff-${staffId}-extra`)).toBeNull()
  })
})
