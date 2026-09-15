import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getModuleDefinitions,
  listPublicProfiles,
  searchProfilesNear,
} from "@/lib/db/foundation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "./sign-out-button"
import { SeedButton } from "./seed-button"

export const dynamic = "force-dynamic"

type Check = { label: string; ok: boolean; detail: string }

// Manchester city centre — a coarse origin used only to exercise the PostGIS
// distance-search RPC end to end.
const SEARCH_ORIGIN = { lat: 53.4808, lon: -2.2426, radiusKm: 250 }

export default async function FoundationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const checks: Check[] = []

  let moduleCount = 0
  try {
    const definitions = await getModuleDefinitions()
    moduleCount = definitions.length
    checks.push({
      label: "Module catalog readable",
      ok: definitions.length > 0,
      detail: `${definitions.length} module definitions seeded`,
    })
  } catch (error) {
    checks.push({ label: "Module catalog readable", ok: false, detail: (error as Error).message })
  }

  let publicProfiles: Awaited<ReturnType<typeof listPublicProfiles>> = []
  try {
    publicProfiles = await listPublicProfiles()
    checks.push({
      label: "Public profile view queryable",
      ok: true,
      detail: `${publicProfiles.length} public profile(s) visible`,
    })
  } catch (error) {
    checks.push({ label: "Public profile view queryable", ok: false, detail: (error as Error).message })
  }

  try {
    const near = await searchProfilesNear(SEARCH_ORIGIN)
    checks.push({
      label: "PostGIS distance search (RPC)",
      ok: true,
      detail: `search_profiles_near returned ${near.length} result(s)`,
    })
  } catch (error) {
    checks.push({ label: "PostGIS distance search (RPC)", ok: false, detail: (error as Error).message })
  }

  const allOk = checks.every((c) => c.ok)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 bg-background px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-balance">Backend foundation status</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email}. This page verifies the Supabase schema, RLS, views and PostGIS
            wiring end to end.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <SignOutButton />
          <SeedButton />
        </div>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle>Connectivity checks</CardTitle>
            <CardDescription>Each check runs a real query through the data-access layer.</CardDescription>
          </div>
          <Badge variant={allOk ? "default" : "destructive"}>{allOk ? "All passing" : "Attention"}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{check.label}</span>
                <span className="text-xs text-muted-foreground">{check.detail}</span>
              </div>
              <Badge variant={check.ok ? "default" : "destructive"}>{check.ok ? "OK" : "FAIL"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public profiles ({publicProfiles.length})</CardTitle>
          <CardDescription>Coarse location only — precise coordinates never leave the server.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {publicProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No public profiles yet. Run the seed process to populate the four example profiles.
            </p>
          ) : (
            publicProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{profile.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    /{profile.slug} · {profile.location_label ?? "no location"}
                  </span>
                </div>
                <Badge variant="secondary">{profile.type}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {moduleCount > 0
          ? `Module catalog seeded with ${moduleCount} definitions.`
          : "Module catalog is empty."}
      </p>
    </main>
  )
}
