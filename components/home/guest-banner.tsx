import { Button } from '@/components/ui/button'

// Guest-access strip — the homepage is fully viewable without signing in.
// Sign-in / create-account are offered, never forced.
export function GuestBanner() {
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
