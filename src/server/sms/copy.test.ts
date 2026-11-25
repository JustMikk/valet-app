// @vitest-environment node
import { describe, expect, it } from "vitest"

import { brandOf, isGsm7, SMS_SEGMENT, smsText, toGsm7 } from "./copy"

const link = "https://valet.example.com/staff/shifts"

describe("the approved texts (docs/specs/sms.md)", () => {
  it("invites with the admin, the company, the link and the STOP line", () => {
    expect(
      smsText({
        kind: "invite",
        adminFirst: "Jamie",
        tenant: "Regency Valet Parking",
        link: "https://valet.example.com/login?role=staff&login=%2B17135550144",
      }),
    ).toBe(
      "Jamie at Regency Valet Parking invited you to join their valet crew. Get started: https://valet.example.com/login?role=staff&login=%2B17135550144 Reply STOP to opt out.",
    )
  })

  it("reminds a day ahead with where and when", () => {
    expect(
      smsText({
        kind: "reminder24",
        brand: "Regency",
        title: "The Grand Hotel",
        day: "tomorrow",
        range: "6:00 – 11:00 PM",
        address: "400 Market St, San Francisco",
        link,
      }),
    ).toBe(
      `Regency: Reminder, you're working The Grand Hotel tomorrow, 6:00 - 11:00 PM. 400 Market St, San Francisco ${link}`,
    )
  })

  it("reminds an hour ahead with the start and when clock-in opens", () => {
    expect(
      smsText({
        kind: "reminder1",
        brand: "Regency",
        title: "The Grand Hotel",
        start: "6:00 PM",
        opens: "5:45 PM",
        link,
      }),
    ).toBe(
      `Regency: Your shift at The Grand Hotel starts at 6:00 PM. Clock-in opens 5:45 PM. ${link}`,
    )
  })

  it("tells of a cancellation, an assignment, a new time and a removal", () => {
    const shift = { brand: "Regency", title: "The Grand Hotel", date: "Sat, Oct 24", link }
    expect(smsText({ kind: "cancelled", ...shift })).toBe(
      `Regency: Your shift at The Grand Hotel on Sat, Oct 24 was cancelled. ${link}`,
    )
    expect(smsText({ kind: "assigned", ...shift, range: "4:00 – 11:30 PM" })).toBe(
      `Regency: You're assigned to The Grand Hotel, Sat, Oct 24 4:00 - 11:30 PM. ${link}`,
    )
    expect(smsText({ kind: "rescheduled", ...shift, range: "5:00 – 11:30 PM" })).toBe(
      `Regency: The Grand Hotel has a new time: Sat, Oct 24 5:00 - 11:30 PM. ${link}`,
    )
    expect(smsText({ kind: "removed", ...shift })).toBe(
      `Regency: You were removed from The Grand Hotel on Sat, Oct 24. Questions? Reply in the app. ${link}`,
    )
  })
})

describe("staying in one plain-text segment", () => {
  it("writes typographic characters the way GSM-7 can carry them", () => {
    // Intl puts a narrow no-break space before PM; ranges use an en dash.
    expect(toGsm7("6:00 PM – 11:00 PM · Grand’s “gala”…")).toBe(
      `6:00 PM - 11:00 PM - Grand's "gala"...`,
    )
    expect(isGsm7(toGsm7("6:00 PM – 11:00 PM"))).toBe(true)
    expect(isGsm7("Ana Kovač")).toBe(false)
  })

  it("normalises the event details it is given", () => {
    const text = smsText({
      kind: "cancelled",
      brand: "Regency",
      title: "Grand’s Gala",
      date: "Sat, Oct 24",
      link,
    })
    expect(isGsm7(text)).toBe(true)
    expect(text).toContain("Grand's Gala on Sat, Oct 24")
  })

  it("keeps a real event name whole in one segment with the short link", () => {
    const short = "https://valet-app-gy1k.vercel.app/s?i=707f8150-0caa-47d4-a29c-fe796f77da20"
    const text = smsText({
      kind: "rescheduled",
      brand: "Regency",
      title: "Hilton Americas-Houston · ff",
      date: "Fri Nov 27",
      range: "10:00 AM – 3:00 PM",
      link: short,
    })
    expect(text).toBe(
      `Regency: Hilton Americas-Houston - ff has a new time: Fri Nov 27 10:00 AM - 3:00 PM. ${short}`,
    )
    expect(text.length).toBeLessThanOrEqual(SMS_SEGMENT)
  })

  it("shortens a shift text's details to fit one segment, and never shortens an invite", () => {
    const long = "The Extraordinarily Long Annual Charity Gala Dinner And Silent Auction Evening"
    const reminder = smsText({
      kind: "reminder24",
      brand: "Regency",
      title: long,
      day: "tomorrow",
      range: "6:00 – 11:00 PM",
      address: "Westfield Centre, Level 4, 865 Market Street, San Francisco, CA 94103",
      link,
    })
    expect(reminder.length).toBeLessThanOrEqual(SMS_SEGMENT)
    expect(reminder.endsWith(` ${link}`)).toBe(true)
    expect(reminder).toContain("...")

    const invite = smsText({
      kind: "invite",
      adminFirst: "Jamie",
      tenant: "Regency Valet Parking and Concierge Services of Greater San Francisco Bay Area",
      link: "https://valet.example.com/login?role=staff&login=%2B17135550144",
    })
    // An invite may take two segments rather than cut the company's name.
    expect(invite).toContain(
      "Regency Valet Parking and Concierge Services of Greater San Francisco Bay Area",
    )
    expect(invite.endsWith(" Reply STOP to opt out.")).toBe(true)
    expect(invite).toContain("https://valet.example.com/login?role=staff&login=%2B17135550144")
  })
})

describe("brandOf", () => {
  it("is the first word of the company's name", () => {
    expect(brandOf("Regency Valet Parking")).toBe("Regency")
    expect(brandOf("  Acme  ")).toBe("Acme")
  })
})
