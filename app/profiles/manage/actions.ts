"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { clearDraft } from "@/lib/onboarding/draft"
import { setOnboardingStep } from "@/lib/onboarding/service"
import {
  clearActiveProfileCookie,
  writeActiveProfileCookie,
} from "@/lib/profiles/active-profile"
import { loadProfileManagerData } from "@/lib/profiles/manage"

export type ManagerActionResult = { ok: true } | { ok: false; error: string }

const MANAGE_PATH = "/profiles/manage"

// Friendly copy for the SECURITY DEFINER RPC error messages, keyed by the
// message text raised in SQL (migrations 0011 and 0013). Anything unmapped
// falls back to a generic message so raw SQL is never surfaced to the user.
const ARCHIVE_ERRORS: Record<string, string> = {
  owner_required: "Only the profile owner can archive it.",
  not_archivable: "That profile can no longer be archived.",
  replacement_required:
    "Choose another profile to become your default before archiving this one.",
  invalid_replacement: "Pick one of your other active profiles as the new default.",
  last_active_profile:
    "This is your only active profile. Create another before archiving it.",
}

const DEFAULT_ERRORS: Record<string, string> = {
  owner_required: "Only the profile owner can set it as default.",
  not_default_eligible: "Only an active profile you own can be your default.",
}

function mapRpcError(message: string | undefined, table: Record<string, string>): string {
  if (message && table[message]) return table[message]
  return "Something went wrong. Please try again."
}

// Switches the dashboard's working context to another profile the user owns.
// Purely a UI convenience cookie; it is re-validated against the live managed
// set here so a stale or forged id can never point at a profile the caller
// does not actually manage.
export async function switchActiveProfileAction(profileId: string): Promise<ManagerActionResult> {
  if (!profileId) return { ok: false, error: "Missing profile." }

  const supabase = await createClient()
  const data = await loadProfileManagerData(supabase, null)
  if (!data) return { ok: false, error: "You need to sign in." }

  const target = data.active.find((p) => p.id === profileId)
  if (!target) return { ok: false, error: "That profile is not available to switch to." }

  await writeActiveProfileCookie(profileId)
  revalidatePath(MANAGE_PATH)
  return { ok: true }
}

// Promotes a profile to the account default via the owner-scoped RPC.
export async function setDefaultProfileAction(profileId: string): Promise<ManagerActionResult> {
  if (!profileId) return { ok: false, error: "Missing profile." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_default_profile", { p_profile_id: profileId })
  if (error) return { ok: false, error: mapRpcError(error.message, DEFAULT_ERRORS) }

  revalidatePath(MANAGE_PATH)
  return { ok: true }
}

// Archives a profile via the owner-scoped RPC. When the profile being archived
// is the current default and other active profiles remain, a replacement
// default is required (enforced in SQL); the UI collects it and passes it here.
export async function archiveProfileAction(
  profileId: string,
  replacementDefaultId?: string,
): Promise<ManagerActionResult> {
  if (!profileId) return { ok: false, error: "Missing profile." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("archive_profile", {
    p_profile_id: profileId,
    p_replacement_default_id: replacementDefaultId ?? null,
  })
  if (error) return { ok: false, error: mapRpcError(error.message, ARCHIVE_ERRORS) }

  revalidatePath(MANAGE_PATH)
  return { ok: true }
}

// Starts a fresh profile-creation attempt from the manager. Resets onboarding
// state back to the first step with no active attempt and clears any stale
// draft, then hands off to the onboarding flow. Guarded against the active cap
// so the user gets a clear message instead of a mid-flow RPC rejection.
export async function createAnotherProfileAction(): Promise<ManagerActionResult> {
  const supabase = await createClient()
  const data = await loadProfileManagerData(supabase, null)
  if (!data) return { ok: false, error: "You need to sign in." }

  if (!data.canCreate) {
    return {
      ok: false,
      error: `You already have the maximum of ${data.maxActive} active profiles. Archive one to make room.`,
    }
  }

  await setOnboardingStep(supabase, "type", null)
  await clearDraft()
  redirect("/onboarding/type")
}

// Clears the working-context cookie (used when it may point at a now-archived
// profile). Exposed for completeness; safe to call at any time.
export async function clearActiveProfileAction(): Promise<void> {
  await clearActiveProfileCookie()
  revalidatePath(MANAGE_PATH)
}
