import type { ReactNode } from "react"
import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from "@/lib/onboarding/constants"

const STEP_LABELS: Record<OnboardingStep, string> = {
  type: "Type",
  details: "Details",
  handle: "Handle",
  review: "Review",
}

// Presentational wrapper shared by every onboarding step: a compact progress
// indicator plus the step's title, description and form. Server component — no
// interactivity of its own.
export function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: OnboardingStep
  title: string
  description: string
  children: ReactNode
}) {
  const activeIndex = stepIndex(step)

  return (
    <main className="flex min-h-svh flex-col items-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="text-sm font-medium text-muted-foreground">GigStar</p>

        <ol className="mt-4 flex items-center gap-2" aria-label="Onboarding progress">
          {ONBOARDING_STEPS.map((s, index) => {
            const isDone = index < activeIndex
            const isActive = index === activeIndex
            return (
              <li key={s} className="flex flex-1 flex-col gap-1.5">
                <span
                  aria-hidden="true"
                  className={
                    "h-1.5 rounded-full " +
                    (isDone || isActive ? "bg-primary" : "bg-border")
                  }
                />
                <span
                  className={
                    "text-xs " +
                    (isActive ? "font-semibold text-foreground" : "text-muted-foreground")
                  }
                  aria-current={isActive ? "step" : undefined}
                >
                  {STEP_LABELS[s]}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold text-balance">{title}</h1>
          <p className="mt-2 text-pretty text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
