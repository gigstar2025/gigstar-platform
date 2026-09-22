'use client'

import { useRef, useState } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Find gigs', href: '/gigs' },
  { label: 'Profiles', href: '/profiles' },
  { label: 'Profile editor', href: '/profile/luna-vega/edit' },
  { label: 'For Artists', href: '/#artists' },
  { label: 'For Venues', href: '/#venues' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
]

// Development shortcuts to each example profile type.
const PROFILE_EXAMPLES = [
  { label: 'DJ profile', href: '/p/luna-vega' },
  { label: 'Artist / band profile', href: '/p/echo-atlas' },
  { label: 'Venue profile', href: '/p/the-lumen-rooms' },
  { label: 'Event organiser profile', href: '/p/nightform' },
]

// Account entry points. These route to authenticated, server-guarded pages —
// an unauthenticated visitor who follows them is redirected to sign in — so
// the links are safe to render statically without the header knowing the user.
const ACCOUNT_LINKS = [
  { label: 'Your profiles', href: '/profiles/manage' },
  { label: 'Create a profile', href: '/onboarding' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)

  // Close the desktop Account dropdown on Escape and return focus to its
  // trigger. Scoped to the Account container's onKeyDown so it only reacts
  // when focus is inside that open dropdown — the mobile section and the
  // Profile examples dropdown are unaffected.
  const handleAccountKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && accountOpen) {
      event.stopPropagation()
      setAccountOpen(false)
      accountTriggerRef.current?.focus()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <a href="/" className="shrink-0" aria-label="GigStar home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setExamplesOpen((v) => !v)}
              aria-expanded={examplesOpen}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Profile examples
              <ChevronDown className={cn('size-4 transition-transform', examplesOpen && 'rotate-180')} />
            </button>
            {examplesOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setExamplesOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-card p-1.5 shadow-lg">
                  {PROFILE_EXAMPLES.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setExamplesOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative" onKeyDown={handleAccountKeyDown}>
            <button
              ref={accountTriggerRef}
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Account
              <ChevronDown className={cn('size-4 transition-transform', accountOpen && 'rotate-180')} />
            </button>
            {accountOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setAccountOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-card p-1.5 shadow-lg">
                  {ACCOUNT_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href="/auth/login" />}>
            Log in
          </Button>
          <Button size="sm" nativeButton={false} render={<a href="/auth/sign-up" />}>
            Get started
          </Button>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-md text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}

            <p className="mt-3 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile examples
            </p>
            {PROFILE_EXAMPLES.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}

            <p className="mt-3 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            {ACCOUNT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<a href="/auth/login" />}
                onClick={() => setOpen(false)}
              >
                Log in
              </Button>
              <Button
                className="w-full"
                nativeButton={false}
                render={<a href="/auth/sign-up" />}
                onClick={() => setOpen(false)}
              >
                Get started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
