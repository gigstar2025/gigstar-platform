import type { MembershipRole } from "@/lib/db/types"

// Roles whose members may edit a profile's content, appear in the
// account-scoped profile editor picker, and open the profile editor directly.
//
// Other active roles (analyst, event_manager, content_contributor, etc.) can
// participate in a profile but must NOT see an Edit action or be able to open
// the editor via a direct /profile/[slug]/edit request. This list is the
// single source of truth for that decision, shared by the manage listing and
// the edit route's server-side authorization check.
export const EDITABLE_MEMBERSHIP_ROLES: readonly MembershipRole[] = [
  "owner",
  "administrator",
  "editor",
]

export function roleCanEdit(role: MembershipRole | null | undefined): boolean {
  if (!role) return false
  return EDITABLE_MEMBERSHIP_ROLES.includes(role)
}

// Keep only rows whose membership role permits editing. Preserves input order.
export function filterEditable<T extends { role: MembershipRole }>(rows: readonly T[]): T[] {
  return rows.filter((row) => roleCanEdit(row.role))
}
