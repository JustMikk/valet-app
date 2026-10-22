"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { ActionButton, HeroStat, Icon, PageContainer, StatusBadge } from "@/components/shared"
import { useTicker } from "@/hooks/use-ticker"
import type { StatusSpec } from "@/lib/status/presets"
import { formatClock } from "@/lib/time/duration"
import { TONIGHT } from "@/mocks/staff"

import { useStaffSession, type StaffMode } from "../session/staff-session"
import { useDemoParam } from "../session/use-demo-param"
import { ClockOutSheet } from "./clock-out-sheet"
import { BANNER_KEYS, HomeBanner } from "./home-banner"
import { ShiftInfoRows } from "./shift-info-rows"
import { UpNext } from "./up-next"

const MODES = ["before", "due", "onshift"] as const satisfies readonly StaffMode[]

type HeroState = { status: StatusSpec; sub: string; when: string }

const HERO: Record<StaffMode, HeroState> = {
  due: {
    status: { tone: "strong", icon: "timer", filled: true, label: "Clock-in open" },
    sub: "Starts in 12 min",
    when: "Today, Fri Oct 23 · 6:00 – 11:00 PM · venue time (PT)",
  },
  before: {
    status: { tone: "muted", icon: "event", filled: true, label: "Today" },
    sub: "Clock-in opens 5:45 PM",
    when: TONIGHT.when,
  },
  onshift: {
    status: { tone: "ok", icon: "verified", filled: true, label: "On the clock" },
    sub: "Verified · 38 m from venue",
    when: "400 Market St · Fri Oct 23",
  },
}

/** Staff Home: tonight's shift, the clock-in / clock-out CTA, what's next and open shifts. */
export function StaffHome() {
  const router = useRouter()
  const session = useStaffSession()
  const demoMode = useDemoParam("mode", MODES)
  const demoBanner = useDemoParam("banner", BANNER_KEYS)
  const [clockOutOpen, setClockOutOpen] = useState(false)

  const mode = demoMode ?? session.mode
  const banner = demoBanner ?? session.banner ?? (session.pushOn ? null : "push")
  const demoSecs = useTicker(demoMode === "onshift", TONIGHT.demoElapsedSecs)
  const secs = demoMode === "onshift" ? demoSecs : session.secs

  const hero = HERO[mode]
  const progress = Math.min(100, (secs / TONIGHT.scheduledSecs) * 100)

  const cta =
    mode === "before" ? (
      <ActionButton
        size="cta"
        icon="lock_clock"
        disabled
        reason="Available 15 min before your shift starts"
        className="w-full"
      >
        Clock in opens 5:45 PM
      </ActionButton>
    ) : (
      <ActionButton
        variant="accent"
        size="cta"
        icon={mode === "due" ? "login" : "logout"}
        shine
        className="w-full shadow-cta"
        onClick={() => (mode === "due" ? router.push("/staff/clock") : setClockOutOpen(true))}
      >
        {mode === "due" ? "Clock in" : "Clock out"}
      </ActionButton>
    )

  return (
    <PageContainer bottom="dock" className="max-w-190 desktop:max-w-280">
      {banner && <HomeBanner banner={banner} onOpen={(to) => router.push(to)} />}

      <div className="grid items-start gap-8 desktop:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6 tablet:rounded-hero tablet:glass-card tablet:p-7">
          <div className="flex animate-rise flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={hero.status} className="self-start" />
              <span className="text-14 font-medium text-fg-2">{hero.sub}</span>
            </div>
            <HeroStat value={mode === "onshift" ? formatClock(secs) : "6:00 PM"} size={60} />
            {mode === "onshift" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-16 text-fg-2">
                  <Icon name="north_east" size={20} className="text-ok" />
                  In 5:51 PM · scheduled until 11:00 PM
                </div>
                <div className="h-1.5 overflow-hidden rounded-r9 bg-surface-2">
                  <div
                    className="h-full rounded-r9 bg-fg transition-[width] duration-1000 ease-linear"
                    // Progress is a live percentage of the scheduled shift.
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="font-display text-26 leading-x115 font-semibold tracking-n020">
                {TONIGHT.venue}
              </span>
              <span className="text-16 leading-x140 text-fg-2">{hero.when}</span>
            </div>
          </div>

          <div className="hidden flex-col gap-2 tablet:flex">{cta}</div>
          <ShiftInfoRows />
        </div>

        <UpNext />
      </div>

      <div className="absolute inset-x-5 bottom-28 z-15 flex flex-col gap-1.5 tablet:hidden">
        {cta}
      </div>

      <ClockOutSheet
        open={clockOutOpen}
        onOpenChange={setClockOutOpen}
        secs={secs}
        onConfirm={() => {
          setClockOutOpen(false)
          router.push(`/staff/clock?step=outdone&secs=${secs}`)
        }}
      />
    </PageContainer>
  )
}
