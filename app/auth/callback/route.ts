import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth/errors"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Route through the central post-login hub so the destination decision
      // lives in one place (see lib/auth/post-login). This replaces the old
      // hardcoded /dev/foundation target, which 404s in Production.
      return NextResponse.redirect(`${origin}/auth/post-login`)
    }
    // Log the technical cause server-side; the user only sees generic copy.
    console.error("[v0] exchangeCodeForSession failed:", error.message)
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent(GENERIC_SIGN_IN_ERROR)}`,
  )
}
