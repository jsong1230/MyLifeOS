'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Wallet, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import {
  formatCurrency,
  calcTotalsByCurrency,
  convertTotalsToCurrency,
  type CurrencyCode,
} from '@/lib/currency'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import { useSettingsStore } from '@/store/settings.store'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

// 금전 모듈 요약 카드 — 이번 달 통화별 수입/지출 합계
export function MoneySummaryCard() {
  const t = useTranslations('dashboard')
  const te = useTranslations('exchangeRates')
  const locale = useLocale()
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency) ?? 'KRW'

  const { data, isLoading } = useDashboardSummary()

  const transactions = data?.transactions ?? []
  const hasData = transactions.length > 0
  const totalsByCurrency = calcTotalsByCurrency(transactions)
  const currencies = Object.keys(totalsByCurrency)

  const hasMultipleCurrencies = currencies.length >= 2
  const { data: rates } = useExchangeRates(hasMultipleCurrencies)

  const convertedTotals =
    hasMultipleCurrencies && rates
      ? convertTotalsToCurrency(totalsByCurrency, defaultCurrency as CurrencyCode, rates)
      : null

  return (
    <Link href="/money" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('moneySummary')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : hasData ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
              {currencies.map((currency) => {
                const { income, expense } = totalsByCurrency[currency]
                const balance = income - expense
                return (
                  <div key={currency} className="space-y-1">
                    {currencies.length > 1 && (
                      <p className="text-xs font-semibold text-muted-foreground">{currency}</p>
                    )}
                    {income > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {t('income')} {formatCurrency(income, currency as CurrencyCode)}
                        </span>
                      </div>
                    )}
                    {expense > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">
                          {t('expense')} {formatCurrency(expense, currency as CurrencyCode)}
                        </span>
                      </div>
                    )}
                    <div className="pt-0.5 border-t">
                      <span className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balance >= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(balance), currency as CurrencyCode)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {convertedTotals && rates && (
                <div className="border-t pt-2 mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {te('convertedTotalDesc', { currency: defaultCurrency })}
                    {rates.stale && <span className="ml-1 text-yellow-600">*</span>}
                  </p>
                  {(() => {
                    const convertedBalance = convertedTotals.income - convertedTotals.expense
                    return (
                      <p
                        className={`text-xs text-muted-foreground ${
                          convertedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {te('approximate', {
                          amount:
                            (convertedBalance >= 0 ? '' : '-') +
                            formatCurrency(
                              Math.abs(convertedBalance),
                              defaultCurrency as CurrencyCode
                            ),
                        })}
                      </p>
                    )
                  })()}
                  {currencies
                    .filter((c) => c !== defaultCurrency)
                    .map((fromCurrency) => {
                      const fromRate = rates.rates[fromCurrency]
                      const toRate =
                        defaultCurrency === 'USD' ? 1 : rates.rates[defaultCurrency]
                      if (!fromRate || !toRate) return null
                      const displayRate = toRate / fromRate
                      const rateText =
                        defaultCurrency === 'KRW'
                          ? Math.round(displayRate).toLocaleString(locale)
                          : displayRate.toFixed(4)
                      return (
                        <p key={fromCurrency} className="text-xs text-muted-foreground">
                          {te('rateInfo', {
                            from: fromCurrency,
                            rate: rateText,
                            to: defaultCurrency,
                          })}
                        </p>
                      )
                    })}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Wallet />}
              title={t('noTransactionsYet')}
              description={t('addTransactionDesc')}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
