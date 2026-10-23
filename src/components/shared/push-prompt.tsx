import { Button } from "@/components/ui/button"

import { Icon } from "./icon"

export type PushPromptStatus = "unavailable" | "unconfigured" | "blocked" | "off" | "on"

type PushPromptProps = {
  status: PushPromptStatus
  busy?: boolean
  error?: string
  onEnable: () => void
  onDisable: () => void
}

/**
 * The device's push state in one row: the way to turn alerts on (or off) for this browser. Nothing
 * renders where push can't work (static build, unsupported browser, server without a key).
 */
export function PushPrompt({ status, busy, error, onEnable, onDisable }: PushPromptProps) {
  if (status === "unavailable" || status === "unconfigured") return null
  const on = status === "on"
  const blocked = status === "blocked"
  return (
    <div className="flex flex-col gap-2 rounded-r18 bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Icon name={on ? "notifications_active" : "notifications_off"} filled size={24} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-15 font-semibold">
            {on ? "Alerts are on for this device" : "Get alerts on this device"}
          </span>
          <span className="text-13 leading-x135 text-fg-2">
            {blocked
              ? "Notifications are blocked. Allow them for this site in your browser settings."
              : on
                ? "You’ll be notified even when the app is closed."
                : "Hear about new activity even when the app is closed."}
          </span>
        </span>
        {!blocked && (
          <Button
            variant={on ? "secondary" : "strong"}
            size="xs"
            disabled={busy}
            onClick={on ? onDisable : onEnable}
          >
            {on ? "Turn off" : "Turn on"}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 text-13 leading-x135 font-semibold text-warn">
          {error}
        </p>
      )}
    </div>
  )
}
