import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { resolvePostLoginDestination } from "@/lib/auth/post-login"

// Central post-authentication redirect hub. Both the password sign-in flow
// (client, via a hard navigation) and the email-confirmation callback (server)
// send the user here, so the destination decision lives in one place. An
// unauthenticated request here is bounced back to sign-in.
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const destination = await resolvePostLoginDestination()
  return NextResponse.redirect(`${origin}${destination}`)
}
