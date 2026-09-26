'use client'

// ---------------------------------------------------------------------------
// Profile avatar/photo uploader (PR-5c) — the real, server-backed control.
//
// Uploads the selected image to Supabase Storage and persists the reference on
// the profile via uploadProfileAvatarAction. Shows a live preview, an
// uploading state, and errors. Replacing simply uploads a new image; the
// profile always points at the latest asset.
// ---------------------------------------------------------------------------

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, ImageIcon, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadProfileAvatarAction } from '@/lib/profiles/avatar/actions'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

interface Props {
  profileId: string
  slug: string
  initialAvatarUrl: string | null
  isLogo: boolean
}

type Status = 'idle' | 'uploading' | 'saved' | 'error'

export function AvatarUploader({ profileId, slug, initialAvatarUrl, isLogo }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const label = isLogo ? 'Logo' : 'Profile photo'

  function handleFile(file: File) {
    setError(null)
    setDetail(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus('error')
      setError('Use a PNG, JPG, or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setStatus('error')
      setError('Image must be 2MB or smaller.')
      return
    }

    // Optimistic local preview while the upload runs.
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setStatus('uploading')

    const formData = new FormData()
    formData.set('profileId', profileId)
    formData.set('slug', slug)
    formData.set('file', file)

    startTransition(async () => {
      const result = await uploadProfileAvatarAction(formData)
      URL.revokeObjectURL(localPreview)
      if (result.ok && result.url) {
        setPreviewUrl(result.url)
        setStatus('saved')
        router.refresh()
        setTimeout(() => setStatus('idle'), 2600)
      } else {
        setPreviewUrl(initialAvatarUrl)
        setStatus('error')
        setError(result.error ?? 'Upload failed.')
        setDetail(result.detail ?? null)
      }
    })
  }

  const busy = isPending || status === 'uploading'

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-semibold text-foreground">{label}</h2>
        <p className="text-sm text-muted-foreground">
          Shown in your profile header and on discovery cards. Saved to your profile on our servers and visible to
          everyone.
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
          aria-hidden={previewUrl ? undefined : true}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl || "/placeholder.svg"} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          )}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="size-6 animate-spin text-foreground" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Reset after reading so re-selecting the same file re-triggers change.
              const el = e.target
              if (file) handleFile(file)
              el.value = ''
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <Upload className="size-4" aria-hidden="true" />
              {previewUrl ? 'Replace' : 'Upload'} {isLogo ? 'logo' : 'photo'}
            </Button>
            {status === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="size-3.5" aria-hidden="true" /> Saved
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Up to 2MB.</p>
          {status === 'error' && error ? (
            <div className="flex flex-col gap-1">
              <p className="inline-flex items-start gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
              {detail ? (
                <p className="pl-5 font-mono text-[11px] leading-relaxed text-muted-foreground break-all">
                  {detail}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
