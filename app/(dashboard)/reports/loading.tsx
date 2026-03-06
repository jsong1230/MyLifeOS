import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* 탭 버튼 */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* 기간 네비게이션 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      {/* 카드 3개 */}
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}
