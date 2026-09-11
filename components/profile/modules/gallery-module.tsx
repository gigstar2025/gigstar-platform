import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { ModuleShell, ModuleEmptyState } from '@/components/profile/module-shell'
import type { GalleryModule as GalleryModuleType } from '@/lib/profiles/types'

export function GalleryModule({ module }: { module: GalleryModuleType }) {
  return (
    <ModuleShell
      title={module.title}
      icon={<ImageIcon className="size-5 text-primary" aria-hidden="true" />}
    >
      {module.photos.length === 0 ? (
        <ModuleEmptyState message="No photos yet. Add band, venue or event photography to build your gallery." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {module.photos.map((photo) => (
            <li key={photo.id}>
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted">
                  {photo.src ? (
                    <Image
                      src={photo.src || '/placeholder.svg'}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-7" aria-hidden="true" />
                    </span>
                  )}
                </div>
                {photo.caption && (
                  <figcaption className="text-xs text-muted-foreground">{photo.caption}</figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </ModuleShell>
  )
}
