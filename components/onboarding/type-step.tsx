"use client"

import { useActionState } from "react"
import type { ProfileType } from "@/lib/db/types"
import { PROFILE_TYPE_OPTIONS } from "@/lib/onboarding/constants"
import { selectTypeAction, type OnboardingActionState } from "@/app/(onboarding)/onboarding/actions"
import { Button } from "@/components/ui/button"

export function TypeStep({ initialType }: { initialType?: ProfileType }) {
  const [state, formAction, isPending] = useActionState<OnboardingActionState, FormData>(
    selectTypeAction,
    {},
  )

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choose a profile type</legend>
        {PROFILE_TYPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              type="radio"
              name="type"
              value={option.value}
              defaultChecked={initialType === option.value}
              className="mt-1 size-4 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-card-foreground">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Continue"}
      </Button>
    </form>
  )
}
