'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency, calcTotalsByCurrency, type CurrencyCode } from '@/lib/currency'
import type { Transaction } from '@/types/transaction'

interface SummaryCardsProps {
  transactions: Transaction[]
}

// 이번달 통화별 수입/지출/잔액 요약 카드
export function SummaryCards({ transactions }: SummaryCardsProps) {
  const td = useTranslations('dashboard')

  const totalsByCurrency = calcTotalsByCurrency(transactions)
  const currencies = Object.keys(totalsByCurrency)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 수입 카드 */}
      <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {td('income')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {currencies.map((currency) => {
            const { income } = totalsByCurrency[currency]
            if (income === 0) return null
            return (
              <p key={currency} className="text-xl font-bold tracking-tight text-blue-600">
                {formatCurrency(income, currency as CurrencyCode)}
              </p>
            )
          })}
          {currencies.every((c) => totalsByCurrency[c].income === 0) && (
            <p className="text-xl font-bold tracking-tight text-blue-600">
              {formatCurrency(0, (currencies[0] ?? 'KRW') as CurrencyCode)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 지출 카드 */}
      <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {td('expense')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {currencies.map((currency) => {
            const { expense } = totalsByCurrency[currency]
            if (expense === 0) return null
            return (
              <p key={currency} className="text-xl font-bold tracking-tight text-red-500">
                {formatCurrency(expense, currency as CurrencyCode)}
              </p>
            )
          })}
          {currencies.every((c) => totalsByCurrency[c].expense === 0) && (
            <p className="text-xl font-bold tracking-tight text-red-500">
              {formatCurrency(0, (currencies[0] ?? 'KRW') as CurrencyCode)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 잔액 카드 */}
      <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {td('balance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {currencies.map((currency) => {
            const { income, expense } = totalsByCurrency[currency]
            const balance = income - expense
            const isPositive = balance >= 0
            return (
              <p
                key={currency}
                className={cn(
                  'text-xl font-bold tracking-tight',
                  isPositive ? 'text-green-600' : 'text-red-500'
                )}
              >
                {!isPositive && '-'}
                {formatCurrency(Math.abs(balance), currency as CurrencyCode)}
              </p>
            )
          })}
          {currencies.length === 0 && (
            <p className="text-xl font-bold tracking-tight text-green-600">
              {formatCurrency(0, 'KRW')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
