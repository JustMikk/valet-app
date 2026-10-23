"use client"

import { useRouter } from "next/navigation"

import { Icon, PageContainer, ToggleSwitch } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { usePush } from "@/hooks/use-push"
import { clearSession, type StaffProfile } from "@/lib/data"
import type { IconName } from "@/lib/icons/icon-names"
import { useThemeMode, type ThemePreference } from "@/lib/theme"
import { NOTIFY_PREFS } from "@/mocks/staff"

import { QueryState } from "../data/query-state"
import { useProfile, useUpdateProfile } from "../data/queries"

type Permission = {
  icon: IconName
  label: string
  note: string
  on: boolean
  turnOn: () => void
}

const THEME_LABEL: Record<ThemePreference, string> = {
  system: "Match device",
  light: "Light",
  dark: "Dark",
}
const THEME_NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
}

const ROW = "flex items-center border-b border-line"

/** Profile: permission health, notification preferences, language, theme and sign out. */
export function Profile() {
  const profile = useProfile()
  return (
    <PageContainer className="max-w-280 tablet:pb-12 desktop:pb-12">
      <QueryState query={profile} rows={4}>
        {(data) => <ProfileBody profile={data} />}
      </QueryState>
    </PageContainer>
  )
}

function ProfileBody({ profile }: { profile: StaffProfile }) {
  const router = useRouter()
  const update = useUpdateProfile()
  const { preference, setPreference } = useThemeMode()

  const push = usePush("staff")

  const turnOn = (key: keyof StaffProfile["permissions"]) => () =>
    update.mutate({ permissions: { [key]: true } })
  /** The real browser permission and subscription where push works; the profile flag follows. */
  const turnOnPush = async () => {
    if (push.status === "unavailable" || push.status === "unconfigured") return turnOn("push")()
    const result = await push.enable.mutateAsync().catch(() => "off" as const)
    update.mutate({ permissions: { push: result === "on" } })
  }
  const p = profile.permissions
  const permissions: Permission[] = [
    {
      icon: "location_on",
      label: "Location",
      note: "Read only when you clock in or out",
      on: p.location,
      turnOn: turnOn("location"),
    },
    {
      icon: "photo_camera",
      label: "Camera",
      note: "Used for the clock-in selfie",
      on: p.camera,
      turnOn: turnOn("camera"),
    },
    p.push
      ? {
          icon: "notifications",
          label: "Notifications",
          note: "Shift alerts and messages",
          on: true,
          turnOn: turnOnPush,
        }
      : {
          icon: "notifications_off",
          label: "Notifications are off",
          note: "You may miss shift changes. There is no text backup.",
          on: false,
          turnOn: turnOnPush,
        },
    {
      icon: "install_mobile",
      label: "Installed on Home Screen",
      note: "Needed for alerts on iPhone",
      on: p.installed,
      turnOn: turnOn("installed"),
    },
  ]

  const signOut = () => {
    clearSession()
    router.push("/")
  }

  return (
    <div className="grid items-start gap-8 desktop:grid-cols-2">
      <div className="flex flex-col gap-5.5">
        <div className="flex items-center gap-4">
          <div className="grid size-18 place-items-center rounded-pill bg-surface-2 font-display text-24 font-bold">
            {profile.initials}
          </div>
          <div className="flex flex-col gap-0.75">
            <span className="font-display text-30 leading-x110 font-bold tracking-n030">
              {profile.name}
            </span>
            <span className="text-15 text-fg-2">
              {profile.email} · {profile.company}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-display text-20 font-semibold tracking-n015">Permissions</span>
          <div className="flex flex-col border-t border-line">
            {permissions.map((permission) => (
              <div key={permission.icon} className={`${ROW} box-content min-h-17 gap-3`}>
                <Icon name={permission.icon} filled size={24} className="text-fg-2" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-17 font-medium">{permission.label}</span>
                  <span className="text-13 text-fg-2">{permission.note}</span>
                </div>
                {permission.on ? (
                  <span className="inline-flex items-center gap-1 text-14 font-semibold text-ok">
                    <Icon name="check_circle" filled size={18} />
                    On
                  </span>
                ) : (
                  <Button
                    variant="accent"
                    size="xs"
                    className="h-10 px-4 text-15"
                    onClick={permission.turnOn}
                  >
                    Turn on
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-20 font-semibold tracking-n015">Notify me about</span>
          <div className="flex flex-col border-t border-line">
            {NOTIFY_PREFS.map((pref) => {
              const locked = "locked" in pref && pref.locked
              const on = locked ? true : profile.preferences[pref.key as "open" | "remind" | "msg"]
              return (
                <button
                  key={pref.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={locked}
                  onClick={() => update.mutate({ preferences: { [pref.key]: !on } })}
                  className={`${ROW} min-h-16 gap-3 border-0 border-b bg-transparent p-0 text-left text-fg`}
                >
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-17 font-medium">{pref.label}</span>
                    <span className="text-13 text-fg-2">{pref.note}</span>
                  </span>
                  <ToggleSwitch on={on} locked={locked} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col border-t border-line">
          <div className={`${ROW} box-content min-h-15`}>
            <span className="flex-1 text-17">Language</span>
            <span className="text-15 font-medium text-fg-2">English</span>
          </div>
          <button
            type="button"
            onClick={() => setPreference(THEME_NEXT[preference])}
            className={`${ROW} box-content min-h-15 border-0 border-b bg-transparent p-0 text-left text-fg`}
          >
            <span className="flex-1 text-17">Theme</span>
            <span className="text-15 font-medium text-fg-2">{THEME_LABEL[preference]}</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className={`${ROW} min-h-15 border-0 border-b bg-transparent p-0 text-left text-17 font-semibold text-bad`}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
