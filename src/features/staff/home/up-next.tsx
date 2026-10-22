"use client"

import { useRouter } from "next/navigation"

import { DateTile, FeatureCard, Icon } from "@/components/shared"
import { UP_NEXT } from "@/mocks/staff"

/** Right column of Home: upcoming shifts and the open-shifts promo. */
export function UpNext() {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-22 font-semibold tracking-n020">Up next</span>
          <button
            type="button"
            onClick={() => router.push("/staff/shifts")}
            className="border-0 bg-transparent py-2 text-15 font-semibold text-fg-2"
          >
            All shifts
          </button>
        </div>
        <div className="flex flex-col border-t border-line">
          {UP_NEXT.map((shift) => (
            <button
              key={shift.day}
              type="button"
              onClick={() => router.push("/staff/shifts/detail")}
              className="flex min-h-18 items-center gap-3.5 border-0 border-b border-line bg-transparent p-0 text-left text-fg"
            >
              <DateTile dow={shift.dow} day={shift.day} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-17 font-semibold">{shift.venue}</span>
                <span className="text-15 text-fg-2">{shift.time}</span>
              </div>
              <Icon name="chevron_right" size={24} />
            </button>
          ))}
        </div>
      </div>

      <FeatureCard
        overline="OPEN SHIFTS"
        title="4 shifts you can claim this week"
        body="Harbor Pavilion brunch, Maison Blanc Halloween gala and more. First to claim gets it."
        cta="See open shifts"
        onClick={() => router.push("/staff/open")}
      />
    </div>
  )
}
