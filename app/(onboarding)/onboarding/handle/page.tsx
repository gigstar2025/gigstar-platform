import { requireOnboardingStep } from "@/lib/onboarding/guard"
import { slugify } from "@/lib/onboarding/validation"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { HandleStep } from "@/components/onboarding/handle-step"

export default async function OnboardingHandlePage() {
  const ctx = await requireOnboardingStep("handle")
  const initialSlug = ctx.draft.slug ?? slugify(ctx.draft.displayName ?? "")

  return (
    <OnboardingShell
      step="handle"
      title="Choose your handle"
      description="This becomes your public link. Pick something short and memorable."
    >
      <HandleStep initialSlug={initialSlug} />
    </OnboardingShell>
  )
}
