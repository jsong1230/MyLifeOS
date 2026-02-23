import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { TimeSummaryCard } from '@/components/dashboard/time-summary-card'
import { MoneySummaryCard } from '@/components/dashboard/money-summary-card'
import { HealthSummaryCard } from '@/components/dashboard/health-summary-card'
import { PrivateSummaryCard } from '@/components/dashboard/private-summary-card'

// 메인 대시보드 — 4개 모듈 요약 카드
export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <GreetingHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <TimeSummaryCard />
        <MoneySummaryCard />
        <HealthSummaryCard />
        <PrivateSummaryCard />
      </div>
    </div>
  )
}
