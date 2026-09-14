"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Frontend-only mailing-list signup. Shows a local confirmation; nothing is sent.
export function MailingListForm() {
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-primary/15 px-4 py-2.5 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" />
        You&apos;re on the list (demo) — no email was stored.
      </p>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setDone(true)
      }}
      className="flex w-full gap-2 md:w-auto"
      aria-label="Mailing list signup"
    >
      <Input
        type="email"
        required
        placeholder="you@email.com"
        aria-label="Email address"
        className="h-10 md:w-56"
      />
      <Button type="submit">Subscribe</Button>
    </form>
  )
}
