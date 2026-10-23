"use client"

import { useThemeMode, type ThemePreference } from "@/lib/theme"

import { PillTabs } from "./pill-tabs"

const ITEMS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

/** Light, dark, or follow the device: saved on this browser and applied at once. */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useThemeMode()
  return (
    <PillTabs
      label="Appearance"
      items={ITEMS}
      value={preference}
      onValueChange={setPreference}
      className={className}
    />
  )
}
