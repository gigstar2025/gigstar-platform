"use server"

// ---------------------------------------------------------------------------
// Server actions for persisted module editing (PR-5a).
//
// This is the server-side replacement for the old localStorage draft store.
// It requires an authenticated session and delegates ownership enforcement to
// the SECURITY DEFINER save RPC. The full editing-panel UI that calls this is
// scoped to PR-5b; the action itself is the durable foundation.
// ---------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server"
import { isModuleKey, type ModuleKey } from "./registry"
import { saveModuleDraft, type SaveModuleResult } from "./persistence"

export async function saveModuleDraftAction(input: {
  profileId: string
  key: string
  content: unknown
  position?: number
  isHidden?: boolean
}): Promise<SaveModuleResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, errors: [{ path: "auth", message: "Authentication required" }] }
  }

  if (!isModuleKey(input.key)) {
    return { ok: false, errors: [{ path: "key", message: `Unknown module: ${input.key}` }] }
  }

  return saveModuleDraft({
    profileId: input.profileId,
    key: input.key as ModuleKey,
    content: input.content,
    position: input.position,
    isHidden: input.isHidden,
  })
}
