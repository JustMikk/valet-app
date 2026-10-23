import Link from "next/link"

import { DemoControls } from "@/features/demo"

// Demo launcher until sign-in and role routing exist (Product Handoff 13.1 is undecided).
const ENTRIES = [
  { href: "/staff", title: "Staff app", note: "Valet attendants · phone first" },
  { href: "/staff/onboarding", title: "Staff onboarding", note: "Invite, sign-in, permissions" },
  { href: "/admin", title: "Admin app", note: "Dispatch · Live Board, events, hours" },
  { href: "/design-system", title: "Design system", note: "Tokens and components" },
] as const

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-130 flex-col justify-center gap-8 px-5 py-12 bg-ambient">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-40 leading-x100 font-bold tracking-n035">
          Valet Workforce
        </h1>
        <p className="text-16 text-fg-2">Regency Valet Parking · demo build</p>
      </div>
      <div className="flex flex-col border-t border-line">
        {ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="flex min-h-18 flex-col justify-center gap-0.5 border-b border-line text-fg"
          >
            <span className="text-17 font-semibold">{entry.title}</span>
            <span className="text-14 text-fg-2">{entry.note}</span>
          </Link>
        ))}
      </div>
      <DemoControls />
    </main>
  )
}
