'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecurringExpense } from '@/types/recurring'

interface RecurringSummaryProps {
  expenses: RecurringExpense[]
}

// 원화 금액 포맷
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value))
}

/**
 * 월간 정기 지출 총액 요약 카드
 * - 활성 항목만 합산
 * - monthly: 금액 그대로, yearly: 금액 / 12 (월 환산)
 */
export function RecurringSummary({ expenses }: RecurringSummaryProps) {
  // 활성 항목만 필터링하여 월 환산 총액 계산
  const activeExpenses = expenses.filter((e) => e.is_active)

  const monthlyTotal = activeExpenses.reduce((sum, expense) => {
    if (expense.cycle === 'yearly') {
      // 연간 금액을 월 환산
      return sum + expense.amount / 12
    }
    return sum + expense.amount
  }, 0)

  // 연간 총액 = monthly * 12 + yearly 합산
  const yearlyTotal = activeExpenses.reduce((sum, expense) => {
    return sum + expense.amount
  }, 0)

  const activeCount = activeExpenses.length
  const monthlyCount = activeExpenses.filter((e) => e.cycle === 'monthly').length
  const yearlyCount = activeExpenses.filter((e) => e.cycle === 'yearly').length

  return (
    <div className="space-y-3">
      {/* 월간 정기 지출 총액 카드 */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            월간 정기 지출 총액
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-4">
          <p className="text-2xl font-bold">
            {formatKRW(monthlyTotal)}
            <span className="text-sm font-normal text-muted-foreground ml-1">원/월</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            연간 환산 약 {formatKRW(monthlyTotal * 12)}원
          </p>
        </CardContent>
      </Card>

      {/* 항목 수 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-lg font-semibold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">활성 항목</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-lg font-semibold">{monthlyCount}</p>
            <p className="text-xs text-muted-foreground">매월</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-3 text-center">
            <p className="text-lg font-semibold">{yearlyCount}</p>
            <p className="text-xs text-muted-foreground">매년</p>
          </CardContent>
        </Card>
      </div>

      {/* 연간 총액 */}
      {yearlyCount > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          * 연간 항목 {yearlyCount}건 포함 — 연 총액 {formatKRW(yearlyTotal)}원
        </p>
      )}
    </div>
  )
}
