'use client'

// ---------------------------------------------------------------------------
// DB-backed modular profile editor (PR-5b).
//
// This is the persisted replacement for the localStorage showcase editor. It
// operates directly on `profile_modules` for a real profile:
//   * loads draft content via the secured editor RPC (server component passes
//     it in as `initialModules`),
//   * edits audio / videos / radio / gigs content in place,
//   * saves each module's draft through `saveModuleDraftAction` (validated +
//     ownership-enforced in the SECURITY DEFINER RPC),
//   * publishes all drafts through `publishModulesAction`, which snapshots a
//     revision and revalidates the public page so changes appear immediately.
//
// Only modules eligible for the profile's type are offered (type eligibility
// enforced both here and in the database). Gallery/photo uploads are out of
// scope until Storage lands (PR-5c), so the gallery module is surfaced as
// "coming soon" rather than edited here.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  ExternalLink,
  ImageIcon,
  Loader2,
  Rocket,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  MODULE_REGISTRY,
  modulesForProfileType,
  type ModuleKey,
  type ProfileType,
} from '@/lib/profiles/modules/registry'
import { validateModuleContent, type ValidationError } from '@/lib/profiles/modules/content'
import { moduleToRenderModule } from '@/lib/profiles/modules/render-adapter'
import { saveModuleDraftAction, publishModulesAction } from '@/lib/profiles/modules/actions'
import { ModuleView } from '@/components/profile/module-view'
import {
  AudioForm,
  GigsForm,
  RadioForm,
  VideosForm,
  emptyContentFor,
} from './module-content-forms'

/** Client-facing shape mirroring persistence.EditorModule (server-only file). */
export interface InitialEditorModule {
  key: ModuleKey
  position: number
  isHidden: boolean
  draftContent: unknown
  publishedContent: unknown
  updatedAt: string | null
}

