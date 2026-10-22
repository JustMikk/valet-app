// Illustrative onboarding content from the design export (Staff Onboarding).
export const ONBOARDING_ORDER = [
  "invite",
  "signin",
  "code",
  "profile",
  "location",
  "install",
  "push",
  "done",
] as const
export type OnboardingStep = (typeof ONBOARDING_ORDER)[number] | "desktop"

export const ONBOARDING_INVITE = {
  company: "Regency Valet Parking",
  invitedBy: "Jamie Cole",
  /** The six digits the simulated email delivers. */
  code: "482913",
} as const

export type InstallOs = "ios" | "android"
export const INSTALL_STEPS = {
  ios: [
    { n: 1, icon: "ios_share", text: "Tap the Share button in Safari’s toolbar" },
    { n: 2, icon: "add_box", text: "Scroll and choose “Add to Home Screen”" },
    { n: 3, icon: "touch_app", text: "Open Regency from your Home Screen" },
  ],
  android: [
    { n: 1, icon: "more_vert", text: "Tap ⋮ in Chrome, or the Install banner" },
    { n: 2, icon: "install_mobile", text: "Choose “Install app”" },
    { n: 3, icon: "touch_app", text: "Open Regency from your Home Screen" },
  ],
} as const

export const LOCATION_PROMISES = [
  "One reading per clock-in and clock-out",
  "Seen only by Regency dispatch",
  "You can still browse shifts without it",
] as const
