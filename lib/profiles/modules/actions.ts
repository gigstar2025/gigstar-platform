"use server"

// ---------------------------------------------------------------------------
// Server actions for persisted module editing (PR-5a).
//
// This is the server-side replacement for the old localStorage draft store.
// It requires an authenticated session and delegates ownership enforcement to
// the SECURITY DEFINER save RPC. The full editing-panel UI that calls this is
// scoped to PR-5b; the action itself is the durable foundation.
// ---------------------------------------------------------------------------

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isModuleKey, type ModuleKey } from "./registry"
import {
  publishModules,
  saveModuleDraft,
  type PublishModulesResult,
  type SaveModuleResult,
} from "./persistence"

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

/**
 * Publish every module draft for a profile (owner only; enforced inside the
 * RPC). When a slug is supplied, both the editor and the public page are
 * revalidated so published changes appear immediately.
 */
export async function publishModulesAction(input: {
  profileId: string
  slug?: string
}): Promise<PublishModulesResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: "Authentication required" }
  }

  const result = await publishModules(input.profileId)

  if (result.ok && input.slug) {
    revalidatePath(`/p/${input.slug}`)
    revalidatePath(`/profile/${input.slug}`)
    revalidatePath(`/profile/${input.slug}/edit`)
  }

  return result
}
