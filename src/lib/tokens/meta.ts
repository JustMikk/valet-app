// Documentation metadata for the color tokens in src/styles/tokens.css, in the order and with
// the roles of the Design System sheet (section 02). meta.test.ts keeps the values in sync.

export type ColorToken = {
  name: `--${string}`
  role: string
  light: string
  dark: string
}

export const COLOR_TOKENS: readonly ColorToken[] = [
  { name: "--bg", role: "Screen background", light: "#FFFFFF", dark: "#0A0A0B" },
  {
    name: "--surface",
    role: "Cards, fields, secondary buttons",
    light: "#F4F4F2",
    dark: "#18181A",
  },
  { name: "--surface-2", role: "Avatars, pressed states", light: "#E9E9E6", dark: "#252528" },
  { name: "--elev", role: "Floating pills, sheets", light: "#FFFFFF", dark: "#1E1E21" },
  { name: "--fg", role: "Primary text, strong buttons", light: "#0B0B0B", dark: "#F4F4F2" },
  { name: "--fg-2", role: "Secondary text", light: "#5E5E5B", dark: "#A6A6A1" },
  { name: "--fg-3", role: "Inactive tabs, expected", light: "#8E8E8A", dark: "#76766F" },
  { name: "--line", role: "Hairlines, dividers", light: "#E6E6E3", dark: "#2B2B2E" },
  { name: "--accent", role: "Primary action fill (tenant)", light: "#C9A24A", dark: "#D9B661" },
  { name: "--accent-ink", role: "Label on accent fill", light: "#1C1404", dark: "#1C1404" },
  { name: "--accent-soft", role: "Selected chip fill", light: "#F7EFDA", dark: "#2B2415" },
  { name: "--accent-text", role: "Accent as text", light: "#7F611A", dark: "#E6C77E" },
  { name: "--ok", role: "On site, verified", light: "#2A7F36", dark: "#62C46F" },
  { name: "--ok-soft", role: "Success fill", light: "#E5F3E1", dark: "#14261A" },
  { name: "--warn", role: "Late, flagged, overrun", light: "#B9480E", dark: "#FF8F57" },
  { name: "--warn-soft", role: "Warning fill", light: "#FCEDE2", dark: "#2E1B11" },
  { name: "--bad", role: "Short, missing, no-show", light: "#C02A20", dark: "#FF6E63" },
  { name: "--bad-soft", role: "Danger fill", light: "#FBE7E5", dark: "#311715" },
  { name: "--info", role: "Waiting for approval", light: "#1E5BC6", dark: "#82AEFF" },
  { name: "--info-soft", role: "Info fill", light: "#E6EDFA", dark: "#14203A" },
  { name: "--hero", role: "Feature card ground", light: "#0E0F12", dark: "#1E1E21" },
]
