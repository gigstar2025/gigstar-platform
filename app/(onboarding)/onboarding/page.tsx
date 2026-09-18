import { redirect } from "next/navigation"
import { loadOnboardingContext, resolveResumeDestination } from "@/lib/onboarding/guard"

// Resume entry point. Sends a brand-new user to the first step, an in-progress
// user to the furthest step they reached, and a completed user to the editor.
export default async function OnboardingDispatcherPage() {
  const ctx = await loadOnboardingContext()
  redirect(await resolveResumeDestination(ctx))
}
