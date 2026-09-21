import "server-only"

// ---------------------------------------------------------------------------
// Persisted module data-access layer (PR-5a).
//
// Replaces the previous localStorage / in-memory module storage: module content
// now lives in the `profile_modules` table (draft_content + published_content).
//
// Least-privilege model (see migrations 0004/0010/0014):
//   * PUBLIC reads of PUBLISHED, non-hidden module content go through the
//     ordinary anon SELECT grant + RLS policy on profile_modules.
//   * EDITOR reads (incl. draft_content) and WRITES go through the SECURITY
//     DEFINER RPCs get_profile_modules_for_editor / save_profile_module_draft,
//     because anon/authenticated have no direct draft_content SELECT/INSERT.
// ---------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server"
import { isModuleKey, type ModuleKey } from "./registry"
import { validateModuleContent, type ValidationError } from "./content"

export interface PublishedModule {
  key: ModuleKey
  position: number
  content: unknown
}

export interface EditorModule {
  key: ModuleKey
  position: number
  isHidden: boolean
  draftContent: unknown
  publishedContent: unknown
  updatedAt: string | null
}

/**
 * Published, visible modules for a public profile page, ordered by position.
 * Uses the anon-readable columns only; drafts are never exposed here.
 */
export async function getPublishedModules(profileId: string): Promise<PublishedModule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profile_modules")
    .select("module_key, position, published_content, is_hidden")
    .eq("profile_id", profileId)
    .eq("is_hidden", false)
    .not("published_content", "is", null)
    .order("position", { ascending: true })

  if (error) throw new Error(`Failed to load published modules: ${error.message}`)

  return (data ?? [])
    .filter((row) => isModuleKey(row.module_key))
    .map((row) => ({
      key: row.module_key as ModuleKey,
      position: row.position as number,
      content: row.published_content as unknown,
    }))
}

/**
 * All module rows for the editor (including draft_content). Requires the caller
 * to be content_contributor+ on the profile; enforced inside the RPC.
 */
export async function getEditorModules(profileId: string): Promise<EditorModule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_profile_modules_for_editor", {
    p_profile_id: profileId,
  })

  if (error) throw new Error(`Failed to load editor modules: ${error.message}`)

  return (data ?? [])
    .filter((row: { module_key: string }) => isModuleKey(row.module_key))
    .map((row: Record<string, unknown>) => ({
      key: row.module_key as ModuleKey,
      position: row.position as number,
      isHidden: Boolean(row.is_hidden),
      draftContent: row.draft_content as unknown,
      publishedContent: row.published_content as unknown,
      updatedAt: (row.updated_at as string | null) ?? null,
    }))
}

export type SaveModuleResult =
  | { ok: true; moduleId: string }
  | { ok: false; errors: ValidationError[] }

/**
 * Validate + upsert a module's draft content. Ownership is enforced by the
 * SECURITY DEFINER RPC; content shape is validated here first so invalid data
 * never reaches the database.
 */
export async function saveModuleDraft(input: {
  profileId: string
  key: ModuleKey
  content: unknown
  position?: number
  isHidden?: boolean
}): Promise<SaveModuleResult> {
  const validation = validateModuleContent(input.key, input.content)
  if (!validation.ok) return { ok: false, errors: validation.errors }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("save_profile_module_draft", {
    p_profile_id: input.profileId,
    p_module_key: input.key,
    p_content: validation.value,
    p_position: input.position ?? null,
    p_is_hidden: input.isHidden ?? null,
  })

  if (error) {
    return { ok: false, errors: [{ path: "rpc", message: error.message }] }
  }
  return { ok: true, moduleId: data as string }
}
