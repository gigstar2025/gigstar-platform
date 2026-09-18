import "server-only"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getCompletedSlug, readOnboardingState, type OnboardingStateRow } from "./service"
import { readDraft, type OnboardingDraft } from "./draft"
import { stepIndex, stepPath, type OnboardingStep } from "./constants"

export type OnboardingContext = {
  supabase: SupabaseClient
  userId: string
  state: OnboardingStateRow | null
  draft: OnboardingDraft
  activeAttemptId: string | null
}

// Shared session guard for every onboarding surface. Unauthenticated callers
// are sent to sign-in. Returns the RLS-bound client plus the current server
// state and the resumable draft.
export async function loadOnboardingContext(): Promise<OnboardingContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const state = await readOnboardingState(supabase)
  const draft = await readDraft()
  return {
    supabase,
    userId: user.id,
    state,
    draft,
    activeAttemptId: state?.active_attempt_id ?? null,
  }
}

// Where a completed or in-progress user should be sent from the dispatcher.
export async function resolveResumeDestination(ctx: OnboardingContext): Promise<string> {
  const current = ctx.state?.current_step ?? "type"
  if (current === "completed") {
    const slug = ctx.activeAttemptId
      ? await getCompletedSlug(ctx.supabase, ctx.activeAttemptId)
      : null
    return slug ? `/profile/${slug}/edit` : "/"
  }
  return stepPath(current)
}

// Guard a concrete step page. Redirects a completed user to the editor, and
// prevents skipping ahead of the furthest step reached (back navigation to an
// already-reached step is always allowed, so earlier steps stay editable).
export async function requireOnboardingStep(step: OnboardingStep): Promise<OnboardingContext> {
  const ctx = await loadOnboardingContext()
  const current = ctx.state?.current_step ?? "type"

  if (current === "completed") {
    redirect(await resolveResumeDestination(ctx))
  }

  const reached = stepIndex(current)
  const requested = stepIndex(step)
  if (requested > reached) {
    redirect(stepPath(current))
  }

  return ctx
}
