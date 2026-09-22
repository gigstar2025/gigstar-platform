import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth/errors"

// Verifies an emailed auth link via its one-time `token_hash` (recovery,
// signup, magic link, email change). Unlike the PKCE `?code=` exchange in
// /auth/callback, verifyOtp needs NO client-side code-verifier cookie, so the
// link works even when opened in a different browser or on a different device
// from where it was requested — the correct pattern for password recovery.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  // Only ever honour a safe same-origin relative path (recovery forwards to
  // /auth/update-password). Anything else falls back to the post-login hub to
  // prevent open-redirects.
  const next = sanitizeNext(searchParams.get("next"))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next ?? "/auth/post-login"}`)
    }
    // Log the technical cause server-side; the user only sees generic copy.
    console.error("[v0] verifyOtp failed:", error.message)
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent(GENERIC_SIGN_IN_ERROR)}`,
  )
}

// Accept only same-origin relative paths: must start with a single "/" and not
// begin with "//" or "/\" (protocol-relative URLs that would escape the origin).
function sanitizeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/")) return null
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
