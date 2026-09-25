import Link from "next/link"
import { Mail, ListChecks } from "lucide-react"

import { requirePlatformAdmin } from "@/lib/admin/auth"

export const metadata = {
  title: "Admin · GigStar",
}

// The admin tool registry. Add future admin pages here — each becomes a card on
// the entry point and inherits the shared /admin layout guard automatically.
const adminTools = [
  {
    href: "/admin/issues",
    title: "Issues",
    description: "Track bugs, improvements, and tasks with discussion, fixes, and sign-off.",
    icon: ListChecks,
  },
  {
    href: "/admin/confirmation-email",
    title: "Confirmation Email",
    description: "Edit the subject and wording of the signup confirmation email.",
    icon: Mail,
  },
]

export default async function AdminIndexPage() {
  // Re-check at the data layer: App Router renders layouts and pages in
  // parallel, so the layout guard alone is not a substitute for guarding here.
  await requirePlatformAdmin()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Admin</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground text-pretty">
          Manage GigStar platform settings. More tools will appear here as they are added.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {adminTools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-5 text-card-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                <tool.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{tool.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{tool.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
