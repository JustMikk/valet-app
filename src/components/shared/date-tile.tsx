import { cn } from "@/lib/utils"

type DateTileProps = {
  /** Weekday, upper case: "SAT". */
  dow: string
  /** Day of month: "24". */
  day: string
  className?: string
}

/** 52 px date tile used in "Up next" and event lists. */
export function DateTile({ dow, day, className }: DateTileProps) {
  return (
    <div
      className={cn(
        "flex size-13 flex-none flex-col items-center justify-center rounded-r16 bg-surface",
        className,
      )}
    >
      <span className="text-11 font-semibold tracking-p040 text-fg-2">{dow}</span>
      <span className="font-display text-20 leading-x100 font-bold">{day}</span>
    </div>
  )
}
