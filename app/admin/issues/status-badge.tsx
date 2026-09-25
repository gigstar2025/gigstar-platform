import { Badge } from "@/components/ui/badge"
import { statusLabel, type IssueStatus } from "@/lib/admin/issues"

const VARIANT: Record<IssueStatus, "default" | "secondary" | "outline"> = {
  open: "secondary",
  in_progress: "default",
  ready_for_signoff: "default",
  signed_off: "outline",
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return <Badge variant={VARIANT[status] ?? "secondary"}>{statusLabel(status)}</Badge>
}
