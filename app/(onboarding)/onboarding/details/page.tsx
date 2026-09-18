import { requireOnboardingStep } from "@/lib/onboarding/guard"
import { getTownNames } from "@/lib/geo/location"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { DetailsStep } from "@/components/onboarding/details-step"

export default async function OnboardingDetailsPage() {
  const ctx = await requireOnboardingStep("details")
  const townNames = getTownNames()

  return (
    <OnboardingShell
      step="details"
      title="Tell us the basics"
      description="This is what people will see first. You can refine everything in the editor afterwards."
    >
      <DetailsStep
        townNames={townNames}
        initialDisplayName={ctx.draft.displayName}
        initialTagline={ctx.draft.tagline}
        initialTown={ctx.draft.locationLabel}
      />
    </OnboardingShell>
  )
}
