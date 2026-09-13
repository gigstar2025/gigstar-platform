'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Session-only follow toggle (visual demonstration). No persistence.
export function FollowButton({
  size = 'sm',
  className,
}: {
  size?: 'xs' | 'sm' | 'default'
  className?: string
}) {
  const [following, setFollowing] = useState(false)
  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      size={size}
      className={className}
      onClick={() => setFollowing((v) => !v)}
      aria-pressed={following}
    >
      {following ? <Check /> : <Plus />}
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
