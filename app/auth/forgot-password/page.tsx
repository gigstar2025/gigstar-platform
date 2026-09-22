"use client"

import type React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"

import { requestPasswordReset } from "@/app/auth/actions"
import { buttonVariants, Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      // The action is enumeration-safe and always returns the same generic
      // message, so we surface exactly what it returns.
      const result = await requestPasswordReset(email)
      setMessage(result.message)
    })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter the email address for your account and we&apos;ll send you a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" disabled={isPending || !email}>
              {isPending ? "Sending…" : "Send reset link"}
            </Button>
            {message ? (
              <p className="text-center text-sm text-muted-foreground" role="status">
                {message}
              </p>
            ) : null}
          </form>
          <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
