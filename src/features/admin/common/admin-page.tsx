import type { ComponentProps, ReactNode } from "react"

import { Icon, PageContainer, PageTitle } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

/** Admin page column: 1160 px wide, 22 px rhythm (Admin Pages "page"). */
export function AdminPage({ className, ...props }: ComponentProps<typeof PageContainer>) {
  return <PageContainer className={cn("max-w-290 gap-5.5", className)} {...props} />
}

type AdminHeadProps = {
  title: string
  sub: string
  cta?: { label: string; icon: IconName; onClick: () => void }
}

/** Page title, one-line summary and the page's one accent action. */
export function AdminHead({ title, sub, cta }: AdminHeadProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <PageTitle>{title}</PageTitle>
        <span className="text-16 text-fg-2">{sub}</span>
      </div>
      {cta && (
        <Button
          variant="accent"
          size="sm"
          className="h-12 flex-none pr-5 pl-3.5 text-16"
          onClick={cta.onClick}
        >
          <Icon name={cta.icon} size={22} />
          {cta.label}
        </Button>
      )}
    </div>
  )
}

/** Section heading inside a page (Bricolage 600 / 20 px). */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 font-display text-20 font-semibold tracking-n015">{children}</h2>
}

/** Page width helper classes for the two-column detail layout and the 600 px form column. */
export const SPLIT = "grid items-start gap-8 desktop:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
export const FORM = "flex w-full max-w-150 flex-col gap-5"
export const CARD_GRID = "grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3"
