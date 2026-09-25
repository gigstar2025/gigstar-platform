import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requirePlatformAdmin } from "@/lib/admin/auth"
import { getIssue } from "@/lib/admin/issues-queries"

import { IssueDetail } from "./issue-detail"

export const metadata = {
  title: "Issue · GigStar Admin",
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin()
  const { id } = await params

  const result = await getIssue(id)
  if (!result) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/issues"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All issues
      </Link>

      <IssueDetail issue={result.issue} comments={result.comments} />
    </div>
  )
}
