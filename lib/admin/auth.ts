import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

/**
 * Returns the signed-in user IFF they are a platform admin, else null.
 *
 * Reads `public.platform_admins` through the request-bound (RLS) client. The
 * table's SELECT policy is `using (public.is_platform_admin())`, so a
 * non-admin simply sees an empty set — no row means not an admin.
 */
export async function getPlatformAdminUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    // No server-readable session. Distinguishes a genuine signed-out request
    // from an admin whose session cookie the server could not read (the
    // production login-loop symptom).
    console.warn("[admin-guard] no server session: getUser() returned no user")
    return null
  }

  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    // A query failure (e.g. RLS/schema issue) must NOT be silently treated as
    // "not an admin" without a trace — that would mask a real misconfiguration.
    // Still deny access, but make the cause visible in server logs.
    console.warn(`[admin-guard] platform_admins lookup failed for ${user.id}: ${error.message}`)
    return null
  }
  if (!data) {
    console.warn(`[admin-guard] authenticated user ${user.id} is not a platform admin`)
    return null
  }
  return user
}

/**
 * Guard for admin-only routes. Redirects unauthenticated / non-admin users to
 * the login page rather than exposing the existence of the admin area.
 */
export async function requirePlatformAdmin(next = "/admin") {
  const user = await getPlatformAdminUser()
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  }
  return user
}
