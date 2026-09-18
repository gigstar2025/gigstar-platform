"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { findTown } from "@/lib/geo/towns"
import {
  checkSlugAvailable,
  createProfile,
  readOnboardingState,
  setOnboardingStep,
  startAttempt,
} from "@/lib/onboarding/service"
import { clearDraft, mergeDraft, readDraft } from "@/lib/onboarding/draft"
import {
  isProfileType,
  normalizeDisplayName,
  normalizeTagline,
  validateDisplayName,
  validateSlugShape,
  validateTagline,
} from "@/lib/onboarding/validation"

export type OnboardingActionState = { error?: string }

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  return supabase
}

async function currentAttemptId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const state = await readOnboardingState(supabase)
  return state?.active_attempt_id ?? null
}

export async function selectTypeAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await requireUser()
  const type = formData.get("type")
  if (!isProfileType(type)) {
    return { error: "Choose a profile type to continue." }
  }

  let attemptId = await currentAttemptId(supabase)
  if (!attemptId) {
    attemptId = await startAttempt(supabase)
    if (!attemptId) return { error: "Could not start onboarding. Please try again." }
  }

  await mergeDraft({ type })
  await setOnboardingStep(supabase, "details", attemptId)
  redirect("/onboarding/details")
}

export async function submitDetailsAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await requireUser()

  const draft = await readDraft()
  if (!draft.type) redirect("/onboarding/type")

  const displayName = normalizeDisplayName(String(formData.get("displayName") ?? ""))
  const nameError = validateDisplayName(displayName)
  if (nameError) return { error: nameError }

  const town = findTown(String(formData.get("town") ?? ""))
  if (!town) return { error: "Choose a town from the list so we can show your location." }

  const tagline = normalizeTagline(String(formData.get("tagline") ?? ""))
  const taglineError = validateTagline(tagline)
  if (taglineError) return { error: taglineError }

  const attemptId = await currentAttemptId(supabase)
  await mergeDraft({
    displayName,
    tagline: tagline || undefined,
    locationLabel: town.name,
    lat: town.lat,
    lng: town.lng,
  })
  await setOnboardingStep(supabase, "handle", attemptId)
  redirect("/onboarding/handle")
}

// Live availability probe used by the handle step. Callable directly from the
// client component (guarded by auth); returns only a boolean + optional hint.
export async function checkHandleAction(
  candidate: string,
): Promise<{ available: boolean; message?: string }> {
  const supabase = await requireUser()
  const slug = candidate.trim().toLowerCase()
  const shapeError = validateSlugShape(slug)
  if (shapeError) return { available: false, message: shapeError }
  const available = await checkSlugAvailable(supabase, slug)
  return {
    available,
    message: available ? undefined : "That handle is taken or reserved.",
  }
}

export async function submitHandleAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await requireUser()

  const draft = await readDraft()
  if (!draft.type) redirect("/onboarding/type")
  if (!draft.displayName) redirect("/onboarding/details")

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  const shapeError = validateSlugShape(slug)
  if (shapeError) return { error: shapeError }

  const available = await checkSlugAvailable(supabase, slug)
  if (!available) return { error: "That handle is taken or reserved. Try another." }

  const attemptId = await currentAttemptId(supabase)
  await mergeDraft({ slug })
  await setOnboardingStep(supabase, "review", attemptId)
  redirect("/onboarding/review")
}

export async function createProfileAction(
  _prev: OnboardingActionState,
  _formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await requireUser()

  const draft = await readDraft()
  const attemptId = await currentAttemptId(supabase)
  if (!attemptId || !draft.type) redirect("/onboarding/type")
  if (!draft.displayName) redirect("/onboarding/details")
  if (!draft.slug) redirect("/onboarding/handle")

  const result = await createProfile(supabase, {
    attemptId,
    slug: draft.slug,
    type: draft.type,
    displayName: draft.displayName,
    tagline: draft.tagline ?? null,
    locationLabel: draft.locationLabel ?? null,
    lon: draft.lng ?? null,
    lat: draft.lat ?? null,
  })

  if (!result.ok) {
    if (result.reason === "slug_taken") {
      return { error: "That handle was just taken. Go back and choose another." }
    }
    if (result.reason === "limit_reached") {
      return { error: "You have reached the maximum of 5 active profiles." }
    }
    if (result.reason === "invalid") {
      return { error: "Those details were rejected. Please review and try again." }
    }
    return { error: "Something went wrong creating your profile. Please try again." }
  }

  await setOnboardingStep(supabase, "completed", attemptId)
  await clearDraft()
  redirect(`/profile/${draft.slug}/edit`)
}
