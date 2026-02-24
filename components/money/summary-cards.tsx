'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  calcTotalsByCurrency,
  convertTotalsToCurrency,
  type CurrencyCode,
} from '@/lib/currency'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import type { Transaction } from '@/types/transaction'

interface SummaryCardsProps {
  transactions: Transaction[]
}

// 지원 기준 통화 목록
const BASE_CURRENCIES: CurrencyCode[] = ['KRW', 'CAD', 'USD']

// 이번달 통화별 수입/지출/잔액 요약 카드
export function SummaryCards({ transactions }: SummaryCardsProps) {
  const td = useTranslations('dashboard')
  const te = useTranslations('exchangeRates')

  // 기준 통화 상태 (null = 환산 미선택)
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode | null>(null)

  const totalsByCurrency = calcTotalsByCurrency(transactions)
  const currencies = Object.keys(totalsByCurrency)

  // 2개 이상 통화가 있을 때만 환율 fetch
  const hasMultipleCurrencies = currencies.length >= 2
  const { data: rates, isLoading: isLoadingRates } = useExchangeRates(hasMultipleCurrencies)

  // 기준 통화 토글 핸들러
  const handleBaseCurrencyToggle = (currency: CurrencyCode) => {
    setBaseCurrency((prev) => (prev === currency ? null : currency))
  }

  // 환산 합계 계산 (baseCurrency 선택 + rates 존재 + 로딩 완료 시)
  const convertedTotals =
    baseCurrency && rates && !isLoadingRates
      ? convertTotalsToCurrency(totalsByCurrency, baseCurrency, rates)
      : null

  return (
    <div className="space-y-3">
      {/* 기준 통화 토글 (2개 이상 통화가 있을 때만 표시) */}
      {hasMultipleCurrencies && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{te('baseCurrency')}:</span>
          {BASE_CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => handleBaseCurrencyToggle(c)}
              className={cn(
                'text-xs px-2 py-0.5 rounded border transition-colors',
                baseCurrency === c
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              )}
            >
              {c}
            </button>
          ))}
          {isLoadingRates && baseCurrency && (
            <span className="text-xs text-muted-foreground">{te('loadingRates')}</span>
          )}
          {rates?.stale && baseCurrency && (
            <span className="text-xs text-yellow-600">{te('staleRate')}</span>
          )}
        </div>
      )}

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
            {/* 환산 합계 */}
            {convertedTotals && baseCurrency && (
              <div className="border-t border-dashed pt-1 mt-1">
                <p className="text-sm text-muted-foreground">
                  {te('approximate', {
                    amount: formatCurrency(convertedTotals.income, baseCurrency),
                  })}
                </p>
              </div>
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
            {/* 환산 합계 */}
            {convertedTotals && baseCurrency && (
              <div className="border-t border-dashed pt-1 mt-1">
                <p className="text-sm text-muted-foreground">
                  {te('approximate', {
                    amount: formatCurrency(convertedTotals.expense, baseCurrency),
                  })}
                </p>
              </div>
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
            {/* 환산 합계 */}
            {convertedTotals && baseCurrency && (
              <div className="border-t border-dashed pt-1 mt-1">
                {(() => {
                  const convertedBalance = convertedTotals.income - convertedTotals.expense
                  const isPositive = convertedBalance >= 0
                  return (
                    <p
                      className={cn(
                        'text-sm',
                        isPositive ? 'text-green-600' : 'text-red-500'
                      )}
                    >
                      {te('approximate', {
                        amount:
                          (isPositive ? '' : '-') +
                          formatCurrency(Math.abs(convertedBalance), baseCurrency),
                      })}
                    </p>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
