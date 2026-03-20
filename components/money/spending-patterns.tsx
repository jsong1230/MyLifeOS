'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyCompact, formatCurrency, type CurrencyCode } from '@/lib/currency'
import type { PatternsData } from '@/app/api/money/stats/patterns/route'

interface SpendingPatternsProps {
  data: PatternsData
}

export function SpendingPatterns({ data }: SpendingPatternsProps) {
  const t = useTranslations('moneyStats')
  const locale = useLocale()

  const { by_weekday, top_categories, monthly_comparison } = data

  // 요일별 차트: 통화별로 분리하여 첫 번째(또는 주 통화) 렌더
  const currencies = [...new Set(by_weekday.map((d) => d.currency))].sort()
  const weekdayNames = t.raw('weekdays') as string[]

  return (
    <div className="space-y-6">
      {/* ── 요일별 평균 지출 ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('by_weekday')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {by_weekday.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">{t('no_data')}</p>
          ) : (
            <div className="space-y-4">
              {currencies.map((currency) => {
                const currencyData = by_weekday
                  .filter((d) => d.currency === currency)
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((d) => ({
                    name: weekdayNames[d.weekday] ?? String(d.weekday),
                    amount: d.avg_amount,
                  }))

                return (
                  <div key={currency}>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">{currency}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={currencyData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                          tickFormatter={(v: number) =>
                            formatCurrencyCompact(v, currency as CurrencyCode, locale)
                          }
                        />
                        <Tooltip
                          formatter={(value: unknown) => [
                            typeof value === 'number'
                              ? formatCurrency(value, currency as CurrencyCode)
                              : '-',
                            t('by_weekday'),
                          ]}
                        />
                        <Bar
                          dataKey="amount"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── TOP 5 카테고리 ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('top_categories')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top_categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">{t('no_data')}</p>
          ) : (
            <div className="space-y-4">
              {/* 통화별로 TOP5 그룹 표시 */}
              {[...new Set(top_categories.map((c) => c.currency))].sort().map((currency) => {
                const items = top_categories.filter((c) => c.currency === currency)
                return (
                  <div key={currency} className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">{currency}</p>
                    {items.map((item, idx) => (
                      <div key={`${item.category_name}-${currency}`} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs w-4 text-right">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{item.category_name}</span>
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(item.total, currency as CurrencyCode)}
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${Math.max(item.percentage, 2)}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-muted-foreground">
                          {item.percentage}%
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 전월 대비 ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('monthly_comparison')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthly_comparison.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">{t('no_data')}</p>
          ) : (
            <div className="space-y-4">
              {monthly_comparison.map((entry) => {
                const isIncrease = entry.change_pct > 0
                const isDecrease = entry.change_pct < 0
                const isNeutral = entry.change_pct === 0

                return (
                  <div
                    key={entry.currency}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        {entry.currency}
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {formatCurrency(entry.current_month, entry.currency as CurrencyCode)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t('monthly_comparison')}:{' '}
                        {formatCurrency(entry.prev_month, entry.currency as CurrencyCode)}
                      </p>
                    </div>
                    <div
                      className={[
                        'flex items-center gap-1 text-sm font-semibold',
                        isIncrease ? 'text-red-500' : isDecrease ? 'text-emerald-500' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {isIncrease && <TrendingUp className="h-4 w-4" />}
                      {isDecrease && <TrendingDown className="h-4 w-4" />}
                      {isNeutral && <Minus className="h-4 w-4" />}
                      <span>
                        {isIncrease ? '+' : ''}
                        {entry.change_pct}%
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {isIncrease ? t('increase') : isDecrease ? t('decrease') : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
