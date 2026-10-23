"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { PillTabs, TextField, ThemeToggle } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { signInAdmin, signInStaff } from "@/lib/data"
import type { Role } from "@/lib/data/api-client"

import { landingPath } from "./safe-next"

const ROLES = [
  { value: "staff" as const, label: "Staff" },
  { value: "admin" as const, label: "Dispatch" },
]

const COPY: Record<Role, string> = {
  staff: "Enter the email dispatch invited you with.",
  admin: "Enter your dispatcher email and password.",
}

/** Sign in: staff with their email alone, dispatchers with email and password. */
export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<Role>(params.get("role") === "admin" ? "admin" : "staff")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  const ready = email.trim() !== "" && (role === "staff" || password !== "")

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      if (role === "staff") await signInStaff(email.trim())
      else await signInAdmin(email.trim(), password)
      router.replace(landingPath(role, params.get("next")))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in. Try again.")
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-110 flex-col justify-center gap-7 px-5 py-12 bg-ambient">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Valet Workforce home">
          <Image
            src="/brand/regency-logo.png"
            alt="Regency"
            width={72}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-34 leading-x105 font-bold tracking-n030">Sign in</h1>
        <p className="m-0 text-16 text-fg-2">{COPY[role]}</p>
      </div>
      <PillTabs
        label="Sign in as"
        items={ROLES}
        value={role}
        onValueChange={(next) => {
          setRole(next)
          setError(undefined)
        }}
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (ready && !busy) void submit()
        }}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {role === "admin" && (
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="m-0 text-14 leading-x140 font-semibold text-warn">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" className="text-17" disabled={!ready || busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  )
}
