'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import type { RecurringExpense } from '@/types/recurring'

interface RecurringItemProps {
  expense: RecurringExpense
  onEdit: (expense: RecurringExpense) => void
  onDelete: (id: string) => void
}

// 오늘부터 다음 결제일까지 남은 일수 계산
function calcDaysUntilBilling(billingDay: number): number {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed
  const todayDate = today.getDate()

  // 이번 달의 최대 일수
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
  // 실제 결제일 (해당 월 최대 일수를 초과하지 않도록 조정)
  const effectiveDay = Math.min(billingDay, daysInCurrentMonth)

  let nextBillingDate: Date

  if (effectiveDay >= todayDate) {
    // 이번 달 결제일이 아직 남아 있음
    nextBillingDate = new Date(year, month, effectiveDay)
  } else {
    // 다음 달 결제일로 계산
    const nextMonth = month + 1
    const nextYear = nextMonth > 11 ? year + 1 : year
    const normalizedNextMonth = nextMonth > 11 ? 0 : nextMonth
    const daysInNextMonth = new Date(nextYear, normalizedNextMonth + 1, 0).getDate()
    const nextEffectiveDay = Math.min(billingDay, daysInNextMonth)
    nextBillingDate = new Date(nextYear, normalizedNextMonth, nextEffectiveDay)
  }

  // 오늘 자정 기준 차이 계산
  const todayMidnight = new Date(year, month, todayDate)
  const diffMs = nextBillingDate.getTime() - todayMidnight.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

// D-Day 배지 컴포넌트
function DDayBadge({ daysLeft }: { daysLeft: number }) {
  const t = useTranslations('money.recurring')

  if (daysLeft === 0) {
    return (
      <Badge variant="destructive" className="text-xs shrink-0">
        {t('today')}
      </Badge>
    )
  }

  if (daysLeft <= 7) {
    return (
      <Badge className="text-xs bg-orange-500 hover:bg-orange-500 shrink-0">
        D-{daysLeft}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="text-xs shrink-0">
      D-{daysLeft}
    </Badge>
  )
}

/**
 * 정기 지출 항목 카드 컴포넌트
 * - 이름, 금액, 결제일, 주기 표시
 * - D-Day 배지: 0일 → 빨강 "오늘!", 7일 이내 → 주황, 그 외 → 기본
 * - 수정/삭제 버튼
 */
export function RecurringItem({ expense, onEdit, onDelete }: RecurringItemProps) {
  const t = useTranslations('money.recurring')
  const tc = useTranslations('common')
  const router = useRouter()
  const daysLeft = calcDaysUntilBilling(expense.billing_day)

  function handleRecord() {
    const params = new URLSearchParams({
      action: 'add',
      amount: String(expense.amount),
      currency: expense.currency ?? 'KRW',
      memo: expense.name,
    })
    if (expense.category_id) {
      params.set('category', expense.category_id)
    }
    router.push(`/money/transactions?${params.toString()}`)
  }

  const cycleLabel = t(expense.cycle === 'yearly' ? 'perYear' : 'perMonth')

  return (
    <Card className={expense.is_active ? '' : 'opacity-50'}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          {/* 왼쪽: 이름 + 배지 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{expense.name}</span>
            {expense.is_active && <DDayBadge daysLeft={daysLeft} />}
            {!expense.is_active && (
              <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
                {t('inactive')}
              </Badge>
            )}
          </div>

          {/* 오른쪽: 금액 */}
          <span className="font-semibold text-sm shrink-0">
            {formatCurrency(expense.amount, expense.currency ?? 'KRW')}
          </span>
        </div>

        {/* 결제일 + 주기 정보 */}
        <p className="text-xs text-muted-foreground mt-1">
          {t('billingInfo', { cycle: cycleLabel, day: expense.billing_day })}
        </p>

        {/* 기록/수정/삭제 버튼 */}
        <div className="flex justify-end gap-2 mt-3">
          {expense.is_active && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecord}
              className="text-xs h-7 px-2"
            >
              {t('record')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(expense)}
            className="text-xs h-7 px-2"
          >
            {tc('update')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(expense.id)}
            className="text-xs h-7 px-2 text-destructive hover:text-destructive"
          >
            {tc('delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
