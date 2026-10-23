"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DATA_SOURCE } from "@/lib/data"
import { resetDemoData, type DemoScenario } from "@/lib/data/demo"

const SCENARIOS: { key: DemoScenario; label: string; note: string }[] = [
  { key: "before", label: "Before clock-in", note: "Shift starts in about 2 hours" },
  { key: "due", label: "Clock-in open", note: "Shift starts in 12 minutes" },
  { key: "onshift", label: "On the clock", note: "Clocked in over 2 hours ago" },
]

/** Reseeds the demo database for a scenario. Shown only when the app runs against the demo API. */
export function DemoControls() {
  const [state, setState] = useState<{ busy: DemoScenario | null; message: string }>({
    busy: null,
    message: "",
  })
  if (DATA_SOURCE !== "api") return null

  const reset = async (scenario: DemoScenario) => {
    setState({ busy: scenario, message: "" })
    try {
      await resetDemoData(scenario)
      setState({ busy: null, message: "Demo data reset. Open the staff app to see it." })
    } catch (error) {
      setState({
        busy: null,
        message: error instanceof Error ? error.message : "Couldn't reset the demo data.",
      })
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="demo-data">
      <h2 id="demo-data" className="font-display text-20 font-semibold tracking-n015">
        Demo data
      </h2>
      <div className="flex flex-col gap-2">
        {SCENARIOS.map((scenario) => (
          <Button
            key={scenario.key}
            variant="secondary"
            disabled={state.busy !== null}
            className="h-auto min-h-14 flex-col items-start gap-0.5 rounded-r16 px-4 py-2.5 text-left"
            onClick={() => void reset(scenario.key)}
          >
            <span className="text-16 font-semibold">{scenario.label}</span>
            <span className="text-13 font-normal text-fg-2">{scenario.note}</span>
          </Button>
        ))}
      </div>
      <p role="status" className="m-0 min-h-5 text-14 text-fg-2">
        {state.busy ? "Resetting…" : state.message}
      </p>
    </section>
  )
}
