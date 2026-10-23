import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/shared"
import { Button } from "@/components/ui/button"

/** Public landing page: who this is for and where to sign in. */
export default function Home() {
  return (
    <div className="min-h-dvh bg-ambient">
      <main className="mx-auto flex min-h-dvh w-full max-w-130 flex-col justify-center gap-9 px-5 py-12">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/regency-logo.png"
            alt="Regency"
            width={90}
            height={50}
            className="h-12 w-auto"
          />
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-44 leading-x100 font-bold tracking-n040">
            Valet Workforce
          </h1>
          <p className="m-0 text-17 leading-x145 text-fg-2">
            Shifts, clock-in and dispatch for Regency Valet Parking.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Button
            variant="accent"
            size="xl"
            className="text-17"
            nativeButton={false}
            render={<Link href="/login?role=staff" />}
          >
            Staff sign in
          </Button>
          <Button
            variant="secondary"
            size="xl"
            className="text-17"
            nativeButton={false}
            render={<Link href="/login?role=admin" />}
          >
            Dispatch sign in
          </Button>
        </div>
      </main>
    </div>
  )
}
