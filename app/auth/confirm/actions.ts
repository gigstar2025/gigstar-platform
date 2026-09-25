"use server"

import { redirect } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth/errors"

// Verifies the emailed one-time `token_hash` ONLY on an explicit POST (the user
// pressing Confirm). Verification is deliberately kept out of the GET handler
// so that automated GET requests from email security scanners (Outlook
// SafeLinks, antivirus link checkers, Apple Mail privacy prefetch) cannot
// silently consume the single-use token and cause `otp_expired` before the
// human ever clicks.
export async function confirmEmailAction(formData: FormData) {
  const tokenHashValue = formData.get("token_hash")
  const tokenHash = typeof tokenHashValue === "string" ? tokenHashValue : ""
  const type = formData.get("type") as EmailOtpType | null
  const nextValue = formData.get("next")
  // Only ever honour a safe same-origin relative path; anything else falls back
  // to the post-login hub to prevent open-redirects.
  const next = sanitizeNext(typeof nextValue === "string" ? nextValue : null)

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      redirect(next ?? "/auth/post-login")
    }
    // Log the technical cause server-side; the user only sees generic copy.
    console.error("[v0] verifyOtp failed:", error.message)
  }

  redirect(`/auth/error?message=${encodeURIComponent(GENERIC_SIGN_IN_ERROR)}`)
}

// Accept only same-origin relative paths: must start with a single "/" and not
// begin with "//" or "/\" (protocol-relative URLs that would escape the origin).
function sanitizeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/")) return null
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
