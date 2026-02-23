import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Heart, ChevronRight } from 'lucide-react'

// 건강 모듈 요약 카드 (Phase 1: 빈 상태)
export function HealthSummaryCard() {
  return (
    <Link href="/health" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">건강 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Heart />}
            title="건강 기록을 시작해보세요"
            description="식사, 음주, 수면을 기록하고 건강을 관리하세요"
          />
        </CardContent>
      </Card>
    </Link>
  )
}
