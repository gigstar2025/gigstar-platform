'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Disc3,
  Video,
  Radio,
  ImageIcon,
  CalendarDays,
  GripVertical,
  Pencil,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ModuleView } from '@/components/profile/module-view'
import {
  createEmptyModule,
  MODULE_META,
  type ModuleType,
  type Profile,
  type ProfileModule,
} from '@/lib/profiles/types'

const MODULE_ICONS: Record<ModuleType, typeof Disc3> = {
  mixes: Disc3,
  videos: Video,
  radio: Radio,
  gallery: ImageIcon,
  gigs: CalendarDays,
}

const MODULE_ORDER: ModuleType[] = ['mixes', 'videos', 'radio', 'gallery', 'gigs']

let idCounter = 0
function nextId() {
  idCounter += 1
  return `m_new_${Date.now()}_${idCounter}`
}

export function ProfileEditor({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')

  function updateIdentity(patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'location'>>) {
    setProfile((p) => ({ ...p, ...patch }))
  }

  function addModule(type: ModuleType) {
    setProfile((p) => ({
      ...p,
      modules: [...p.modules, createEmptyModule(type, nextId())],
    }))
  }

  function removeModule(id: string) {
    setProfile((p) => ({ ...p, modules: p.modules.filter((m) => m.id !== id) }))
  }

  function toggleHidden(id: string) {
    setProfile((p) => ({
      ...p,
      modules: p.modules.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m)),
    }))
  }

  function updateTitle(id: string, title: string) {
    setProfile((p) => ({
      ...p,
      modules: p.modules.map((m) => (m.id === id ? { ...m, title } : m)),
    }))
  }

  function moveModule(index: number, dir: -1 | 1) {
    setProfile((p) => {
      const target = index + dir
      if (target < 0 || target >= p.modules.length) return p
      const modules = [...p.modules]
      ;[modules[index], modules[target]] = [modules[target], modules[index]]
      return { ...p, modules }
    })
  }

  const visibleModules = profile.modules.filter((m) => !m.hidden)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            nativeButton={false}
            render={<Link href={`/profile/${profile.slug}`} />}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to profile
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Draft — not saved
          </Badge>
          <Button size="sm" disabled title="Saving requires the database, coming soon">
            Save changes
          </Button>
        </div>
      </div>

      {/* Mobile edit/preview toggle */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-card p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView('edit')}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
            mobileView === 'edit'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={mobileView === 'edit'}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
            mobileView === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={mobileView === 'preview'}
        >
          <Eye className="size-4" aria-hidden="true" />
          Preview
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Editor column */}
        <div className={cn('flex-col gap-6', mobileView === 'edit' ? 'flex' : 'hidden', 'lg:flex')}>
          {/* Identity */}
          <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Profile details</h2>
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => updateIdentity({ displayName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => updateIdentity({ location: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={(e) => updateIdentity({ bio: e.target.value })}
              />
            </div>
          </section>

          {/* Modules manager */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-foreground">Modules</h2>
              <span className="text-sm text-muted-foreground">({profile.modules.length})</span>
            </div>

            {profile.modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
                No modules yet. Add one below to start building your profile.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.modules.map((module, index) => (
                  <ModuleEditorCard
                    key={module.id}
                    module={module}
                    index={index}
                    total={profile.modules.length}
                    onMove={moveModule}
                    onToggleHidden={toggleHidden}
                    onRemove={removeModule}
                    onTitleChange={updateTitle}
                  />
                ))}
              </ul>
            )}

            {/* Add module */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">Add a module</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Modules are optional and reusable — add as many as you need, in any order.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MODULE_ORDER.map((type) => {
                  const Icon = MODULE_ICONS[type]
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addModule(type)}
                      className="flex flex-col items-start gap-1 rounded-lg border border-border/70 bg-background p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <Icon className="size-4 text-primary" aria-hidden="true" />
                        {MODULE_META[type].label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {MODULE_META[type].description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Preview column */}
        <div className={cn(mobileView === 'preview' ? 'block' : 'hidden', 'lg:block')}>
          <div className="lg:sticky lg:top-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="size-4" aria-hidden="true" />
              Live preview
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
              <ProfileHeader profile={profile} />
              <div className="mt-8 flex flex-col gap-10">
                {visibleModules.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
                    All modules are hidden. Toggle one on to see it here.
                  </p>
                ) : (
                  visibleModules.map((module) => <ModuleView key={module.id} module={module} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleEditorCard({
  module,
  index,
  total,
  onMove,
  onToggleHidden,
  onRemove,
  onTitleChange,
}: {
  module: ProfileModule
  index: number
  total: number
  onMove: (index: number, dir: -1 | 1) => void
  onToggleHidden: (id: string) => void
  onRemove: (id: string) => void
  onTitleChange: (id: string, title: string) => void
}) {
  const Icon = MODULE_ICONS[module.type]
  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-4 transition-opacity',
        module.hidden ? 'border-border/50 opacity-60' : 'border-border/70',
      )}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <Input
            aria-label={`${MODULE_META[module.type].label} module title`}
            value={module.title}
            onChange={(e) => onTitleChange(module.id, e.target.value)}
            className="h-8 border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
          />
          <span className="text-xs text-muted-foreground">{MODULE_META[module.type].label}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            aria-label="Move module up"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            aria-label="Move module down"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            {module.hidden ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{module.hidden ? 'Hidden' : 'Visible'}</span>
            <Switch
              checked={!module.hidden}
              onCheckedChange={() => onToggleHidden(module.id)}
              aria-label={module.hidden ? 'Show module' : 'Hide module'}
            />
          </label>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(module.id)}
            aria-label="Remove module"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  )
}
