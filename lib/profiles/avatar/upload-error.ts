// ---------------------------------------------------------------------------
// Classifies a Supabase Storage upload error into an accurate, user-facing
// reason. The previous behaviour mapped EVERY storage failure to "you may not
// have permission", which hid genuine misconfiguration (missing bucket, missing
// RLS policy applied only to some environments) behind a permission message and
// made production incidents hard to triage.
//
// Size and MIME are already validated before upload, so a storage error here is
// one of: RLS/permission denial, missing-bucket/config, an object conflict, or
// an unknown transient failure. Each maps to a distinct message while the raw
// reason is preserved for server logs.
// ---------------------------------------------------------------------------

export type UploadErrorKind = 'permission' | 'missing_bucket' | 'conflict' | 'unknown'

export interface DescribedUploadError {
  kind: UploadErrorKind
  message: string
}

interface RawStorageError {
  message?: string
  status?: number
  statusCode?: string | number
}

export function describeStorageUploadError(raw: RawStorageError | null | undefined): DescribedUploadError {
  const rawMessage = raw?.message ?? ''
  const message = rawMessage.toLowerCase()
  const status = Number(raw?.status ?? raw?.statusCode ?? 0)

  if (
    status === 401 ||
    status === 403 ||
    message.includes('row-level security') ||
    message.includes('row level security') ||
    message.includes('unauthorized') ||
    message.includes('permission')
  ) {
    return {
      kind: 'permission',
      message: 'Upload failed. You may not have permission to edit this profile.',
    }
  }

  if (status === 404 || message.includes('bucket not found') || message.includes('not found')) {
    return {
      kind: 'missing_bucket',
      message: 'Upload failed: profile media storage is not available right now. Please try again later or contact support.',
    }
  }

  if (status === 409 || message.includes('already exists') || message.includes('duplicate')) {
    return {
      kind: 'conflict',
      message: 'Upload failed: that image already exists. Please try again.',
    }
  }

  return {
    kind: 'unknown',
    message: rawMessage
      ? `Upload failed: ${rawMessage}`
      : 'Upload failed. Please try again.',
  }
}
