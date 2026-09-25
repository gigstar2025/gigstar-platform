import Link from "next/link"

import { requirePlatformAdmin } from "@/lib/admin/auth"
import { categoryLabel } from "@/lib/admin/issues"
import { listIssues } from "@/lib/admin/issues-queries"
import { Badge } from "@/components/ui/badge"

import { NewIssueForm } from "./new-issue-form"
import { StatusBadge } from "./status-badge"

export const metadata = {
  title: "Issues · GigStar Admin",
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function IssuesPage() {
  await requirePlatformAdmin()
  const issues = await listIssues()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Issues</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground text-pretty">
          Record bugs, improvements, and tasks. Every admin is emailed when an issue is created, discussed, fixed, or
          signed off.
        </p>
      </div>

      <NewIssueForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {issues.length === 0 ? "No issues yet" : `${issues.length} issue${issues.length === 1 ? "" : "s"}`}
        </h2>

        {issues.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link
                  href={`/admin/issues/${issue.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-medium text-pretty">{issue.title}</span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{categoryLabel(issue.category)}</Badge>
                    <span>{issue.created_by_email ?? "Unknown"}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(issue.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
