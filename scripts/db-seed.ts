// Resets the demo database to a scenario: tsx --env-file=.env.local scripts/db-seed.ts [before|due|onshift]
// The same code runs behind POST /api/demo/reset.
import { SCENARIOS } from "../src/server/demo/fixtures"
import { resetDemo } from "../src/server/demo/reset"

async function main() {
  const arg = process.argv[2] ?? "due"
  const scenario = SCENARIOS.find((candidate) => candidate === arg)
  if (!scenario) {
    console.error(`Unknown scenario "${arg}". Use one of: ${SCENARIOS.join(", ")}.`)
    process.exit(2)
  }
  await resetDemo(scenario)
  console.log(`Demo data reset (${scenario}).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
