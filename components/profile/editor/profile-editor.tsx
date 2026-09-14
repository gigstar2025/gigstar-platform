'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, Eye, Info, Loader2, RotateCcw, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type {
  EditorSectionId,
  ManagedProfile,
  SectionKey,
  ShowcaseProfile,
} from '@/lib/profiles/editor/types'
import { getShowcaseProfile } from '@/lib/profiles/showcase'
import { computeCompletion } from '@/lib/profiles/editor/completion'
import { validateIdentity } from '@/lib/profiles/editor/validation'
import { isStorageAvailable } from '@/lib/profiles/editor/draft'
import { useProfileDraft } from './use-profile-draft'
import { EditorSidebar } from './editor-sidebar'
import { ManagedProfileSelector } from './managed-profile-selector'
import { EditorModal } from './editor-modal'
import { OverviewPanel } from './panels/overview-panel'
import { IdentityPanel } from './panels/identity-panel'
import { ModulesPanel } from './panels/modules-panel'
import { ContentPanel } from './panels/content-panel'
import { ContactPanel } from './panels/contact-panel'
import { SocialPanel } from './panels/social-panel'
import { SettingsPanel } from './panels/settings-panel'
import { PreviewPanel } from './panels/preview-panel'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  profiles: ManagedProfile[]
  initialProfile: ShowcaseProfile
}

export function ProfileEditor({ profiles, initialProfile }: Props) {
  const [profile, setProfile] = useState<ShowcaseProfile>(initialProfile)

  // Keying by profile.id resets all draft/editor state cleanly on switch.
  return (
    <EditorInner
      key={profile.id}
      profile={profile}
      profiles={profiles}
      onSwitchProfile={setProfile}
    />
  )
}

