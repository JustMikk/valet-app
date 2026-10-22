"use client"

import { useState } from "react"
import Image from "next/image"

import { GlassCard, ToggleSwitch } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { ACCENT_OPTIONS, useTenantAccent } from "@/lib/tenant"
import { cn } from "@/lib/utils"
import { ADMIN_USER, CLOCK_RULES, type ClockRuleKey } from "@/mocks/admin"

import { AdminHead, AdminPage, SectionTitle, SPLIT } from "../common/admin-page"

const ROW = "box-content flex min-h-16.5 w-full items-center gap-3 border-0 border-b border-line"

/** Tenant settings: logo, accent color (recolors the app live) and clock-in rules. */
export function Settings() {
  const { accent, setAccent } = useTenantAccent()
  const [rules, setRules] = useState<Record<ClockRuleKey, boolean>>({ selfie: true, early: true })

  return (
    <AdminPage>
      <AdminHead title="Settings" sub={ADMIN_USER.company} />
      <div className={SPLIT}>
        <section className="flex flex-col gap-3">
          <SectionTitle>Branding</SectionTitle>
          <GlassCard className="flex items-center gap-4 p-4">
            <div className="grid size-18 flex-none place-items-center rounded-r18 bg-white shadow-[inset_0_0_0_1px_var(--line)]">
              <Image
                src="/brand/regency-logo.png"
                alt=""
                width={60}
                height={34}
                className="h-auto w-15"
              />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-16 font-semibold">{ADMIN_USER.company}</span>
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
                const on = option.hex === accent
                return (
                  <button
                    key={option.hex}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={option.name}
                    onClick={() => setAccent(option.hex)}
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
            {CLOCK_RULES.map((rule) => (
              <li key={rule.label}>
                {rule.toggle ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rules[rule.toggle]}
                    onClick={() =>
                      rule.toggle &&
                      setRules((r) => ({
                        ...r,
                        [rule.toggle as ClockRuleKey]: !r[rule.toggle as ClockRuleKey],
                      }))
                    }
                    className={cn(ROW, "bg-transparent p-0 text-left text-fg")}
                  >
                    <RuleText label={rule.label} note={rule.note} />
                    <ToggleSwitch on={rules[rule.toggle]} />
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
      </div>
    </AdminPage>
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
