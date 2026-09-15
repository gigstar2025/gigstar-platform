import "server-only"

import { createClient as createServiceClient } from "@supabase/supabase-js"

import { SHOWCASE_PROFILES } from "@/lib/profiles/showcase"
import type { ShowcaseProfile, ShowcaseType } from "@/lib/profiles/showcase"
import { allowedModuleKeys, moduleDef, moduleLabel } from "@/lib/profiles/editor/module-registry"

// Idempotent seed for the four example profiles. Runs with the service-role
// key so it can write across profiles regardless of RLS, and replicates the
// create_profile_with_owner + publish_profile logic (which depend on auth.uid
// and therefore cannot be called from a service context).
//
// Re-running is safe: profiles upsert by slug, memberships by (profile,user),
// modules by (profile,module_key).

const DEMO_OWNER_EMAIL = "founder@gigstar.dev"
const DEMO_OWNER_PASSWORD = "gigstar-demo-owner-2026"
const DEMO_OWNER_NAME = "GigStar Demo Owner"

// Coarse Manchester centroid; a small per-type offset keeps distance-search
// results distinct without exposing anything like a precise address.
const MANCHESTER = { lat: 53.4808, lon: -2.2426 }
const TYPE_OFFSET: Record<ShowcaseType, { dLat: number; dLon: number }> = {
  dj: { dLat: 0.004, dLon: 0.003 },
  artist: { dLat: -0.005, dLon: 0.006 },
  venue: { dLat: 0.008, dLon: -0.004 },
  organiser: { dLat: -0.003, dLon: -0.007 },
}

function serviceClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to run the seed.")
  }
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type Sb = ReturnType<typeof serviceClient>

async function ensureDemoOwner(sb: Sb): Promise<string> {
  // Try to create; if the user already exists, look them up by listing.
  const created = await sb.auth.admin.createUser({
    email: DEMO_OWNER_EMAIL,
    password: DEMO_OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: DEMO_OWNER_NAME },
  })

  if (created.data.user) return created.data.user.id

  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw new Error(`ensureDemoOwner: ${error.message}`)
  const existing = data.users.find((u) => u.email?.toLowerCase() === DEMO_OWNER_EMAIL)
  if (!existing) throw new Error("ensureDemoOwner: could not create or find the demo owner user.")
  return existing.id
}

function moduleContent(profile: ShowcaseProfile, key: ShowcaseProfile["sections"][number]) {
  const def = moduleDef(key)
  const field = def.dataField
  const value = (profile as unknown as Record<string, unknown>)[field] ?? null
  const content: Record<string, unknown> = {
    label: moduleLabel(key, profile.type),
    [field]: value,
  }
  // Contact module carries the surrounding contact affordances too.
  if (key === "contact") {
    content.website = profile.website ?? null
    content.socials = profile.socials ?? []
  }
  return content
}

async function seedProfile(sb: Sb, ownerId: string, profile: ShowcaseProfile) {
  const offset = TYPE_OFFSET[profile.type]
  const centroid = `SRID=4326;POINT(${MANCHESTER.lon + offset.dLon} ${MANCHESTER.lat + offset.dLat})`

  const { data: upserted, error: profileError } = await sb
    .from("profiles")
    .upsert(
      {
        slug: profile.slug,
        type: profile.type,
        display_name: profile.displayName,
        tagline: profile.tagline,
        visibility: "public",
        lifecycle_status: "active",
        verification_status: profile.verified ? "verified" : "unverified",
        location_label: profile.location,
        location_centroid: centroid,
        travel_radius_km: 60,
        published_at: new Date().toISOString(),
        created_by: ownerId,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single()

  if (profileError) throw new Error(`seedProfile(${profile.slug}) profile: ${profileError.message}`)
  const profileId = (upserted as { id: string }).id

  const { error: membershipError } = await sb
    .from("profile_memberships")
    .upsert(
      { profile_id: profileId, user_id: ownerId, role: "owner", status: "active" },
      { onConflict: "profile_id,user_id" },
    )
  if (membershipError) throw new Error(`seedProfile(${profile.slug}) membership: ${membershipError.message}`)

  // Only sections that are valid modules for this profile type.
  const allowed = new Set(allowedModuleKeys(profile.type))
  const sections = profile.sections.filter((key) => allowed.has(key))

  const now = new Date().toISOString()
  const rows = sections.map((key, index) => {
    const content = moduleContent(profile, key)
    return {
      profile_id: profileId,
      module_key: key,
      position: (index + 1) * 10,
      is_hidden: false,
      draft_content: content,
      published_content: content, // seed lands already published
      published_at: now,
      created_by: ownerId,
      updated_by: ownerId,
    }
  })

  const { error: modulesError } = await sb
    .from("profile_modules")
    .upsert(rows, { onConflict: "profile_id,module_key" })
  if (modulesError) throw new Error(`seedProfile(${profile.slug}) modules: ${modulesError.message}`)

  // Snapshot a revision so history/restore has a starting point.
  const { error: revisionError } = await sb.from("profile_revisions").insert({
    profile_id: profileId,
    created_by: ownerId,
    snapshot: {
      profile: { slug: profile.slug, type: profile.type, display_name: profile.displayName },
      modules: rows.map((r) => ({
        module_key: r.module_key,
        position: r.position,
        is_hidden: r.is_hidden,
        published_content: r.published_content,
      })),
    },
  })
  if (revisionError) throw new Error(`seedProfile(${profile.slug}) revision: ${revisionError.message}`)

  return { slug: profile.slug, modules: rows.length }
}

export interface SeedResult {
  ownerId: string
  profiles: { slug: string; modules: number }[]
}

export async function runSeed(): Promise<SeedResult> {
  const sb = serviceClient()
  const ownerId = await ensureDemoOwner(sb)
  const results = []
  for (const profile of SHOWCASE_PROFILES) {
    results.push(await seedProfile(sb, ownerId, profile))
  }
  return { ownerId, profiles: results }
}
