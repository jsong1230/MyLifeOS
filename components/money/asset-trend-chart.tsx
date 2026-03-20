'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import type { AssetMonthlyTotal } from '@/types/asset'

interface AssetTrendChartProps {
  data: AssetMonthlyTotal[]
  currency?: CurrencyCode
}

export function AssetTrendChart({ data, currency = 'KRW' }: AssetTrendChartProps) {
  const t = useTranslations('money.assets')
  const tc = useTranslations('money.charts')
  const locale = useLocale()

  // 로케일 기반 월 표시 (ko: "1월", en: "Jan")
  function formatMonth(month: string): string {
    const date = new Date(month + '-01T00:00:00')
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short' }).format(date)
  }

  // 금액 축 포맷 (KRW+한국어: 만/억, 그 외: K/M)
  function formatYAxis(value: number): string {
    if (currency === 'KRW' && locale === 'ko') {
      if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}${tc('unitEok')}`
      if (value >= 10_000) return `${Math.floor(value / 10_000)}${tc('unitMan')}`
      return `${value}`
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
    if (value >= 1_000) return `${Math.floor(value / 1_000)}K`
    return `${value}`
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t('noTrend')}
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    total: d.total,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('trendTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              formatter={(value: unknown) => [
                typeof value === 'number' ? formatCurrency(value, currency) : '-',
                t('totalAssets'),
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
