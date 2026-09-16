"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_RESEND_MESSAGE } from "@/lib/auth/errors"

// App-wide sign-out. Clears the Supabase session cookies and returns the user
// to the sign-in screen. Usable from any surface via <SignOutButton />.
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Resend the sign-up confirmation email. Always resolves to the same generic
// message regardless of outcome, so it cannot be used to probe which addresses
// have accounts. Technical failures are logged server-side only.
export async function resendConfirmation(email: string): Promise<{ message: string }> {
  const normalized = typeof email === "string" ? email.trim() : ""
  if (!normalized) {
    return { message: GENERIC_RESEND_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const emailRedirectTo = await resolveEmailRedirect()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalized,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
    })
    if (error) {
      console.error("[v0] resendConfirmation failed:", error.message)
    }
  } catch (error) {
    console.error("[v0] resendConfirmation threw:", (error as Error).message)
  }

  return { message: GENERIC_RESEND_MESSAGE }
}

// Mirrors the redirect target used at sign-up: the configured dev proxy URL if
// present, otherwise the current request origin's /auth/callback.
async function resolveEmailRedirect(): Promise<string | undefined> {
  const configured = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  if (configured) {
    return configured
  }
  const headerList = await headers()
  const origin = headerList.get("origin")
  const host = headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  const base = origin ?? (host ? `${proto}://${host}` : null)
  return base ? `${base}/auth/callback` : undefined
}
