'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import type { FeedComment } from '@/lib/home/feed-data'

// CommentPreview — mock comments panel. New comments live in local state for
// the current session only; nothing is stored.
export function CommentPreview({ comments: initial }: { comments: FeedComment[] }) {
  const [comments, setComments] = useState(initial)
  const [text, setText] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setComments((c) => [
      ...c,
      { id: `local-${Date.now()}`, author: 'You', avatar: '/placeholder.svg', text: value, time: 'now' },
    ])
    setText('')
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <img src={c.avatar || '/placeholder.svg'} alt="" className="size-7 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium text-foreground">{c.author}</span>{' '}
              <span className="text-xs text-muted-foreground">{c.time}</span>
            </p>
            <p className="text-sm text-muted-foreground text-pretty">{c.text}</p>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          className="h-9 flex-1 rounded-full border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Post comment"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}
