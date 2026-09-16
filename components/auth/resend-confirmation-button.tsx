"use client"

import type React from "react"

import { useState, useTransition } from "react"

import { resendConfirmation } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// The email is intentionally NOT taken from the URL or any persistent store.
// The user re-enters it here so the address never lands in browser history,
// referrer headers, analytics, or server access logs. The server action is
// enumeration-safe and always returns the same generic message.
export function ResendConfirmationForm() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await resendConfirmation(email)
      setMessage(result.message)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="resend-email">Email</Label>
      <Input
        id="resend-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Button type="submit" variant="outline" className="w-full" disabled={isPending || !email}>
        {isPending ? "Sending…" : "Resend confirmation email"}
      </Button>
      {message ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </form>
  )
}
