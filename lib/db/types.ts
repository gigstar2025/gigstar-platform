// Hand-written TypeScript types mirroring the GigStar Phase Five schema
// (public schema, migrations 0001–0009). Kept deliberately close to the SQL so
// the data-access layer is fully typed without a generation step.

export type AccountStatus = "active" | "deactivated" | "suspended"

export type ProfileType = "dj" | "artist" | "venue" | "organiser"

export type ProfileVisibility = "public" | "hidden" | "unlisted"

export type ProfileLifecycleStatus = "draft" | "active" | "suspended" | "archived"

export type ProfileVerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "revoked"

export type MembershipRole =
  | "owner"
  | "administrator"
  | "editor"
  | "event_manager"
  | "content_contributor"
  | "analyst"

export type MembershipStatus = "active" | "inactive" | "removed"

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "revoked"

// Phase Six (migration 0011) — multi-profile onboarding foundation.
export type ProfileCreationStatus = "pending" | "completed" | "failed"

export type OnboardingStep = "type" | "details" | "handle" | "review" | "completed"

// Row shape of public.profile_creation_attempts (idempotency ledger).
// The client has SELECT-own only; all writes go through SECURITY DEFINER RPCs.
export interface ProfileCreationAttempt {
  id: string
  user_id: string
  status: ProfileCreationStatus
  created_profile_id: string | null
  requested_slug: string | null
  requested_type: ProfileType | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

// Row shape of public.onboarding_state (one row per account, resumable).
export interface OnboardingState {
  user_id: string
  current_step: OnboardingStep
  active_attempt_id: string | null
  created_at: string
  updated_at: string
}

export interface ModuleDefinition {
  key: string
  label: string
  description: string | null
  category: string
  applies_to: ProfileType[]
  recommended_for: ProfileType[]
  is_required: boolean
  is_singleton: boolean
  feeds_discovery: boolean
  can_hide: boolean
  is_active: boolean
  default_position: number
}

// Row shape of the public.public_profiles view (coarse location only).
export interface PublicProfile {
  id: string
  slug: string
  type: ProfileType
  display_name: string
  tagline: string | null
  verification_status: ProfileVerificationStatus
  location_label: string | null
  location_lat: number | null
  location_lon: number | null
  travel_radius_km: number | null
  published_at: string | null
}

// Row shape of the public.public_profile_modules view (published content only).
export interface PublicProfileModule {
  id: string
  profile_id: string
  module_key: string
  position: number
  content: Record<string, unknown>
  published_at: string | null
}

// Row shape returned by public.search_profiles_near(...).
export interface ProfileNearResult {
  id: string
  slug: string
  type: ProfileType
  display_name: string
  tagline: string | null
  location_label: string | null
  distance_km: number
}
