import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth/errors"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // Only ever honour a safe same-origin relative path (e.g. the password-reset
  // flow forwards to /auth/update-password). Anything else falls back to the
  // central post-login hub to prevent open-redirects.
  const next = sanitizeNext(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Route through the central post-login hub so the destination decision
      // lives in one place (see lib/auth/post-login). This replaces the old
      // hardcoded /dev/foundation target, which 404s in Production. A validated
      // `next` (e.g. /auth/update-password) takes precedence when present.
      return NextResponse.redirect(`${origin}${next ?? "/auth/post-login"}`)
    }
    // Log the technical cause server-side; the user only sees generic copy.
    console.error("[v0] exchangeCodeForSession failed:", error.message)
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
