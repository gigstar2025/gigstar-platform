'use client'

import {
  Blocks,
  Contact,
  Eye,
  LayoutDashboard,
  Settings,
  Share2,
  Type,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorSectionId } from '@/lib/profiles/editor/types'

interface NavItem {
  id: EditorSectionId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'identity', label: 'Identity', icon: UserCircle },
  { id: 'modules', label: 'Modules', icon: Blocks },
  { id: 'content', label: 'Content', icon: Type },
  { id: 'contact', label: 'Contact', icon: Contact },
  { id: 'social', label: 'Social links', icon: Share2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  active: EditorSectionId
  onSelect: (id: EditorSectionId) => void
  completion: number
}

export function EditorSidebar({ active, onSelect, completion }: Props) {
  return (
    <nav aria-label="Editor sections" className="lg:sticky lg:top-4">
      <div className="mb-3 hidden rounded-xl border border-border bg-card p-4 lg:block">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Profile completion</span>
          <span className="font-mono text-primary">{completion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {ITEMS.map((item) => {
          const isActive = item.id === active
          const Icon = item.icon
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
