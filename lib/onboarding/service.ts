import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProfileType } from "@/lib/db/types"
import type { OnboardingStepOrCompleted } from "./constants"

// Thin data-access layer over the migration 0011 onboarding RPCs. Every call
// runs through the request-bound (RLS-enforced) Supabase client, so the RPCs'
// own SECURITY DEFINER + auth.uid() checks remain the authority. No service
// role is ever used here.

export type OnboardingStateRow = {
  current_step: OnboardingStepOrCompleted
  active_attempt_id: string | null
}

export async function readOnboardingState(
  supabase: SupabaseClient,
): Promise<OnboardingStateRow | null> {
  const { data, error } = await supabase
    .from("onboarding_state")
    .select("current_step, active_attempt_id")
    .maybeSingle()
  if (error || !data) return null
  return data as OnboardingStateRow
}

// True when the caller already owns/holds an active, non-archived profile, so
// they must NOT be funnelled into onboarding. resolve_default_profile() is the
// primary signal (create_profile always sets a default when none is valid); a
// membership scan is the fallback for the rare archived-default case.
export async function hasAccessibleProfile(supabase: SupabaseClient): Promise<boolean> {
  const { data: defaultId } = await supabase.rpc("resolve_default_profile")
  if (defaultId) return true

  const { data, error } = await supabase
    .from("profile_memberships")
    .select("profile_id, profiles!inner(id, deleted_at, archived_at, lifecycle_status)")
    .eq("status", "active")
  if (error || !data) return false

  return data.some((row) => {
    const profile = (row as { profiles: unknown }).profiles as
      | { deleted_at: string | null; archived_at: string | null; lifecycle_status: string }
      | Array<{ deleted_at: string | null; archived_at: string | null; lifecycle_status: string }>
      | null
    const record = Array.isArray(profile) ? profile[0] : profile
    if (!record) return false
    return (
      record.deleted_at === null &&
      record.archived_at === null &&
      record.lifecycle_status !== "archived"
    )
  })
}

export async function startAttempt(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.rpc("start_profile_creation_attempt")
  if (error || typeof data !== "string") return null
  return data
}

export async function checkSlugAvailable(
  supabase: SupabaseClient,
  candidate: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("slug_available", { p_candidate: candidate })
  if (error) return false
  return data === true
}

export async function setOnboardingStep(
  supabase: SupabaseClient,
  step: OnboardingStepOrCompleted,
  activeAttemptId: string | null,
): Promise<boolean> {
  const { error } = await supabase.rpc("set_onboarding_step", {
    p_step: step,
    p_active_attempt_id: activeAttemptId,
  })
  return !error
}

export type CreateProfileInput = {
  attemptId: string
  slug: string
  type: ProfileType
  displayName: string
  tagline: string | null
  locationLabel: string | null
  lon: number | null
  lat: number | null
}

export type CreateProfileResult =
  | { ok: true; profileId: string }
  | { ok: false; reason: "slug_taken" | "limit_reached" | "invalid" | "error" }

export async function createProfile(
  supabase: SupabaseClient,
  input: CreateProfileInput,
): Promise<CreateProfileResult> {
  const { data, error } = await supabase.rpc("create_profile", {
    p_attempt_id: input.attemptId,
    p_slug: input.slug,
    p_type: input.type,
    p_display_name: input.displayName,
    p_tagline: input.tagline,
    p_location_label: input.locationLabel,
    p_location_lon: input.lon,
    p_location_lat: input.lat,
  })

  if (!error && typeof data === "string") {
    return { ok: true, profileId: data }
  }

  const message = error?.message ?? ""
  if (message.includes("profile_limit_reached")) return { ok: false, reason: "limit_reached" }
  if (message.includes("slug_taken")) return { ok: false, reason: "slug_taken" }
  if (message.includes("invalid_slug")) return { ok: false, reason: "invalid" }
  return { ok: false, reason: "error" }
}

// The slug attributed to a completed attempt, used to build the editor
// handoff URL. Readable by the owner via the attempts SELECT-own RLS policy.
export async function getCompletedSlug(
  supabase: SupabaseClient,
  attemptId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profile_creation_attempts")
    .select("requested_slug, status")
    .eq("id", attemptId)
    .maybeSingle()
  if (error || !data) return null
  const row = data as { requested_slug: string | null; status: string }
  if (row.status !== "completed") return null
  return row.requested_slug
}
