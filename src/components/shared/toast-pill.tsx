import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type ToastPillProps = {
  /** The confirmation text; nothing renders while null. */
  message: string | null
  /** `top` floats under the phone status area; `bottom` is centered for wide screens. */
  placement?: "top" | "bottom"
  className?: string
}

/** Confirmation pill (Live Board toast): strong fill, check glyph, announced politely. */
export function ToastPill({ message, placement = "top", className }: ToastPillProps) {
  return (
    // The live region stays mounted so assistive tech announces each new message.
    <div role="status" aria-live="polite" className="contents">
      {message && (
        <div
          className={cn(
            "pointer-events-none absolute z-50 flex min-h-13 items-center justify-center gap-2 rounded-pill bg-fg px-4.5 text-15 font-semibold text-bg shadow-dialog",
            placement === "top"
              ? "inset-x-5 top-[calc(var(--safe-top)+60px)] animate-sheet-up"
              : "bottom-7 left-1/2 min-h-12 -translate-x-1/2 animate-fade px-5",
            className,
          )}
        >
          <Icon name="check_circle" filled size={20} />
          {message}
        </div>
      )}
    </div>
  )
}
