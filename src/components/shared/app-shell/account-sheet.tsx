"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"

import { Icon } from "../icon"
import { ResponsiveSheet } from "../responsive-sheet"
import { ThemeToggle } from "../theme-toggle"
import { useShellMenu } from "./menu-context"
import type { ShellAccount, ShellUser } from "./types"

const ROW =
  "flex h-15 w-full items-center gap-3 rounded-r16 border-0 bg-surface px-4 text-left text-16 font-semibold text-fg no-underline transition-transform duration-160 active:scale-98"

type AccountSheetProps = { user: ShellUser; account: ShellAccount }

/** Who is signed in, with Profile (where there is one), Switch account and Sign out. */
export function AccountSheet({ user, account }: AccountSheetProps) {
  const { accountOpen, setAccountOpen } = useShellMenu()
  const close = () => setAccountOpen(false)
  const run = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <ResponsiveSheet open={accountOpen} onOpenChange={setAccountOpen} title="Account" titleHidden>
      <div className="flex items-center gap-3.5 pb-1">
        <span
          aria-hidden="true"
          className="grid size-14 flex-none place-items-center rounded-pill bg-surface-2 text-18 font-semibold"
        >
          {user.initials}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-18 font-semibold">{user.name}</span>
          <span className="text-14 text-fg-2">{user.role}</span>
        </span>
        <ThemeToggle className="ml-auto" />
      </div>
      <div className="flex flex-col gap-2">
        {user.href && (
          <Link href={user.href} onClick={close} className={ROW}>
            <Icon name="person" filled size={22} />
            Profile
          </Link>
        )}
        <button type="button" onClick={run(account.onSwitch)} className={ROW}>
          <Icon name="group" filled size={22} />
          Switch account
        </button>
        <button type="button" onClick={run(account.onSignOut)} className={cn(ROW, "text-bad")}>
          <Icon name="logout" size={22} />
          Sign out
        </button>
      </div>
    </ResponsiveSheet>
  )
}
