import { requireOnboardingStep } from "@/lib/onboarding/guard"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { TypeStep } from "@/components/onboarding/type-step"

export default async function OnboardingTypePage() {
  const ctx = await requireOnboardingStep("type")

  return (
    <OnboardingShell
      step="type"
      title="What are you setting up?"
      description="Pick the kind of profile you want to create. You can create others later."
    >
      <TypeStep initialType={ctx.draft.type} />
    </OnboardingShell>
  )
}
