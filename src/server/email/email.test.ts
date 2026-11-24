import { describe, expect, it, vi } from "vitest"

import { emailConfigFrom, type EmailConfig } from "./config"
import { escapeHtml, invoiceEmail, inviteEmail } from "./copy"
import { inviteLink } from "./index"
import { parseSendResponse, sendEmail, sendRequest } from "./resend"

const VARS = {
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Regency <noreply@example.com>",
  APP_URL: "https://valet.example.com/",
}

const CFG: EmailConfig = {
  apiKey: "re_test_key",
  from: "Regency <noreply@example.com>",
  replyTo: null,
  appUrl: "https://valet.example.com",
}

describe("emailConfigFrom", () => {
  it("is on with a key, a sender and the app's URL (its origin, no trailing slash)", () => {
    expect(emailConfigFrom(VARS)).toEqual({ ...CFG, replyTo: null })
  })

  it("is off when any of them is missing or blank", () => {
    expect(emailConfigFrom({ ...VARS, RESEND_API_KEY: " " })).toBeNull()
    expect(emailConfigFrom({ ...VARS, EMAIL_FROM: undefined })).toBeNull()
    expect(emailConfigFrom({ ...VARS, APP_URL: "not a url" })).toBeNull()
  })

  it("takes a bare sender address or a named one, and nothing else", () => {
    expect(emailConfigFrom({ ...VARS, EMAIL_FROM: "noreply@example.com" })?.from).toBe(
      "noreply@example.com",
    )
    expect(emailConfigFrom({ ...VARS, EMAIL_FROM: "regency<noreply@regency.io>" })?.from).toBe(
      "regency<noreply@regency.io>",
    )
    expect(emailConfigFrom({ ...VARS, EMAIL_FROM: "Regency" })).toBeNull()
  })

  it("keeps a reply-to address only when it is one", () => {
    expect(emailConfigFrom({ ...VARS, EMAIL_REPLY_TO: "office@example.com" })?.replyTo).toBe(
      "office@example.com",
    )
    expect(emailConfigFrom({ ...VARS, EMAIL_REPLY_TO: "office" })?.replyTo).toBeNull()
  })
})

describe("inviteEmail", () => {
  const content = inviteEmail({
    adminFirst: "Dana",
    tenant: " Regency Parking Service ",
    link: inviteLink(CFG.appUrl, "kai@example.com"),
    email: "kai@example.com",
  })

  it("says who invited them, with the sign-in link and the address to use", () => {
    expect(content.subject).toBe(
      "Dana at Regency Parking Service invited you to join their valet crew",
    )
    expect(content.text).toBe(
      "Dana at Regency Parking Service invited you to join their valet crew.\n\n" +
        "Get started: https://valet.example.com/login?role=staff&login=kai%40example.com\n\n" +
        "Sign in with this email address: kai@example.com\n",
    )
    expect(content.html).toContain(
      '<a href="https://valet.example.com/login?role=staff&amp;login=kai%40example.com">Get started</a>',
    )
  })
})

describe("invoiceEmail", () => {
  const content = invoiceEmail({
    company: "Regency Parking Service",
    number: "INV-2026-0142",
    venue: "The Grand <Hotel>",
    period: "Nov 1 – 15, 2026",
    totalCents: 481_250,
    due: "Dec 9, 2026",
  })

  it("is the owner's short summary (D47)", () => {
    expect(content.subject).toBe("Invoice INV-2026-0142 from Regency Parking Service")
    expect(content.text).toBe(
      "Hello,\n\n" +
        "Attached is invoice INV-2026-0142 for The Grand <Hotel>, Nov 1 – 15, 2026.\n\n" +
        "Total due: $4,812.50\nDue: Dec 9, 2026\n\n" +
        "Reply to this email with any questions.\n\n" +
        "Regency Parking Service\n",
    )
  })

  it("escapes everything it puts in the HTML", () => {
    expect(content.html).toContain("The Grand &lt;Hotel&gt;")
    expect(content.html).not.toContain("<Hotel>")
    expect(escapeHtml(`a&b"c'd`)).toBe("a&amp;b&quot;c&#39;d")
  })
})

describe("sendRequest", () => {
  it("posts JSON with the key, a User-Agent, and only the fields that are set", () => {
    const request = sendRequest(CFG, { to: ["a@example.com"], subject: "S", text: "T", html: "H" })
    expect(request.url).toBe("https://api.resend.com/emails")
    expect(request.headers).toEqual({
      authorization: "Bearer re_test_key",
      "content-type": "application/json",
      "user-agent": "valet-workforce/1.0",
    })
    expect(JSON.parse(request.body)).toEqual({
      from: CFG.from,
      to: ["a@example.com"],
      subject: "S",
      text: "T",
      html: "H",
    })
  })

  it("adds copies, reply-to, attachments and the idempotency key when given", () => {
    const request = sendRequest(
      { ...CFG, replyTo: "office@example.com" },
      {
        to: ["a@example.com"],
        cc: ["b@example.com"],
        subject: "S",
        text: "T",
        html: "H",
        attachments: [{ filename: "INV-1.pdf", content: "JVBERi0=" }],
        idempotencyKey: "invite/1",
      },
    )
    expect(request.headers["idempotency-key"]).toBe("invite/1")
    expect(JSON.parse(request.body)).toMatchObject({
      cc: ["b@example.com"],
      reply_to: "office@example.com",
      attachments: [{ filename: "INV-1.pdf", content: "JVBERi0=" }],
    })
  })
})

describe("parseSendResponse", () => {
  it("reads the email's id", () => {
    expect(parseSendResponse(200, { id: "abc" })).toEqual({ ok: true, id: "abc" })
  })

  it("reads Resend's error message, or says what came back", () => {
    expect(
      parseSendResponse(403, {
        statusCode: 403,
        name: "validation_error",
        message: "The regency.io domain is not verified.",
      }),
    ).toEqual({ ok: false, status: 403, message: "The regency.io domain is not verified." })
    expect(parseSendResponse(500, null)).toEqual({
      ok: false,
      status: 500,
      message: "Resend responded 500",
    })
    expect(parseSendResponse(200, {})).toMatchObject({ ok: false })
  })
})

describe("sendEmail", () => {
  const email = { to: ["a@example.com"], subject: "S", text: "T", html: "H" }

  it("returns the result instead of throwing when the network fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"))
    expect(await sendEmail(CFG, email, fetcher)).toEqual({
      ok: false,
      status: null,
      message: "offline",
    })
  })

  it("posts the request and parses the answer", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: "abc" }))
    expect(await sendEmail(CFG, email, fetcher)).toEqual({ ok: true, id: "abc" })
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    )
  })
})
