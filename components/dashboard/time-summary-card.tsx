import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Clock, ListTodo, ChevronRight } from 'lucide-react'

// 시간 모듈 요약 카드 (Phase 1: 빈 상태)
export function TimeSummaryCard() {
  return (
    <Link href="/time" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">시간 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<ListTodo />}
            title="할일이 아직 없어요"
            description="할일을 추가하고 하루를 관리해보세요"
          />
        </CardContent>
      </Card>
    </Link>
  )
}
