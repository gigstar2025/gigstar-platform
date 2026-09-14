'use client'

import { useEffect, useRef } from 'react'
import { Blocks } from 'lucide-react'
import type { ProfileDraft, SectionKey, ShowcaseProfile } from '@/lib/profiles/editor/types'
import { MODULE_REGISTRY, moduleLabel } from '@/lib/profiles/editor/module-registry'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { PanelHeader } from './panel-header'
import {
  AboutEditor,
  AudioEditor,
  EventsEditor,
  FactsEditor,
  FeaturedEventEditor,
  GalleryEditor,
  MailingListEditor,
  MenuEditor,
  PartnersEditor,
  RelatedEditor,
  ReleasesEditor,
  ReviewsEditor,
  SpacesEditor,
  TechnicalEditor,
  VideosEditor,
} from '../content-editors'

interface Props {
  draft: ProfileDraft
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
  focusModule: SectionKey | null
  onFocusHandled: () => void
}

/** Modules that have a dedicated content editor (contact lives in its panel). */
const CONTENT_MODULES: SectionKey[] = [
  'about',
  'facts',
  'featured-event',
  'events',
  'past-events',
  'releases',
  'audio',
  'videos',
  'gallery',
  'spaces',
  'menu',
  'technical',
  'reviews',
  'partners',
  'mailing-list',
  'related',
]

export function ContentPanel({ draft, update, focusModule, onFocusHandled }: Props) {
  // Editable content follows module order; only enabled modules with a content
  // editor appear here.
  const enabledKeys = draft.modules
    .filter((m) => m.enabled)
    .map((m) => m.key)
    .filter((k) => CONTENT_MODULES.includes(k))

  const openValue = useRef<string | undefined>(focusModule ?? enabledKeys[0])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focusModule) return
    const el = containerRef.current?.querySelector(`[data-module="${focusModule}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onFocusHandled()
  }, [focusModule, onFocusHandled])

  const set = (recipe: (d: ShowcaseProfile) => ShowcaseProfile) =>
    update((d) => ({ ...d, base: recipe(d.base) }))

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Content"
        description="Fill in the content for each active module. Add, remove and reorder items within a module; changes appear live in the preview."
      />

      {enabledKeys.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          <Blocks className="size-5" /> No editable modules are active. Add modules from the Modules tab.
        </p>
      ) : (
        <div ref={containerRef}>
          <Accordion multiple defaultValue={[openValue.current ?? enabledKeys[0]]} className="flex flex-col gap-3">
            {enabledKeys.map((key) => (
              <AccordionItem
                key={key}
                value={key}
                data-module={key}
                className="rounded-xl border border-border bg-card px-4"
              >
                <AccordionTrigger className="text-sm font-semibold">
                  {moduleLabel(key, draft.type)}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ModuleEditor moduleKey={key} base={draft.base} set={set} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

function ModuleEditor({
  moduleKey,
  base,
  set,
}: {
  moduleKey: SectionKey
  base: ShowcaseProfile
  set: (recipe: (d: ShowcaseProfile) => ShowcaseProfile) => void
}) {
  const def = MODULE_REGISTRY[moduleKey]
  const note = <p className="mb-3 text-xs text-muted-foreground">{def.example}</p>
  switch (moduleKey) {
    case 'about':
      return <>{note}<AboutEditor base={base} set={set} /></>
    case 'facts':
      return <>{note}<FactsEditor base={base} set={set} /></>
    case 'featured-event':
      return <>{note}<FeaturedEventEditor base={base} set={set} /></>
    case 'events':
      return <>{note}<EventsEditor base={base} set={set} field="events" /></>
    case 'past-events':
      return <>{note}<EventsEditor base={base} set={set} field="pastEvents" /></>
    case 'releases':
      return <>{note}<ReleasesEditor base={base} set={set} /></>
    case 'audio':
      return <>{note}<AudioEditor base={base} set={set} /></>
    case 'videos':
      return <>{note}<VideosEditor base={base} set={set} /></>
    case 'gallery':
      return <>{note}<GalleryEditor base={base} set={set} /></>
    case 'spaces':
      return <>{note}<SpacesEditor base={base} set={set} /></>
    case 'menu':
      return <>{note}<MenuEditor base={base} set={set} /></>
    case 'technical':
      return <>{note}<TechnicalEditor base={base} set={set} /></>
    case 'reviews':
      return <>{note}<ReviewsEditor base={base} set={set} /></>
    case 'partners':
      return <>{note}<PartnersEditor base={base} set={set} /></>
    case 'mailing-list':
      return <>{note}<MailingListEditor base={base} set={set} /></>
    case 'related':
      return <>{note}<RelatedEditor base={base} set={set} /></>
    default:
      return null
  }
}
