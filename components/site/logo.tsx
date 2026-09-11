import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Star className="size-5 fill-current" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Gig<span className="text-primary">Star</span>
      </span>
    </span>
  )
}
