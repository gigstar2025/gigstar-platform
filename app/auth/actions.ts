"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_RESEND_MESSAGE, GENERIC_PASSWORD_RESET_MESSAGE } from "@/lib/auth/errors"

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

// Send a password-recovery email. Enumeration-safe: always resolves to the same
// generic message regardless of whether the address has an account. Technical
// failures are logged server-side only. The recovery link lands on
// /auth/callback (which exchanges the code for a session) and then forwards to
// /auth/update-password so the user can set a new password.
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const normalized = typeof email === "string" ? email.trim() : ""
  if (!normalized) {
    return { message: GENERIC_PASSWORD_RESET_MESSAGE }
  }

  try {
    const supabase = await createClient()
    const redirectTo = await resolveEmailRedirect("/auth/update-password")
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      ...(redirectTo ? { redirectTo } : {}),
    })
    if (error) {
      console.error("[v0] requestPasswordReset failed:", error.message)
    }
  } catch (error) {
    console.error("[v0] requestPasswordReset threw:", (error as Error).message)
  }

  return { message: GENERIC_PASSWORD_RESET_MESSAGE }
}

// Mirrors the redirect target used at sign-up: the configured dev proxy URL if
// present, otherwise the current request origin's /auth/callback. When `next`
// is supplied it is appended so the callback can forward there after a
// successful code exchange (used by the password-recovery flow).
async function resolveEmailRedirect(next?: string): Promise<string | undefined> {
  const configured = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  let base: string | null
  if (configured) {
    base = configured
  } else {
    const headerList = await headers()
    const origin = headerList.get("origin")
    const host = headerList.get("host")
    const proto = headerList.get("x-forwarded-proto") ?? "https"
    const requestBase = origin ?? (host ? `${proto}://${host}` : null)
    base = requestBase ? `${requestBase}/auth/callback` : null
  }

  if (!base) return undefined
  if (!next) return base

  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}next=${encodeURIComponent(next)}`
}
