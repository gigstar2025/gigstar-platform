'use client'

import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/supabase/use-user'

// Guest-access strip — the homepage is fully viewable without signing in.
// Sign-in / create-account are offered, never forced. This mirrors the header's
// auth state (same useUser hook) so an authenticated visitor is never told they
// are "browsing as a guest".
export function GuestBanner() {
  const { user, loading } = useUser()

  // Match the header: hold the strip's height while the session resolves so the
  // page doesn't jump, then decide what to show once we know the auth state.
  if (loading) {
    return (
      <div className="border-b border-border/60 bg-muted/30" aria-hidden>
        <div className="mx-auto flex h-[57px] max-w-6xl items-center px-4 sm:px-6">
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  // Signed in: nothing to prompt — the header already reflects the session.
  if (user) return null

  return (
    <div className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">You&apos;re browsing as a guest.</span> Like, save and follow
          freely — create an account to keep them.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<a href="/auth/login" />}>
            Sign in
          </Button>
          <Button size="sm" nativeButton={false} render={<a href="/auth/sign-up" />}>
            Create account
          </Button>
        </div>
      </div>
    </div>
  )
}
