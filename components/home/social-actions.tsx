'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
}

// SocialActions — like / comment / share / save. Like and save toggle within
// the page session only; comment and share defer to the parent post.
export function SocialActions({
  likes,
  commentCount,
  shares,
  onToggleComments,
  onToggleShare,
}: {
  likes: number
  commentCount: number
  shares: number
  onToggleComments: () => void
  onToggleShare: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const pill =
    'group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label="Like"
          className={pill}
        >
          <Heart className={cn('size-5 transition-colors', liked && 'fill-primary text-primary')} />
          <span className="tabular-nums">{fmt(likes + (liked ? 1 : 0))}</span>
        </button>
        <button type="button" onClick={onToggleComments} aria-label="Comments" className={pill}>
          <MessageCircle className="size-5" />
          <span className="tabular-nums">{fmt(commentCount)}</span>
        </button>
        <button type="button" onClick={onToggleShare} aria-label="Share" className={pill}>
          <Share2 className="size-5" />
          <span className="tabular-nums">{fmt(shares)}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        aria-label="Save"
        className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bookmark className={cn('size-5 transition-colors', saved && 'fill-foreground text-foreground')} />
      </button>
    </div>
  )
}
