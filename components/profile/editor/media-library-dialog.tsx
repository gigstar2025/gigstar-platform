'use client'

import { useRef, useState } from 'react'
import { Check, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MEDIA_LIBRARY } from '@/lib/profiles/editor/demo-account'
import { EditorModal } from './editor-modal'

interface Props {
  open: boolean
  current?: string
  onClose: () => void
  onSelect: (src: string) => void
}

/**
 * Prototype media library: pick from curated in-repo images or "upload" a
 * local file (read into a data URL, kept only in the in-memory draft — nothing
 * is sent anywhere).
 */
export function MediaLibraryDialog({ open, current, onClose, onSelect }: Props) {
  const [picked, setPicked] = useState<string | undefined>(current)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPicked(String(reader.result))
    reader.readAsDataURL(file)
  }

  function confirm() {
    if (picked) onSelect(picked)
    onClose()
  }

  const isUploaded = picked && !MEDIA_LIBRARY.some((m) => m.src === picked)

  return (
    <EditorModal
      open={open}
      onClose={onClose}
      title="Media library"
      description="Choose an image from the library or upload one from this device."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!picked}>
            Use image
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Upload from device
          </Button>
          {isUploaded ? (
            <span className="ml-3 text-xs text-muted-foreground">Uploaded image ready to use.</span>
          ) : null}
        </div>

        {isUploaded ? (
          <div className="overflow-hidden rounded-lg border border-primary">
            <img src={picked || '/placeholder.svg'} alt="Uploaded preview" className="max-h-48 w-full object-cover" />
          </div>
        ) : null}

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEDIA_LIBRARY.map((asset) => {
            const selected = picked === asset.src
            return (
              <li key={asset.src}>
                <button
                  type="button"
                  onClick={() => setPicked(asset.src)}
                  aria-pressed={selected}
                  className={cn(
                    'group relative block w-full overflow-hidden rounded-lg border-2 transition-colors',
                    selected ? 'border-primary' : 'border-transparent hover:border-border',
                  )}
                >
                  <img
                    src={asset.src || '/placeholder.svg'}
                    alt={asset.label}
                    className="aspect-video w-full object-cover"
                  />
                  {selected ? (
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  ) : null}
                  <span className="block truncate px-2 py-1.5 text-left text-xs text-muted-foreground">
                    {asset.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </EditorModal>
  )
}
