"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import { ActionButton, HeroStat, Icon, PageContainer, StatusBadge } from "@/components/shared"
import { useNow } from "@/hooks/use-now"
import { staffRepo, type Home, type HomeShift } from "@/lib/data"
import { formatTime } from "@/lib/time/labels"
import type { ShiftMode } from "@/lib/time/shift-mode"

import { punchRequest } from "../clock/punch"
import { useDevice } from "../clock/use-device"
import { QueryState } from "../data/query-state"
import { useAfterPunch, useHome, useProfile } from "../data/queries"
import { useStaffSession } from "../session/staff-session"
import { useDemoParam } from "../session/use-demo-param"
import { ClockOutSheet } from "./clock-out-sheet"
import { EmptyHome } from "./empty-home"
import { BANNER_KEYS, HomeBanner } from "./home-banner"
import { buildHomeView } from "./home-view"
import { ShiftInfoRows } from "./shift-info-rows"
import { UpNext } from "./up-next"

const MODES = ["before", "due", "onshift"] as const satisfies readonly ShiftMode[]
/** Seconds already worked in the ?mode=onshift demo state (2:14:07). */
const DEMO_ELAPSED_SECS = 8047
/** How long to wait for a position at clock-out before sending the punch without one. */
const CLOCK_OUT_FIX_MS = 8000

/** Staff Home: the shift that matters now, the clock-in / clock-out CTA, what's next, open shifts. */
export function StaffHome() {
  const home = useHome()
  return (
    <PageContainer bottom="dock" className="max-w-190 desktop:max-w-280">
      <QueryState query={home}>
        {(data) =>
          data.shift ? (
            <HomeContent shift={data.shift} upNext={data.upNext} open={data.open} />
          ) : data.upNext.length === 0 ? (
            <EmptyHome open={data.open} />
          ) : (
            <UpNext upNext={data.upNext} open={data.open} />
          )
        }
      </QueryState>
    </PageContainer>
  )
}

type ContentProps = { shift: HomeShift; upNext: Home["upNext"]; open: Home["open"] }

function HomeContent({ shift, upNext, open }: ContentProps) {
  const router = useRouter()
  const session = useStaffSession()
  const profile = useProfile().data
  const afterPunch = useAfterPunch()
  const demoMode = useDemoParam("mode", MODES)
  const demoBanner = useDemoParam("banner", BANNER_KEYS)
  const device = useDevice(shift.venueGeo, "out")
  const [clockOutOpen, setClockOutOpen] = useState(false)
  const [demoClockedInAt] = useState(() => Date.now() - DEMO_ELAPSED_SECS * 1000)
  const now = useNow(1000)

  const view = buildHomeView(shift, now, {
    demoMode,
    pendingClockInAt: session.pendingClockInAt,
    demoClockedInAt,
  })

  const clockOut = useMutation({
    mutationFn: async () => {
      // One reading as the worker leaves. No fix never blocks leaving: it lands flagged instead.
      const outcome = await device.location.acquire({
        targetAccuracyM: shift.neededAccuracyM,
        timeoutMs: CLOCK_OUT_FIX_MS,
      })
      return staffRepo.clockOut(
        punchRequest({
          assignmentId: shift.assignmentId,
          location: outcome.ok ? outcome.fix : undefined,
          selfie: false,
        }),
      )
    },
    onSuccess: async (punch) => {
      await afterPunch(punch)
      setClockOutOpen(false)
      router.push("/staff/clock?step=outdone")
    },
  })

  const banner =
    demoBanner ??
    (session.syncPending
      ? "sync"
      : profile && !profile.permissions.push
        ? "push"
        : profile && !profile.permissions.installed
          ? "install"
          : null)
  const syncTime = formatTime(session.pendingClockInAt ?? now, shift.timezone)

  const cta =
    view.mode === "before" ? (
      <ActionButton
        size="cta"
        icon="lock_clock"
        disabled
        reason={view.ctaReason ?? undefined}
        className="w-full"
      >
        {view.ctaLabel}
      </ActionButton>
    ) : (
      <ActionButton
        variant="accent"
        size="cta"
        icon={view.mode === "due" ? "login" : "logout"}
        shine
        className="w-full shadow-cta"
        onClick={() => (view.mode === "due" ? router.push("/staff/clock") : setClockOutOpen(true))}
      >
        {view.ctaLabel}
      </ActionButton>
    )

  return (
    <>
      {banner && (
        <HomeBanner banner={banner} syncTime={syncTime} onOpen={(to) => router.push(to)} />
      )}

      <div className="grid items-start gap-8 desktop:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6 tablet:rounded-hero tablet:glass-card tablet:p-7">
          <div className="flex animate-rise flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={view.status} className="self-start" />
              <span className="text-14 font-medium text-fg-2">{view.sub}</span>
            </div>
            <HeroStat value={view.heroValue} size={60} />
            {view.inLine && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-16 text-fg-2">
                  <Icon name="north_east" size={20} className="text-ok" />
                  {view.inLine}
                </div>
                <div className="h-1.5 overflow-hidden rounded-r9 bg-surface-2">
                  <div
                    className="h-full rounded-r9 bg-fg-3-line transition-[width] duration-1000 ease-linear"
                    // Progress is a live percentage of the scheduled shift.
                    style={{ width: `${view.progress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="font-display text-26 leading-x115 font-semibold tracking-n020">
                {shift.venue}
              </span>
              <span className="text-16 leading-x140 text-fg-2">{view.when}</span>
            </div>
          </div>

          <div className="hidden flex-col gap-2 tablet:flex">{cta}</div>
          <ShiftInfoRows shift={shift} />
        </div>

        <UpNext upNext={upNext} open={open} />
      </div>

      <div className="absolute inset-x-5 bottom-28 z-15 flex flex-col gap-1.5 tablet:hidden">
        {cta}
      </div>

      <ClockOutSheet
        open={clockOutOpen}
        onOpenChange={setClockOutOpen}
        secs={view.secs}
        endLabel={shift.endLabel}
        busy={clockOut.isPending}
        error={clockOut.error?.message ?? null}
        onConfirm={() => clockOut.mutate()}
      />
    </>
  )
}
