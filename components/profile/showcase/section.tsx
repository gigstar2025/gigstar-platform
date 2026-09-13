import type { ReactNode } from "react"
import { cn } from "cn"

export function ShowcaseSection({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  id: string
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
