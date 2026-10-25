"use client"

import { useRouter } from "next/navigation"

import { Countdown, DateTile, FeatureCard, Icon } from "@/components/shared"
import type { Home } from "@/lib/data"

/** Right column of Home: upcoming shifts and the open-shifts promo. */
export function UpNext({ upNext, open }: { upNext: Home["upNext"]; open: Home["open"] }) {
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
          {upNext.map((shift) => (
            <button
              key={shift.assignmentId}
              type="button"
              onClick={() => router.push(`/staff/shifts/detail?id=${shift.assignmentId}`)}
              className="flex min-h-18 items-center gap-3.5 border-0 border-b border-line bg-transparent p-0 text-left text-fg"
            >
              <DateTile dow={shift.dow} day={shift.day} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-17 font-semibold">{shift.venue}</span>
                <span className="text-15 text-fg-2">{shift.time}</span>
                <Countdown startsAt={shift.startsAt} endsAt={shift.endsAt} className="text-13" />
              </div>
              <Icon name="chevron_right" size={24} />
            </button>
          ))}
        </div>
      </div>

      {open.count > 0 && (
        <FeatureCard
          overline="OPEN SHIFTS"
          title={`${open.count} shift${open.count === 1 ? "" : "s"} you can claim this week`}
          body={`${open.titles.length > 1 ? `${open.titles.join(", ")} and more` : open.titles.join("")}. First to claim gets it.`}
          cta="See open shifts"
          onClick={() => router.push("/staff/open")}
        />
      )}
    </div>
  )
}
