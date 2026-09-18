// Shared onboarding constants and types. Safe to import from both server and
// client code (no server-only side effects).

import type { ProfileType } from "@/lib/db/types"

// The ordered onboarding steps. The DB enum `public.onboarding_step`
// (migration 0011) is the source of truth: 'type' | 'details' | 'handle' |
// 'review' | 'completed'. This array mirrors it and defines progression order.
export const ONBOARDING_STEPS = ["type", "details", "handle", "review"] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

// The DB enum also has a terminal 'completed' value that no step page renders.
export type OnboardingStepOrCompleted = OnboardingStep | "completed"

export function stepIndex(step: OnboardingStepOrCompleted): number {
  if (step === "completed") return ONBOARDING_STEPS.length
  return ONBOARDING_STEPS.indexOf(step)
}

export function stepPath(step: OnboardingStepOrCompleted): string {
  if (step === "completed") return "/onboarding"
  return `/onboarding/${step}`
}

// The selectable profile types, with human copy for the type step. These map
// 1:1 to the DB enum `public.profile_type`.
export const PROFILE_TYPE_OPTIONS: ReadonlyArray<{
  value: ProfileType
  label: string
  description: string
}> = [
  { value: "dj", label: "DJ", description: "Mixes, residencies and bookings." },
  { value: "artist", label: "Artist", description: "Live acts, releases and performances." },
  { value: "venue", label: "Venue", description: "A space that hosts events." },
  { value: "organiser", label: "Organiser", description: "Promoters and event series." },
]

// The httpOnly cookie that carries the in-progress step field values so the
// flow is resumable from server state without any client-side storage. The DB
// (onboarding_state + the minted attempt) owns *which* step the user is on;
// this cookie only holds the not-yet-persisted field values for that step.
export const ONBOARDING_DRAFT_COOKIE = "gigstar_onboarding_draft"
