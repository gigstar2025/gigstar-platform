"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { PASSWORD_RESET_LINK_INVALID } from "@/lib/auth/errors"
import { buttonVariants, Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  // Whether the recovery session from the email link is present. The callback
  // exchanges the code for a session cookie before forwarding here, so a valid
  // arrival has an authenticated user.
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth
      .getUser()
      .then((result: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
        setHasSession(!result.error && Boolean(result.data.user))
      })
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      // A missing session here almost always means the recovery link expired or
      // was already used. Log the technical cause; show generic guidance.
      console.error("[v0] updatePassword failed:", updateError.message)
      setError(PASSWORD_RESET_LINK_INVALID)
      setIsLoading(false)
      return
    }

    setDone(true)
    setIsLoading(false)
  }

  if (done) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Password updated</CardTitle>
            <CardDescription>
              Your password has been changed and you&apos;re now signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/post-login" className={buttonVariants({ className: "w-full" })}>
              Continue
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <CardDescription>Choose a new password for your GigStar account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasSession === false ? (
            <>
              <p className="text-sm text-destructive" role="alert">
                {PASSWORD_RESET_LINK_INVALID}
              </p>
              <Link
                href="/auth/forgot-password"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                Request a new link
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={isLoading || hasSession === null}>
                {isLoading ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
