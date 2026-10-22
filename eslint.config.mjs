import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Build handoff §7: strict types, no stray logging, no silenced checks.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // CONSTRAINTS.md "Device APIs": only src/lib/platform/** web providers touch device capabilities
  // (handoff §5.1), so they can be swapped for Capacitor plugins later.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/platform/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "indexedDB", message: "Use OfflineStore from @/lib/platform." },
        { name: "Notification", message: "Use PushProvider from @/lib/platform." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "navigator", property: "geolocation", message: "Use LocationProvider." },
        { object: "navigator", property: "mediaDevices", message: "Use CameraProvider." },
        { object: "navigator", property: "serviceWorker", message: "Use PushProvider." },
        { object: "window", property: "indexedDB", message: "Use OfflineStore." },
        { object: "window", property: "Notification", message: "Use PushProvider." },
      ],
    },
  },
  // CONSTRAINTS.md "Tokens only" and "Component size": no hard-coded colors outside the token
  // stylesheet, components stay small (handoff §7 styling + structure).
  {
    files: ["src/components/**/*.tsx", "src/features/**/*.{ts,tsx}", "src/app/**/*.tsx"],
    ignores: ["src/components/ui/**", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "Hard-coded color. Use a design token (bg-surface, text-fg-2, var(--accent)…).",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "Hard-coded color. Use a design token (bg-surface, text-fg-2, var(--accent)…).",
        },
        {
          selector: "Literal[value=/(rgba?|hsla?|oklch)\\(/]",
          message: "Hard-coded color function. Use a design token.",
        },
      ],
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  // Node scripts report through the console.
  {
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "coverage/**",
    ".agents/**",
    "skills/**",
    ".cc-history/**",
    ".mux/**",
    "docs/inputs/**",
    "designs/**",
    ".claude/**",
    "playwright-report/**",
    "test-results/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
