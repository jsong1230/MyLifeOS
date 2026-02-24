'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import type { Transaction } from '@/types/transaction'

interface SummaryCardsProps {
  transactions: Transaction[]
}

// 이번달 수입/지출/잔액 요약 카드 3개
export function SummaryCards({ transactions }: SummaryCardsProps) {
  const t = useTranslations('money.transactions')
  const td = useTranslations('dashboard')
  // 수입 합계
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  // 지출 합계
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // 잔액 = 수입 - 지출
  const balance = totalIncome - totalExpense
  const isPositiveBalance = balance >= 0

  // 카드 데이터 타입 명시로 prefix 접근 타입 오류 방지
  interface CardItem {
    label: string
    value: string
    valueClass: string
    bgClass: string
    prefix: string
  }

  const cards: CardItem[] = [
    {
      label: td('income'),
      value: formatCurrency(totalIncome, 'KRW'),
      valueClass: 'text-blue-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20',
      prefix: '',
    },
    {
      label: td('expense'),
      value: formatCurrency(totalExpense, 'KRW'),
      valueClass: 'text-red-500',
      bgClass: 'bg-red-50 dark:bg-red-950/20',
      prefix: '',
    },
    {
      label: td('balance'),
      value: formatCurrency(Math.abs(balance), 'KRW'),
      // 잔액 양수=초록, 음수=빨강, 음수면 앞에 '-' 표시
      valueClass: isPositiveBalance ? 'text-green-600' : 'text-red-500',
      bgClass: isPositiveBalance
        ? 'bg-green-50 dark:bg-green-950/20'
        : 'bg-red-50 dark:bg-red-950/20',
      prefix: isPositiveBalance ? '' : '-',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, valueClass, bgClass, prefix }) => (
        <Card key={label} className={cn('border-0 shadow-sm', bgClass)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold tracking-tight', valueClass)}>
              {prefix}{value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
