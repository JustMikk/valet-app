import { AccentHex, DEFAULT_ACCENT, tenantThemeCss } from "./accent"

type TenantThemeProps = {
  /** Tenant accent as #RRGGBB. Validated; anything else throws. */
  accent: string
}

/**
 * Injects the tenant's accent variables for light and dark scopes. Components never read the
 * tenant: they use --accent* tokens, which this overrides. Rendered once near the root.
 */
export function TenantTheme({ accent }: TenantThemeProps) {
  const hex = AccentHex.parse(accent)
  if (hex === DEFAULT_ACCENT) return null
  // Safe: the CSS is generated only from a validated #RRGGBB value.
  return <style dangerouslySetInnerHTML={{ __html: tenantThemeCss(hex) }} />
}
