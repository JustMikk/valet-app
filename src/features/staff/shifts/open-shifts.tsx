"use client"

import { useRouter } from "next/navigation"

import { Countdown, EmptyState, Icon, PageContainer, PageTitle } from "@/components/shared"
import { useHydrated } from "@/hooks/use-hydrated"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ErrorNotice, QueryState } from "../data/query-state"
import { useClaim, useOpenShifts, useProfile } from "../data/queries"
import { useDemoParam } from "../session/use-demo-param"

/** Open shifts: first-come claims, spots left, overlap conflicts. */
export function OpenShifts() {
  const router = useRouter()
  const shifts = useOpenShifts()
  const claim = useClaim()
  const profile = useProfile().data
  const hydrated = useHydrated()
  // ?location=off previews the notice; otherwise it follows the worker's location permission.
  const locationOff =
    useDemoParam("location", ["off"] as const) === "off" ||
    (hydrated && profile?.permissions.location === false)

  const onClaim = (id: string) =>
    claim.mutate(id, {
      onSuccess: (result) => router.push(`/staff/shifts/result?r=${result.outcome}`),
    })

  return (
    <PageContainer className="max-w-280">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <PageTitle>Open shifts</PageTitle>
          <span className="text-16 text-fg-2">
            First to claim gets it. Claims are confirmed instantly.
          </span>
        </div>

        {locationOff && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-r18 bg-warn-soft px-4 py-3 text-14 leading-x140 font-semibold text-warn"
          >
            <Icon name="location_disabled" filled size={20} />
            Location is off. You can claim, but you won&apos;t be able to clock in until it&apos;s
            on.
          </div>
        )}
        {claim.error && <ErrorNotice message={claim.error.message} />}

        <QueryState query={shifts}>
          {(items) =>
            items.length === 0 ? (
              <EmptyState icon="add_circle" title="No open shifts right now">
                When dispatch posts spots to claim, they appear here and you get a notification.
              </EmptyState>
            ) : (
              <div className="grid gap-3 desktop:grid-cols-2">
                {items.map((shift, i) => (
                  <div
                    key={shift.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="flex animate-rise flex-col gap-3 rounded-card glass-card p-4.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-13 font-semibold tracking-p020 text-fg-2">
                        {shift.date}
                      </span>
                      <span
                        className={cn(
                          "ml-auto inline-flex h-6.5 items-center rounded-pill px-2.5 text-13 font-semibold",
                          shift.spots === 1 ? "bg-warn-soft text-warn" : "bg-surface-2 text-fg-2",
                        )}
                      >
                        {shift.spots} spot{shift.spots > 1 ? "s" : ""} left
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-22 leading-x120 font-semibold tracking-n020">
                        {shift.venue}
                      </span>
                      <span className="text-15 text-fg-2">{shift.time}</span>
                      <Countdown startsAt={shift.startsAt} endsAt={shift.endsAt} className="mt-1" />
                    </div>
                    {shift.conflict && (
                      <span className="flex items-center gap-1.5 text-14 font-semibold text-warn">
                        <Icon name="event_busy" filled size={18} loose />
                        {shift.conflict}
                      </span>
                    )}
                    <Button
                      variant={shift.conflict ? "secondary" : "accent"}
                      size="md"
                      disabled={claim.isPending}
                      className={cn("h-13 text-16", shift.conflict && "text-fg-3")}
                      onClick={() => onClaim(shift.id)}
                    >
                      {shift.conflict ? "Can’t claim · overlap" : "Claim shift"}
                    </Button>
                  </div>
                ))}
              </div>
            )
          }
        </QueryState>
      </div>
    </PageContainer>
  )
}
