import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ModuleShell({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)} aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ModuleEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

/** Marks image/media upload areas as not-yet-wired placeholders. */
export function MediaPlaceholder({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/70 bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  )
}
