'use client'

import { useMemo, useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProfileDraft } from '@/lib/profiles/editor/types'
import { draftToProfile } from '@/lib/profiles/editor/draft'
import { ShowcaseHeader } from '@/components/profile/showcase/showcase-header'
import { SectionNav } from '@/components/profile/showcase/section-nav'
import { ShowcaseBody } from '@/components/profile/showcase/showcase-body'

interface Props {
  draft: ProfileDraft
  /** When true, render without the surrounding chrome (used in overlay). */
  bare?: boolean
}

export function PreviewPanel({ draft, bare }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const profile = useMemo(() => draftToProfile(draft), [draft])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Live preview</p>
          <p className="text-xs text-muted-foreground">
            Exactly how the public profile renders your draft.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5" role="group" aria-label="Preview device">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            aria-pressed={device === 'desktop'}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              device === 'desktop' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Monitor className="size-4" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            aria-pressed={device === 'mobile'}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              device === 'mobile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Smartphone className="size-4" /> Mobile
          </button>
        </div>
      </div>

      <div className={cn('flex-1 overflow-y-auto bg-muted/40', bare ? 'p-0' : 'p-4')}>
        <div
          className={cn(
            'mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all',
            device === 'mobile' ? 'max-w-[24rem]' : 'max-w-none',
          )}
        >
          {draft.settings.isPublic ? (
            <>
              <ShowcaseHeader profile={profile} />
              <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
                <SectionNav sections={profile.sections} />
              </div>
              <ShowcaseBody profile={profile} />
            </>
          ) : (
            <div className="grid place-items-center gap-2 p-16 text-center">
              <p className="text-sm font-semibold text-foreground">This profile is set to private</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Visitors would see a not-available message. Turn the profile public in Settings to preview it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
