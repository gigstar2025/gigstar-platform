import Image from 'next/image'
import { Disc3, Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleShell, ModuleEmptyState } from '@/components/profile/module-shell'
import type { MixesModule as MixesModuleType } from '@/lib/profiles/types'

export function MixesModule({ module }: { module: MixesModuleType }) {
  return (
    <ModuleShell title={module.title} icon={<Disc3 className="size-5 text-primary" aria-hidden="true" />}>
      {module.items.length === 0 ? (
        <ModuleEmptyState message="No mixes added yet. Link a SoundCloud or Mixcloud set to get started." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {module.items.map((mix) => (
            <li
              key={mix.id}
              className="flex gap-4 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {mix.artwork ? (
                  <Image
                    src={mix.artwork || '/placeholder.svg'}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <Disc3 className="size-7" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                {mix.provider && (
                  <Badge variant="secondary" className="w-fit capitalize">
                    {mix.provider}
                  </Badge>
                )}
                <h3 className="truncate font-semibold text-foreground">{mix.title}</h3>
                {mix.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{mix.description}</p>
                )}
                {mix.embedUrl && (
                  <Button
                    nativeButton={false}
                    render={<a href={mix.embedUrl} target="_blank" rel="noopener noreferrer" />}
                    variant="secondary"
                    size="sm"
                    className="mt-auto w-fit"
                  >
                    <Play className="size-3.5" aria-hidden="true" />
                    Play mix
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
