"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import {
  checkHandleAction,
  submitHandleAction,
  type OnboardingActionState,
} from "@/app/(onboarding)/onboarding/actions"
import { SLUG_MAX, validateSlugShape } from "@/lib/onboarding/validation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Availability =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; message: string }

export function HandleStep({ initialSlug }: { initialSlug: string }) {
  const [state, formAction, isPending] = useActionState<OnboardingActionState, FormData>(
    submitHandleAction,
    {},
  )
  const [slug, setSlug] = useState(initialSlug)
  const [availability, setAvailability] = useState<Availability>({ kind: "idle" })
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const value = slug.trim().toLowerCase()
    const shapeError = validateSlugShape(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (shapeError) {
      setAvailability(value.length === 0 ? { kind: "idle" } : { kind: "unavailable", message: shapeError })
      return
    }

    setAvailability({ kind: "checking" })
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await checkHandleAction(value)
        setAvailability(
          result.available
            ? { kind: "available" }
            : { kind: "unavailable", message: result.message ?? "That handle is not available." },
        )
      })
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [slug])

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Handle</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">gigstar.com/</span>
          <Input
            id="slug"
            name="slug"
            type="text"
            required
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={SLUG_MAX}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-describedby="slug-status"
          />
        </div>
        <p id="slug-status" className="text-sm" aria-live="polite">
          {availability.kind === "checking" ? (
            <span className="text-muted-foreground">Checking availability…</span>
          ) : availability.kind === "available" ? (
            <span className="text-primary">Handle is available.</span>
          ) : availability.kind === "unavailable" ? (
            <span className="text-destructive">{availability.message}</span>
          ) : (
            <span className="text-muted-foreground">
              Lowercase letters, numbers and single hyphens.
            </span>
          )}
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || availability.kind === "unavailable"}>
          {isPending ? "Saving…" : "Continue"}
        </Button>
        <Link href="/onboarding/details" className={buttonVariants({ variant: "ghost" })}>
          Back
        </Link>
      </div>
    </form>
  )
}
