"use client"

import type { ComponentProps, ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

import { Icon, PageContainer, PageTitle } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { useTopBarSlot } from "./top-bar"

/**
 * Admin page column: up to 1160 px, 22 px rhythm (Admin Pages "page"), starting at the left edge
 * with the top bar's 32 px inset, like the Live Board.
 */
export function AdminPage({ className, ...props }: ComponentProps<typeof PageContainer>) {
  return (
    <PageContainer
      className={cn("mx-0 max-w-290 gap-5.5 tablet:px-8 desktop:px-8", className)}
      {...props}
    />
  )
}

type AdminHeadProps = {
  title: string
  /** One-line summary under the title. */
  sub?: string
  cta?: { label: string; icon: IconName; onClick: () => void }
  /** "Invoices / INV-2026-0142": a link back to the section, then where you are. */
  crumb?: { label: string; href: string; current: string }
  /** Also draw the heading in the page on phone (default). Off when the page has its own. */
  inline?: boolean
  /**
   * Controls for the top bar's right side, before the action (e.g. the Events filters, like
   * the Live Board's day chips). Tablet and up only: the page shows its own copy on phone.
   */
  tools?: ReactNode
}

function HeadCta({ cta }: { cta: NonNullable<AdminHeadProps["cta"]> }) {
  return (
    <Button
      variant="accent"
      size="sm"
      className="h-12 flex-none pr-5 pl-3.5 text-16"
      onClick={cta.onClick}
    >
      <Icon name={cta.icon} size={22} />
      {cta.label}
    </Button>
  )
}

/**
 * Page title, one-line summary and the page's one accent action. Tablet and desktop: drawn into
 * the shell's white top bar (common/top-bar); phone: inline at the top of the page.
 */
export function AdminHead({ title, sub, cta, crumb, inline = true, tools }: AdminHeadProps) {
  const slot = useTopBarSlot()
  return (
    <>
      {inline && (
        <div
          className={cn("flex flex-wrap items-end justify-between gap-4", slot && "tablet:hidden")}
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <PageTitle>{title}</PageTitle>
            {sub && <span className="text-16 text-fg-2">{sub}</span>}
          </div>
          {cta && <HeadCta cta={cta} />}
        </div>
      )}
      {slot &&
        createPortal(
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              {crumb && (
                <p className="m-0 text-13 text-fg-2">
                  <Link href={crumb.href} className="text-fg-2 no-underline hover:text-accent-text">
                    {crumb.label}
                  </Link>{" "}
                  / {crumb.current}
                </p>
              )}
              <h1 className="m-0 truncate font-display text-34 leading-x100 font-bold tracking-n030">
                {title}
              </h1>
              {sub && <span className="truncate text-14 text-fg-2">{sub}</span>}
            </div>
            {(tools || cta) && (
              <div className="flex flex-none items-center gap-4">
                {tools}
                {cta && <HeadCta cta={cta} />}
              </div>
            )}
          </div>,
          slot,
        )}
    </>
  )
}

/** Section heading inside a page (Prompt 600 / 20 px). */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 font-display text-20 font-semibold tracking-n015">{children}</h2>
}

/** Page width helper classes for the two-column detail layout and the 600 px form column. */
export const SPLIT = "grid items-start gap-8 desktop:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
export const FORM = "flex w-full max-w-150 flex-col gap-5"
export const CARD_GRID = "grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3"
