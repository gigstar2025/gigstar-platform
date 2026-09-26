'use server'

// ---------------------------------------------------------------------------
// Server-backed profile avatar upload (PR-5c).
//
// Flow:
//   1. The uploaded file is stored in the public `profile-media` Storage bucket
//      under `<profileId>/avatar-<timestamp>.<ext>`. Storage RLS gates the
//      write to active members with content_contributor+ on that profile, so
//      an unauthorised caller is rejected at the database boundary here.
//   2. set_profile_avatar records the asset in media_assets and points
//      profiles.avatar_media_id at it, re-checking membership inside the
//      SECURITY DEFINER RPC (defence in depth).
//
// Both checks run in the database, so authorization does not depend on this
// action's own logic. Uses the request-bound (cookie session) Supabase client
// so the caller's auth.uid() drives every RLS decision.
// ---------------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { describeStorageUploadError } from '@/lib/profiles/avatar/upload-error'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MiB — matches the bucket file_size_limit.
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

export interface AvatarUploadResult {
  ok: boolean
  url?: string
  error?: string
  /**
   * Safe, non-secret diagnostic describing the exact failing step and storage
   * status/message. Surfaced so a production upload failure can be triaged
   * from the UI without server-log access. Never contains credentials.
   */
  detail?: string
}

export async function uploadProfileAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  const profileId = formData.get('profileId')
  const slug = formData.get('slug')
  const file = formData.get('file')

  if (typeof profileId !== 'string' || !profileId) {
    return { ok: false, error: 'Missing profile.' }
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose an image to upload.' }
  }

  const ext = EXT_BY_TYPE[file.type]
  if (!ext) {
    return { ok: false, error: 'Use a PNG, JPG, or WebP image.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Image must be 2MB or smaller.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in to upload.' }
  }

  const path = `${profileId}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('profile-media')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    // Classify the real storage failure instead of always blaming permissions.
    // An RLS rejection (not a member, or a missing INSERT policy) maps to
    // 'permission'; a missing bucket or transient error surfaces distinctly so
    // environment misconfiguration is not mislabeled as an access problem.
    const described = describeStorageUploadError(uploadError as { message?: string; status?: number; statusCode?: string | number })
    const detail = `step=storage.upload ${described.detail}`
    console.log('[v0] avatar upload storage error:', detail)
    return { ok: false, error: described.message, detail }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-media').getPublicUrl(path)

  const { error: rpcError } = await supabase.rpc('set_profile_avatar', {
    p_profile_id: profileId,
    p_storage_path: path,
    p_public_url: publicUrl,
    p_alt_text: null,
    p_width: null,
    p_height: null,
    p_byte_size: file.size,
  })

  if (rpcError) {
    const rpcAny = rpcError as { message?: string; code?: string; details?: string; hint?: string }
    const detail = [
      'step=set_profile_avatar',
      rpcAny.code ? `code=${rpcAny.code}` : '',
      rpcAny.message ? `msg=${rpcAny.message}` : '',
      rpcAny.details ? `details=${rpcAny.details}` : '',
    ]
      .filter(Boolean)
      .join(' ')
    console.log('[v0] set_profile_avatar rpc error:', detail)
    // Best-effort cleanup of the orphaned object; ignore failures.
    await supabase.storage.from('profile-media').remove([path])
    return { ok: false, error: 'Could not save the image to your profile.', detail }
  }

  if (typeof slug === 'string' && slug) {
    revalidatePath(`/p/${slug}`)
    revalidatePath(`/profile/${slug}/edit`)
  }
  revalidatePath('/')

  return { ok: true, url: publicUrl }
}
