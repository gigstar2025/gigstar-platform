import { Badge } from '@/components/ui/badge'
import type { EventStatus } from '@/lib/profiles/showcase'

const MAP: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'on-sale': { label: 'On sale', variant: 'secondary' },
  free: { label: 'Free entry', variant: 'default' },
  'selling-fast': { label: 'Selling fast', variant: 'default' },
  'last-tickets': { label: 'Last tickets', variant: 'default' },
  'sold-out': { label: 'Sold out', variant: 'destructive' },
  'coming-soon': { label: 'Coming soon', variant: 'outline' },
}

// TicketStatus — consistent availability badge across every event surface.
export function TicketStatus({ status, className }: { status: EventStatus; className?: string }) {
  const s = MAP[status]
  return (
    <Badge variant={s.variant} className={className}>
      {s.label}
    </Badge>
  )
}
