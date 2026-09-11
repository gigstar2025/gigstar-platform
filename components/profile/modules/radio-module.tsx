import { Radio, CalendarClock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleShell, ModuleEmptyState } from '@/components/profile/module-shell'
import type { RadioModule as RadioModuleType } from '@/lib/profiles/types'

export function RadioModule({ module }: { module: RadioModuleType }) {
  const { radio } = module
  const configured = radio.showTitle || radio.stationName || radio.streamUrl

  return (
    <ModuleShell title={module.title} icon={<Radio className="size-5 text-primary" aria-hidden="true" />}>
      {!configured ? (
        <ModuleEmptyState message="No radio show set up yet." />
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className={
                  radio.onAir
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-destructive'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
                }
              >
                {radio.onAir && (
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                  </span>
                )}
                {radio.onAir ? 'On Air' : 'Off Air'}
              </span>
              {radio.stationName && (
                <span className="text-sm text-muted-foreground">{radio.stationName}</span>
              )}
            </div>
            {radio.showTitle && (
              <h3 className="text-balance text-lg font-semibold text-foreground">{radio.showTitle}</h3>
            )}
            {radio.schedule && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {radio.schedule}
              </p>
            )}
          </div>
          {radio.streamUrl && (
            <Button
              nativeButton={false}
              render={<a href={radio.streamUrl} target="_blank" rel="noopener noreferrer" />}
              size="lg"
              className="shrink-0"
            >
              Listen live
              <ExternalLink className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </ModuleShell>
  )
}