function EditorInner({
  profile,
  profiles,
  onSwitchProfile,
}: {
  profile: ShowcaseProfile
  profiles: ManagedProfile[]
  onSwitchProfile: (p: ShowcaseProfile) => void
}) {
  const { draft, dirty, savedAt, update, save, discard, resetToExample } = useProfileDraft(profile)

  const [section, setSection] = useState<EditorSectionId>('overview')
  const [focusModule, setFocusModule] = useState<SectionKey | null>(null)
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [pendingProfile, setPendingProfile] = useState<ManagedProfile | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [storageWarned, setStorageWarned] = useState(false)

  const errors = useMemo(() => validateIdentity(draft), [draft])
  const completion = useMemo(() => computeCompletion(draft), [draft])

  useEffect(() => {
    if (!isStorageAvailable()) setStorageWarned(true)
  }, [])

  // Warn before unloading with unsaved changes.
  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  const handleSave = useCallback(() => {
    setSaveState('saving')
    setTimeout(() => {
      const ok = save()
      setSaveState(ok ? 'saved' : 'error')
      setTimeout(() => setSaveState('idle'), 2200)
    }, 250)
  }, [save])

  const navigate = useCallback((s: EditorSectionId) => {
    setSection(s)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const editModule = useCallback((key: SectionKey) => {
    setFocusModule(key)
    setSection('content')
  }, [])

  const doSwitch = useCallback(
    (next: ManagedProfile) => {
      const full = getShowcaseProfile(next.slug)
      if (full) onSwitchProfile(full)
      setPendingProfile(null)
    },
    [onSwitchProfile],
  )

  const requestSwitch = useCallback(
    (next: ManagedProfile) => {
      if (dirty) setPendingProfile(next)
      else doSwitch(next)
    },
    [dirty, doSwitch],
  )

  return (
    <div className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ManagedProfileSelector
            profiles={profiles}
            selectedId={draft.profileId}
            isPublic={draft.settings.isPublic}
            onSelect={requestSwitch}
          />
          <SaveStatus dirty={dirty} savedAt={savedAt} saveState={saveState} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/p/${draft.slug}`} target="_blank" />}>
            <ExternalLink className="size-4" /> View public profile
          </Button>
          <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setShowPreviewOverlay(true)}>
            <Eye className="size-4" /> Preview
          </Button>
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={discard}>
              <RotateCcw className="size-4" /> Discard
            </Button>
          ) : null}
          <Button size="sm" onClick={handleSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save draft
          </Button>
        </div>
      </div>

      {storageWarned ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <Info className="size-4 shrink-0" />
          Local storage is unavailable, so drafts can&apos;t be saved on this device. You can still edit and preview.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,34rem)_minmax(0,1fr)]">
        <div>
          <EditorSidebar active={section} onSelect={navigate} completion={completion.percent} />
        </div>

        <div className="min-w-0">
          {section === 'overview' ? (
            <OverviewPanel draft={draft} completion={completion} onNavigate={navigate} />
          ) : null}
          {section === 'identity' ? <IdentityPanel draft={draft} errors={errors} update={update} /> : null}
          {section === 'modules' ? <ModulesPanel draft={draft} update={update} onEditModule={editModule} /> : null}
          {section === 'content' ? (
            <ContentPanel
              draft={draft}
              update={update}
              focusModule={focusModule}
              onFocusHandled={() => setFocusModule(null)}
            />
          ) : null}
          {section === 'contact' ? <ContactPanel draft={draft} errors={errors} update={update} /> : null}
          {section === 'social' ? <SocialPanel draft={draft} errors={errors} update={update} /> : null}
          {section === 'settings' ? (
            <SettingsPanel draft={draft} update={update} onResetToExample={() => setResetOpen(true)} />
          ) : null}
          {section === 'preview' ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-border bg-card xl:hidden">
                <div className="h-[70dvh]">
                  <PreviewPanel draft={draft} />
                </div>
              </div>
              <div className="hidden rounded-2xl border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground xl:block">
                The live preview is always visible in the panel on the right.
              </div>
            </>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-6 h-[calc(100dvh-3.5rem)] overflow-hidden rounded-2xl border border-border bg-card">
            <PreviewPanel draft={draft} />
          </div>
        </div>
      </div>

      <EditorModal
        open={showPreviewOverlay}
        onClose={() => setShowPreviewOverlay(false)}
        title="Live preview"
        description="How your draft appears on the public profile."
        size="xl"
      >
        <div className="h-[75dvh] overflow-hidden rounded-xl border border-border">
          <PreviewPanel draft={draft} bare />
        </div>
      </EditorModal>

      <EditorModal
        open={Boolean(pendingProfile)}
        onClose={() => setPendingProfile(null)}
        title="Unsaved changes"
        description={`You have unsaved edits to ${draft.base.displayName}.`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingProfile(null)}>
              Keep editing
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                save()
                if (pendingProfile) doSwitch(pendingProfile)
              }}
            >
              <Save className="size-4" /> Save &amp; switch
            </Button>
            <Button onClick={() => pendingProfile && doSwitch(pendingProfile)}>Switch anyway</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Save your draft to this device first, or switch anyway and return to it later this session.
        </p>
      </EditorModal>

      <EditorModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset to original example?"
        description="This discards all local edits for this profile and restores the original example content."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                resetToExample()
                setResetOpen(false)
                navigate('overview')
              }}
            >
              <RotateCcw className="size-4" /> Reset profile
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This cannot be undone.</p>
      </EditorModal>
    </div>
  )
}

function SaveStatus({ dirty, savedAt, saveState }: { dirty: boolean; savedAt: string | null; saveState: SaveState }) {
  let text = 'All changes saved'
  if (saveState === 'saving') text = 'Saving…'
  else if (saveState === 'saved') text = 'Draft saved'
  else if (saveState === 'error') text = 'Could not save'
  else if (dirty) text = 'Unsaved changes'
  else if (!savedAt) text = 'No local draft yet'

  const tone =
    saveState === 'error'
      ? 'text-destructive'
      : dirty && saveState === 'idle'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone)}>
      {saveState === 'saved' ? <Check className="size-3.5" /> : null}
      {text}
    </span>
  )
}
