'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import type { Transaction } from '@/types/transaction'

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 금전 모듈 요약 카드 — 이번 달 통화별 수입/지출 합계
export function MoneySummaryCard() {
  const month = getCurrentMonth()
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const te = useTranslations('exchangeRates')

  // 설정에서 기본 통화 가져오기 (없으면 KRW)
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency) ?? 'KRW'

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', month],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?month=${month}`)
      const json = await res.json() as { success: boolean; data: Transaction[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 조회 실패')
      return json.data
    },
  })

  const hasData = (transactions?.length ?? 0) > 0
  const totalsByCurrency = calcTotalsByCurrency(transactions ?? [])
  const currencies = Object.keys(totalsByCurrency)

  // 2개 이상 통화가 있을 때만 환율 fetch
  const hasMultipleCurrencies = currencies.length >= 2
  const { data: rates } = useExchangeRates(hasMultipleCurrencies)

  // 환산 합계 계산 (2개 이상 통화 + rates 존재 시)
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
            <p className="text-xs text-muted-foreground">{commonT('loading')}</p>
          ) : hasData ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
              {/* 통화별 수입/지출 표시 */}
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
              {/* 환산 합계 섹션 (2개 이상 통화 + rates 있을 때) */}
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
                  {/* 환율 정보 (USD 기준으로 표시) */}
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
                          ? Math.round(displayRate).toLocaleString('ko-KR')
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
