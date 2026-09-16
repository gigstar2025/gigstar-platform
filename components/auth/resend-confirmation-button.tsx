"use client"

import { useState, useTransition } from "react"

import { resendConfirmation } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function ResendConfirmationButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending || !email}
        onClick={() =>
          startTransition(async () => {
            const result = await resendConfirmation(email)
            setMessage(result.message)
          })
        }
      >
        {isPending ? "Sending…" : "Resend confirmation email"}
      </Button>
      {message ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
