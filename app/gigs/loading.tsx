import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-10 w-3/4 max-w-md" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />

      <Skeleton className="mt-8 h-20 w-full rounded-xl" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
