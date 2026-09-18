"use client"

import { useActionState } from "react"
import Link from "next/link"
import { createProfileAction, type OnboardingActionState } from "@/app/(onboarding)/onboarding/actions"
import { Button, buttonVariants } from "@/components/ui/button"

type ReviewSummary = {
  typeLabel: string
  displayName: string
  handle: string
  tagline?: string
  location?: string
}

export function ReviewStep({ summary }: { summary: ReviewSummary }) {
  const [state, formAction, isPending] = useActionState<OnboardingActionState, FormData>(
    createProfileAction,
    {},
  )

  const rows: Array<{ label: string; value: string; editHref: string }> = [
    { label: "Type", value: summary.typeLabel, editHref: "/onboarding/type" },
    { label: "Display name", value: summary.displayName, editHref: "/onboarding/details" },
    { label: "Location", value: summary.location ?? "—", editHref: "/onboarding/details" },
    { label: "Tagline", value: summary.tagline ?? "—", editHref: "/onboarding/details" },
    { label: "Handle", value: `gigstar.com/${summary.handle}`, editHref: "/onboarding/handle" },
  ]

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <dl className="divide-y divide-border rounded-lg border border-border bg-card">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</dt>
              <dd className="truncate text-card-foreground">{row.value}</dd>
            </div>
            <Link
              href={row.editHref}
              className="shrink-0 text-sm font-medium text-foreground underline underline-offset-4"
            >
              Edit
            </Link>
          </div>
        ))}
      </dl>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating profile…" : "Create profile"}
        </Button>
        <Link href="/onboarding/handle" className={buttonVariants({ variant: "ghost" })}>
          Back
        </Link>
      </div>
    </form>
  )
}
