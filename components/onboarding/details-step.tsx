"use client"

import { useActionState } from "react"
import Link from "next/link"
import { submitDetailsAction, type OnboardingActionState } from "@/app/(onboarding)/onboarding/actions"
import { DISPLAY_NAME_MAX, TAGLINE_MAX } from "@/lib/onboarding/validation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function DetailsStep({
  townNames,
  initialDisplayName,
  initialTagline,
  initialTown,
}: {
  townNames: string[]
  initialDisplayName?: string
  initialTagline?: string
  initialTown?: string
}) {
  const [state, formAction, isPending] = useActionState<OnboardingActionState, FormData>(
    submitDetailsAction,
    {},
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="off"
          defaultValue={initialDisplayName ?? ""}
          placeholder="e.g. Nova Sound"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="town">Town</Label>
        <Input
          id="town"
          name="town"
          type="text"
          required
          list="onboarding-town-list"
          autoComplete="off"
          defaultValue={initialTown ?? ""}
          placeholder="Start typing your town"
        />
        <datalist id="onboarding-town-list">
          {townNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          We only show your town, never a precise location.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tagline">
          Tagline <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="tagline"
          name="tagline"
          rows={2}
          maxLength={TAGLINE_MAX}
          defaultValue={initialTagline ?? ""}
          placeholder="One line about what you do"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Continue"}
        </Button>
        <Link href="/onboarding/type" className={buttonVariants({ variant: "ghost" })}>
          Back
        </Link>
      </div>
    </form>
  )
}
