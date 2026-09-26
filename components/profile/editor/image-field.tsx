'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Library, Pencil, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MediaLibraryDialog } from './media-library-dialog'

interface Props {
  label: string
  value?: string
  onChange: (src: string | undefined) => void
  hint?: string
  aspect?: 'square' | 'wide'
  removable?: boolean
}

// Browser-local demo upload limits. Images are stored as data URLs inside the
// localStorage draft on THIS device only — nothing is uploaded to a server —
// so the cap is kept small to stay within the ~5MB localStorage budget.
const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function ImageField({ label, value, onChange, hint, aspect = 'wide', removable = true }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    setError(null)
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use PNG, JPEG, WebP, GIF or AVIF.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Image is too large (${formatMb(file.size)}). Maximum is ${formatMb(MAX_UPLOAD_BYTES)}.`)
      return
    }

    setReading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      onChange(dataUrl)
    } catch {
      setError('Could not read that image. Please try another file.')
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted',
            aspect === 'square' ? 'size-24' : 'aspect-video w-40',
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- value may be a local data: URL from an in-browser upload, which next/image cannot optimize.
            <img src={value || '/placeholder.svg'} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            aria-label={`Upload ${label}`}
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              // Reset so re-selecting the same file still fires onChange.
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={reading}>
            <Upload className="size-4" /> {reading ? 'Reading…' : value ? 'Replace' : 'Upload'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={reading}>
            {value ? <Pencil className="size-4" /> : <Library className="size-4" />} Choose from library
          </Button>
          {removable && value ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null)
                onChange(undefined)
              }}
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <MediaLibraryDialog
        open={open}
        current={value}
        onClose={() => setOpen(false)}
        onSelect={(src) => {
          setError(null)
          onChange(src)
        }}
      />
    </div>
  )
}
