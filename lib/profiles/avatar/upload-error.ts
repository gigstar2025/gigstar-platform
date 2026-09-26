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
  /**
   * Safe, non-secret diagnostic string (kind + HTTP status/code + raw storage
   * message). Storage error messages describe the failure class only
   * (e.g. "new row violates row-level security policy", "Bucket not found")
   * and never contain credentials, so they are safe to surface to the client
   * and logs to make production incidents diagnosable without log access.
   */
  detail: string
}

interface RawStorageError {
  message?: string
  status?: number
  statusCode?: string | number
}

function buildDetail(kind: UploadErrorKind, raw: RawStorageError | null | undefined): string {
  const parts = [`kind=${kind}`]
  const status = raw?.status ?? raw?.statusCode
  if (status !== undefined && status !== null && `${status}` !== '0' && `${status}` !== '') {
    parts.push(`status=${status}`)
  }
  const rawMessage = raw?.message?.trim()
  if (rawMessage) {
    parts.push(`msg=${rawMessage}`)
  }
  return parts.join(' ')
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
      detail: buildDetail('permission', raw),
    }
  }

  if (status === 404 || message.includes('bucket not found') || message.includes('not found')) {
    return {
      kind: 'missing_bucket',
      message: 'Upload failed: profile media storage is not available right now. Please try again later or contact support.',
      detail: buildDetail('missing_bucket', raw),
    }
  }

  if (status === 409 || message.includes('already exists') || message.includes('duplicate')) {
    return {
      kind: 'conflict',
      message: 'Upload failed: that image already exists. Please try again.',
      detail: buildDetail('conflict', raw),
    }
  }

  return {
    kind: 'unknown',
    message: rawMessage
      ? `Upload failed: ${rawMessage}`
      : 'Upload failed. Please try again.',
    detail: buildDetail('unknown', raw),
  }
}
