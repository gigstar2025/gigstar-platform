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
  if (!user) return null

  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data) return null
  return user
}

/**
 * Guard for admin-only routes. Redirects unauthenticated / non-admin users to
 * the login page rather than exposing the existence of the admin area.
 */
export async function requirePlatformAdmin() {
  const user = await getPlatformAdminUser()
  if (!user) {
    redirect("/auth/login?next=/admin/confirmation-email")
  }
  return user
}
