'use client'

import { FEED_POSTS, type FeedCategory } from '@/lib/home/feed-data'
import { FeedPost } from './feed-post'

// Main social feed — filters the mock posts by the active category using local
// state only.
export function Feed({ category }: { category: FeedCategory }) {
  const posts = FEED_POSTS.filter((p) => p.categories.includes(category))
  return (
    <div className="flex flex-col gap-5">
      {posts.map((p) => (
        <FeedPost key={p.id} post={p} />
      ))}
      {posts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No posts in this category yet.
        </p>
      )}
    </div>
  )
}
