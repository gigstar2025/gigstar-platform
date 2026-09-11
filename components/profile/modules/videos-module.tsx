import Image from 'next/image'
import { Video, Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleShell, ModuleEmptyState } from '@/components/profile/module-shell'
import type { VideosModule as VideosModuleType } from '@/lib/profiles/types'

export function VideosModule({ module }: { module: VideosModuleType }) {
  return (
    <ModuleShell title={module.title} icon={<Video className="size-5 text-primary" aria-hidden="true" />}>
      {module.items.length === 0 ? (
        <ModuleEmptyState message="No videos added yet. Link a YouTube or Vimeo clip to feature it here." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {module.items.map((video) => (
            <li
              key={video.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-primary/50"
            >
              <a
                href={video.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-video overflow-hidden bg-muted"
              >
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail || '/placeholder.svg'}
                    alt={`Watch ${video.title}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <Video className="size-8" aria-hidden="true" />
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-background/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Play className="size-6 fill-current" aria-hidden="true" />
                  </span>
                </span>
              </a>
              <div className="flex flex-col gap-1.5 p-4">
                {video.provider && (
                  <Badge variant="secondary" className="w-fit capitalize">
                    {video.provider}
                  </Badge>
                )}
                <h3 className="font-semibold text-foreground">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                )}
                {video.embedUrl && (
                  <Button
                    nativeButton={false}
                    render={<a href={video.embedUrl} target="_blank" rel="noopener noreferrer" />}
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-fit"
                  >
                    Watch video
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModuleShell>
  )
}
