import { redirect } from "next/navigation"
import { requireOnboardingStep } from "@/lib/onboarding/guard"
import { PROFILE_TYPE_OPTIONS } from "@/lib/onboarding/constants"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { ReviewStep } from "@/components/onboarding/review-step"

export default async function OnboardingReviewPage() {
  const ctx = await requireOnboardingStep("review")
  const { draft } = ctx

  // The draft cookie carries the field values. If it is missing a required
  // piece (expired/cleared), send the user back to the earliest incomplete
  // step rather than rendering a partial summary.
  if (!draft.type) redirect("/onboarding/type")
  if (!draft.displayName) redirect("/onboarding/details")
  if (!draft.slug) redirect("/onboarding/handle")

  const typeLabel =
    PROFILE_TYPE_OPTIONS.find((option) => option.value === draft.type)?.label ?? draft.type

  return (
    <OnboardingShell
      step="review"
      title="Review and create"
      description="Check everything looks right. You can edit any field before creating your profile."
    >
      <ReviewStep
        summary={{
          typeLabel,
          displayName: draft.displayName,
          handle: draft.slug,
          tagline: draft.tagline,
          location: draft.locationLabel,
        }}
      />
    </OnboardingShell>
  )
}
