import { deriveAccentVars } from "@/lib/tenant"
import { COLOR_TOKENS, type ColorToken } from "@/lib/tokens/meta"

import { Mono, SectionTitle, SheetPanel } from "./primitives"

// Tokens the tenant accent overrides; their swatches follow the current accent.
const ACCENT_KEYS = new Set(["--accent", "--accent-ink", "--accent-soft", "--accent-text"])

function valuesFor(token: ColorToken, accent: string): { light: string; dark: string } {
  if (!ACCENT_KEYS.has(token.name)) return { light: token.light, dark: token.dark }
  const key = token.name as keyof ReturnType<typeof deriveAccentVars>
  return {
    light: deriveAccentVars(accent, "light")[key],
    dark: deriveAccentVars(accent, "dark")[key],
  }
}

/** Section 02 — every color token, light half left, dark half right. */
export function SectionTokens({ accent }: { accent: string }) {
  return (
    <section className="flex flex-col gap-6">
      <SectionTitle>02 — COLOR TOKENS</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        {COLOR_TOKENS.map((token) => {
          const { light, dark } = valuesFor(token, accent)
          return (
            <SheetPanel key={token.name} className="flex-row items-center gap-3.5 rounded-r16 p-3">
              <div className="flex shrink-0 overflow-hidden rounded-r10 shadow-[var(--swatch-pair-edge)]">
                {/* Swatches render the token values themselves. */}
                <div className="h-11 w-7" style={{ backgroundColor: light }} />
                <div className="h-11 w-7" style={{ backgroundColor: dark }} />
              </div>
              <div className="flex min-w-0 flex-col gap-0.75">
                <span className="font-mono text-13 leading-x120 font-semibold">{token.name}</span>
                <span className="text-13 leading-x130 text-fg-2">{token.role}</span>
                <span className="font-mono text-11 leading-x120 font-medium text-fg-3">
                  {light} / {dark}
                </span>
              </div>
            </SheetPanel>
          )
        })}
      </div>
      <p className="m-0 text-14 leading-x150 text-fg-2">
        Left half = light, right half = dark. Status text tokens meet 4.5:1 on <Mono>--bg</Mono> and
        their own <Mono>-soft</Mono> fill. Accent text on light uses <Mono>--accent-text</Mono>;
        gold fills always carry <Mono>--accent-ink</Mono> labels.
      </p>
    </section>
  )
}
