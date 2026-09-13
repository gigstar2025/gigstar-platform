'use client'

import { useState } from 'react'
import { Home, Compass, PlusSquare, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'create', label: 'Create', icon: PlusSquare },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
  { key: 'profile', label: 'Profile', icon: User },
]

// Prototype mobile bottom navigation — visual controls only at this stage.
export function MobileBottomNav() {
  const [active, setActive] = useState('home')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              aria-current={isActive}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[0.65rem] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5', item.key === 'create' && 'size-6')} />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
