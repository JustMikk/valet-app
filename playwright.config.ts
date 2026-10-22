import { defineConfig, devices } from "@playwright/test"

const PORT = 3100
// Pixel comparisons against the 1320 px design canvases run in the desktop project only.
const VISUAL_SPECS = /\.visual\.spec\.ts$/

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    {
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
      testIgnore: VISUAL_SPECS,
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } },
      testIgnore: VISUAL_SPECS,
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm dlx serve@14 out -l ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
