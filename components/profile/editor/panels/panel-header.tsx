interface Props {
  title: string
  description: string
  action?: React.ReactNode
}

export function PanelHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground text-balance">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
