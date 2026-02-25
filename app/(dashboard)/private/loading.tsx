import { Skeleton } from '@/components/ui/skeleton'

export default function PrivateLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  )
}
