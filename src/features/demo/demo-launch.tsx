"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { signInDemo } from "@/lib/data"
import type { Role } from "@/lib/data/api-client"

const APPS: { role: Role; href: string; title: string; note: string }[] = [
  { role: "staff", href: "/staff", title: "Staff app", note: "Signed in as the demo worker" },
  { role: "admin", href: "/admin", title: "Admin app", note: "Signed in as the demo dispatcher" },
]

/** One-tap entry to either app with the demo's built-in people (needs DEMO_MODE=1 on the server). */
export function DemoLaunch() {
  const router = useRouter()
  const [error, setError] = useState("")

  const open = async (app: (typeof APPS)[number]) => {
    setError("")
    try {
      await signInDemo(app.role)
      router.push(app.href)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open the demo.")
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="demo-apps">
      <h2 id="demo-apps" className="font-display text-20 font-semibold tracking-n015">
        Open the apps
      </h2>
      <div className="flex flex-col gap-2">
        {APPS.map((app) => (
          <Button
            key={app.role}
            variant="secondary"
            className="h-auto min-h-14 flex-col items-start gap-0.5 rounded-r16 px-4 py-2.5 text-left"
            onClick={() => void open(app)}
          >
            <span className="text-16 font-semibold">{app.title}</span>
            <span className="text-13 font-normal text-fg-2">{app.note}</span>
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="m-0 text-14 font-semibold text-warn">
          {error}
        </p>
      )}
    </section>
  )
}
