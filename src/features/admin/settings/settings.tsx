"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { GlassCard, ToggleSwitch } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { signOut, type Settings as SettingsData } from "@/lib/data"
import { ACCENT_OPTIONS, useTenantAccent } from "@/lib/tenant"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, SectionTitle, SPLIT } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useSettings, useUpdateSettings } from "../data/queries"
import { BRAND_CREST } from "@/lib/brand"

const ROW = "box-content flex min-h-16.5 w-full items-center gap-3 border-0 border-b border-line"

type ToggleKey = "selfie" | "earlyOut"

/** The clock-in rules: three values the tenant has set, and two switches it can flip here. */
function ruleRows(rules: SettingsData["rules"]) {
  return [
    {
      label: "Clock-in window",
      note: "How early staff can clock in",
      value: `${rules.windowMin} min before`,
    },
    {
      label: "Default geofence",
      note: "New venues start with this radius",
      value: `${rules.radiusM} m`,
    },
    {
      label: "Location accuracy needed",
      note: "Readings looser than this retry",
      value: `±${rules.accuracyM} m`,
    },
    {
      label: "Selfie at clock-in",
      note: "Front camera photo with each clock-in",
      toggle: "selfie" as const,
    },
    {
      label: "Flag early clock-outs",
      note: "More than 30 min before scheduled end",
      toggle: "earlyOut" as const,
    },
  ]
}

/** Tenant settings: logo, accent color (recolors the app live) and clock-in rules. */
export function Settings() {
  const settings = useSettings()
  return (
    <AdminPage>
      <QueryState query={settings} rows={4}>
        {(data) => <SettingsBody settings={data} />}
      </QueryState>
    </AdminPage>
  )
}

function SettingsBody({ settings }: { settings: SettingsData }) {
  const { accent, setAccent } = useTenantAccent()
  const router = useRouter()
  const update = useUpdateSettings()

  const pickAccent = (hex: string) => {
    setAccent(hex)
    update.mutate({ accent: hex })
  }
  const flip = (key: ToggleKey) => update.mutate({ rules: { [key]: !settings.rules[key] } })

  return (
    <>
      <AdminHead title="Settings" sub={settings.company} />
      {update.error && <ErrorNotice message={update.error.message} />}
      <div className={SPLIT}>
        <section className="flex flex-col gap-3">
          <SectionTitle>Branding</SectionTitle>
          <GlassCard className="flex items-center gap-4 p-4">
            <div className="grid size-18 flex-none place-items-center rounded-r18 bg-white shadow-[inset_0_0_0_1px_var(--line)]">
              <Image
                src={BRAND_CREST.src}
                alt=""
                width={BRAND_CREST.width}
                height={BRAND_CREST.height}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-16 font-semibold">{settings.company}</span>
              <span className="text-13 text-fg-2">Logo shows in the staff app and on invoices</span>
            </div>
            <Button variant="secondary" size="xs" className="px-3.5">
              Replace
            </Button>
          </GlassCard>
          <div role="radiogroup" aria-label="Accent color" className="flex flex-col gap-2">
            <span className="text-15 font-medium">Accent color</span>
            <div className="flex gap-2.5">
              {ACCENT_OPTIONS.map((option) => {
                const on = option.hex.toLowerCase() === accent.toLowerCase()
                return (
                  <button
                    key={option.hex}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={option.name}
                    onClick={() => pickAccent(option.hex)}
                    // The swatch shows the tenant's candidate color itself.
                    style={{ backgroundColor: option.hex }}
                    className={cn(
                      "size-12 rounded-pill border-0 transition-shadow duration-200",
                      on
                        ? "shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--fg)]"
                        : "shadow-[inset_0_0_0_1px_var(--line)]",
                    )}
                  />
                )
              })}
            </div>
            <span className="text-13 text-fg-2">
              Used only for primary buttons. Status colors never change.
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <SectionTitle>Clock-in rules</SectionTitle>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {ruleRows(settings.rules).map((rule) => (
              <li key={rule.label}>
                {rule.toggle ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.rules[rule.toggle]}
                    onClick={() => rule.toggle && flip(rule.toggle)}
                    className={cn(ROW, "bg-transparent p-0 text-left text-fg")}
                  >
                    <RuleText label={rule.label} note={rule.note} />
                    <ToggleSwitch on={settings.rules[rule.toggle]} />
                  </button>
                ) : (
                  <div className={ROW}>
                    <RuleText label={rule.label} note={rule.note} />
                    <span className="text-15 font-semibold text-fg-2">{rule.value}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
        <Button
          variant="ghost"
          className="h-13 text-16 shadow-[inset_0_0_0_1.5px_var(--line)]"
          onClick={() => {
            signOut("admin")
            router.push("/")
          }}
        >
          Sign out
        </Button>
      </div>
    </>
  )
}

function RuleText({ label, note }: { label: string; note: string }) {
  return (
    <span className="flex flex-1 flex-col gap-0.5">
      <span className="text-16 font-medium">{label}</span>
      <span className="text-13 text-fg-2">{note}</span>
    </span>
  )
}
