'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BudgetProgress } from '@/components/money/budget-progress'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { BudgetStatus, Budget } from '@/types/budget'

interface BudgetListProps {
  budgets: BudgetStatus[]
  month: string
  onMonthChange: (month: string) => void
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

/**
 * 예산 목록 컴포넌트
 * - 월 선택 헤더 (이전/다음 달 이동)
 * - 총 예산 / 총 지출 / 잔여 요약 카드
 * - 각 예산 항목에 BudgetProgress 사용
 * - 예산 추가 버튼
 */
export function BudgetList({
  budgets,
  month,
  onMonthChange,
  onEdit,
  onDelete,
  onAdd,
}: BudgetListProps) {
  const t = useTranslations('money.budget')
  const tCommon = useTranslations('common')
  const tFilter = useTranslations('money.transactions.filter')
  const locale = useLocale()

  // month(YYYY-MM)를 로케일 기반 표시용 문자열로 변환
  function formatMonthLabel(yearMonth: string): string {
    const [year, mon] = yearMonth.split('-').map(Number)
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
      new Date(year, mon - 1, 1)
    )
  }

  // 이전/다음 달 계산
  function getAdjacentMonth(direction: 'prev' | 'next'): string {
    const [year, mon] = month.split('-').map(Number)
    let newYear = year
    let newMonth = direction === 'prev' ? mon - 1 : mon + 1

    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    } else if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }

    return `${newYear}-${String(newMonth).padStart(2, '0')}`
  }

  // 요약 합계 계산
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <div className="space-y-4">
      {/* 월 선택 헤더 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(getAdjacentMonth('prev'))}
          aria-label={tFilter('prevMonth')}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">{formatMonthLabel(month)}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(getAdjacentMonth('next'))}
          aria-label={tFilter('nextMonth')}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {t('total')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p className="text-sm font-semibold">{formatCurrency(totalBudget, 'KRW')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {t('totalSpent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p className="text-sm font-semibold">{formatCurrency(totalSpent, 'KRW')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {t('totalRemaining')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <p
              className={`text-sm font-semibold ${
                totalRemaining < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(totalRemaining, 'KRW')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 예산 항목 목록 */}
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {t('noData')}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {t('noDataHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardContent className="pt-4 pb-4">
                <BudgetProgress budget={budget} />
                {/* 수정/삭제 버튼 */}
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(budget)}
                    className="text-xs h-7 px-2"
                  >
                    {tCommon('edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(budget.id)}
                    className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 예산 추가 버튼 */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={onAdd}
      >
        <PlusIcon className="size-4" />
        {t('add')}
      </Button>
    </div>
  )
}
