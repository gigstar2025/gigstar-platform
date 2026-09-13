'use client'

import { cn } from '@/lib/utils'
import { CATEGORIES, type FeedCategory } from '@/lib/home/feed-data'

// CategoryFilter — working visual filters driven by local state. `bar` is a
// horizontal chip row (mobile/tablet); `rail` is the vertical desktop nav.
export function CategoryNav({
  value,
  onChange,
  variant,
}: {
  value: FeedCategory
  onChange: (c: FeedCategory) => void
  variant: 'bar' | 'rail'
}) {
  if (variant === 'rail') {
    return (
      <nav className="flex flex-col gap-1" aria-label="Discovery categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-current={value === c.key}
            className={cn(
              'rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              value === c.key
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {c.label}
          </button>
        ))}
      </nav>
    )
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Discovery categories"
    >
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          role="tab"
          onClick={() => onChange(c.key)}
          aria-selected={value === c.key}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            value === c.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
