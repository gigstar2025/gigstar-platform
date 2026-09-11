'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { setDevTown } from '@/app/gigs/actions'

/**
 * Development-only control for simulating a detected town without changing the
 * machine or network location. The parent only renders this outside production,
 * and the underlying server action is also a no-op in production.
 */
export function DevLocationControl({
  towns,
  current,
}: {
  towns: string[]
  current: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function simulate(town: string) {
    startTransition(async () => {
      await setDevTown(town)
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Dev location simulator
            </span>
            <span className="text-xs text-muted-foreground">
              Development only. Simulates automatic detection for testing.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={current ?? ''}
            onValueChange={simulate}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 w-[190px]" aria-label="Simulate detected town">
              <SelectValue placeholder="Pick a town to simulate" />
            </SelectTrigger>
            <SelectContent>
              {towns.map((town) => (
                <SelectItem key={town} value={town}>
                  {town}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {current && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => simulate('')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Clear'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
