import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { BookOpen, ChevronRight } from 'lucide-react'

// 사적 기록 요약 카드 (Phase 1: 빈 상태)
export function PrivateSummaryCard() {
  return (
    <Link href="/private" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">사적 기록</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BookOpen />}
            title="아직 일기가 없어요"
            description="오늘의 감정과 이야기를 기록해보세요"
          />
        </CardContent>
      </Card>
    </Link>
  )
}
