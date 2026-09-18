import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site/site-header"
import { ProfileManager } from "@/components/profile/manage/profile-manager"
import { createClient } from "@/lib/supabase/server"
import { readActiveProfileCookie } from "@/lib/profiles/active-profile"
import { loadProfileManagerData } from "@/lib/profiles/manage"

// Authenticated dashboard: reads cookies and the session user, so it must
// render dynamically (never statically generated).
export const dynamic = "force-dynamic"

export const metadata = {
  title: "Your profiles — GigStar",
  description: "Switch between, manage and archive the profiles you run on GigStar.",
}

export default async function ManageProfilesPage() {
  const supabase = await createClient()
  const cookieActiveId = await readActiveProfileCookie()
  const data = await loadProfileManagerData(supabase, cookieActiveId)

  // Not signed in → send to login. The manager is owner-scoped.
  if (!data) redirect("/auth/login")

  // Signed in but no profiles yet → straight into onboarding.
  if (data.active.length === 0 && data.archived.length === 0) redirect("/onboarding")

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <ProfileManager data={data} />
      </main>
    </div>
  )
}
