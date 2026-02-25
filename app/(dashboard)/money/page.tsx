'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SummaryCards } from '@/components/money/summary-cards'
import { useTransactions } from '@/hooks/use-transactions'
import { useBudgets } from '@/hooks/use-budgets'
import { useMonthlyStats } from '@/hooks/use-assets'
import { useSettings } from '@/hooks/use-settings'
import { useSettingsStore } from '@/store/settings.store'
import { cn } from '@/lib/utils'

// YYYY-MM 문자열에서 { year, month } 파싱
function parseMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

// { year, month }를 YYYY-MM 문자열로 변환
function toMonthString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

// 이전/다음 달 이동
function shiftMonth(ym: string, delta: number): string {
  const { year, month } = parseMonth(ym)
  const date = new Date(year, month - 1 + delta, 1)
  return toMonthString(date.getFullYear(), date.getMonth() + 1)
}

// 현재 월을 YYYY-MM 형식으로 반환
function getCurrentMonth(): string {
  const now = new Date()
  return toMonthString(now.getFullYear(), now.getMonth() + 1)
}

// 스켈레톤 카드 컴포넌트
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/40 animate-pulse',
        className
      )}
    />
  )
}

// 차트 컴포넌트 — 초기 번들에서 분리하여 지연 로드
const ExpensePieChart = dynamic(
  () => import('@/components/money/expense-pie-chart').then((m) => ({ default: m.ExpensePieChart })),
  { ssr: false, loading: () => <SkeletonCard className="h-64" /> }
)
const ExpenseBarChart = dynamic(
  () => import('@/components/money/expense-bar-chart').then((m) => ({ default: m.ExpenseBarChart })),
  { ssr: false, loading: () => <SkeletonCard className="h-64" /> }
)
const MonthlyTrendChart = dynamic(
  () => import('@/components/money/monthly-trend-chart').then((m) => ({ default: m.MonthlyTrendChart })),
  { ssr: false, loading: () => <SkeletonCard className="h-64" /> }
)

// 금전 관리 대시보드 페이지 — 수입/지출 요약, 파이차트, 바차트
export default function MoneyPage() {
  const locale = useLocale()
  const t = useTranslations('money.overview')
  useSettings() // Zustand defaultCurrency 동기화
  const currency = useSettingsStore((s) => s.defaultCurrency)
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth)

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useTransactions({ month: currentMonth })

  const {
    data: budgets,
    isLoading: isLoadingBudgets,
    error: budgetsError,
  } = useBudgets(currentMonth)

  const { year, month } = parseMonth(currentMonth)
  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, 1)
  )

  function handlePrevMonth() {
    setCurrentMonth((prev) => shiftMonth(prev, -1))
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => shiftMonth(prev, +1))
  }

  const { data: monthlyStats = [] } = useMonthlyStats(6, currency)

  const isLoading = isLoadingTransactions || isLoadingBudgets
  const hasError = transactionsError ?? budgetsError

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* 월 선택 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            aria-label={t('prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-medium min-w-[110px] text-center">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label={t('nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 에러 상태 */}
      {hasError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('loadError')}
        </div>
      )}

      {/* 요약 카드 — 수입/지출/잔액 */}
      {isLoadingTransactions ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
      ) : (
        <SummaryCards transactions={transactions ?? []} />
      )}

      <Separator />

      {/* 차트 섹션 — 모바일 세로 스택 / 데스크탑 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 비율 파이차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('categoryRatio')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <SkeletonCard className="h-64" />
            ) : (
              <ExpensePieChart transactions={transactions ?? []} />
            )}
          </CardContent>
        </Card>

        {/* 카테고리별 예산 대비 지출 달성률 바차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('budgetVsExpense')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBudgets ? (
              <SkeletonCard className="h-64" />
            ) : (
              <ExpenseBarChart budgets={budgets ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 예산 달성률 범례 안내 */}
      {!isLoading && (budgets?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
            {t('legendGood')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
            {t('legendCaution')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
            {t('legendExceeded')}
          </span>
        </div>
      )}

      {/* 월별 수입/지출 추이 차트 — F-22 */}
      <Separator />
      <MonthlyTrendChart data={monthlyStats} />
    </div>
  )
}
