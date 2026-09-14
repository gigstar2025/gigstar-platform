'use client'

import { useMemo } from 'react'
import { useDiscovery } from './discovery-context'
import { feedPostsNear } from '@/lib/home/derive'
import { FeedPost } from './feed-post'

const MAX_POSTS = 20

// Main social feed — driven entirely by the shared discovery state. Posts are
// filtered by live distance from the selected location, then by the active
// category and search term.
export function Feed() {
  const { center, radius, category, search, areaLabel } = useDiscovery()

  const posts = useMemo(
    () => feedPostsNear(center, radius, category, search),
    [center, radius, category, search],
  )
  const shown = posts.slice(0, MAX_POSTS)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Latest near {areaLabel}</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {shown.map((p) => (
        <FeedPost key={p.id} post={p} />
      ))}

      {posts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No posts {radius === Number.POSITIVE_INFINITY ? 'in this category' : `near ${areaLabel} yet`}. Try widening the
          radius or clearing filters.
        </p>
      )}
    </div>
  )
}
