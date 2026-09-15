"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { seedAction, type SeedActionState } from "./actions"

const INITIAL: SeedActionState = { status: "idle", message: "" }

export function SeedButton() {
  const [state, formAction, isPending] = useActionState(async () => seedAction(), INITIAL)

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Seeding…" : "Run seed"}
      </Button>
      {state.status !== "idle" ? (
        <p
          className={`text-xs ${state.status === "success" ? "text-muted-foreground" : "text-destructive"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
