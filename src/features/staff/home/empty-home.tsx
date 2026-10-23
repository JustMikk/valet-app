"use client"

import { useRouter } from "next/navigation"

import { ActionButton, EmptyState, Icon } from "@/components/shared"
import type { Home } from "@/lib/data"

import { useProfile } from "../data/queries"

const STEPS = [
  {
    icon: "add_circle",
    title: "Claim an open shift",
    note: "First to claim gets it",
    to: "/staff/open",
  },
  {
    icon: "event_available",
    title: "Get assigned by dispatch",
    note: "Assigned shifts show up here",
    to: "/staff/inbox",
  },
  {
    icon: "chat_bubble",
    title: "Message dispatch",
    note: "Ask about work or availability",
    to: "/staff/inbox",
  },
] as const

/** Home for someone with no shifts yet (a new hire): a welcome, what to do first, no blank page. */
export function EmptyHome({ open }: { open: Home["open"] }) {
  const router = useRouter()
  const first = useProfile().data?.name.split(" ")[0]

  return (
    <div className="mx-auto flex w-full max-w-130 flex-col gap-7">
      <EmptyState
        icon="event_available"
        title={first ? `Welcome, ${first}` : "Welcome"}
        action={
          <ActionButton
            variant="accent"
            size="cta"
            icon="add_circle"
            className="w-full"
            onClick={() => router.push("/staff/open")}
          >
            {open.count > 0
              ? `See ${open.count} open shift${open.count === 1 ? "" : "s"}`
              : "Check open shifts"}
          </ActionButton>
        }
      >
        You don&rsquo;t have any shifts yet. When you claim one or dispatch assigns you, it appears
        here with a clock-in button.
      </EmptyState>

      <div className="flex flex-col gap-2.5">
        <span className="font-display text-20 font-semibold tracking-n020">Getting started</span>
        <div className="flex flex-col border-t border-line">
          {STEPS.map((step) => (
            <button
              key={step.title}
              type="button"
              onClick={() => router.push(step.to)}
              className="flex min-h-18 items-center gap-3.5 border-0 border-b border-line bg-transparent p-0 text-left text-fg"
            >
              <span className="grid size-11 flex-none place-items-center rounded-pill bg-surface-2">
                <Icon name={step.icon} filled size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-16 font-semibold">{step.title}</span>
                <span className="text-14 text-fg-2">{step.note}</span>
              </span>
              <Icon name="chevron_right" size={24} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
