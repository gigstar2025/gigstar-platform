import type React from "react"
import Link from "next/link"

import { requirePlatformAdmin } from "@/lib/admin/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guards every /admin/* route. Non-admins are redirected before any admin
  // UI or data is rendered.
  await requirePlatformAdmin()

  return (
    <div className="min-h-svh bg-background font-sans text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            GigStar Admin
          </Link>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <nav className="flex flex-col gap-1" aria-label="Admin sections">
            <Link
              href="/admin/confirmation-email"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Confirmation Email
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