interface Props {
  profileId: string
  slug: string
  displayName: string
  profileType: ProfileType
  initialModules: InitialEditorModule[]
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ModuleState {
  enabled: boolean
  isHidden: boolean
  content: unknown
  /** Serialized snapshot of the last successful save, for dirty detection. */
  savedSerialized: string | null
  saveState: SaveState
  errors: ValidationError[]
}

function serialize(content: unknown, isHidden: boolean): string {
  return JSON.stringify({ content, isHidden })
}

export function DbModuleEditor({
  profileId,
  slug,
  displayName,
  profileType,
  initialModules,
}: Props) {
  const router = useRouter()
  const eligibleKeys = useMemo(() => modulesForProfileType(profileType), [profileType])

  const [modules, setModules] = useState<Record<string, ModuleState>>(() => {
    const initial: Record<string, ModuleState> = {}
    for (const key of eligibleKeys) {
      const existing = initialModules.find((m) => m.key === key)
      const hasDraft = existing?.draftContent != null
      const content = hasDraft ? existing.draftContent : emptyContentFor(key)
      initial[key] = {
        enabled: hasDraft,
        isHidden: existing?.isHidden ?? false,
        content,
        savedSerialized: hasDraft ? serialize(content, existing.isHidden) : null,
        saveState: 'idle',
        errors: [],
      }
    }
    return initial
  })

  const [publishState, setPublishState] = useState<SaveState>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [isPublishing, startPublish] = useTransition()

  const patch = useCallback((key: ModuleKey, next: Partial<ModuleState>) => {
    setModules((prev) => ({ ...prev, [key]: { ...prev[key], ...next } }))
  }, [])

  const setContent = useCallback(
    (key: ModuleKey, content: unknown) => {
      patch(key, { content, saveState: 'idle', errors: [] })
    },
    [patch],
  )

  const saveModule = useCallback(
    async (key: ModuleKey) => {
      const state = modules[key]
      const validation = validateModuleContent(key, state.content)
      if (!validation.ok) {
        patch(key, { saveState: 'error', errors: validation.errors })
        return
      }
      patch(key, { saveState: 'saving', errors: [] })
      const result = await saveModuleDraftAction({
        profileId,
        key,
        content: validation.value,
        position: MODULE_REGISTRY[key].defaultPosition,
        isHidden: state.isHidden,
      })
      if (result.ok) {
        patch(key, {
          saveState: 'saved',
          enabled: true,
          savedSerialized: serialize(state.content, state.isHidden),
          errors: [],
        })
        setTimeout(() => patch(key, { saveState: 'idle' }), 2200)
      } else {
        patch(key, { saveState: 'error', errors: result.errors })
      }
    },
    [modules, patch, profileId],
  )

  const publishAll = useCallback(() => {
    setPublishError(null)
    setPublishState('saving')
    startPublish(async () => {
      const result = await publishModulesAction({ profileId, slug })
      if (result.ok) {
        setPublishState('saved')
        router.refresh()
        setTimeout(() => setPublishState('idle'), 2600)
      } else {
        setPublishState('error')
        setPublishError(result.error)
      }
    })
  }, [profileId, slug, router])

  const renderPreview = useMemo(() => {
    return eligibleKeys
      .filter((key) => modules[key].enabled && !modules[key].isHidden)
      .map((key) => moduleToRenderModule(key, modules[key].content, { id: `preview_${key}` }))
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [eligibleKeys, modules])

  const anyDirty = eligibleKeys.some((key) => {
    const s = modules[key]
    return s.enabled && s.savedSerialized !== serialize(s.content, s.isHidden)
  })

  return (
    <div className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Editing {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Save each section as a draft, then publish to make changes live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/p/${slug}`} target="_blank" />}
          >
            <ExternalLink className="size-4" aria-hidden="true" /> View public profile
          </Button>
          <PublishStatus state={publishState} error={publishError} dirty={anyDirty} />
          <Button size="sm" onClick={publishAll} disabled={isPublishing || publishState === 'saving'}>
            {publishState === 'saving' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Rocket className="size-4" aria-hidden="true" />
            )}
            Publish changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
        <div className="flex flex-col gap-5">
          {eligibleKeys.map((key) => (
            <ModuleCard
              key={key}
              moduleKey={key}
              state={modules[key]}
              onToggleEnabled={(enabled) => patch(key, { enabled })}
              onToggleHidden={(isHidden) => patch(key, { isHidden, saveState: 'idle' })}
              onChangeContent={(content) => setContent(key, content)}
              onSave={() => saveModule(key)}
            />
          ))}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Live preview</h2>
              <p className="text-xs text-muted-foreground">Draft content, before publishing.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {renderPreview.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Enable and fill in a module to see it here.
                </p>
              ) : (
                <div className="flex flex-col gap-10">
                  {renderPreview.map((module) => (
                    <ModuleView key={module.id} module={module} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ModuleCard({
  moduleKey,
  state,
  onToggleEnabled,
  onToggleHidden,
  onChangeContent,
  onSave,
}: {
  moduleKey: ModuleKey
  state: ModuleState
  onToggleEnabled: (enabled: boolean) => void
  onToggleHidden: (isHidden: boolean) => void
  onChangeContent: (content: unknown) => void
  onSave: () => void
}) {
  const def = MODULE_REGISTRY[moduleKey]
  const isGallery = moduleKey === 'gallery'

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold text-foreground">{def.label}</h2>
          <p className="text-sm text-muted-foreground">{def.description}</p>
        </div>
        {!isGallery ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={`enable-${moduleKey}`} className="text-xs text-muted-foreground">
              {state.enabled ? 'On' : 'Off'}
            </Label>
            <Switch
              id={`enable-${moduleKey}`}
              checked={state.enabled}
              onCheckedChange={onToggleEnabled}
            />
          </div>
        ) : null}
      </div>

      {isGallery ? (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
          Photo galleries need image uploads, which are coming in a later update.
        </p>
      ) : state.enabled ? (
        <>
          <ModuleForm moduleKey={moduleKey} content={state.content} onChange={onChangeContent} />

          {state.errors.length > 0 ? (
            <ul className="flex flex-col gap-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.errors.slice(0, 5).map((e, i) => (
                <li key={`${e.path}-${i}`} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="font-mono text-xs">{e.path}</span> — {e.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={state.isHidden}
                onCheckedChange={onToggleHidden}
                aria-label="Hide this module from the public profile"
              />
              Hidden from public profile
            </label>
            <div className="flex items-center gap-2">
              <SaveIndicator state={state.saveState} />
              <Button size="sm" variant="outline" onClick={onSave} disabled={state.saveState === 'saving'}>
                {state.saveState === 'saving' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                Save draft
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

function ModuleForm({
  moduleKey,
  content,
  onChange,
}: {
  moduleKey: ModuleKey
  content: unknown
  onChange: (content: unknown) => void
}) {
  switch (moduleKey) {
    case 'audio':
      return <AudioForm content={content as never} onChange={onChange} />
    case 'videos':
      return <VideosForm content={content as never} onChange={onChange} />
    case 'radio':
      return <RadioForm content={content as never} onChange={onChange} />
    case 'gigs':
      return <GigsForm content={content as never} onChange={onChange} />
    case 'gallery':
      return null
  }
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <Check className="size-3.5" aria-hidden="true" /> Draft saved
      </span>
    )
  }
  if (state === 'error') {
    return <span className="text-xs font-medium text-destructive">Check the fields above</span>
  }
  return null
}

function PublishStatus({
  state,
  error,
  dirty,
}: {
  state: SaveState
  error: string | null
  dirty: boolean
}) {
  let text = ''
  let tone = 'text-muted-foreground'
  if (state === 'saving') text = 'Publishing…'
  else if (state === 'saved') {
    text = 'Published'
    tone = 'text-primary'
  } else if (state === 'error') {
    text = error ?? 'Could not publish'
    tone = 'text-destructive'
  } else if (dirty) {
    text = 'Unsaved drafts'
    tone = 'text-amber-600 dark:text-amber-400'
  }
  if (!text) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone)}>
      {state === 'saved' ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {text}
    </span>
  )
}
