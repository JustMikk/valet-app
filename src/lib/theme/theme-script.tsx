import { themeScript } from "./theme"

/**
 * Sets data-theme before first paint. Render as the first child of <body> and put
 * suppressHydrationWarning on <html>, whose data-theme the script changes before hydration.
 */
export function ThemeScript() {
  // Safe: a constant string built from literals in theme.ts.
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}
