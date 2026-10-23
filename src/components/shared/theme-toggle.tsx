"use client"

import { useThemeMode } from "@/lib/theme"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

/**
 * One round button that flips between light and dark: a moon in light mode (go dark), a sun in dark
 * mode (go light). The icon follows the page's theme in CSS, so it is right on first paint; the
 * choice is saved on this browser and applied at once.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setPreference } = useThemeMode()
  const flip = () => {
    const current = document.documentElement.getAttribute("data-theme")
    setPreference(current === "dark" ? "light" : "dark")
  }

  return (
    <button
      type="button"
      aria-label="Switch between light and dark mode"
      onClick={flip}
      className={cn(
        "grid size-11 flex-none place-items-center rounded-pill border-0 bg-surface text-fg transition-transform duration-160 active:scale-94",
        className,
      )}
    >
      <Icon name="dark_mode" filled size={22} className="dark:hidden" />
      <Icon name="light_mode" filled size={22} className="hidden dark:block" />
    </button>
  )
}
