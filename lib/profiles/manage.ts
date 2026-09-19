import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  MembershipRole,
  ProfileLifecycleStatus,
  ProfileType,
  ProfileVisibility,
} from "@/lib/db/types"

// The platform cap on how many *active* (non-archived) profiles a single
// account may hold. Mirrors the limit enforced server-side by create_profile
// (migration 0011) — archival is the only way to make room once at the cap.
export const MAX_ACTIVE_PROFILES = 5

// A single profile the signed-in user has a membership on, flattened for the
// management dashboard. Avatars live in media_assets (migration 0003) and are
// not needed here, so the manager renders a type monogram instead.
export interface ManagedProfile {
  id: string
  slug: string
  type: ProfileType
  displayName: string
  tagline: string | null
  visibility: ProfileVisibility
  lifecycleStatus: ProfileLifecycleStatus
  role: MembershipRole
  isArchived: boolean
  archivedAt: string | null
  publishedAt: string | null
  createdAt: string
}

export interface ProfileManagerData {
  active: ManagedProfile[]
  archived: ManagedProfile[]
  defaultProfileId: string | null
  // The resolved current working context: the cookie pointer when still valid,
  // otherwise the DB default, otherwise the first active profile.
  activeProfileId: string | null
  activeCount: number
  maxActive: number
  canCreate: boolean
}

interface MembershipRow {
  role: MembershipRole
  profile: {
    id: string
    slug: string
    type: ProfileType
    display_name: string
    tagline: string | null
    visibility: ProfileVisibility
    lifecycle_status: ProfileLifecycleStatus
    archived_at: string | null
    published_at: string | null
    created_at: string
  } | null
}

function toManagedProfile(row: MembershipRow): ManagedProfile | null {
  const p = row.profile
  if (!p) return null
  const isArchived = p.lifecycle_status === "archived" || p.archived_at != null
  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    displayName: p.display_name,
    tagline: p.tagline,
    visibility: p.visibility,
    lifecycleStatus: p.lifecycle_status,
    role: row.role,
    isArchived,
    archivedAt: p.archived_at,
    publishedAt: p.published_at,
    createdAt: p.created_at,
  }
}

function resolveActiveId(
  active: ManagedProfile[],
  defaultProfileId: string | null,
  cookieId: string | null,
): string | null {
  const has = (id: string | null): id is string => id != null && active.some((p) => p.id === id)
  if (has(cookieId)) return cookieId
  if (has(defaultProfileId)) return defaultProfileId
  return active[0]?.id ?? null
}

// Loads every profile the signed-in user manages, split into active and
// archived buckets, together with the resolved default and current working
// context. Returns null when there is no authenticated user. All reads run
// through the RLS-bound session client; the membership join constrains results
// to the caller's own profiles (never other members' public rows).
export async function loadProfileManagerData(
  supabase: SupabaseClient,
  cookieActiveProfileId: string | null,
): Promise<ProfileManagerData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profile_memberships")
    .select(
      "role, profile:profiles!inner(id, slug, type, display_name, tagline, visibility, lifecycle_status, archived_at, published_at, created_at)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")

  if (error) throw error

  const rows = (data ?? []) as unknown as MembershipRow[]
  const all = rows
    .map(toManagedProfile)
    .filter((p): p is ManagedProfile => p != null)

  const active = all
    .filter((p) => !p.isArchived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const archived = all
    .filter((p) => p.isArchived)
    .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""))

  const { data: defaultId } = await supabase.rpc("resolve_default_profile")
  const defaultProfileId = (defaultId as string | null) ?? null

  return {
    active,
    archived,
    defaultProfileId,
    activeProfileId: resolveActiveId(active, defaultProfileId, cookieActiveProfileId),
    activeCount: active.length,
    maxActive: MAX_ACTIVE_PROFILES,
    canCreate: active.length < MAX_ACTIVE_PROFILES,
  }
}
