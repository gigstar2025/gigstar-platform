import "server-only"

// ---------------------------------------------------------------------------
// Public modular-profile loader (PR-5b).
//
// Reads the publicly-safe projections created in migration 0007:
//   * public_profiles          — only visibility=public, lifecycle=active rows
//                                (coarse location only; never location_exact)
//   * public_profile_modules   — published, non-hidden modules (published_content
//                                only; never draft_content)
//
// Both views are security_invoker and granted to anon, so RLS on the base
// tables still applies. Draft content and hidden/unpublished profiles are
// therefore unreachable through this path by construction.
// ---------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server"
import { isModuleKey } from "./registry"
import { moduleToRenderModule } from "./render-adapter"
import type { ProfileModule, ProfileRole } from "../types"

export interface PublicModularProfile {
  id: string
  slug: string
  type: string
  displayName: string
  tagline: string | null
  locationLabel: string | null
  avatarUrl: string | null
  publishedAt: string | null
  modules: ProfileModule[]
}

/** Map a DB profile type onto a display role label used by the header. */
const PROFILE_TYPE_TO_ROLE: Record<string, ProfileRole> = {
  dj: "dj",
  artist: "solo-artist",
  venue: "venue",
  organiser: "promoter",
}

export function profileTypeToRole(type: string): ProfileRole {
  return PROFILE_TYPE_TO_ROLE[type] ?? "other"
}

/**
 * Load a published, public modular profile by slug, with its published,
 * non-hidden modules converted to renderable `ProfileModule`s in display order.
 * Returns null when no such public profile exists (unknown slug, hidden, draft,
 * archived, or simply not yet published).
 */
export async function getPublicModularProfile(
  slug: string,
): Promise<PublicModularProfile | null> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select("id, slug, type, display_name, tagline, location_label, published_at, avatar_url")
    .eq("slug", slug)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Failed to load public profile: ${profileError.message}`)
  }
  if (!profile) return null

  const { data: moduleRows, error: modulesError } = await supabase
    .from("public_profile_modules")
    .select("id, module_key, position, content")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })

  if (modulesError) {
    throw new Error(`Failed to load public modules: ${modulesError.message}`)
  }

  const modules: ProfileModule[] = []
  for (const row of moduleRows ?? []) {
    if (!isModuleKey(row.module_key)) continue
    const rendered = moduleToRenderModule(row.module_key, row.content, {
      id: (row.id as string) ?? `module_${row.module_key}`,
      hidden: false,
    })
    if (rendered) modules.push(rendered)
  }

  return {
    id: profile.id as string,
    slug: profile.slug as string,
    type: profile.type as string,
    displayName: profile.display_name as string,
    tagline: (profile.tagline as string | null) ?? null,
    locationLabel: (profile.location_label as string | null) ?? null,
    avatarUrl: (profile.avatar_url as string | null) ?? null,
    publishedAt: (profile.published_at as string | null) ?? null,
    modules,
  }
}
