import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { resolvePostLoginDestination } from "@/lib/auth/post-login"
import { safeNextPath } from "@/lib/auth/safe-next"

// Central post-authentication redirect hub. Both the password sign-in flow
// (client, via a hard navigation) and the email-confirmation callback (server)
// send the user here, so the destination decision lives in one place. An
// unauthenticated request here is bounced back to sign-in.
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Honor a validated `next` target (the page the user was bounced from, e.g.
  // the admin editor) over the default destination. `safeNextPath` guarantees
  // an app-relative path, so this cannot be turned into an open redirect.
  const requestedNext = safeNextPath(searchParams.get("next"))
  const destination = requestedNext ?? (await resolvePostLoginDestination())
  return NextResponse.redirect(`${origin}${destination}`)
}
