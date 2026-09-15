import "server-only"

import { createClient } from "@/lib/supabase/server"
import type {
  ModuleDefinition,
  ProfileNearResult,
  ProfileType,
  PublicProfile,
  PublicProfileModule,
} from "@/lib/db/types"

// Server-only data-access layer for the GigStar backend foundation.
//
// Every read here goes through the RLS-protected base tables or the
// public-safe views/RPCs created in migrations 0007–0008, so nothing in this
// module can leak draft content or precise (location_exact) coordinates.

// The full module catalog (world-readable via RLS). Ordered as the editor
// registry expects: by default position.
export async function getModuleDefinitions(): Promise<ModuleDefinition[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profile_module_definitions")
    .select(
      "key,label,description,category,applies_to,recommended_for,is_required,is_singleton,feeds_discovery,can_hide,is_active,default_position",
    )
    .order("default_position", { ascending: true })

  if (error) throw new Error(`getModuleDefinitions: ${error.message}`)
  return (data ?? []) as ModuleDefinition[]
}

// All publicly-visible profiles (coarse location only) from the public view.
export async function listPublicProfiles(): Promise<PublicProfile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("public_profiles")
    .select(
      "id,slug,type,display_name,tagline,verification_status,location_label,location_lat,location_lon,travel_radius_km,published_at",
    )
    .order("display_name", { ascending: true })

  if (error) throw new Error(`listPublicProfiles: ${error.message}`)
  return (data ?? []) as PublicProfile[]
}

// A single public profile by slug, plus its published, non-hidden modules.
export async function getPublicProfileBySlug(
  slug: string,
): Promise<{ profile: PublicProfile; modules: PublicProfileModule[] } | null> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select(
      "id,slug,type,display_name,tagline,verification_status,location_label,location_lat,location_lon,travel_radius_km,published_at",
    )
    .eq("slug", slug)
    .maybeSingle()

  if (profileError) throw new Error(`getPublicProfileBySlug: ${profileError.message}`)
  if (!profile) return null

  const { data: modules, error: modulesError } = await supabase
    .from("public_profile_modules")
    .select("id,profile_id,module_key,position,content,published_at")
    .eq("profile_id", (profile as PublicProfile).id)
    .order("position", { ascending: true })

  if (modulesError) throw new Error(`getPublicProfileBySlug modules: ${modulesError.message}`)

  return {
    profile: profile as PublicProfile,
    modules: (modules ?? []) as PublicProfileModule[],
  }
}

// PostGIS distance search over public profiles (replaces the JS Haversine scan).
export async function searchProfilesNear(params: {
  lat: number
  lon: number
  radiusKm?: number
  type?: ProfileType | null
  limit?: number
}): Promise<ProfileNearResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("search_profiles_near", {
    p_lat: params.lat,
    p_lon: params.lon,
    p_radius_km: params.radiusKm ?? 40,
    p_type: params.type ?? null,
    p_limit: params.limit ?? 50,
  })

  if (error) throw new Error(`searchProfilesNear: ${error.message}`)
  return (data ?? []) as ProfileNearResult[]
}
