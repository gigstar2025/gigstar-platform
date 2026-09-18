import "server-only"

import { createClient } from "@/lib/supabase/server"
import { ONBOARDING_FLOW_ENABLED } from "@/lib/flags"
import { hasAccessibleProfile } from "@/lib/onboarding/service"

// Single source of truth for where an authenticated user lands after signing
// in or confirming their email. Both the password sign-in flow and the email
// confirmation callback resolve their destination here (via /auth/post-login),
// so routing logic lives in exactly one place.
//
// Returns a safe, always-valid destination. The default is the public
// homepage; real users previously landed on /dev/foundation, which returns a
// hard 404 in Production (Phase Five hardening).
//
// PR-3 adds the first database-backed branch, gated behind the
// ONBOARDING_FLOW_ENABLED flag (OFF by default): an authenticated user with no
// accessible profile is sent to /onboarding to create their first one. When
// the flag is off, or the user already holds a profile, behaviour is unchanged
// (homepage).
//
// Planned expansion (documented so the call sites can stay unchanged):
//   - PR-4 adds /profiles/manage — the ambiguous / invalid-default branch
//     routes there.
//   - PR-5 makes /profile/[slug] database-backed so a user with profiles can
//     be routed to a specific profile: its public page when published, or the
//     private owner preview when still a draft.
export async function resolvePostLoginDestination(): Promise<string> {
  if (!ONBOARDING_FLOW_ENABLED) return "/"

  // Resolve against the RLS-bound session client. Any failure falls back to
  // the safe homepage rather than blocking sign-in.
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return "/"

    const hasProfile = await hasAccessibleProfile(supabase)
    if (!hasProfile) return "/onboarding"
  } catch {
    return "/"
  }

  return "/"
}
