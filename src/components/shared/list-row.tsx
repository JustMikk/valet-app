import type { ReactNode } from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type ListRowProps = useRender.ComponentProps<"div"> & {
  /** Glyph or avatar before the label. */
  leading?: ReactNode
  /** Value, action or badge after the label. */
  trailing?: ReactNode
}

/**
 * Hairline-separated row (≥ 64 px): label / value / action. Pass `render` to make the whole
 * row a link or button.
 */
export function ListRow({
  leading,
  trailing,
  children,
  className,
  render,
  ...props
}: ListRowProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "box-content flex min-h-16 w-full items-center gap-3 border-0 border-b border-line bg-transparent p-0 text-left text-fg",
          className,
        ),
        children: (
          <>
            {leading}
            <span className="flex-1 text-17">{children}</span>
            {trailing}
          </>
        ),
      },
      props,
    ),
  })
}

/** Strong tabular value at the end of a row (times, counts). */
export function ListRowValue({ children }: { children: ReactNode }) {
  return <span className="text-17 font-semibold tabular-nums">{children}</span>
}

/** Secondary action label at the end of a row, optionally with a chevron. */
export function ListRowAction({
  children,
  chevron = false,
}: {
  children: ReactNode
  chevron?: boolean
}) {
  return (
    <span className="inline-flex items-center text-15 font-semibold text-fg-2">
      {children}
      {chevron && <Icon name="chevron_right" size={24} className="text-fg" />}
    </span>
  )
}
