import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Wallet, ChevronRight } from 'lucide-react'

// 금전 모듈 요약 카드 (Phase 1: 빈 상태)
export function MoneySummaryCard() {
  return (
    <Link href="/money" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">금전 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Wallet />}
            title="이번 달 지출 기록이 없어요"
            description="지출을 기록하고 예산을 관리해보세요"
          />
        </CardContent>
      </Card>
    </Link>
  )
}
