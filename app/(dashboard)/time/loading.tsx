import { Skeleton } from '@/components/ui/skeleton'

export default function TimeLoading() {
  return (
    <div className="relative min-h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
