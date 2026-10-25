import { Suspense } from "react"

import { LoginForm } from "@/features/auth"

export const metadata = { title: "Sign in · Valet Workforce" }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
